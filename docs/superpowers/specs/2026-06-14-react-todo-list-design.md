# React Todo List — 設計規格

## Overview

全端 Todo List 應用，前端使用 React + Vite + TypeScript，後端使用 FastAPI + SQLite。前後端透過 REST API 溝通。

## Project Structure

```
my-todo/
├── frontend/               # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/
│   │   │   ├── TodoList.tsx
│   │   │   ├── TodoItem.tsx
│   │   │   └── TodoInput.tsx
│   │   ├── api/
│   │   │   └── todos.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── main.tsx
│   └── package.json
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   └── requirements.txt
└── README.md
```

## Backend (FastAPI + SQLite)

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/todos | List all todos |
| POST | /api/todos | Create a new todo |
| PUT | /api/todos/{id} | Update a todo (title, completed) |
| DELETE | /api/todos/{id} | Delete a todo |

### Todo Schema

```python
class Todo:
    id: int          # auto-increment
    title: str       # task name
    completed: bool  # default: False
    created_at: str  # ISO format timestamp
```

### CORS

Allow origin `http://localhost:5173` for development.

## Frontend (React + Vite + TypeScript)

### Components

- **TodoInput** — text input + add button, submits new todo
- **TodoList** — renders list of TodoItem components, shows item count
- **TodoItem** — displays single todo with checkbox (toggle complete), edit button (inline edit), delete button

### Data Flow

1. App loads → fetches `/api/todos` → renders TodoList
2. User adds → POST `/api/todos` → refresh list
3. User updates → PUT `/api/todos/{id}` → refresh list
4. User deletes → DELETE `/api/todos/{id}` → refresh list

### Styling

Plain CSS (no framework). Clean, minimal design.

## Development Workflow

- `cd backend && uvicorn main:app --reload` (port 8000)
- `cd frontend && npm run dev` (port 5173, proxy `/api` to `localhost:8000`)
