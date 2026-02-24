#!/bin/bash
# Deployment helper script for mpdlog-vue

set -e

DEPLOY_DIR="/var/www/mpdlog"
NGINX_CONF="/etc/nginx/sites-available/mpdlog"
BACKUP_DIR="/var/backups/mpdlog-$(date +%Y%m%d-%H%M%S)"

echo "=== MPDLog Vue Deployment Script ==="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Run this script from the project root."
    exit 1
fi

# Build the application
echo "1. Building application..."
npm run build

if [ ! -d "dist" ]; then
    echo "Error: Build failed - dist directory not found"
    exit 1
fi

echo "   ✓ Build successful"
echo ""

# Backup existing deployment if it exists
if [ -d "$DEPLOY_DIR" ]; then
    echo "2. Backing up existing deployment..."
    sudo mkdir -p "$(dirname "$BACKUP_DIR")"
    sudo cp -r "$DEPLOY_DIR" "$BACKUP_DIR"
    echo "   ✓ Backed up to: $BACKUP_DIR"
else
    echo "2. No existing deployment found (first deploy)"
fi
echo ""

# Deploy
echo "3. Deploying to $DEPLOY_DIR..."
sudo mkdir -p "$DEPLOY_DIR"
sudo cp -r dist/* "$DEPLOY_DIR/"
sudo chown -R www-data:www-data "$DEPLOY_DIR"
echo "   ✓ Files deployed"
echo ""

# Nginx configuration
echo "4. Nginx configuration..."
if [ ! -f "$NGINX_CONF" ]; then
    cat << 'EOF' | sudo tee "$NGINX_CONF" > /dev/null
server {
    listen 80;
    server_name 192.168.1.2 localhost;

    root /var/www/mpdlog;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # WebSocket proxy to mpdgolinger
    location /ws {
        proxy_pass http://127.0.0.1:8008/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    # Music files for audio playback
    location /music/ {
        alias /library/music/;
        autoindex off;
    }

    # Static assets
    location /android-icon-96x96.png {
        alias /var/www/html/android-icon-96x96.png;
    }

    location /webapp-icon.png {
        alias /var/www/html/webapp-icon.png;
    }

    location /favicon-32x32.png {
        alias /var/www/html/favicon-32x32.png;
    }

    location /favicon.ico {
        alias /var/www/html/favicon.ico;
    }

    location /manifest.json {
        alias /var/www/html/manifest.json;
    }
}
EOF
    
    echo "   ✓ Created nginx configuration"
    
    # Enable site
    if [ ! -L "/etc/nginx/sites-enabled/mpdlog" ]; then
        sudo ln -s "$NGINX_CONF" /etc/nginx/sites-enabled/
        echo "   ✓ Enabled site"
    fi
else
    echo "   ⚠ Nginx config already exists at $NGINX_CONF"
    echo "     Review and update manually if needed"
fi
echo ""

# Test nginx configuration
echo "5. Testing nginx configuration..."
sudo nginx -t
echo "   ✓ Nginx config OK"
echo ""

# Reload nginx
echo "6. Reloading nginx..."
sudo systemctl reload nginx
echo "   ✓ Nginx reloaded"
echo ""

echo "=== Deployment Complete ==="
echo ""
echo "Your Vue app should now be available at:"
echo "  http://192.168.1.2/"
echo ""
echo "Make sure mpdgolinger is running:"
echo "  sudo systemctl status mpdgolinger"
echo ""
echo "To rollback, restore from:"
echo "  $BACKUP_DIR"
