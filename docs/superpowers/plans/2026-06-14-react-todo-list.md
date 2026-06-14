# React Todo List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack todo list with React + TypeScript frontend and FastAPI + SQLite backend.

**Architecture:** Monorepo with `frontend/` (Vite dev server on port 5173) and `backend/` (FastAPI on port 8000). Frontend proxies `/api` to backend in dev mode. REST API for CRUD operations.

**Tech Stack:** FastAPI, SQLite (aiosqlite/uvicorn), React 18, Vite, TypeScript

---

### Task 1: Backend — Database Layer

**Files:**
- Create: `backend/database.py`

- [ ] **Step 1: Write the database module**

```python
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "todos.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            completed INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)
    conn.commit()
    conn.close()
```

- [ ] **Step 2: Commit**

```bash
git add backend/database.py
git commit -m "feat(backend): add sqlite database layer"
```

---

### Task 2: Backend — Pydantic Models

**Files:**
- Create: `backend/models.py`

- [ ] **Step 1: Write the models**

```python
from pydantic import BaseModel
from typing import Optional

class TodoCreate(BaseModel):
    title: str

class TodoUpdate(BaseModel):
    title: Optional[str] = None
    completed: Optional[bool] = None

class TodoResponse(BaseModel):
    id: int
    title: str
    completed: bool
    created_at: str
```

- [ ] **Step 2: Commit**

```bash
git add backend/models.py
git commit -m "feat(backend): add pydantic models"
```

---

### Task 3: Backend — FastAPI Application

**Files:**
- Create: `backend/main.py`
- Create: `backend/requirements.txt`

- [ ] **Step 1: Write requirements.txt**

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
pydantic==2.9.0
aiosqlite==0.20.0
```

- [ ] **Step 2: Write main.py**

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import get_connection, init_db
from models import TodoCreate, TodoUpdate, TodoResponse

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()

@app.get("/api/todos", response_model=list[TodoResponse])
def list_todos():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM todos ORDER BY id DESC").fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.post("/api/todos", response_model=TodoResponse, status_code=201)
def create_todo(todo: TodoCreate):
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO todos (title) VALUES (?)",
        (todo.title,),
    )
    conn.commit()
    row = conn.execute(
        "SELECT * FROM todos WHERE id = ?",
        (cursor.lastrowid,),
    ).fetchone()
    conn.close()
    return dict(row)

@app.put("/api/todos/{todo_id}", response_model=TodoResponse)
def update_todo(todo_id: int, todo: TodoUpdate):
    conn = get_connection()
    row = conn.execute("SELECT * FROM todos WHERE id = ?", (todo_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Todo not found")

    updates = {}
    if todo.title is not None:
        updates["title"] = todo.title
    if todo.completed is not None:
        updates["completed"] = 1 if todo.completed else 0

    if updates:
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [todo_id]
        conn.execute(f"UPDATE todos SET {set_clause} WHERE id = ?", values)
        conn.commit()

    row = conn.execute("SELECT * FROM todos WHERE id = ?", (todo_id,)).fetchone()
    conn.close()
    return dict(row)

@app.delete("/api/todos/{todo_id}", status_code=204)
def delete_todo(todo_id: int):
    conn = get_connection()
    cursor = conn.execute("DELETE FROM todos WHERE id = ?", (todo_id,))
    conn.commit()
    conn.close()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Todo not found")
```

- [ ] **Step 3: Install dependencies and verify backend starts**

Run from backend directory:
```bash
pip install -r requirements.txt
uvicorn main:app --reload
```
Expected: Server starts on http://localhost:8000. Visit http://localhost:8000/docs to see Swagger UI.

- [ ] **Step 4: Commit**

```bash
git add backend/main.py backend/requirements.txt
git commit -m "feat(backend): add fastapi application with crud endpoints"
```

---

### Task 4: Frontend — Initialize Vite + React + TypeScript

**Files:**
- Create: `frontend/` (scaffold with Vite)

- [ ] **Step 1: Create Vite project**

```bash
cd C:/Users/USER/projects/my-todo
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

- [ ] **Step 2: Clean up scaffold**

Remove default boilerplate:
- Delete `src/App.css` content (will rewrite)
- Clear `src/App.tsx` (will rewrite)
- Delete `src/assets/` folder

- [ ] **Step 3: Commit**

```bash
git add frontend/
git commit -m "feat(frontend): scaffold vite react typescript project"
```

---

### Task 5: Frontend — Types

**Files:**
- Create: `frontend/src/types/index.ts`

- [ ] **Step 1: Write types**

```typescript
export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
}

export interface TodoCreate {
  title: string;
}

export interface TodoUpdate {
  title?: string;
  completed?: boolean;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/types/index.ts
git commit -m "feat(frontend): add todo types"
```

---

### Task 6: Frontend — API Client

**Files:**
- Create: `frontend/src/api/todos.ts`

- [ ] **Step 1: Write API client**

```typescript
import type { Todo, TodoCreate, TodoUpdate } from "../types";

const API_BASE = "/api";

export async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch(`${API_BASE}/todos`);
  if (!res.ok) throw new Error("Failed to fetch todos");
  return res.json();
}

