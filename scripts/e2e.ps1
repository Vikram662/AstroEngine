<#
.SYNOPSIS
  Real end-to-end check (no mocks): temporary MariaDB + the production build of the app + the
  Python engine, then ~70 checks (sign-up, login, password reset, 2FA, API-key metering and
  refunds, reports billed to the customer, consecutive GST invoices, month-end invoice,
  notification queue, GSTR-1, access control). Everything it creates is removed afterwards.

.DESCRIPTION
  * Uses the XAMPP MariaDB *binaries* but a separate data folder in %TEMP% on port 3399: your
    own databases are never touched, and your dev servers (ports 3000 / 8000) are left alone.
  * Frontend runs on port 3010, backend on port 8010.
  * Needs: the frontend built (`npm run build`), Python with the backend requirements, Node 22.

.EXAMPLE
  .\scripts\e2e.ps1
  .\scripts\e2e.ps1 -SkipBuild     # reuse the existing production build
#>
param(
  [string]$XamppMysql = "C:\xampp\mysql\bin",
  [string]$Python = "python",
  [switch]$SkipBuild,
  [int]$DbPort = 3399, [int]$FePort = 3010, [int]$BePort = 8010
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$fe = Join-Path $root "frontend"
$be = Join-Path $root "backend"
$tmp = Join-Path $env:TEMP ("astro_e2e_" + [guid]::NewGuid().ToString("N").Substring(0, 8))
$dbPass = "e2e" + [guid]::NewGuid().ToString("N").Substring(0, 10)
$secret = "e2e-" + [guid]::NewGuid().ToString("N")
$procs = @()
$exit = 1

function Cleanup {
  foreach ($p in $script:procs) { if ($p -and -not $p.HasExited) { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue } }
  Start-Sleep -Seconds 2
  if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue }
}

try {
  foreach ($port in @($DbPort, $FePort, $BePort)) {
    if (Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue) { throw "Port $port is already in use. Choose another with -DbPort / -FePort / -BePort." }
  }
  New-Item -ItemType Directory -Path $tmp | Out-Null

  Write-Host "[1/7] Temporary MariaDB on port $DbPort ..."
  & "$XamppMysql\mysql_install_db.exe" --datadir="$tmp\data" --password=$dbPass 2>&1 | Out-Null
  $script:procs += Start-Process -FilePath "$XamppMysql\mysqld.exe" -ArgumentList "--no-defaults", "--datadir=$tmp\data", "--port=$DbPort", "--bind-address=127.0.0.1", "--basedir=$XamppMysql\..", "--character-set-server=utf8mb4", "--max_allowed_packet=64M" -PassThru -WindowStyle Hidden -RedirectStandardError "$tmp\mysql.err"
  Start-Sleep -Seconds 8
  & "$XamppMysql\mysql.exe" --host=127.0.0.1 --port=$DbPort --user=root --password=$dbPass -e "CREATE DATABASE astro_e2e CHARACTER SET utf8mb4;"
  if ($LASTEXITCODE -ne 0) { throw "Could not connect to the temporary database (see $tmp\mysql.err)." }

  $env:DATABASE_URL = "mysql://root:$dbPass@127.0.0.1:$DbPort/astro_e2e"
  # Prisma's occasional "update available" box goes to stderr, which PowerShell 5.1 turns
  # into a terminating error under ErrorActionPreference=Stop.
  $env:PRISMA_HIDE_UPDATE_MESSAGE = "1"

  Write-Host "[2/7] Schema + seed ..."
  Push-Location $fe
  npx prisma db push --skip-generate 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "prisma db push failed" }
  # `seed` creates the admin (its generated password / API key are printed once);
  # `seed:users` then adds the demo developer account.
  $seedAdmin = (npm run seed 2>&1 | Out-String)
  $seedDev = (npm run seed:users 2>&1 | Out-String)
  npm run seed:company 2>&1 | Out-Null
  if (-not $SkipBuild) {
    Write-Host "[3/7] Production build ..."
    npm run build 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "next build failed" }
  } else { Write-Host "[3/7] (build skipped)" }
  Pop-Location

  $adminPw = [regex]::Match($seedAdmin, "Password \(generated, shown once\):\s+(\S+)").Groups[1].Value
  $adminKey = [regex]::Match($seedAdmin, "Admin API key[^:]*:\s+(ak_live_\w+)").Groups[1].Value
  $devPw = [regex]::Match($seedDev, "developer@astroengine\.io\s+password:\s+(\S+)").Groups[1].Value
  $devKey = [regex]::Match($seedDev, "developer API key:\s+(ak_live_\w+)").Groups[1].Value
  if (-not ($adminPw -and $adminKey -and $devPw -and $devKey)) { throw "Could not read the seeded credentials." }

  Write-Host "[4/7] Python engine on port $BePort ..."
  $env:INTERNAL_SECRET_KEY = $secret
  $env:NEXT_APP_URL = "http://127.0.0.1:$FePort"
  $env:ENVIRONMENT = "production"
  $script:procs += Start-Process -FilePath $Python -ArgumentList "-m", "uvicorn", "app.main:app", "--port", "$BePort" -WorkingDirectory $be -PassThru -WindowStyle Hidden -RedirectStandardError "$tmp\backend.log"

  Write-Host "[5/7] Next.js (production) on port $FePort ..."
  $env:SESSION_SECRET = "e2e-session-" + [guid]::NewGuid().ToString("N")
  $env:ASTRO_INTERNAL_SECRET = $secret
  $env:ASTRO_BACKEND_URL = "http://127.0.0.1:$BePort"
  $env:ASTRO_INTERNAL_API_KEY = $adminKey
  $env:NEXT_PUBLIC_APP_URL = "http://127.0.0.1:$FePort"
  $feLog = Join-Path $tmp "frontend.log"
  $script:procs += Start-Process -FilePath "node" -ArgumentList "node_modules\next\dist\bin\next", "start", "-p", "$FePort" -WorkingDirectory $fe -PassThru -WindowStyle Hidden -RedirectStandardOutput $feLog -RedirectStandardError "$tmp\frontend.err"
  Start-Sleep -Seconds 8
  foreach ($u in @("http://127.0.0.1:$FePort/", "http://127.0.0.1:$BePort/health")) {
    try { Invoke-WebRequest -UseBasicParsing -Uri $u -TimeoutSec 30 | Out-Null } catch { throw "Server did not start: $u" }
  }

  Write-Host "[6/7] Running the checks ..."
  $env:E2E_FE = "http://127.0.0.1:$FePort"
  $env:E2E_BE = "http://127.0.0.1:$BePort"
  $env:E2E_MYSQL_BIN = "$XamppMysql\mysql.exe"
  $env:E2E_MYSQL_PORT = "$DbPort"
  $env:E2E_MYSQL_PASS = $dbPass
  $env:E2E_DB = "astro_e2e"
  $env:E2E_INTERNAL_SECRET = $secret
  $env:E2E_ADMIN_PW = $adminPw
  $env:E2E_DEV_PW = $devPw
  $env:E2E_DEV_KEY = $devKey
  # SMTP is not configured, so the app prints e-mails to its log: the checks read OTP codes from it.
  & $Python (Join-Path $PSScriptRoot "e2e\e2e.py") $feLog
  $exit = $LASTEXITCODE
  Write-Host "[7/7] Done."
}
catch {
  Write-Host "E2E setup failed: $($_.Exception.Message)" -ForegroundColor Red
  $exit = 2
}
finally {
  if ((Get-Location).Path -ne $root) { Set-Location $root }
  Cleanup
}
exit $exit
