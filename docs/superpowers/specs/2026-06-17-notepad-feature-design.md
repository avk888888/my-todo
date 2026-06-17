# Notepad Feature — Design Spec

Add a multi-note notepad below the existing Todo list in the my-todo app, with title+content notes persisted to the backend SQLite database.

## Layout

The notepad appears below the Todo list, separated by a horizontal divider:

```
┌─ App ──────────────────┐
│  React Todo List        │
│  ☐ Buy milk             │
│  ☐ Call Mom             │
│  ☑️ Finish report        │
│  ─────────────────────  │
│  📝 記事本              │
│  [新記事標題...    ＋]   │
│  ┌─ 會議重點 ── 10:30 ─┐│
│  │ 下午2點與設計團隊... ││
│  └─────────────────────┘│
│  ┌─ 購物清單 ── 昨天 ──┐│
│  │ 牛奶、蛋、麵包...    ││
│  └─────────────────────┘│
│  2 items                │
└─────────────────────────┘
```

## Data Model

### SQLite Table — `notes`

| Column     | Type    | Constraints                  |
|------------|---------|------------------------------|
| id         | INTEGER | PRIMARY KEY AUTOINCREMENT    |
| title      | TEXT    | NOT NULL                     |
| content    | TEXT    | NOT NULL DEFAULT ''          |
| created_at | TEXT    | NOT NULL DEFAULT datetime()  |
| updated_at | TEXT    | NOT NULL DEFAULT datetime()  |

### TypeScript Types

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

### Pydantic Models (Backend)

- `NoteCreate(title: str)` — title is required
- `NoteUpdate(title: Optional[str], content: Optional[str])` — partial update
- `NoteResponse(id, title, content, created_at, updated_at)` — full response

## API Endpoints

| Method | Path             | Description                          |
|--------|------------------|--------------------------------------|
| GET    | /api/notes       | List all notes, ordered by updated_at DESC |
| POST   | /api/notes       | Create a new note (title required)    |
| PUT    | /api/notes/{id}  | Update note title and/or content      |
| DELETE | /api/notes/{id}  | Delete a note (404 if not found)      |

All endpoints mirror the existing `/api/todos` pattern.

## Frontend Components

### types/index.ts
Add `Note`, `NoteCreate`, `NoteUpdate` interfaces.

### api/notes.ts
Export `fetchNotes()`, `createNote()`, `updateNote()`, `deleteNote()` — each mimics the corresponding `api/todos.ts` function.

### NoteInput.tsx
- Text input + "＋" button at the top of the notepad section
- Enter key or button click creates a new note
- Clears input after successful creation
- Props: `onAdd(title: string): void`

### NoteList.tsx
- Renders list of `NoteItem` components
- Shows "No notes yet" empty state
- Shows item count at the bottom
- Props: `notes`, `onUpdate`, `onDelete`

### NoteItem.tsx
- Displays note title with emoji prefix, truncated content preview, and timestamp
- **Click** on the note → expands inline to show title + content textareas for editing
- **Enter** or **blur** → saves changes and collapses
- **Esc** → reverts and collapses
- Delete button visible in both collapsed and expanded states
- Props: `note`, `onUpdate`, `onDelete`

### App.tsx
- Add `notes` state and load them in `useEffect` alongside todos
- Render `NoteInput` + `NoteList` below `TodoList`, separated by `<hr />`
- Error handling follows the same pattern as todos

## Error Handling

- API call failures show an inline error message below the notes section header
- Same pattern as existing todo error handling (`setError` → displayed as `<p className="error">`)

## Files to Create

| File | Purpose |
|------|---------|
| backend/database.py | Add `notes` table to `init_db()` |
| backend/models.py | Add `NoteCreate`, `NoteUpdate`, `NoteResponse` |
| backend/main.py | Add 4 note endpoints (GET/POST/PUT/DELETE) |
| frontend/src/types/index.ts | Add Note types |
| frontend/src/api/notes.ts | API client for notes |
| frontend/src/components/NoteInput.tsx | Note creation input |
| frontend/src/components/NoteList.tsx | Note list |
| frontend/src/components/NoteItem.tsx | Single note with inline editing |
| frontend/src/App.tsx | Integrate notes below todos |
| frontend/src/App.css | Add notes-related styles |

## Non-Goals

- No search/filter for notes
- No categories or tags
- No rich text / markdown formatting
- No drag-and-drop reordering
- No pinning or starring
