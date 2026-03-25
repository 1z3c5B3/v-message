import { useState } from "react";

const PACKS: Record<string, string[]> = {
  "😀 Эмоции": ["😀","😂","🥰","😎","🤔","😭","😡","🤯","🥳","😴","🤗","😏","🙄","😤","🥺","😈","👻","💀","🤡","🎃"],
  "❤️ Символы": ["❤️","🔥","💯","✨","🎉","🎊","💪","👍","👎","🙏","💫","⭐","🌟","💥","💢","💤","💬","👀","🎯","🏆"],
  "🐶 Животные": ["🐶","🐱","🐻","🦊","🐼","🐨","🐯","🦁","🐸","🐧","🦆","🐥","🦄","🐉","🦋","🐢","🐬","🦈","🦅","🐙"],
  "🍕 Еда": ["🍕","🍔","🌮","🍜","🍣","🍦","🎂","🍓","🍩","🍪","🍫","🧃","☕","🍵","🧋","🥤","🍺","🍷","🥂","🍾"],
  "🎮 Прочее": ["🎮","🎸","🎭","🎨","🏆","🎯","⚽","🏀","🎲","🎪","🚀","✈️","🚗","⚡","🌈","🌙","☀️","🌊","🏔️","🌺"],
};

interface Props {
  onSend: (sticker: string) => void;
  onClose: () => void;
}

export default function StickerPicker({ onSend, onClose }: Props) {
  const [pack, setPack] = useState(Object.keys(PACKS)[0]);

  return (
    <div className="sticker-picker">
      <div className="sticker-tabs">
        {Object.keys(PACKS).map((name) => (
          <button key={name} className={`sticker-tab ${pack === name ? "active" : ""}`}
            onClick={() => setPack(name)}>
            {name.split(" ")[0]}
          </button>
        ))}
        <button className="sticker-close" onClick={onClose}>✕</button>
      </div>
      <div className="sticker-grid">
        {PACKS[pack].map((s) => (
          <button key={s} className="sticker-btn" onClick={() => onSend(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
