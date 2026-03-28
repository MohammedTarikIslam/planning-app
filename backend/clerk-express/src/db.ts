import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data.db");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL UNIQUE,

    accommodationcost REAL DEFAULT 0,
    travelcost REAL DEFAULT 0,
    activitiescost REAL DEFAULT 0,
    numberofpeople INTEGER DEFAULT 1,
    
    traveldesc TEXT,
    departureref TEXT,
    returnref TEXT,
    flightdate TEXT,
    flighttime TEXT,
    returndate TEXT,
    returntime TEXT,
    hoteldesc TEXT,
    hotelname TEXT,
    checkindate TEXT,
    checkoutdate TEXT,
    fooddesc TEXT,
    activitiesdesc TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

export default db;