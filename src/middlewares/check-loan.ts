import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { PrismaClient, User } from "@prisma/client";
import { IRequest } from "../models";

dotenv.config();
const prisma = new PrismaClient();

const tokenSecret = process.env.TOKEN_SECRET!;
if (!tokenSecret) {
  throw new Error("Des informations manquent dans le .env");
}

async function checkLoan(req: IRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user.id;

    // VERIFIER SI LE USER A DEJA UN EMPRUNT NON RETOURNER A SON ACTIF

    const loan = await prisma.loan.findFirst({
      where: {
        userId: userId,
        returnAt: null,
      },
    });

    if (loan && req.url === "/loan")
      res.status(403).json({ message: "Vous avez déja un emprunt en cours" });

    if (!loan && req.url === "/return")
      res.status(403).json({ message: "Vous n'avez pas d'emprunt en cours" });

    next();
  } catch (error) {
    res.status(401).json({
      message: "Vous devez vous authentifier!",
    });
    console.log(error);
  }
}

export default checkLoan;
