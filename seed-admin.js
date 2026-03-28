const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

// Access the database path from environment variable or default
const dbUrl = process.env.DATABASE_URL || 'C:\\Users\\Salik Riyaz\\AppData\\Roaming\\janwari-industries-billing-software\\janwari.db';
const dbPath = dbUrl.replace(/^file:/, '');

const db = new Database(dbPath);

async function run() {
  console.log('🌱 Seeding Admin User manually...');
  console.log('📂 Database Path:', dbPath);
  
  try {
    const adminPassword = await bcrypt.hash('janwari2024', 12);
    const id = 'clk' + Math.random().toString(36).substr(2, 22); // Mock CUID
    
    // Check if User table exists
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='User'").get();
    if (!tableExists) {
        console.error('❌ Table "User" does not exist. Please run "npx prisma db push" first.');
        process.exit(1);
    }

    const stmt = db.prepare(`
      INSERT INTO User (id, name, username, password, role, isActive, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(username) DO NOTHING
    `);

    const result = stmt.run(
        id,
        'Janwari Admin',
        'admin',
        adminPassword,
        'ADMIN',
        1, // true as 1 in SQLite
        new Date().toISOString()
    );

    if (result.changes > 0) {
        console.log('✅ Admin user "admin" created successfully!');
    } else {
        console.log('ℹ️ Admin user "admin" already exists.');
    }

  } catch (error) {
    console.error('❌ Manual seed failed:', error);
  } finally {
    db.close();
  }
}

run();
