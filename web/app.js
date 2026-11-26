const books=[
 ['英语四级词汇','CET-4','CET4_T',2607,'#416f59'],['英语六级词汇','CET-6','CET6_T',2345,'#405c7c'],['考研英语词汇','考研','KaoYan_3_T',3728,'#ac6848'],['英语专四词汇','TEM-4','Level4luan_2_T',4025,'#766489'],['英语专八词汇','TEM-8','Level8luan_2_T',12197,'#394b56'],
 ['新东方六级词汇（乱序版）','CET-6','XDF_CET6_Luan',2426,'#42724a'],['考研英语红宝书','考研','HongBao_2026',4858,'#98483d']
];
const lines={fuzzy:'M3 6q4-5 9 0t9 0 M3 12q4-5 9 0t9 0 M3 18q4-5 9 0t9 0',home:'M3 10l9-7 9 7v10h-6v-7H9v7H3z',books:'M3 4h4v16H3z M10 4h4v16h-4z M16 5l3-1 3 15-3 1z',review:'M4 9a8 8 0 1 1 0 7 M4 3v6h6 M12 7v5l3 2',saved:'M6 3h12v18l-6-4-6 4z',date:'M4 5h16v16H4z M8 3v5m8-5v5M4 10h16',sound:'M3 9h4l5-4v14l-5-4H3z M16 8q4 4 0 8m3-11q7 7 0 14',book:'M2 5q6-2 10 2q4-4 10-2v14q-6-2-10 1q-5-3-10-1z M12 7v13',target:'M21 12a9 9 0 1 1-9-9 M17 12a5 5 0 1 1-5-5 M12 12l8-8',check:'M4 12l5 5L20 6',play:'M7 4l13 8-13 8z',settings:'M3 7h9m4 0h5M3 17h3m4 0h11 M12 4v6M7 14v6',sun:'M16 12a4 4 0 1 1-8 0a4 4 0 1 1 8 0 M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2'};
const icon=k=>'<svg class="ico" aria-hidden="true" viewBox="0 0 24 24"><path d="'+lines[k]+'"/></svg>';
const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateKey=()=>new Date().toLocaleDateString('sv-SE');
let st={selected:0,cursor:{},days:{},due:{},saved:{},fuzzy:{},goal:20};
const localApp=window.WordleafLocal;
function readProgress(raw){
 try{const value=JSON.parse(raw);return value && typeof value.cursor==='object' && typeof value.days==='object'?value:null}catch{return null}
}
let stored;
try{stored=readProgress(localStorage.getItem('wordleaf1'))}catch{}
if(localApp){
 const backup=readProgress(localApp.readProgress());
 if(backup && (!stored || (backup.revision||0)>(stored.revision||0))){
  stored=backup;try{localStorage.setItem('wordleaf1',JSON.stringify(stored))}catch{}
 }else if(stored && (!backup || stored.revision!==backup.revision)){
  localApp.saveProgress(JSON.stringify(stored))
 }
}
if(stored)Object.assign(st,stored);
const notify=t=>{const n=$('#toast');n.textContent=t;clearTimeout(notify.timer);notify.timer=setTimeout(()=>n.textContent='',2600)};
function persist(){
 if(localApp)st.revision=(st.revision||0)+1;
 const snapshot=JSON.stringify(st);let saved=false;
 try{localStorage.setItem('wordleaf1',snapshot);saved=true}catch{}
 if(localApp){try{saved=localApp.saveProgress(snapshot)||saved}catch{}}
 if(!saved)notify('未能保存本次学习记录');return saved
}
const tabs={home:'学习总览',books:'单词书架',review:'复习计划',fuzzy:'模糊单词',saved:'我的收藏'};
const daily=[
 ['embrace','ɪmˈbreɪs','v. 拥抱；欣然接受','Embrace the chance to learn something new.'],
 ['cultivate','ˈkʌltɪveɪt','v. 培养；耕作','Reading helps cultivate curiosity.'],
 ['explore','ɪkˈsplɔːr','v. 探索；探究','Explore one new idea each day.'],
 ['persist','pərˈsɪst','v. 坚持；持续','Small habits persist with practice.']
];
const pick=()=>daily[Math.floor(Date.parse(dateKey())/86400000)%daily.length];
let page,session,loadId=0;
const shelves=[
 ['大学英语','四级与六级考试词汇。',[0,1],'#548267'],
 ['英语专业','专业四级与专业八级考试词汇。',[3,4],'#83749a'],
 ['考研英语','按备考计划积累考研英语词汇。',[2],'#a67549'],
 ['专项词书','按所选版本的词表顺序背诵。',[5,6],'#9a6358']
];
const editions=[
 ['四级词汇','CET 4','从四级词表开始，逐词回忆中文释义。','#c4e2cd','#224e3c'],
 ['六级词汇','CET 6','学习六级考试词汇，遇到不熟悉的词可加入模糊单词。','#c4d9eb','#2d526e'],
 ['考研词汇','考研','通过词卡学习考研词汇，按每日目标安排进度。','#edd3ab','#694628'],
 ['专四词汇','TEM 4','面向英语专业四级备考，逐步积累专业英语词汇。','#e1d0e8','#594064'],
 ['专八词汇','TEM 8','面向英语专业八级备考，分组学习并复习到期词条。','#cadcda','#325650'],
 ['新东方六级词汇','乱序版','按 30 个课时的乱序词表学习，收录单词与词组。','#d7e3b4','#475d34'],
 ['考研英语红宝书','2026','采用 2026 版红宝书词表，按原词序积累考研词汇。','#f2ccbb','#783e33']
];
const coverDrawings=[
 '<path d="M22 56q19-11 39 2q20-13 39-2v31q-22-9-39 2q-19-11-39-2z" fill="currentColor" opacity=".18"/><path d="M18 48q21-8 43 5q18-14 43-12v35q-22 0-43 13q-18-12-43-11zM61 53v34M26 56q12-3 25 3M70 56q12-7 23-7"/><circle cx="77" cy="25" r="11" fill="#e2ac65" stroke="none"/>',
 '<circle cx="60" cy="55" r="32"/><ellipse cx="60" cy="55" rx="14" ry="32" transform="rotate(24 60 55)"/><path d="M30 43q27 19 59 23M34 74q18-3 35 9M58 89l-3 9m-15 2h34"/><circle cx="84" cy="34" r="6" fill="#e9a65c" stroke="none"/>',
 '<path d="M14 84l32-45 15 21 16-27 31 51z" fill="currentColor" opacity=".18"/><path d="M13 85l33-46 16 23m-17 23l32-53 32 53zM66 51l10 4 7-8"/><circle cx="34" cy="26" r="10" fill="#d49a54" stroke="none"/>',
 '<path d="M15 79q22-32 44-19t46-26M29 83h66"/><path d="M46 70l8-24 31-30 14 13-32 30z" fill="currentColor" opacity=".2"/><path d="M46 70l8-24 31-30 14 13-32 30zM54 46l13 13M61 49l28-27"/><circle cx="28" cy="62" r="5" fill="#dc995c" stroke="none"/>',
 '<path d="M22 83h78M25 77h71M30 68V46m14 22V46m15 22V46m15 22V46m15 22V46M19 39l41-22 42 22zM24 43h73"/><circle cx="60" cy="31" r="4" fill="#c4944b" stroke="none"/>',
 '<path d="M22 79q27 10 37-18t36-31" stroke-dasharray="3 5"/><path d="M28 57q-9-26 18-27q1 21-18 27zm35 2q6-23 28-15q-8 21-28 15z" fill="currentColor" opacity=".45"/><circle cx="96" cy="28" r="7" fill="#c89750" stroke="none"/>',
 '<path d="M17 74l68-17 18 8-67 18zM17 74v7l19 9 67-18v-7M20 60l67-17 17 9-68 17zM20 60v7l16 9 68-17v-7M19 46l67-17 17 8-68 17zM19 46v7l16 9 68-17v-8"/><path d="M49 47l9-2v13l-5-2-4 4z" fill="#ca8647" stroke="none"/>'
];
function volume(i){
 const [name,,,total]=books[i], [title,edition,description,paper,ink]=editions[i];
 const learned=st.cursor[i]||0,cta=learned?'继续背诵':'开始背诵';
 return `<button class="volume" data-volume="${i}" style="--paper-color:${paper};--cover-ink:${ink}" aria-label="${esc(name)}，${cta}" aria-describedby="details-${i}">
 <span class="ribbon" aria-hidden="true"></span>
 <span class="leaf"><b>${title}</b><span class="blurb" id="details-${i}">${description}</span><span class="volume-progress">已学 ${learned.toLocaleString()} / ${total.toLocaleString()}</span><span class="volume-cta">${cta}</span></span>
 <span class="hinge" aria-hidden="true"><span class="coverface"><strong>${title}</strong><span class="edition">${edition}</span>
 <svg class="bookdrawing" viewBox="0 0 120 110" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">${coverDrawings[i]}</svg>
 <span class="coverfoot"><i>Wordleaf</i><span>${total.toLocaleString()} 词条</span></span></span><span class="endpaper"></span></span></button>`
}
function bookGrid(){
 return '<div class="shelf-grid">'+shelves.map(([title,description,ids,color])=>`<section class="shelf-group" style="--shelf-accent:${color}"><h3>${title}</h3><p>${description}</p><div class="plank">${ids.map(volume).join('')}</div></section>`).join('')+'</div>'
}
const btn=(action,label,cl='primary')=>'<button class="'+cl+'" data-act="'+action+'">'+label+'</button>';
function definitionRows(word){
 const senses=[], related=[];
 // Older backups can have several related entries glued to a single sense.
 const inlineTerm=/(?<=[\u3400-\u9fff；;）)])\s*(?=[A-Za-z][A-Za-z '’-]*[：:])/g;
 for(const raw of word.trans){
  const separatePos=raw.replace(/([\u3400-\u9fff）)\]】>；;。，])\s*(?=(?:abbr|adj|adv|vt|vi|v|n|prep|conj|pron|interj|int|aux|num)\.)/g,'$1\n');
  const lines=separatePos.replace(inlineTerm,'\n').split('\n');
  for(const line of lines){
   const text=line.trim().replace(/[；;]$/,'');
   if(!text)continue;
   const match=text.match(/^([A-Za-z][^：:]*?)[：:]\s*(.+)$/);
   if(match && !/[\u3400-\u9fff]/.test(match[1])){
    related.push('<span class="gloss-row"><strong lang="en">'+esc(match[1])+'</strong>　'+esc(match[2].replace(/\|/g,'、'))+'</span>');
   }else{
    const notes=[];
    const meaning=text.replace(/[（(\[]([^()（）\[\]]+)[）)\]]/g,(whole,inner)=>{
     const note=inner.trim();
     const form=/^(?:亦?作|也作|等于|亦称作|全称|简写为?|过去式|过去分词|现在分词|复数|名词|形容词|副词|动词|异体字)\s*[A-Za-z]/;
     const origin=/[A-Za-z]\s*的?(?:ing形式|过去|现在分词|三单|第三人称|第二人称|复数|比较级|最高级|缩写|变形|变体|所有格|宾格|反身代词)/;
     if(!form.test(note)&&!origin.test(note))return whole;
     notes.push(...note.split(/[，,、]\s*|\s+(?=过去分词|现在分词|第三人称单数)/).filter(Boolean));
     return '';
    }).replace(/[；;]\s*常作\s+([A-Za-z]+\s+[^；;]+)/g,(_,form)=>{notes.push('常作 '+form);return ''}).trim();
    if(/^也作\s+[a-z]/i.test(meaning))notes.push(meaning);
    else if(meaning)senses.push('<span class="gloss-row">'+esc(meaning.replace(/^([a-z]+\.)(?=[\u3400-\u9fff（【\[])/,'$1 '))+'</span>');
    for(const note of notes)related.push('<span class="gloss-row">'+esc(note)+'</span>');
   }
  }
 }
 return senses.join('')+(related.length?'<span class="related-words"><span class="related-title">相关词与词组</span>'+related.join('')+'</span>':'');
}
function listDefinition(id,word){
 return '<span data-gloss="'+esc(id)+'">'+definitionRows(word)+'</span>';
}
async function refreshListDefinitions(){
 const groups=new Map();
 for(const node of document.querySelectorAll('[data-gloss]')){
  const [book,index]=node.dataset.gloss.split('-').map(Number);
  if(!books[book])continue;
  if(!groups.has(book))groups.set(book,[]);
  groups.get(book).push({node,index});
 }
 await Promise.all(Array.from(groups,async ([book,items])=>{
  try{
   const words=await loadBook(book);
   for(const {node,index} of items){
    if(node.isConnected && words[index])node.innerHTML=definitionRows(words[index]);
   }
  }catch{/* Keep the saved definition available offline. */}
 }));
}
function render(){
 if(location.hash==='#study')return;
 page=location.hash.slice(1);if(!tabs[page])page='home';
 $('nav').innerHTML=Object.entries(tabs).map(([k,v])=>'<a href="#'+k+'" '+(page===k?'class="active" aria-current="page"':'')+'>'+icon(k)+v+'</a>').join('');
 $('#crumb').innerHTML=icon('book')+' 学习空间 <span aria-hidden="true">/</span> '+tabs[page];$('#date').innerHTML=icon('date')+new Date().toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'short'});
 const b=books[st.selected],w=pick(),done=st.days[dateKey()]||0,due=Object.entries(st.due).filter(([,v])=>v.at<=Date.now());
 let html='<h1>'+tabs[page]+'</h1>';
 if(page==='home'){
 const completed=st.cursor[st.selected]||0, percent=Math.min(100,Math.round(done/st.goal*100));
 const covers=['College English','College English','Graduate English','English Major','English Major','New Oriental','2026 Edition'];
 html=`<div class="mast"><h1>学习空间</h1>${localApp?btn('checkUpdate','检查更新','soft'):'<span class="mastdate">'+icon('date')+$('#date').textContent+'</span>'}</div>
 <article class="feature" style="--binding:${b[4]}">
  <div class="featurecopy"><span class="featurelabel">${icon('book')} 当前词书</span><h2>${b[0]}</h2>
  <p>${b[1]} <span> / </span> ${b[3].toLocaleString()} 个词条</p>
  <div class="featureactions">${btn('learn',icon('play')+(completed?'继续学习':'开始学习'))}<a class="swap" href="#books">切换词书</a></div></div>
  <div class="bookstage" aria-hidden="true"><div class="orbit"></div><div class="physicalbook"><div class="jacket"><small>Wordleaf</small><strong>${b[1]}</strong><em>${covers[st.selected]}</em><i class="jacketart"></i><span>${b[0]}</span></div></div></div>
 </article>
 <section class="spread"><div class="dailyplan"><div class="row"><h2>今日学习</h2>${btn('goal',icon('settings')+' 调整目标','soft')}</div>
 <div class="planbody"><div class="meter" style="--fill:${percent}%"><strong>${percent}<small>%</small></strong></div><div class="counts">
 <div><strong>${done}<small> / ${st.goal}</small></strong><span>今日新学</span></div>
 <a href="#review"><strong>${due.length}</strong><span>待复习</span></a>
 <div><strong>${Object.values(st.cursor).reduce((a,b)=>a+b,0)}</strong><span>累计学习</span></div></div></div></div>
 <article class="dailyquote"><div class="row"><span class="label">${icon('sun')} 每日一词</span>${btn('dailySound',icon('sound'),'iconbtn')}</div>
 <div class="quotehead"><h2 lang="en">${w[0]}</h2><small>/${w[1]}/</small></div><p>${w[2]}</p><footer>${w[3]}</footer></article></section>
 <div class="row sectionhead"><h2>单词书架</h2><a class="soft" href="#books">查看全部</a></div>${bookGrid()}<div class="backup-entry">${btn('backup','学习记录备份','outline')}</div>`;
 }else if(page==='books'){html+='<p class="intro">翻开封面，查看词书介绍与学习进度。</p>'+bookGrid()+'<a class="source" href="https://github.com/RealKai42/qwerty-learner/tree/master/public/dicts" target="_blank" rel="noreferrer">词库来源 · Qwerty Learner</a><a class="source" href="https://github.com/KyleBing/english-vocabulary" target="_blank" rel="noreferrer">双语例句 · English Vocabulary</a><a class="source" href="https://lzctuhao-iqjxs8f9-lzctuhao.4everland.app/2021/0704/folder-ganhuo/xdflevel6/" target="_blank" rel="noreferrer">新东方六级乱序版 · 30 课时词表</a><a class="source" href="https://github.com/RealKai42/qwerty-learner/blob/master/public/dicts/hongbaoshu-2026.json" target="_blank" rel="noreferrer">2026 考研红宝书 · 词表来源</a>'}
 else if(page==='review'){html+='<p class="intro">按记忆表现安排下次复习。</p><div class="item"><h2>到期复习 · '+due.length+' 词</h2><p>'+(due.length?'这些词已到复习时间。':'当前没有到期词条。学习新词后会自动安排复习。')+'</p>'+(due.length?'<div class="actions">'+btn('review','开始复习')+'</div>':'')+'</div>';for(const [,v] of Object.entries(st.due).sort((a,b)=>a[1].at-b[1].at).slice(0,40))html+='<div class="item row"><b>'+esc(v.word.name)+'</b><small>'+new Date(v.at).toLocaleString('zh-CN')+'</small></div>'}
 else if(page==='fuzzy'){
  const entries=Object.entries(st.fuzzy);
  html+='<div class="row fuzzyhead"><p>共 '+entries.length+' 个词 · 单击查看释义，再点换词</p>'+(entries.length?btn('fuzzy',icon('play')+' 开始背诵'):'')+'</div>';
  html+=entries.map(([id,{word}])=>'<div class="item row"><div><b lang="en">'+esc(word.name)+'</b><p>'+listDefinition(id,word)+'</p></div><button class="outline" data-forget="'+esc(id)+'" aria-label="移除 '+esc(word.name)+'">移除</button></div>').join('')||'<div class="item empty">这里还没有模糊单词。背词时双击词卡，即可把那个词放到这里。</div>';
 }
 else{html+='<p class="intro">学习时收藏的单词，共 '+Object.keys(st.saved).length+' 词。</p>';html+=Object.entries(st.saved).map(([k,w])=>'<div class="item row"><div><b>'+esc(w.name)+'</b><p>'+listDefinition(k,w)+'</p></div><button class="outline" data-remove="'+esc(k)+'">移除</button></div>').join('')||'<div class="item empty">还没有收藏。查看词卡释义时按 F 键即可收藏。</div>'}
 document.body.dataset.page=page;$('#view').innerHTML=html;if(page==='saved'||page==='fuzzy')refreshListDefinitions();const sp=$('[data-act="dailySound"]');if(sp)sp.setAttribute('aria-label','朗读每日一词');
}
const dialog=$('#dialog');
function show(body){$('#panel').innerHTML=body;if(!dialog.open)dialog.showModal()}
let tapTimer,flashTimer,tapPoint,exitMotion;
const cache={};
async function loadBook(book){
 if(!cache[book]){
  const r=await fetch(books[book][2]+'.json');if(!r.ok)throw Error();cache[book]=await r.json()
 }
 return cache[book]
}
function clearTap(){clearTimeout(tapTimer);tapTimer=0;tapPoint=null;exitMotion?.cancel();exitMotion=null}
function leave(){
 if(location.hash==='#study')history.back();
 else dialog.close()
}
$('.close').onclick=leave;
dialog.addEventListener('cancel',e=>{if(session){e.preventDefault();leave()}});
dialog.onclose=()=>{
 clearTap();clearTimeout(flashTimer);loadId++;session=null;
 dialog.classList.remove('focus-mode');document.body.classList.remove('studying');render();
};
async function start(mode){
 const token=++loadId,book=st.selected;
 show('<p role="status">正在打开词书…</p>');
 try{
  let entries;
  if(mode==='learn'){
   const words=await loadBook(book),pos=st.cursor[book]||0,remaining=st.goal-(st.days[dateKey()]||0);
   entries=words.slice(pos,pos+(remaining>0?remaining:st.goal)).map((word,n)=>({word,key:book+'-'+(pos+n)}))
  }else{
   entries=mode==='fuzzy'?Object.values(st.fuzzy):Object.entries(st.due).filter(([,v])=>v.at<=Date.now()).map(([key,v])=>({key,word:v.word}));
   const ids=new Set(entries.map(e=>Number(e.key.split('-')[0])));
   await Promise.all([...ids].map(loadBook));
   entries=entries.map(e=>{const [id,index]=e.key.split('-').map(Number);return {key:e.key,word:cache[id][index]||e.word}})
  }
  if(token!==loadId||!dialog.open)return;
  session={mode,book,entries,pos:0,completed:0,reveal:false};
  location.hash='study';card()
 }catch{if(token===loadId)show('<h2>词书加载失败</h2><p>请检查连接后重试。</p><div class="actions">'+btn(mode,'重新加载')+'</div>')}
}
const wordId=w=>'w:'+w.name.trim().toLowerCase();
function brief(w){return {name:w.name,trans:w.trans}}
function card(direction=1){
 clearTap();clearTimeout(flashTimer);
 const s=session,entry=s.entries[s.pos];
 dialog.classList.toggle('focus-mode',!!entry);document.body.classList.toggle('studying',!!entry);
 if(!entry){
  show('<h2>'+(s.entries.length?'本组背诵完成':'当前没有待背词条')+'</h2><p>共完成 '+s.pos+' 个词条。</p><div class="actions">'+(s.pos?btn('previous','上一个单词','outline'):'')+btn('return','返回'+(s.mode==='fuzzy'?'模糊单词':'学习空间'))+'</div>');return
 }
 const w=entry.word,phonetic=w.usphone||w.ukphone;
 let sheet=$('#sheet');
 if(!sheet){
  show('<button id="sheet"></button><button class="previous-word" data-act="previous" aria-keyshortcuts="ArrowLeft">‹ 上一个单词</button><span id="flash" role="status"></span>');
  sheet=$('#sheet');sheet.focus({preventScroll:true})
 }
 $('.previous-word').disabled=s.pos===0;
 $('#flash').textContent='';
 const moving=!matchMedia('(prefers-reduced-motion: reduce)').matches && typeof sheet.animate==='function';
 const sameWord=sheet.dataset.key===entry.key;
 let reading=sheet.querySelector('.reading');
 if(!sameWord){
  reading=document.createElement('span');reading.className='reading';
  reading.innerHTML='<strong class="focus-word" lang="en">'+esc(w.name)+'</strong>';
  sheet.replaceChildren(reading);sheet.dataset.key=entry.key;sheet.scrollTop=0;
  if(moving && direction)reading.animate([{opacity:0,transform:'translateX('+direction*9+'px)'},{opacity:1,transform:'none'}],
   {duration:175,easing:'cubic-bezier(.2,.75,.3,1)'})
 }
 const title=reading.firstElementChild;
 const oldTop=title.getBoundingClientRect().top;
 const details=reading.querySelector('.word-details');
 if(s.reveal && !details){
  const content=document.createElement('span');content.className='word-details';
  content.innerHTML=(phonetic?'<span class="phonetic">/'+esc(phonetic)+'/</span>':'')+
   '<span class="definition">'+definitionRows(w)+'</span>'+
   (w.example?'<span class="example"><span lang="en">'+esc(w.example[0])+'</span><span>'+esc(w.example[1])+'</span></span>':'');
  reading.append(content);
  if(moving)content.animate([{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'none'}],{duration:190,easing:'ease-out'})
 }else if(!s.reveal && details){details.remove()}
 if(moving && sameWord){
  title.getAnimations().forEach(animation=>animation.cancel());
  const offset=oldTop-title.getBoundingClientRect().top;
  if(offset)title.animate([{transform:'translateY('+offset+'px)'},{transform:'none'}],
   {duration:205,easing:'cubic-bezier(.2,.75,.3,1)'})
 }
 sheet.setAttribute('aria-label',[w.name,s.reveal?w.trans.join('；'):'',s.reveal?w.example?.join(' '):'',s.reveal?'下一个单词':'查看释义'].filter(Boolean).join('。'));
}
function flash(text){const n=$('#flash');if(!n)return;n.textContent=text;clearTimeout(flashTimer);flashTimer=setTimeout(()=>{n.textContent=''},1100)}
function addFuzzy(){
 const s=session;if(!s||s.mode==='fuzzy')return;
 const {key,word}=s.entries[s.pos],id=wordId(word);
 if(st.fuzzy[id]){flash('已在模糊单词中');return}
 st.fuzzy[id]={key,word:brief(word)};persist();flash('已加入模糊单词')
}
function step(){
 const s=session,e=s?.entries[s.pos];if(!e)return;
 if(!s.reveal){s.reveal=true;card();return}
 if(s.pos===s.completed && s.mode!=='fuzzy'){
  const interval=st.fuzzy[wordId(e.word)]?0:Math.min(90,Math.max(1,(st.due[e.key]?.interval||0)*2));
  st.due[e.key]={word:brief(e.word),interval,at:Date.now()+(interval?interval*86400000:60000)};
  if(s.mode==='learn'){st.cursor[s.book]=(st.cursor[s.book]||0)+1;st.days[dateKey()]=(st.days[dateKey()]||0)+1}
  persist()
 }
 s.pos++;s.completed=Math.max(s.completed,s.pos);s.reveal=false;card()
}
function previousWord(){
 clearTap();
 if(!session||session.pos===0)return;
 session.pos--;session.reveal=false;card(-1);$('#sheet').focus({preventScroll:true})
}
dialog.addEventListener('click',event=>{
 if(event.target.closest('[data-act="previous"]')){previousWord();return}
 if(event.target.closest('[data-act="return"]')){leave();return}
 if(!event.target.closest('#sheet')||!session)return;
 if(session.mode==='fuzzy'||event.detail===0){clearTap();step();return}
 if(tapPoint && Math.hypot(event.clientX-tapPoint.x,event.clientY-tapPoint.y)<44){
  const revealedOnFirstTap=tapPoint.revealed;
  clearTap();
  if(revealedOnFirstTap){session.reveal=false;card()}
  addFuzzy();return
 }
 const revealed=!session.reveal;
 clearTap();
 if(revealed)step();
 else if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
  const reading=$('#sheet .reading');
  exitMotion=reading.animate?.([{opacity:1,transform:'none'},{opacity:.18,transform:'translateX(-8px)'}],
   {duration:260,easing:'ease-in-out',fill:'forwards'})
 }
 tapPoint={x:event.clientX,y:event.clientY,revealed};
 tapTimer=setTimeout(()=>{clearTap();if(!revealed)step()},260)
});
dialog.addEventListener('keydown',event=>{
 if(event.key==='ArrowLeft' && session && !event.altKey && !event.ctrlKey && !event.metaKey){event.preventDefault();previousWord();return}
 if(!session?.entries[session.pos]||event.ctrlKey||event.altKey||event.metaKey)return;
 const action=event.key.toLowerCase();
 if(action==='m'&&session.mode!=='fuzzy'){event.preventDefault();clearTap();addFuzzy()}
 if(action==='f'&&session.reveal){const e=session.entries[session.pos];st.saved[e.key]=brief(e.word);persist();flash('已收藏')}
});
function speak(t){if(!window.speechSynthesis){notify('此浏览器未提供语音朗读');return}const u=new SpeechSynthesisUtterance(t);u.lang='en-US';u.onerror=e=>{if(e.error!=='interrupted'&&e.error!=='canceled')notify('当前设备无法播放英语语音')};speechSynthesis.cancel();speechSynthesis.speak(u)}
let lastPointer='';
function closeVolumes(){document.querySelectorAll('.volume.opened').forEach(el=>el.classList.remove('opened'))}
document.addEventListener('pointerdown',e=>{lastPointer=e.pointerType;if(!e.target.closest('.volume.opened'))closeVolumes()});
document.addEventListener('keydown',()=>{lastPointer='';closeVolumes()});
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-volume')){
  if(lastPointer==='touch'&&!b.classList.contains('opened')){
   closeVolumes();b.classList.add('opened');return
  }
  st.selected=Number(b.dataset.volume);persist();render();start('learn');return
 }
 if(b.hasAttribute('data-forget')){delete st.fuzzy[b.dataset.forget];persist();render();notify('已从模糊单词移除');return}
 if(b.dataset.remove){delete st.saved[b.dataset.remove];persist();render();return}
 const a=b.dataset.act;if(!a)return;
 if(['learn','review','fuzzy'].includes(a))return start(a);
 if(a==='backup'){backupMenu();return}
 if(a==='checkUpdate'){localApp?.checkUpdate();return}
 if(a==='close')return dialog.close();if(a==='dailySound')return speak(pick()[0]);
 if(a==='goal'){show('<h2>每日新词目标</h2><form id="goal"><label>每天学习 <input type="number" min="1" max="200" required value="'+st.goal+'"> 个新词</label><div class="actions"><button class="primary">保存目标</button></div></form>');$('#goal').onsubmit=e=>{e.preventDefault();st.goal=Number($('#goal input').value);persist();dialog.close()};return}
});
window.addEventListener('hashchange',()=>{
 if(location.hash==='#study'){if(!session)location.replace('#home');return}
 if(dialog.open)dialog.close();
 render()
});
if(location.hash==='#study')history.replaceState(null,'','#home');
render();

