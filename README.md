# Censudex Clients Service

Microservicio de gestión de clientes para el sistema Censudex. Maneja toda la información de los usuarios del sistema, incluyendo registro, consulta, actualización y eliminación (soft delete).

## Arquitectura

Microservicio independiente que expone tanto HTTP como gRPC para comunicación con otros servicios. Utiliza PostgreSQL como base de datos.

### Patrón de Diseño

- **Microservices Pattern**: Servicio independiente enfocado en gestión de clientes
- **Repository Pattern**: Capa de acceso a datos mediante Sequelize ORM
- **Soft Delete Pattern**: Eliminación lógica de registros preservando trazabilidad
- **Dual Protocol Pattern**: Expone HTTP para acceso directo y gRPC para comunicación entre servicios

### Comunicación

- **HTTP REST**: API REST para pruebas directas y acceso externo
- **gRPC**: Comunicación eficiente con la API Gateway

## Requisitos

- Node.js 16 o superior
- PostgreSQL 12 o superior
- npm (gestor de paquetes de Node.js)

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/RonaldoMorales/censudex-clients-service.git
cd censudex-clients-service
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar base de datos PostgreSQL

Crea la base de datos en PostgreSQL:

```sql
CREATE DATABASE censudex_clients;
```

### 4. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=censudex_clients
DB_USER=postgres
DB_PASSWORD=tu_password_postgres
NODE_ENV=development
GRPC_PORT=50051
```

## Ejecución

### Ejecutar el servidor

```bash
npm run dev
```

El servicio estará disponible en:
- **HTTP**: `http://localhost:3001`
- **gRPC**: `localhost:50051`

### Ejecutar el seeder

Para cargar datos de prueba:

```bash
npm run seed
```

Esto creará 5 usuarios de prueba, incluyendo un administrador.

## Endpoints HTTP

### 1. Crear Cliente

**POST** `/api/clients`

Registra un nuevo cliente en el sistema.

**Request:**
```json
{
  "firstName": "Juan",
  "lastName": "Pérez González",
  "email": "juan.perez@censudex.cl",
  "username": "juanperez",
  "password": "Juan1234!",
  "birthDate": "1995-05-15",
  "address": "Av. Libertador 1234, Santiago",
  "phone": "+56987654321"
}
```

**Validaciones:**
- Email debe ser @censudex.cl
- Contraseña: mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número, 1 carácter especial
- Teléfono: formato chileno (+56 9XXXXXXXX)
- Fecha de nacimiento: mayor de 18 años
- Email y username únicos

**Response (201):**
```json
{
  "message": "Cliente creado exitosamente",
  "client": {
    "id": "uuid-generado",
    "firstName": "Juan",
    "lastName": "Pérez González",
    "email": "juan.perez@censudex.cl",
    "username": "juanperez",
    "role": "client",
    "isActive": true,
    "birthDate": "1995-05-15",
    "address": "Av. Libertador 1234, Santiago",
    "phone": "+56987654321",
    "createdAt": "2025-11-16T..."
  }
}
```

### 2. Obtener Todos los Clientes

**GET** `/api/clients`

Obtiene lista de clientes con filtros opcionales.

**Query Parameters:**
- `name`: Buscar por nombre (parcial)
- `email`: Filtrar por email (parcial)
- `username`: Filtrar por username (parcial)
- `isActive`: Filtrar por estado (true/false)

**Ejemplos:**
```
GET /api/clients
GET /api/clients?name=Juan
GET /api/clients?isActive=true
GET /api/clients?email=admin
```

**Response (200):**
```json
{
  "count": 5,
  "clients": [
    {
      "id": "uuid",
      "firstName": "Juan",
      "lastName": "Pérez",
      "email": "juan@censudex.cl",
      "username": "juanperez",
      "isActive": true,
      "birthDate": "1995-05-15",
      "address": "...",
      "phone": "+56987654321",
      "created_at": "2025-11-16T..."
    }
  ]
}
```

### 3. Obtener Cliente por ID

**GET** `/api/clients/:id`

Obtiene información detallada de un cliente específico.

**Response (200):**
```json
{
  "client": {
    "id": "uuid",
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@censudex.cl",
    "username": "juanperez",
    "role": "client",
    "isActive": true,
    "birthDate": "1995-05-15",
    "address": "...",
    "phone": "+56987654321",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### 4. Actualizar Cliente

**PATCH** `/api/clients/:id`

Actualiza información de un cliente.

**Request:**
```json
{
  "firstName": "Juan Actualizado",
  "address": "Nueva dirección 456",
  "phone": "+56998765432"
}
```

**Response (200):**
```json
{
  "message": "Cliente actualizado exitosamente",
  "client": { ... }
}
```

### 5. Actualizar Contraseña

**PATCH** `/api/clients/:id/password`

Actualiza la contraseña de un cliente.

**Request:**
```json
{
  "password": "NuevaPass123!"
}
```

**Response (200):**
```json
{
  "message": "Contraseña actualizada exitosamente"
}
```

### 6. Eliminar Cliente (Soft Delete)

**DELETE** `/api/clients/:id`

Desactiva un cliente sin eliminarlo físicamente.

**Response (200):**
```json
{
  "message": "Cliente desactivado exitosamente"
}
```

### 7. Health Check

**GET** `/health`

Verifica el estado del servicio.

**Response (200):**
```json
{
  "status": "OK",
  "service": "Clients Service"
}
```

## Servicios gRPC

El servicio expone los mismos endpoints a través de gRPC en el puerto 50051.

### Archivo .proto

```proto
syntax = "proto3";

