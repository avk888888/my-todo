# Drag & Drop Reorder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add drag-and-drop reordering to Todo List and Notes using @dnd-kit.

**Architecture:** Add `sort_order` column to `todos` and `notes` tables. Add `PUT /api/todos/reorder` and `PUT /api/notes/reorder` endpoints. Upgrade TodoList/TodoItem and NoteList/NoteItem to use @dnd-kit/sortable.

**Tech Stack:** FastAPI + SQLite (backend), React 19 + @dnd-kit + Vite (frontend)

---

### Task 1: Backend — Add sort_order column to both tables

**Files:**
- Modify: `backend/database.py`
- Modify: `backend/main.py`

- [ ] **Step 1: Add migration for sort_order column**

In `backend/database.py`, inside `init_db()`, add ALTER TABLE statements after the CREATE TABLE IF NOT EXISTS:

```python
    conn.commit()
    
    # Add sort_order column if not exists (migration for existing databases)
    try:
        conn.execute("ALTER TABLE todos ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0")
    except Exception:
        pass  # Column already exists
    
    try:
        conn.execute("ALTER TABLE notes ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0")
    except Exception:
        pass  # Column already exists

    conn.close()
```

Also update the CREATE TABLE statements to include sort_order for new databases:

```python
    conn.execute("""
        CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            completed INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            sort_order INTEGER NOT NULL DEFAULT 0
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            sort_order INTEGER NOT NULL DEFAULT 0
        )
    """)
```

- [ ] **Step 2: Update query ORDER BY in main.py**

In `backend/main.py`, change the SQL queries to `ORDER BY sort_order ASC, id DESC`:

For `list_todos()`:
```python
rows = conn.execute("SELECT * FROM todos ORDER BY sort_order ASC, id DESC").fetchall()
```

For `list_notes()`:
```python
rows = conn.execute("SELECT * FROM notes ORDER BY sort_order ASC, id DESC").fetchall()
```

- [ ] **Step 3: Add reorder endpoints in main.py**

Add imports at the top if not already there — they should already be there from the notepad feature.

Add these two endpoints after the existing note endpoints:

```python
from pydantic import BaseModel

class ReorderRequest(BaseModel):
    ids: list[int]

@app.put("/api/todos/reorder")
def reorder_todos(req: ReorderRequest):
    conn = get_connection()
    for index, todo_id in enumerate(req.ids):
        conn.execute(
            "UPDATE todos SET sort_order = ? WHERE id = ?",
            (index, todo_id),
        )
    conn.commit()
    conn.close()
    return {"success": True}

@app.put("/api/notes/reorder")
def reorder_notes(req: ReorderRequest):
    conn = get_connection()
    for index, note_id in enumerate(req.ids):
        conn.execute(
            "UPDATE notes SET sort_order = ? WHERE id = ?",
            (index, note_id),
        )
    conn.commit()
    conn.close()
    return {"success": True}
```

- [ ] **Step 4: Commit**

```bash
cd C:/Users/USER/projects/my-todo
git add backend/database.py backend/main.py
git commit -m "feat(backend): add sort_order and reorder endpoints"
```

---

### Task 2: Backend — Test reorder API

**Files:**
- Test: running server

- [ ] **Step 1: Restart backend and test**

```bash
# Kill old uvicorn
kill $(ps -ef | grep uvicorn | grep -v grep | awk '{print $2}') 2>/dev/null || true
sleep 2

# Start fresh
cd C:/Users/USER/projects/my-todo/backend
rm -rf __pycache__
nohup uvicorn main:app --port 8000 > /dev/null 2>&1 &
sleep 4

# Test reorder
curl -s -X PUT http://localhost:8000/api/todos/reorder \
  -H "Content-Type: application/json" \
  -d '{"ids":[1,2,3]}'

# Verify order
curl -s http://localhost:8000/api/todos
```

Expected: Returns `{"success":true}`, todos listed in the specified order.

- [ ] **Step 2: Commit**

```bash
cd C:/Users/USER/projects/my-todo
git add -A
git commit -m "test(backend): verify reorder API endpoints"
```

---

### Task 3: Frontend — Install @dnd-kit and add API helpers

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/src/api/todos.ts`
- Modify: `frontend/src/api/notes.ts`

- [ ] **Step 1: Install @dnd-kit packages**

```bash
cd C:/Users/USER/projects/my-todo/frontend
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- [ ] **Step 2: Add reorderTodos to api/todos.ts**

Append to `frontend/src/api/todos.ts`:

```typescript
export async function reorderTodos(ids: number[]): Promise<void> {
  const res = await fetch(`${API_BASE}/todos/reorder`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error("Failed to reorder todos");
}
```

- [ ] **Step 3: Add reorderNotes to api/notes.ts**

Append to `frontend/src/api/notes.ts`:

```typescript
export async function reorderNotes(ids: number[]): Promise<void> {
  const res = await fetch(`${API_BASE}/notes/reorder`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error("Failed to reorder notes");
}
```

- [ ] **Step 4: Commit**

```bash
cd C:/Users/USER/projects/my-todo
git add frontend/package.json frontend/package-lock.json frontend/src/api/
git commit -m "feat(frontend): install @dnd-kit and add reorder API helpers"
```

