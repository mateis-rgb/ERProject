#!/usr/bin/env bash
# ============================================================
# setup-https.sh — Génère des certificats HTTPS locaux avec mkcert
# Usage: ./scripts/setup-https.sh
# ============================================================
set -euo pipefail

CERTS_DIR="$(cd "$(dirname "$0")/.." && pwd)/certs"
mkdir -p "$CERTS_DIR"

if ! command -v mkcert &> /dev/null; then
    echo "❌ mkcert non trouvé. Installation:"
    echo "   macOS:  brew install mkcert && mkcert -install"
    echo "   Linux:  apt install libnss3-tools && brew install mkcert (ou voir https://github.com/FiloSottile/mkcert)"
    exit 1
fi

# Installe l'autorité de certification locale dans le trousseau (une seule fois)
mkcert -install 2>/dev/null || true

cd "$CERTS_DIR"
mkcert -key-file localhost-key.pem -cert-file localhost.pem localhost 127.0.0.1 ::1 2>&1

echo ""
echo "✅ Certificats générés dans $CERTS_DIR"
echo ""
echo "Ajoute dans backend/.env :"
echo "  HTTPS=true"
echo "  SSL_KEY_PATH=$CERTS_DIR/localhost-key.pem"
echo "  SSL_CERT_PATH=$CERTS_DIR/localhost.pem"
echo ""
echo "Puis relance: cd backend && npm run dev  →  https://localhost:3001"
echo "Frontend:     cd frontend && npm run dev →  https://localhost:5173"
