# Force kill any node processes (Nuclear Option as requested)
Write-Host "💥 Killing ALL Node.js processes..." -ForegroundColor Yellow
taskkill /F /IM node.exe /T 2>$null

# Double check ports 3000, 5173, 5174 explicitly
$ports = @(3000, 5173, 5174)
foreach ($port in $ports) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($process) {
        $pidNum = $process.OwningProcess
        Write-Host "Killing stubborn process on port $port (PID: $pidNum)..." -ForegroundColor Red
        taskkill /F /PID $pidNum 2>$null
    }
}

# Wait a moment for ports to free up
Start-Sleep -Seconds 2

# Start Server
Write-Host "Starting Server..." -ForegroundColor Green
Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory ".\server" -RedirectStandardOutput "..\server_debug.log" -RedirectStandardError "..\server_error.log" -NoNewWindow

# Start Client
Write-Host "Starting Client..." -ForegroundColor Green
Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory ".\client" -NoNewWindow

Write-Host "✅ Dev Environment Restarted on Ports 3000 & 5173!" -ForegroundColor Cyan
