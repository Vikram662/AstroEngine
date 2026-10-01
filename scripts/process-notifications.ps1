<#
.SYNOPSIS
  Notification worker tick: sends queued notifications (with retries), re-checks running PDF
  reports and raises error-spike alerts. Run it every minute.

.EXAMPLE
  .\scripts\process-notifications.ps1 -BaseUrl https://app.example.com
  schtasks /Create /SC MINUTE /MO 1 /TN AstroEngineNotifications /TR "powershell -File C:\xampp\htdocs\MRP_Bot\AstroEngine\scripts\process-notifications.ps1 -BaseUrl https://app.example.com"

  Needs ASTRO_INTERNAL_SECRET in the environment (or frontend\.env). The app also delivers new
  notifications immediately; this is the retry / safety net.
#>
param([string]$BaseUrl = "http://localhost:3000")

$ErrorActionPreference = "Stop"
$secret = $env:ASTRO_INTERNAL_SECRET
if (-not $secret) {
  $envFile = Join-Path $PSScriptRoot "..\frontend\.env"
  if (Test-Path $envFile) {
    $line = Select-String -Path $envFile -Pattern '^\s*ASTRO_INTERNAL_SECRET\s*=\s*"?([^"\r\n]+)"?' | Select-Object -First 1
    if ($line) { $secret = $line.Matches[0].Groups[1].Value }
  }
}
if (-not $secret) { throw "ASTRO_INTERNAL_SECRET is not set." }

Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/internal/notifications/process" -Headers @{ "x-internal-secret" = $secret } | ConvertTo-Json -Depth 5
