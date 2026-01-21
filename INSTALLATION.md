# 🚀 Installation & Setup Guide

## Prerequisites

Make sure you have the following installed:

- **Node.js**: v14.0 or higher
- **npm**: v6.0 or higher
- **MongoDB**: Local or Atlas account
- **Git**: For version control

### Verify Installation

```bash
node --version    # v14.0.0 or higher
npm --version     # v6.0.0 or higher
```

---

## 📦 Installation Steps

### 1. Clone Repository

```bash
cd /path/to/your/projects
git clone https://github.com/Sachidadubey/mern-ecommerce-backend.git
cd mern-ecommerce-backend
```

### 2. Install Dependencies

```bash
npm install
```

This installs all required packages listed in `package.json`:

- Express 5.2.1
- Mongoose 9.1.0
- JWT & Bcrypt for authentication
- Multer & Cloudinary for file uploads
- Razorpay for payments
- Nodemailer for emails
- And more...

### 3. Create Environment File

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Open in your editor (Windows)
notepad .env

# Or on Mac/Linux
nano .env
```

---

## 🔧 Configure Environment Variables

### Minimum Required Configuration

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/ecommerce
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce

# JWT
JWT_SECRET=your_super_secret_key_change_this_in_production
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=refresh_secret_key
REFRESH_TOKEN_EXPIRE=30d

# Frontend
CLIENT_URL=http://localhost:3000
```

### Additional Services (Optional but Recommended)

#### Cloudinary (File Uploads)

1. Sign up at https://cloudinary.com
2. Get your credentials from dashboard

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Email Service (Nodemailer)

Using Gmail:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
EMAIL_FROM=noreply@yourdomain.com
```

[How to generate Gmail App Password](https://support.google.com/accounts/answer/185833)

#### Razorpay (Payments)

1. Sign up at https://razorpay.com
2. Get keys from dashboard

```env
RAZORPAY_KEY_ID=key_id_from_razorpay
RAZORPAY_KEY_SECRET=key_secret_from_razorpay
RAZORPAY_WEBHOOK_SECRET=webhook_secret
```

---

## 🗄️ Database Setup

### Option 1: Local MongoDB

```bash
# On Windows (if installed)
mongod

# On Mac (using Homebrew)
brew services start mongodb-community

# On Linux
sudo systemctl start mongod
```

### Option 2: MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a project and cluster
4. Get connection string
5. Add to `.env`:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce?retryWrites=true&w=majority
```

**Replace:**

- `username` - your database user
- `password` - your database password
- `cluster` - your cluster name

---

## ▶️ Running the Server

### Development Mode

```bash
npm run dev
```

- Auto-reloads on file changes (using nodemon)
- Shows detailed console logs
- Perfect for development

**Expected Output:**

```
Server running in development mode on port 5000
MongoDb Connected localhost
```

### Production Mode

```bash
npm start
```

- Single process
- Minimal logging
- Optimized for production

---

## 🧪 Testing the API

### Option 1: Using Postman

