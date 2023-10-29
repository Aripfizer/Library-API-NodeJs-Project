import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { Book, PrismaClient } from "@prisma/client";

const prisma: any = new PrismaClient();

@ValidatorConstraint({ async: true })
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  async validate(value: any, args: ValidationArguments) {
    const [entity, field] = args.constraints;
    const result = await prisma[entity].findFirst({
      where: {
        [field]: value,
      },
    });
    return !result;
  }

  defaultMessage(args: ValidationArguments) {
    const [entity, field] = args.constraints;
    return `${field} est déjà utilisé par un autre ${entity}.`;
  }
}

export function IsUnique(
  entity: string,
  field: string,
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [entity, field],
      validator: IsUniqueConstraint,
    });
  };
}

@ValidatorConstraint({ async: true })
export class IsAvailableConstraint implements ValidatorConstraintInterface {
  async validate(value: any, args: ValidationArguments) {
    const [entity, field] = args.constraints;
    let isArray = Array.isArray(value);
    if (isArray) {
      const distinctIds = [...new Set(value)];
      const dataToCheck = await prisma[entity].findMany({
        where: {
          AND: [
            {
              [field]: {
                in: distinctIds,
              },
            },
          ],
        },
        select: {
          [field]: true,
        },
      });
      const existingFields = dataToCheck.map((data: any) => data.id);
      return existingFields.length === distinctIds.length;
    } else {
      const result = await prisma[entity].findFirst({
        where: {
          [field]: value,
        },
      });
      return result;
    }
  }

  defaultMessage(args: ValidationArguments) {
    const [entity, field] = args.constraints;
    return `${field} est déjà utilisé par un autre ${entity}.`;
  }
}

export function IsAvailable(
  entity: string,
  field: string,
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [entity, field],
      validator: IsAvailableConstraint,
    });
  };
}

export function IsBookIdExists(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: "isBookIdExists",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        async validate(value: any, args: ValidationArguments) {
          const bookIds = value as number[];
          const booksToCheck = await prisma.book.findMany({
            where: {
              AND: [
                {
                  id: {
                    in: bookIds,
                  },
                },
                {
                  isValid: true,
                },
              ],
            },
            select: {
              id: true,
            },
          });
          const existingIds = booksToCheck.map((book: any) => book.id);
          return (
            bookIds.length === existingIds.length &&
            bookIds.every((id) => existingIds.includes(id))
          );
        },
      },
    });
  };
}

export function IsRoleIdExists(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: "isRoleIdExists",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        async validate(value: any, args: ValidationArguments) {
          // const roleIds = value as number[];

          console.log("DATA  ......");
          return false;
        },
      },
    });
  };
}
export function IsBookAvalableToLoan(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: "isBookAvalableToLoan",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        async validate(value: any, args: ValidationArguments) {
          const books = value as number[];
          const booksToCheck = await Promise.all(
            books.map((book: any) => {
              return prisma.book.findFirst({ where: { id: book.id } });
            })
          );

          for (let i = 0; i < booksToCheck.length; i++) {
            const book: any = booksToCheck[i];
            const loanCount = await prisma.loan.count({
              where: { bookId: book.id, returnAt: null },
            });
            if (loanCount >= book.quantity) {
              return false;
            }
          }
          return true;
        },
      },
    });
  };
}

export function IsValidReturnDate(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: "isValidReturnDate",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        async validate(value: any, args: ValidationArguments) {
          const supposedReturnAt = new Date(value);
          const loanAt = object.loanAt;
          if (supposedReturnAt <= loanAt) {
            return false;
          }
          return true;
        },
      },
    });
  };
}
