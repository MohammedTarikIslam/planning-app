import Database from "better-sqlite3";
import path from "path";

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "data.db");
const db = new Database(dbPath);

// Create the plans table if it does not already exist
db.exec(`
  CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL UNIQUE,

    hotelCost REAL DEFAULT 0,
    flightCost REAL DEFAULT 0,
    activitiesCost REAL DEFAULT 0,
    numberOfPeople INTEGER DEFAULT 1,

    flightsDescription TEXT,
    departureReference TEXT,
    returnReference TEXT,
    flightDate TEXT,
    flightTime TEXT,
    returnDate TEXT,
    returnTime TEXT,
    hotelDescription TEXT,
    hotelName TEXT,
    checkInDate TEXT,
    checkOutDate TEXT,
    foodDescription TEXT,
    activitiesDescription TEXT,
    location TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

export default db;