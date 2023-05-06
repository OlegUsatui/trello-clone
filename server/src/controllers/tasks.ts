import {ExpressRequestInterface} from "../types/expressRequest.interface";
import {NextFunction, Response} from "express";
import TaskModel from "../models/task";
import {Server} from "socket.io";
import {Socket} from "../types/socket.interface";
import {SocketEventsEnum} from "../types/socketEvents.enum";
import {getErrorMessage} from "../helpers";

export const getTasks = async (
    req: ExpressRequestInterface,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            return res.sendStatus(401);
        }
        const tasks = await TaskModel.find({ boardId: req.params.boardId });
        res.send(tasks);
    } catch (err) {
        next(err);
    }
};

export const createTask = async (
    io: Server,
    socket: Socket,
    data: { boardId: string; title: string, columnId: string, description: string }
) => {
    try {
        if (!socket.user) {
            socket.emit(
                SocketEventsEnum.taskCreateFailure,
                "User is not authorized"
            );
            return;
        }
        const newTask = new TaskModel({
            title: data.title,
            description: data.description,
            boardId: data.boardId,
            userId: socket.user.id,
            columnId: data.columnId
        });
        const savedTask = await newTask.save();
        io.to(data.boardId).emit(
            SocketEventsEnum.taskCreateSuccess,
            savedTask
        );
    } catch (err) {
        socket.emit(SocketEventsEnum.taskCreateFailure, getErrorMessage(err));
    }
};

export const updateTask = async (
  io: Server,
  socket: Socket,
  data: { boardId: string, taskId: string, fields: {title?: string, description?: string, columnId?: string} }
) =>  {
    try {
        if(!socket.user) {
            socket.emit(SocketEventsEnum.taskUpdateFailure, 'User is not authorized')
            return
        }
        const newTask = await TaskModel.findByIdAndUpdate(data.taskId, data.fields, { new: true })
        io.to(data.boardId).emit(SocketEventsEnum.taskUpdateSuccess, newTask)
    } catch (err) {
        socket.emit(SocketEventsEnum.taskUpdateFailure, getErrorMessage(err))
    }
};

export const deleteTask = async (
  io: Server,
  socket: Socket,
  data: { boardId: string, taskId: string }
) =>  {
    try {
        if(!socket.user) {
            socket.emit(SocketEventsEnum.taskDeleteFailure, 'User is not authorized');
            return;
        }
        await TaskModel.findByIdAndDelete({ _id: data.taskId });
        io.to(data.boardId).emit(SocketEventsEnum.taskDeleteSuccess, data.taskId);
    } catch (err) {
        socket.emit(SocketEventsEnum.taskDeleteFailure, getErrorMessage(err))
    }
};
