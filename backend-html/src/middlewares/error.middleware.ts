import { NextFunction, Request, Response } from 'express';
import { HttpException } from '../exceptions/HttpException';

/**
 * Middleware that makes sure any exceptions get logged to console/cloudwatch
 * before being processed in the rest of Express.
 *
 * @param error
 * @param req
 * @param res
 * @param next
 */
export const errorMiddleware = (error: HttpException, req: Request, res: Response, next: NextFunction) => {
  try {
    const status: number = error.status || 500;
    const message: string = error.message || 'Something went wrong';

    console.log(`StatusCode : ${status}, Message : ${message}`);

    res.status(status).json({ message });
  } catch (error) {
    next(error);
  }
};
