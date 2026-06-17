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
