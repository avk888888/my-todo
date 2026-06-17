import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Todo } from "../types";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number, completed: boolean) => void;
  onUpdate: (id: number, title: string) => void;
  onDelete: (id: number) => void;
}

export default function TodoItem({ todo, onToggle, onUpdate, onDelete }: TodoItemProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  function handleSave() {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== todo.title) {
      onUpdate(todo.id, trimmed);
    }
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setEditTitle(todo.title);
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <li className="todo-item editing" ref={setNodeRef} style={style}>
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      </li>
    );
  }

  return (
    <li
      className={`todo-item ${todo.completed ? "completed" : ""} ${isDragging ? "dragging" : ""}`}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={(e) => {
          e.stopPropagation();
          onToggle(todo.id, e.target.checked);
        }}
        onClick={(e) => e.stopPropagation()}
      />
      <span className="todo-title">{todo.title}</span>
      <button
        className="btn-edit"
        onClick={(e) => {
          e.stopPropagation();
          setEditTitle(todo.title);
          setEditing(true);
        }}
      >
        ✏️
      </button>
      <button
        className="btn-delete"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(todo.id);
        }}
      >
        🗑️
      </button>
    </li>
  );
}
