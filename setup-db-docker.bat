@echo off
echo Setting up Hockey Assistant Database with Docker...

REM Start PostgreSQL container
docker-compose up -d

REM Wait a moment for the database to start
timeout /t 5 /nobreak >nul

REM Run the setup script
docker exec -i hockey_analytics_db psql -U postgres -d hockey_analytics < setup-database.sql

echo Database setup complete!
echo PostgreSQL is running on localhost:5432
echo You can now start the application with: npm run dev
pause