export async function createTodo(todo: TodoCreate): Promise<Todo> {
  const res = await fetch(`${API_BASE}/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(todo),
  });
  if (!res.ok) throw new Error("Failed to create todo");
  return res.json();
}

export async function updateTodo(id: number, todo: TodoUpdate): Promise<Todo> {
  const res = await fetch(`${API_BASE}/todos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(todo),
  });
  if (!res.ok) throw new Error("Failed to update todo");
  return res.json();
}

export async function deleteTodo(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/todos/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete todo");
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/api/todos.ts
git commit -m "feat(frontend): add api client"
```

---

### Task 7: Frontend — TodoInput Component

**Files:**
- Create: `frontend/src/components/TodoInput.tsx`

- [ ] **Step 1: Write TodoInput component**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/TodoInput.tsx
git commit -m "feat(frontend): add TodoInput component"
```

---

### Task 8: Frontend — TodoItem Component

**Files:**
- Create: `frontend/src/components/TodoItem.tsx`

- [ ] **Step 1: Write TodoItem component**

```tsx
import { useState } from "react";
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
      <li className="todo-item editing">
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
    <li className={`todo-item ${todo.completed ? "completed" : ""}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={(e) => onToggle(todo.id, e.target.checked)}
      />
      <span className="todo-title">{todo.title}</span>
      <button className="btn-edit" onClick={() => { setEditTitle(todo.title); setEditing(true); }}>
        ✏️
      </button>
      <button className="btn-delete" onClick={() => onDelete(todo.id)}>
        🗑️
      </button>
    </li>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/TodoItem.tsx
git commit -m "feat(frontend): add TodoItem component"
```

---

### Task 9: Frontend — TodoList Component

**Files:**
- Create: `frontend/src/components/TodoList.tsx`

- [ ] **Step 1: Write TodoList component**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/TodoList.tsx
git commit -m "feat(frontend): add TodoList component"
```

---

### Task 10: Frontend — App.tsx + App.css

**Files:**
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/App.css`

- [ ] **Step 1: Write App.tsx**

```tsx
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
```

- [ ] **Step 2: Write App.css**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: #f0f2f5;
  display: flex;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
}

.app {
  width: 100%;
  max-width: 500px;
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h1 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #1a1a1a;
}

.error {
  color: #e74c3c;
  padding: 0.5rem;
  background: #fde8e8;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

/* TodoInput */
.todo-input {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.todo-input input {
  flex: 1;
  padding: 0.625rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

.todo-input input:focus {
  border-color: #4a90d9;
}

.todo-input button {
  padding: 0.625rem 1rem;
  background: #4a90d9;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.125rem;
}

.todo-input button:hover {
  background: #357abd;
}

/* TodoList */
.todo-list-wrapper {
  margin-top: 0.5rem;
}

.todo-list {
  list-style: none;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 2rem 0;
}

/* TodoItem */
.todo-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
}

.todo-item:last-child {
  border-bottom: none;
}

.todo-item input[type="checkbox"] {
  width: 1.125rem;
  height: 1.125rem;
  cursor: pointer;
}

.todo-item .todo-title {
  flex: 1;
  font-size: 1rem;
  color: #333;
}

.todo-item.completed .todo-title {
  text-decoration: line-through;
  color: #aaa;
}

.todo-item button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.todo-item button:hover {
  opacity: 1;
}

.todo-item.editing {
  padding: 0.5rem 0;
}

.todo-item.editing input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #4a90d9;
  border-radius: 6px;
  font-size: 1rem;
  outline: none;
}

.todo-count {
  text-align: center;
  color: #999;
  font-size: 0.875rem;
  margin-top: 1rem;
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.tsx frontend/src/App.css
git commit -m "feat(frontend): add app component and styles"
```

---

### Task 11: Frontend — Configure Vite Proxy

**Files:**
- Modify: `frontend/vite.config.ts`

- [ ] **Step 1: Add proxy configuration**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add frontend/vite.config.ts
git commit -m "config(frontend): add vite proxy for api backend"
```

---

### Task 12: Root README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README.md**

```markdown
# My Todo List

Full-stack todo list with React + TypeScript frontend and FastAPI + SQLite backend.

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

API runs on http://localhost:8000. Swagger docs at http://localhost:8000/docs.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs on http://localhost:5173.

## Project Structure

```
my-todo/
├── frontend/          # React + Vite + TypeScript
├── backend/           # FastAPI + SQLite
└── README.md
```
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add readme"
```

---

### Spec Coverage Check

- **GET /api/todos** → Task 3 (list_todos endpoint)
- **POST /api/todos** → Task 3 (create_todo endpoint)
- **PUT /api/todos/{id}** → Task 3 (update_todo endpoint)
- **DELETE /api/todos/{id}** → Task 3 (delete_todo endpoint)
- **SQLite DB** → Task 1 (database.py)
- **Pydantic models** → Task 2 (models.py)
- **CORS** → Task 3 (CORSMiddleware)
- **Vite scaffold** → Task 4 (npm create vite)
- **TypeScript types** → Task 5 (types/index.ts)
- **API client** → Task 6 (api/todos.ts)
- **TodoInput component** → Task 7
- **TodoItem component** → Task 8
- **TodoList component** → Task 9
- **App.tsx wiring** → Task 10
- **CSS styling** → Task 10 (App.css)
- **Vite proxy** → Task 11
- **README** → Task 12
