import { NextFunction, Response } from "express";
import { ExpressRequestInterface } from "../types/expressRequest.interface";
import ColumnModel from "../models/column";
import { Server } from "socket.io";
import { Socket } from "../types/socket.interface";
import { SocketEventsEnum } from "../types/socketEvents.enum";
import { getErrorMessage } from "../helpers";
import BoardModel from '../models/board';

export const getColumns = async (
  req: ExpressRequestInterface,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
    const columns = await ColumnModel.find({ boardId: req.params.boardId });
    res.send(columns);
  } catch (err) {
    next(err);
  }
};

export const createColumn = async (
  io: Server,
  socket: Socket,
  data: { boardId: string; title: string }
) => {
  try {
    if (!socket.user) {
      socket.emit(
        SocketEventsEnum.columnCreateFailure,
        "User is not authorized"
      );
      return;
    }
    const newColumn = new ColumnModel({
      title: data.title,
      boardId: data.boardId,
      userId: socket.user.id,
    });
    const savedColumn = await newColumn.save();
    io.to(data.boardId).emit(
      SocketEventsEnum.columnCreateSuccess,
      savedColumn
    );
    console.log("savedColumn", savedColumn);
  } catch (err) {
    socket.emit(SocketEventsEnum.columnCreateFailure, getErrorMessage(err));
  }
};

export const deleteColumn = async (
  io: Server,
  socket: Socket,
  data: { boardId: string, columnId: string }
) =>  {
  try {
    if(!socket.user) {
      socket.emit(SocketEventsEnum.columnDeleteFailure, 'User is not authorized');
      return;
    }
    await ColumnModel.findByIdAndDelete({ _id: data.columnId });
    io.to(data.boardId).emit(SocketEventsEnum.columnDeleteSuccess, data.columnId);
  } catch (err) {
    socket.emit(SocketEventsEnum.columnDeleteFailure, getErrorMessage(err))
  }
};

export const updateColumn = async (
  io: Server,
  socket: Socket,
  data: { boardId: string, columnId: string, fields: {title: string} }
) =>  {
  try {
    if(!socket.user) {
      socket.emit(SocketEventsEnum.columnUpdateFailure, 'User is not authorized')
      return
    }
    const newColumn = await ColumnModel.findByIdAndUpdate(data.columnId, data.fields, { new: true })
    io.to(data.boardId).emit(SocketEventsEnum.columnUpdateSuccess, newColumn)
  } catch (err) {
    socket.emit(SocketEventsEnum.columnUpdateFailure, getErrorMessage(err))
  }
};
