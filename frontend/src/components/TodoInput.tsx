import { useState } from "react";

interface TodoInputProps {
  onAdd: (title: string) => void;
}

export default function TodoInput({ onAdd }: TodoInputProps) {
  const [title, setTitle] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setTitle("");
  }

  return (
    <form onSubmit={handleSubmit} className="todo-input">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a new todo..."
        autoFocus
      />
      <button type="submit">＋</button>
    </form>
  );
}
