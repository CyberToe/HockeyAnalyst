# Hockey Assistant Tracking Application

A comprehensive hockey assistant tracking application that allows users to record, share, and analyze shot data during hockey games. The application supports multiple users, shared teams, and aggregated player statistics across games.

## Features

- **User Management**: Secure registration, login, and password reset
- **Team Management**: Create teams with unique share codes, join existing teams
- **Player Management**: Add/edit players with names and numbers
- **Game Tracking**: Create games with automatic 3-period structure
- **Shot Tracking**: Interactive rink interface for recording shots with coordinates
- **Analytics**: Player statistics including shooting percentage and goal tracking
- **Real-time Collaboration**: Multiple users can view and update shared team data

## Tech Stack

- **Frontend**: React 18 with TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js with Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT tokens with bcrypt password hashing

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install:all
   ```

3. Set up PostgreSQL database and run the schema:
   ```bash
   # Create database
   createdb hockey_analytics
   
   # Run the schema
   psql hockey_analytics < HT.sql
   ```

4. Configure environment variables:
   - Copy `backend/.env.example` to `backend/.env`
   - Update database connection string and JWT secret

5. Start development servers:
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Database Schema

The application uses a PostgreSQL database with the following key entities:
- Users (authentication and profile)
- Teams (with unique share codes)
- Team Members (user-team relationships with roles)
- Players (belong to teams)
- Games (belong to teams, auto-create 3 periods)
- Periods (track attacking direction)
- Shots (with coordinates, player, outcome)

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token

### Teams
- `GET /api/teams` - Get user's teams
- `POST /api/teams` - Create new team
- `POST /api/teams/join` - Join team by code
- `GET /api/teams/:id` - Get team details
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

### Players
- `GET /api/teams/:teamId/players` - Get team players
- `POST /api/teams/:teamId/players` - Add player
- `PUT /api/players/:id` - Update player
- `DELETE /api/players/:id` - Delete player

### Games
- `GET /api/teams/:teamId/games` - Get team games
- `POST /api/teams/:teamId/games` - Create game
- `GET /api/games/:id` - Get game details
- `PUT /api/games/:id` - Update game

### Shots
- `GET /api/games/:gameId/shots` - Get game shots
- `POST /api/games/:gameId/shots` - Record shot
- `PUT /api/shots/:id` - Update shot
- `DELETE /api/shots/:id` - Delete shot

### Analytics
- `GET /api/teams/:teamId/analytics` - Get team analytics
- `GET /api/players/:playerId/stats` - Get player statistics

## Development

### Backend Development
```bash
cd backend
npm run dev
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Database Migrations
The application uses the provided SQL schema. For future changes, consider using Prisma migrations.

## License

MIT License
