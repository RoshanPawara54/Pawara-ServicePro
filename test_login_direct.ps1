try {
    $body = @{username='admin';password='123'} | ConvertTo-Json
    $res = Invoke-WebRequest -Uri 'http://localhost:8080/api/auth/login' -Method POST -Body $body -ContentType 'application/json' -ErrorAction Stop
    Write-Host "Response Status Code: $($res.StatusCode)"
    Write-Host "Response Body: $($res.Content)"
} catch {
    Write-Host "Request Failed!"
    Write-Host "Exception: $_"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host "Server response: $($reader.ReadToEnd())"
    }
}
