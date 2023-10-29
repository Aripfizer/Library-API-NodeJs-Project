import express from "express";
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  addRoles
} from "../controllers/users";

import checkAuth from "../middlewares/check-auth";
import checkUserPermissions from "../middlewares/check-permissions";

const router = express.Router();

router.get("/", checkAuth, checkUserPermissions, getUsers);

router.get("/:userId", checkAuth, checkUserPermissions, getUser);

router.post("/", checkAuth, checkUserPermissions, createUser);
router.post("/:userId/roles", checkAuth, checkUserPermissions, addRoles);

router.put("/:userId", checkAuth, checkUserPermissions, updateUser);

router.delete("/:userId", checkAuth, checkUserPermissions, deleteUser);

export default router;
