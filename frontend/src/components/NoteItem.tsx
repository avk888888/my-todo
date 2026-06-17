import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Note } from "../types";

interface NoteItemProps {
  note: Note;
  onUpdate: (id: number, title: string, content: string) => void;
  onDelete: (id: number) => void;
}

export default function NoteItem({ note, onUpdate, onDelete }: NoteItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title);
  const [editContent, setEditContent] = useState(note.content);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  function handleSave() {
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) return;
    if (trimmedTitle !== note.title || editContent !== note.content) {
      onUpdate(note.id, trimmedTitle, editContent);
    }
    setExpanded(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && e.metaKey) handleSave();
    if (e.key === "Escape") {
      setEditTitle(note.title);
      setEditContent(note.content);
      setExpanded(false);
    }
  }

  const preview = note.content.length > 60
    ? note.content.slice(0, 60) + "..."
    : note.content;

  const timeDisplay = new Date(note.updated_at + "Z").toLocaleString("zh-TW", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (expanded) {
    return (
      <li className="note-item expanded" ref={setNodeRef} style={style}>
        <input
          type="text"
          className="note-edit-title"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="標題"
          autoFocus
        />
        <textarea
          className="note-edit-content"
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          placeholder="內容..."
          rows={3}
        />
        <div className="note-edit-actions">
          <button
            className="btn-save"
            onClick={(e) => { e.stopPropagation(); handleSave(); }}
          >
            儲存
          </button>
        </div>
      </li>
    );
  }

  return (
    <li
      className={`note-item ${isDragging ? "dragging" : ""}`}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <div className="note-header" onClick={() => !isDragging && setExpanded(true)}>
        <span className="note-title">📝 {note.title}</span>
        <span className="note-time">{timeDisplay}</span>
      </div>
      {preview && <p className="note-preview">{preview}</p>}
      <button
        className="btn-delete"
        onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
        title="刪除"
      >
        🗑️
      </button>
    </li>
  );
}
