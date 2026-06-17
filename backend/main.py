from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import get_connection, init_db
from models import TodoCreate, TodoUpdate, TodoResponse, NoteCreate, NoteUpdate, NoteResponse

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

    if updates:
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [note_id]
        set_clause += ", updated_at = datetime('now')"
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
