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

//validating course inputs
const validateCourseInput = ({
  name,
  image,
  level_of_course,
  requirement_id,
  university_id,
  fees,
  duration,
  ielts_waiver,
  moi_accepted,
  link,
}) => {
  const urlRegex = /^(https?|chrome):\/\/[^\s$.?#].[^\s]*$/;
  console.log("validation ran for course input");
  //check if all fields are valid
  return (
    [name, level_of_course, requirement_id, university_id, ielts_waiver, moi_accepted, link].every(
      (field) => typeof field === "string" && field.trim().length > 0
    ) &&
    typeof fees === "number" &&
    fees >= 0 &&
    typeof duration === "number" &&
    duration > 0 &&
    urlRegex.test(image) &&
    urlRegex.test(link)
  );
};

// validating university inputs
const validateUniversityInput = (
  {
    name,
    campus_name,
    city,
    country,
    scholarships,
    link,
    application_fee,
    image,
    poc,
    deadline_application,
    deadline_fees,
    rank,
    IELTS_waiver,
    MOI_Accepted,
  },
  callabck
) => {
  const urlRegex = /^(https?|chrome):\/\/[^\s$.?#].[^\s]*$/;
  console.log("validation ran for university input");
  // check if all fields are valid
  results = [];

  [
    name,
    campus_name,
    city,
    country,
    scholarships,
    link,
    application_fee,
    image,
    poc,
    deadline_application,
    deadline_fees,
    rank,
  ].forEach((field, index, array) => {
    let fieldNames = [
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
    if (typeof field !== "string" || field.trim().length === 0) {
      results.push(`Field ${fieldNames[index]} must be a non-empty string, received ${field}, and `);
    }
  });

  callabck(results.length < 1 ? false : true, results);
};
// validating course inputs with detailed error messages
const validateCourseInputWithError = ({
  name,
  image,
  level_of_course,
  requirement_id,
  university_id,
  fees,
  duration,
  ielts_waiver,
  moi_accepted,
  link,
}) => {
  const urlRegex = /^(https?|chrome):\/\/[^\s$.?#].[^\s]*$/;
  console.log("validation ran for course input");
  if (
    ![name, level_of_course, requirement_id, university_id, ielts_waiver, moi_accepted, link].every(
      (field) => typeof field === "string" && field.trim().length > 0
    )
  ) {
    return "All string fields must be non-empty";
  }
  if (typeof fees !== "number" || fees < 0) {
    return "Fees must be a non-negative number";
  }
  if (typeof duration !== "number" || duration <= 0) {
    return "Duration must be a positive number";
  }
  if (!urlRegex.test(image)) {
    return "Image must be a valid URL";
  }
  if (!urlRegex.test(link)) {
    return "Link must be a valid URL";
  }
  return true;
};

//export helper functions with detailed error messages
module.exports = {
  validateUserInput,
  validateId,
  validateFields,
  validateUniversityInput,
  validateCourseInputWithError,
};
