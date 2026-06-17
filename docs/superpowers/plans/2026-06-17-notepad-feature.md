# Notepad Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a multi-note notepad below the existing Todo list, with title+content notes persisted to the backend SQLite database.

**Architecture:** Backend FastAPI adds a `notes` table and CRUD endpoints (mirroring todos). Frontend adds 3 new components (NoteInput, NoteList, NoteItem) integrated into App.tsx below the todo list. Existing patterns (error handling, loading, API client) are reused.

**Tech Stack:** FastAPI + SQLite (backend), React 19 + TypeScript + Vite (frontend)

---

### Task 1: Backend — Add notes table to database.py

**Files:**
- Modify: `backend/database.py`

- [ ] **Step 1: Add notes table creation to init_db()**

In `backend/database.py`, add a second `CREATE TABLE IF NOT EXISTS notes` statement inside `init_db()`:

```python
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
    conn.execute("""
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)
    conn.commit()
    conn.close()
```

- [ ] **Step 2: Commit**

```bash
cd C:/Users/USER/projects/my-todo
git add backend/database.py
git commit -m "feat(backend): add notes table to database schema"
```

---

### Task 2: Backend — Add Pydantic models for notes

**Files:**
- Modify: `backend/models.py`

- [ ] **Step 1: Add NoteCreate, NoteUpdate, NoteResponse models**

In `backend/models.py`, append after the existing Todo models:

```python
class NoteCreate(BaseModel):
    title: str

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class NoteResponse(BaseModel):
    id: int
    title: str
    content: str
    created_at: str
    updated_at: str
```

- [ ] **Step 2: Commit**

```bash
cd C:/Users/USER/projects/my-todo
git add backend/models.py
git commit -m "feat(backend): add Pydantic models for notes"
```

---

### Task 3: Backend — Add note CRUD endpoints to main.py

**Files:**
- Modify: `backend/main.py`

- [ ] **Step 1: Add Note model imports and 4 endpoints**

In `backend/main.py`, update the import line to include Note models:

```python
from models import TodoCreate, TodoUpdate, TodoResponse, NoteCreate, NoteUpdate, NoteResponse
```

Then add these 4 endpoints after the existing todo endpoints:

```python
@app.get("/api/notes", response_model=list[NoteResponse])
def list_notes():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM notes ORDER BY updated_at DESC").fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.post("/api/notes", response_model=NoteResponse, status_code=201)
def create_note(note: NoteCreate):
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO notes (title) VALUES (?)",
        (note.title,),
    )
    conn.commit()
    row = conn.execute(
        "SELECT * FROM notes WHERE id = ?",
        (cursor.lastrowid,),
    ).fetchone()
    conn.close()
    return dict(row)

@app.put("/api/notes/{note_id}", response_model=NoteResponse)
def update_note(note_id: int, note: NoteUpdate):
    conn = get_connection()
    row = conn.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Note not found")

    updates = {}
    if note.title is not None:
        updates["title"] = note.title
    if note.content is not None:
        updates["content"] = note.content
    updates["updated_at"] = "datetime('now')"

    if updates:
        set_clause = ", ".join(f"{k} = ?" for k in updates if k != "updated_at")
        values = [v for k, v in updates.items() if k != "updated_at"]
        set_clause += ", updated_at = datetime('now')"
        values.append(note_id)
        conn.execute(f"UPDATE notes SET {set_clause} WHERE id = ?", values)
        conn.commit()

    row = conn.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
    conn.close()
    return dict(row)

@app.delete("/api/notes/{note_id}", status_code=204)
def delete_note(note_id: int):
    conn = get_connection()
    cursor = conn.execute("DELETE FROM notes WHERE id = ?", (note_id,))
    conn.commit()
    conn.close()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Note not found")
```

- [ ] **Step 2: Commit**

```bash
cd C:/Users/USER/projects/my-todo
git add backend/main.py
git commit -m "feat(backend): add note CRUD endpoints"
```

---

### Task 4: Backend — Verify API works

**Files:**
- Test: `backend/main.py` (running server)

- [ ] **Step 1: Restart backend and test notes API**

