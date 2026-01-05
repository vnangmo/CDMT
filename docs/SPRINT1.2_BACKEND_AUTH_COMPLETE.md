# Sprint 1.2 - Backend Authentification ✅

**Date:** 03 janvier 2026
**Module:** Authentification JWT + RBAC
**Statut:** Backend TERMINÉ ✅

---

## 🎉 BACKEND AUTHENTIFICATION COMPLÉTÉ

### Fichiers créés

1. **Service d'authentification**
   - `backend/src/services/auth.service.ts` ✅
   - Toutes les fonctions d'authentification JWT

2. **Middleware d'authentification**
   - `backend/src/middleware/auth.middleware.ts` ✅
   - Vérification des tokens
   - Gestion des permissions RBAC
   - Vérification des rôles

3. **Contrôleurs**
   - `backend/src/controllers/auth.controller.ts` ✅
   - Gestion des requêtes HTTP

4. **Routes**
   - `backend/src/routes/auth.routes.ts` ✅
   - Toutes les routes d'authentification

5. **Intégration**
   - `backend/src/server.ts` ✅ (mis à jour)
   - Routes intégrées dans le serveur

---

## 🚀 API ENDPOINTS DISPONIBLES

### Routes publiques

#### 1. Connexion
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@finances.dj",
  "password": "Admin@2026"
}
```

**Réponse:**
```json
{
  "status": "success",
  "message": "Connexion réussie",
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@finances.dj",
      "firstName": "Administrateur",
      "lastName": "Système",
      "role": {
        "id": "uuid",
        "code": "ADMIN",
        "name": "Administrateur Système",
        "permissions": [...]
      },
      "ministry": null
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### 2. Inscription
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "Jean",
  "lastName": "Dupont",
  "phone": "+253 21 35 00 00",
  "roleId": "uuid-role",
  "ministryId": "uuid-ministry" // optionnel
}
```

#### 3. Rafraîchir le token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Routes protégées (Nécessitent un token)

#### 4. Obtenir le profil de l'utilisateur connecté
```http
GET /api/v1/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### 5. Changer le mot de passe
```http
POST /api/v1/auth/change-password
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "oldPassword": "Admin@2026",
  "newPassword": "NewPassword123!"
}
```

#### 6. Déconnexion
```http
POST /api/v1/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## 🔐 SYSTÈME RBAC (Role-Based Access Control)

### Fonctionnalités implémentées

1. **Middleware `authenticate`**
   - Vérifie la présence et la validité du token JWT
   - Ajoute les informations utilisateur à `req.user`

2. **Middleware `authorize(permissions[])`**
   - Vérifie que l'utilisateur a les permissions requises
   - Admin a automatiquement toutes les permissions

3. **Middleware `requireRole(roles[])`**
   - Vérifie que l'utilisateur a l'un des rôles requis

4. **Middleware `optionalAuth`**
   - Authentification optionnelle (ne bloque pas si pas de token)

### Exemple d'utilisation

```typescript
import { authenticate, authorize, requireRole } from '../middleware/auth.middleware';

// Route protégée par authentification
router.get('/protected', authenticate, handler);

// Route nécessitant une permission spécifique
router.post('/create', authenticate, authorize(['CBMT_CREATE']), handler);

// Route réservée à certains rôles
router.get('/admin-only', authenticate, requireRole(['ADMIN']), handler);

// Route avec authentification optionnelle
router.get('/public-or-private', optionalAuth, handler);
```

---

## 📋 PERMISSIONS DISPONIBLES

Toutes ces permissions ont été créées dans le seed:

### Système
- `SYSTEM_CONFIG` - Configuration système
- `USER_MANAGE` - Gestion des utilisateurs

### Macroéconomique
- `MACRO_CREATE`, `MACRO_READ`, `MACRO_UPDATE`, `MACRO_DELETE`

### CBMT
- `CBMT_CREATE`, `CBMT_READ`, `CBMT_UPDATE`, `CBMT_DELETE`, `CBMT_VALIDATE`

### CDMT Global
- `CDMT_GLOBAL_CREATE`, `CDMT_GLOBAL_READ`, `CDMT_GLOBAL_UPDATE`, `CDMT_GLOBAL_DELETE`, `CDMT_GLOBAL_VALIDATE`

### CDMT Sectoriel
- `CDMT_SECTORAL_CREATE`, `CDMT_SECTORAL_READ`, `CDMT_SECTORAL_UPDATE`, `CDMT_SECTORAL_DELETE`, `CDMT_SECTORAL_VALIDATE`

### Référentiels
- `REF_CREATE`, `REF_READ`, `REF_UPDATE`, `REF_DELETE`

### Reporting
- `REPORT_GENERATE`, `REPORT_EXPORT`

---

## 🧪 TESTS RAPIDES

### Avec curl

#### 1. Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@finances.dj","password":"Admin@2026"}'
```

