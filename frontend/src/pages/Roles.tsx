import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import DataTable, { Column } from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import userService from '../services/user.service';
import { RoleListItem, CreateRoleDto, UpdateRoleDto } from '../types/user.types';
import './Roles.css';

const Roles: React.FC = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<RoleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleListItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateRoleDto>({
    name: '',
    code: '',
    description: '',
    isActive: true
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await userService.getRoles({ limit: 100 });
      setRoles(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erreur lors du chargement des rôles:', error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleEdit = (role: RoleListItem) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      code: role.code,
      description: role.description || '',
      isActive: role.isActive
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (role: RoleListItem) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le rôle "${role.name}" ?`)) {
      try {
        await userService.deleteRole(role.id);
        await loadRoles();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du rôle');
      }
    }
  };

  const handleViewPermissions = (role: RoleListItem) => {
    navigate(`/roles/${role.id}/permissions`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveRole();
  };

  const saveRole = async () => {
    setSubmitting(true);

    try {
      if (editingRole) {
        await userService.updateRole(editingRole.id, formData as UpdateRoleDto);
      } else {
        await userService.createRole(formData);
      }
      setIsModalOpen(false);
      await loadRoles();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      alert('Erreur lors de l\'enregistrement du rôle');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<RoleListItem>[] = [
    {
      key: 'code',
      header: 'Code',
      width: '15%'
    },
    {
      key: 'name',
      header: 'Nom',
      width: '25%'
    },
    {
      key: 'description',
      header: 'Description',
      width: '35%',
      render: (item) => item.description || '-'
    },
    {
      key: 'permissions',
      header: 'Permissions',
      width: '15%',
      render: (item) => (
        <span className="permissions-count">
          {item.permissions?.length || 0} permissions
        </span>
      )
    },
    {
      key: 'isActive',
      header: 'Statut',
      width: '10%',
      render: (item) => (
        <span className={`status-badge ${item.isActive ? 'active' : 'inactive'}`}>
          {item.isActive ? 'Actif' : 'Inactif'}
        </span>
      )
    }
  ];

  return (
    <div className="roles-page">
      <PageHeader
        title="Gestion des Rôles"
        subtitle="Gestion des rôles et permissions utilisateur"
        action={
          <Button
            onClick={handleCreate}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            }
          >
            Nouveau Rôle
          </Button>
        }
      />

      <DataTable
        data={roles}
        columns={columns}
        loading={loading}
        onView={handleViewPermissions}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="Aucun rôle enregistré"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole ? 'Modifier le Rôle' : 'Nouveau Rôle'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={saveRole} loading={submitting}>
              {editingRole ? 'Mettre à jour' : 'Créer'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="role-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="code">Code *</label>
              <input
                id="code"
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                placeholder="Ex: ADMIN"
              />
            </div>

            <div className="form-group">
              <label htmlFor="name">Nom *</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Ex: Administrateur"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Description du rôle..."
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <span>Actif</span>
            </label>
          </div>

          {editingRole && (
            <div className="form-info">
              <p className="info-text">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                Pour gérer les permissions de ce rôle, utilisez le bouton "Voir" dans la liste.
              </p>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default Roles;
