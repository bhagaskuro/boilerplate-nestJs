<div align="center">
  <h1>🏗 Kuli Digital NestJS Backend</h1>
  <p>The standard backend application architecture built with NestJS following the <b>Kuli Digital Standardization Manual</b>.</p>
</div>

---

## ✨ Features

- 🔐 **JWT Authentication with RBAC**: Secure endpoints using Role-Based Access Control.
- 📝 **Complete User Management**: Built-in user creation, login, and profile handling.
- 🎯 **Permission-based Access Control**: Fine-grained authorization controls.
- 📚 **Auto-generated Swagger Documentation**: Interactive API documentation available out of the box.
- ✅ **Input Validation**: Strongly typed DTOs and parameter validation.
- 🔄 **API Versioning**: Scalable route versioning (e.g., `/v1/...`).
- 📊 **Structured Logging**: Pre-configured global interceptors for request/response logging.
- 🗃️ **Prisma ORM with PostgreSQL**: Fully typed database access.
- 🧪 **Testing Setup**: Ready-to-go Unit & E2E testing environments.

## ⚙️ Prerequisites

Before you begin, ensure you have met the following requirements:
- Node.js `>= 18.x`
- PostgreSQL `>= 14.x`
- npm, yarn, or pnpm

## 🚀 Installation & Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Setup environment variables:**
Your `.env` file should already be generated if you used the CLI tool. If not, copy it from the example:
```bash
cp .env.example .env
```
*(Ensure `DATABASE_URL` is correctly configured to point to your PostgreSQL database)*

3. **Initialize the Database:**
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations to create tables
npx prisma migrate dev

# Seed the database with default roles and users
npm run prisma:seed
```

## 💻 Running the Application

```bash
# Development mode (Hot-reload)
npm run start:dev

# Production build
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

## 🗄 Database Commands (Prisma)

```bash
# Generate Prisma Client (after pulling new schema changes)
npx prisma generate

# Create a new migration (after modifying schema.prisma)
npx prisma migrate dev --name <migration_name>

# Open Prisma Studio (GUI to view your database)
npx prisma studio
```

## 🧪 Testing

```bash
# Run Unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Run tests with coverage
npm run test:cov
```

## 📖 API Documentation

Once the application is running, you can access the Swagger UI documentation at:
👉 **[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

## 👥 Default Seeded Users

If you ran `npm run prisma:seed`, you can log in with the following default credentials:

**👑 Admin User:**
- Email: `admin@kulidigital.com`
- Password: `password123`
- *Privileges: All permissions granted*

**👤 Member User:**
- Email: `member@kulidigital.com`
- Password: `password123`
- *Privileges: Limited permissions (VIEW_USER only)*

## 📂 Project Structure

```text
src/
├── common/              # Shared resources across the app
│   ├── constants/       # Global constants (e.g., Permissions)
│   ├── decorators/      # Custom decorators (e.g., @GetUser)
│   ├── dto/             # Shared DTOs (e.g., Pagination)
│   ├── filters/         # Exception filters (e.g., HttpExceptionFilter)
│   ├── guards/          # Auth & permission guards
│   ├── helpers/         # Helper functions
│   ├── interceptors/    # Logging & transform interceptors
│   ├── prisma/          # Prisma module & service
│   └── utils/           # Utility functions (e.g., Password hashing)
├── config/              # Configuration files & Environment validation
├── modules/             # Feature-specific modules
│   ├── auth/            # Authentication logic & endpoints
│   ├── users/           # User management logic & endpoints
│   └── health/          # Health check endpoint
├── app.module.ts        # Root module
└── main.ts              # Application entry point
```

## 📄 License

Proprietary - Kuli Digital