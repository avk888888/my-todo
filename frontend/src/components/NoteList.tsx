import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  sortableKeyboardCoordinates,
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import type { Note } from "../types";
import NoteItem from "./NoteItem";

interface NoteListProps {
  notes: Note[];
  onUpdate: (id: number, title: string, content: string) => void;
  onDelete: (id: number) => void;
  onReorder: (ids: number[]) => void;
}

export default function NoteList({ notes, onUpdate, onDelete, onReorder }: NoteListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = notes.findIndex((n) => n.id === active.id);
    const newIndex = notes.findIndex((n) => n.id === over.id);
    const reordered = arrayMove(notes, oldIndex, newIndex);
    onReorder(reordered.map((n) => n.id));
  }

  if (notes.length === 0) {
    return <p className="empty-state">還沒有記事。新增一則吧！</p>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={notes.map((n) => n.id)} strategy={verticalListSortingStrategy}>
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
      </SortableContext>
    </DndContext>
  );
}
