const { body, param, query } = require('express-validator');

const passwordValidator = () => {
  return body('password')
    .isLength({ min: 8 })
    .withMessage('La contrasena debe tener al menos 8 caracteres')
    .matches(/[A-Z]/)
    .withMessage('Debe contener al menos una letra mayuscula')
    .matches(/[a-z]/)
    .withMessage('Debe contener al menos una letra minuscula')
    .matches(/[0-9]/)
    .withMessage('Debe contener al menos un numero')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Debe contener al menos un caracter especial');
};

const createClientValidation = [
  body('firstName')
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isString()
    .withMessage('El nombre debe ser texto'),
  
  body('lastName')
    .notEmpty()
    .withMessage('Los apellidos son requeridos')
    .isString()
    .withMessage('Los apellidos deben ser texto'),
  
  body('email')
    .notEmpty()
    .withMessage('El correo es requerido')
    .isEmail()
    .withMessage('Debe ser un correo valido')
    .custom((value) => {
      if (!value.endsWith('@censudex.cl')) {
        throw new Error('El correo debe ser del dominio @censudex.cl');
      }
      return true;
    }),
  
  body('username')
    .notEmpty()
    .withMessage('El nombre de usuario es requerido')
    .isString()
    .withMessage('El nombre de usuario debe ser texto')
    .isLength({ min: 3 })
    .withMessage('El nombre de usuario debe tener al menos 3 caracteres'),
  
  passwordValidator(),
  
  body('birthDate')
    .notEmpty()
    .withMessage('La fecha de nacimiento es requerida')
    .isDate()
    .withMessage('Debe ser una fecha valida'),
  
  body('address')
    .notEmpty()
    .withMessage('La direccion es requerida')
    .isString()
    .withMessage('La direccion debe ser texto'),
  
  body('phone')
    .notEmpty()
    .withMessage('El telefono es requerido')
    .matches(/^(\+?56)?[9][0-9]{8}$/)
    .withMessage('Debe ser un numero telefonico chileno valido')
];

const updateClientValidation = [
  param('id')
    .isUUID()
    .withMessage('ID invalido'),
  
  body('firstName')
    .optional()
    .isString()
    .withMessage('El nombre debe ser texto'),
  
  body('lastName')
    .optional()
    .isString()
    .withMessage('Los apellidos deben ser texto'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Debe ser un correo valido')
    .custom((value) => {
      if (value && !value.endsWith('@censudex.cl')) {
        throw new Error('El correo debe ser del dominio @censudex.cl');
      }
      return true;
    }),
  
  body('username')
    .optional()
    .isString()
    .withMessage('El nombre de usuario debe ser texto')
    .isLength({ min: 3 })
    .withMessage('El nombre de usuario debe tener al menos 3 caracteres'),
  
  body('birthDate')
    .optional()
    .isDate()
    .withMessage('Debe ser una fecha valida'),
  
  body('address')
    .optional()
    .isString()
    .withMessage('La direccion debe ser texto'),
  
  body('phone')
    .optional()
    .matches(/^(\+?56)?[9][0-9]{8}$/)
    .withMessage('Debe ser un numero telefonico chileno valido')
];

const updatePasswordValidation = [
  param('id')
    .isUUID()
    .withMessage('ID invalido'),
  
  passwordValidator()
];

const getClientByIdValidation = [
  param('id')
    .isUUID()
    .withMessage('ID invalido')
];

const deleteClientValidation = [
  param('id')
    .isUUID()
    .withMessage('ID invalido')
];

const filterValidation = [
  query('name')
    .optional()
    .isString()
    .withMessage('El nombre debe ser texto'),
  
  query('email')
    .optional()
    .isEmail()
    .withMessage('Debe ser un correo valido'),
  
  query('username')
    .optional()
    .isString()
    .withMessage('El nombre de usuario debe ser texto'),
  
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser true o false')
];

module.exports = {
  createClientValidation,
  updateClientValidation,
  updatePasswordValidation,
  getClientByIdValidation,
  deleteClientValidation,
  filterValidation
};