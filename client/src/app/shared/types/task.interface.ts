export interface TaskInterface {
  id: string
  title: string;
  description?: string;
  boardId: string;
  userId: string;
  columnId: string;
}
