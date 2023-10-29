import { Request, Response } from "express";
import { Book, PrismaClient, UserRoles } from "@prisma/client";
import * as dotenv from "dotenv";
import { BookResponse, IRequest } from "../models";
import {
  BookCreateDto,
  BookUpdateDto,
  checkErrors,
} from "../middlewares/validator";

dotenv.config();

const prisma = new PrismaClient();

const getBooks = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perpage as string) || 10;

    let allBooks: any;

    if (req.query.status && req.query.status === "pending") {
      allBooks = await prisma.book.findMany({
        where: { isValid: false },
        select: {
          title: true,
          isbn: true,
          quantity: true,
          resume: true,
          isValid: true,
          author: {
            select: {
              firstname: true,
              lastname: true,
              email: true,
            },
          },
        },
        skip: perPage * (page - 1),
        take: perPage,
      });
    } else if (req.query.status && req.query.status === "validated") {
      allBooks = await prisma.book.findMany({
        where: { isValid: true },
        select: {
          title: true,
          isbn: true,
          quantity: true,
          resume: true,
          isValid: true,
          author: {
            select: {
              firstname: true,
              lastname: true,
              email: true,
            },
          },
        },
        skip: perPage * (page - 1),
        take: perPage,
      });
    } else {
      allBooks = await prisma.book.findMany({
        select: {
          title: true,
          isbn: true,
          quantity: true,
          resume: true,
          isValid: true,
          author: {
            select: {
              firstname: true,
              lastname: true,
              email: true,
            },
          },
        },
        skip: perPage * (page - 1),
        take: perPage,
      });
    }

    res.status(200).json(allBooks);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la recuperation des books" });
    console.log(error);
    throw new Error("Erreur de recuperation des books");
  }
};

const getBook = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.bookId);
    const book = await prisma.book.findFirst({
      where: { AND: [{ id: id }, { isValid: true }] },
      include: {
        author: {
          select: {
            firstname: true,
            lastname: true,
            email: true,
          },
        },
      },
    });

    if (!book) return res.status(404).send("Book not found");

    const bookResponse: BookResponse = {
      title: book.title,
      isbn: book.isbn,
      quantity: book.quantity,
      resume: book.resume,
      isValid: book.isValid,
      author: book.author,
    };
    res.status(200).json(bookResponse);
  } catch (error) {
    return res.status(500).send("Erreur de recuperation du book");
  }
};

const getMyBooks = async (req: IRequest, res: Response) => {
  try {
    const id = Number(req.params.bookId);
    const book = await prisma.book.findFirst({
      where: { AND: [{ id: id }, { authorId: req.user.id }] },
      select: {
        title: true,
        isbn: true,
        quantity: true,
        resume: true,
        isValid: true,
        author: {
          select: {
            firstname: true,
            lastname: true,
            email: true,
          },
        },
      },
    });

    if (!book) {
      return res.status(404).send("Book not found");
    }

    res.status(200).json(book);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la recuperation des books" });
    console.log(error);
    throw new Error("Erreur lors de la recuperation des books");
  }
};

const validBook = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.bookId);

    let book = await prisma.book.findUnique({ where: { id: id } });
    if (!book || book.isValid) res.status(404).json("Book Not found");
    book = await prisma.book.update({
      where: { id: id },
      data: {
        isValid: true,
        publishedAt: new Date(),
      },
    });

    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la validation du book" });
    console.log(error);
    throw new Error("Erreur lors de la validation du book");
  }
};

const rejectBook = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.bookId);
    let { message } = req.body;

    let book = await prisma.book.findUnique({ where: { id: id } });
    if (!book) res.status(404).json("Book Not found");

    //SEND MAIL TO AUTHOR FOR REJECT RAISONS

    res.status(200).json("Message sended to author");
  } catch (error) {
    res.status(500).json({ message: "Erreur lors du rejet du livre" });
    console.log(error);
    throw new Error("Erreur lors du rejet du livre");
  }
};

