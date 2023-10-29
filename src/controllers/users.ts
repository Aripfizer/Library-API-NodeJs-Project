import { Request, Response } from "express";
import { PrismaClient, User, UserRoles } from "@prisma/client";
import * as dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { IRequest, UserResponse } from "../models";
import { EmailSender } from "../Mails/mailer";
import {
  UserRegisterDto,
  UserRolesAddDto,
  UserUpdateDto,
  checkErrors,
} from "../middlewares/validator";

dotenv.config();

const prisma = new PrismaClient();

prisma.$use(async (params, next) => {
  if (params.model === "User" && params.action === "create") {
    params.args.data.password = await hashPassword(params.args.data.password);
  }
  return next(params);
});

const hashPassword = async (password: any) => {
  let salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const getUsers = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const perPage = parseInt(req.query.perpage as string) || 10;

  const users = await prisma.user.findMany({
    select: {
      firstname: true,
      lastname: true,
      email: true,
      roles: {
        select: {
          role: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    skip: perPage * (page - 1),
    take: perPage,
  });
  res.status(200).json(users);
};

const getAuthenticateUser = (req: IRequest, res: Response) => {
  res.status(200).json(req.user);
};

const getUser = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.userId);
    const user = await prisma.user.findUnique({
      where: { id: id },
      include: {
        roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
    if (!user) {
      return res.status(404).send("User not found");
    }

    const userResponse: UserResponse = {
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      roles: user.roles,
    };
    res.status(200).json(userResponse);
  } catch (error) {
    res.status(500).send("Erreur lors de la recuperation de l'utilisateur");
    console.log(error);
    throw new Error("Erreur lors de la recuperation de l'utilisateur");
  }
};

function generatePassword() {
  const lowercaseLetters = "abcdefghijklmnopqrstuvwxyz";
  const uppercaseLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const specialCharacters = "!@#$%^&*?";
  const numbers = "0123456789";

  let password = "";

  // Ajoute une lettre minuscule aléatoire
  password += lowercaseLetters.charAt(
    Math.floor(Math.random() * lowercaseLetters.length)
  );

  // Ajoute une lettre majuscule aléatoire
  password += uppercaseLetters.charAt(
    Math.floor(Math.random() * uppercaseLetters.length)
  );

  // Ajoute un caractère spécial aléatoire
  password += specialCharacters.charAt(
    Math.floor(Math.random() * specialCharacters.length)
  );

  // Ajoute un chiffre aléatoire
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));

  // Ajoute des caractères aléatoires supplémentaires jusqu'à ce que la longueur souhaitée soit atteinte
  while (password.length < 8) {
    const randomChar = Math.floor(Math.random() * 4);
    if (randomChar === 0) {
      password += lowercaseLetters.charAt(
        Math.floor(Math.random() * lowercaseLetters.length)
      );
    } else if (randomChar === 1) {
      password += uppercaseLetters.charAt(
        Math.floor(Math.random() * uppercaseLetters.length)
      );
    } else if (randomChar === 2) {
      password += specialCharacters.charAt(
        Math.floor(Math.random() * specialCharacters.length)
      );
    } else {
      password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
  }

  return password;
}

const createUser = async (req: Request, res: Response) => {
  try {
    let { firstname, lastname, email, roles } = req.body;

    let user = new UserRegisterDto();
    user.email = email;
    user.firstname = firstname;
    user.lastname = lastname;
    user.roles = roles;

    const errors = await checkErrors(user);
    if (errors.length) return res.status(400).json(errors);

    //GENERATE PASS
    const password = generatePassword();

    let newUser: any = await prisma.user.create({
      data: {
        firstname: firstname,
        lastname: lastname,
        email: email,
        password: password,
      },
    });

    if (!roles || !roles.length) roles = [3];

    await prisma.userRoles.createMany({
      data: roles.map((id: number) => {
        return { userId: newUser.id, roleId: id };
      }),
    });

    newUser = await prisma.user.findUnique({
      where: { id: newUser.id },
      include: {
        roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // SEND EMAIL
    let emailSender = new EmailSender();
    await emailSender.sendEmail(
      email,
      "Inscription sur Stone Library",
      `Vous identifiants de connexion sont :\n email : ${email} \n password : ${password}`
    );

    const userResponse: UserResponse = {
      lastname: newUser.lastname,
      firstname: newUser.firstname,
      email: newUser.email,
      roles: newUser.roles,
    };

    res.status(201).json(userResponse);
  } catch (error: any) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Erreur lors de l'ajout de l'utilisateur" });
    throw new Error("Erreur lors de l'ajout de l'utilisateur");
  }
};

const addRoles = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);
    let { roles } = req.body;

    let roleDto = new UserRolesAddDto();
    roleDto.roles = roles;

    const errors = await checkErrors(roleDto);
    if (errors.length) return res.status(400).json(errors);

    if (!userId) return res.status(404).json({ message: "Vous devez selectionner un utilisateur" });
    // if () return res.status(404).json({ message: "Vous devez selectionner un utilisateur" });

    let findedUser: any = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!findedUser) return res.status(404).json("User Not found");

    await Promise.all(
      roles.map((id: number) => {
        return prisma.userRoles.upsert({
          where: {
            roleId_userId: {
              roleId: id,
              userId: userId,
            },
          },
          create: {
            userId: userId,
            roleId: id,
          },
          update: {},
        });
      })
    );

    findedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        lastname: true,
        firstname: true,
        email: true,
        roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(findedUser);
  } catch (error: any) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Erreur lors de l'ajout de l'utilisateur" });
    throw new Error("Erreur lors de l'ajout de l'utilisateur");
  }
};

