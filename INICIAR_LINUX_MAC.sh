#!/bin/sh
set -eu
cd "$(dirname "$0")"
command -v node >/dev/null 2>&1 || { echo 'Instale Node.js 20 ou superior.'; exit 1; }
echo 'Abra http://127.0.0.1:8080/ no navegador.'
node scripts/serve.js
