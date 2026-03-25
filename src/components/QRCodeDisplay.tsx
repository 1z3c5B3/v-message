import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function QRCodeDisplay({ value, size = 200 }: { value: string; size?: number }) {
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`);
  }, [value, size]);

  return (
    <div className="qr-code-container">
      {qrUrl && (
        <img
          src={qrUrl}
          alt="QR Code"
          className="qr-code-image"
          width={size}
          height={size}
        />
      )}
    </div>
  );
}

export function useQRCode() {
  const { profile } = useAuth();
  
  const getProfileQR = () => {
    if (!profile) return '';
    return `vmsg://user/${profile.uid}`;
  };
  
  const getAddQR = () => {
    if (!profile) return '';
    return `vmsg://add/${profile.username}`;
  };
  
  return { getProfileQR, getAddQR };
}
