#!/bin/sh
set -e

# Generate runtime config from environment variables
# This allows VITE_* variables to be set via docker-compose/env vars at container start
cat > /usr/share/nginx/html/config.js << EOF
window.__ENV__ = {
  VITE_HALAPI_URL: "${VITE_HALAPI_URL:-}",
  VITE_HALAPI_TOKEN: "${VITE_HALAPI_TOKEN:-}"
};
EOF

# Start nginx
exec nginx -g 'daemon off;'
