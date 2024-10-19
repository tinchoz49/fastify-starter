# Fastify TypeScript Starter

A robust and modern starter template for building high-performance web applications using Fastify, TypeScript, and Drizzle ORM.

## 🚀 Features

- **[Fastify](https://www.fastify.io/)**: High-performance web framework for Node.js
- **[TypeScript](https://www.typescriptlang.org/)**: Strongly typed programming language that builds on JavaScript
- **[Fastify UWS](https://github.com/geut/fastify-uws)**: Push your Fastify server performance to the next level
- **[Drizzle ORM](https://github.com/drizzle-team/drizzle-orm)**: TypeScript ORM for SQL databases with a focus on type safety
- **[PostgreSQL](https://www.postgresql.org/)**: Powerful, open-source relational database
- **[node:test](https://nodejs.org/api/test.html)**: Built-in testing framework for Node.js
- **[pglite](https://github.com/electric-sql/pglite)**: In-memory PostgreSQL database for testing
- **[Standard Ext](https://github.com/tinchoz49/eslint-config-standard-ext)**: JavaScript style guide, linter, and formatter
- **[Typebox](https://github.com/sinclair/typebox)**: JSON schema based validation and generation
- **[Copycat](https://github.com/snaplet/copycat)**: Deterministic data generation for testing and seeding
- **[typebox-env](https://github.com/tinchoz49/typebox-env)**: Environment variables parsing and validation

## Fastify Plugins

- **[@fastify/auth](https://github.com/fastify/fastify-auth)**: Authentication plugin for Fastify
- **[@fastify/swagger](https://github.com/fastify/fastify-swagger)**: Document the API using Swagger
- **[@scalar/fastify-api-reference](https://github.com/scalar/scalar/tree/main/packages/fastify-api-reference)**: OpenAPI/Swagger interactive API documentation
- **[@fastify/type-provider-typebox](https://github.com/fastify/fastify-type-provider-typebox)**: Type-safe schema definition language
- **[fastify-better-error](https://github.com/tinchoz49/fastify-better-error)**: Supercharge Fastify error handling! Streamline definitions, automate schemas, and boost productivity with built-in HTTP errors and robust TypeScript support. Make errors work for you!

## 🧰 Commands

- `npm run dev`: Start the development server.
- `npm run build`: Build the application.
- `npm run start`: Start the application.
- `npm run test`: Run the test cases.
- `npm run coverage`: Generate the coverage report.
- `npm run lint`: Run the linter.
- `npm run db:generate`: Generate the migration file.
- `npm run db:migrate`: Apply the migration to the database.
- `npm run db:check`: Check the migration file.

## 📁 Structure

- `src/`: Source code.
- `src/app.ts`: Fastify application.
- `src/serve.ts`: Entry point.
- `src/env.ts`: TypeBox schema for environment variables.
- `src/errors.ts`: Custom errors.
- `src/plugins/`: User defined Fastify plugins.
- `src/routes/`: Fastify API routes.
- `src/schemas/`: TypeBox schemas.
- `src/db/`: Drizzle ORM.
- `dist/`: Build output.
- `test/`: Test cases.
- `migrations/`: Drizzle migrations.

## Development

Start by creating a new `.env` file and setting the correct environment variables.

```bash
cp .env.example .env.development
```

```dotenv
# Node environment: development, production, or test
NODE_ENV=development

# Server host
HOST=127.0.0.1

# Server port
PORT=3000

# Log level (optional): info, error, debug, fatal, warn, trace, child
LOG_LEVEL=info

# Database configuration

DATABASE_URL=postgresql://localhost:5432/db

# For in-memory database:
DATABASE_RUN_IN_MEMORY=true

# Database operations
DATABASE_RUN_SEED=true
DATABASE_RUN_MIGRATE=true

# JWT configuration
JWT_SECRET=your_jwt_secret_key
# JWT_CACHE=false
# JWT_CACHE_TTL=60000

# OpenAPI configuration
OPENAPI_ENABLED=true
OPENAPI_UI=true
```

```bash
$ npm run dev
```

## Issues

:bug: If you found an issue we encourage you to report it on [github](https://github.com/tinchoz49/typebox-env/issues). Please specify your OS and the actions to reproduce it.

## License

MIT © 2024 Martin Acosta
