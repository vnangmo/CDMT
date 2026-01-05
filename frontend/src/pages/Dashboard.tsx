import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Permission } from '../types/auth.types';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    {
      path: '/dashboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        </svg>
      ),
      label: 'Tableau de Bord'
    },
    {
      path: '/ministries',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
      ),
      label: 'Ministères'
    },
    {
      path: '/programs',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
      ),
      label: 'Programmes'
    },
    {
      path: '/strategic-axes',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
      label: 'Axes Stratégiques'
    },
    {
      path: '/economic-natures',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
      label: 'Natures Économiques'
    },
    {
      path: '/funding-sources',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
          <line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
      ),
      label: 'Sources de Financement'
    },
    {
      path: '/fiscal-years',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
      label: 'Années Fiscales'
    },
    {
      path: '/macro/frameworks',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3v18h18"/>
          <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
        </svg>
      ),
      label: 'Cadre Macroéconomique'
    },
    {
      path: '/macro/cbmt',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
        </svg>
      ),
      label: 'CBMT'
    },
    {
      path: '/cdmt-global',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      ),
      label: 'CDMT Global'
    },
    {
      path: '/trend-budgets',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
          <polyline points="17 6 23 6 23 12"/>
        </svg>
      ),
      label: 'Budget Tendanciel'
    },
    {
      path: '/sectoral-measures',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
        </svg>
      ),
      label: 'Mesures Sectorielles'
    },
    {
      path: '/action-plans',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      ),
      label: 'Plans d\'Action'
    },
    {
      path: '/sectoral-validation',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 11 12 14 22 4"/>
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
        </svg>
      ),
      label: 'Validation Sectorielle'
    },
    {
      path: '/users',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      label: 'Utilisateurs'
    },
    {
      path: '/roles',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 15l-3-3h6z"/>
          <path d="M17 8l-5-5-5 5"/>
          <path d="M12 3v9"/>
          <circle cx="18" cy="18" r="3"/>
          <circle cx="6" cy="18" r="3"/>
        </svg>
      ),
      label: 'Rôles'
    },
    {
      path: '/access-matrix',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      ),
      label: 'Matrice des Droits'
    }
  ];

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <svg width="32" height="32" viewBox="0 0 60 60" fill="none">
            <rect width="60" height="60" rx="12" fill="#2563eb"/>
            <path d="M20 30L27 37L40 24" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>CDMT Djibouti</span>
        </div>
        <div className="nav-user">
          <div className="user-info">
            <span className="user-name">{user?.firstName} {user?.lastName}</span>
            <span className="user-role">{user?.role.name}</span>
          </div>
          <button onClick={handleLogout} className="logout-button">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/>
            </svg>
            Déconnexion
          </button>
        </div>
      </nav>

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <div className="sidebar-menu">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-label">{item.label}</span>
              </Link>
            ))}
          </div>
        </aside>

        <div className="dashboard-content">
        <div className="welcome-card">
          <h1>Bienvenue dans CDMT</h1>
          <p>Cadre de Dépenses à Moyen Terme - République de Djibouti</p>
        </div>

        <div className="user-details-card">
          <h2>Vos Informations</h2>
          <div className="user-grid">
            <div className="info-item">
              <label>Email</label>
              <p>{user?.email}</p>
            </div>
            <div className="info-item">
              <label>Nom complet</label>
              <p>{user?.firstName} {user?.lastName}</p>
            </div>
            <div className="info-item">
              <label>Téléphone</label>
              <p>{user?.phone || 'Non renseigné'}</p>
            </div>
            <div className="info-item">
              <label>Rôle</label>
              <p>
                <span className="role-badge">{user?.role.name}</span>
              </p>
            </div>
            {user?.ministry && (
              <div className="info-item">
                <label>Ministère</label>
                <p>{user.ministry.name}</p>
              </div>
            )}
          </div>
        </div>

        <div className="permissions-card">
          <h2>Vos Permissions</h2>
          <p className="permissions-count">
            Vous avez accès à {user?.role.permissions.length} permissions
          </p>
          <div className="permissions-grid">
            {user?.role.permissions.slice(0, 12).map((permission: Permission) => (
              <div key={permission.code} className="permission-item">
                <div className="permission-icon">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div className="permission-details">
                  <span className="permission-code">{permission.code}</span>
                  <span className="permission-name">{permission.name}</span>
                </div>
              </div>
            ))}
          </div>
          {user && user.role.permissions.length > 12 && (
            <p className="permissions-more">
              et {user.role.permissions.length - 12} autres permissions...
            </p>
          )}
        </div>

        <div className="modules-card">
          <h2>Modules Disponibles</h2>
          <div className="modules-grid">
            <div className="module-item">
              <div className="module-icon" style={{backgroundColor: '#dbeafe'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                </svg>
              </div>
              <h3>Tableau de Bord</h3>
              <p>Vue d'ensemble et statistiques</p>
            </div>
            <div className="module-item">
              <div className="module-icon" style={{backgroundColor: '#fef3c7'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="9" y1="3" x2="9" y2="21"/>
                </svg>
              </div>
              <h3>Cadre Macro</h3>
              <p>Cadre macroéconomique</p>
            </div>
            <div className="module-item">
              <div className="module-icon" style={{backgroundColor: '#dcfce7'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <h3>CBMT</h3>
              <p>Cadre Budgétaire MT</p>
            </div>
            <div className="module-item">
              <div className="module-icon" style={{backgroundColor: '#e0e7ff'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <h3>CDMT</h3>
              <p>Documents CDMT</p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
