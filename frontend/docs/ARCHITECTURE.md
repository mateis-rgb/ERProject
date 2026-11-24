# ERProjects — Architecture frontend

## Flux général

```
main.tsx → providers (I18n > ErrorBoundary > Theme > Auth > Notifications > Modules)
              └── App.tsx → Layout (Sidebar fixe + TopBar + CommandPalette) → Routes
                            └── pages/ → components/<domaine>/ → hooks/ → services/api.ts → backend
```

## Router (`App.tsx`)

- Routes principales : `/`, `/projects`, `/projects/:id`, `/projects/:id/:tab` (tab = `dashboard|stock|planning|drive|settings`), `/stock`, `/settings`, `/settings/:tab`, `/admin`, `/login`.
- **Onglets = routes** : l'onglet actif est lu depuis l'URL, les onglets indisponibles (module off / rôle) redirigent vers l'onglet par défaut.
- Page d'erreur générique (`ErrorPage`) pour le 404 et suivantes, `ErrorBoundary` React global.

## Contextes (`src/context/`)

| Contexte | Rôle |
|---|---|
| `AppContext` | auth (login/logout/me, auto-refresh) + thème (clair/sombre/système + palette) |
| `NotificationContext` | notifications + **WebSocket** temps réel (événement `notification` → refresh), markRead, dismiss, clearAll |
| `ModulesContext` | lit `enabled_modules` (`GET /api/config/enabled_modules`) → `enabled(id)` pilote l'affichage (sidebar, onglets, cloche, export PDF, templates) |
| `I18nContext` | langue courante + `t(key)` depuis les JSON chargés dynamiquement |

## Services (`src/services/`)

- `api.ts` : client fetch avec `credentials: "include"`, **auto-refresh du token sur 401** (retry une fois), méthodes `get/post/put/patch/delete` → `{ success, data | error }`.
- `frontLogger.ts` : capture `console.warn/error` + `window.onerror`/`unhandledrejection` dans un buffer borné (300) → onglet Status/Logs.

## Composants

- Un composant par fichier, **< 60 lignes par fonction** (règle Power of 10 R4) : la logique lourde est extraite en hooks (`useMilestoneDrag`, `useDriveModal`, `useMigrationPoll`…) ou sous-composants dans le même fichier.
- Styles inline + classes utilitaires de `index.css` (`.card`, `.btn`, `.btn-ghost`, `.btn-danger`, `.modal-backdrop`, `.modal`, `.badge`, `.input`, `.select`, variables `--ink`, `--accent`, `--surface`, `--danger`…). Thème clair/sombre via variables CSS sur `:root` / `[data-theme="dark"]`.
- Modales : `ConfirmModal` (générique), ou modales dédiées (jalon, drive, migration, équipe, mises à jour, repo).

## Modules (`ModulesContext`)

Les modules (`gantt`, `drive`, `stock`, `notifications`, `export_pdf`, `templates`) masquent : le lien Stock de la sidebar, les onglets projet concernés, la cloche de notifications, le bouton export PDF, l'onglet modèles des réglages — et redirigent si l'onglet actif devient indisponible. Le backend renvoie `403` sur les routes du module (double protection).

## Règles appliquées

TypeScript strict (`noUncheckedIndexedAccess` → toujours `??`/gardes sur les index), Power of 10 R4 (composants < 60 lignes), pas de récursion, boucles bornées.
