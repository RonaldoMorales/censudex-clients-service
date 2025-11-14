const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const Client = require('../models/Client');
const { Op } = require('sequelize');

const PROTO_PATH = path.join(__dirname, '../../proto/clients.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const clientsProto = grpc.loadPackageDefinition(packageDefinition).clients;

const createClient = async (call, callback) => {
  try {
    const { firstName, lastName, email, username, password, birthDate, address, phone } = call.request;

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

const getAllClients = async (call, callback) => {
  try {
    const { name, email, username, isActive } = call.request;
    
    const whereClause = {};

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

    if (isActive) {
      whereClause.isActive = isActive === 'true';
    }

    const clients = await Client.findAll({
      where: whereClause,
      attributes: {
        exclude: ['password', 'deletedAt', 'updatedAt']
      },
      order: [['created_at', 'DESC']]
    });

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

const getClientById = async (call, callback) => {
  try {
    const { id, includePassword } = call.request;

    const excludeFields = includePassword ? ['deletedAt'] : ['password', 'deletedAt'];

    const client = await Client.findByPk(id, {
      attributes: {
        exclude: excludeFields
      }
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

    if (email || username) {
      const whereClause = {
        id: { [Op.ne]: id }
      };

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

const startGrpcServer = () => {
  const server = new grpc.Server();

  server.addService(clientsProto.ClientService.service, {
    CreateClient: createClient,
    GetAllClients: getAllClients,
    GetClientById: getClientById,
    UpdateClient: updateClient,
    UpdatePassword: updatePassword,
    DeleteClient: deleteClient
  });

  const GRPC_PORT = process.env.GRPC_PORT || '50051';
  
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