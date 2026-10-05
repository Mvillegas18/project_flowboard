export type TaskData = {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  priority: "Urgent" | "High" | "Medium" | "Low" | null;
  order: number;
  columnId: string;
  createdAt: string;
  updatedAt: string;
};

export type ColumnData = {
  id: string;
  title: string;
  order: number;
  tasks: TaskData[];
};

export type BoardData = {
  id: string;
  title: string;
  columns: ColumnData[];
};
