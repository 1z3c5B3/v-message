import { useState } from 'react';

interface HiddenContentProps {
  children: React.ReactNode;
  reason?: string;
}

export function HiddenContent({ children, reason = 'Скрытый контент' }: HiddenContentProps) {
  const [revealed, setRevealed] = useState(false);

  if (revealed) {
    return <>{children}</>;
  }

  return (
    <div
      className="hidden-content"
      onClick={() => setRevealed(true)}
      title="Нажмите чтобы показать"
    >
      <div className="hidden-blur">
        <span className="hidden-icon">👁️</span>
        <span className="hidden-text">{reason}</span>
        <span className="hidden-hint">(нажмите)</span>
      </div>
    </div>
  );
}
