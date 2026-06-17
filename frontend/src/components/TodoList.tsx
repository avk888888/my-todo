import type { Todo } from "../types";
import TodoItem from "./TodoItem";

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: number, completed: boolean) => void;
  onUpdate: (id: number, title: string) => void;
  onDelete: (id: number) => void;
}

export default function TodoList({ todos, onToggle, onUpdate, onDelete }: TodoListProps) {
  if (todos.length === 0) {
    return <p className="empty-state">No todos yet. Add one above!</p>;
  }

  return (
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
  );
}
