import { useState } from "react";

interface NoteInputProps {
  onAdd: (title: string) => void;
}

export default function NoteInput({ onAdd }: NoteInputProps) {
  const [title, setTitle] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setTitle("");
  }

  return (
    <form onSubmit={handleSubmit} className="note-input">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="新增記事..."
        autoFocus
      />
      <button type="submit">＋</button>
    </form>
  );
}
