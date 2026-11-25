from pathlib import Path
import json,re,base64
root=Path(__file__).resolve().parents[1]
p=root/'web'
def svg(n):return 'data:image/svg+xml;base64,'+base64.b64encode((p/n).read_bytes()).decode()
css=(p/'style.css').read_text().replace('landscape.svg',svg('landscape.svg'))
data={f.stem:json.loads(f.read_text()) for f in p.glob('*.json')}
js=(p/'app.js').read_text().replace("url(cover'+i+'.svg)","url('+covers[i]+')").replace("const r=await fetch(books[book][2]+'.json');if(!r.ok)throw Error();cache[book]=await r.json()","cache[book]=offline[books[book][2]]")
js='const offline='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';const covers='+json.dumps([svg('cover%d.svg'%i) for i in range(len(list(p.glob('cover*.svg'))))])+';\n'+js
h=(p/'index.html').read_text().replace('<link rel="stylesheet" href="style.css">','<style>'+css+'</style>').replace('<script src="app.js"></script>','<script>'+re.sub('</script',r'<\\/script',js,flags=re.I)+'</script>')
h=h.replace('<script src="backup.js"></script>','<script>'+(p/'backup.js').read_text()+'</script>')
license=p/'examples-LICENSE.txt'
if license.exists():h+='<!-- Examples license\n'+license.read_text()+'-->'
(root/'build').mkdir(exist_ok=True)
(root/'build/Wordleaf-Desktop.html').write_text(h,encoding='utf-8')
