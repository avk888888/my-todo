import type { Note } from "../types";
import NoteItem from "./NoteItem";

interface NoteListProps {
  notes: Note[];
  onUpdate: (id: number, title: string, content: string) => void;
  onDelete: (id: number) => void;
}

export default function NoteList({ notes, onUpdate, onDelete }: NoteListProps) {
  if (notes.length === 0) {
    return <p className="empty-state">還沒有記事。新增一則吧！</p>;
  }

  return (
    <div className="note-list-wrapper">
      <ul className="note-list">
        {notes.map((note) => (
          <NoteItem
            key={note.id}
            note={note}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
      </ul>
      <p className="note-count">{notes.length} 則記事</p>
    </div>
  );
}
