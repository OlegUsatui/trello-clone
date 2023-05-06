import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { SocketService } from "./socket.service";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { SocketEventsEnum } from "../types/socketEvents.enum";
import { TaskInterface } from "../types/task.interface";
import { TaskRequestInterface } from "../types/taskRequest.interface";

@Injectable()
export class TasksService {
  constructor(private http: HttpClient, private socketService: SocketService) {}

  getTasks(boardId: string): Observable<TaskInterface[]> {
    const url = `${environment.apiUrl}/boards/${boardId}/tasks`;
    return this.http.get<TaskInterface[]>(url);
  }

  createTask(taskRequest: TaskRequestInterface): void {
    this.socketService.emit(SocketEventsEnum.taskCreate, taskRequest);
  }

  updateTask(boardId: string, taskId: string, fields: {title?: string, description?: string, columnId?: string}): void {
    console.log(fields)
    this.socketService.emit(SocketEventsEnum.taskUpdate, {boardId, taskId, fields})
  }

  deleteTask(boardId: string, taskId: string): void {
    this.socketService.emit(SocketEventsEnum.taskDelete, { boardId, taskId });
  }
}
