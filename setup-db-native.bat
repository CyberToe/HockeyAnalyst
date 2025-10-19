@echo off
echo Setting up Hockey Analytics Database...

REM Create database (you'll be prompted for password)
createdb -U postgres hockey_analytics

REM Run the setup script
psql -U postgres -d hockey_analytics -f setup-database.sql

echo Database setup complete!
echo You can now start the application with: npm run dev
pause
