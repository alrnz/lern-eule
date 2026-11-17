/* Lern-Eule – Kern der App.
 * Lernpakete (modules/*.js) registrieren sich über LernApp.register({...}).
 * Format: siehe CLAUDE.md.
 */
(function(){
'use strict';

/* ================= Helpers ================= */
const $=s=>document.querySelector(s);
const app=$('#app');
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=a[i];a[i]=a[j];a[j]=t}return a};
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const uniq=a=>a.filter((x,i)=>a.indexOf(x)===i);
/** Bis zu 3 falsche Antworten aus Kandidaten (ohne die richtige, ohne Doppelte). */
const pick3=(c,cands)=>shuffle(uniq(cands).filter(x=>x!==c)).slice(0,3);
/** Ersetzt ___ im Satz durch eine animierte Lücke. */
const gapIn=s=>s.replace('___','<span class="gap">?</span>');

/* ================= Registry ================= */
const LernApp={
  modules:[],
  util:{rnd,shuffle,cap,esc,uniq,pick3,gapIn},
  register(m){
    if(!m||!m.id||!m.worlds){console.error('Lernpaket ungültig',m);return}
    if(this.modules.some(x=>x.id===m.id)){console.warn('Lernpaket doppelt',m.id);return}
    this.modules.push(m);
  },
  /** Lädt die Lernpaket-Dateien aus modules/ und startet danach die App. */
  loadModules(files){
    let left=files.length;
    const done=()=>{if(--left<=0)boot()};
    if(!left)return boot();
    files.forEach(f=>{
      const s=document.createElement('script');s.src='modules/'+f;s.async=false;
      s.onload=done;s.onerror=()=>{console.error('Lernpaket konnte nicht geladen werden:',f);done()};
      document.body.appendChild(s);
    });
  }
};
window.LernApp=LernApp;

/* ================= Save state ================= */
const KEY='lern-eule-v1';
const FRESH=()=>({name:'',xp:0,stars:{},badges:[],answered:0,correct:0,bestCombo:0,sound:true});
let S=FRESH();
let SAVED={};
try{SAVED=JSON.parse(localStorage.getItem(KEY)||'{}')||{};Object.assign(S,SAVED)}catch(e){}
// Ältere Spielstände hatten noch keinen Zähler für richtige Antworten: aus den XP schätzen.
if(typeof SAVED.correct!=='number')S.correct=Math.min(S.answered,Math.round(S.xp/14));
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
const starKey=(m,w)=>m.id+'/'+w.id;
const getStars=(m,w)=>S.stars[starKey(m,w)]||0;

/* ================= Dates ================= */
function parseDate(d){if(!d)return null;const p=d.split('-').map(Number);return new Date(p[0],p[1]-1,p[2])}
function daysUntil(d){const t=new Date();t.setHours(0,0,0,0);const x=parseDate(d);return x?Math.round((x-t)/864e5):null}
function fmtDate(d){const x=parseDate(d);return x?x.toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'numeric'}):''}
function dateChip(m){
  const d=daysUntil(m.date);if(d===null)return '';
  if(d<0)return `<span class="datechip past">war am ${parseDate(m.date).toLocaleDateString('de-DE',{day:'numeric',month:'numeric'})}</span>`;
  if(d===0)return `<span class="datechip">Heute! 🍀</span>`;
  if(d===1)return `<span class="datechip">Morgen</span>`;
  return `<span class="datechip ${d>5?'past':'soon'}">in ${d} Tagen</span>`;
}
function countdownText(m){
  const d=daysUntil(m.date);const what=m.testName||'Test';
  if(d===null)return 'Wähle eine Welt und sammle Sterne!';
  if(d>1)return `Noch <b>${d} Tage</b> bis zum ${esc(what)}. Lass uns üben!`;
  if(d===1)return `<b>Morgen</b> ist der ${esc(what)} – noch eine Runde, dann bist du bereit!`;
  if(d===0)return `<b>Heute</b> ist ${esc(what)}-Tag! Du schaffst das! 🍀`;
  return 'Wiederholen lohnt sich immer. Sammle alle Sterne!';
}
const isDone=m=>{const d=daysUntil(m.date);return d!==null&&d<0};

