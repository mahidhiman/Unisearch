const database = require("./database");
const jwt = require("jsonwebtoken");
const helpers = require("./helpers");
const bcrypt = require("bcrypt");
const config = require("./config");
const handlers = {};
const tokenBlacklist = new Map();
const secretKey = config.SECRET_KEY;

// Function to check if the token is in the blacklist
// If the token is expired, it will be removed from the blacklist
const isTokenInBlacklist = (token) => {
  const expirationTime = tokenBlacklist.get(token);
  if (expirationTime && Date.now() > expirationTime) {
    tokenBlacklist.delete(token);
    return false;
  }
  return tokenBlacklist.has(token);
};

// Function to verify the token using the secret key
// If the token is valid, it returns the decoded token
// If the token is invalid, it returns null
const verifyToken = (token) => {
  try {
    return jwt.verify(token, secretKey);
  } catch {
    return null;
  }
};

// Function to check access control by verifying the token
// If the token is missing or invalid, it returns a 401 Unauthorized response
const checkAccessControl = (data, callback) => {
  const token = data.headers.token;
  if (!token) {
    callback(401, { message: "Missing token" });
    return false;
  }

  if (isTokenInBlacklist(token)) {
    callback(401, { message: "You're logged out" });
    return false;
  }

  const decodedToken = verifyToken(token);
  if (!decodedToken) {
    callback(401, { message: "Invalid token" });
    return false;
  }

  database.getUserByEmail(decodedToken.email, (err, user) => {
    if (err || !user) {
      callback(401, { message: "Unauthorised!" });
      return false;
    }

    data.user = user;
    return true;
  });
};

// Function to enforce access control for certain HTTP methods
// If the method is POST, PUT, or DELETE, it checks access control
// If access control fails, it does not proceed to the next handler
const enforceAccessControl = (data, callback, next) => {
  if (["post", "put", "delete"].includes(data.method) && !checkAccessControl(data, callback)) return;
  next();
};

// Function to wrap handlers with access control
// It applies access control to each method in the subHandlers object
const wrapWithAccessControl = (subHandlers) => {
  return Object.fromEntries(
    Object.entries(subHandlers).map(([method, handler]) => [
      method,
      (data, callback) => enforceAccessControl(data, callback, () => handler(data, callback)),
    ])
  );
};

// Function to handle the database response
// If there is an error, it returns a 500 Internal Server Error response
// If the operation is successful, it returns a 200 OK response with a success message
const handleDatabaseResponse = (err, result, callback, successMessage) => {
  if (err) callback(500, { message: "Error: " + err.message });
  else callback(200, { message: successMessage, result });
};

// Function to handle routing based on the HTTP method
// It calls the appropriate method handler from the subHandlers object
// If the method is not supported, it returns a 405 Method Not Allowed response
const handleRoute = (data, callback, subHandlers) => {
  const method = subHandlers[data.method];
  if (method) method(data, callback);
  else callback(405);
};

// Function to create a handler for CRUD operations
// It defines handlers for POST, GET, PUT, and DELETE methods
// Each handler performs input validation and interacts with the database
const createHandler = (entity, validateInput) => ({
  post: (data, callback) => {
    const payload = data.payload || {};
    if (!validateInput(payload)) return callback(400, { message: "Invalid input" });
    database[`create${entity}`](payload, (err, id) =>
      handleDatabaseResponse(err, id, callback, `${entity} created successfully`)
    );
  },
  get: (data, callback) => {
    const id = data.queryStringObject.id;
    if (!helpers.validateId(id)) return callback(400, { message: "Invalid ID" });
    database[`get${entity}ById`](id, (err, result) =>
      handleDatabaseResponse(err, result, callback, `${entity} retrieved successfully`)
    );
  },
  put: (data, callback) => {
    const id = data.payload.id;
    if (!helpers.validateId(id)) return callback(400, { message: "Invalid ID" });
    const validFields = helpers.validateFields(data.payload);
    if (!validFields) return callback(400, { message: "No valid fields to update" });
    database[`update${entity}`](id, validFields, (err) =>
      handleDatabaseResponse(err, null, callback, `${entity} updated successfully`)
    );
  },
  delete: (data, callback) => {
    const id = data.queryStringObject.id;
    if (!helpers.validateId(id)) return callback(400, { message: "Invalid ID" });
    database[`delete${entity}`](id, (err) => handleDatabaseResponse(err, null, callback, `${entity} deleted successfully`));
  },
});

// Function to apply access control to specific routes
// It wraps the handlers of the specified routes with access control
const applyAccessControl = () => {
  ["_universities", "_course", "_ielts", "_pte", "_requirements"].forEach((route) => {
    handlers[route] = wrapWithAccessControl(handlers[route]);
  });
};

// Define the root route handler
// It responds with a welcome message for GET requests
// For other methods, it returns a 405 Method Not Allowed response
handlers.root = (data, callback) => {
  if (data.method === "get") callback(200, { message: "Welcome to the University API" });
  else callback(405);
};

// Define the university route handler
// It delegates the request to the appropriate method handler in handlers._universities
handlers.university = (data, callback) => handleRoute(data, callback, handlers._universities);
handlers._universities = createHandler(
  "University",
  ({ name, country, campus_name, city, scholarships, description, image, rank, MOI_Accepted, IELTS_waiver }) =>
    name && country && campus_name && city && scholarships && description && image && rank && MOI_Accepted && IELTS_waiver
);

