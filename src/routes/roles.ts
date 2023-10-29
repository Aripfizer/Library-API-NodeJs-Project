import express from "express";
import {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  addPermissions,
  removePermissions
} from "../controllers/roles";

import checkAuth from "../middlewares/check-auth";
import checkUserPermissions from "../middlewares/check-permissions";

const router = express.Router();

router.get("/", checkAuth, checkUserPermissions, getRoles);

router.get("/:roleID", checkAuth, checkUserPermissions, getRole);

router.post("/", checkAuth, checkUserPermissions, createRole);
router.post("/:roleID/permissions", checkAuth, checkUserPermissions, addPermissions);

router.put("/:roleID", checkAuth, checkUserPermissions, updateRole);
router.put("/:roleID/permissions", checkAuth, checkUserPermissions, removePermissions);

router.delete("/:roleID", checkAuth, checkUserPermissions, deleteRole);

export default router;
