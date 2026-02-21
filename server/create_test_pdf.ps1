
$pdfContent = "%PDF-1.4`n1 0 obj`n<<`n/Type /Catalog`n/Pages 2 0 R`n>>`nendobj`n2 0 obj`n<<`n/Type /Pages`n/Kids [3 0 R]`n/Count 1`n>>`nendobj`n3 0 obj`n<<`n/Type /Page`n/Parent 2 0 R`n/MediaBox [0 0 612 792]`n/Resources <<`n/Font <<`n/F1 <<`n/Type /Font`n/Subtype /Type1`n/BaseFont /Helvetica`n>>`n>>`n>>`n/Contents 4 0 R`n>>`nendobj`n4 0 obj`n<<`n/Length 44`n>>`nstream`nBT`n/F1 24 Tf`n100 700 Td`n(Hello World) Tj`nET`nendstream`nendobj`nxref`n0 5`n0000000000 65535 f `n0000000010 00000 n `n0000000060 00000 n `n0000000117 00000 n `n0000000280 00000 n `ntrailer`n<<`n/Size 5`n/Root 1 0 R`n>>`nstartxref`n375`n%%EOF"

$pdfBytes = [System.Text.Encoding]::ASCII.GetBytes($pdfContent)
[System.IO.File]::WriteAllBytes("$PWD/test_gen.pdf", $pdfBytes)

$uri = "http://localhost:3000/api/upload"
$filePath = "$PWD/test_gen.pdf"

$boundary = "---------------------------" + [System.DateTime]::Now.Ticks.ToString("x")
$LF = "`r`n"

$fileBytes = [System.IO.File]::ReadAllBytes($filePath)
$fileHeader = "--$boundary$LF" +
"Content-Disposition: form-data; name=`"file`"; filename=`"test_gen.pdf`"$LF" +
"Content-Type: application/pdf$LF$LF"

$fileFooter = "$LF--$boundary--$LF"

$userIdParams = "--$boundary$LF" + 
"Content-Disposition: form-data; name=`"userId`"$LF$LF" + 
"test-user-123$LF"

$bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($fileHeader) + $fileBytes + [System.Text.Encoding]::UTF8.GetBytes($fileFooter)
# Add userId if needed, but simple test first. Ideally multipart form construction is cleaner but this is quick manual.
# Actually let's use a simpler curl if available or just invoke-restmethod with form file if older powershell supports it well, or manual construction.

# Re-doing with correct multipart construction for Invoke-RestMethod (PS 6+) or using curl
# Since user is on Windows, let's try just standard curl if available (it often is alias to IRM, but checks).
# Let's rely on the existing curl command in background or just use a simple node script? 
# Node is safer.

Write-Host "Creating node test script..."
