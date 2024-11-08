/**
 * @fileoverview This module provides functions to interact with a SQLite database for managing universities and courses.
 */

const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("university.db", (err) => {
  if (err) {
    console.error("Could not connect to database", err);
  }
});

const validateFields = (object, requiredFields) => {
  const missingFields = requiredFields.filter((field) => !object[field]);
  return missingFields.length > 0 ? `Missing fields: ${missingFields.join(", ")}` : null;
};

const validateIelts = (ielts) => {
  const requiredFields = ["course_id", "reading", "writing", "listening", "speaking", "overall"];
  const validationError = validateFields(ielts, requiredFields);
  if (validationError) return validationError;

  const scores = [ielts.reading, ielts.writing, ielts.listening, ielts.speaking, ielts.overall];
  return scores.some((score) => score < 1.0 || score > 9.0) ? "IELTS scores must be between 1.0 and 9.0" : null;
};

const validatePte = (pte) => {
  const requiredFields = ["course_id", "reading", "writing", "listening", "speaking", "overall"];
  const validationError = validateFields(pte, requiredFields);
  if (validationError) return validationError;

  const scores = [pte.reading, pte.writing, pte.listening, pte.speaking, pte.overall];
  return scores.some((score) => score < 10 || score > 90) ? "PTE scores must be between 10 and 90" : null;
};

const validateUniversity = (university) => {
  const requiredFields = ["name", "country", "campusName", "city"];
  return validateFields(university, requiredFields);
};

const validateCourse = (course) => {
  const requiredFields = ["university_id", "name", "description", "duration", "credits"];
  return validateFields(course, requiredFields);
};

const runQuery = (sql, params, callback) => {
  db.run(sql, params, function (err) {
    if (err) return callback(err);
    callback(null, { id: this.lastID, changes: this.changes });
  });
};

const getQuery = (sql, params, callback) => {
  db.get(sql, params, (err, row) => {
    if (err) return callback(err);
    callback(null, row);
  });
};

const allQuery = (sql, params, callback) => {
  db.all(sql, params, (err, rows) => {
    if (err) return callback(err);
    callback(null, rows);
  });
};

const createUniversity = (university, callback) => {
  const validationError = validateUniversity(university);
  if (validationError) return callback(new Error(validationError));

  const sql = "INSERT INTO university (name, country, campus_name, city) VALUES (?, ?, ?, ?)";
  runQuery(sql, [university.name, university.country, university.campusName, university.city], callback);
};

const getUniversityById = (id, callback) => {
  getQuery("SELECT * FROM university WHERE id = ?", [id], callback);
};

const updateUniversity = (id, university, callback) => {
  const validationError = validateUniversity(university);
  if (validationError) return callback(new Error(validationError));

  const sql = "UPDATE university SET name = ?, country = ?, campus_name = ?, city = ? WHERE id = ?";
  runQuery(sql, [university.name, university.country, university.campusName, university.city, id], callback);
};

const deleteUniversity = (id, callback) => {
  runQuery("DELETE FROM university WHERE id = ?", [id], callback);
};

const createCourse = (course, callback) => {
  const validationError = validateCourse(course);
  if (validationError) return callback(new Error(validationError));

  const sql = "INSERT INTO courses (university_id, name, description, duration, credits) VALUES (?, ?, ?, ?, ?)";
  runQuery(sql, [course.university_id, course.name, course.description, course.duration, course.credits], callback);
};

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

const getCourseById = (id, callback) => {
  getQuery("SELECT * FROM courses WHERE id = ?", [id], callback);
};

const updateCourse = (id, course, callback) => {
  const validationError = validateCourse(course);
  if (validationError) return callback(new Error(validationError));

  const sql = "UPDATE courses SET university_id = ?, name = ?, description = ?, duration = ?, credits = ? WHERE id = ?";
  runQuery(sql, [course.university_id, course.name, course.description, course.duration, course.credits, id], callback);
};

const deleteCourse = (id, callback) => {
  runQuery("DELETE FROM courses WHERE id = ?", [id], callback);
};

const getAllUniversities = (callback) => {
  allQuery("SELECT * FROM university", [], callback);
};

const createIelts = (ielts, callback) => {
  const validationError = validateIelts(ielts);
  if (validationError) return callback(new Error(validationError));

  const sql = "INSERT INTO ielts (course_id, reading, writing, listening, speaking, overall) VALUES (?, ?, ?, ?, ?, ?)";
  runQuery(sql, [ielts.course_id, ielts.reading, ielts.writing, ielts.listening, ielts.speaking, ielts.overall], callback);
};

const getIeltsById = (id, callback) => {
  getQuery("SELECT * FROM ielts WHERE id = ?", [id], callback);
};

const updateIelts = (id, ielts, callback) => {
  const validationError = validateIelts(ielts);
  if (validationError) return callback(new Error(validationError));

  const sql = "UPDATE ielts SET course_id = ?, reading = ?, writing = ?, listening = ?, speaking = ?, overall = ? WHERE id = ?";
  runQuery(sql, [ielts.course_id, ielts.reading, ielts.writing, ielts.listening, ielts.speaking, ielts.overall, id], callback);
};

const deleteIelts = (id, callback) => {
  runQuery("DELETE FROM ielts WHERE id = ?", [id], callback);
};

const createPte = (pte, callback) => {
  const validationError = validatePte(pte);
  if (validationError) return callback(new Error(validationError));

  const sql = "INSERT INTO pte (course_id, reading, writing, listening, speaking, overall) VALUES (?, ?, ?, ?, ?, ?)";
  runQuery(sql, [pte.course_id, pte.reading, pte.writing, pte.listening, pte.speaking, pte.overall], callback);
};

const getPteById = (id, callback) => {
  getQuery("SELECT * FROM pte WHERE id = ?", [id], callback);
};

const updatePte = (id, pte, callback) => {
  const validationError = validatePte(pte);
  if (validationError) return callback(new Error(validationError));

  const sql = "UPDATE pte SET course_id = ?, reading = ?, writing = ?, listening = ?, speaking = ?, overall = ? WHERE id = ?";
  runQuery(sql, [pte.course_id, pte.reading, pte.writing, pte.listening, pte.speaking, pte.overall, id], callback);
};

const deletePte = (id, callback) => {
  runQuery("DELETE FROM pte WHERE id = ?", [id], callback);
};

const createRequirement = (requirement, callback) => {
  const sql = "INSERT INTO requirements (course_id, requirement) VALUES (?, ?)";
  runQuery(sql, [requirement.course_id, requirement.requirement], callback);
};

const getRequirementById = (id, callback) => {
  getQuery("SELECT * FROM requirements WHERE id = ?", [id], callback);
};

const updateRequirement = (id, requirement, callback) => {
  const sql = "UPDATE requirements SET course_id = ?, requirement = ? WHERE id = ?";
  runQuery(sql, [requirement.course_id, requirement.requirement, id], callback);
};

const deleteRequirement = (id, callback) => {
  runQuery("DELETE FROM requirements WHERE id = ?", [id], callback);
};

module.exports = {
  createUniversity,
  getUniversityById,
  updateUniversity,
  deleteUniversity,
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getAllUniversities,
  createIelts,
  getIeltsById,
  updateIelts,
  deleteIelts,
  createPte,
  getPteById,
  updatePte,
  deletePte,
  createRequirement,
  getRequirementById,
  updateRequirement,
  deleteRequirement,
};