package clients;

service ClientService {
  rpc CreateClient (CreateClientRequest) returns (ClientResponse);
  rpc GetAllClients (GetAllClientsRequest) returns (ClientListResponse);
  rpc GetClientById (GetClientByIdRequest) returns (ClientResponse);
  rpc UpdateClient (UpdateClientRequest) returns (ClientResponse);
  rpc UpdatePassword (UpdatePasswordRequest) returns (MessageResponse);
  rpc DeleteClient (DeleteClientRequest) returns (MessageResponse);
}
```

Ver archivo completo en `proto/clients.proto`

## Estructura del Proyecto

```
censudex-clients-service/
├── proto/
│   └── clients.proto
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   └── clientController.js
│   ├── grpc/
│   │   └── grpcServer.js
│   ├── models/
│   │   └── Client.js
│   ├── routes/
│   │   └── clientRoutes.js
│   ├── seeders/
│   │   └── seed.js
│   ├── validators/
│   │   └── clientValidator.js
│   └── server.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

## Modelo de Datos

### Cliente (Client)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único (UUID v4) |
| firstName | String | Nombre del cliente |
| lastName | String | Apellidos del cliente |
| email | String | Email único (@censudex.cl) |
| username | String | Nombre de usuario único |
| password | String | Contraseña hasheada (bcrypt) |
| birthDate | Date | Fecha de nacimiento (+18 años) |
| address | String | Dirección |
| phone | String | Teléfono chileno |
| role | Enum | Rol (client/admin) |
| isActive | Boolean | Estado del cliente |
| createdAt | Timestamp | Fecha de creación |
| updatedAt | Timestamp | Fecha de última actualización |
| deletedAt | Timestamp | Fecha de eliminación (soft delete) |

## Seguridad

### Encriptación de Contraseñas

Las contraseñas se encriptan usando **bcrypt** con un factor de 10 rounds antes de almacenarse.

### Validaciones

- **Email**: Formato válido y dominio @censudex.cl
- **Contraseña**: Mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número, 1 carácter especial
- **Teléfono**: Formato chileno (+56 9XXXXXXXX)
- **Edad**: Mayor de 18 años

### Soft Delete

Los clientes eliminados:
- Se marcan como `isActive: false`
- Se registra `deletedAt`
- No se eliminan físicamente de la base de datos
- Preserva integridad referencial e historial

## Seeder

El seeder crea 5 usuarios de prueba:

1. **Admin** - admin@censudex.cl / Admin123!
2. **Juan Pérez** - juan.perez@censudex.cl / Juan1234!
3. **María González** - maria.gonzalez@censudex.cl / Maria456!
4. **Carlos Rodríguez** - carlos.rodriguez@censudex.cl / Carlos789!
5. **Ana Martínez** (inactiva) - ana.martinez@censudex.cl / Ana2023!

## Integración con otros servicios

### Auth Service

Auth Service consume este servicio para:
- Validar credenciales de usuario
- Obtener información del usuario para generar JWT
- Verificar que el usuario está activo

### API Gateway

La API Gateway consume los endpoints gRPC (puerto 50051) para:
- Todas las operaciones CRUD de clientes
- Validación de usuarios durante autenticación

## Desarrollo

### Scripts disponibles

```bash
npm run dev     # Ejecuta con nodemon (auto-reload)
npm start       # Ejecuta en modo producción
npm run seed    # Carga datos de prueba
```

### Sincronización de base de datos

Sequelize sincroniza automáticamente los modelos con la base de datos al iniciar el servidor.

## Troubleshooting

### Error: "Connection refused" a PostgreSQL

- Verifica que PostgreSQL está corriendo
- Verifica usuario y contraseña en `.env`
- Verifica que la base de datos existe

### Error: "Email debe ser del dominio @censudex.cl"

Todos los emails deben terminar en `@censudex.cl`

### Error: "El usuario debe ser mayor de 18 años"

Calcula que la fecha de nacimiento sea hace más de 18 años

### Error: "Port already in use"

Otro proceso está usando el puerto 3001 o 50051. Cámbialo en `.env`

## Tecnologías Utilizadas

- **Express**: Framework web para Node.js
- **Sequelize**: ORM para PostgreSQL
- **PostgreSQL**: Base de datos relacional
- **bcrypt**: Encriptación de contraseñas
- **gRPC**: Comunicación eficiente entre servicios
- **uuid**: Generación de identificadores únicos
- **express-validator**: Validación de datos de entrada

## Variables de Entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| PORT | Puerto HTTP | 3001 |
| GRPC_PORT | Puerto gRPC | 50051 |
| DB_HOST | Host de PostgreSQL | localhost |
| DB_PORT | Puerto de PostgreSQL | 5432 |
| DB_NAME | Nombre de la base de datos | censudex_clients |
| DB_USER | Usuario de PostgreSQL | postgres |
| DB_PASSWORD | Contraseña de PostgreSQL | - (requerido) |
| NODE_ENV | Entorno de ejecución | development |

## Autor

- Ronaldo Morales

## Licencia

Este proyecto es parte del curso de Arquitectura de Sistemas - Universidad Católica del Norte