const loanBook = async (req: IRequest, res: Response) => {
  try {
    let { books, loanAt, supposedReturnAt } = req.body;
    await prisma.loan.createMany({
      data: books.map((bookId: number) => {
        return {
          loanAt: loanAt,
          supposedReturnAt: supposedReturnAt,
          userId: req.user.id,
          bookId: bookId,
        };
      }),
    });
    //ENVOYER UN MAIL AU USER

    res.status(200).json({ message: "Votre pret est enregistrer" });
  } catch (error) {
    res.send(500).json({ message: "Erreur lors de l'emprunt" });
    console.log(error);
    throw new Error("Erreur lors de l'emprunt");
  }
};

const returnBook = async (req: IRequest, res: Response) => {
  try {
    let loans = await prisma.loan.findMany({
      where: {
        AND: [{ userId: req.user.id }, { returnAt: null }],
      },
    });
    await Promise.all(
      loans.map((loan: any) => {
        return prisma.loan.update({
          where: { id: loan.id },
          data: {
            returnAt: new Date(),
          },
        });
      })
    );

    //ENVOIE UN MAIL

    res.status(200).json({ message: "Les livres ont étés bien retourner" });
  } catch (error) {
    res.send(500).json({ message: "Erreur lors du retour de(s) livre(s)" });
    console.log(error);
    throw new Error("Erreur lors du retour de(s) livre(s)");
  }
};

const createBook = async (req: IRequest, res: Response) => {
  try {
    let { title, isbn, resume, quantity } = req.body;

    let book = new BookCreateDto();
    book.title = title;
    book.isbn = isbn;
    book.resume = resume;
    book.quantity = quantity;

    const errors = await checkErrors(book);
    if (errors.length) return res.status(400).json(errors);

    const newBook: any = await prisma.book.create({
      data: {
        title: title,
        isbn: isbn,
        resume: resume,
        quantity: quantity,
        authorId: req.user.id,
      },
    });
    const bookResponse: BookResponse = {
      title: newBook.title,
      isbn: newBook.isbn,
      quantity: newBook.quantity,
      resume: newBook.resume,
      isValid: newBook.isValid,
    };

    res.status(201).json(bookResponse);
  } catch (error: any) {
    res.status(500).json({ message: "Erreur lors de la creation du livre" });
    console.log(error);
  }
};

const updateBook = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.bookId);
    let { title, isbn, resume, quantity } = req.body;

    if (
      !Object.values(req.body).some((value) => value !== null) ||
      !Object.values(req.body).some((value) => value !== "")
    ) {
      const errors = { message: "Au moins un champ doit être fourni" };
      return res.status(400).json(errors);
    }

    let book = new BookUpdateDto();
    book.title = title;
    book.isbn = isbn;
    book.resume = resume;
    book.quantity = quantity;

    const errors = await checkErrors(book);
    if (errors.length) return res.status(400).json(errors);

    let findedBook = await prisma.book.findUnique({ where: { id: id } });
    if (!findedBook) res.status(404).json("Book Not found");

    const updateData: Record<string, any> = {};

    if (title !== undefined && title !== null) updateData.title = title;

    if (isbn !== undefined && isbn !== null) updateData.isbn = isbn;

    if (resume !== undefined && resume !== null) updateData.resume = resume;

    if (quantity !== undefined && quantity !== null)
      updateData.quantity = quantity;

    findedBook = await prisma.book.update({
      where: { id: id },
      data: updateData,
    });

    const bookResponse: BookResponse = {
      title: findedBook.title,
      isbn: findedBook.isbn,
      quantity: findedBook.quantity,
      resume: findedBook.resume,
      isValid: findedBook.isValid,
    };

    res.status(200).json(bookResponse);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise a jour du livre" });
    console.log(error);
    throw new Error("Erreur lors du mise a jour du livre");
  }
};

const deleteBook = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.bookId);
    let book = await prisma.book.findUnique({ where: { id: id } });

    if (!book) {
      res.status(404).json({ message: "Book Not found" });
    } else {
      await prisma.book.delete({ where: { id: id } });

      res.status(200).json({
        message: `Le livre '${book?.title} a été supprimer avec success !`,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Erreur lors de la suppression du livre",
    });
  }
};

export {
  getBooks,
  getMyBooks,
  getBook,
  validBook,
  rejectBook,
  loanBook,
  returnBook,
  createBook,
  updateBook,
  deleteBook,
};
