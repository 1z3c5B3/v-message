import { useState, useRef, TouchEvent } from 'react';

interface SwipeableProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Swipeable({ onSwipeLeft, onSwipeRight, children, className }: SwipeableProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const onTouchMove = (e: TouchEvent) => {
    const currentY = e.targetTouches[0].clientY;
    
    // Если свайп вертикальный - игнорируем
    if (touchStartY.current && Math.abs(currentY - touchStartY.current) > 10) {
      return;
    }
    
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    }
    
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }
  };

  return (
    <div
      className={className}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {children}
    </div>
  );
}