const updateUser = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.userId);
    let { firstname, lastname, email } = req.body;

    if (
      !Object.values(req.body).some((value) => value !== null) ||
      !Object.values(req.body).some((value) => value !== "")
    ) {
      const errors = { message: "Au moins un champ doit être fourni" };
      return res.status(400).json(errors);
    }

    let user = new UserUpdateDto();
    user.email = email;
    user.firstname = firstname;
    user.lastname = lastname;

    const errors = await checkErrors(user);
    if (errors.length) return res.status(400).json(errors);

    let findedUser = await prisma.user.findUnique({ where: { id: id } });
    if (!findedUser) res.status(404).json("User Not found");

    const updateData: Record<string, any> = {};

    if (email !== undefined && email !== null) updateData.email = email;

    if (firstname !== undefined && firstname !== null)
      updateData.firstname = firstname;

    if (lastname !== undefined && lastname !== null)
      updateData.lastname = lastname;

    findedUser = await prisma.user.update({
      where: { id: id },
      data: updateData,
    });

    const userResponse: UserResponse = {
      lastname: findedUser.lastname,
      firstname: findedUser.firstname,
      email: findedUser.email,
    };

    res.status(200).json(userResponse);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Erreur lors du mise a jour de l'utilisateur" });
    throw new Error("Erreur lors du mise a jour de l'utilisateur");
  }
};

const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.userId);
    let user = await prisma.user.findUnique({ where: { id: id } });

    if (!user || user.email === process.env.ADMIN_EMAIL) {
      res.status(404).json({ message: "Book Not found" });
    } else {
      const deleteRoles = prisma.userRoles.deleteMany({
        where: { userId: id },
      });
      const deleteBooks = prisma.book.deleteMany({ where: { authorId: id } });
      const deleteUser = prisma.user.delete({ where: { id: id } });
      await prisma.$transaction([deleteRoles, deleteBooks, deleteUser]);

      res.status(200).json({
        message: `L'utilisateur '${user.lastname} ${user.firstname}' a été supprimer avec success !`,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la suppression de l'utilisateur",
    });
    console.log(error);
    throw new Error("Erreur lors de la suppression de l'utilisateur");
  }
};

export {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getAuthenticateUser,
  addRoles,
};
