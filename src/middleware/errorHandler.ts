import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    Logger.error(`Operational Error: ${err.message}`, {
      path: req.path,
      method: req.method,
    });

    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  
  Logger.error('Unexpected Error:', err);
  
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};