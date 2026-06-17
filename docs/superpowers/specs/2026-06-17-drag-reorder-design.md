# Drag & Drop Reorder — Design Spec

Add drag-and-drop reordering to both the Todo List and Notes sections using `@dnd-kit`.

## Layout

- Each list item can be grabbed anywhere and dragged up/down
- During drag: item becomes semi-transparent with a shadow overlay
- Drop target shows an insertion line indicator
- On drop: items animate to new position, order is persisted to the database

## Data Model Changes

### SQLite — `todos` table

Add column:
```sql
ALTER TABLE todos ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
```

### SQLite — `notes` table

Add column:
```sql
ALTER TABLE notes ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
```

### Query Changes

Existing queries change from:
```sql
-- Before
ORDER BY id DESC

-- After
ORDER BY sort_order ASC, id DESC
```

## API Endpoints

### `PUT /api/todos/reorder`

Request body:
```json
{ "ids": [3, 1, 2] }
```

Response: `{ "success": true }`

Logic: Update each todo's `sort_order` to match its index in the array (0, 1, 2...).

### `PUT /api/notes/reorder`

Same pattern as todos/reorder.

## Frontend Changes

### Dependencies

Install:
- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`

### `api/todos.ts`

Add:
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

### `api/notes.ts`

Add `reorderNotes(ids)` following the same pattern.

### `TodoList.tsx`

- Wrap list in `DndContext` + `SortableContext`
- Use `arrayMove` from `@dnd-kit/sortable` to compute new order on drag end
- Call `onReorder(ids)` prop when drag completes
- Use `sortableKeyboardCoordinates` for keyboard accessibility

### `TodoItem.tsx`

- Replace `<li>` with component using `useSortable`
- Apply `transform`, `transition` from `useSortable`
- Apply opacity style when `isDragging` is true
- Set `cursor: grab` / `cursor: grabbing` based on drag state
- All existing interactions (toggle, edit, delete) remain unchanged

### `NoteList.tsx`

Same pattern as TodoList — wrap in DndContext + SortableContext.

### `NoteItem.tsx`

Same pattern as TodoItem — use `useSortable`, apply drag styles.

### `App.tsx`

- Add `handleReorderTodos(ids)` and `handleReorderNotes(ids)` handlers
- Call `reorderTodos()` / `reorderNotes()` API on drag end
- Refresh data after reorder

### CSS Changes

**App.css:**
- `.todo-item` / `.note-item`: Add `cursor: grab` and `touch-action: none`
- `.todo-item.dragging` / `.note-item.dragging`: Add `opacity: 0.5` and `box-shadow` styles

## Non-Goals

- No mobile/touch-specific optimization (handled by @dnd-kit)
- No drag handle (whole item drag)
- No multi-select or batch move
- No drag-across-lists (Todos and Notes are separate lists)
