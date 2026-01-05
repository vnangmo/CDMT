import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

export const PermissionController = {
  /**
   * Get all permissions
   * GET /api/v1/permissions
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const permissions = await prisma.permission.findMany({
        orderBy: [{ module: 'asc' }, { code: 'asc' }],
      });

      res.status(200).json({
        status: 'success',
        message: 'Permissions retrieved successfully',
        data: permissions,
        count: permissions.length,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get permission by ID
   * GET /api/v1/permissions/:id
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const permission = await prisma.permission.findUnique({
        where: { id },
      });

      if (!permission) {
        res.status(404).json({
          status: 'error',
          message: 'Permission not found',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: permission,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get permissions grouped by module
   * GET /api/v1/permissions/by-module
   */
  async getByModule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const permissions = await prisma.permission.findMany({
        orderBy: [{ module: 'asc' }, { code: 'asc' }],
      });

      const grouped: Record<string, typeof permissions> = {};
      for (const perm of permissions) {
        if (!grouped[perm.module]) {
          grouped[perm.module] = [];
        }
        grouped[perm.module].push(perm);
      }

      res.status(200).json({
        status: 'success',
        data: grouped,
      });
    } catch (error) {
      next(error);
    }
  },
};
