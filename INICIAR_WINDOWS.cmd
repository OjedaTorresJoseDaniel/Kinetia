@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instala Node.js 24 LTS y vuelve a abrir este archivo.
  pause
  exit /b 1
)
if not exist node_modules (
  call npm.cmd ci
  if errorlevel 1 (
    echo No se pudo instalar. Revisa el mensaje anterior.
    pause
    exit /b 1
  )
)
echo Abre http://localhost:5173 en tu navegador.
call npm.cmd run dev
pause