/* ================= Levels & badges ================= */
const TITLES=['Wort-Entdecker','Wissens-Sammler','Lern-Lehrling','Wissens-Zauberer','Lern-Profi','Schlau-Held','Lern-Meister','Wissens-Legende','Eulen-Genie',
 'Sprach-Ass','Wort-Ninja','Satz-Pirat','Regel-Ritter','Grammatik-Zauberer','Rechtschreib-Pilot','Eulen-Kapitän','Wissens-Drachenreiter','Sprach-Superstar','Wort-Weltmeister','Grammatik-Großmeister',
 'Eulen-König','Wort-Astronaut','Satz-Superheld','Regel-Rakete','Sprach-Magier','Grammatik-Titan','Wissens-Phönix','Lern-Legende','Galaxie-Genie','Universums-Eule'];
/* Level-Kurve: bis Level 20 je 100 XP. Ab Level 20 wird jede Stufe 30 XP teurer (130, 160, 190 …). */
const STEP_UNTIL=20,BASE=100,GROW=30;
const costOf=l=>l<STEP_UNTIL?BASE:BASE+(l-STEP_UNTIL+1)*GROW; // XP von Level l nach l+1
function levelInfo(xp){let l=1,rest=xp;while(rest>=costOf(l)){rest-=costOf(l);l++}return {lvl:l,into:rest,need:costOf(l)}}
const level=()=>levelInfo(S.xp).lvl;
const titleOf=l=>TITLES[Math.min(l-1,TITLES.length-1)];
const BADGES=[
 {id:'first',icon:'🎉',name:'Erster Sieg',desc:'Eine Welt geschafft'},
 {id:'combo5',icon:'🔥',name:'Heiße Serie',desc:'5 richtig am Stück'},
 {id:'combo10',icon:'☄️',name:'Unaufhaltsam',desc:'10 richtig am Stück'},
 {id:'perfect',icon:'💎',name:'Perfekt',desc:'3 Sterne in einer Welt'},
 {id:'all',icon:'🗺️',name:'Weltenbummler',desc:'Alle Welten eines Lernpakets'},
 {id:'boss',icon:'🐉',name:'Boss-Bezwinger',desc:'Einen Endgegner besiegt'},
 {id:'stars',icon:'🌟',name:'Sternen-Sammler',desc:'Alle Sterne eines Lernpakets'},
 {id:'q50',icon:'📚',name:'Fleißig',desc:'50 Fragen beantwortet'},
 {id:'q150',icon:'🧠',name:'Superhirn',desc:'150 Fragen beantwortet'},
 {id:'q500',icon:'🚀',name:'Lern-Rakete',desc:'500 Fragen beantwortet'},
 {id:'packs3',icon:'🎒',name:'Vielseitig',desc:'3 Lernpakete geschafft'}
];
function grant(id){
  if(S.badges.indexOf(id)>=0)return;
  S.badges.push(id);save();
  const b=BADGES.find(x=>x.id===id);if(Q)Q.newBadges.push(b);
  setTimeout(()=>{toast(b.icon,`Abzeichen: ${b.name}!`);sfx('level')},400);
}
const allWorlds=m=>m.boss?m.worlds.concat([bossWorld(m)]):m.worlds;
const maxStars=m=>allWorlds(m).length*3;
const packStars=m=>allWorlds(m).reduce((a,w)=>a+getStars(m,w),0);
const totalStars=()=>LernApp.modules.reduce((a,m)=>a+packStars(m),0);
function bossWorld(m){
  const b=m.boss;
  return {id:'boss',isBoss:true,name:b.name||'Endgegner',icon:b.icon||'🐉',color:b.color||'#dc2626',color2:b.color2||'#f97316',
    topic:b.topic||`Alles gemischt! ${b.count||15} Fragen, ${b.lives||3} Leben.`,count:b.count||15,lives:b.lives||3};
}

