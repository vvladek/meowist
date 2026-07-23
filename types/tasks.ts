export type Task = {
  id: string;
  title: string;
};

export type TaskList = {
  id: string;
  title: string;
  tasks: Task[];
};

export type PendingUndo = {
  listId: string;
  task: Task;
  index: number;
};
