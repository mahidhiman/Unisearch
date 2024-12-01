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
    "campus_name",
    "city",
    "country",
    "scholarships",
    "link",
    "application_fee",
    "image",
    "poc",
    "deadline_application",
    "deadline_fees",
    "rank",
  ];
  const validationError = validateFields(university, requiredFields);
  if (validationError) return validationError;

  if (!/^\d+$/.test(university.scholarships)) return "Scholarships must be a number";
  if (!/^\d+$/.test(university.rank)) return "Rank must be a number";
  if (isNaN(Date.parse(university.deadline_application))) return "Application deadline must be a valid date";
  if (isNaN(Date.parse(university.deadline_fees))) return "Fees deadline must be a valid date";
  if (!/^https?:\/\/[^\s$.?#].[^\s]*$/.test(university.image)) return "Invalid image URL";
  if (!/^https?:\/\/[^\s$.?#].[^\s]*$/.test(university.link)) return "Invalid link URL";

  return null;
};

// Placeholder for course validation logic
const validateCourse = (course) => {
  const requiredFields = [
    "university_id",
    "name",
    "image",
    "level_of_course",
    "duration",
    "fees",
    "requirement_id",
    "ielts_waiver",
    "moi_accepted",
    "link",
  ];
  const validationError = validateFields(course, requiredFields);
  if (validationError) return validationError;

  if (!["yes", "no"].includes(course.ielts_waiver)) return "IELTS waiver must be 'yes' or 'no'";
  if (!["yes", "no"].includes(course.moi_accepted)) return "MOI accepted must be 'yes' or 'no'";

  return null;
};

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
  console.log(university);
  const validationError = validateUniversity(university);
  if (validationError) return callback(new Error(validationError));
  runQuery(
    "INSERT INTO university (name, campus_name, city, country, scholorships, link, application_fee, image, poc, deadline_application, deadline_fees, rank) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      university.name,
      university.campus_name,
      university.city,
      university.country,
      university.scholarships,
      university.link,
      university.application_fee,
      university.image,
      university.poc,
      university.deadline_application,
      university.deadline_fees,
      university.rank,
    ],
    callback
  );
};

// Update an existing university record
const updateUniversity = (id, university, callback) => {
  const validationError = validateUniversity(university);
  if (validationError) return callback(new Error(validationError));
  runQuery(
    "UPDATE university SET name = ?, campus_name = ?, city = ?, country = ?, scholarships = ?, link = ?, application_fee = ?, image = ?, poc = ?, deadline_application = ? , deadline_fees = ?, rank = ?, where id = ?",
    [
      university.name,
      university.campusName,
      university.city,
      university.country,
      university.scholarships,
      university.link,
      university.application_fee,
      university.image,
      university.poc,
      university.deadline_application,
      university.deadline_fees,
      university.rank,
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
    "INSERT INTO course (name, image, level_of_course, requirement_id, university_id, fees, duration, ielts_waiver, moi_accepted, link) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      course.name,
      course.image,
      course.level_of_course,
      course.requirement_id,
      course.university_id,
      course.fees,
      course.duration,
      course.ielts_waiver,
      course.moi_accepted,
      course.link,
    ],
    callback
  );
};

// Update an existing course record
const updateCourse = (id, course, callback) => {
  const validationError = validateCourse(course);
  if (validationError) return callback(new Error(validationError));
  runQuery(
    "UPDATE courses SET university_id = ?, name = ?, image = ?, duration = ?, fees = ?, level_of_course = ?, requirement_id = ?, ielts_waiver = ?, moi_accepted = ?, link = ? WHERE id = ?",
    [
      course.university_id,
      course.name,
      course.image,
      course.level_of_course,
      course.duration,
      course.fees,
      course.requirement_id,
      course.ielts_waiver,
      course.moi_accepted,
      course.link,
      id,
    ],
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

// Create a new requirement record
const createRequirements = (requirement, callback) => {
  runQuery(
    "INSERT INTO requirements (requirement, ielts_id, pte_id) VALUES (?, ?, ?)",
    [requirement.requirement, requirement.ielts_id, requirement.pte_id],
    callback
  );
};

// Delete an entity by ID
const deleteEntity = (table, id, callback) => runQuery(`DELETE FROM ${table} WHERE id = ?`, [id], callback);

// Get an entity by ID
const getEntityById = (table, id, callback) => getQuery(`SELECT * FROM ${table} WHERE id = ?`, [id], callback);

// Get all courses with related university and requirement details
const getCourses = (callback) => {
  /**
   * Retrieves course information along with associated university and requirements details.
   *
   * The query selects the following fields:
   * - courses.name: The name of the course.
   * - courses.image: The image associated with the course.
   * - courses.level_of_course: The level of the course.
   * - courses.ielts_waiver: Indicates if an IELTS waiver is available for the course.
   * - requirement_id: The ID of the requirement associated with the course.
   * - courses.moi_accepted: Indicates if the medium of instruction is accepted.
   * - courses.link: The link to the course details.
   *
   * The query joins the following tables:
   * - university: To get the university details associated with the course.
   * - requirements: To get the requirements details associated with the course.
   * - ielts (left join): To get the IELTS details if available.
   * - pte (left join): To get the PTE details if available.
   */
  const sql = `
  SELECT course.name, course.image, course.level_of_course, course.ielts_waiver, course.duration, course.fees, requirement_id, course.moi_accepted, course.link 
  FROM course 
  JOIN university ON course.university_id = university.id 
  JOIN requirements ON course.requirement_id = requirements.id 
  LEFT JOIN ielts ON requirements.ielts_id = ielts.id 
  LEFT JOIN pte ON requirements.pte_id = pte.id
  `;
  allQuery(sql, [], callback);
};

// Search for courses by name
const searchCourse = (name, callback) => allQuery("SELECT * FROM courses WHERE name LIKE ?", ["%" + name + "%"], callback);

//get all common routes
//through this we can get all data available in one entity
const getAll = (entity, callback, ...columns) => {
  const sql = `SELECT ${columns.join(",")} FROM ${entity}`;
  allQuery(sql, [], callback);
};

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
  createRequirements,
  getPteById: (id, callback) => getEntityById("pte", id, callback),
  updatePte,
  deletePte: (id, callback) => deleteEntity("pte", id, callback),
  createUser,
  deleteUser: (id, callback) => deleteEntity("users", id, callback),
  updateUser,
  searchCourse,
  getAll,
  getUserByEmail: (email, callback) => getQuery("SELECT * FROM users WHERE email = ?", [email], callback),
};