/* ================= Effects ================= */
let AC=null;
function sfx(t){
  if(!S.sound)return;
  try{
    AC=AC||new (window.AudioContext||window.webkitAudioContext)();
    if(AC.state==='suspended')AC.resume();
    const seq={good:[[660,0],[990,.09]],bad:[[260,0],[200,.14]],level:[[523,0],[659,.1],[784,.2],[1046,.3]],win:[[523,0],[659,.13],[784,.26],[1046,.39],[1318,.55]],combo:[[784,0],[988,.07],[1175,.14]]}[t];
    seq.forEach(p=>{
      const f=p[0],d=p[1],o=AC.createOscillator(),g=AC.createGain(),t0=AC.currentTime+d;
      o.type=t==='bad'?'square':'triangle';o.frequency.value=f;
      g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(t==='bad'?.06:.2,t0+.02);g.gain.exponentialRampToValueAtTime(.0001,t0+.28);
      o.connect(g);g.connect(AC.destination);o.start(t0);o.stop(t0+.3);
    });
  }catch(e){}
}
const cv=$('#fx'),cx=cv.getContext('2d');let parts=[],running=false;
const COLORS=['#fbbf24','#f472b6','#60a5fa','#34d399','#a78bfa','#fb923c','#f87171'];
function resize(){const d=window.devicePixelRatio||1;cv.width=innerWidth*d;cv.height=innerHeight*d;cx.setTransform(d,0,0,d,0,0)}
addEventListener('resize',resize);resize();
function confetti(x,y,n,power){
  n=n||30;power=power||1;
  for(let i=0;i<n;i++)parts.push({x,y,vx:(Math.random()-.5)*14*power,vy:-(Math.random()*11+3)*power,r:Math.random()*6+4,c:rnd(COLORS),rot:Math.random()*6,vr:(Math.random()-.5)*.4,life:100+Math.random()*50,round:Math.random()<.4});
  if(!running){running=true;requestAnimationFrame(tick)}
}
function bigConfetti(){for(let k=0;k<6;k++)setTimeout(()=>confetti(innerWidth*(.1+Math.random()*.8),innerHeight*.35,45,1.3),k*180)}
function tick(){
  cx.clearRect(0,0,innerWidth,innerHeight);
  parts=parts.filter(p=>p.life>0&&p.y<innerHeight+40);
  parts.forEach(p=>{p.vy+=.35;p.vx*=.99;p.x+=p.vx;p.y+=p.vy;p.rot+=p.vr;p.life--;
    cx.save();cx.translate(p.x,p.y);cx.rotate(p.rot);cx.globalAlpha=Math.min(1,p.life/30);cx.fillStyle=p.c;
    if(p.round){cx.beginPath();cx.arc(0,0,p.r/2,0,7);cx.fill()}else cx.fillRect(-p.r/2,-p.r/4,p.r,p.r/2);cx.restore();});
  if(parts.length)requestAnimationFrame(tick);else{running=false;cx.clearRect(0,0,innerWidth,innerHeight)}
}
function floatXP(el,txt){
  const r=el.getBoundingClientRect();const d=document.createElement('div');
  d.className='floatxp';d.textContent=txt;d.style.left=(r.left+r.width/2)+'px';d.style.top=(r.top-10)+'px';
  document.body.appendChild(d);setTimeout(()=>d.remove(),1200);
}
function toast(icon,text){
  const d=document.createElement('div');d.className='toast';d.innerHTML=`<span class="ti">${icon}</span>${text}`;
  document.body.appendChild(d);setTimeout(()=>d.remove(),2900);
}
function comboPop(text){
  const d=document.createElement('div');d.className='combopop';d.textContent=text;document.body.appendChild(d);setTimeout(()=>d.remove(),1300);
}
function modal(html,closeOnBg){
  const m=document.createElement('div');m.className='modal';
  if(closeOnBg)m.onclick=e=>{if(e.target===m)m.remove()};
  m.innerHTML=`<div class="sheet">${html}</div>`;document.body.appendChild(m);return m;
}

