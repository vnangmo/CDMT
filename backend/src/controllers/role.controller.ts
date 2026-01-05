import { Request, Response, NextFunction } from 'express';
import { RoleService } from '../services/role.service';

export const RoleController = {
  /**
   * Get all roles
   * GET /api/v1/roles
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await RoleService.getAll();

      res.status(200).json({
        status: 'success',
        message: 'Roles retrieved successfully',
        data: roles,
        count: roles.length,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get role by ID
   * GET /api/v1/roles/:id
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const role = await RoleService.getById(id);

      if (!role) {
        res.status(404).json({
          status: 'error',
          message: 'Role not found',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: role,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get role by code
   * GET /api/v1/roles/code/:code
   */
  async getByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.params;
      const role = await RoleService.getByCode(code);

      if (!role) {
        res.status(404).json({
          status: 'error',
          message: 'Role not found',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: role,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create a new role
   * POST /api/v1/roles
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, name, description } = req.body;

      if (!code || !name) {
        res.status(400).json({
          status: 'error',
          message: 'Code and name are required',
        });
        return;
      }

      const role = await RoleService.create({ code, name, description });

      res.status(201).json({
        status: 'success',
        message: 'Role created successfully',
        data: role,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        res.status(400).json({
          status: 'error',
          message: 'Role code already exists',
        });
        return;
      }
      next(error);
    }
  },

  /**
   * Update a role
   * PUT /api/v1/roles/:id
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, isActive } = req.body;

      const role = await RoleService.update(id, { name, description, isActive });

      res.status(200).json({
        status: 'success',
        message: 'Role updated successfully',
        data: role,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        res.status(404).json({
          status: 'error',
          message: 'Role not found',
        });
        return;
      }
      next(error);
    }
  },

  /**
   * Delete a role
   * DELETE /api/v1/roles/:id
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await RoleService.delete(id);

      res.status(200).json({
        status: 'success',
        message: 'Role deleted successfully',
      });
    } catch (error: any) {
      if (error.message?.includes('Cannot delete')) {
        res.status(400).json({
          status: 'error',
          message: error.message,
        });
        return;
      }
      if (error.message === 'Role not found') {
        res.status(404).json({
          status: 'error',
          message: 'Role not found',
        });
        return;
      }
      next(error);
    }
  },

  /**
   * Assign permissions to a role
   * POST /api/v1/roles/:id/permissions
   */
  async assignPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { permissionIds, canCreate, canRead, canUpdate, canDelete, canValidate } = req.body;

      if (!permissionIds || !Array.isArray(permissionIds)) {
        res.status(400).json({
          status: 'error',
          message: 'permissionIds must be an array',
        });
        return;
      }

      const results = await RoleService.assignPermissions(id, {
        permissionIds,
        canCreate,
        canRead,
        canUpdate,
        canDelete,
        canValidate,
      });

      res.status(200).json({
        status: 'success',
        message: `${results.length} permissions assigned to role`,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Remove permissions from a role
   * DELETE /api/v1/roles/:id/permissions
   */
  async removePermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { permissionIds } = req.body;

      if (!permissionIds || !Array.isArray(permissionIds)) {
        res.status(400).json({
          status: 'error',
          message: 'permissionIds must be an array',
        });
        return;
      }

      const result = await RoleService.removePermissions(id, permissionIds);

      res.status(200).json({
        status: 'success',
        message: `${result.count} permissions removed from role`,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all permissions
   * GET /api/v1/roles/permissions/all
   */
  async getAllPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const permissions = await RoleService.getAllPermissions();

      res.status(200).json({
        status: 'success',
        data: permissions,
        count: permissions.length,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get permissions grouped by module
   * GET /api/v1/roles/permissions/by-module
   */
  async getPermissionsByModule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const grouped = await RoleService.getPermissionsByModule();

      res.status(200).json({
        status: 'success',
        data: grouped,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get access matrix
   * GET /api/v1/roles/access-matrix
   */
  async getAccessMatrix(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const matrix = await RoleService.getAccessMatrix();

      res.status(200).json({
        status: 'success',
        data: matrix,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get role statistics
   * GET /api/v1/roles/statistics
   */
  async getStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await RoleService.getStatistics();

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },
};
