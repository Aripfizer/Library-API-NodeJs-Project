import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import * as cache from "memory-cache";
import { IRequest } from "../models";

dotenv.config();
const prisma = new PrismaClient();

const tokenSecret = process.env.TOKEN_SECRET!;
if (!tokenSecret) {
  throw new Error("Des informations manquent dans le .env");
}
const checkRouteMatch = async (url: string, method: string, routes: any) => {
  return routes.some((route: any) => {
    const methodMatches = route.method === method;
    const urlMatches = new RegExp(route.url).test(url);
    return methodMatches && urlMatches;
  });
};

const checkUserPermissions = async (
  req: IRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const roles = req.user.roles;
    const { url, method } = {
      url: req.originalUrl,
      method: req.method,
    };

    console.log(`Received ${method} request to ${url}`);

    const permissions = await prisma.permission.findMany({
      where: {
        roles: {
          some: {
            roleId: {
              in: roles,
            },
          },
        },
      },
      select: {
        name: true,
        method: true,
        url: true,
      },
      distinct: ["name"],
    });

    const isRouteMatch = checkRouteMatch(url, method, permissions);

    if (!isRouteMatch) throw new Error("Vous n'etes pas authorisé");
    next();
  } catch (error) {
    res.status(403).json({
      message: "Vous n'avez pas les permissions necessaires!",
    });
  }
};

export default checkUserPermissions;
