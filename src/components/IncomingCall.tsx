import { db } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";

interface Props {
  callerName: string;
  callId: string;
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingCall({ callerName, callId, onAccept, onDecline }: Props) {
  const accept = async () => {
    await updateDoc(doc(db, "calls", callId), { status: "accepted" });
    onAccept();
  };

  const decline = async () => {
    await deleteDoc(doc(db, "calls", callId));
    onDecline();
  };

  return (
    <div className="incoming-call-overlay">
      <div className="incoming-call-card">
        <div className="incoming-avatar">📹</div>
        <div className="incoming-name">{callerName}</div>
        <div className="incoming-label">Входящий видеозвонок</div>
        <div className="incoming-btns">
          <button className="btn-decline" onClick={decline}>📵</button>
          <button className="btn-accept" onClick={accept}>📹</button>
        </div>
      </div>
    </div>
  );
}
