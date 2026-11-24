# Scripts — documentation

## `setup-https.sh`

Génère une paire de certificats TLS de confiance locale (via [mkcert](https://github.com/FiloSottile/mkcert)) pour `localhost`, `127.0.0.1` et `::1`.

```bash
./scripts/setup-https.sh
```

Prérequis : `mkcert` installé et son autorité locale installée dans le trousseau (`mkcert -install`) :

- macOS : `brew install mkcert && mkcert -install`
- Linux : paquet `libnss3-tools` + binaire mkcert

Le script crée `certs/localhost.pem` et `certs/localhost-key.pem` à la racine du projet, puis indique les variables à ajouter dans `backend/.env` :

```
HTTPS=true
SSL_KEY_PATH=<racine>/certs/localhost-key.pem
SSL_CERT_PATH=<racine>/certs/localhost.pem
```

Relancer ensuite `npm run dev` dans `backend/` (→ `https://localhost:3001`) et `frontend/` (→ `https://localhost:5173`). Le proxy Vite et le WebSocket suivent automatiquement le protocole.

> `certs/` doit rester hors git (ajouter au `.gitignore` si ce n'est pas déjà le cas).
