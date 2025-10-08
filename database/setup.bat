@echo off
REM Database Setup Script for Project Management Application (Windows)
REM This script creates the database and applies the schema

setlocal enabledelayedexpansion

REM Configuration
if not defined DB_NAME set DB_NAME=project_manager
if not defined DB_USER set DB_USER=postgres
if not defined DB_HOST set DB_HOST=localhost
if not defined DB_PORT set DB_PORT=5432

echo ==========================================
echo Project Management Database Setup
echo ==========================================
echo.

REM Check if PostgreSQL is installed
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: PostgreSQL is not installed or not in PATH
    exit /b 1
)

REM Check if database exists
psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -lqt | findstr /C:"%DB_NAME%" >nul
if %ERRORLEVEL% NEQ 0 (
    echo Database '%DB_NAME%' does not exist. Creating...
    createdb -U %DB_USER% -h %DB_HOST% -p %DB_PORT% %DB_NAME%
    if %ERRORLEVEL% EQU 0 (
        echo Database created successfully!
    ) else (
        echo Error creating database
        exit /b 1
    )
) else (
    echo Database '%DB_NAME%' already exists.
    set /p RECREATE="Do you want to drop and recreate it? (y/N): "
    if /i "!RECREATE!"=="y" (
        echo Dropping existing database...
        dropdb -U %DB_USER% -h %DB_HOST% -p %DB_PORT% %DB_NAME%
        createdb -U %DB_USER% -h %DB_HOST% -p %DB_PORT% %DB_NAME%
        echo Database recreated successfully!
    ) else (
        echo Keeping existing database. Schema will be updated.
    )
)

echo.
echo ==========================================
echo Installing Schema
echo ==========================================
echo.

REM Get script directory
set SCRIPT_DIR=%~dp0

REM Use complete schema file
if exist "%SCRIPT_DIR%schema.sql" (
    echo Installing complete schema...
    psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -f "%SCRIPT_DIR%schema.sql"
    if %ERRORLEVEL% EQU 0 (
        echo Schema installed successfully!
    ) else (
        echo Error installing schema
        exit /b 1
    )
) else (
    REM Run individual migrations
    if exist "%SCRIPT_DIR%migrations\" (
        echo Running individual migrations...
        for %%f in ("%SCRIPT_DIR%migrations\*.sql") do (
            echo Running %%~nxf...
            psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -f "%%f"
        )
        echo All migrations completed!
    ) else (
        echo Error: Neither schema.sql nor migrations directory found
        exit /b 1
    )
)

echo.
echo ==========================================
echo Verifying Installation
echo ==========================================
echo.

REM Count tables
for /f %%i in ('psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"') do set TABLE_COUNT=%%i
echo Tables created: %TABLE_COUNT%

echo.
echo Tables in database:
psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -c "\dt"

echo.
echo ==========================================
echo Setup Complete!
echo ==========================================
echo.
echo Database Name: %DB_NAME%
echo Host: %DB_HOST%
echo Port: %DB_PORT%
echo User: %DB_USER%
echo.
echo Connection string:
echo postgresql://%DB_USER%@%DB_HOST%:%DB_PORT%/%DB_NAME%
echo.
echo To connect to the database:
echo psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME%
echo.

endlocal
