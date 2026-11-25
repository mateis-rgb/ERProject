# L'Entrepôt — Docker

Le déploiement conteneurisé utilise le **`docker-compose.yml` à la racine du projet** (le dossier `docker/` accueille la documentation de déploiement).

## Services

| Service | Image | Rôle |
|---|---|---|
| `db` | `postgres:16-alpine` | PostgreSQL 16, volume `entrepot_db_data`, healthcheck `pg_isready` |
| `backend` | build `./backend/Dockerfile` | API Express+Prisma, port 3001, `UPLOAD_DIR=/app/uploads` (volume) |
| `frontend` | build `./frontend/Dockerfile` | build Vite + Nginx statique, port 80, proxy `/api` et WebSocket vers le backend |

## Démarrage

```bash
cp .env.example .env        # DB_PASSWORD, SESSION_SECRET, ...
docker compose up -d --build
# → app sur http://localhost , API sur http://localhost:3001/health
```

## Mises à jour (prod)

Aucune mise à jour n'est exécutée depuis l'app : la procédure guidée est dans Réglages → À propos. En prod Docker :

```bash
pg_dump "$DATABASE_URL" > entrepot-backup-$(date +%F).sql   # 1. backup BDD
docker compose pull && docker compose up -d                    # 2. récupère + redémarre
curl -s http://localhost:3001/health                           # 3. vérifie (migrations Prisma au boot)
```

Voir `docs/README.md` pour le détail (volumes, env, HTTPS, dev vs prod).
