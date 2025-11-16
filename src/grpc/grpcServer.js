const grpc = require('@grpc/grpc-js'); // Librería gRPC
const protoLoader = require('@grpc/proto-loader'); // Carga de .proto
const path = require('path');
const Client = require('../models/Client'); // Modelo Sequelize
const { Op } = require('sequelize'); // Operadores de comparación

// Ruta del archivo .proto
const PROTO_PATH = path.join(__dirname, '../../proto/clients.proto');

// Carga del archivo .proto con configuraciones recomendadas
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

// Obtiene el paquete generado
const clientsProto = grpc.loadPackageDefinition(packageDefinition).clients;

/* ============================
   CREATE CLIENT
============================ */
const createClient = async (call, callback) => {
  try {
    // Datos enviados por el cliente gRPC
    const { firstName, lastName, email, username, password, birthDate, address, phone } = call.request;

    // Validación: email o username ya registrado
    const existingClient = await Client.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (existingClient) {
      return callback({
        code: grpc.status.ALREADY_EXISTS,
        message: 'El correo o nombre de usuario ya esta registrado'
      });
    }

    // Crear cliente en BD
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

    // Preparar respuesta sin datos sensibles
    const clientData = client.toJSON();
    delete clientData.password;
    delete clientData.deletedAt;

    callback(null, {
      ...clientData,
      createdAt: clientData.created_at,
      updatedAt: clientData.updated_at,
      message: 'Cliente creado exitosamente'
    });
  } catch (error) {
    console.error('Error en createClient gRPC:', error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message
    });
  }
};

/* ============================
   GET ALL CLIENTS
============================ */
const getAllClients = async (call, callback) => {
  try {
    const { name, email, username, isActive } = call.request;
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

    // Conversión string → boolean
    if (isActive) {
      whereClause.isActive = isActive === 'true';
    }

    // Consulta con exclusión de campos sensibles
    const clients = await Client.findAll({
      where: whereClause,
      attributes: {
        exclude: ['password', 'deletedAt', 'updatedAt']
      },
      order: [['created_at', 'DESC']]
    });

    // Convertir cada cliente a formato plano
    const clientsData = clients.map(c => {
      const data = c.toJSON();
      return {
        ...data,
        createdAt: data.created_at,
        updatedAt: data.updated_at || ''
      };
    });

    callback(null, {
      count: clients.length,
      clients: clientsData
    });
  } catch (error) {
    console.error('Error en getAllClients gRPC:', error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message
    });
  }
};

/* ============================
   GET CLIENT BY ID
============================ */
const getClientById = async (call, callback) => {
  try {
    const { id, includePassword } = call.request;

    // Excluir password según bandera enviada por el cliente gRPC
    const excludeFields = includePassword ? ['deletedAt'] : ['password', 'deletedAt'];

    const client = await Client.findByPk(id, {
      attributes: { exclude: excludeFields }
    });

    if (!client) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: 'Cliente no encontrado'
      });
    }

    const clientData = client.toJSON();

    callback(null, {
      ...clientData,
      password: clientData.password || '',
      createdAt: clientData.created_at,
      updatedAt: clientData.updated_at
    });
  } catch (error) {
    console.error('Error en getClientById gRPC:', error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message
    });
  }
};

/* ============================
   UPDATE CLIENT
============================ */
const updateClient = async (call, callback) => {
  try {
    const { id, firstName, lastName, email, username, birthDate, address, phone } = call.request;

    const client = await Client.findByPk(id);

    if (!client) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: 'Cliente no encontrado'
      });
    }

    // Validar email/username duplicados (ignorando el propio usuario)
    if (email || username) {
      const whereClause = { id: { [Op.ne]: id } };
      const orConditions = [];

      if (email) orConditions.push({ email });
      if (username) orConditions.push({ username });

      whereClause[Op.or] = orConditions;

      const existingClient = await Client.findOne({ where: whereClause });

      if (existingClient) {
        return callback({
          code: grpc.status.ALREADY_EXISTS,
          message: 'El correo o nombre de usuario ya esta registrado'
        });
      }
    }

    // Actualizar datos en BD
    await client.update({
      firstName: firstName || client.firstName,
      lastName: lastName || client.lastName,
      email: email || client.email,
      username: username || client.username,
      birthDate: birthDate || client.birthDate,
      address: address || client.address,
      phone: phone || client.phone
    });

    const clientData = client.toJSON();
    delete clientData.password;
    delete clientData.deletedAt;

    callback(null, {
      ...clientData,
      createdAt: clientData.created_at,
      updatedAt: clientData.updated_at,
      message: 'Cliente actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error en updateClient gRPC:', error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message
    });
  }
};

/* ============================
   UPDATE PASSWORD
============================ */
const updatePassword = async (call, callback) => {
  try {
    const { id, password } = call.request;

    const client = await Client.findByPk(id);

    if (!client) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: 'Cliente no encontrado'
      });
    }

    // Actualizar solo contraseña
    await client.update({ password });

    callback(null, {
      message: 'Contrasena actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error en updatePassword gRPC:', error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message
    });
  }
};

/* ============================
   DELETE CLIENT
============================ */
const deleteClient = async (call, callback) => {
  try {
    const { id } = call.request;

    const client = await Client.findByPk(id);

    if (!client) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: 'Cliente no encontrado'
      });
    }

    // Soft delete + eliminación física
    await client.update({ isActive: false });
    await client.destroy();

    callback(null, {
      message: 'Cliente desactivado exitosamente'
    });
  } catch (error) {
    console.error('Error en deleteClient gRPC:', error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message
    });
  }
};

/* ============================
   START gRPC SERVER
============================ */
const startGrpcServer = () => {
  const server = new grpc.Server(); // Crear servidor

  // Registrar implementación del servicio
  server.addService(clientsProto.ClientService.service, {
    CreateClient: createClient,
    GetAllClients: getAllClients,
    GetClientById: getClientById,
    UpdateClient: updateClient,
    UpdatePassword: updatePassword,
    DeleteClient: deleteClient
  });

  const GRPC_PORT = process.env.GRPC_PORT || '50051';

  // Iniciar servidor gRPC
  server.bindAsync(
    `0.0.0.0:${GRPC_PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      if (error) {
        console.error('Error al iniciar servidor gRPC:', error);
        return;
      }
      console.log(`Servidor gRPC corriendo en puerto ${port}`);
    }
  );
};

module.exports = { startGrpcServer };
