param([int]$Port=5173)

function Start-HttpListener {
  param([int]$StartPort)
  for ($p = $StartPort; $p -lt ($StartPort + 10); $p++) {
    $l = New-Object System.Net.HttpListener
    $pre = "http://localhost:$p/"
    try {
      $l.Prefixes.Add($pre)
      $l.Start()
      Write-Host "Serving on $pre"
      return @{ Listener = $l; Prefix = $pre; Port = $p }
    } catch {
      try { $l.Close() } catch {}
      continue
    }
  }
  throw "No free port available from $StartPort"
}

$started = Start-HttpListener -StartPort $Port
$listener = $started.Listener
$prefix = $started.Prefix

$mime = @{
  ".html"="text/html; charset=utf-8"
  ".css"="text/css; charset=utf-8"
  ".js"="application/javascript; charset=utf-8"
  ".json"="application/json; charset=utf-8"
  ".svg"="image/svg+xml"
  ".png"="image/png"
  ".jpg"="image/jpeg"
  ".jpeg"="image/jpeg"
  ".ico"="image/x-icon"
  ".webmanifest"="application/manifest+json"
  ".manifest"="application/manifest+json"
}

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response

    $path = $req.Url.AbsolutePath.TrimStart('/')
    if ([string]::IsNullOrEmpty($path)) { $path = 'index.html' }

    $full = Join-Path -Path $PSScriptRoot -ChildPath $path

    if (Test-Path $full -PathType Leaf) {
      try {
        $bytes = [System.IO.File]::ReadAllBytes($full)
        $ext = [System.IO.Path]::GetExtension($full).ToLower()
        $ctype = $mime[$ext]
        if (-not $ctype) { $ctype = 'application/octet-stream' }
        $res.ContentType = $ctype
        $res.Headers.Add('Cache-Control','no-cache, no-store, must-revalidate')
        $res.Headers.Add('Pragma','no-cache')
        $res.Headers.Add('Expires','0')
        $res.OutputStream.Write($bytes,0,$bytes.Length)
      } catch {
        $res.StatusCode = 500
        $msg = [System.Text.Encoding]::UTF8.GetBytes('Server error')
        $res.OutputStream.Write($msg,0,$msg.Length)
      }
    } else {
      if ($req.HttpMethod -eq 'GET' -and $req.Headers['Accept'] -like '*text/html*') {
        $index = Join-Path -Path $PSScriptRoot -ChildPath 'index.html'
        if (Test-Path $index) {
          $bytes = [System.IO.File]::ReadAllBytes($index)
          $res.ContentType = 'text/html; charset=utf-8'
          $res.OutputStream.Write($bytes,0,$bytes.Length)
        } else {
          $res.StatusCode = 404; $msg=[System.Text.Encoding]::UTF8.GetBytes('Not Found'); $res.OutputStream.Write($msg,0,$msg.Length)
        }
      } else {
        $res.StatusCode = 404; $msg=[System.Text.Encoding]::UTF8.GetBytes('Not Found'); $res.OutputStream.Write($msg,0,$msg.Length)
      }
    }
    $res.OutputStream.Close()
  }
} finally {
  try { if ($listener.IsListening) { $listener.Stop() } } catch {}
  try { $listener.Close() } catch {}
}
