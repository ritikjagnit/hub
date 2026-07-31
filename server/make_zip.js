const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const zipPath = path.resolve(rootDir, '..', 'project-management-system.zip');

console.log('📦 Creating clean project ZIP archive (excluding node_modules)...');

const powershellCmd = `
$source = "${rootDir.replace(/\\/g, '\\\\')}"
$zip = "${zipPath.replace(/\\/g, '\\\\')}"
if (Test-Path $zip) { Remove-Item $zip -Force }

$items = Get-ChildItem -Path $source -Recurse | Where-Object { 
  $_.FullName -notmatch '\\\\node_modules(\\\\|Process|$)' -and 
  $_.FullName -notmatch '\\\\.git(\\\\|Process|$)' -and 
  $_.FullName -notmatch '\\\\dist(\\\\|Process|$)'
}

Compress-Archive -Path $items.FullName -DestinationPath $zip -Force
`;

try {
  execSync(`powershell -Command "${powershellCmd.replace(/\n/g, ' ')}"`, { stdio: 'inherit' });
  console.log(`\n✅ ZIP created successfully at: ${zipPath}`);
} catch (err) {
  console.error('Error creating ZIP:', err.message);
}
