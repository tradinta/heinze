const { Pool } = require("@neondatabase/serverless");
const fs = require("fs");
const path = require("path");

// Read and parse .env manually
const envPath = path.join(__dirname, ".env");
let databaseUrl = "";
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const match = envContent.match(/^DATABASE_URL\s*=\s*["']?([^"'\r\n]+)/m);
  if (match) {
    databaseUrl = match[1];
  }
}

if (!databaseUrl) {
  console.error("DATABASE_URL not found in .env");
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Running logs and system configs database migrations...");
    
    // Create logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        event TEXT NOT NULL,
        meta TEXT,
        type TEXT NOT NULL
      );
    `);
    console.log("Verified 'logs' table.");

    // Create system_configs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_configs (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
    console.log("Verified 'system_configs' table.");

    // Seed default Gemini API Key placeholder
    const defaultGeminiKey = 'YOUR_GEMINI_API_KEY_HERE';
    await client.query(`
      INSERT INTO system_configs (key, value)
      VALUES ('gemini_api_key', $1)
      ON CONFLICT (key) DO NOTHING;
    `, [defaultGeminiKey]);
    console.log("Seeded default gemini_api_key config.");
    
    // Seed some initial real log events
    const checkLogs = await client.query("SELECT COUNT(*) FROM logs;");
    if (parseInt(checkLogs.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO logs (event, meta, type) VALUES
        ('System authorized and initialized database tables', 'Neon serverless pool connection verified', 'system'),
        ('Loaded default Heinze library publication list', '2 books seeded', 'system'),
        ('Default system configurations established', 'Gemini API Key configured', 'system');
      `);
      console.log("Seeded initial log traces.");
    }
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
