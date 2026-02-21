$env:VITE_E2E = "true"

# Cleanup processes
Write-Host "Cleaning up old processes..."
taskkill /F /IM node.exe /T 2>$null
Start-Sleep -Seconds 2

Write-Host "Starting API..."
$job1 = Start-Job -ScriptBlock { $env:E2E_TEST = "true"; Set-Location "c:\Users\Lee Kilcoyne\OneDrive\Desktop\Transmittal\server"; npm run dev > api_out.txt 2>&1 }
Write-Host "Waiting for API (port 3000)..."
$apiReady = $false
for ($i = 0; $i -lt 30; $i++) {
    $conn = Test-NetConnection localhost -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($conn) { $apiReady = $true; break }
    Start-Sleep -Seconds 1
}

Write-Host "Starting E2E Frontend..."
$job2 = Start-Job -ScriptBlock { $env:VITE_E2E = "true"; Set-Location "c:\Users\Lee Kilcoyne\OneDrive\Desktop\Transmittal\client"; npm run test:e2e }
Write-Host "Waiting for Frontend (port 5174)..."
$clientReady = $false
for ($i = 0; $i -lt 30; $i++) {
    $conn = Test-NetConnection localhost -Port 5174 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($conn) { $clientReady = $true; break }
    Start-Sleep -Seconds 1
}

if (!$clientReady) {
    Write-Host "Client never started!"
    taskkill /F /IM node.exe /T 2>$null
    Start-Sleep -Seconds 1
    exit 1
}

Write-Host "Clearing stale test data..."
Set-Location "c:\Users\Lee Kilcoyne\OneDrive\Desktop\Transmittal\server"
npx ts-node clear_test_data.ts

Write-Host "Both servers ready, running Playwright..."
Set-Location "c:\Users\Lee Kilcoyne\OneDrive\Desktop\Transmittal\client"
npx playwright test | Out-File e2e_out.txt -Encoding utf8
$testExit = $LASTEXITCODE

Write-Host "Cleaning up processes..."
Stop-Job $job1
Stop-Job $job2
taskkill /F /IM node.exe /T 2>$null
exit $testExit
