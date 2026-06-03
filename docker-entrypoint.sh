#!/bin/sh
set -e

UPLOAD_DIR="/app/public/uploads"
mkdir -p "$UPLOAD_DIR"
# Volume bind do host: root no container corrige dono para nextjs (funciona com userns-remap)
chown -R nextjs:nodejs "$UPLOAD_DIR" 2>/dev/null || true
chmod 775 "$UPLOAD_DIR" 2>/dev/null || true

exec gosu nextjs "$@"
