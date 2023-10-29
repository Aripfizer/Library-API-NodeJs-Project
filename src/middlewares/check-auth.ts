import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { IRequest } from "../models";
import * as cache from "memory-cache";

dotenv.config();
const prisma = new PrismaClient();

const tokenSecret = process.env.TOKEN_SECRET!;
if (!tokenSecret) {
  throw new Error("Des informations manquent dans le .env");
}

function checkAuth(req: IRequest, res: Response, next: NextFunction) {
  try {
    const authToken = req.header("Authorization")?.replace("Bearer ", "")!;
    if (!authToken || (cache.get(authToken) !== null && !cache.get(authToken)))
      throw new Error("Token invalid");
    req.user = jwt.verify(authToken, tokenSecret);
    next();
  } catch (error) {
    res.status(401).json({
      message: "Vous devez vous authentifier!",
    });
    console.log(error);
  }
}

export default checkAuth;
