import { Request } from "express";

export interface IRequest extends Request {
  user?: any;
}

export interface UserResponse {
  email: string;
  firstname: string;
  lastname: string;
  roles?: any;
}

export interface BookResponse {
  title: string;
  isbn: string;
  quantity: number;
  resume: string;
  isValid: boolean;
  publishedAt?: Date;
  authorId?: number;
  author?: object;
}
