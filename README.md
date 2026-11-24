# ERProjects — Gestion de projets & stock (self-hosted)

Application web self-hosted pour gérer tes projets (monde de la vidéo) et le stock de matériel associé, en équipe (2–10 personnes).

## 🚀 Démarrage rapide (Docker Compose)

```bash
# 1. Copier les variables d'environnement
cp .env.example .env
# Éditer .env : change DB_PASSWORD et SESSION_SECRET

# 2. Lancer tout
 docker compose up -d --build

# 3. Ouvrir l'app
# → http://localhost  (frontend)
# → http://localhost:3001/health  (API)
```

**Premier compte admin** (créé automatiquement au démarrage) :
- Email : valeur de `ADMIN_EMAIL` (défaut: `admin@erProjects.local`)
- Mot de passe : valeur de `ADMIN_PASSWORD` (défaut: `admin123456`)

> ⚠️ Change le mot de passe admin après la première connexion.

## 📁 Structure

```
gestion-projets-stock/
├── .dev/                   # Roadmap + PROJECT_BRIEF (spécifications)
├── backend/                # API Node.js + Express + Prisma (TypeScript strict)
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── config/         # env + client Prisma
│   │   ├── services/       # logique métier (Power of 10)
│   │   ├── routes/         # endpoints REST
│   │   ├── middleware/     # auth session + validation Zod + modules
│   │   └── types/          # DTOs + schémas Zod
│   ├── README.md
│   └── docs/               # API.md (routes) + ARCHITECTURE.md
├── frontend/               # React + Vite + TS strict (design néo-brutaliste)
│   ├── src/
│   │   ├── pages/          # Dashboard, Projects, ProjectDetail, Stock, Settings…
│   │   ├── components/     # sous-composants < 60 lignes (Power of 10)
│   │   ├── context/        # Auth + Thème + Notifications + Modules + i18n
│   │   └── services/       # api.ts (auto-refresh 401) + frontLogger
│   ├── README.md
│   └── docs/               # ARCHITECTURE.md + API_CLIENT.md
├── scripts/                # setup-https.sh (certificats TLS locaux mkcert)
│   └── docs/README.md
├── docker/                 # doc déploiement (docker-compose.yml est à la racine)
│   └── docs/README.md
└── docker-compose.yml      # db (PostgreSQL) + backend + frontend (Nginx)
```

## ✨ Fonctionnalités

| Domaine | Détails |
|---------|---------|
| **Projets** | nom, description, statut (liste modifiable), dates, budget, client, tags, type (liste modifiable), collaborateurs |
| **Stock** | nom, référence, quantité, unité, catégorie, fournisseur, prix, emplacement, seuil min, alertes stock faible |
| **Liaison** | allocation stricte + prévisionnel + consommation tracée par mouvement |
| **Mouvements** | entrée / sortie / retour avec utilisateur, date, raison, projet lié |
| **Suivi** | temps passé par projet, journal d'activité, pièces jointes (drive) |
| **Transverse** | recherche, export CSV/JSON, KPIs dashboard, backup quotidien auto |
| **Multi-users** | rôles ADMIN / EDITOR / VIEWER, sessions PostgreSQL |
| **UI** | dark mode par défaut, 5 palettes de couleurs, responsive desktop |

## 🛠️ Développement local (sans Docker)

```bash
# Backend
cd backend
cp .env.example .env
# éditer DATABASE_URL (PostgreSQL local)
npm install
npx prisma migrate dev
npm run dev          # → http://localhost:3001

# Frontend (autre terminal)
cd frontend
npm install
npm run dev          # → http://localhost:5173 (proxy API auto)
```

## 🔐 Sécurité

- Sessions stockées en PostgreSQL (`connect-pg-simple`)
- Mots de passe hashés avec bcrypt (10 rounds)
- Validation Zod sur toutes les entrées API
- Rôles vérifiés côté serveur (middleware `requireRole`)
- `tsconfig` strict + `noUncheckedIndexedAccess` (warnings = erreurs)

## 📏 Power of 10

Tout le code respecte les 10 règles d'ingénierie du code critique :
fonctions < 60 lignes, boucles bornées (`MAX_ITERATIONS`), assertions,
vérification des retours, portée minimale, pas de récursivité.
Chaque fichier est vérifié automatiquement par le hook `power-of-10:lint`.

## 📦 API REST (aperçu)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/register` | Inscription |
| GET | `/api/auth/me` | Utilisateur courant |
| GET/POST | `/api/projects` | Lister / créer des projets |
| GET/PATCH/DELETE | `/api/projects/:id` | Détail / màj / suppr |
| GET/POST | `/api/projects/:id/stock` | Liaisons stock |
| GET/POST | `/api/projects/:id/time` | Suivi du temps |
| GET/POST | `/api/stock` | Lister / créer des articles |
| POST | `/api/stock/movements` | Enregistrer un mouvement |
| GET | `/api/stock/export/csv` | Export CSV |
| GET | `/api/dashboard` | KPIs |
| GET/PUT | `/api/config/:key` | Listes modifiables |
| POST | `/api/attachments/project/:id` | Upload fichier |

## 💾 Backups

Un `pg_dump` automatique est exécuté chaque jour à l'heure définie par `BACKUP_HOUR` (défaut 3h).
Les 30 derniers backups sont conservés dans le volume `erProjects_backups`.
