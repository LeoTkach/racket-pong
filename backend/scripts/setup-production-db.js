const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

async function setupProductionDatabase() {
  console.log('🚀 Starting production database setup...');
  
  try {
    // Read the main schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📄 Executing main schema...');
    await pool.query(schema);
    console.log('✅ Main schema created successfully');
    
    // Read and execute guest players migration
    const guestPlayersPath = path.join(__dirname, '../database/add_guest_tournament_players.sql');
    if (fs.existsSync(guestPlayersPath)) {
      const guestPlayersSchema = fs.readFileSync(guestPlayersPath, 'utf8');
      console.log('📄 Executing guest players migration...');
      await pool.query(guestPlayersSchema);
      console.log('✅ Guest players migration completed');
    }
    
    // Read and execute achievements migration
    const achievementsPath = path.join(__dirname, '../database/add_achievements_visibility.sql');
    if (fs.existsSync(achievementsPath)) {
      const achievementsSchema = fs.readFileSync(achievementsPath, 'utf8');
      console.log('📄 Executing achievements visibility migration...');
      await pool.query(achievementsSchema);
      console.log('✅ Achievements visibility migration completed');
    }
    
    console.log('🎉 Production database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up production database:', error);
    process.exit(1);
  }
}

setupProductionDatabase();
