
# 1. NUCLEAR CLEANUP
Write-Host "🛑 STOPPING ALL NODE PROCESSES..." -ForegroundColor Yellow
taskkill /F /IM node.exe /T 2>$null
# Also kill by port just in case (e.g., if running as another process name)
$ports = @(3000, 5173, 5174)
foreach ($port in $ports) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($process) {
        taskkill /F /PID $process.OwningProcess 2>$null
    }
}
Start-Sleep -Seconds 2

# 2. START SERVER (Port 3000)
Write-Host "🚀 STARTING SERVER (Port 3000)..." -ForegroundColor Green
$serverProcess = Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory ".\server" -PassThru -NoNewWindow
# Wait for server to likely be ready
Start-Sleep -Seconds 3

# 3. START CLIENT (Port 5173)
Write-Host "🚀 STARTING CLIENT (Port 5173)..." -ForegroundColor Cyan
$clientProcess = Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory ".\client" -PassThru -NoNewWindow

Write-Host "✅ SYSTEM RESTARTED" -ForegroundColor Green
Write-Host "   - API:    http://localhost:3000"
Write-Host "   - App:    http://localhost:5173"
Write-Host "   (If App fails to load, refresh the page)"
