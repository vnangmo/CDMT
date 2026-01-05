import React, { useState, useEffect } from 'react';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import userService from '../services/user.service';
import { RoleListItem, PermissionListItem } from '../types/user.types';
import './AccessMatrix.css';

interface MatrixCell {
  roleId: string;
  permissionId: string;
  hasPermission: boolean;
}

const AccessMatrix: React.FC = () => {
  const [roles, setRoles] = useState<RoleListItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionListItem[]>([]);
  const [matrix, setMatrix] = useState<Map<string, MatrixCell>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger les rôles et permissions
      const [rolesResponse, permissionsData] = await Promise.all([
        userService.getRoles({ limit: 100 }),
        userService.getPermissions()
      ]);

      console.log('Roles response:', rolesResponse);
      console.log('Permissions data:', permissionsData);

      const rolesData = Array.isArray(rolesResponse.data) ? rolesResponse.data : [];
      const permsData = Array.isArray(permissionsData) ? permissionsData : [];

      if (rolesData.length === 0) {
        console.warn('Aucun rôle trouvé');
      }

      if (permsData.length === 0) {
        console.warn('Aucune permission trouvée');
      }

      setRoles(rolesData);
      setPermissions(permsData);

      // Construire la matrice
      const newMatrix = new Map<string, MatrixCell>();

      rolesData.forEach(role => {
        if (!role.id) {
          console.error('Rôle sans ID:', role);
          return;
        }

        permsData.forEach(permission => {
          if (!permission.id) {
            console.error('Permission sans ID:', permission);
            return;
          }

          const key = `${role.id}-${permission.id}`;

          // Vérifier si le rôle a cette permission
          let hasPermission = false;
          if (role.permissions && Array.isArray(role.permissions)) {
            hasPermission = role.permissions.some(p => {
              // Comparaison par ID ou par code si ID n'est pas disponible
              return p.id === permission.id || p.code === permission.code;
            });
          }

          newMatrix.set(key, {
            roleId: role.id,
            permissionId: permission.id,
            hasPermission
          });
        });
      });

      console.log('Matrice construite:', newMatrix.size, 'cellules');
      setMatrix(newMatrix);
    } catch (error: any) {
      console.error('Erreur lors du chargement des données:', error);
      console.error('Stack trace:', error.stack);
      alert(`Erreur lors du chargement de la matrice: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (roleId: string, permissionId: string) => {
    const key = `${roleId}-${permissionId}`;
    const cell = matrix.get(key);
    if (cell) {
      const newMatrix = new Map(matrix);
      newMatrix.set(key, {
        ...cell,
        hasPermission: !cell.hasPermission
      });
      setMatrix(newMatrix);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Grouper les permissions par rôle
      const rolePermissions = new Map<string, string[]>();

      matrix.forEach(cell => {
        if (cell.hasPermission) {
          const perms = rolePermissions.get(cell.roleId) || [];
          perms.push(cell.permissionId);
          rolePermissions.set(cell.roleId, perms);
        }
      });

      // Sauvegarder chaque rôle
      const promises = Array.from(rolePermissions.entries()).map(([roleId, permissionIds]) =>
        userService.updateRole(roleId, { permissionIds })
      );

      // Sauvegarder aussi les rôles sans permissions
      roles.forEach(role => {
        if (!rolePermissions.has(role.id)) {
          promises.push(userService.updateRole(role.id, { permissionIds: [] }));
        }
      });

      await Promise.all(promises);
      alert('Matrice des droits mise à jour avec succès');
      await loadData();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde de la matrice');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAllForRole = (roleId: string) => {
    const newMatrix = new Map(matrix);
    const permsToShow = selectedModule === 'all'
      ? permissions
      : permissions.filter(p => p.module === selectedModule);

    permsToShow.forEach(permission => {
      const key = `${roleId}-${permission.id}`;
      const cell = newMatrix.get(key);
      if (cell) {
        newMatrix.set(key, { ...cell, hasPermission: true });
      }
    });
    setMatrix(newMatrix);
  };

  const handleDeselectAllForRole = (roleId: string) => {
    const newMatrix = new Map(matrix);
    const permsToShow = selectedModule === 'all'
      ? permissions
      : permissions.filter(p => p.module === selectedModule);

    permsToShow.forEach(permission => {
      const key = `${roleId}-${permission.id}`;
      const cell = newMatrix.get(key);
      if (cell) {
        newMatrix.set(key, { ...cell, hasPermission: false });
      }
    });
    setMatrix(newMatrix);
  };

  // Obtenir les modules uniques
  const modules = Array.from(new Set(permissions.map(p => p.module))).sort();

  // Filtrer les permissions selon le module sélectionné
  const filteredPermissions = selectedModule === 'all'
    ? permissions
    : permissions.filter(p => p.module === selectedModule);

  if (loading) {
    return (
      <div className="access-matrix-page">
        <div className="loading-state">Chargement de la matrice...</div>
      </div>
    );
  }

  return (
    <div className="access-matrix-page">
      <PageHeader
        title="Matrice des Droits d'Accès"
        subtitle="Vue d'ensemble des permissions par rôle"
        action={
          <Button onClick={handleSave} loading={saving}>
            Enregistrer les modifications
          </Button>
        }
      />

      <div className="matrix-container">
        <div className="matrix-filters">
          <div className="filter-group">
            <label htmlFor="moduleFilter">Filtrer par module:</label>
            <select
              id="moduleFilter"
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="module-filter"
            >
              <option value="all">Tous les modules</option>
              {modules.map(module => (
                <option key={module} value={module}>{module}</option>
              ))}
            </select>
          </div>

          <div className="matrix-stats">
            <span className="stat-item">
              <strong>{roles.length}</strong> rôles
            </span>
            <span className="stat-item">
              <strong>{filteredPermissions.length}</strong> permissions affichées
            </span>
          </div>
        </div>

        <div className="matrix-scroll">
          <table className="access-matrix">
            <thead>
              <tr>
                <th className="permission-header">Permission</th>
                {roles.map(role => (
                  <th key={role.id} className="role-header">
                    <div className="role-header-content">
                      <span className="role-name">{role.name}</span>
                      <div className="role-actions">
                        <button
                          className="action-link"
                          onClick={() => handleSelectAllForRole(role.id)}
                          title="Tout sélectionner"
                        >
                          ✓ Tout
                        </button>
                        <button
                          className="action-link"
                          onClick={() => handleDeselectAllForRole(role.id)}
                          title="Tout désélectionner"
                        >
                          ✗ Rien
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPermissions.map(permission => {
                const key = `perm-${permission.id}`;
                return (
                  <tr key={key}>
                    <td className="permission-cell">
                      <div className="permission-info">
                        <span className="permission-code">{permission.code}</span>
                        <span className="permission-name">{permission.name}</span>
                        <span className="permission-module">{permission.module}</span>
                      </div>
                    </td>
                    {roles.map(role => {
                      const cellKey = `${role.id}-${permission.id}`;
                      const cell = matrix.get(cellKey);
                      return (
                        <td key={cellKey} className="matrix-cell">
                          <input
                            type="checkbox"
                            checked={cell?.hasPermission || false}
                            onChange={() => togglePermission(role.id, permission.id)}
                            className="matrix-checkbox"
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredPermissions.length === 0 && (
          <div className="empty-state">
            Aucune permission trouvée pour le module sélectionné
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessMatrix;
