# Relationship Manager PWA - Setup & Run Automation Script
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Relationship Manager PWA - Initial Setup " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is not installed or not in PATH. Please install Node.js (v18+) to continue."
    exit 1
}

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "Please update .env with your actual Supabase URL and anon key." -ForegroundColor Yellow
} else {
    Write-Host "Found existing .env file." -ForegroundColor Green
}

# Install dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Cyan
npm install

# Generate icons
Write-Host "`nGenerating PWA icons..." -ForegroundColor Cyan
node scripts/generate-icons.js

# Build check
Write-Host "`nTesting build..." -ForegroundColor Cyan
npm run build

Write-Host "`nSetup complete! You can now run the app with:" -ForegroundColor Green
Write-Host "  npm run dev" -ForegroundColor Yellow
