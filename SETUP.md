# Hockey-Assistant Application - Setup Guide

This guide will help you set up the Hockey-Assistant application on your local machine.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (version 18 or higher)
- **PostgreSQL** (version 12 or higher)
- **npm** or **yarn** package manager

## Quick Start

### 1. Install Dependencies

```bash
# Install all dependencies for both frontend and backend
npm run install:all
```

### 2. Database Setup

#### Option A: Using the provided SQL script
```bash
# Create the database
createdb hockey_analytics

# Run the setup script
psql hockey_analytics < setup-database.sql
```

#### Option B: Using the original HT.sql file
```bash
# Create the database
createdb hockey_analytics

# Run the original schema
psql hockey_analytics < HT.sql
```

### 3. Environment Configuration

#### Backend Environment
Copy the example environment file and configure it:

```bash
cd backend
cp env.example .env
```

Edit `backend/.env` with your database credentials:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/hockey_analytics"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development

# CORS
FRONTEND_URL="http://localhost:5173"
```

#### Frontend Environment (Optional)
Create `frontend/.env.local` if you need to customize the API URL:

```env
VITE_API_URL=http://localhost:3001/api
```

### 4. Generate Prisma Client

```bash
cd backend
npm run db:generate
```

### 5. Start the Application

```bash
# Start both frontend and backend in development mode
npm run dev
```

This will start:
- Backend API server on http://localhost:3001
- Frontend development server on http://localhost:5173

## Detailed Setup Instructions

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - Copy `env.example` to `.env`
   - Update database connection string
   - Set a secure JWT secret

4. **Generate Prisma client:**
   ```bash
   npm run db:generate
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

### Database Setup

#### Manual Database Creation

1. **Connect to PostgreSQL:**
   ```bash
   psql -U postgres
   ```

2. **Create database:**
   ```sql
   CREATE DATABASE hockey_analytics;
   ```

3. **Connect to the new database:**
   ```sql
   \c hockey_analytics;
   ```

4. **Run the schema:**
   ```sql
   \i setup-database.sql
   ```

#### Using the Original Schema

If you prefer to use the original `HT.sql` file:

```bash
psql hockey_analytics < HT.sql
```

## Verification

### 1. Check Backend Health
Visit http://localhost:3001/health - you should see:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Check Frontend
Visit http://localhost:5173 - you should see the login page.

### 3. Create Test Account
1. Click "Create a new account" on the login page
2. Fill in the registration form
3. You should be redirected to the dashboard

### 4. Create Test Team
1. Click "Create Team" on the dashboard
2. Fill in team details
3. You should see your new team in the dashboard

## Troubleshooting

### Common Issues

#### Database Connection Errors
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure the database exists
- Verify the user has proper permissions

#### Port Already in Use
- Backend (3001): Change `PORT` in `backend/.env`
- Frontend (5173): The dev server will automatically use the next available port

#### Prisma Errors
- Run `npm run db:generate` in the backend directory
- Check that `DATABASE_URL` is correctly set
- Ensure the database schema has been applied

#### Build Errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version (requires 18+)
- Verify all dependencies are installed

### Logs and Debugging

#### Backend Logs
Backend logs are displayed in the terminal where you ran `npm run dev`.

#### Frontend Logs
Frontend logs are displayed in the browser console and the terminal.

#### Database Logs
Check PostgreSQL logs for database-related issues.

## Production Deployment

### Backend Deployment

1. **Build the application:**
   ```bash
   cd backend
   npm run build
   ```

2. **Set production environment variables:**
   - Use a secure JWT secret
   - Set `NODE_ENV=production`
   - Configure production database URL

3. **Start the application:**
   ```bash
   npm start
   ```

### Frontend Deployment

1. **Build the application:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy the `dist` folder to your hosting provider**

### Database Production Setup

1. **Create production database**
2. **Run schema setup**
3. **Configure connection pooling**
4. **Set up regular backups**

## Features Overview

### Implemented Features
- ✅ User authentication (register/login)
- ✅ Team creation and management
- ✅ Team joining with share codes
- ✅ Player management
- ✅ Game creation and management
- ✅ Basic analytics dashboard
- ✅ Responsive UI design

### Coming Soon
- 🔄 Interactive rink interface for shot tracking
- 🔄 Real-time shot recording
- 🔄 Advanced analytics and visualizations
- 🔄 Shot location heat maps
- 🔄 Player performance trends
- 🔄 Game statistics export

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user

### Team Endpoints
- `GET /api/teams` - Get user's teams
- `POST /api/teams` - Create new team
- `POST /api/teams/join` - Join team by code
- `GET /api/teams/:id` - Get team details
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

### Player Endpoints
- `GET /api/players/teams/:teamId` - Get team players
- `POST /api/players/teams/:teamId` - Add player
- `PUT /api/players/:id` - Update player
- `DELETE /api/players/:id` - Delete player
- `GET /api/players/:id/stats` - Get player statistics

### Game Endpoints
- `GET /api/games/teams/:teamId` - Get team games
- `POST /api/games/teams/:teamId` - Create game
- `GET /api/games/:id` - Get game details
- `PUT /api/games/:id` - Update game
- `PUT /api/games/:id/periods/:periodNumber` - Update period
- `DELETE /api/games/:id` - Delete game

### Shot Endpoints
- `GET /api/shots/games/:gameId` - Get game shots
- `POST /api/shots/games/:gameId` - Record shot
- `PUT /api/shots/:id` - Update shot
- `DELETE /api/shots/:id` - Delete shot
- `GET /api/shots/:id` - Get shot details

### Analytics Endpoints
- `GET /api/analytics/teams/:teamId` - Get team analytics
- `GET /api/analytics/players/:playerId` - Get player analytics
- `GET /api/analytics/games/:gameId` - Get game analytics

## Support

If you encounter any issues during setup or have questions about the application, please refer to the troubleshooting section above or check the application logs for error details.