```bash
# Kill old uvicorn process
kill $(lsof -ti:8000) 2>/dev/null || true

# Start fresh
cd C:/Users/USER/projects/my-todo/backend
nohup uvicorn main:app --reload --port 8000 > /dev/null 2>&1 &
sleep 3

# Test: create a note
curl -s -X POST http://localhost:8000/api/notes \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Note"}'

# Test: list notes
curl -s http://localhost:8000/api/notes

# Test: update a note
curl -s -X PUT http://localhost:8000/api/notes/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Note","content":"This is the content"}'

# Test: delete a note
curl -s -X DELETE http://localhost:8000/api/notes/1
```

Expected: All return 200/201/204 with correct data.

- [ ] **Step 2: Silence! (if tests pass)**

```bash
cd C:/Users/USER/projects/my-todo
git add -A
git commit -m "test(backend): verify notes API endpoints"
```

---

### Task 5: Frontend — Add Note TypeScript types

**Files:**
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: Add Note interfaces**

Append to `frontend/src/types/index.ts`:

```typescript
export interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface NoteCreate {
  title: string;
}

export interface NoteUpdate {
  title?: string;
  content?: string;
}
```

- [ ] **Step 2: Commit**

```bash
cd C:/Users/USER/projects/my-todo
git add frontend/src/types/index.ts
git commit -m "feat(frontend): add Note TypeScript types"
```

---

### Task 6: Frontend — Create notes API client

**Files:**
- Create: `frontend/src/api/notes.ts`

- [ ] **Step 1: Write notes API client**

Create `frontend/src/api/notes.ts`:

```typescript
import type { Note, NoteCreate, NoteUpdate } from "../types";

const API_BASE = "/api";

export async function fetchNotes(): Promise<Note[]> {
  const res = await fetch(`${API_BASE}/notes`);
  if (!res.ok) throw new Error("Failed to fetch notes");
  return res.json();
}

export async function createNote(note: NoteCreate): Promise<Note> {
  const res = await fetch(`${API_BASE}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(note),
  });
  if (!res.ok) throw new Error("Failed to create note");
  return res.json();
}

