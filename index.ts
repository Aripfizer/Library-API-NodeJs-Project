import express, { Application, Request, Response } from "express";
import * as dotenv from "dotenv";
import userRoutes from "./src/routes/users";
import roleRoutes from "./src/routes/roles";
import authRoutes from "./src/routes/auth";
import bookRoutes from "./src/routes/book";


// CONFIGURATIONS

dotenv.config();
const app: Application = express();
const port = process.env.PORT || 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

app.get("/", (request: Request, response: Response) => {
  response
    .status(200)
    .send(
      `<div style="background-color: green;">Je crois que tout va bien</div>`
    );
});

//ROUTING

app.use("/api", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/books", bookRoutes);
