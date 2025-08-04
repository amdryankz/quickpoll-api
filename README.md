# QuickPoll API: A Scalable Polling System with Role-Based Authentication

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white&style=flat-square)](https://www.typescriptlang.org/)
[![Hono.js](https://img.shields.io/badge/Hono.js-E44B23?logo=hono&logoColor=white&style=flat-square)](https://hono.dev/)
[![Bun](https://img.shields.io/badge/Bun-FBF0DF?logo=bun&logoColor=black&style=flat-square)](https://bun.sh/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white&style=flat-square)](https://www.postgresql.org/)
[![DrizzleORM](https://img.shields.io/badge/Drizzle%20ORM-403B38?logo=drizzle&logoColor=white&style=flat-square)](https://drizzle.team/)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-6BA539?logo=openapi&logoColor=white&style=flat-square)](https://swagger.io/specification/)

---

## 🌟 Project Overview

The **QuickPoll API** is a high-performance, type-safe backend service for creating and managing polls with integrated user authentication and role-based authorization. Built with modern JavaScript technologies, it's designed for speed and scalability, making it ideal for edge deployments.

This project serves as a comprehensive demonstration of a robust backend architecture, covering essential functionalities from user management to complex data interactions and secure API design.

## ✨ Features

* **User Authentication:** Secure user registration and login using JWT (JSON Web Tokens).
* **Role-Based Authorization (RBAC):** Differentiates between `admin` and `user` roles, controlling access to specific endpoints.
    * **Admin:** Can create, update, delete, and manage the active status of polls.
    * **User:** Can view active polls and submit votes.
* **Poll Management:** CRUD (Create, Read, Update, Delete) operations for polls and their options.
* **Voting System:** Users can vote on polls (one vote per user per poll enforced).
* **Type Safety:** End-to-end type safety enforced with TypeScript and Zod for validation.
* **Data Persistence:** Uses PostgreSQL as the relational database, managed efficiently with Drizzle ORM.
* **High Performance:** Powered by Bun runtime and Hono.js framework, optimized for speed and low latency.
* **API Documentation:** Comprehensive and interactive API documentation generated with OpenAPI (Swagger UI).
* **Structured Logging:** Utilizes Pino for production-ready, structured logging.
* **Robust Error Handling:** Centralized error handling with `HTTPException` for consistent responses.
* **Security Measures:** Includes Rate Limiting to prevent abuse and CORS for secure cross-origin communication.
* **Automated Testing:** Integration tests using Vitest and Supertest ensure API reliability.

## 🚀 Technologies Used

* **Runtime & Package Manager:** [Bun](https://bun.sh/)
* **Web Framework:** [Hono.js](https://hono.dev/)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Database:** [PostgreSQL](https://www.postgresql.org/)
* **ORM:** [Drizzle ORM](https://drizzle.team/) & [Drizzle Kit](https://orm.drizzle.team/kit/overview)
* **Validation:** [Zod](https://zod.dev/)
* **Authentication:** [JWT (JSON Web Tokens)](https://jwt.io/) via `hono/jwt`
* **API Documentation:** [OpenAPI](https://swagger.io/specification/) via `@hono/zod-openapi` & [Swagger UI](https://swagger.io/tools/swagger-ui/) via `hono-swagger-ui`
* **Logging:** [Pino](https://getpino.io/) & [Pino-Pretty](https://github.com/pinojs/pino-pretty)
* **Testing:** [Vitest](https://vitest.dev/) & [Supertest](https://github.com/visionmedia/supertest)
* **Environment Variables:** [Dotenv](https://github.com/motdotla/dotenv)
* **Security:**
    * [Hono Rate Limiter](https://github.com/jirikuncar/hono-rate-limiter)
    * [hono/cors](https://hono.dev/docs/middleware/builtin/cors)

## 🛠️ Getting Started

Follow these steps to get a local copy of the QuickPoll API up and running.

### Prerequisites

* **Bun:** Ensure Bun is installed on your system.
    ```bash
    curl -fsSL [https://bun.sh/install](https://bun.sh/install) | bash
    ```
* **PostgreSQL:** You need a running PostgreSQL instance.
    * **Docker (Recommended for local dev):**
        ```bash
        docker run --name quickpoll-postgres -e POSTGRES_USER=quickpoll_user -e POSTGRES_PASSWORD=mysecretpassword -e POSTGRES_DB=quickpoll_dev_db -p 5432:5432 -d postgres:16
        # For testing:
        # docker run --name quickpoll-test-postgres -e POSTGRES_USER=quickpoll_user -e POSTGRES_PASSWORD=mysecretpassword -e POSTGRES_DB=quickpoll_test_db -p 5433:5432 -d postgres:16
        ```
        *(Note: If using two Docker containers, adjust `DATABASE_URL` ports accordingly for dev and test. Otherwise, you'll temporarily change the database name in the `DATABASE_URL` variable for testing.)*

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/YOUR_GITHUB_USERNAME/quickpoll-api.git](https://github.com/YOUR_GITHUB_USERNAME/quickpoll-api.git)
    cd quickpoll-api
    ```

2.  **Install dependencies:**
    Bun will install all required packages.
    ```bash
    bun install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the root of the project by copying `env.example` and filling in your database credentials and a strong JWT secret.
    ```bash
    cp .env.example .env
    ```
    Open `.env` and fill it out:
    ```env
    # .env
    DATABASE_URL="postgresql://quickpoll_user:mysecretpassword@localhost:5432/quickpoll_dev_db"
    JWT_SECRET="YOUR_VERY_STRONG_RANDOM_SECRET_KEY_HERE" # Use a long, random string!
    PORT=3000 # Default port for the API
    ```
    **Important:** `.env` is in `.gitignore` and should **never** be committed to your repository.

### Database Setup & Migrations

1.  **Generate and apply database migrations:**
    Ensure your PostgreSQL database (e.g., `quickpoll_dev_db`) is running and accessible via the `DATABASE_URL` in your `.env` file.
    ```bash
    # Generate the initial migration based on your schema.ts
    bun run db:generate --name initial_schema

    # Apply the pending migrations to your database
    bun run db:migrate
    ```
2.  **(Optional) Drizzle Studio:**
    You can inspect your database schema and data using Drizzle Studio:
    ```bash
    bun run db:studio
    ```

### Running the API

To start the API in development mode with hot-reloading:

```bash
bun run dev