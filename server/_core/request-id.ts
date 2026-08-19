import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

export const REQUEST_ID_HEADER = "x-request-id";

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const supplied = req.header(REQUEST_ID_HEADER)?.trim();
  const requestId = supplied && /^[A-Za-z0-9._:-]{1,128}$/.test(supplied)
    ? supplied
    : randomUUID();

  res.setHeader(REQUEST_ID_HEADER, requestId);
  res.locals.requestId = requestId;
  next();
}
