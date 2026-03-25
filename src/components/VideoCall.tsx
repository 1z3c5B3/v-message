import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import {
  doc, setDoc, onSnapshot, collection, addDoc, deleteDoc, getDocs, updateDoc,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

const STUN = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

interface Props {
  callId: string;
  isCaller: boolean;
  contactName: string;
  onEnd: () => void;
}

export default function VideoCall({ callId, isCaller, contactName, onEnd }: Props) {
  const { profile } = useAuth();
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "error">("connecting");
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);

  useEffect(() => { start(); return cleanup; }, []);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (localRef.current) localRef.current.srcObject = stream;

      const pc = new RTCPeerConnection(STUN);
      pcRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      pc.ontrack = (e) => {
        if (remoteRef.current) remoteRef.current.srcObject = e.streams[0];
        setStatus("connected");
      };

      const callRef = doc(db, "calls", callId);
      const offerCands = collection(callRef, "offerCandidates");
      const answerCands = collection(callRef, "answerCandidates");

      if (isCaller) {
        pc.onicecandidate = (e) => { if (e.candidate) addDoc(offerCands, e.candidate.toJSON()); };
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await updateDoc(callRef, { offer: { type: offer.type, sdp: offer.sdp } });
        onSnapshot(callRef, (snap) => {
          const d = snap.data();
          if (!pc.currentRemoteDescription && d?.answer) {
            pc.setRemoteDescription(new RTCSessionDescription(d.answer));
          }
          if (d?.status === "declined") { cleanup(); onEnd(); }
        });
        onSnapshot(answerCands, (snap) => {
          snap.docChanges().forEach((c) => {
            if (c.type === "added") pc.addIceCandidate(new RTCIceCandidate(c.doc.data()));
          });
        });
      } else {
        pc.onicecandidate = (e) => { if (e.candidate) addDoc(answerCands, e.candidate.toJSON()); };
        await new Promise<void>((res) => {
          const u = onSnapshot(callRef, async (snap) => {
            const d = snap.data();
            if (d?.offer && !pc.currentRemoteDescription) {
              await pc.setRemoteDescription(new RTCSessionDescription(d.offer));
              u(); res();
            }
          });
        });
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await updateDoc(callRef, { answer: { type: answer.type, sdp: answer.sdp }, status: "active" });
        onSnapshot(offerCands, (snap) => {
          snap.docChanges().forEach((c) => {
            if (c.type === "added") pc.addIceCandidate(new RTCIceCandidate(c.doc.data()));
          });
        });
      }
    } catch { setStatus("error"); }
  };

  const cleanup = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
  };

  const endCall = async () => {
    cleanup();
    try {
      const callRef = doc(db, "calls", callId);
      (await getDocs(collection(callRef, "offerCandidates"))).forEach((d) => deleteDoc(d.ref));
      (await getDocs(collection(callRef, "answerCandidates"))).forEach((d) => deleteDoc(d.ref));
      await deleteDoc(callRef);
    } catch {}
    onEnd();
  };

  const toggleMute = () => {
    const t = streamRef.current?.getAudioTracks()[0];
    if (t) { t.enabled = !t.enabled; setMuted(!muted); }
  };
  const toggleCam = () => {
    const t = streamRef.current?.getVideoTracks()[0];
    if (t) { t.enabled = !t.enabled; setCamOff(!camOff); }
  };

  return (
    <div className="video-call-overlay">
      <video ref={remoteRef} autoPlay playsInline className="video-remote" />
      <video ref={localRef} autoPlay playsInline muted className="video-local" />
      {status === "connecting" && (
        <>
          <div className="call-status-text">{isCaller ? "Вызов..." : "Подключение..."}</div>
          <div className="call-contact-name">{contactName}</div>
        </>
      )}
      {status === "error" && <div className="call-status-text">Ошибка доступа к камере</div>}
      <div className="video-controls">
        <button className="btn-mute" onClick={toggleMute}>{muted ? "🔇" : "🎤"}</button>
        <button className="btn-end-call" onClick={endCall}>📵</button>
        <button className="btn-cam" onClick={toggleCam}>{camOff ? "🚫" : "📷"}</button>
      </div>
    </div>
  );
}
