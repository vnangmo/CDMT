-- Script de création de la base de données CDMT
-- À exécuter avec: psql -U postgres -f setup-database.sql

-- Créer la base de données si elle n'existe pas
SELECT 'CREATE DATABASE cdmt_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'cdmt_db')\gexec

-- Se connecter à la base de données
\c cdmt_db

-- Créer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Message de confirmation
SELECT 'Base de données cdmt_db créée avec succès!' as message;
