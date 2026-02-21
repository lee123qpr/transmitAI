Write-Host "Starting Stripe Webhook Listener..." -ForegroundColor Green
Write-Host "Forwarding to: localhost:3000/api/webhooks/stripe" -ForegroundColor Gray
Write-Host "Use Ctrl+C to stop" -ForegroundColor Yellow
.\stripe.exe listen --forward-to localhost:3000/api/webhooks/stripe