export async function updateNote(id: number, note: NoteUpdate): Promise<Note> {
  const res = await fetch(`${API_BASE}/notes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(note),
  });
  if (!res.ok) throw new Error("Failed to update note");
  return res.json();
}

export async function deleteNote(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/notes/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete note");
}
```

- [ ] **Step 2: Commit**

```bash
cd C:/Users/USER/projects/my-todo
git add frontend/src/api/notes.ts
git commit -m "feat(frontend): add notes API client"
```

---

### Task 7: Frontend — Create NoteInput component

**Files:**
- Create: `frontend/src/components/NoteInput.tsx`

- [ ] **Step 1: Write NoteInput component**

Create `frontend/src/components/NoteInput.tsx`:

```tsx
import { useState } from "react";

interface NoteInputProps {
  onAdd: (title: string) => void;
}

export default function NoteInput({ onAdd }: NoteInputProps) {
  const [title, setTitle] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setTitle("");
  }

  return (
    <form onSubmit={handleSubmit} className="note-input">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="新增記事..."
        autoFocus
      />
      <button type="submit">＋</button>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd C:/Users/USER/projects/my-todo
git add frontend/src/components/NoteInput.tsx
git commit -m "feat(frontend): add NoteInput component"
```

---

### Task 8: Frontend — Create NoteItem component

**Files:**
- Create: `frontend/src/components/NoteItem.tsx`

- [ ] **Step 1: Write NoteItem component**

Create `frontend/src/components/NoteItem.tsx`:

```tsx
import { useState } from "react";
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
      <li className="note-item expanded">
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
          <button className="btn-save" onClick={handleSave}>儲存</button>
        </div>
      </li>
    );
  }

  return (
    <li className="note-item" onClick={() => setExpanded(true)}>
      <div className="note-header">
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
```

- [ ] **Step 2: Commit**

```bash
cd C:/Users/USER/projects/my-todo
git add frontend/src/components/NoteItem.tsx
git commit -m "feat(frontend): add NoteItem component with inline editing"
```

---

### Task 9: Frontend — Create NoteList component

**Files:**
- Create: `frontend/src/components/NoteList.tsx`

- [ ] **Step 1: Write NoteList component**

Create `frontend/src/components/NoteList.tsx`:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
cd C:/Users/USER/projects/my-todo
git add frontend/src/components/NoteList.tsx
git commit -m "feat(frontend): add NoteList component"
```

---

### Task 10: Frontend — Integrate notes into App.tsx and App.css

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/App.css`

- [ ] **Step 1: Update App.tsx to include notes state and components**

In `frontend/src/App.tsx`, update imports:

```typescript
import { useState, useEffect, useCallback } from "react";
import type { Todo, Note } from "./types";
import { fetchTodos, createTodo, updateTodo, deleteTodo } from "./api/todos";
import { fetchNotes, createNote, updateNote, deleteNote } from "./api/notes";
import TodoInput from "./components/TodoInput";
import TodoList from "./components/TodoList";
import NoteInput from "./components/NoteInput";
import NoteList from "./components/NoteList";
import "./App.css";
```

Replace the component function to add notes state and handlers:

```typescript
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
      <hr className="divider" />
      <h2 className="notes-heading">📝 記事本</h2>
      <NoteInput onAdd={handleAddNote} />
      <NoteList
        notes={notes}
        onUpdate={handleUpdateNote}
        onDelete={handleDeleteNote}
      />
    </div>
  );
}
```

- [ ] **Step 2: Add notes-related CSS to App.css**

Append to `frontend/src/App.css`:

```css
/* Divider */
.divider {
  border: none;
  border-top: 1px solid #eee;
  margin: 1.5rem 0;
}

/* Notes heading */
.notes-heading {
  font-size: 1.125rem;
  margin-bottom: 1rem;
  color: #d48a1a;
}

/* NoteInput */
.note-input {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.note-input input {
  flex: 1;
  padding: 0.625rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

.note-input input:focus {
  border-color: #d48a1a;
}

.note-input button {
  padding: 0.625rem 1rem;
  background: #d48a1a;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.125rem;
}

.note-input button:hover {
  background: #b87514;
}

/* NoteList */
.note-list-wrapper {
  margin-top: 0.25rem;
}

.note-list {
  list-style: none;
}

.note-count {
  text-align: center;
  color: #999;
  font-size: 0.875rem;
  margin-top: 0.75rem;
}

/* NoteItem - collapsed */
.note-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: box-shadow 0.2s;
  background: #fefdf7;
}

.note-item:hover {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.note-header {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 0;
}

.note-title {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-time {
  font-size: 0.75rem;
  color: #aaa;
  white-space: nowrap;
  margin-left: 0.5rem;
}

.note-preview {
  width: 100%;
  font-size: 0.8125rem;
  color: #888;
  margin: 0.25rem 0 0 1.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-item .btn-delete {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  opacity: 0.4;
  transition: opacity 0.2s;
  font-size: 0.875rem;
}

.note-item .btn-delete:hover {
  opacity: 1;
}

/* NoteItem - expanded editing state */
.note-item.expanded {
  flex-direction: column;
  align-items: stretch;
  cursor: default;
  background: #fffbf0;
  border-color: #f0c060;
}

.note-edit-title {
  padding: 0.5rem;
  border: 1px solid #f0c060;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  outline: none;
  width: 100%;
}

.note-edit-content {
  padding: 0.5rem;
  border: 1px solid #f0c060;
  border-radius: 6px;
  font-size: 0.875rem;
  outline: none;
  width: 100%;
  resize: vertical;
  font-family: inherit;
  line-height: 1.5;
}

.note-edit-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-save {
  padding: 0.375rem 1rem;
  background: #d48a1a;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8125rem;
}

.btn-save:hover {
  background: #b87514;
}
```

- [ ] **Step 3: Commit**

```bash
cd C:/Users/USER/projects/my-todo
git add frontend/src/App.tsx frontend/src/App.css
git commit -m "feat(frontend): integrate notes into App with styling"
```

---

### Task 11: Verify end-to-end

- [ ] **Step 1: Restart both servers and verify**

```bash
# Kill old processes
kill $(lsof -ti:8000) 2>/dev/null || true

# Restart backend
cd C:/Users/USER/projects/my-todo/backend
nohup uvicorn main:app --reload --port 8000 > /dev/null 2>&1 &
sleep 3

# Test backend API
curl -s -X POST http://localhost:8000/api/notes \
  -H "Content-Type: application/json" \
  -d '{"title":"Hello World"}'

curl -s http://localhost:8000/api/notes

# Check frontend compiles
cd C:/Users/USER/projects/my-todo/frontend
npx tsc --noEmit 2>&1
```

Expected: Backend returns 201 for create, 200 for list. TypeScript compiles without errors.

- [ ] **Step 2: Commit**

```bash
cd C:/Users/USER/projects/my-todo
git add -A
git commit -m "test: verify notes feature end-to-end"
```
