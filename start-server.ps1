$port = 3000
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$publicDir = Join-Path $root 'public'
$listener = [System.Net.HttpListener]::new()
$prefix = "http://localhost:$port/"
$listener.Prefixes.Add($prefix)
$listener.Start()

Write-Host "Serving $publicDir at $prefix"

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $requestedPath = $context.Request.Url.AbsolutePath
        $path = $requestedPath.TrimStart('/')

        if ([string]::IsNullOrWhiteSpace($path)) {
            $path = 'index.html'
        }

        $fullPath = Join-Path $publicDir $path

        if (-not [System.IO.Path]::IsPathRooted($fullPath)) {
            $fullPath = Join-Path $publicDir $path
        }

        if ([System.IO.File]::Exists($fullPath)) {
            $content = [System.IO.File]::ReadAllBytes($fullPath)
            $extension = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()
            $mimeMap = @{
                '.html' = 'text/html; charset=utf-8'
                '.css'  = 'text/css; charset=utf-8'
                '.js'   = 'application/javascript; charset=utf-8'
                '.json' = 'application/json; charset=utf-8'
                '.svg'  = 'image/svg+xml'
            }
            $mime = if ($mimeMap.ContainsKey($extension)) { $mimeMap[$extension] } else { 'application/octet-stream' }
            $context.Response.ContentType = $mime
            $context.Response.ContentLength64 = $content.Length
            $output = $context.Response.OutputStream
            $output.Write($content, 0, $content.Length)
            $output.Close()
        }
        else {
            $response = [System.Text.Encoding]::UTF8.GetBytes('Not Found')
            $context.Response.StatusCode = 404
            $context.Response.ContentType = 'text/plain; charset=utf-8'
            $context.Response.ContentLength64 = $response.Length
            $output = $context.Response.OutputStream
            $output.Write($response, 0, $response.Length)
            $output.Close()
        }
    }
    catch {
        break
    }
}

$listener.Stop()
$listener.Close()
