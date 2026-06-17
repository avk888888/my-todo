import { useState, useEffect, useCallback } from "react";
import type { Todo } from "./types";
import { fetchTodos, createTodo, updateTodo, deleteTodo } from "./api/todos";
import TodoInput from "./components/TodoInput";
import TodoList from "./components/TodoList";
import "./App.css";

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadTodos = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchTodos();
      setTodos(data);
    } catch {
      setError("Failed to load todos. Is the backend running?");
    }
  }, []);

  useEffect(() => { loadTodos(); }, [loadTodos]);

  async function handleAdd(title: string) {
    try {
      setError(null);
      await createTodo({ title });
      await loadTodos();
    } catch {
      setError("Failed to add todo");
    }
  }

  async function handleToggle(id: number, completed: boolean) {
    try {
      setError(null);
      await updateTodo(id, { completed });
      await loadTodos();
    } catch {
      setError("Failed to update todo");
    }
  }

  async function handleUpdate(id: number, title: string) {
    try {
      setError(null);
      await updateTodo(id, { title });
      await loadTodos();
    } catch {
      setError("Failed to update todo");
    }
  }

  async function handleDelete(id: number) {
    try {
      setError(null);
      await deleteTodo(id);
      await loadTodos();
    } catch {
      setError("Failed to delete todo");
    }
  }

  return (
    <div className="app">
      <h1>React Todo List</h1>
      {error && <p className="error">{error}</p>}
      <TodoInput onAdd={handleAdd} />
      <TodoList
        todos={todos}
        onToggle={handleToggle}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
