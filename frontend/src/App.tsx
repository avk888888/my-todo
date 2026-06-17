import { useState, useEffect, useCallback } from "react";
import type { Todo, Note } from "./types";
import { fetchTodos, createTodo, updateTodo, deleteTodo, reorderTodos } from "./api/todos";
import { fetchNotes, createNote, updateNote, deleteNote, reorderNotes } from "./api/notes";
import TodoInput from "./components/TodoInput";
import TodoList from "./components/TodoList";
import NoteInput from "./components/NoteInput";
import NoteList from "./components/NoteList";
import "./App.css";

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
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

  const loadNotes = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchNotes();
      setNotes(data);
    } catch {
      setError("Failed to load notes.");
    }
  }, []);

  useEffect(() => { loadTodos(); loadNotes(); }, [loadTodos, loadNotes]);

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

  async function handleAddNote(title: string) {
    try {
      setError(null);
      await createNote({ title });
      await loadNotes();
    } catch {
      setError("Failed to add note");
    }
  }

  async function handleUpdateNote(id: number, title: string, content: string) {
    try {
      setError(null);
      await updateNote(id, { title, content });
      await loadNotes();
    } catch {
      setError("Failed to update note");
    }
  }

  async function handleDeleteNote(id: number) {
    try {
      setError(null);
      await deleteNote(id);
      await loadNotes();
    } catch {
      setError("Failed to delete note");
    }
  }

  async function handleReorderTodos(ids: number[]) {
    try {
      setError(null);
      await reorderTodos(ids);
      await loadTodos();
    } catch {
      setError("Failed to reorder todos");
    }
  }

  async function handleReorderNotes(ids: number[]) {
    try {
      setError(null);
      await reorderNotes(ids);
      await loadNotes();
    } catch {
      setError("Failed to reorder notes");
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
        onReorder={handleReorderTodos}
      />
      <hr className="divider" />
      <h2 className="notes-heading">📝 記事本</h2>
      <NoteInput onAdd={handleAddNote} />
      <NoteList
        notes={notes}
        onUpdate={handleUpdateNote}
        onDelete={handleDeleteNote}
        onReorder={handleReorderNotes}
      />
    </div>
  );
}
