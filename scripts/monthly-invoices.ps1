<#
.SYNOPSIS
  Month-end billing run: issues one consolidated GST usage invoice per customer for last month
  (per-call overage + report charges) and any purchase invoices that are still missing.

.EXAMPLE
  .\scripts\monthly-invoices.ps1 -BaseUrl https://app.example.com
  .\scripts\monthly-invoices.ps1 -BaseUrl https://app.example.com -Month 2026-03

  Schedule it for the 1st of every month (Task Scheduler), e.g.
  schtasks /Create /SC MONTHLY /D 1 /ST 01:30 /TN AstroEngineInvoices /TR "powershell -File C:\xampp\htdocs\MRP_Bot\AstroEngine\scripts\monthly-invoices.ps1 -BaseUrl https://app.example.com"

  Needs ASTRO_INTERNAL_SECRET in the environment (or frontend\.env). It is safe to run twice.
#>
param(
  [string]$BaseUrl = "http://localhost:3000",
  [string]$Month = ""
)

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

$body = if ($Month) { @{ month = $Month } | ConvertTo-Json } else { "{}" }
$res = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/internal/invoices/monthly" -ContentType "application/json" -Headers @{ "x-internal-secret" = $secret } -Body $body
$res | ConvertTo-Json -Depth 5
