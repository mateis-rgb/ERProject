# L'Entrepôt — Backend (API)

API REST en **Node.js + Express + Prisma (PostgreSQL)**, TypeScript strict, règles d'ingénierie **Power of 10** appliquées à tout le code (fonctions < 60 lignes, boucles bornées, pas de récursion, assertions, retours vérifiés).

## Démarrage rapide

```bash
cd backend
cp .env.example .env        # éditer DATABASE_URL, SESSION_SECRET, ...
npm install
npx prisma migrate dev      # applique les migrations
npm run dev                 # ts-node-dev → http://localhost:3001 (rechargement auto)
```

Production (Docker) : voir `../docker-compose.yml` et `../docker/README.md`.

## Variables d'environnement (voir `.env.example`)

| Variable | Défaut | Rôle |
|---|---|---|
| `PORT` | `3001` | port HTTP(S) |
| `DATABASE_URL` | — | connexion PostgreSQL (obligatoire) |
| `SESSION_SECRET` | — | secret de session (≥ 16 caractères, obligatoire) |
| `SESSION_MAX_AGE` | `86400000` | durée de session (ms) |
| `UPLOAD_DIR` | `./uploads` | dossier de stockage par défaut des fichiers du drive (remplaçable à chaud via `storage_path`) |
| `MAX_UPLOAD_SIZE` | `52428800` | taille max d'upload (octets) |
| `BACKUP_DIR` / `BACKUP_HOUR` | `./backups` / `3` | backups pg_dump automatiques |
| `HTTPS`, `SSL_KEY_PATH`, `SSL_CERT_PATH` | `false` / — | TLS local (voir `../scripts/setup-https.sh`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `admin@entrepot.local` / `admin123456` | compte admin créé au boot |

## Structure

```
backend/
├── prisma/schema.prisma    # modèle de données (UUID, relations, index)
├── src/
│   ├── index.ts            # bootstrap, montage des routers, error handler global
│   ├── config/             # env (validée au boot) + client Prisma
│   ├── routes/             # endpoints REST (1 fichier par domaine)
│   ├── services/           # logique métier (Power of 10)
│   ├── middleware/         # auth (session + JWT refresh), rôles, validation Zod, modules
│   ├── types/schemas.ts    # schémas Zod des bodies/queries
│   └── utils/              # power10 (assert, boucles bornées), seed admin
└── docs/                   # documentation (API.md, ARCHITECTURE.md)
```

## Commandes

| Commande | Action |
|---|---|
| `npm run dev` | dev avec rechargement auto (ts-node-dev) |
| `npm run build` | compile TypeScript → `dist/` |
| `npm start` | lance `dist/` |
| `npx tsc --noEmit` | typecheck strict |
| `npx prisma migrate dev` | migrations en dev |
| `npx prisma migrate deploy` | migrations en prod |
| `npx prisma studio` | UI de la base |

## Documentation

- `docs/API.md` — **toutes les routes**, conventions de réponse, rôles, modules, rate limiting
- `docs/ARCHITECTURE.md` — couches, services, WebSocket, sécurité, règles Power of 10

Fait avec ❤️ en France 🇫🇷 avec Mistral AI

