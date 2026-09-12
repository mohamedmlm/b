const { body, param } = require("express-validator");
const sanitizeHtml = require("sanitize-html");

const cleanInput = (value) => {
    if (!value) return '';
    return sanitizeHtml(value, {
        allowedTags: [],
        allowedAttributes: {}
    }).trim();
};

exports.registerValidator = [
    body("name")
        .customSanitizer(cleanInput)
        .isLength({ min: 3, max: 20 })
        .withMessage("name must be between 3 and 20 characters")
        .notEmpty()
        .withMessage("name is required"),
    
    body("email")
        .trim()
        .toLowerCase()
        .isEmail()
        .withMessage("Please provide a valid email")
        .normalizeEmail(),
    
    body("username")
        .customSanitizer(cleanInput)
        .trim()
        .toLowerCase()
        .isLength({ min: 3, max: 20 })
        .withMessage("username must be between 3 and 20 characters"),
    
    body("password")
        .trim()
        .isLength({ min: 8, max: 25 })
        .withMessage("password must be between 8 and 25 characters")
];

exports.loginValidator = [
    body("username").trim().toLowerCase().notEmpty().customSanitizer(cleanInput),
    body("password").trim().notEmpty()
];

exports.itemValidator = [
    body("name")
        .customSanitizer(cleanInput)
        .isLength({ min: 3, max: 50 })
        .withMessage("name must be between 3 and 50 characters")
        .notEmpty()
        .withMessage("name is required"),
    body("description")
        .customSanitizer(cleanInput)
        .isLength({ max: 500 })
        .withMessage("description must be less than 500 characters"),
    body("min")
        .customSanitizer(cleanInput)
        .isLength({ min: 1, max: 20 })
        .withMessage("size must be between 1 and 20 characters")
        .notEmpty()
        .withMessage("size is required"),
    body("max")
        .customSanitizer(cleanInput)
        .isLength({ min: 1, max: 20 })
        .withMessage("size must be between 1 and 20 characters")
        .notEmpty()
        .withMessage("size is required"),
    body("price")
        .isFloat({ gt: 0 })
        .withMessage("price must be a positive number"),
    body("category")
        .customSanitizer(cleanInput)
        .isLength({ min: 3, max: 30 })
        .withMessage("category must be between 3 and 30 characters")
        .notEmpty()
        .withMessage("category is required")
];

exports.commentsValidator = [
    body("comment")
        .customSanitizer(cleanInput)
        .notEmpty()
        .withMessage("comment is required")
        .isLength({ max: 35 })
        .withMessage("comment must be less than 35 characters"),
    body("rating")
        .isInt({ min: 1, max: 5 })
        .withMessage("rating must be an integer between 1 and 5")
];

exports.payvalidator = [
    param('itemId')
        .notEmpty().withMessage('Item ID is required')
        .isMongoId().withMessage('Item ID must be a valid MongoDB ID'),

    body('addressDetails')
        .isObject().withMessage('Address details must be an object')
        .notEmpty().withMessage('Address details is required'),

    body('addressDetails.street')
        .notEmpty().withMessage('Street is required')
        .isString().withMessage('Street must be a string')
        .isLength({ min: 2, max: 100 }).withMessage('Street must be between 2 and 100 characters'),

    body('addressDetails.city')
        .notEmpty().withMessage('City is required')
        .isString().withMessage('City must be a string')
        .isLength({ min: 2, max: 50 }).withMessage('City must be between 2 and 50 characters'),

    body('addressDetails.district')
        .notEmpty().withMessage('District is required')
        .isString().withMessage('District must be a string')
        .isLength({ min: 2, max: 50 }).withMessage('District must be between 2 and 50 characters'),

    body('addressDetails.buildingNumber')
        .notEmpty().withMessage('Building number is required')
        .isString().withMessage('Building number must be a string')
        .isLength({ min: 1, max: 20 }).withMessage('Building number must be between 1 and 20 characters'),

    body('addressDetails.apartmentNumber')
        .optional()
        .isString().withMessage('Apartment number must be a string')
        .isLength({ max: 10 }).withMessage('Apartment number must be less than 10 characters'),

    body('addressDetails.distinctiveMark')
    .optional()
    .isString().withMessage("Distinctive mark must be a string")
    .isLength({ max: 30 }).withMessage('Distinctive mark must be less than 30 characters'),
    
    body('min')
    .notEmpty().withMessage('Item size is required')
    .isNumeric().withMessage('Item size must be a number')
    .trim(),

    body('max')
    .notEmpty().withMessage('Item size is required')
    .isNumeric().withMessage('Item size must be a number')
    .trim(),
    body('callnumber')
    .notEmpty().withMessage('Call number is required')
    .isString().withMessage('Call number must be a string')
    .isLength({ min: 6, max: 20 }).withMessage('Call number must be between 6 and 20 characters')
]

exports.rejectPayValidator = [
    param('payId')
        .notEmpty().withMessage('Payment ID is required')
        .isMongoId().withMessage('Payment ID must be a valid MongoDB ID'),
 
    body('reason')
        .optional()
        .isString().withMessage('Reason must be a string')
        .isLength({ max: 200 }).withMessage('Reason must be less than 200 characters'),
];