/* ================= Routing ================= */
const PREFIX='lernpaket-';
let CUR=null; // aktuelles Lernpaket
function route(){
  Q=null;
  const h=location.hash.slice(1);
  const m=h.indexOf(PREFIX)===0?LernApp.modules.find(x=>x.id===h.slice(PREFIX.length)):null;
  if(m){CUR=m;renderPack(m)}else{CUR=null;renderHome()}
}
function go(id){const h=id?'#'+PREFIX+id:'';if(location.hash===h||(!h&&!location.hash))route();else location.hash=h}
addEventListener('hashchange',route);

/* ================= Home ================= */
function statsHTML(){
  const L=levelInfo(S.xp),lvl=L.lvl,pct=Math.round(L.into/L.need*100);
  return `<div class="stats">
    <div class="lvl"><div class="lvlbadge" data-l="${lvl}" style="--p:${pct}%"></div>
      <div style="flex:1"><div class="lvltitle">Level ${lvl} · ${titleOf(lvl)}</div><div class="xpbar"><div style="width:${pct}%"></div></div><div class="xptext">${L.into} / ${L.need} XP bis Level ${lvl+1}${lvl>=STEP_UNTIL?' · ab jetzt wird jedes Level schwerer! 💪':''}</div></div></div>
    <div class="chips"><span title="Sterne">⭐ ${totalStars()}</span><span title="Beste Serie">🔥 ${S.bestCombo}</span><span title="Richtige Antworten">✅ ${S.correct}</span></div>
  </div>`;
}
function packCard(m,i){
  const st=packStars(m),mx=maxStars(m);
  return `<button class="pack ${isDone(m)?'done':''}" style="--wc:${m.color||'#7c3aed'};animation-delay:${i*.06}s" onclick="LernApp.go('${m.id}')">
    <div class="pi">${m.icon||'📘'}</div>
    <div class="pb"><div class="ps">${esc(m.subject||'')}</div><div class="pn">${esc(m.title)}</div>
      ${m.subtitle?`<div class="pd">${esc(m.subtitle)}</div>`:''}
      <div class="pbar2"><div style="width:${Math.round(st/mx*100)}%"></div></div>
      <div class="pmeta"><span>⭐ ${st} / ${mx}</span>${dateChip(m)}</div></div></button>`;
}
function sortPacks(list){
  return list.slice().sort((a,b)=>{const da=daysUntil(a.date),db=daysUntil(b.date);
    if(da===null&&db===null)return 0;if(da===null)return 1;if(db===null)return -1;return da-db});
}
function badgesHTML(){
  return `<div class="section"><h3>🏅 Abzeichen (${S.badges.length}/${BADGES.length})</h3><div class="bgrid">${BADGES.map(b=>`<div class="badge ${S.badges.indexOf(b.id)>=0?'got':''}"><div class="bi">${b.icon}</div><div class="bn">${b.name}</div><div class="bd">${b.desc}</div></div>`).join('')}</div></div>`;
}
function renderHome(){
  const active=sortPacks(LernApp.modules.filter(m=>!isDone(m)));
  const done=sortPacks(LernApp.modules.filter(isDone)).reverse();
  const next=active.find(m=>daysUntil(m.date)!==null);
  const greet=next?`${countdownText(next)} <br><small>(${esc(next.title)} · ${fmtDate(next.date)})</small>`:'Wähle ein Lernpaket und sammle Sterne!';
  app.innerHTML=`
  <div class="title">Lern-Eule<small>Deine Lern-App</small></div>
  <div class="hero"><div class="mascot">🦉</div><div class="bubble">Hallo ${S.name?`<b>${esc(S.name)}</b>`:'Lern-Held'}! ${greet}</div></div>
  <div class="namebar">Ich heiße <input value="${esc(S.name)}" placeholder="Dein Name" maxlength="16" onchange="LernApp._setName(this.value)"></div>
  ${statsHTML()}
  <div class="stitle">📚 Lernpakete</div>
  <div class="packs">${active.length?active.map(packCard).join(''):'<div class="empty">Gerade steht nichts an. 🎉</div>'}</div>
  ${done.length?`<div class="stitle">✅ Schon geschrieben</div><div class="packs">${done.map(packCard).join('')}</div>`:''}
  ${badgesHTML()}
  <div class="footer"><button class="btn ghost" onclick="LernApp._toggleSound()">${S.sound?'🔊 Ton an':'🔇 Ton aus'}</button><button class="btn ghost" onclick="LernApp._resetAsk()">↺ Neu starten</button></div>`;
  scrollTo(0,0);
}

