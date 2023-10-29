import { body, validationResult, ValidationChain } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient({ errorFormat: "pretty" });

export const validate: any = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors: any = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors: Record<string, string>[] = [];
  errors
    .array()
    .map((err: any) => extractedErrors.push({ [err.param]: err.msg }));

  return res.status(422).json({
    errors: extractedErrors,
  });
};

// USER LOGIN

export const userLoginValidationRules = (): ValidationChain[] => {
  return [
    body("email")
      .isEmail()
      .withMessage("Veuillez entrer une adresse email valide"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Le mot de passe doit comporter au moins 6 caractères")
      .matches(/[a-z]/)
      .withMessage(
        "Le mot de passe doit comporter au moins une lettre minuscule"
      )
      .matches(/[A-Z]/)
      .withMessage(
        "Le mot de passe doit comporter au moins une lettre majuscule"
      )
      .matches(/[0-9]/)
      .withMessage("Le mot de passe doit comporter au moins un chiffre")
      .matches(/[!@#$%^&*(),.?":{}|<>]/)
      .withMessage(
        "Le mot de passe doit comporter au moins un caractère spécial"
      ),
  ];
};

//USER REGISTER

export const userRegisterValidationRules = (): ValidationChain[] => {
  return [
    body("email")
      .isEmail()
      .withMessage("Veuillez entrer une adresse email valide")
      .custom(async (value, { req }) => {
        const user = await prisma.user.findFirst({
          where: {
            email: value,
          },
        });

        if (user) {
          throw new Error("L'adresse email est déjà enregistrée");
        }
        return true;
      }),
    body("firstname")
      .notEmpty()
      .withMessage("Le prénom est obligatoire")
      .isString()
      .withMessage("Le prénom doit être une chaîne de caractères"),
    body("lastname")
      .notEmpty()
      .withMessage("Le nom est obligatoire")
      .isString()
      .withMessage("Le nom doit être une chaîne de caractères"),
  ];
};

//USER Create

export const userCreateValidationRules = (): ValidationChain[] => {
  return [
    body("email")
      .isEmail()
      .withMessage("Veuillez entrer une adresse email valide")
      .custom(async (value, { req }) => {
        const user = await prisma.user.findFirst({
          where: {
            email: value,
          },
        });
        if (user) {
          throw new Error("L'adresse email est déjà utilisé");
        }
        return true;
      }),
    body("firstname")
      .notEmpty()
      .withMessage("Le prénom est obligatoire")
      .isString()
      .withMessage("Le prénom doit être une chaîne de caractères"),
    body("lastname")
      .notEmpty()
      .withMessage("Le nom est obligatoire")
      .isString()
      .withMessage("Le nom doit être une chaîne de caractères"),
  ];
};
//USER Update

export const userUpdateValidationRules = (): ValidationChain[] => {
  return [
    body("email")
      .isEmail()
      .withMessage("Veuillez entrer une adresse email valide")
      .custom(async (value, { req }) => {
        const user = await prisma.user.findFirst({
          where: {
            email: value,
          },
        });
        if (user) {
          throw new Error("L'adresse email est déjà utiliser");
        }
        return true;
      }),

    body("firstname")
      .notEmpty()
      .withMessage("Le prénom est obligatoire")
      .isString()
      .withMessage("Le prénom doit être une chaîne de caractères"),
    body("lastname")
      .notEmpty()
      .withMessage("Le nom est obligatoire")
      .isString()
      .withMessage("Le nom doit être une chaîne de caractères"),
  ];
};

//Role create

export const roleCreateValidationRules = (): ValidationChain[] => {
  return [
    body("name")
      .notEmpty()
      .withMessage("Le nom est obligatoire")
      .isString()
      .withMessage("Le nom doit être une chaîne de caractères")
      .custom(async (value, { req }) => {
        const role = await prisma.role.findFirst({
          where: {
            name: value,
          },
        });

        if (role) {
          throw new Error("Le role '" + role.name + "' existe déja !");
        }
        return true;
      }),
  ];
};
//Role update

export const roleUpdateValidationRules = (): ValidationChain[] => {
  return [
    body("name")
      .notEmpty()
      .withMessage("Le nom est obligatoire")
      .isString()
      .withMessage("Le nom doit être une chaîne de caractères"),
  ];
};

//BOOK CREATE

export const bookCreateValidationRules = (): ValidationChain[] => {
  return [
    body("title")
      .notEmpty()
      .withMessage("Le titre est obligatoire")
      .isString()
      .withMessage("Le nom doit être une chaîne de caractères")
      .custom(async (value, { req }) => {
        const book = await prisma.book.findFirst({
          where: {
            title: value,
          },
        });

        if (book) {
          throw new Error("Le livre intitulé '" + value + "' existe déja !");
        }
        return true;
      }),
    body("resume")
      .notEmpty()
      .withMessage("La description est obligatoire")
      .isString()
      .withMessage("Le nom doit être une chaîne de caractères"),
    body("isbn")
      .notEmpty()
      .withMessage("L'ISBN' est obligatoire")
      .isString()
      .withMessage("Le nom doit être une chaîne de caractères")
      .custom(async (value, { req }) => {
        const book = await prisma.book.findFirst({
          where: {
            isbn: value,
          },
        });

        if (book) {
          throw new Error("L'ISBN '" + value + "' existe déja !");
        }
        return true;
      }),
    body("quantity")
      .optional()
      .isInt()
      .withMessage("La quantité doit être un entier"),
  ];
};

//BOOK LOAN

export const bookLoanValidationRules = (): ValidationChain[] => {
  return [
    body("books")
      .isArray({ min: 1, max: Number(process.env.MAX_BOOK_PER_LOAN) })
      .withMessage(
        "Au moins un livre et au plus " +
          process.env.MAX_BOOK_PER_LOAN +
          " doit être spécifié"
      )
      .custom(async (value: number[]) => {
        const distinctIds = [...new Set(value)];
        if (distinctIds.length !== value.length) {
          throw new Error("Vous devez choisir des livres distincts");
        }

        const booksToCheck = await prisma.book.findMany({
          where: {
            AND: [
              {
                id: {
                  in: value,
                },
              },
              {
                isValid: true,
              },
            ],
          },
        });

        if (booksToCheck.length !== distinctIds.length) {
          throw new Error("Certains livres spécifiés n'existent pas");
        }
        
        const loans = await prisma.loan.findMany({
          where: {
            AND: [
              {
                bookId: {
                  in: value,
                },
              },
              {
                returnAt: null,
              },
            ],
          },
        });

        const bookCounts: any = {};

        loans.forEach((loan) => {
          const bookId = loan.bookId;
          if (bookCounts[bookId]) {
            bookCounts[bookId]++;
          } else {
            bookCounts[bookId] = 1;
          }
        });
        booksToCheck.forEach((book) => {
          const bookId = book.id;
          const bookCount = bookCounts[bookId] || 0;
          const availableQuantity = book.quantity - bookCount;
          if (availableQuantity <= 0) {
            throw new Error(
              `Le livre '${book.title}' n'est pas disponible pour l'emprunt`
            );
          }
        });

        return true;
      }),
    body("loanAt")
      .notEmpty()
      .withMessage("La date d'emprunt est obligatoire")
      .isAfter(new Date().toString())
      .withMessage(
        "La date d'emprunt doit être à partir de l'instant présent"
      ),
    body("supposedReturnAt")
      .notEmpty()
      .withMessage("La date prévue du retour est obligatoire")

      .custom((value, { req }) => {
        const supposedReturnAt = new Date(value);
        const loanAt = new Date(req.body.loanAt);
        if (supposedReturnAt <= loanAt) {
          throw new Error(
            `La date prévue de retour doit être supérieure à la date de l'emprunt`
          );
        }
        return true;
      }),
  ];
};
