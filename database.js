const sqlite3 = require("sqlite3").verbose();
const helpers = require("./helpers");
const bcrypt = require("bcrypt");

// Initialize the database connection
const db = new sqlite3.Database("university.db", (err) => {
  if (err) console.error("Could not connect to database", err);
});

// Validate required fields in an object
const validateFields = (object, requiredFields) => {
  const missingFields = requiredFields.filter((field) => !object[field]);
  return missingFields.length ? `Missing fields: ${missingFields.join(", ")}` : null;
};

// Validate IELTS scores
const validateIelts = (ielts) => {
  const requiredFields = ["reading", "writing", "listening", "speaking", "overall"];
  const validationError = validateFields(ielts, requiredFields);
  if (validationError) return validationError;
  return [ielts.reading, ielts.writing, ielts.listening, ielts.speaking, ielts.overall].some(
    (score) => score < 1.0 || score > 9.0
  )
    ? "IELTS scores must be between 1.0 and 9.0"
    : null;
};

// Validate PTE scores
const validatePte = (pte) => {
  const requiredFields = ["reading", "writing", "listening", "speaking", "overall"];
  const validationError = validateFields(pte, requiredFields);
  if (validationError) return validationError;
  return [pte.reading, pte.writing, pte.listening, pte.speaking, pte.overall].some((score) => score < 10 || score > 90)
    ? "PTE scores must be between 10 and 90"
    : null;
};

// Validate university details
const validateUniversity = (university) => {
  const requiredFields = [
    "name",
    "country",
    "campusName",
    "city",
    "scholarships",
    "description",
    "image",
    "rank",
    "MOI_Accepted",
    "IELTS_waiver",
  ];
  const validationError = validateFields(university, requiredFields);
  if (validationError) return validationError;

  if (!/^\d+$/.test(university.scholarships)) return "Scholarships must be a number";
  if (!/^\d+$/.test(university.rank)) return "Rank must be a number";
  if (!/^https?:\/\/.+\..+/.test(university.image)) return "Image must be a valid URL";
  if (!["yes", "no"].includes(university.MOI_Accepted)) return "MOI_Accepted must be 'yes' or 'no'";
  if (!["yes", "no"].includes(university.IELTS_waiver)) return "IELTS_waiver must be 'yes' or 'no'";

  return null;
};

// Placeholder for course validation logic
const validateCourse = (course) => true;

// Execute a SQL query that modifies data
const runQuery = (sql, params, callback) =>
  db.run(sql, params, function (err) {
    if (err) return callback(err);
    callback(null, { id: this.lastID, changes: this.changes });
  });

// Execute a SQL query that retrieves a single row
const getQuery = (sql, params, callback) =>
  db.get(sql, params, (err, row) => {
    if (err) return callback(err);
    callback(null, row);
  });

// Execute a SQL query that retrieves multiple rows
const allQuery = (sql, params, callback) =>
  db.all(sql, params, (err, rows) => {
    if (err) return callback(err);
    callback(null, rows);
  });

// Create a new university record
const createUniversity = (university, callback) => {
  const validationError = validateUniversity(university);
  if (validationError) return callback(new Error(validationError));
  runQuery(
    "INSERT INTO university (name, country, campus_name, city, scholarships, description, image, rank, MOI_Accepted, IELTS_waiver) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      university.name,
      university.country,
      university.campusName,
      university.city,
      university.scholarships,
      university.description,
      university.image,
      university.rank,
      university.MOI_Accepted,
      university.IELTS_waiver,
    ],
    callback
  );
};

// Update an existing university record
const updateUniversity = (id, university, callback) => {
  const validationError = validateUniversity(university);
  if (validationError) return callback(new Error(validationError));
  runQuery(
    "UPDATE university SET name = ?, country = ?, campus_name = ?, city = ?, scholarships = ?, description = ?, image = ?, rank = ?, MOI_Accepted = ?, IELTS_waiver = ? WHERE id = ?",
    [
      university.name,
      university.country,
      university.campusName,
      university.city,
      university.scholarships,
      university.description,
      university.image,
      university.rank,
      university.MOI_Accepted,
      university.IELTS_waiver,
      id,
    ],
    callback
  );
};

// Create a new course record
const createCourse = (course, callback) => {
  const validationError = validateCourse(course);
  if (validationError) return callback(new Error(validationError));
  runQuery(
    "INSERT INTO courses (university_id, name, requirement_id, fees, duration, intake, link) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [course.university_id, course.name, course.requirement_id, course.fees, course.duration, course.intake, course.link],
    callback
  );
};

// Update an existing course record
const updateCourse = (id, course, callback) => {
  const validationError = validateCourse(course);
  if (validationError) return callback(new Error(validationError));
  runQuery(
    "UPDATE courses SET university_id = ?, name = ?, description = ?, duration = ?, credits = ? WHERE id = ?",
    [course.university_id, course.name, course.description, course.duration, course.credits, id],
    callback
  );
};

