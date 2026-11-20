const { body, param } = require("express-validator");

const setRoleValidator = [
  param("memberId").isInt({ min: 1 }).withMessage("Invalid member"),

  body("roleId")
    .isInt({ min: 1, max: 7 })
    .withMessage("Choose a valid role"),

  body("fellowshipIds")
    .optional({ values: "null" })
    .isArray({ max: 10 })
    .withMessage("Campuses must be a list"),

  body("fellowshipIds.*")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Invalid campus"),

  body("allCampuses")
    .optional({ values: "null" })
    .isBoolean()
    .withMessage("allCampuses must be true or false"),
];



module.exports = {
  setRoleValidator,

};