/* ================= Lernpaket ================= */
function worldCard(m,w,i,locked){
  const st=getStars(m,w);
  return `<button class="world ${w.isBoss?'boss':''} ${locked?'locked':''}" style="--wc:${w.color};--wc2:${w.color2||w.color};animation-delay:${i*.08}s" onclick="${locked?`LernApp._locked()`:`LernApp.start('${w.id}')`}">
    <div class="wi">${locked?'🔒':w.icon}</div><div class="wn">${esc(w.name)}</div><div class="wt">${w.topic||''}</div>
    <div class="ws">${[1,2,3].map(n=>`<span class="${n<=st?'':'off'}">⭐</span>`).join('')}</div>
    <div class="play">${locked?'Gesperrt':st?'Nochmal ▶':'Los ▶'}</div></button>`;
}
function renderPack(m){
  const bossLocked=!m.worlds.every(w=>getStars(m,w)>0);
  const hasRules=m.worlds.some(w=>w.rules);
  app.innerHTML=`
  <div class="topbar"><button class="iconbtn" onclick="LernApp.go()" aria-label="Zurück">‹</button>
    <h1>${m.icon||''} ${esc(m.title)}<small>${esc(m.subject||'')}${m.date?' · '+fmtDate(m.date):''}</small></h1></div>
  <div class="hero"><div class="mascot">🦉</div><div class="bubble">${countdownText(m)}</div></div>
  ${statsHTML()}
  <div class="worlds">${m.worlds.map((w,i)=>worldCard(m,w,i,false)).join('')}${m.boss?worldCard(m,bossWorld(m),m.worlds.length,bossLocked):''}</div>
  ${badgesHTML()}
  <div class="footer">${hasRules?`<button class="btn ghost" onclick="LernApp._cheat()">📜 Spickzettel</button>`:''}<button class="btn ghost" onclick="LernApp.go()">🏠 Alle Lernpakete</button></div>`;
  scrollTo(0,0);
}
function cheat(){
  const m=CUR;
  modal(`<h2>📜 Spickzettel</h2>${m.worlds.filter(w=>w.rules).map(w=>`<div class="rule" style="--wc:${w.color}"><h4>${w.icon} ${esc(w.name)}</h4>${w.rules}</div>`).join('')}
  <button class="btn primary" style="width:100%" onclick="this.closest('.modal').remove()">Alles klar!</button>`,true);
}
function resetAsk(){
  modal(`<div style="text-align:center"><h2>Alles zurücksetzen?</h2><p style="margin-bottom:16px;font-size:18px">Sterne, XP und Abzeichen werden gelöscht.</p>
  <div class="rbtns"><button class="btn" onclick="this.closest('.modal').remove()">Abbrechen</button><button class="btn primary" onclick="LernApp._reset(this)">Ja, neu starten</button></div></div>`);
}

