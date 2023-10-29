import express from "express";
import {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  validBook,
  rejectBook,
  loanBook,
  returnBook,
} from "../controllers/books";

import checkAuth from "../middlewares/check-auth";
import checkUserPermissions from "../middlewares/check-permissions";
import checkLoan from "../middlewares/check-loan";

const router = express.Router();

router.get("/", checkAuth, checkUserPermissions, getBooks);

router.get("/:bookId", checkAuth, checkUserPermissions, getBook);

router.post("/", checkAuth, checkUserPermissions, createBook);
router.put("/:bookId/validate", checkAuth, checkUserPermissions, validBook);
router.post("/:bookId/reject", checkAuth, checkUserPermissions, rejectBook);

router.post("/loan", checkAuth, checkUserPermissions, checkLoan, loanBook);

router.put("/return", checkAuth, checkUserPermissions, checkLoan, returnBook);

router.put("/:bookId", checkAuth, checkUserPermissions, updateBook);

router.delete("/:bookId", checkAuth, checkUserPermissions, deleteBook);

export default router;