1. Download [Postman](https://www.postman.com/downloads/)
2. Import the API collection
3. Create requests to test endpoints

### Option 2: Using cURL

```bash
# Test health endpoint
curl http://localhost:5000/health

# Test server status
curl http://localhost:5000/

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Option 3: Using VSCode REST Client

Create file `test.http`:

```
### Test Server
GET http://localhost:5000/

### Register
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

### Login
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Then click "Send Request" above each request.

---

## 📚 Project Structure

```
mern-ecommerce-backend/
├── src/
│   ├── app.js                 # Express app configuration
│   ├── server.js              # Server entry point
│   ├── config/
│   │   ├── db.js              # Database connection
│   │   ├── cloudinary.js      # Cloudinary config
│   │   ├── email.js           # Email config
│   │   └── razorPay.js        # Razorpay config
│   ├── controllers/           # Request handlers
│   ├── routes/                # API routes
│   ├── models/                # Mongoose schemas
│   ├── services/              # Business logic
│   ├── middlewares/           # Custom middlewares
│   ├── utils/                 # Helper functions
│   ├── validations/           # Zod schemas
│   ├── cron/                  # Scheduled tasks
│   └── gateway/               # Payment gateway
├── .env.example               # Environment template
├── package.json               # Dependencies
├── API_DOCUMENTATION.md       # API docs
├── DEPLOYMENT.md              # Deployment guide
└── README.md                  # Project readme
```

---

## 🔌 Available npm Scripts

```bash
# Development with auto-reload
npm run dev

# Production mode
npm start

# Run tests (if configured)
npm test
```

---

## 🐛 Troubleshooting

### Issue: MongoDB Connection Error

**Error:** `MongoDb Connection Error`

**Solution:**

- Verify MongoDB is running: `mongod`
- Check MONGO_URI in `.env`
- Verify connection string format
- Test connection: `mongosh "mongodb+srv://..."`

### Issue: Port Already in Use

**Error:** `listen EADDRINUSE: address already in use :::5000`

**Solution:**

```bash
# Find process using port 5000
lsof -i :5000  # On Mac/Linux
netstat -ano | findstr :5000  # On Windows

# Kill the process
kill -9 <PID>  # On Mac/Linux
taskkill /PID <PID> /F  # On Windows

# Or use a different port
PORT=5001 npm run dev
```

### Issue: Cloudinary Upload Error

**Error:** `Cloudinary configuration error`

**Solution:**

- Verify all three Cloudinary variables in `.env`:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
- Regenerate API keys from Cloudinary dashboard

### Issue: Email Service Not Working

**Error:** `Email sending failed`

**Solution:**

- For Gmail: Use App-specific password, not regular password
- Verify SMTP credentials in `.env`
- Try different email service (Resend, SendGrid, etc.)

### Issue: Razorpay Webhook Not Triggering

**Error:** Payments created but webhook not called

**Solution:**

- Verify webhook URL in Razorpay dashboard
- Check webhook secret matches `RAZORPAY_WEBHOOK_SECRET`
- Ensure server is publicly accessible
- Test webhook from Razorpay dashboard

---

## 📖 Documentation Files

Read these for more information:

- **API_DOCUMENTATION.md** - Complete API reference
- **DEPLOYMENT.md** - How to deploy to production
- **PRODUCTION_CHECKLIST.md** - Pre-deployment checks

---

## 🔐 Security Best Practices

1. **Never commit `.env` file**

   ```bash
   # Verify .env is in .gitignore
   cat .gitignore
   ```

2. **Use strong JWT secrets**

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Keep dependencies updated**

   ```bash
   npm audit          # Check for vulnerabilities
   npm audit fix      # Fix vulnerabilities
   npm update         # Update packages
   ```

4. **Environment variables for sensitive data**
   - Never hardcode API keys
   - Use `.env.example` for reference
   - Different secrets for dev/prod

---

## 🚀 Next Steps

1. ✅ Complete the installation
2. ✅ Configure all environment variables
3. ✅ Test API endpoints
4. ✅ Connect with frontend
5. ✅ Deploy to production (see DEPLOYMENT.md)

---

## 📞 Getting Help

If you encounter issues:

1. Check the error message carefully
2. Review relevant documentation
3. Check browser console for errors
4. Review server logs: `npm run dev`
5. Search the issue online
6. Ask for help in the project repository

---

## 📝 Common Configurations

### Development with Auto-reload

Already configured with nodemon in `package.json`

### Debug Mode

```bash
DEBUG=* npm run dev
```

### Different Port

```bash
PORT=3001 npm run dev
```

### Connected to Frontend

Make sure `CLIENT_URL` in `.env` matches your frontend URL:

```env
CLIENT_URL=http://localhost:3000
```

---

**Installation Complete!** 🎉

Your backend is now ready for development. Start with `npm run dev` and begin building!
