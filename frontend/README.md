# L'Entrepôt — Frontend

Application **React 18 + Vite + TypeScript strict**, design **néo-brutaliste** (bordures épaisses, ombres dures, pas de dégradés), i18n dynamique FR/EN, aucune UI lib externe (CSS custom dans `src/index.css`).

## Démarrage rapide

```bash
cd frontend
npm install
npm run dev        # → http://localhost:5173 (proxy /api → localhost:3001)
```

Production : buildé en statique (`npm run build` → `dist/`), servi par Nginx (voir `../docker-compose.yml`) ou par le backend.

## Commandes

| Commande | Action |
|---|---|
| `npm run dev` | dev Vite (HMR) |
| `npm run build` | typecheck implicite + build `dist/` |
| `npx tsc --noEmit` | typecheck strict (`noUncheckedIndexedAccess`, `noUnusedLocals`) |

## Structure

```
frontend/
├── index.html
├── vite.config.ts          # proxy /api en dev
└── src/
    ├── main.tsx            # providers (I18n, Theme, Auth, Notifications, Modules) + frontLogger
    ├── App.tsx             # router (routes /projects/:id/:tab, /settings/:tab, pages d'erreur)
    ├── pages/              # Dashboard, Projects, ProjectDetail, Stock, Settings, Login, Admin…
    ├── components/         # composants < 60 lignes (Power of 10 R4), par domaine :
    │   │                   # layout/ ui/ auth/ dashboard/ projects/ gantt/ drive/ stock/ settings/ notifications/
    ├── hooks/              # hooks réutilisables (use*.ts)
    ├── context/            # AppContext (auth+thème), NotificationContext (+WebSocket), ModulesContext, I18nContext
    ├── services/           # api.ts (client HTTP + auto-refresh 401), frontLogger.ts
    ├── i18n/locales/       # fr.json + en.json (système dynamique)
    ├── types/              # DTOs front
    └── index.css           # thème néo-brutaliste (variables CSS, .card/.btn/.modal/.badge…)
```

## Thème & i18n

- Thème clair/sombre/**système** + 6 palettes, persistés en localStorage (`AppContext`).
- Langue FR/EN switchée à chaud ; traductions dans `i18n/locales/*.json`, chargées dynamiquement, `t("clé")` sans interpolation (concaténer les variables).

## Documentation

- `docs/ARCHITECTURE.md` — router, contextes, flux de données, règles Power of 10
- `docs/API_CLIENT.md` — client HTTP et tableau des endpoints appelés

Fait avec ❤️ en France 🇫🇷 avec Mistral AI