/* ================= Quiz ================= */
let Q=null;
const PRAISE=['Super!','Klasse!','Richtig! 🎯','Stark!','Genau!','Wow, toll!','Spitze!','Bravo!','Treffer!'];
const OOPS=['Fast!','Nicht ganz …','Knapp daneben!','Upps!'];
function mix(cats,n){
  const sh=cats.map(c=>shuffle(c));const out=[];let i=0;
  while(out.length<n&&sh.some(c=>c.length)){const c=sh[i%sh.length];if(c.length)out.push(c.pop()());i++}
  return shuffle(out);
}
function start(wid){
  const m=CUR;const w=allWorlds(m).find(x=>x.id===wid);if(!w)return;
  const qs=w.isBoss?mix(m.worlds.map(x=>[].concat.apply([],x.cats())),w.count):mix(w.cats(),w.count||m.questionsPerWorld||10);
  Q={m,w,isBoss:!!w.isBoss,qs,i:0,errors:0,streak:0,maxStreak:0,xpGain:0,retry:[],inRetry:false,hearts:w.lives||0,lives:w.lives||0,total:qs.length,newBadges:[]};
  renderQ();
}
function heartsHTML(){return '❤️'.repeat(Math.max(Q.hearts,0))+'🖤'.repeat(Q.lives-Math.max(Q.hearts,0))}
function renderQ(){
  if(Q.i>=Q.qs.length){
    if(!Q.isBoss&&Q.retry.length){Q.qs=Q.retry;Q.retry=[];Q.i=0;Q.inRetry=true;toast('🔁','Fehler-Runde: die kniffligen nochmal!')}
    else return finish(false);
  }
  const q=Q.qs[Q.i],w=Q.w;Q.locked=false;
  Q.opts=q.fixed?q.options:shuffle(q.options);
  const pct=Math.round(Q.i/Q.qs.length*100);
  app.innerHTML=`<div style="--wc:${w.color};--wc2:${w.color2||w.color}">
   <div class="qtop"><button class="iconbtn" onclick="LernApp._quit()" aria-label="Beenden">✕</button>
    <div class="pbar"><div class="pfill" style="width:${pct}%"></div></div>
    ${Q.isBoss?`<div class="hearts">${heartsHTML()}</div>`:''}
    <div class="streak ${Q.streak>=3?'hot':''}">🔥 ${Q.streak}</div></div>
   <div class="qmeta"><span>${w.icon} ${Q.inRetry?'Fehler-Runde':esc(w.name)}</span><span>Frage ${Q.i+1} / ${Q.qs.length}</span></div>
   <div class="qcard pop" id="qcard"><div class="qtask">${q.task||''}</div><div class="qprompt">${q.prompt}</div>
    <div class="opts ${q.big?'big':''} n${Q.opts.length}">${Q.opts.map((o,i)=>`<button class="opt" onclick="LernApp._answer(${i})"><span class="key">${i+1}</span>${esc(o)}</button>`).join('')}</div></div>
   <div id="fb"></div></div>`;
  scrollTo({top:0,behavior:'smooth'});
}
function answer(i){
  if(!Q||Q.locked)return;Q.locked=true;
  const q=Q.qs[Q.i],ok=Q.opts[i]===q.answer;
  const btns=Array.prototype.slice.call(document.querySelectorAll('.opt')),btn=btns[i];
  btns.forEach((b,j)=>{b.disabled=true;if(Q.opts[j]===q.answer)b.classList.add('right')});
  document.querySelectorAll('.gap').forEach(g=>{g.textContent=q.fill||q.answer;g.classList.add(ok?'gap-ok':'gap-bad')});
  S.answered++;
  if(ok){
    S.correct++;
    Q.streak++;Q.maxStreak=Math.max(Q.maxStreak,Q.streak);
    const gain=10+Math.min(Q.streak-1,5)*2;
    const before=level();S.xp+=gain;Q.xpGain+=gain;
    floatXP(btn,'+'+gain+' XP');sfx('good');
    const r=btn.getBoundingClientRect();confetti(r.left+r.width/2,r.top+r.height/2,22,.8);
    if([3,5,10,15,20].indexOf(Q.streak)>=0){const sk=Q.streak;setTimeout(()=>{comboPop(`🔥 ${sk}er-Serie!`);sfx('combo')},250)}
    if(level()>before){const l=level();setTimeout(()=>{toast('⬆️',`Level ${l}: ${titleOf(l)}!`);sfx('level');bigConfetti()},600)}
    if(Q.streak>=5)grant('combo5');if(Q.streak>=10)grant('combo10');
  }else{
    btn.classList.add('wrong');const c=$('#qcard');c.classList.remove('pop');void c.offsetWidth;c.classList.add('shake');
    sfx('bad');Q.streak=0;
    if(Q.isBoss)Q.hearts--;else{if(!Q.inRetry)Q.errors++;Q.retry.push(q)}
  }
  S.bestCombo=Math.max(S.bestCombo,Q.streak);
  if(S.answered>=50)grant('q50');if(S.answered>=150)grant('q150');if(S.answered>=500)grant('q500');
  save();
  const st=document.querySelector('.streak');if(st){st.textContent='🔥 '+Q.streak;st.classList.toggle('hot',Q.streak>=3)}
  const h=document.querySelector('.hearts');if(h)h.textContent=heartsHTML();
  const dead=Q.isBoss&&Q.hearts<=0;
  $('#fb').innerHTML=`<div class="fb ${ok?'ok':'no'}"><div class="fbhead"><span class="owl">🦉</span><div>
    <div class="fbtitle">${ok?rnd(PRAISE):rnd(OOPS)}</div>${ok&&Q.streak>=3?`<span class="combo">🔥 ${Q.streak} richtig am Stück</span>`:''}${!ok?`<div style="color:var(--muted)">Die richtige Antwort ist grün. ${Q.isBoss?'':'Die Frage kommt später nochmal!'}</div>`:''}</div></div>
    ${q.explain?`<div class="explain">${q.explain}</div>`:''}
    <button class="btn next" onclick="LernApp._next()">${dead?'Oh nein … ➜':'Weiter ➜'}</button></div>`;
  setTimeout(()=>{const f=$('#fb .fb');if(f&&f.getBoundingClientRect().bottom>innerHeight)f.scrollIntoView({behavior:'smooth',block:'end'})},150);
  const pf=document.querySelector('.pfill');if(pf)pf.style.width=Math.round((Q.i+1)/Q.qs.length*100)+'%';
}
function next(){
  if(!Q)return;
  if(Q.isBoss&&Q.hearts<=0)return finish(true);
  Q.i++;renderQ();
}
function finish(lost){
  const m=Q.m,w=Q.w;let stars;
  if(Q.isBoss)stars=lost?0:Math.max(1,Math.round(Q.hearts/Q.lives*3));else stars=Q.errors===0?3:Q.errors<=2?2:1;
  const k=starKey(m,w);if(stars>(S.stars[k]||0))S.stars[k]=stars;
  if(stars>0)grant('first');if(stars===3)grant('perfect');if(Q.isBoss&&!lost)grant('boss');
  if(m.worlds.every(x=>getStars(m,x)>0))grant('all');
  if(packStars(m)>=maxStars(m))grant('stars');
  if(LernApp.modules.filter(p=>p.worlds.every(x=>getStars(p,x)>0)).length>=3)grant('packs3');
  save();
  const firstTry=Q.isBoss?Q.total-(Q.lives-Math.max(Q.hearts,0)):Q.total-Q.errors;
  let emoji,title,msg;
  const bn=esc(w.name);
  if(lost){emoji=w.icon;title=`${bn} war stärker …`;msg='Kein Problem! Schau dir den Spickzettel an und probier es nochmal.'}
  else if(Q.isBoss){emoji='🏆';title=`${bn} besiegt!`;msg='Wahnsinn! Du bist bereit für den Test!'}
  else if(stars===3){emoji='🤩';title='Perfekt!';msg='Kein einziger Fehler – Wahnsinn!'}
  else if(stars===2){emoji='😎';title='Sehr gut!';msg='Fast perfekt! Schaffst du beim nächsten Mal 3 Sterne?'}
  else{emoji='💪';title='Geschafft!';msg='Übung macht den Meister – versuch es gleich nochmal!'}
  const bossNow=!Q.isBoss&&m.boss&&m.worlds.every(x=>getStars(m,x)>0)&&!S.stars[m.id+'/boss'];
  const bw=m.boss?bossWorld(m):null;
  app.innerHTML=`<div class="result" style="--wc:${w.color}">
    <div class="re">${emoji}</div><h2>${title}</h2><p>${msg}</p>
    <div class="stars">${[1,2,3].map(n=>`<span class="star ${n<=stars?'on':''}" style="animation-delay:${.2+n*.3}s">★</span>`).join('')}</div>
    <div class="rstats"><div>${firstTry} / ${Q.total}<small>beim 1. Versuch richtig</small></div><div>+${Q.xpGain} XP<small>gesammelt</small></div><div>🔥 ${Q.maxStreak}<small>beste Serie</small></div></div>
    ${Q.newBadges.length?`<p><b>Neue Abzeichen!</b></p><div class="newbadges">${Q.newBadges.map(b=>`<div class="badge got"><div class="bi">${b.icon}</div><div class="bn">${b.name}</div></div>`).join('')}</div>`:''}
    ${bossNow?`<p style="margin-top:12px;color:#dc2626;font-weight:600">${bw.icon} ${esc(bw.name)} ist erwacht! Traust du dich?</p>`:''}
    <div class="rbtns"><button class="btn" onclick="LernApp.go('${m.id}')">🗺️ Zur Karte</button><button class="btn primary" onclick="LernApp.start('${bossNow?'boss':w.id}')">${bossNow?bw.icon+' Zum Endgegner':'🔁 Nochmal'}</button></div></div>`;
  [1,2,3].forEach(n=>{if(n<=stars)setTimeout(()=>{sfx('good');const s=document.querySelectorAll('.star')[n-1];if(s){const r=s.getBoundingClientRect();confetti(r.left+r.width/2,r.top+r.height/2,25,.9)}},500+n*300)});
  if(!lost){sfx('win');bigConfetti()}else sfx('bad');
  Q=null;scrollTo(0,0);
}

