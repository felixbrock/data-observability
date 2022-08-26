param([string]$functionName)

if (-Not $functionName) {
  $functionName = read-host -Prompt "Please enter function name"
}

$envValues=''

# $functionConfig = aws lambda get-function-configuration --function-name $functionName | ConvertFrom-Json

# $envVariables = $functionConfig.Environment.Variables

function Add-EnvValue([string]$base, [string]$new) {
  $valueToAdd = if($new -Match 'NODE_ENV') {'NODE_ENV=production'} else {$new}
  if(-not $base) {$base = $valueToAdd}
  else {$base = $base + "," + $valueToAdd}

  $base
}

# $envVariables.PSObject.Properties | ForEach-Object {
 
#   if($_.Name -and $_.Value) {$envValues = Add-EnvValue -base $envValues -new "$($_.Name)=$($_.Value)"}

# }

get-content .env | ForEach-Object {
  if($_) {$envValues = Add-EnvValue -base $envValues -new $_}

}

if(-not $envValues) {exit}

try { $result = aws lambda update-function-configuration --function-name $functionName  --environment "Variables={$($envValues)}" }
catch { "An error occurred." }

exit