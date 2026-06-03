#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "🚀 Subindo MULTIVUS (Docker)..."
docker compose up -d

echo ""
echo "✅ Pronto. Abra no navegador:"
echo "   http://localhost"
echo "   http://localhost:3255"
echo "   Admin: http://localhost/admin/login  (admin / admin123)"
echo ""
docker compose ps