---

### Task 4: Frontend — Refactor TodoItem for drag support

**Files:**
- Modify: `frontend/src/components/TodoItem.tsx`

- [ ] **Step 1: Rewrite TodoItem with @dnd-kit useSortable**

Replace the entire content of `frontend/src/components/TodoItem.tsx`:

```tsx
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
```

Note: The checkbox, edit, and delete buttons use `stopPropagation` to prevent drag activation when interacting with controls.

- [ ] **Step 2: Commit**

```bash
cd C:/Users/USER/projects/my-todo
git add frontend/src/components/TodoItem.tsx
git commit -m "feat(frontend): add drag support to TodoItem with @dnd-kit"
```

---

### Task 5: Frontend — Refactor TodoList for DndContext

**Files:**
- Modify: `frontend/src/components/TodoList.tsx`

- [ ] **Step 1: Rewrite TodoList with DndContext + SortableContext**

Replace the entire content of `frontend/src/components/TodoList.tsx`:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
cd C:/Users/USER/projects/my-todo
git add frontend/src/components/TodoList.tsx
git commit -m "feat(frontend): add DndContext to TodoList with @dnd-kit"
```

---

### Task 6: Frontend — Refactor NoteItem for drag support

**Files:**
- Modify: `frontend/src/components/NoteItem.tsx`

- [ ] **Step 1: Rewrite NoteItem with @dnd-kit useSortable**

Replace the entire content of `frontend/src/components/NoteItem.tsx`:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
cd C:/Users/USER/projects/my-todo
git add frontend/src/components/NoteItem.tsx
git commit -m "feat(frontend): add drag support to NoteItem with @dnd-kit"
```

---

### Task 7: Frontend — Refactor NoteList for DndContext

**Files:**
- Modify: `frontend/src/components/NoteList.tsx`

- [ ] **Step 1: Rewrite NoteList with DndContext + SortableContext**

Replace the entire content of `frontend/src/components/NoteList.tsx`:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
cd C:/Users/USER/projects/my-todo
git add frontend/src/components/NoteList.tsx
git commit -m "feat(frontend): add DndContext to NoteList with @dnd-kit"
```

---

### Task 8: Frontend — Wire up reorder handlers in App.tsx

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Add imports and reorder handlers**

Update imports in `frontend/src/App.tsx`:

```typescript
import { reorderTodos } from "./api/todos";
import { reorderNotes } from "./api/notes";
```

Make sure `reorderTodos` and `reorderNotes` are already imported. The existing imports might need `reorderTodos` added:

```typescript
import { fetchTodos, createTodo, updateTodo, deleteTodo, reorderTodos } from "./api/todos";
import { fetchNotes, createNote, updateNote, deleteNote, reorderNotes } from "./api/notes";
```

Add these handlers before the `return` statement in the `App` component:

```typescript
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
```

Pass the new props to TodoList and NoteList:

```tsx
      <TodoList
        todos={todos}
        onToggle={handleToggle}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onReorder={handleReorderTodos}
      />
      ...
      <NoteList
        notes={notes}
        onUpdate={handleUpdateNote}
        onDelete={handleDeleteNote}
        onReorder={handleReorderNotes}
      />
```

- [ ] **Step 2: Add dragging CSS to App.css**

Append to `frontend/src/App.css`:

```css
/* Drag & Drop */
.todo-item.dragging,
.note-item.dragging {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  position: relative;
}

.todo-item, .note-item {
  touch-action: none;
}
```

Also update the existing `.todo-item` and `.note-item` to include `touch-action: none`. The `touch-action: none` needs to be added to existing `.todo-item` and `.note-item` selectors. Since we're appending it after, the combined effect works.

- [ ] **Step 3: Commit**

```bash
cd C:/Users/USER/projects/my-todo
git add frontend/src/App.tsx frontend/src/App.css
git commit -m "feat(frontend): wire up drag reorder handlers in App"
```

---

### Task 9: Verify end-to-end

- [ ] **Step 1: Verify TypeScript compilation**

```bash
cd C:/Users/USER/projects/my-todo/frontend
npx tsc --noEmit 2>&1
```

Expected: No errors.

- [ ] **Step 2: Build frontend**

```bash
cd C:/Users/USER/projects/my-todo/frontend
npx vite build 2>&1
```

Expected: Build succeeds.

- [ ] **Step 3: Restart services and test reorder API**

```bash
# Kill and restart
kill $(ps -ef | grep uvicorn | grep -v grep | awk '{print $2}') 2>/dev/null || true
sleep 2
cd C:/Users/USER/projects/my-todo/backend
rm -rf __pycache__
nohup uvicorn main:app --port 8000 > /dev/null 2>&1 &
sleep 4

# Test reorder
curl -s -X PUT http://localhost:8000/api/todos/reorder \
  -H "Content-Type: application/json" \
  -d '{"ids":[1,2,3]}'
echo ""
curl -s http://localhost:8000/api/todos
```

- [ ] **Step 4: Commit**

```bash
cd C:/Users/USER/projects/my-todo
git add -A
git commit -m "test: verify drag reorder feature end-to-end"
```
