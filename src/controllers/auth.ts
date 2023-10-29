import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
dotenv.config();
import * as cache from "memory-cache";
import { IRequest } from "../models";
import { UserResponse } from "../models";

const tokenSecret = process.env.TOKEN_SECRET!;
if (!tokenSecret) {
  throw new Error("Des informations manquent dans le .env");
}

const prisma = new PrismaClient();

prisma.$use((params, next) => {
  if (params.model === "User" && params.action === "create") {
    params.args.data.password = hashPassword(params.args.data.password);
  }
  return next(params);
});

function hashPassword(password: any) {
  let salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

function generateAuthToken(user: any) {
  try {
    let rolesId = user.roles.map((role: any) => {
      return role.roleId;
    });

    const authToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        roles: rolesId,
      },
      tokenSecret,
      {
        expiresIn: "1h",
      }
    );
    return authToken;
  } catch (err: any) {
    throw new Error(`Erreur lors de la génération du token: ${err.message}`);
  }
}

async function login(req: Request, res: Response) {
  try {
    let { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email: email },
      include: { roles: true },
    });
    if (!user) throw new Error("User not found");

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) throw new Error("User not found");

    const authToken = generateAuthToken(user);
    cache.put(authToken, true, 3600000);

    res.status(200).json({ token: authToken });
  } catch (error) {
    res.status(404).json({
      message: "User not found",
    });
    console.log(error);
  }
}

async function register(req: Request, res: Response) {
  try {
    let { lastname, firstname, email } = req.body;
    let newUser = await prisma.user.create({
      data: {
        lastname: lastname,
        firstname: firstname,
        email: email,
        password: "Pass*1",
        roles: {
          create: {
            role: {
              connect: { id: 3 },
            },
          },
        },
      },
    });

    const userResponse: UserResponse = {
      lastname: newUser.lastname,
      firstname: newUser.firstname,
      email: newUser.email,
    };

    res.status(201).json(userResponse);
  } catch (error: any) {
    res.status(500).json({message: "Erreur lors de l'inscription"});
    console.log(error);
    throw new Error("Erreur lors de l'inscription");
  }
}

async function logout(req: IRequest, res: Response) {
  try {
    if (!req.header("Authorization"))
      throw new Error("Vous n'etes pas connecter");

    const authToken = req.header("Authorization")?.replace("Bearer ", "")!;
    const decodedToken: any = jwt.verify(authToken, tokenSecret);
    
    if (decodedToken) cache.put(authToken, false, 3600000);

    res.status(200).json({
      message: "Déconnexion Effectuée",
    });
  } catch (error) {
    res.status(403).json({
      message: "Vous devez vous authentifier",
    });
    console.log(error);
  }
}

export { login, register, logout };
