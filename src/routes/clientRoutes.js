const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const {
  createClientValidation,
  updateClientValidation,
  updatePasswordValidation,
  getClientByIdValidation,
  deleteClientValidation,
  filterValidation
} = require('../validators/clientValidator');

router.post('/', createClientValidation, clientController.createClient);

router.get('/', filterValidation, clientController.getAllClients);

router.get('/:id', getClientByIdValidation, clientController.getClientById);

router.patch('/:id', updateClientValidation, clientController.updateClient);

router.patch('/:id/password', updatePasswordValidation, clientController.updatePassword);

router.delete('/:id', deleteClientValidation, clientController.deleteClient);

module.exports = router;