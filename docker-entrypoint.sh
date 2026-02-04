#!/bin/sh
set -e

# Default backend URL
HALAPI_BACKEND_URL="${VITE_HALAPI_URL:-https://haldev.cybermeet.fr}"

# Generate nginx config with backend URL substitution
envsubst '${HALAPI_BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Generate runtime config for frontend (only token needed, URL uses proxy)
cat > /usr/share/nginx/html/config.js << EOF
window.__ENV__ = {
  VITE_HALAPI_URL: "",
  VITE_HALAPI_TOKEN: "${VITE_HALAPI_TOKEN:-}"
};
EOF

# Start nginx
exec nginx -g 'daemon off;'
