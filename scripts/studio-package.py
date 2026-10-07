from pathlib import Path
import shutil

root = Path(__file__).resolve().parents[1]
profile = Path('C:/Users/PC/Desktop/HyperScale Studio')
for name in ['Brand Assets','Portfolio Assets','Company Profile','Editable Templates','Print Materials','Dashboard','Backups']:
    (profile/name).mkdir(parents=True, exist_ok=True)
for source in (root/'client/public/brand').glob('*'):
    shutil.copy2(source, profile/'Brand Assets'/source.name)
for name in ['alora-logo.webp','leaders-logo.jpg','alkhalil-logo.webp','zyva-logo.png','alora.jpg','leaders.jpg','zyva.jpg']:
    source = root/'client/public/projects'/name
    if source.exists(): shutil.copy2(source, profile/'Portfolio Assets'/name)
for directory in ['Editable Templates','Print Materials']:
    for source in (root/'studio-materials'/directory).glob('*'):
        shutil.copy2(source, profile/directory/source.name)
for name in ['HyperScale_Services_Overview.pdf','HyperScale_Customer_Acquisition_Plan.pdf']:
    source = root/'outreach'/name
    if source.exists(): shutil.copy2(source, profile/'Company Profile'/name)
for source in (root/'studio-materials/Company Profile').glob('*'):
    shutil.copy2(source, profile/'Company Profile'/source.name)
shutil.copy2(root/'studio-materials/START-HERE.md', profile/'START HERE.md')
shutil.copy2(root/'dist/studio-local.cjs', profile/'Dashboard/studio-private-server.cjs')
shutil.copy2(root/'docs/PORTAL-HOSTING.md', profile/'Dashboard/PORTAL HOSTING.md')
shutil.copytree(root/'dist/public', profile/'Dashboard/site', dirs_exist_ok=True)
launcher = '''$ErrorActionPreference = 'Stop'
$studioUrl = 'http://127.0.0.1:4590'
$studioReady = $false
try { $studioReady = (Invoke-WebRequest "$studioUrl/__studio_health" -UseBasicParsing -TimeoutSec 2).Content -eq 'HyperScale-private-studio-v2' } catch {}
if (-not $studioReady) {
  Start-Process -WindowStyle Hidden -FilePath 'C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' -ArgumentList @(('"' + (Join-Path $PSScriptRoot 'studio-private-server.cjs') + '"')) -WorkingDirectory $PSScriptRoot
  for ($studioAttempt = 0; $studioAttempt -lt 20; $studioAttempt++) {
    Start-Sleep -Milliseconds 250
    try { $studioReady = (Invoke-WebRequest "$studioUrl/__studio_health" -UseBasicParsing -TimeoutSec 1).Content -eq 'HyperScale-private-studio-v2' } catch {}
    if ($studioReady) { break }
  }
}
if (-not $studioReady) { throw 'The dashboard could not start. Port 4590 may be in use by another app.' }
Start-Process "$studioUrl/dashboard"
'''
(profile/'Dashboard/Open Dashboard.ps1').write_text(launcher, encoding='utf-8')
(profile/'Dashboard/Open HyperScale Dashboard.cmd').write_text('@echo off\r\npowershell.exe -NoProfile -File "%~dp0Open Dashboard.ps1"\r\nif errorlevel 1 pause\r\n', encoding='utf-8')
(profile/'Open HyperScale Dashboard.cmd').write_text('@echo off\r\ncall "%~dp0Dashboard\\Open HyperScale Dashboard.cmd"\r\n', encoding='utf-8')
print(profile)
print('Files:', sum(1 for p in profile.rglob('*') if p.is_file()))
