require('dotenv').config();
const { sequelize } = require('../config/database');
const Client = require('../models/Client');

// Seeder para poblar la tabla clients
const seedClients = async () => {
  try {
    await sequelize.authenticate();        // Verifica conexión a la BD
    console.log('Conexion exitosa a la base de datos');

    await sequelize.sync({ force: true }); // Reinicia tablas (DROP + CREATE)
    console.log('Base de datos sincronizada');

    // Datos iniciales para la tabla clients
    const clients = [
      {
        firstName: 'Admin',
        lastName: 'Sistema',
        email: 'admin@censudex.cl',
        username: 'admin',
        password: 'Admin123!',            // Se hashea por individualHooks
        birthDate: '1990-01-01',
        address: 'Av. Administrador 123, Santiago',
        phone: '+56912345678',
        role: 'admin',
        isActive: true
      },
      {
        firstName: 'Juan',
        lastName: 'Perez Gonzalez',
        email: 'juan.perez@censudex.cl',
        username: 'juanperez',
        password: 'Juan1234!',
        birthDate: '1995-05-15',
        address: 'Av. Libertador Bernardo OHiggins 1234, Santiago',
        phone: '+56987654321',
        role: 'client',
        isActive: true
      },
      {
        firstName: 'Maria',
        lastName: 'Gonzalez Silva',
        email: 'maria.gonzalez@censudex.cl',
        username: 'mariagonzalez',
        password: 'Maria456!',
        birthDate: '1988-08-20',
        address: 'Calle Providencia 567, Providencia',
        phone: '+56998765432',
        role: 'client',
        isActive: true
      },
      {
        firstName: 'Carlos',
        lastName: 'Rodriguez Munoz',
        email: 'carlos.rodriguez@censudex.cl',
        username: 'carlosrodriguez',
        password: 'Carlos789!',
        birthDate: '1992-03-10',
        address: 'Av. Las Condes 890, Las Condes',
        phone: '+56976543210',
        role: 'client',
        isActive: true
      },
      {
        firstName: 'Ana',
        lastName: 'Martinez Lopez',
        email: 'ana.martinez@censudex.cl',
        username: 'anamartinez',
        password: 'Ana2023!',
        birthDate: '1997-11-25',
        address: 'Calle Huerfanos 456, Santiago Centro',
        phone: '+56965432109',
        role: 'client',
        isActive: false // Cliente inactivo
      }
    ];

    // Crea todos los clientes usando los hooks (para hashear contraseñas)
    await Client.bulkCreate(clients, { individualHooks: true });
    console.log('Clientes creados exitosamente');

    // Verifica cuántos clientes quedaron en la BD
    const count = await Client.count();
    console.log(`Total de clientes en la base de datos: ${count}`);

    process.exit(0); // Termina proceso correctamente
  } catch (error) {
    console.error('Error al crear clientes:', error);
    process.exit(1); // Termina proceso con error
  }
};

seedClients();
