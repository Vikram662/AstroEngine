<#
.SYNOPSIS
  Backs up the MySQL database and the PDF jobs SQLite database (and optionally generated PDFs).

.EXAMPLE
  .\scripts\backup.ps1 -OutDir D:\backups\astroengine -KeepDays 14
  Schedule daily with Task Scheduler:
  schtasks /Create /SC DAILY /ST 02:30 /TN AstroEngineBackup /TR "powershell -File C:\xampp\htdocs\MRP_Bot\AstroEngine\scripts\backup.ps1 -OutDir D:\backups\astroengine"

  Credentials are read from frontend\.env (DATABASE_URL=mysql://user:pass@host:3306/dbname);
  they are never printed. Copy the output folder off the machine (cloud storage / another disk).
#>
param(
  [string]$OutDir = (Join-Path $PSScriptRoot "..\backups"),
  [int]$KeepDays = 14,
  [string]$MysqlDump = "C:\xampp\mysql\bin\mysqldump.exe",
  [string]$Python = "python",
  [switch]$IncludePdfFiles
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$target = Join-Path $OutDir $stamp
New-Item -ItemType Directory -Force -Path $target | Out-Null

# --- MySQL ------------------------------------------------------------------
$envFile = Join-Path $root "frontend\.env"
$dbUrl = $env:DATABASE_URL
if (-not $dbUrl -and (Test-Path $envFile)) {
  $line = Select-String -Path $envFile -Pattern '^\s*DATABASE_URL\s*=\s*"?([^"\r\n]+)"?' | Select-Object -First 1
  if ($line) { $dbUrl = $line.Matches[0].Groups[1].Value }
}
if (-not $dbUrl) { throw "DATABASE_URL not found (set it in frontend\.env or the environment)." }

$u = [System.Uri]($dbUrl -replace '^mysql://', 'http://')
$userInfo = $u.UserInfo.Split(':', 2)
$dbUser = [System.Uri]::UnescapeDataString($userInfo[0])
$dbPass = if ($userInfo.Count -gt 1) { [System.Uri]::UnescapeDataString($userInfo[1]) } else { "" }
$dbName = $u.AbsolutePath.TrimStart('/')
$dbPort = if ($u.Port -gt 0) { $u.Port } else { 3306 }

# Pass the password through the environment so it does not appear in the process list.
$env:MYSQL_PWD = $dbPass
try {
  $sqlFile = Join-Path $target "$dbName.sql"
  & $MysqlDump --host=$($u.Host) --port=$dbPort --user=$dbUser --single-transaction --routines --triggers --result-file=$sqlFile $dbName
  if ($LASTEXITCODE -ne 0) { throw "mysqldump failed (exit $LASTEXITCODE)" }
  Compress-Archive -Path $sqlFile -DestinationPath "$sqlFile.zip" -Force
  Remove-Item $sqlFile
} finally {
  Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
}

# --- SQLite (PDF job store): online-safe copy via the sqlite3 backup API -----
$sqlite = Join-Path $root "backend\storage\pdf_jobs.db"
if (Test-Path $sqlite) {
  $dest = Join-Path $target "pdf_jobs.db"
  & $Python -c "import sqlite3,sys; s=sqlite3.connect(sys.argv[1]); d=sqlite3.connect(sys.argv[2]); s.backup(d); d.close(); s.close()" $sqlite $dest
  if ($LASTEXITCODE -ne 0) { throw "SQLite backup failed" }
}

# --- Optional: generated PDF files -------------------------------------------
if ($IncludePdfFiles) {
  $pdfDir = Join-Path $root "backend\storage"
  if (Test-Path $pdfDir) { Compress-Archive -Path (Join-Path $pdfDir "*") -DestinationPath (Join-Path $target "pdf_files.zip") -Force }
}

# --- Retention -----------------------------------------------------------------
Get-ChildItem -Path $OutDir -Directory | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$KeepDays) } | Remove-Item -Recurse -Force

Write-Host "Backup written to $target"
