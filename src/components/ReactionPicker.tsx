import { useState } from "react";

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function ReactionPicker({ onSelect, onClose }: ReactionPickerProps) {
  return (
    <div className="reaction-picker" onClick={(e) => e.stopPropagation()}>
      <div className="reaction-list">
        {REACTIONS.map((emoji) => (
          <button
            key={emoji}
            className="reaction-btn"
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
