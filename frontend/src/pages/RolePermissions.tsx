import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import userService from '../services/user.service';
import { RoleListItem, PermissionListItem } from '../types/user.types';
import './RolePermissions.css';

const RolePermissions: React.FC = () => {
  const { roleId } = useParams<{ roleId: string }>();
  const navigate = useNavigate();
  const [role, setRole] = useState<RoleListItem | null>(null);
  const [allPermissions, setAllPermissions] = useState<PermissionListItem[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (roleId) {
      loadRoleAndPermissions();
    }
  }, [roleId]);

  const loadRoleAndPermissions = async () => {
    try {
      setLoading(true);
      const [roleData, permissionsData] = await Promise.all([
        userService.getRole(roleId!),
        userService.getPermissions()
      ]);

      setRole(roleData);
      setAllPermissions(Array.isArray(permissionsData) ? permissionsData : []);

      // Initialiser les permissions sélectionnées
      const rolePermissionIds = new Set(roleData.permissions?.map(p => p.id) || []);
      setSelectedPermissions(rolePermissionIds);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      alert('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = (permissionId: string) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(newSelected);
  };

  const handleSelectAll = () => {
    const allIds = new Set(allPermissions.map(p => p.id));
    setSelectedPermissions(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedPermissions(new Set());
  };

  const handleSave = async () => {
    if (!roleId) return;

    setSubmitting(true);
    try {
      await userService.updateRole(roleId, {
        permissionIds: Array.from(selectedPermissions)
      });
      alert('Permissions mises à jour avec succès');
      navigate('/roles');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la mise à jour des permissions');
    } finally {
      setSubmitting(false);
    }
  };

  // Grouper les permissions par module
  const groupedPermissions = allPermissions.reduce((acc, permission) => {
    const module = permission.module || 'Général';
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(permission);
    return acc;
  }, {} as Record<string, PermissionListItem[]>);

  if (loading) {
    return (
      <div className="role-permissions-page">
        <div className="loading-state">Chargement...</div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="role-permissions-page">
        <div className="error-state">Rôle non trouvé</div>
      </div>
    );
  }

  return (
    <div className="role-permissions-page">
      <PageHeader
        title={`Permissions - ${role.name}`}
        subtitle={`Gérer les permissions du rôle "${role.name}"`}
        action={
          <div className="header-actions">
            <Button variant="secondary" onClick={() => navigate('/roles')}>
              Retour
            </Button>
            <Button onClick={handleSave} loading={submitting}>
              Enregistrer
            </Button>
          </div>
        }
      />

      <div className="permissions-container">
        <div className="permissions-header">
          <div className="permissions-stats">
            <span className="stat-item">
              <strong>{selectedPermissions.size}</strong> permissions sélectionnées sur{' '}
              <strong>{allPermissions.length}</strong>
            </span>
          </div>
          <div className="permissions-actions">
            <button className="text-button" onClick={handleSelectAll}>
              Tout sélectionner
            </button>
            <button className="text-button" onClick={handleDeselectAll}>
              Tout désélectionner
            </button>
          </div>
        </div>

        <div className="permissions-grid">
          {Object.entries(groupedPermissions).map(([module, permissions]) => (
            <div key={module} className="permission-module">
              <h3 className="module-title">{module}</h3>
              <div className="permission-list">
                {permissions.map((permission) => (
                  <label key={permission.id} className="permission-item">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.has(permission.id)}
                      onChange={() => handleTogglePermission(permission.id)}
                    />
                    <div className="permission-info">
                      <span className="permission-code">{permission.code}</span>
                      <span className="permission-name">{permission.name}</span>
                      {permission.description && (
                        <span className="permission-description">{permission.description}</span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RolePermissions;
