const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/database');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3003;

// Auto-setup database on first run
async function setupDatabaseIfNeeded() {
  try {
    console.log('🔍 Checking database connection...');
    
    // Check if tables exist
    const result = await pool.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'players')");
    
    if (!result.rows[0].exists) {
      console.log('🔧 Database tables not found. Running initial setup...');
      
      // Run schema
      const schemaPath = path.join(__dirname, '../database/schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schema);
      console.log('✅ Main schema created');
      
      // Run streak fields migration
      const streakPath = path.join(__dirname, '../database/add_streak_fields.sql');
      if (fs.existsSync(streakPath)) {
        const streakSchema = fs.readFileSync(streakPath, 'utf8');
        await pool.query(streakSchema);
        console.log('✅ Streak fields migration applied');
      }
      
      // Run guest players migration
      const guestPath = path.join(__dirname, '../database/add_guest_tournament_players.sql');
      if (fs.existsSync(guestPath)) {
        const guestSchema = fs.readFileSync(guestPath, 'utf8');
        await pool.query(guestSchema);
        console.log('✅ Guest players migration applied');
      }
      
      console.log('🎉 Database setup completed!');
    } else {
      console.log('✅ Database tables already exist');
      
      // Check and apply missing migrations
      try {
        // Check if current_streak column exists
        const streakCheck = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name='players' AND column_name='current_streak'
        `);
        
        if (streakCheck.rows.length === 0) {
          console.log('🔧 Applying streak fields migration...');
          const streakPath = path.join(__dirname, '../database/add_streak_fields.sql');
          if (fs.existsSync(streakPath)) {
            const streakSchema = fs.readFileSync(streakPath, 'utf8');
            await pool.query(streakSchema);
            console.log('✅ Streak fields migration applied');
          }
        }
      } catch (migrationError) {
        console.log('ℹ️ Migration check:', migrationError.message);
      }
    }
  } catch (error) {
    console.error('❌ Database setup error:', error.message);
    console.error('Full error:', error);
    // Don't exit - let the app start anyway
  }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory (for uploaded images)
// Uploads are handled by the /api/upload routes and stored locally
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '../../frontend/public/uploads');
app.use('/uploads', express.static(UPLOADS_DIR));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/players', require('./routes/players'));
app.use('/api/tournaments', require('./routes/tournaments'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/achievements', require('./routes/achievements'));

// Notifications routes - with explicit logging
const notificationsRouter = require('./routes/notifications');
console.log('[Server] Notifications router loaded, registering at /api/notifications');
app.use('/api/notifications', notificationsRouter);

app.use('/api/upload', require('./routes/upload'));
app.use('/api/pdf', require('./routes/pdf'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Table Tennis Tournament API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  console.error('Error stack:', err.stack);
  console.error('Request URL:', req.url);
  console.error('Request method:', req.method);
  
  // Don't send response if already sent
  if (res.headersSent) {
    return next(err);
  }
  
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  
  // Setup database after server starts
  await setupDatabaseIfNeeded();
});
