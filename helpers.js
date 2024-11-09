// validating user inputs for registration
const validateUserInput = ({ name, email, password, role }) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  console.log("validation ran for user input");
  //check if all fields are strings and not empty and email is valid and password is at least 6 characters long
  return (
    [name, email, password, role].every((field) => typeof field === "string" && field.trim().length > 0) &&
    emailRegex.test(email) &&
    password.trim().length >= 6
  );
};

//validating id for get, put, and delete requests
const validateId = (id) => id && typeof id === "string" && id.trim().length > 0;

//validating fields for put requests
const validateFields = (fields) => {
  console.log("fields", "validation ran");
  const validFields = {};
  //filter out fields with empty strings or zeros
  for (const [key, value] of Object.entries(fields)) {
    //if value is a string, check if it's not empty
    if (value && ((typeof value === "string" && value.trim().length > 0) || (typeof value === "number" && value > 0))) {
      validFields[key] = value;
    }
  }
  //return null if no valid fields
  return Object.keys(validFields).length > 0 ? validFields : null;
};

//export helper functions
module.exports = {
  validateUserInput,
  validateId,
  validateFields,
};
