# Open Lovable - Stop All Services
# Usage: .\stop-all-services.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Open Lovable - Stopping Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$stoppedCount = 0

# Find processes using port 3002 (Next.js dev server)
Write-Host "[*] Looking for processes on port 3002..." -ForegroundColor Yellow

$connections = Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue
if ($connections) {
    $processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($procId in $processIds) {
        $process = Get-Process -Id $procId -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "[*] Stopping process: $($process.ProcessName) (PID: $procId)" -ForegroundColor Yellow
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            $stoppedCount++
        }
    }
}

# Also kill any node processes that might be running the dev server
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -match "next|turbopack" -or $_.MainWindowTitle -match "Open Lovable"
}

if ($nodeProcesses) {
    foreach ($proc in $nodeProcesses) {
        Write-Host "[*] Stopping Node.js process (PID: $($proc.Id))" -ForegroundColor Yellow
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        $stoppedCount++
    }
}

# Kill any remaining node processes associated with this project
$allNodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
foreach ($proc in $allNodeProcesses) {
    try {
        $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)").CommandLine
        if ($cmdLine -match "firecrawltest|next dev|turbopack") {
            Write-Host "[*] Stopping Node.js process (PID: $($proc.Id))" -ForegroundColor Yellow
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            $stoppedCount++
        }
    } catch {
        # Ignore errors for processes we can't inspect
    }
}

Write-Host ""
if ($stoppedCount -gt 0) {
    Write-Host "[OK] Stopped $stoppedCount process(es)" -ForegroundColor Green
} else {
    Write-Host "[OK] No running services found" -ForegroundColor Green
}
Write-Host ""
