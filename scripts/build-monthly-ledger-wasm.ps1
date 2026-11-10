$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$rustcCommand = Get-Command rustc -ErrorAction SilentlyContinue
$rustcPath = if ($rustcCommand) {
  $rustcCommand.Source
} else {
  Join-Path $HOME ".cargo\bin\rustc.exe"
}

if (-not (Test-Path -LiteralPath $rustcPath)) {
  throw "Rust não encontrado. Instale rustup e o alvo wasm32-unknown-unknown."
}

$sourcePath = Join-Path $repoRoot "src\features\monthly-ledger-rust\wasm\src\lib.rs"
$outputDirectory = Join-Path $repoRoot "public\wasm"
$outputPath = Join-Path $outputDirectory "monthly-ledger-rust.wasm"

New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
& $rustcPath +stable --edition=2021 --target wasm32-unknown-unknown --crate-type cdylib -C opt-level=z -C panic=abort -C link-arg=--initial-memory=2097152 -C link-arg=--max-memory=8388608 $sourcePath -o $outputPath
if ($LASTEXITCODE -ne 0) {
  throw "Falha ao compilar a feature mensal em WebAssembly."
}

Write-Host "WebAssembly gerado em public/wasm/monthly-ledger-rust.wasm"
