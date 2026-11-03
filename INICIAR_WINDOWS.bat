@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20 ou superior nao encontrado.
  echo Instale Node.js e execute este arquivo novamente.
  pause
  exit /b 1
)
start "ECOS DO ABISMO - Servidor" cmd /k "npm start"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8080/"
exit /b 0
