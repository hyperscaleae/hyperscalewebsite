from pathlib import Path
import json, zipfile

root=Path(__file__).resolve().parents[1]
target=Path('C:/Users/PC/Desktop/HyperScale Studio/Dashboard/HyperScale-Hostinger-Node-portal.zip')
target.parent.mkdir(parents=True,exist_ok=True)
package={"name":"hyperscale-private-portal","version":"2.0.0","private":True,"main":"index.cjs","engines":{"node":"24.x"},"scripts":{"start":"node index.cjs","build":"node --check index.cjs"},"dependencies":{"express":"4.21.2"}}
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as archive:
    archive.write(root/'dist/hostinger-index.cjs','index.cjs')
    archive.writestr('package.json',json.dumps(package,indent=2))
    for file in (root/'dist/public').rglob('*'):
        if file.is_file() and not any(word in file.name for word in ['-raw','-retry','-instagram-raw']):
            archive.write(file,Path('public')/file.relative_to(root/'dist/public'))
print(target)
print(f'Package size: {target.stat().st_size/1024/1024:.1f} MB; no private account or workspace data included.')
