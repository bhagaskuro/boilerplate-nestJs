# Kuli Digital NestJS Backend

Backend application built with NestJS following Kuli Digital standardization manual.

## Features

- 🔐 JWT Authentication with RBAC
- 📝 Complete User Management
- 🎯 Permission-based Access Control
- 📚 Auto-generated Swagger Documentation
- ✅ Input Validation
- 🔄 API Versioning
- 📊 Structured Logging
- 🗃️ Prisma ORM with PostgreSQL
- 🧪 Testing Setup (Unit & E2E)

## Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm/yarn/pnpm

## Installation
```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database
npm run prisma:seed
```

## Running the Application
```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

## Database Commands
```bash
# Generate Prisma Client
npm run prisma:generate

# Create migration
npm run prisma:migrate

# Seed database
npm run prisma:seed

# Open Prisma Studio
npm run prisma:studio
```

## Testing
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## API Documentation

After starting the application, visit:
- Swagger UI: `http://localhost:3000/api-docs`

## Default Users

After seeding the database:

**Admin User:**
- Email: `admin@kulidigital.com`
- Password: `password123`
- All permissions granted

**Member User:**
- Email: `member@kulidigital.com`
- Password: `password123`
- Limited permissions (VIEW_USER only)

## Project Structure
```
src/
├── common/              # Shared resources
│   ├── decorators/      # Custom decorators
│   ├── filters/         # Exception filters
│   ├── guards/          # Auth & permission guards
│   ├── interceptors/    # Logging & transform
│   ├── prisma/          # Prisma service
│   └── utils/           # Helper functions
├── config/              # Configuration files
├── modules/             # Feature modules
│   ├── auth/            # Authentication
│   ├── users/           # User management
│   └── health/          # Health checks
├── app.module.ts        # Root module
└── main.ts              # Application entry point
```

## Environment Variables

See `.env.example` for all available configuration options.

## License

Proprietary - Kuli Digital
```

### 20.2 .gitkeep for migrations

**templates/nestjs-app/prisma/migrations/.gitkeep**
```
# This file keeps the migrations directory in git