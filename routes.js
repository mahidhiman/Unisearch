const database = require("./database"); // Import the database module
const jwt = require("jsonwebtoken"); // Import the JSON Web Token module
const helpers = require("./helpers"); // Import the helpers module

const handlers = {}; // Initialize handlers object

const tokenBlacklist = new Set(); // Initialize token blacklist set

// Handle database response
const handleDatabaseResponse = (err, result, callback, successMessage) => {
  if (err) {
    callback(500, { message: "Error: " + err.message });
  } else {
    callback(200, { message: successMessage, result });
  }
};

// Handle route based on method
const handleRoute = (data, callback, subHandlers) => {
  const acceptableMethods = ["get", "post", "put", "delete"];
  if (acceptableMethods.includes(data.method)) {
    subHandlers[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Create handler for CRUD operations
const createHandler = (entity, validateInput) => ({
  post: (data, callback) => {
    const payload = data.payload || {};
    if (!validateInput(payload)) {
      callback(400, { message: "Invalid input" });
      return;
    }
    database[`create${entity}`](payload, (err, id) => {
      handleDatabaseResponse(err, id, callback, `${entity} created successfully`);
    });
  },
  get: (data, callback) => {
    const id = data.queryStringObject.id;
    if (!helpers.validateId(id)) {
      callback(400, { message: "Invalid ID" });
      return;
    }
    database[`get${entity}ById`](id, (err, result) => {
      handleDatabaseResponse(err, result, callback, `${entity} retrieved successfully`);
    });
  },
  put: (data, callback) => {
    const id = data.payload.id;
    if (!helpers.validateId(id)) {
      callback(400, { message: "Invalid ID" });
      return;
    }
    const validFields = helpers.validateFields(data.payload);
    if (!validFields) {
      callback(400, { message: "No valid fields to update" });
      return;
    }
    database[`update${entity}`](id, validFields, (err) => {
      handleDatabaseResponse(err, null, callback, `${entity} updated successfully`);
    });
  },
  delete: (data, callback) => {
    const id = data.queryStringObject.id;
    if (!helpers.validateId(id)) {
      callback(400, { message: "Invalid ID" });
      return;
    }
    database[`delete${entity}`](id, (err) => {
      handleDatabaseResponse(err, null, callback, `${entity} deleted successfully`);
    });
  },
});

// Define user handlers
handlers.users = (data, callback) => handleRoute(data, callback, handlers._users);
handlers._users = createHandler("User", ({ name, email, password }) => helpers.validateUserInput(name, email, password));

// Define university handlers
handlers.universities = (data, callback) => handleRoute(data, callback, handlers._universities);
handlers._universities = createHandler(
  "University",
  ({ name, country, campusName, city }) => name && country && campusName && city
);

// Define courses handlers, fetch all courses
handlers.courses = (data, callback) => {
  if (data.method === "get") {
    database.getAllUniversities((err, universities) => {
      handleDatabaseResponse(err, { universities }, callback, "Universities retrieved successfully");
    });
  } else {
    callback(405);
  }
};

// Define universities handler, fetch all universities
handlers.allUniversities = (data, callback) => {
  if (data.method === "get") {
    database.getAllUniversities((err, universities) => {
      handleDatabaseResponse(err, universities, callback, "Universities retrieved successfully");
    });
  } else {
    callback(405);
  }
};

// Define individual course handlers
handlers.course = (data, callback) => handleRoute(data, callback, handlers._course);
handlers._course = createHandler(
  "Course",
  ({ university_id, name, description, duration, fee }) => university_id && name && description && duration && fee
);

// Define requirements handlers
handlers.requirements = (data, callback) => handleRoute(data, callback, handlers._requirements);
handlers._requirements = createHandler(
  "Requirements",
  ({ course_id, requirement, ielts_id, pte_id }) => course_id && requirement && ielts_id && pte_id
);

// Define IELTS handlers
handlers.ielts = (data, callback) => handleRoute(data, callback, handlers._ielts);
handlers._ielts = createHandler(
  "Ielts",
  ({ reading, listening, writing, speaking, overall }) => reading && listening && writing && speaking && overall
);

// Define PTE handlers
handlers.pte = (data, callback) => handleRoute(data, callback, handlers._pte);
handlers._pte = createHandler(
  "Pte",
  ({ reading, listening, writing, speaking, overall }) => reading && listening && writing && speaking && overall
);

// Define not found handler
handlers.notFound = (data, callback) => callback(404, { message: "Not found" });

const secretKey = "your_secret_key"; // Replace with your actual secret key

// Define login handler
handlers.login = (data, callback) => {
  if (data.method !== "post") {
    callback(405);
    return;
  }

  const { email, password } = data.payload || {};
  if (!email || !password) {
    callback(400, { message: "Missing email or password" });
    return;
  }

  database.getUserByEmail(email, (err, user) => {
    if (err || !user || user.password !== password) {
      callback(401, { message: "Invalid email or password" });
      return;
    }

    const token = jwt.sign({ id: user.id, email: user.email }, secretKey, { expiresIn: "1h" });
    callback(200, { message: "Login successful", token });
  });
};

// Define logout handler
handlers.logout = (data, callback) => {
  if (data.method !== "post") {
    callback(405);
    return;
  }

  const token = data.headers.token;
  if (!token) {
    callback(400, { message: "Missing token" });
    return;
  }

  tokenBlacklist.add(token);
  callback(200, { message: "Logout successful" });
};

// Check if token is blacklisted
const isTokenBlacklisted = (token) => tokenBlacklist.has(token);

module.exports = { handlers, isTokenBlacklisted }; // Export handlers and isTokenBlacklisted function
