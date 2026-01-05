import prisma from '../config/database';
import { CacheService } from './cache.service';
import { PerformanceConfig, CacheKeys } from '../config/performance.config';

export interface CreateRoleDto {
  code: string;
  name: string;
  description?: string;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface AssignPermissionsDto {
  permissionIds: string[];
  canCreate?: boolean;
  canRead?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  canValidate?: boolean;
}

export const RoleService = {
  /**
   * Get all roles with their permissions and user count
   * Cached for performance (TTL: 5 minutes)
   */
  async getAll() {
    return CacheService.getOrSet(
      CacheKeys.roles.all,
      async () => {
        return prisma.role.findMany({
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
            _count: {
              select: { users: true },
            },
          },
          orderBy: { name: 'asc' },
        });
      },
      PerformanceConfig.cacheTTL.referenceData
    );
  },

  /**
   * Get role by ID with full details
   */
  async getById(id: string) {
    return prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
          },
        },
      },
    });
  },

  /**
   * Get role by code
   */
  async getByCode(code: string) {
    return prisma.role.findUnique({
      where: { code },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  },

  /**
   * Create a new role
   * Invalidates role cache
   */
  async create(data: CreateRoleDto) {
    const role = await prisma.role.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        description: data.description,
      },
    });
    // Invalidate cache
    await this.invalidateCache();
    return role;
  },

  /**
   * Update a role
   * Invalidates role cache
   */
  async update(id: string, data: UpdateRoleDto) {
    const role = await prisma.role.update({
      where: { id },
      data,
    });
    // Invalidate cache
    await this.invalidateCache();
    return role;
  },

  /**
   * Delete a role (only if no users assigned)
   * Invalidates role cache
   */
  async delete(id: string) {
    // Check if role has users
    const role = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    if (role._count.users > 0) {
      throw new Error(`Cannot delete role with ${role._count.users} assigned users`);
    }

    // Delete role permissions first
    await prisma.rolePermission.deleteMany({
      where: { roleId: id },
    });

    // Delete role
    const deleted = await prisma.role.delete({
      where: { id },
    });

    // Invalidate cache
    await this.invalidateCache();
    return deleted;
  },

  /**
   * Assign permissions to a role
   * Invalidates cache after changes
   */
  async assignPermissions(roleId: string, data: AssignPermissionsDto) {
    const results = [];

    for (const permissionId of data.permissionIds) {
      const result = await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId,
          },
        },
        update: {
          canCreate: data.canCreate ?? false,
          canRead: data.canRead ?? false,
          canUpdate: data.canUpdate ?? false,
          canDelete: data.canDelete ?? false,
          canValidate: data.canValidate ?? false,
        },
        create: {
          roleId,
          permissionId,
          canCreate: data.canCreate ?? false,
          canRead: data.canRead ?? false,
          canUpdate: data.canUpdate ?? false,
          canDelete: data.canDelete ?? false,
          canValidate: data.canValidate ?? false,
        },
        include: {
          permission: true,
        },
      });
      results.push(result);
    }

    // Invalidate cache after permission changes
    await this.invalidateCache();
    return results;
  },

  /**
   * Remove permissions from a role
   * Invalidates cache after changes
   */
  async removePermissions(roleId: string, permissionIds: string[]) {
    const result = await prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId: { in: permissionIds },
      },
    });

    // Invalidate cache after permission changes
    await this.invalidateCache();
    return result;
  },

  /**
   * Get all permissions
   */
  async getAllPermissions() {
    return prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { code: 'asc' }],
    });
  },

  /**
   * Get permissions grouped by module
   * Cached for performance (TTL: 5 minutes)
   */
  async getPermissionsByModule() {
    return CacheService.getOrSet(
      CacheKeys.roles.permissionsByModule,
      async () => {
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

        return grouped;
      },
      PerformanceConfig.cacheTTL.referenceData
    );
  },

  /**
   * Get access matrix (roles vs permissions)
   * Cached for performance (TTL: 5 minutes)
   */
  async getAccessMatrix() {
    return CacheService.getOrSet(
      CacheKeys.roles.accessMatrix,
      async () => {
        const roles = await prisma.role.findMany({
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        });

        const permissions = await prisma.permission.findMany({
          orderBy: [{ module: 'asc' }, { code: 'asc' }],
        });

        // Build matrix
        const matrix: Record<string, Record<string, boolean>> = {};

        for (const role of roles) {
          matrix[role.code] = {};
          for (const perm of permissions) {
            const hasPermission = role.permissions.some(
              (rp) => rp.permissionId === perm.id
            );
            matrix[role.code][perm.code] = hasPermission;
          }
        }

        return {
          roles: roles.map((r) => ({ code: r.code, name: r.name })),
          permissions: permissions.map((p) => ({
            code: p.code,
            name: p.name,
            module: p.module,
          })),
          matrix,
        };
      },
      PerformanceConfig.cacheTTL.accessMatrix
    );
  },

  /**
   * Check if a role has a specific permission
   */
  async hasPermission(roleId: string, permissionCode: string): Promise<boolean> {
    const rolePermission = await prisma.rolePermission.findFirst({
      where: {
        roleId,
        permission: {
          code: permissionCode,
        },
      },
    });

    return !!rolePermission;
  },

  /**
   * Get role statistics
   * Cached for performance (TTL: 5 minutes)
   */
  async getStatistics() {
    return CacheService.getOrSet(
      CacheKeys.roles.statistics,
      async () => {
        const [totalRoles, totalPermissions, totalUsers] = await Promise.all([
          prisma.role.count(),
          prisma.permission.count(),
          prisma.user.count(),
        ]);

        const roleStats = await prisma.role.findMany({
          select: {
            code: true,
            name: true,
            _count: {
              select: {
                users: true,
                permissions: true,
              },
            },
          },
        });

        return {
          totalRoles,
          totalPermissions,
          totalUsers,
          roleStats: roleStats.map((r) => ({
            code: r.code,
            name: r.name,
            userCount: r._count.users,
            permissionCount: r._count.permissions,
          })),
        };
      },
      PerformanceConfig.cacheTTL.referenceData
    );
  },

  /**
   * Invalidate all role-related cache entries
   */
  async invalidateCache() {
    await CacheService.del([
      CacheKeys.roles.all,
      CacheKeys.roles.statistics,
      CacheKeys.roles.accessMatrix,
      CacheKeys.roles.permissionsByModule,
    ]);
  },
};
