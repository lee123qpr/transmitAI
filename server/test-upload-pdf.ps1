$filePath = "valid_test.pdf"
$url = "http://localhost:3000/api/upload"

$fileBytes = [System.IO.File]::ReadAllBytes($filePath)
$fileEnc = [System.Text.Encoding]::GetEncoding('ISO-8859-1').GetString($fileBytes)
$boundary = "---------------------------" + [System.Guid]::NewGuid().ToString().Replace("-", "")
$LF = "`r`n"

$bodyLines = (
    "--$boundary",
    "Content-Disposition: form-data; name=`"file`"; filename=`"test_doc.pdf`"",
    "Content-Type: application/pdf",
    "",
    $fileEnc,
    "",
    "--$boundary--"
) -join $LF

$body = "--$boundary$LF" +
"Content-Disposition: form-data; name=`"file`"; filename=`"test_doc.pdf`"$LF" +
"Content-Type: application/pdf$LF$LF" +
$fileEnc + "$LF" +
"--$boundary--$LF"

# Use HttpClient for binary reliability
Add-Type -AssemblyName System.Net.Http
$client = New-Object System.Net.Http.HttpClient
$content = New-Object System.Net.Http.MultipartFormDataContent
$fileStream = [System.IO.File]::OpenRead($filePath)
$fileContent = New-Object System.Net.Http.StreamContent($fileStream)
$fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("application/pdf")
$content.Add($fileContent, "file", "test_doc.pdf")

$response = $client.PostAsync($url, $content).Result
$responseBody = $response.Content.ReadAsStringAsync().Result

Write-Host "Status Code: " $response.StatusCode
Write-Host "Response: " $responseBody

$fileStream.Close()