addEventListener('keydown',e=>{
  if(!Q||document.querySelector('.modal'))return;
  if(!Q.locked&&/^[1-9]$/.test(e.key)){const i=+e.key-1;if(i<Q.opts.length)answer(i)}
  else if(Q.locked&&(e.key==='Enter'||e.key===' ')){e.preventDefault();next()}
});

/* ================= Kein Zoomen (iOS ignoriert user-scalable=no) ================= */
['gesturestart','gesturechange','gestureend'].forEach(t=>document.addEventListener(t,e=>e.preventDefault(),{passive:false}));
document.addEventListener('touchmove',e=>{if(e.touches.length>1||(e.scale&&e.scale!==1))e.preventDefault()},{passive:false});
// Doppeltipp-Zoom verhindert touch-action:manipulation in css/app.css.

/* ================= Public API ================= */
Object.assign(LernApp,{
  go,start,
  _answer:answer,_next:next,_cheat:cheat,_resetAsk:resetAsk,
  _quit(){Q=null;route()},
  _locked(){toast('🔒','Schaffe zuerst alle Welten!')},
  _setName(v){S.name=v.trim();save();route()},
  _toggleSound(){S.sound=!S.sound;save();route()},
  _reset(btn){S=Object.assign(FRESH(),{name:S.name,sound:S.sound});save();btn.closest('.modal').remove();route()}
});

/* ================= Boot & offline ================= */
function boot(){
  route();
  if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')){
    navigator.serviceWorker.register('sw.js').then(reg=>{
      reg.addEventListener('updatefound',()=>{
        const nw=reg.installing;if(!nw)return;
        nw.addEventListener('statechange',()=>{
          if(nw.state==='installed'&&navigator.serviceWorker.controller)showUpdate();
        });
      });
    }).catch(()=>{});
  }
}
function showUpdate(){
  if(document.querySelector('.updbar'))return;
  const d=document.createElement('div');d.className='updbar';
  d.innerHTML='✨ Neue Inhalte da! <button class="btn primary">Laden</button>';
  d.querySelector('button').onclick=()=>location.reload();
  document.body.appendChild(d);
}
})();
