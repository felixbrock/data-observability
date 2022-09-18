param([string]$functionName)

if (-Not $functionName) {
  $functionName = read-host -Prompt "Please enter function name"
}

$envValues=''

function Add-EnvValue([string]$base, [string]$new) {
  if($new -Match 'NODE_ENV') {exit}
  if(-not $base) {$base = $new}
  else {$base = $base + "," + $new}

  $base
}

get-content .env | ForEach-Object {
  if($_) {$envValues = Add-EnvValue -base $envValues -new $_}
}

$nodeEnv = 'NODE_ENV=production'
if(-not $envValues) {$envValues = $nodeEnv}
else {$envValues = $envValues + "," + $nodeEnv}

if(-not $envValues) {exit}

try { $result = aws lambda update-function-configuration --function-name $functionName  --environment "Variables={$($envValues)}" }
catch { "An error occurred." }

exit