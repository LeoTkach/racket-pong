#!/bin/bash

# Guest Player System Setup Script
# This script sets up the guest player registration system

echo "🏓 Table Tennis Tournament - Guest Player System Setup"
echo "======================================================"
echo ""

# Navigate to project root
cd "$(dirname "$0")"

# Step 1: Install backend dependencies
echo "📦 Step 1: Installing backend dependencies..."
cd backend
npm install nodemailer
if [ $? -eq 0 ]; then
  echo "✅ Backend dependencies installed"
else
  echo "❌ Failed to install backend dependencies"
  exit 1
fi
echo ""

# Step 2: Apply database migration
echo "🗄️  Step 2: Applying database migration..."
node scripts/database/apply-guest-players-migration.js
if [ $? -eq 0 ]; then
  echo "✅ Database migration completed"
else
  echo "❌ Failed to apply database migration"
  echo "Make sure your database is running and configured correctly"
  exit 1
fi
echo ""

# Step 3: Check email configuration
echo "📧 Step 3: Checking email configuration..."
if grep -q "EMAIL_USER=" .env 2>/dev/null && grep -q "EMAIL_PASSWORD=" .env 2>/dev/null; then
  echo "✅ Email configuration found in .env"
else
  echo "⚠️  Email configuration not found"
  echo ""
  echo "To enable email notifications, add to backend/.env:"
  echo ""
  echo "EMAIL_USER=your-email@gmail.com"
  echo "EMAIL_PASSWORD=your-app-password"
  echo "EMAIL_HOST=smtp.gmail.com"
  echo "EMAIL_PORT=587"
  echo ""
  echo "See backend/EMAIL_SETUP.md for detailed instructions"
  echo ""
  echo "Note: System will work without email (notifications will be disabled)"
fi
echo ""

# Step 4: Summary
echo "✨ Setup Complete!"
echo ""
echo "📚 Next Steps:"
echo "1. Read GUEST_PLAYER_SYSTEM.md for full documentation"
echo "2. Read backend/EMAIL_SETUP.md for email configuration"
echo "3. Restart your backend server"
echo "4. Test guest registration on a tournament page"
echo ""
echo "🎉 Your tournament system now supports guest players!"
