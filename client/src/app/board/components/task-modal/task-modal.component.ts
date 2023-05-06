import { Component, HostBinding, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { filter, map, Observable, combineLatest, Subject, takeUntil } from 'rxjs';
import { BoardService } from '../../services/board.service';
import { TaskInterface } from '../../../shared/types/task.interface';
import { ColumnInterface } from '../../../shared/types/column.interface';
import { SocketService } from '../../../shared/services/socket.service';
import { SocketEventsEnum } from '../../../shared/types/socketEvents.enum';
import { TasksService } from '../../../shared/services/tasks.service';

@Component({
  selector: 'app-task-modal',
  templateUrl: './task-modal.component.html',
  styleUrls: ['./task-modal.component.scss']
})
export class TaskModalComponent implements OnDestroy {
  @HostBinding('class') classes = 'task-modal';
  boardId: string;
  taskId: string;
  task$: Observable<TaskInterface>;
  data$: Observable<{ task: TaskInterface, columns: ColumnInterface[] }>;
  destroy$ = new Subject<void>()
  columnGroup = this.fb.group({
    columnId: [null]
  })

  constructor(private route: ActivatedRoute,
              private router: Router,
              private boardService: BoardService,
              private tasksService: TasksService,
              private fb: FormBuilder,
              private socketService: SocketService) {
    const taskId = route.snapshot.paramMap.get('taskId')
    const boardId = route.parent?.snapshot.paramMap.get('boardId')

    if (!taskId) {
      throw new Error('Cant get taskID from url')
    }
    if (!boardId) {
      throw new Error('Cant get BoardID from url')
    }

    this.boardId = boardId;
    this.taskId = taskId;
    this.task$ = this.boardService.tasks$.pipe(
      map(tasks => tasks.find(task => task.id === this.taskId)),
      filter(Boolean)
    )
    this.data$ = combineLatest([this.task$, this.boardService.columns$]).pipe(
      map(([task, columns]) => ({ task, columns }))
    )
    this.initListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initListeners(): void {
    this.task$.pipe(takeUntil(this.destroy$)).subscribe(task => {
      this.columnGroup.patchValue({ columnId: task.columnId });
    })

    combineLatest([this.task$, this.columnGroup.get('columnId')!.valueChanges])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([task, columnId]) => {
        if (task.columnId !== columnId) {
          this.tasksService.updateTask(this.boardId, this.taskId, { columnId });
        }
      })

    this.socketService
      .listen<string>(SocketEventsEnum.taskDeleteSuccess)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.goToBoard();
      })
  }

  goToBoard(): void {
    this.router.navigate(['boards', this.boardId])
  }

  updateTaskName(taskName: string): void {
    this.tasksService.updateTask(this.boardId, this.taskId, {
      title: taskName,
    })
  }

  updateTaskDescription(description: string) {
    this.tasksService.updateTask(this.boardId, this.taskId, {
      description,
    })
  }

  deleteTask() {
    this.tasksService.deleteTask(this.boardId, this.taskId);
  }
}