// A short, clipped wash begins at the contact point. The study sheet owns its gestures.
function pressFeedback(event){
 const control=event.target.closest('button:not(#sheet),nav a,.swap,a.soft,.counts a');
 if(!control||control.disabled||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const box=control.getBoundingClientRect();
 const wash=document.createElement('span'),ink=document.createElement('i');
 wash.setAttribute('aria-hidden','true');wash.className='wash';
 ink.style.left=(event.type==='keydown'?box.width/2:event.clientX-box.left)+'px';
 ink.style.top=(event.type==='keydown'?box.height/2:event.clientY-box.top)+'px';
 ink.style.setProperty('--diam',2*Math.hypot(box.width,box.height)+'px');
 control.querySelector('.wash')?.remove();wash.append(ink);control.append(wash);
 setTimeout(()=>wash.remove(),550)
}
document.addEventListener('pointerdown',e=>{if(e.isPrimary&&e.button===0)pressFeedback(e)});
document.addEventListener('keydown',e=>{if(!e.repeat&&['Enter',' '].includes(e.key))pressFeedback(e)});

const undoKey='wordleaf-before-import';
let importPreview;
function backupMenu(message=''){
 importPreview=null;
 let undo=false;try{undo=!!localStorage.getItem(undoKey)}catch{}
 show('<h2>学习记录备份</h2><p>导出到文件，可在换机或重新安装后恢复进度。</p><div class="actions">'+
  btn('exportProgress','导出备份')+btn('importProgress','选择备份文件','outline')+
  (undo?btn('undoProgress','恢复到上次导入前','soft'):'')+'</div><input id="backup-file" type="file" accept=".json,application/json" hidden><p role="status" id="backup-status"></p>');
 $('#backup-status').textContent=message;
 $('#backup-file').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;
  try{
   if(file.size>ProgressBackup.limit)throw Error('文件超过 32 MB。');
   previewBackup(await file.text());
  }catch(error){backupMenu(error.message)}
 };
}
function previewBackup(text,undo=false){
 try{
  const {date,progress}=ProgressBackup.decode(text,books);
  importPreview={progress,undo};
  const counts=Object.entries(progress.cursor).map(([index,n])=>'<li>'+esc(books[index][0])+' · '+n+' / '+books[index][3]+'</li>').join('');
  show('<h2>'+ (undo?'恢复导入前的记录':'导入备份预览')+'</h2><small>'+esc(new Date(date).toLocaleString())+'</small><p>当前词书：'+esc(books[progress.selected][0])+'。每日目标 '+progress.goal+' 词。</p><ul>'+counts+'</ul><p>收藏 '+Object.keys(progress.saved).length+' 词 · 模糊单词 '+Object.keys(progress.fuzzy).length+' 词 · 复习计划 '+Object.keys(progress.due).length+' 词</p><p>确认后将替换本机学习记录。</p><div class="actions">'+btn('applyProgress','确认恢复')+btn('backup','取消','outline')+'</div>');
 }catch(error){backupMenu(error.message)}
}
function applyBackup(){
 if(!importPreview)return;
 const {progress,undo}=importPreview,old=st;
 try{
  if(!undo)localStorage.setItem(undoKey,ProgressBackup.encode(old,books));
  st={...progress,revision:old.revision||0};
  if(!persist()){st=old;throw Error('写入失败，已保留当前进度。')}
  importPreview=null;render();backupMenu('学习记录已恢复。')
 }catch(error){st=old;backupMenu('未完成恢复：'+error.message)}
}
document.addEventListener('click',event=>{
 const action=event.target.closest('button')?.dataset.act;
 try{
  if(action==='exportProgress'){
   const data=ProgressBackup.encode(st,books);
   if(new Blob([data]).size>ProgressBackup.limit)throw Error('备份超过 32 MB。');
   const name='Wordleaf-'+dateKey()+'.json';
   if(localApp?.exportBackup){localApp.exportBackup(data,name);return}
   const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));
   const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000)
  }
  if(action==='importProgress'){$('#backup-file').click()}
  if(action==='undoProgress')previewBackup(localStorage.getItem(undoKey),true);
  if(action==='applyProgress')applyBackup()
 }catch(error){backupMenu(error.message)}
});
