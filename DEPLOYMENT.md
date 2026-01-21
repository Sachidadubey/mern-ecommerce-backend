# 🚀 Production Deployment Guide - E-commerce Backend

## Pre-Deployment Checklist

### ✅ Environment Configuration

- [ ] Create `.env` file from `.env.example`
- [ ] Set `NODE_ENV=production`
- [ ] Update all sensitive keys (JWT_SECRET, API keys, etc.)
- [ ] Set strong, unique database passwords
- [ ] Configure Razorpay keys for production environment
- [ ] Update `CLIENT_URL` to your frontend domain

### ✅ Security

- [ ] Enable HTTPS/SSL certificates
- [ ] Set `secure: true` in cookie options
- [ ] Update CORS origin to your frontend URL only
- [ ] Verify all environment variables are set
- [ ] Check helmet security headers are configured
- [ ] Review rate limiting thresholds
- [ ] Enable MongoDB authentication

### ✅ Database

- [ ] MongoDB Atlas cluster configured
- [ ] Database backups enabled
- [ ] Connection string uses production environment
- [ ] Database indexes created for performance
- [ ] User collection has proper indexing on email

### ✅ Third-party Services

- [ ] Cloudinary account configured
- [ ] Email service (Nodemailer/Resend) tested
- [ ] Razorpay production keys configured
- [ ] Webhook URL configured in Razorpay dashboard
- [ ] Twilio credentials (if using SMS)

### ✅ Application

- [ ] All routes tested
- [ ] Error handling verified
- [ ] Logging configured
- [ ] JWT tokens and refresh tokens working
- [ ] Payment webhook tested
- [ ] Email notifications tested

### ✅ Performance

- [ ] Database indexes created
- [ ] Cron jobs scheduled properly
- [ ] Rate limiting configured appropriately
- [ ] Node cluster/PM2 configured for multi-core

---

## Deployment Steps

### 1. Install PM2 for Process Management

```bash
npm install -g pm2
```

### 2. Create PM2 Ecosystem File

Create `ecosystem.config.js` in project root:

```javascript
module.exports = {
  apps: [
    {
      name: "ecommerce-backend",
      script: "./src/server.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      error_file: "./logs/error.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      watch: false,
      ignore_watch: ["node_modules", "logs"],
      max_memory_restart: "500M",
    },
  ],
};
```

### 3. Start Application with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. Verify Running Process

```bash
pm2 list
pm2 logs ecommerce-backend
```

### 5. Setup Nginx Reverse Proxy

Create `/etc/nginx/sites-available/ecommerce`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;

    # Reverse Proxy to Node.js
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Webhook endpoint (no timeout)
    location /api/payment/webhook {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/ecommerce /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Setup SSL Certificate (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com
```

### 7. Database Backups

Setup daily backup:

```bash
# Install MongoDB tools
sudo apt-get install mongodb-clients

# Create backup script
cat > /home/ubuntu/backup-db.sh << 'EOF'
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/ecommerce" --out="/backups/ecommerce_$TIMESTAMP"
EOF

chmod +x /home/ubuntu/backup-db.sh

# Add to crontab for daily backup at 2 AM
0 2 * * * /home/ubuntu/backup-db.sh
```

### 8. Monitoring & Logs

```bash
# View logs
pm2 logs ecommerce-backend

# Monitor resources
pm2 monit

# Setup email notifications
npm install pm2-auto-pull
pm2 install pm2-auto-pull
```

---

## Production API Endpoints

### Base URL

```
https://your-domain.com/api
```

### Auth Endpoints

- `POST /auth/register` - Register user
- `POST /auth/verify-otp` - Verify email OTP
- `POST /auth/resend-otp` - Resend OTP
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout (Protected)
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

### Product Endpoints

- `GET /products` - Get all products (with pagination)
- `GET /products/:id` - Get single product
- `POST /products` - Create product (Admin only)
- `PUT /products/:id` - Update product (Admin only)
- `DELETE /products/:id` - Delete product (Admin only)

### Cart Endpoints

- `GET /cart` - Get user cart
- `POST /cart` - Add to cart
- `PUT /cart/:itemId` - Update cart item
- `DELETE /cart/:itemId` - Remove from cart

### Order Endpoints

- `POST /orders` - Create order
- `GET /orders` - Get user orders
- `GET /orders/:id` - Get single order
- `PUT /orders/:id/cancel` - Cancel order

### Payment Endpoints

- `POST /payment/create-order` - Create Razorpay order
- `POST /payment/verify` - Verify payment
- `POST /payment/webhook` - Razorpay webhook

### Review Endpoints

- `POST /reviews` - Add review
- `GET /reviews/:productId` - Get product reviews
- `DELETE /reviews/:id` - Delete review

### Wishlist Endpoints

- `GET /wishlist` - Get wishlist
- `POST /wishlist` - Add to wishlist
- `DELETE /wishlist/:productId` - Remove from wishlist

---

## Performance Optimization

### Database

```javascript
// Ensure indexes are created
db.users.createIndex({ email: 1 });
db.products.createIndex({ category: 1, isDeleted: 1 });
db.orders.createIndex({ user: 1, createdAt: -1 });
```

### Caching

Consider implementing Redis for:

- Session storage
- Cache popular products
- Rate limiting with Redis

### Monitoring

Setup monitoring dashboard:

```bash
pm2 install pm2-logrotate
pm2 install pm2-web
# Access at http://localhost:9615
```

---

## Troubleshooting

### High Memory Usage

```bash
# Check process memory
pm2 show ecommerce-backend

# Increase restart threshold
pm2 restart ecommerce-backend --max-memory-restart 1G
```

### Database Connection Issues

```bash
# Test connection
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/ecommerce"
```

### Payment Webhook Not Working

1. Verify webhook URL in Razorpay dashboard
2. Check Razorpay webhook secret matches `.env`
3. Test webhook manually through Razorpay dashboard

### CORS Issues

Verify `CLIENT_URL` in `.env` matches frontend domain exactly

---

## Rollback Plan

```bash
# Keep previous version running
pm2 save
pm2 list

# In case of issues
pm2 restart ecommerce-backend
pm2 restart --force ecommerce-backend

# View previous logs
pm2 logs ecommerce-backend --err
```

---

## Post-Deployment

- [ ] Test all API endpoints in production
- [ ] Verify webhook integration
- [ ] Monitor error logs for 24 hours
- [ ] Check performance metrics
- [ ] Test payment flow end-to-end
- [ ] Verify email notifications
- [ ] Check database backups are running
- [ ] Setup monitoring alerts

---

## Support & Documentation

For more information:

- Express.js: https://expressjs.com
- MongoDB: https://docs.mongodb.com
- Razorpay: https://razorpay.com/docs
- PM2: https://pm2.keymetrics.io/docs
- Nginx: https://nginx.org/en/docs
