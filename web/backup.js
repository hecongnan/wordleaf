// Portable backup v1 uses the seven original book slots. Reject unknown book layouts.
const ProgressBackup=(()=>{
 const format='Wordleaf',version=1,limit=32*1024*1024;
 const plain=value=>value!==null && typeof value==='object' && !Array.isArray(value);
 const integer=(n,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
 function validate(data,books){
  const check=ok=>{if(!ok)throw Error('学习记录格式无效，未更改本机数据。')};
  check(plain(data)&&integer(data.selected,books.length-1)&&integer(data.goal,200)&&data.goal>0);
  const word=w=>plain(w)&&typeof w.name==='string'&&w.name.trim()&&Array.isArray(w.trans)&&w.trans.length&&w.trans.every(t=>typeof t==='string');
  function ref(k){const m=/^(0|[1-9]\d*)-(0|[1-9]\d*)$/.exec(k);return m&&books[+m[1]]&&integer(+m[2],books[+m[1]][3]-1)}
  function map(name,valid){
   check(plain(data[name]));for(const [key,value] of Object.entries(data[name]))check(valid(key,value));
  }
  map('cursor',(k,n)=>/^(0|[1-9]\d*)$/.test(k)&&books[+k]&&integer(n,books[+k][3]));
  map('days',(k,n)=>/^\d{4}-\d\d-\d\d$/.test(k)&&integer(n));
  map('saved',(k,w)=>ref(k)&&word(w));
  map('due',(k,v)=>ref(k)&&plain(v)&&integer(v.interval,90)&&integer(v.at,8640000000000000)&&word(v.word));
  map('fuzzy',(k,v)=>plain(v)&&ref(v.key)&&word(v.word)&&k==='w:'+v.word.name.trim().toLowerCase());
  return Object.fromEntries(['selected','goal','cursor','days','due','saved','fuzzy'].map(k=>[k,data[k]]))
 }
 function encode(data,books){
  return JSON.stringify({format,version,exportedAt:new Date().toISOString(),books:books.map(b=>b[2]),progress:validate(data,books)})
 }
 function decode(text,books){
  if(typeof text!=='string'||new Blob([text]).size>limit)throw Error('文件超过 32 MB 或无法读取。');
  let file;try{file=JSON.parse(text)}catch{throw Error('文件不是有效的 JSON。')}
  if(file?.format!==format||file.version!==version)throw Error('无法识别备份格式或版本。');
  if(JSON.stringify(file.books)!==JSON.stringify(books.map(b=>b[2])))throw Error('备份使用了不同版本的词书目录。');
  if(typeof file.exportedAt!=='string'||!Number.isFinite(Date.parse(file.exportedAt)))throw Error('备份时间无效。');
  return {date:file.exportedAt,progress:validate(file.progress,books)}
 }
 return {encode,decode,limit}
})();