// Define the users route handler
// It delegates the request to the appropriate method handler in handlers._users
handlers.users = (data, callback) => handleRoute(data, callback, handlers._users);
handlers._users = createHandler("User", helpers.validateUserInput);

// Define the course route handler
// It delegates the request to the appropriate method handler in handlers._course
handlers.course = (data, callback) => handleRoute(data, callback, handlers._course);
handlers._course = createHandler("Course", helpers.validateFields);

// Define the requirements route handler
// It delegates the request to the appropriate method handler in handlers._requirements
handlers.requirements = (data, callback) => handleRoute(data, callback, handlers._requirements);
handlers._requirements = createHandler("Requirements", ({ requirement, ielts_id, pte_id }) => requirement && ielts_id && pte_id);

// Define the IELTS route handler
// It delegates the request to the appropriate method handler in handlers._ielts
handlers.ielts = (data, callback) => handleRoute(data, callback, handlers._ielts);
handlers._ielts = createHandler(
  "Ielts",
  ({ reading, listening, writing, speaking, overall }) => reading && listening && writing && speaking && overall
);

// Define the PTE route handler
// It delegates the request to the appropriate method handler in handlers._pte
handlers.pte = (data, callback) => handleRoute(data, callback, handlers._pte);
handlers._pte = createHandler(
  "Pte",
  ({ reading, listening, writing, speaking, overall }) => reading && listening && writing && speaking && overall
);

//Define all universities route handler
//It delegates the request to the appropriate method handler in handlers._allUniversities
handlers.allUniversities = (data, callback) => {
  if (data.method === "get") {
    database.getAllUniversities((err, universities) => {
      if (err) return callback(500, { message: "Error: " + err.message });
      callback(200, universities);
    });
  } else {
    callback(405);
  }
};

// Define the search courses route handler
// It handles searching courses by name
handlers.searchCourses = (data, callback) => {
  if (data.method === "get") {
    const name = data.queryStringObject.name;
    if (!name) return callback(400, { message: "Missing course name" });

    database.searchCoursesByName(name, (err, courses) => {
      if (err) return callback(500, { message: "Error: " + err.message });
      callback(200, courses);
    });
  } else {
    callback(405);
  }
};

// Define the not found route handler
// It returns a 404 Not Found response for any unmatched routes
handlers.notFound = (data, callback) => callback(404, { message: "Not found" });

//Define the allCourses route
//it returns all the courses available in the database
handlers.allCourses = (data, callback) => {
  if (data.method === "get") {
    database.getCourses((err, courses) => {
      if (err) return callback(500, { message: "Error: " + err.message });
      callback(200, courses);
    });
  } else {
    callback(405);
  }
};

//Define handlers for returning all the data available in a perticular table from the database
handlers.allUniversitiesNames = (data, callback) => {
  if (data.method !== "get") return callback(405);
  database.getAll(
    "university",
    (err, universities) => {
      if (err) return callback(500, { message: "Error: " + err.message });
      callback(
        200,
        universities.map(({ id, name, campus_name }) => ({ id, name: `${name}-${campus_name}` }))
      );
    },
    "id",
    "name",
    "campus_name"
  );
};

// Define the login route handler
// It handles user login by verifying the email and password
// If the credentials are valid, it generates a JWT token and returns it
handlers.login = (data, callback) => {
  if (data.method !== "post") return callback(405, { message: "Method not allowed" });
  const { email, password } = data.payload || {};
  if (!email || !password) return callback(400, { message: "Missing email or password" });

  database.getUserByEmail(email, (err, user) => {
    if (err || !user) return callback(401, { message: "Invalid email or password" });

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err || !isMatch) return callback(401, { message: "Invalid email or password" });

      const token = jwt.sign({ id: user.id, email: user.email }, secretKey, { expiresIn: "1h" });
      callback(200, { message: "Login successful", token });
    });
  });
};

// Define the logout route handler
// It handles user logout by adding the token to the blacklist
// If the token is missing, it returns a 400 Bad Request response
handlers.logout = (data, callback) => {
  if (data.method !== "post") return callback(405, { message: "Method not allowed" });
  const token = data.headers.token;
  if (!token) return callback(400, { message: "Missing token" });

  // Check if the token is in the blacklist
  if (isTokenInBlacklist(token)) return callback(200, { message: "user has already been logedout" });

  // Verify token
  if (verifyToken(token) === null) return callback(401, { message: "Invalid token" });

  const decodedToken = jwt.decode(token);
  if (decodedToken && decodedToken.exp) tokenBlacklist.set(token, decodedToken.exp * 1000);
  callback(200, { message: "Logout successful" });
};

// Periodically clean up expired tokens from the blacklist
// This function runs every hour to remove expired tokens
setInterval(() => {
  const now = Date.now();
  for (const [token, expirationTime] of tokenBlacklist.entries()) {
    if (now > expirationTime) tokenBlacklist.delete(token);
  }
}, 60 * 60 * 1000);

// Apply access control to the specified routes
applyAccessControl();

module.exports = { handlers };