#### 2. Get Me (avec le token obtenu)
```bash
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 3. Change Password
```bash
curl -X POST http://localhost:5000/api/v1/auth/change-password \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"oldPassword":"Admin@2026","newPassword":"NewPass@2026"}'
```

### Avec Postman ou Insomnia

1. **Créer une collection "CDMT API"**

2. **Ajouter une variable d'environnement:**
   - `base_url`: `http://localhost:5000/api/v1`
   - `token`: (sera rempli automatiquement après login)

3. **Créer les requêtes:**
   - Login → Sauvegarder le token dans les variables
   - Utiliser `{{token}}` dans les autres requêtes

---

## 🔒 SÉCURITÉ

### Fonctionnalités implémentées

1. **Hachage des mots de passe**
   - Utilisation de bcrypt avec 10 rounds
   - Les mots de passe ne sont jamais stockés en clair

2. **JWT (JSON Web Tokens)**
   - Token d'accès: expire en 24h
   - Refresh token: expire en 7 jours
   - Signature avec secret configurable

3. **Validation des données**
   - Vérification des champs requis
   - Validation de la longueur du mot de passe (min 8 caractères)

4. **Audit Trail**
   - Toutes les actions sont loggées dans `audit_logs`
   - Login, Logout, Création, Modification

5. **Gestion des sessions**
   - Mise à jour de `lastLogin` à chaque connexion
   - Vérification de l'état actif de l'utilisateur

### Bonnes pratiques appliquées

- ✅ Mots de passe hachés avec bcrypt
- ✅ Tokens JWT signés
- ✅ Vérification de l'état actif des utilisateurs
- ✅ Audit trail complet
- ✅ Gestion des erreurs centralisée
- ✅ Séparation des responsabilités (Service/Controller/Route)

---

## 📊 STRUCTURE DES DONNÉES

### Token Payload
```typescript
{
  userId: string;
  email: string;
  roleId: string;
}
```

### User dans Request (après authentification)
```typescript
req.user = {
  userId: string;
  email: string;
  roleId: string;
  roleCode: string;
  permissions: string[];
}
```

---

## ✅ CHECKLIST

- [x] Service d'authentification créé
- [x] Middleware d'authentification créé
- [x] Middleware de permissions (RBAC) créé
- [x] Middleware de rôles créé
- [x] Contrôleurs créés
- [x] Routes créées et intégrées
- [x] Login fonctionnel
- [x] Register fonctionnel
- [x] Refresh token fonctionnel
- [x] Get Me fonctionnel
- [x] Change password fonctionnel
- [x] Logout fonctionnel
- [x] Audit trail implémenté
- [x] TypeScript types définis
- [x] Gestion d'erreurs

---

## 🎯 PROCHAINES ÉTAPES

### Frontend (En cours)

1. **Créer les pages**
   - Page de login
   - Page de dashboard
   - Page de profil

2. **Redux Store**
   - Slice d'authentification
   - Actions et reducers
   - Persistance du token

3. **Services API**
   - Axios configuré
   - Intercepteurs pour le token
   - Gestion automatique des erreurs

4. **Composants**
   - Formulaire de login Material-UI
   - Protected Routes
   - Menu avec déconnexion

---

## 📚 DOCUMENTATION

### Code Documentation

Tous les fichiers ont des commentaires JSDoc décrivant:
- Les paramètres des fonctions
- Les valeurs de retour
- Les exceptions possibles

### API Documentation

À générer avec Swagger dans une prochaine étape.

---

**Équipe:** Développement CDMT
**Sprint:** 1.2 - Authentification
**Backend:** ✅ TERMINÉ
**Frontend:** 🔄 En cours
**Date:** 03 janvier 2026
