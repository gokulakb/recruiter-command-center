const db = require('../config/database');

const initDatabase = () => {
  // Create colleges table
  db.run(`
    CREATE TABLE IF NOT EXISTS colleges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create recruiters table
  db.run(`
    CREATE TABLE IF NOT EXISTS recruiters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      college_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT NOT NULL,
      status TEXT CHECK(status IN ('Active', 'Inactive')) DEFAULT 'Active',
      jobs_posted INTEGER DEFAULT 0,
      last_active_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (college_id) REFERENCES colleges(id)
    )
  `);

  // Create students table
  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      college_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      department TEXT NOT NULL,
      graduation_year INTEGER NOT NULL,
      onboarding_status TEXT CHECK(onboarding_status IN ('Pending', 'In Progress', 'Completed', 'Failed')) DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (college_id) REFERENCES colleges(id)
    )
  `);

  // Create onboarding_batches table
  db.run(`
    CREATE TABLE IF NOT EXISTS onboarding_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      college_id INTEGER NOT NULL,
      batch_name TEXT NOT NULL,
      total_records INTEGER DEFAULT 0,
      successful_records INTEGER DEFAULT 0,
      failed_records INTEGER DEFAULT 0,
      duplicate_records INTEGER DEFAULT 0,
      status TEXT CHECK(status IN ('Completed', 'Processing', 'Failed')) DEFAULT 'Processing',
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (college_id) REFERENCES colleges(id)
    )
  `);

  // Create jobs table
  db.run(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recruiter_id INTEGER NOT NULL,
      college_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      department TEXT NOT NULL,
      openings INTEGER DEFAULT 1,
      status TEXT CHECK(status IN ('Open', 'Closed', 'On Hold')) DEFAULT 'Open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recruiter_id) REFERENCES recruiters(id),
      FOREIGN KEY (college_id) REFERENCES colleges(id)
    )
  `);

  // Create applications table
  db.run(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      job_id INTEGER NOT NULL,
      recruiter_id INTEGER NOT NULL,
      college_id INTEGER NOT NULL,
      status TEXT CHECK(status IN ('Applied', 'Shortlisted', 'Interview', 'Offered', 'Hired', 'Rejected')) DEFAULT 'Applied',
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (job_id) REFERENCES jobs(id),
      FOREIGN KEY (recruiter_id) REFERENCES recruiters(id),
      FOREIGN KEY (college_id) REFERENCES colleges(id)
    )
  `);

  console.log('Database initialized successfully');
};

// Run initialization
initDatabase();

module.exports = { initDatabase };