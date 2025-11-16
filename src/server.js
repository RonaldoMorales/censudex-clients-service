// Carga variables de entorno desde .env
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
const clientRoutes = require('./routes/clientRoutes');
const { startGrpcServer } = require('./grpc/grpcServer');

const app = express();
const PORT = process.env.PORT || 3001;

// Habilita CORS para permitir solicitudes desde otros orígenes
app.use(cors());
// Permite recibir JSON en las peticiones
app.use(express.json());
// Permite recibir datos codificados en formularios
app.use(express.urlencoded({ extended: true }));

// Rutas del servicio de clientes
app.use('/api/clients', clientRoutes);

// Endpoint simple para verificar el estado del servicio
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'Clients Service' });
});

// Middleware para manejar rutas inexistentes
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Error interno del servidor',
    // En desarrollo se muestra el mensaje real del error
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Función para arrancar el servidor HTTP y el servidor gRPC
const startServer = async () => {
  try {
    await connectDB(); // Conecta a la base de datos
    
    app.listen(PORT, () => {
      console.log(`HTTP Server corriendo en puerto ${PORT}`);
    });

    startGrpcServer(); // Inicia el servidor gRPC
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1); // Finaliza el proceso si ocurre un error crítico
  }
};

startServer();