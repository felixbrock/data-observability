param([Array]$serviceDependencyNames)

$serviceDependencyNames | ForEach-Object{
  wt --title $_ PowerShell -NoExit -Command "& {cd ../$_ \; npm run dev}"
}