// Create a new IELTS record
const createIelts = (ielts, callback) => {
  const validationError = validateIelts(ielts);
  if (validationError) return callback(new Error(validationError));
  runQuery(
    "INSERT INTO ielts (reading, writing, listening, speaking, overall) VALUES (?, ?, ?, ?, ?)",
    [ielts.reading, ielts.writing, ielts.listening, ielts.speaking, ielts.overall],
    callback
  );
};

// Update an existing IELTS record
const updateIelts = (id, ielts, callback) => {
  const validationError = validateIelts(ielts);
  if (validationError) return callback(new Error(validationError));
  runQuery(
    "UPDATE ielts SET reading = ?, writing = ?, listening = ?, speaking = ?, overall = ? WHERE id = ?",
    [ielts.reading, ielts.writing, ielts.listening, ielts.speaking, ielts.overall, id],
    callback
  );
};

// Create a new PTE record
const createPte = (pte, callback) => {
  const validationError = validatePte(pte);
  if (validationError) return callback(new Error(validationError));
  runQuery(
    "INSERT INTO pte (reading, writing, listening, speaking, overall) VALUES (?, ?, ?, ?, ?)",
    [pte.reading, pte.writing, pte.listening, pte.speaking, pte.overall],
    callback
  );
};

// Update an existing PTE record
const updatePte = (id, pte, callback) => {
  const validationError = validatePte(pte);
  if (validationError) return callback(new Error(validationError));
  runQuery(
    "UPDATE pte SET reading = ?, writing = ?, listening = ?, speaking = ?, overall = ? WHERE id = ?",
    [pte.reading, pte.writing, pte.listening, pte.speaking, pte.overall, id],
    callback
  );
};

// Create a new user record
const createUser = (user, callback) => {
  if (!helpers.validateUserInput(user)) callback(new Error("Invalid user input", 0));
  const hashedPassword = bcrypt.hashSync(user.password, 10);
  runQuery(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    [user.name, user.email, hashedPassword, user.role],
    callback
  );
};

// Update an existing user record
const updateUser = (id, user, callback) => {
  if (!helpers.validateUserInput(user)) callback(new Error("Invalid user input", 0));
  const hashedPassword = bcrypt.hashSync(user.password, 10);
  runQuery(
    "UPDATE users SET name = ?, email = ?, password = ?, role = ? WHERE id = ?",
    [user.name, user.email, hashedPassword, user.role, id],
    callback
  );
};

// Delete an entity by ID
const deleteEntity = (table, id, callback) => runQuery(`DELETE FROM ${table} WHERE id = ?`, [id], callback);

// Get an entity by ID
const getEntityById = (table, id, callback) => getQuery(`SELECT * FROM ${table} WHERE id = ?`, [id], callback);

// Get all courses with related university and requirement details
const getCourses = (callback) => {
  const sql = `
    SELECT 
      course.id AS course_id, 
      course.name AS course_name, 
      university.name AS university_name, 
      university.country AS university_country, 
      university.campus_name AS university_campus_name, 
      university.city AS university_city, 
      requirements.requirement AS course_requirement, 
      ielts.score AS ielts_score, 
      pte.score AS pte_score
    FROM 
      course
    JOIN 
      university ON course.university_id = university.id
    LEFT JOIN 
      requirements ON course.id = requirements.course_id
    LEFT JOIN 
      ielts ON course.id = ielts.course_id
    LEFT JOIN 
      pte ON course.id = pte.course_id
  `;
  allQuery(sql, [], callback);
};

// Search for courses by name
const searchCourse = (name, callback) => allQuery("SELECT * FROM courses WHERE name LIKE ?", ["%" + name + "%"], callback);

// Export functions for external use
module.exports = {
  createUniversity,
  getUniversityById: (id, callback) => getEntityById("university", id, callback),
  updateUniversity,
  deleteUniversity: (id, callback) => deleteEntity("university", id, callback),
  createCourse,
  getCourses,
  getCourseById: (id, callback) => getEntityById("courses", id, callback),
  updateCourse,
  deleteCourse: (id, callback) => deleteEntity("courses", id, callback),
  getAllUniversities: (callback) => allQuery("SELECT * FROM university", [], callback),
  createIelts,
  getIeltsById: (id, callback) => getEntityById("ielts", id, callback),
  updateIelts,
  deleteIelts: (id, callback) => deleteEntity("ielts", id, callback),
  createPte,
  getPteById: (id, callback) => getEntityById("pte", id, callback),
  updatePte,
  deletePte: (id, callback) => deleteEntity("pte", id, callback),
  createUser,
  deleteUser: (id, callback) => deleteEntity("users", id, callback),
  updateUser,
  searchCourse,
  getUserByEmail: (email, callback) => getQuery("SELECT * FROM users WHERE email = ?", [email], callback),
};
