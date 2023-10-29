import { Request, Response } from "express";
import { Permission, PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import {
  RoleCreateDto,
  RolePermissionsAddDto,
  RoleUpdateDto,
  checkErrors,
} from "../middlewares/validator";

dotenv.config();

const prisma = new PrismaClient();

const getRoles = async (req: Request, res: Response) => {
  try {
    let allRoles = await prisma.role.findMany({
      select: {
        name: true,
        permissions: {
          select: {
            permission: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
    res.status(200).json(allRoles);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la recuperation des roles" });
    console.log(error);
    throw new Error("Erreur de recuperation des roles");
  }
};

const getRole = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.roleID);
    const role = await prisma.role.findUnique({
      where: { id: id },
      select: {
        name: true,
        permissions: {
          select: {
            permission: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
    if (!role) {
      return res.status(404).send("Role not found");
    }

    res.status(200).json(role);
  } catch (error) {
    res.status(500).json("Erreur lors de la recuperation du role");
    console.log(error);
    throw new Error("Erreur lors de la recuperation du role");
  }
};

const createRole = async (req: Request, res: Response) => {
  try {
    let { name, permissions } = req.body;

    let role = new RoleCreateDto();
    role.name = name;
    role.permissions = permissions;

    const errors = await checkErrors(role);
    if (errors.length) return res.status(400).json(errors);

    let newRole: any = await prisma.role.create({
      data: {
        name: name,
      },
    });

    if (permissions && permissions.length) {
      await prisma.rolePermissions.createMany({
        data: permissions.map((id: number) => {
          return { roleId: newRole.id, permissionId: id };
        }),
      });
    }

    newRole = await prisma.role.findUnique({
      where: { id: newRole.id },
      select: {
        name: true,
        permissions: {
          select: {
            permission: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(newRole);
  } catch (error: any) {
    res.status(500).json({ message: "Erreur lors de la création du role" });
    console.log(error);
    throw new Error("Erreur lors de la création du role");
  }
};

const addPermissions = async (req: Request, res: Response) => {
  try {
    // ADD PERMISSIONS TO ROLE
    const id = Number(req.params.roleID);
    let { permissions } = req.body;

    let per = new RolePermissionsAddDto();

    per.permissions = permissions;

    const errors = await checkErrors(per);
    if (errors.length) return res.status(400).json(errors);

    let role: any = await prisma.role.findFirst({
      where: { id: id },
    });

    if (!role) {
      return res.status(404).send("Role not found");
    } else {
      await Promise.all(
        permissions.map((id: number) => {
          return prisma.rolePermissions.upsert({
            where: {
              permissionId_roleId: {
                permissionId: id,
                roleId: role.id,
              },
            },
            create: {
              permissionId: id,
              roleId: role.id,
            },
            update: {},
          });
        })
      );

      role = await prisma.role.findUnique({
        where: { id: role.id },
        select: {
          name: true,
          permissions: {
            select: {
              permission: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      res.status(201).json(role);
    }
  } catch (error: any) {
    res.status(500).json({ message: "Erreur lors de l'ajout des permissions" });
    console.log(error);
    throw new Error("Erreur lors de l'ajout des permissions");
  }
};

const removePermissions = async (req: Request, res: Response) => {
  try {
    // Romove PERMISSIONS TO ROLE
    const id = Number(req.params.roleID);
    let { permissions } = req.body;

    let per = new RolePermissionsAddDto();

    per.permissions = permissions;

    const errors = await checkErrors(per);
    if (errors.length) return res.status(400).json(errors);

    let role: any = await prisma.role.findFirst({
      where: { id: id },
    });

    if (!role) {
      return res.status(404).send("Role not found");
    } else {
      await Promise.all(
        permissions.map(async (id: number) => {
          let findedPermission: any = await prisma.rolePermissions.findFirst({
            where: {
              AND: {
                permissionId: id,
                roleId: role.id,
              },
            },
          });

          if (findedPermission) {
            return prisma.rolePermissions.delete({
              where: {
                permissionId_roleId: {
                  permissionId: findedPermission.permissionId,
                  roleId: role.id,
                },
              },
            });
          }
        })
      );

      role = await prisma.role.findUnique({
        where: { id: role.id },
        select: {
          name: true,
          permissions: {
            select: {
              permission: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      res.status(201).json(role);
    }
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Erreur lors de la suppression des permissions" });
    console.log(error);
    throw new Error("Erreur lors de la suppression des permissions");
  }
};

const updateRole = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.roleID);
    let { name } = req.body;

    let role = new RoleUpdateDto();
    role.name = name;

    const errors = await checkErrors(role);
    if (errors.length) return res.status(400).json(errors);

    let findedRole = await prisma.role.findUnique({ where: { id: id } });
    if (!findedRole) res.status(404).json("Role Not found");

    role = await prisma.role.update({
      where: { id: id },
      data: {
        name: name,
      },
    });

    res.status(200).json({
      name: role.name,
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise a jour du role" });
    console.log(error);
    throw new Error("Erreur lors de la mise a jour du role");
  }
};

const deleteRole = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.roleID);
    const baseRoles = [1, 2, 3];

    if (baseRoles.includes(id)) {
      res.status(403).json({ message: "Vous ne pouvez pas supprimer ce role" });
    } else {
      let role: any = await prisma.role.findUnique({ where: { id: id } });
      if (!role) {
        res.status(404).json({ message: "Role Not found" });
      } else {
        const deletePemissions = prisma.rolePermissions.deleteMany({
          where: { roleId: id },
        });
        const deleteUserRoles = prisma.userRoles.deleteMany({
          where: { roleId: id },
        });
        const deleteRole = prisma.role.delete({ where: { id: id } });

        await prisma.$transaction([
          deletePemissions,
          deleteUserRoles,
          deleteRole,
        ]);

        res.status(200).json({
          message: `Le role '${role.name} a été supprimer avec success !`,
        });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Erreur lors de la suppression de l'utilisateur",
    });
    throw new Error("Erreur lors de la suppression de l'utilisateur");
  }
};

export {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  addPermissions,
  removePermissions,
};
