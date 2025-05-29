# SolidStart

Everything you need to build a Solid project, powered by [`solid-start`](https://start.solidjs.com);

## Creating a project

```bash
# create a new project in the current directory
npm init solid@latest

# create a new project in my-app
npm init solid@latest my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

Solid apps are built with _presets_, which optimise your project for deployment to different environments.

By default, `npm run build` will generate a Node app that you can run with `npm start`. To use a different preset, add it to the `devDependencies` in `package.json` and specify in your `app.config.js`.

## Environment Configuration

The application uses environment variables for configuration with the following priority:

1. `.env.local` (highest priority, ignored by git)
2. `.env` (tracked in git, contains defaults)

### Setup

1. The `.env` file contains default values and is tracked in git
2. Create `.env.local` to override any values for your local development
3. Docker Compose will use the values from your environment files

### Available Variables

```bash
# Database Configuration
POSTGRES_DB=
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# pgAdmin Configuration
PGADMIN_DEFAULT_EMAIL=
PGADMIN_DEFAULT_PASSWORD=

# Application Configuration
DATABASE_URL=
schema=public
```

## Quick Start

1. **Start the database:**
   ```bash
   docker-compose up -d
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run database migrations:**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## Features

- Admin authentication and dashboard
- Test creation and management
- One-time test links with expiration
- Timed test-taking experience
- Results tracking and analytics
- Responsive design with Tailwind CSS
