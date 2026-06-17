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
import type { Todo } from "../types";
import TodoItem from "./TodoItem";

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: number, completed: boolean) => void;
  onUpdate: (id: number, title: string) => void;
  onDelete: (id: number) => void;
  onReorder: (ids: number[]) => void;
}

export default function TodoList({ todos, onToggle, onUpdate, onDelete, onReorder }: TodoListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = todos.findIndex((t) => t.id === active.id);
    const newIndex = todos.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(todos, oldIndex, newIndex);
    onReorder(reordered.map((t) => t.id));
  }

  if (todos.length === 0) {
    return <p className="empty-state">No todos yet. Add one above!</p>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={todos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="todo-list-wrapper">
          <ul className="todo-list">
            {todos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={onToggle}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))}
          </ul>
          <p className="todo-count">{todos.length} item{todos.length !== 1 ? "s" : ""}</p>
        </div>
      </SortableContext>
    </DndContext>
  );
}
