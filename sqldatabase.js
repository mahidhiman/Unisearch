const sqlite3 = require("sqlite3").verbose();

// Create a new database
let db = new sqlite3.Database("./university.db", (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Connected to the university database.");
});

// Create tables
db.serialize(() => {
  // Create university table with updated columns
  db.run(`CREATE TABLE IF NOT EXISTS university (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            country TEXT NOT NULL,
            campus_name TEXT NOT NULL,
            city TEXT NOT NULL,
            created_on DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

  // Create course table
  db.run(`CREATE TABLE IF NOT EXISTS course (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        university_id INTEGER,
        requirement_id INTEGER,
        fees REAL NOT NULL,
        duration INTEGER NOT NULL,
        intake TEXT NOT NULL,
        link TEXT NOT NULL,
        FOREIGN KEY (requirement_id) REFERENCES requirements(id),
        FOREIGN KEY (university_id) REFERENCES university(id)
    )`);

  // Create requirements table
  db.run(`CREATE TABLE IF NOT EXISTS requirements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER,
        requirement TEXT NOT NULL,
        ielts_id INTEGER,
        pte_id INTEGER,
        FOREIGN KEY (course_id) REFERENCES course(id),
        FOREIGN KEY (ielts_id) REFERENCES ielts(id),
        FOREIGN KEY (pte_id) REFERENCES pte(id)
    )`);

  // Create ielts table
  db.run(`CREATE TABLE IF NOT EXISTS ielts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reading REAL CHECK(reading BETWEEN 0.0 AND 9.0) NOT NULL,
        listening REAL CHECK(listening BETWEEN 0.0 AND 9.0) NOT NULL,
        writing REAL CHECK(writing BETWEEN 0.0 AND 9.0) NOT NULL,
        speaking REAL CHECK(speaking BETWEEN 0.0 AND 9.0) NOT NULL,
        overall REAL CHECK(overall BETWEEN 0.0 AND 9.0) NOT NULL
    )`);

  // Create pte table
  db.run(`CREATE TABLE IF NOT EXISTS pte (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reading REAL CHECK(reading BETWEEN 10 AND 90) NOT NULL,
        writing REAL CHECK(writing BETWEEN 10 AND 90) NOT NULL,
        speaking REAL CHECK(speaking BETWEEN 10 AND 90) NOT NULL,
        listening REAL CHECK(listening BETWEEN 10 AND 90) NOT NULL,
        overall REAL CHECK(overall BETWEEN 10 AND 90) NOT NULL
    )`);

  //Create users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('manager', 'admin', 'counselor', 'student')) NOT NULL,
        created_on DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

  //Create applications table
  db.run(`CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        course_id INTEGER,
        status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) NOT NULL,
        created_on DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (course_id) REFERENCES course(id)
    )`);
  //create students table
  db.run(`CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
});

// Close the database connection
db.close((err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Closed the database connection.");
});
