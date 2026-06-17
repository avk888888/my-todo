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
