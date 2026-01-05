import React, { useState, useEffect } from 'react';
import PageHeader from '../components/common/PageHeader';
import DataTable, { Column } from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import userService from '../services/user.service';
import referentielService from '../services/referentiel.service';
import { UserListItem, CreateUserDto, UpdateUserDto, RoleListItem } from '../types/user.types';
import { Ministry } from '../types/referentiel.types';
import './Users.css';

const Users: React.FC = () => {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [roles, setRoles] = useState<RoleListItem[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateUserDto>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    roleId: '',
    ministryId: '',
    isActive: true
  });

  useEffect(() => {
    loadUsers();
    loadRoles();
    loadMinistries();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers({ limit: 100 });
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await userService.getRoles({ limit: 100 });
      setRoles(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erreur lors du chargement des rôles:', error);
      setRoles([]);
    }
  };

  const loadMinistries = async () => {
    try {
      const data = await referentielService.getMinistries();
      setMinistries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement des ministères:', error);
      setMinistries([]);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      roleId: '',
      ministryId: '',
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleEdit = (user: UserListItem) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '', // Ne pas afficher le mot de passe
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      roleId: user.role.id,
      ministryId: user.ministry?.id || '',
      isActive: user.isActive
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (user: UserListItem) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.email}" ?`)) {
      try {
        await userService.deleteUser(user.id);
        await loadUsers();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de l\'utilisateur');
      }
    }
  };

  const handleToggleStatus = async (user: UserListItem) => {
    if (window.confirm(`Voulez-vous ${user.isActive ? 'désactiver' : 'activer'} l'utilisateur "${user.email}" ?`)) {
      try {
        await userService.toggleUserStatus(user.id);
        await loadUsers();
      } catch (error) {
        console.error('Erreur lors du changement de statut:', error);
        alert('Erreur lors du changement de statut');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveUser();
  };

  const saveUser = async () => {
    setSubmitting(true);

    try {
      if (editingUser) {
        // Pour la mise à jour, on n'envoie pas le mot de passe s'il est vide
        const updateData: UpdateUserDto = {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          roleId: formData.roleId,
          ministryId: formData.ministryId || undefined,
          isActive: formData.isActive
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await userService.updateUser(editingUser.id, updateData);
      } else {
        await userService.createUser(formData);
      }
      setIsModalOpen(false);
      await loadUsers();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      alert('Erreur lors de l\'enregistrement de l\'utilisateur');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<UserListItem>[] = [
    {
      key: 'email',
      header: 'Email',
      width: '20%'
    },
    {
      key: 'firstName',
      header: 'Prénom',
      width: '12%'
    },
    {
      key: 'lastName',
      header: 'Nom',
      width: '12%'
    },
    {
      key: 'phone',
      header: 'Téléphone',
      width: '12%',
      render: (item) => item.phone || '-'
    },
    {
      key: 'role',
      header: 'Rôle',
      width: '18%',
      render: (item) => item.role.name
    },
    {
      key: 'ministry',
      header: 'Ministère',
      width: '16%',
      render: (item) => item.ministry?.name || '-'
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
    <div className="users-page">
      <PageHeader
        title="Gestion des Utilisateurs"
        subtitle="Liste des utilisateurs du système CDMT"
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
            Nouvel Utilisateur
          </Button>
        }
      />

      <DataTable
        data={users}
        columns={columns}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="Aucun utilisateur enregistré"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Modifier l\'Utilisateur' : 'Nouvel Utilisateur'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={saveUser} loading={submitting}>
              {editingUser ? 'Mettre à jour' : 'Créer'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">Prénom *</label>
              <input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                placeholder="Ex: Ahmed"
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Nom *</label>
              <input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                placeholder="Ex: Mohamed"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="Ex: ahmed.mohamed@finances.dj"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Mot de passe {editingUser ? '(laisser vide pour ne pas modifier)' : '*'}
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingUser}
              placeholder="••••••••"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Téléphone</label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Ex: +253 77 12 34 56"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="roleId">Rôle *</label>
              <select
                id="roleId"
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                required
              >
                <option value="">Sélectionner un rôle</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="ministryId">Ministère</label>
              <select
                id="ministryId"
                value={formData.ministryId}
                onChange={(e) => setFormData({ ...formData, ministryId: e.target.value })}
              >
                <option value="">Aucun ministère</option>
                {ministries.map((ministry) => (
                  <option key={ministry.id} value={ministry.id}>
                    {ministry.name}
                  </option>
                ))}
              </select>
            </div>
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
        </form>
      </Modal>
    </div>
  );
};

export default Users;
