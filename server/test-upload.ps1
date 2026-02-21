$filePath = "test_upload.txt"
$url = "http://localhost:3000/api/upload"

$fileBytes = [System.IO.File]::ReadAllBytes($filePath)
$fileEnc = [System.Text.Encoding]::GetEncoding('UTF-8').GetString($fileBytes)
$boundary = "---------------------------" + [System.Guid]::NewGuid().ToString().Replace("-", "")
$LF = "`r`n"

$bodyLines = (
    "--$boundary",
    "Content-Disposition: form-data; name=`"file`"; filename=`"test_upload.txt`"",
    "Content-Type: text/plain",
    "",
    $fileEnc,
    "--$boundary--"
) -join $LF

Invoke-RestMethod -Uri $url -Method Post -ContentType "multipart/form-data; boundary=$boundary" -Body $bodyLines
