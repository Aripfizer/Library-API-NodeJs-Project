import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import { UserDto } from ".";
import { faker } from "@faker-js/faker";

dotenv.config();
export default class Devseeder {
  static async run(prisma: PrismaClient) {
    const users = Array.from({ length: 10 }, (_, k) => this.createRandomUser());
    const books = Array.from({ length: 10 }, (_, k) => this.createRandomBook());
    await this.createUsers(prisma, users);
    await this.createBooks(prisma, books);
  }

  static createRandomUser(): UserDto {
    return {
      firstname: faker.name.firstName(),
      lastname: faker.name.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      roleId: faker.helpers.arrayElement([2, 3]),
    };
  }

  static createRandomBook(): BookDto {
    return {
      title: faker.lorem.sentence(),
      isbn: faker.random.alphaNumeric(10),
      quantity: faker.datatype.number(),
      resume: faker.lorem.paragraph(),
      isValid: faker.datatype.boolean(),
      publishedAt: new Date(),
      authorId: faker.helpers.arrayElement([2, 3]),
    };
  }

  static async createUsers(prisma: PrismaClient, users: UserDto[]) {
    try {
      await Promise.all(
        users.map((user) => {
          return prisma.user.create({
            data: {
              firstname: user.firstname,
              lastname: user.lastname,
              email: user.email,
              password: user.password,
              roles: {
                create: {
                  role: {
                    connect: { id: user.roleId },
                  },
                },
              },
            },
          });
        })
      );

      console.log("Les Users ont été creer avec succes");
    } catch (error) {
      console.log(error);
      throw new Error("Erreur lors de l'insertion des users");
    }
  }

  static async createBooks(prisma: PrismaClient, books: BookDto[]) {
    try {
      const authorIds = (
        await prisma.user.findMany({
          where: {
            roles: {
              some: {
                roleId: 2,
              },
            },
          },
          select: {
            id: true,
          },
        })
      ).map((x) => x.id);

      await prisma.book.createMany({
        data: books.map((book) => {
          return {
            ...book,
            authorId: faker.helpers.arrayElement(authorIds),
          };
        }),
      });

      console.log("Les Books ont été creer avec succes");
    } catch (error) {
      console.log(error);
      throw new Error("Erreur lors de l'insertion des book");
    }
  }
}

interface BookDto {
  title: string;
  isbn: string;
  quantity: number;
  resume: string;
  isValid: boolean;
  publishedAt: Date;
  authorId: number;
}
