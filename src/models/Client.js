const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Definición del modelo Client
const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.UUID,
    defaultValue: () => uuidv4(), // Genera UUID automáticamente
    primaryKey: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'first_name' // Nombre de columna en BD
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'last_name'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // No se puede repetir
    validate: {
      isEmail: true, // Debe ser un email válido
      customValidator(value) { // Validación de dominio
        if (!value.endsWith('@censudex.cl')) {
          throw new Error('El correo debe ser del dominio @censudex.cl');
        }
      }
    }
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true // No se puede repetir
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false // Se almacena hash
  },
  birthDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'birth_date',
    validate: {
      isAdult(value) { // Verifica que sea mayor de 18 años
        const today = new Date();
        const birthDate = new Date(value);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        if (age < 18) {
          throw new Error('El usuario debe ser mayor de 18 anos');
        }
      }
    }
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false // Dirección obligatoria
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isChileanPhone(value) { // Valida formato de teléfono chileno
        const phoneRegex = /^(\+?56)?[9][0-9]{8}$/;
        if (!phoneRegex.test(value.replace(/\s/g, ''))) {
          throw new Error('Debe ser un numero telefonico chileno valido');
        }
      }
    }
  },
  role: {
    type: DataTypes.ENUM('client', 'admin'), // Roles permitidos
    defaultValue: 'client'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active' // Estado lógico
  },
  deletedAt: {
    type: DataTypes.DATE,
    field: 'deleted_at' // Soft delete
  }
}, {
  tableName: 'clients',
  timestamps: true, // Habilita createdAt / updatedAt
  paranoid: true, // Soft delete habilitado
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at'
});

// Hashea contraseña antes de crear
Client.beforeCreate(async (client) => {
  if (client.password) {
    const salt = await bcrypt.genSalt(10);
    client.password = await bcrypt.hash(client.password, salt);
  }
});

// Hashea contraseña si se actualiza
Client.beforeUpdate(async (client) => {
  if (client.changed('password')) {
    const salt = await bcrypt.genSalt(10);
    client.password = await bcrypt.hash(client.password, salt);
  }
});

// Compara contraseña ingresada con hash guardado
Client.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = Client;
