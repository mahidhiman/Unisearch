const http = require("http");
const url = require("url");
const { handlers } = require("./routes");
const StringDecoder = require("string_decoder").StringDecoder;
const querystring = require("querystring");
const { stat } = require("fs");

// Define the router with available routes
const router = {
  course: handlers.course,
  notFound: handlers.notFound,
  universities: handlers.university,
  ielts: handlers.ielts,
  pte: handlers.pte,
  requirements: handlers.requirements,
  allUniversities: handlers.allUniversities,
  allCourses: handlers.allCourses,
  users: handlers.users,
  login: handlers.login,
  logout: handlers.logout,
  allUniName: handlers.allUniversitiesNames,
};

/**
 * Creates an HTTP server that handles incoming requests and routes them to the appropriate handler.
 *
 * The server parses the URL, trims the path, extracts the query string, method, headers, and payload.
 * It then routes the request to the appropriate handler based on the trimmed path.
 *
 * @param {http.IncomingMessage} req - The incoming request object.
 * @param {http.ServerResponse} res - The outgoing response object.
 *
 * The request object is used to:
 * - Parse the URL and extract the pathname and query string.
 * - Extract the HTTP method and headers.
 * - Decode the payload data.
 *
 * The response object is used to:
 * - Set the response headers.
 * - Write the response status code.
 * - Send the response payload as a JSON string.
 *
 * The server uses a router object to determine the appropriate handler for the request.
 * If the path does not match any route, the 'notFound' handler is used.
 *
 * The handler is called with a data object containing:
 * - trimmedPath: The trimmed request path.
 * - queryStringObject: The parsed query string object.
 * - method: The HTTP method in lowercase.
 * - headers: The request headers.
 * - payload: The parsed payload data.
 *
 * The handler responds with a status code and a payload object, which are used to construct the response.
 */
const server = http.createServer((req, res) => {
  // Enable CORS for all routes
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, token");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Parse the incoming request URL
  const parsedUrl = url.parse(req.url, true);

  // Get the path from the URL and trim it
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, "");

  // Get the query string as an object
  const queryStringObject = parsedUrl.query;

  // Get the HTTP method
  const method = req.method.toLowerCase();

  // Get the headers as an object
  const headers = req.headers;

  // Initialize the string decoder for the payload
  const decoder = new StringDecoder("utf-8");
  let buffer = "";

  // Collect the payload data
  req.on("data", (data) => {
    buffer += decoder.write(data);
  });

  // End the payload collection and process the request
  req.on("end", async () => {
    buffer += decoder.end();
    buffer = querystring.parse(buffer);

    // Choose the appropriate handler for the request
    const chosenHandler = typeof router[trimmedPath] !== "undefined" ? router[trimmedPath] : router.notFound;

    // Construct the data object to send to the handler
    const data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      payload: buffer,
    };

    //resolve options request
    if (method === "options") {
      res.writeHead(200);
      res.end();
      return;
    } else {
      // Call the handler and construct the response
      chosenHandler(data, (statusCode, payload) => {
        console.log("payload", payload, "statusCode", statusCode, method, "respose headers", res.getHeaders());
        statusCode = typeof statusCode === "number" ? statusCode : 200;
        payload = typeof payload === "object" ? payload : {};
        const payloadString = JSON.stringify(payload);
        // Set the response headers and send the response
        res.setHeader("Content-Type", "application/json");
        res.writeHead(statusCode);
        res.write(payloadString);
        res.end();
        return;
      });
    }
  });
});

// Server is listening on port 3001
server.listen(3001, () => {
  console.log("Server is listening on port 3001");
});
