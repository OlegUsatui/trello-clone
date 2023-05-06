import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { combineLatest, filter, map, Observable, Subject, takeUntil } from 'rxjs';
import { BoardsService } from 'src/app/shared/services/boards.service';
import { ColumnsService } from 'src/app/shared/services/columns.service';
import { SocketService } from 'src/app/shared/services/socket.service';
import { BoardInterface } from 'src/app/shared/types/board.interface';
import { ColumnInterface } from 'src/app/shared/types/column.interface';
import { SocketEventsEnum } from 'src/app/shared/types/socketEvents.enum';
import { BoardService } from '../../services/board.service';
import { ColumnRequestInterface } from '../../../shared/types/columnRequest.interface';
import {TaskInterface} from "../../../shared/types/task.interface";
import {TasksService} from "../../../shared/services/tasks.service";
import {TaskRequestInterface} from "../../../shared/types/taskRequest.interface";

@Component({
  selector: 'board',
  templateUrl: './board.component.html',
})
export class BoardComponent implements OnInit, OnDestroy {
  boardId: string;
  data$: Observable<{
    board: BoardInterface;
    columns: ColumnInterface[];
    tasks: TaskInterface[];
  }>;
  destroy$ = new Subject<void>()

  constructor(
    private boardsService: BoardsService,
    private route: ActivatedRoute,
    private router: Router,
    private boardService: BoardService,
    private socketService: SocketService,
    private columnsService: ColumnsService,
    private tasksService: TasksService,
  ) {
    const boardId = this.route.snapshot.paramMap.get('boardId');

    if (!boardId) {
      throw new Error('Cant get boardID from url');
    }

    this.boardId = boardId;
    this.data$ = combineLatest([
      this.boardService.board$.pipe(filter(Boolean)),
      this.boardService.columns$,
      this.boardService.tasks$,
    ]).pipe(
      map(([board, columns, tasks]) => ({
        board,
        columns,
        tasks
      }))
    );
  }

  ngOnInit(): void {
    this.socketService.emit(SocketEventsEnum.boardsJoin, {
      boardId: this.boardId,
    });
    this.fetchData();
    this.initializeListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeListeners(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart && !event.url.includes('/boards/')) {
        this.boardService.leaveBoard(this.boardId);
      }
    });

    this.socketService
      .listen<ColumnInterface>(SocketEventsEnum.columnCreateSuccess)
      .pipe(takeUntil(this.destroy$))
      .subscribe(column => {
      this.boardService.addColumn(column)
    })

    this.socketService
      .listen<TaskInterface>(SocketEventsEnum.taskCreateSuccess)
      .pipe(takeUntil(this.destroy$))
      .subscribe(task => {
        this.boardService.addTask(task)
      })

    this.socketService
      .listen<BoardInterface>(SocketEventsEnum.boardsUpdateSuccess)
      .pipe(takeUntil(this.destroy$))
      .subscribe(updatedBoard => {
        this.boardService.updateBoard(updatedBoard)
      })

    this.socketService
      .listen<void>(SocketEventsEnum.boardsDeleteSuccess)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.router.navigateByUrl('/boards')
      })

    this.socketService
      .listen<string>(SocketEventsEnum.columnDeleteSuccess)
      .pipe(takeUntil(this.destroy$))
      .subscribe((columnId) => {
        this.boardService.deleteColumn(columnId)
      })

    this.socketService
      .listen<ColumnInterface>(SocketEventsEnum.columnUpdateSuccess)
      .pipe(takeUntil(this.destroy$))
      .subscribe((updatedColumn) => {
        this.boardService.updateColumn(updatedColumn)
      })

    this.socketService
      .listen<TaskInterface>(SocketEventsEnum.taskUpdateSuccess)
      .pipe(takeUntil(this.destroy$))
      .subscribe(updatedTask => {
        this.boardService.updateTask(updatedTask)
      })

    this.socketService
      .listen<string>(SocketEventsEnum.taskDeleteSuccess)
      .pipe(takeUntil(this.destroy$))
      .subscribe((taskId) => {
        this.boardService.deleteTask(taskId)
      })
  }

  fetchData(): void {
    this.boardsService.getBoard(this.boardId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((board) => {
      this.boardService.setBoard(board);
    });

    this.columnsService.getColumns(this.boardId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((columns) => {
      this.boardService.setColumns(columns);
    });

    this.tasksService.getTasks(this.boardId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((tasks) => {
      this.boardService.setTasks(tasks);
    });
  }

  createColumn(title: string): void {
    const columnInput: ColumnRequestInterface = {
      title,
      boardId: this.boardId
    }
    this.columnsService.createColumn(columnInput)
  }

  createTask(columnId: string, title: string): void {
    const newTask: TaskRequestInterface = {
      title,
      boardId: this.boardId,
      columnId
    }
    this.tasksService.createTask(newTask)
  }

  getTasksByColumn(columnId: string, tasks: TaskInterface[]): TaskInterface[] {
    return tasks.filter(task => task.columnId === columnId)
  }

  updateBoardName(boardName: string): void {
    this.boardsService.updateBoard(this.boardId, { title: boardName })
  }

  deleteBoard(): void {
    if(confirm('Are you sure that you want to delete this board?')) {
      this.boardsService.deleteBoard(this.boardId);
    }
  }

  deleteColumn(columnId: string) {
    if(confirm('Are you sure that you want to delete this column?')) {
      this.columnsService.deleteColumn(this.boardId, columnId);
    }
  }

  updateColumnName(columnId: string, columnName: string) {
    this.columnsService.updateColumn(this.boardId, columnId, { title: columnName })
  }

  openTask(columnId: string, taskId: string): void {
    this.router.navigate(['boards', this.boardId, 'tasks', taskId])
  }
}
