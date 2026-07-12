Add-Type -AssemblyName System.Drawing

$publicDir = Join-Path $PSScriptRoot "../public"

# --- og-image.png (1200x630) ---
$bmp = New-Object System.Drawing.Bitmap 1200, 630
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'HighQuality'
$g.TextRenderingHint = 'AntiAliasGridFit'

$brush1 = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point 0, 0),
    (New-Object System.Drawing.Point 1200, 630),
    [System.Drawing.Color]::FromArgb(11, 17, 32),
    [System.Drawing.Color]::FromArgb(15, 37, 87)
)
$g.FillRectangle($brush1, 0, 0, 1200, 630)

$accentBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(80, 14, 165, 233))
$g.FillRectangle($accentBrush, 80, 490, 1040, 4)

$fontTitle = New-Object System.Drawing.Font("Segoe UI", 64, [System.Drawing.FontStyle]::Bold)
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = 'Center'
$g.DrawString("MAASGA", $fontTitle, [System.Drawing.Brushes]::White, (New-Object System.Drawing.RectangleF(0, 120, 1200, 100)), $sf)

$fontSub = New-Object System.Drawing.Font("Segoe UI", 28, [System.Drawing.FontStyle]::Regular)
$cyanBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(56, 189, 248))
$g.DrawString("Expert Froid & Climatisation", $fontSub, $cyanBrush, (New-Object System.Drawing.RectangleF(0, 240, 1200, 60)), $sf)

$fontSmall = New-Object System.Drawing.Font("Segoe UI", 22, [System.Drawing.FontStyle]::Regular)
$grayBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(148, 163, 184))
$g.DrawString("Vente - Installation - Maintenance", $fontSmall, $grayBrush, (New-Object System.Drawing.RectangleF(0, 320, 1200, 50)), $sf)

$fontLoc = New-Object System.Drawing.Font("Segoe UI", 20, [System.Drawing.FontStyle]::Regular)
$darkGrayBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(100, 116, 139))
$g.DrawString("Ouagadougou, Burkina Faso", $fontLoc, $darkGrayBrush, (New-Object System.Drawing.RectangleF(0, 380, 1200, 50)), $sf)

$ctaBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point 430, 440),
    (New-Object System.Drawing.Point 770, 490),
    [System.Drawing.Color]::FromArgb(14, 165, 233),
    [System.Drawing.Color]::FromArgb(59, 130, 246)
)
$g.FillRectangle($ctaBrush, 430, 440, 340, 50)

$fontCta = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Bold)
$g.DrawString("Devis Gratuit - 55 99 64 18", $fontCta, [System.Drawing.Brushes]::White, (New-Object System.Drawing.RectangleF(430, 448, 340, 40)), $sf)

$fontUrl = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Regular)
$g.DrawString("maasga-website.pages.dev", $fontUrl, $cyanBrush, (New-Object System.Drawing.RectangleF(0, 540, 1200, 40)), $sf)

$ogPath = Join-Path $publicDir "og-image.png"
$bmp.Save($ogPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Host "OK: og-image.png ($((Get-Item $ogPath).Length) bytes)"

# --- favicon.png (180x180) from one.jpeg ---
$logoPath = Join-Path $publicDir "one.jpeg"
if (Test-Path $logoPath) {
    $logo = [System.Drawing.Image]::FromFile($logoPath)
    $fav = New-Object System.Drawing.Bitmap 180, 180
    $gf = [System.Drawing.Graphics]::FromImage($fav)
    $gf.SmoothingMode = 'HighQuality'
    $gf.InterpolationMode = 'HighQualityBicubic'
    $gf.DrawImage($logo, 0, 0, 180, 180)
    $favPath = Join-Path $publicDir "favicon.png"
    $fav.Save($favPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $gf.Dispose(); $fav.Dispose(); $logo.Dispose()
    Write-Host "OK: favicon.png ($((Get-Item $favPath).Length) bytes)"
} else {
    Write-Host "SKIP: favicon.png - one.jpeg not found"
}

# --- icon-192.png (192x192) ---
if (Test-Path $logoPath) {
    $logo = [System.Drawing.Image]::FromFile($logoPath)
    $icon192 = New-Object System.Drawing.Bitmap 192, 192
    $gi = [System.Drawing.Graphics]::FromImage($icon192)
    $gi.SmoothingMode = 'HighQuality'
    $gi.InterpolationMode = 'HighQualityBicubic'
    $gi.DrawImage($logo, 0, 0, 192, 192)
    $i192Path = Join-Path (Join-Path $publicDir "static") "icon-192.png"
    $icon192.Save($i192Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $gi.Dispose(); $icon192.Dispose(); $logo.Dispose()
    Write-Host "OK: icon-192.png ($((Get-Item $i192Path).Length) bytes)"
}

# --- icon-512.png (512x512) ---
if (Test-Path $logoPath) {
    $logo = [System.Drawing.Image]::FromFile($logoPath)
    $icon512 = New-Object System.Drawing.Bitmap 512, 512
    $gi2 = [System.Drawing.Graphics]::FromImage($icon512)
    $gi2.SmoothingMode = 'HighQuality'
    $gi2.InterpolationMode = 'HighQualityBicubic'
    $gi2.DrawImage($logo, 0, 0, 512, 512)
    $i512Path = Join-Path (Join-Path $publicDir "static") "icon-512.png"
    $icon512.Save($i512Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $gi2.Dispose(); $icon512.Dispose(); $logo.Dispose()
    Write-Host "OK: icon-512.png ($((Get-Item $i512Path).Length) bytes)"
}

Write-Host "DONE"
