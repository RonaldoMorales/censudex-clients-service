const { validationResult } = require('express-validator'); // Validación de inputs
const Client = require('../models/Client'); // Modelo Sequelize
const { Op } = require('sequelize'); // Operadores para consultas

// Crear cliente
const createClient = async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, username, password, birthDate, address, phone } = req.body;

    // Validar email o username existente
    const existingClient = await Client.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (existingClient) {
      return res.status(400).json({ 
        message: 'El correo o nombre de usuario ya esta registrado' 
      });
    }

    // Crear cliente
    const client = await Client.create({
      firstName,
      lastName,
      email,
      username,
      password,
      birthDate,
      address,
      phone
    });

    // Remover contraseña de la respuesta
    const clientResponse = client.toJSON();
    delete clientResponse.password;

    res.status(201).json({
      message: 'Cliente creado exitosamente',
      client: clientResponse
    });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ 
      message: 'Error al crear el cliente',
      error: error.message 
    });
  }
};

// Obtener lista de clientes con filtros
const getAllClients = async (req, res) => {
  try {
    // Validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, username, isActive } = req.query;
    const whereClause = {};

    // Filtro por nombre (firstName o lastName)
    if (name) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${name}%` } },
        { lastName: { [Op.iLike]: `%${name}%` } }
      ];
    }

    if (email) {
      whereClause.email = { [Op.iLike]: `%${email}%` };
    }

    if (username) {
      whereClause.username = { [Op.iLike]: `%${username}%` };
    }

    // Filtro booleano
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    // Consulta con exclusión de campos sensibles
    const clients = await Client.findAll({
      where: whereClause,
      attributes: {
        exclude: ['password', 'deletedAt', 'updatedAt']
      },
      order: [['created_at', 'DESC']] // Ordenar por fecha de creación
    });

    res.status(200).json({
      count: clients.length,
      clients
    });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ 
      message: 'Error al obtener los clientes',
      error: error.message 
    });
  }
};

// Obtener cliente por ID
const getClientById = async (req, res) => {
  try {
    // Validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const includePassword = req.query.includePassword === 'true';

    // Si no se pide password, se excluye
    const excludeFields = includePassword ? ['deletedAt'] : ['password', 'deletedAt'];

    const client = await Client.findByPk(id, {
      attributes: { exclude: excludeFields }
    });

    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    res.status(200).json({ client });
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({ 
      message: 'Error al obtener el cliente',
      error: error.message 
    });
  }
};

// Actualizar cliente
const updateClient = async (req, res) => {
  try {
    // Validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { firstName, lastName, email, username, birthDate, address, phone } = req.body;

    const client = await Client.findByPk(id);

    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    // Validar email/username repetidos (excluyendo el propio usuario)
    if (email || username) {
      const whereClause = {
        id: { [Op.ne]: id } // Excluir el propio
      };

      const orConditions = [];
      if (email) orConditions.push({ email });
      if (username) orConditions.push({ username });

      whereClause[Op.or] = orConditions;

      const existingClient = await Client.findOne({ where: whereClause });

      if (existingClient) {
        return res.status(400).json({ 
          message: 'El correo o nombre de usuario ya esta registrado' 
        });
      }
    }

    // Actualizar datos
    await client.update({
      firstName: firstName || client.firstName,
      lastName: lastName || client.lastName,
      email: email || client.email,
      username: username || client.username,
      birthDate: birthDate || client.birthDate,
      address: address || client.address,
      phone: phone || client.phone
    });

    const clientResponse = client.toJSON();
    delete clientResponse.password;

    res.status(200).json({
      message: 'Cliente actualizado exitosamente',
      client: clientResponse
    });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ 
      message: 'Error al actualizar el cliente',
      error: error.message 
    });
  }
};

// Actualizar contraseña
const updatePassword = async (req, res) => {
  try {
    // Validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { password } = req.body;

    const client = await Client.findByPk(id);

    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    // Actualizar password
    await client.update({ password });

    res.status(200).json({
      message: 'Contrasena actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar contrasena:', error);
    res.status(500).json({ 
      message: 'Error al actualizar la contrasena',
      error: error.message 
    });
  }
};

// Eliminar cliente (soft delete + destroy)
const deleteClient = async (req, res) => {
  try {
    // Validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    const client = await Client.findByPk(id);

    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    // Marcar como inactivo + eliminar registro
    await client.update({ isActive: false });
    await client.destroy();

    res.status(200).json({
      message: 'Cliente desactivado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ 
      message: 'Error al eliminar el cliente',
      error: error.message 
    });
  }
};

module.exports = {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  updatePassword,
  deleteClient
};
