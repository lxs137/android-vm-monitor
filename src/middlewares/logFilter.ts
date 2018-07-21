import { Response, Request, NextFunction, RequestHandler } from "express";

export const filterLogResHeader = "filterRouter";

export const filterLog = (req: Request, res: Response, next: NextFunction) => {
  res.locals[filterLogResHeader] = true;
  next();
};