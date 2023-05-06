import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ColumnInterface } from '../types/column.interface';
import { ColumnRequestInterface } from '../types/columnRequest.interface';
import { SocketService } from './socket.service';
import { SocketEventsEnum } from '../types/socketEvents.enum';

@Injectable()
export class ColumnsService {
  constructor(private http: HttpClient, private socketService: SocketService) {}

  getColumns(boardId: string): Observable<ColumnInterface[]> {
    const url = `${environment.apiUrl}/boards/${boardId}/columns`;
    return this.http.get<ColumnInterface[]>(url);
  }

  createColumn(columnRequest: ColumnRequestInterface): void {
    this.socketService.emit(SocketEventsEnum.columnCreate, columnRequest);
  }

  updateColumn(boardId: string, columnId: string, fields: {title: string}): void {
    this.socketService.emit(SocketEventsEnum.columnUpdate, { boardId, columnId, fields })
  }

  deleteColumn(boardId: string, columnId: string): void {
    this.socketService.emit(SocketEventsEnum.columnDelete, { boardId, columnId });
  }
}
