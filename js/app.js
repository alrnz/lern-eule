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
const flat=a=>[].concat.apply([],a);
/** Bis zu 3 falsche Antworten aus Kandidaten (ohne die richtige, ohne Doppelte). */
const pick3=(c,cands)=>shuffle(uniq(cands).filter(x=>x!==c)).slice(0,3);
/** Ersetzt ___ im Satz durch eine animierte Lücke. */
const gapIn=s=>s.replace('___','<span class="gap">?</span>');
const norm=s=>String(s).trim().replace(/\s+/g,' ');
const plain=html=>String(html).replace(/<span class="[^"]*gap[^"]*">[^<]*<\/span>/g,' ___ ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();

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
const FRESH=()=>({name:'',xp:0,stars:{},badges:[],answered:0,correct:0,bestCombo:0,sound:true,gems:0,mistakes:{},days:[],blitz:{}});
let S=FRESH();
let SAVED={};
try{SAVED=JSON.parse(localStorage.getItem(KEY)||'{}')||{};Object.assign(S,SAVED)}catch(e){}
// Ältere Spielstände hatten noch keinen Zähler für richtige Antworten: aus den XP schätzen.
if(typeof SAVED.correct!=='number')S.correct=Math.min(S.answered,Math.round(S.xp/14));
['mistakes','blitz'].forEach(k=>{if(!S[k]||typeof S[k]!=='object')S[k]={}});
if(!Array.isArray(S.days))S.days=[];
if(typeof S.gems!=='number')S.gems=0;
if(!Array.isArray(S.seen))S.seen=[]; // schon angekündigte Freischaltungen
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
const starKey=(m,w)=>m.id+'/'+w.id;
const getStars=(m,w)=>S.stars[starKey(m,w)]||0;
const mist=m=>S.mistakes[m.id]||(S.mistakes[m.id]={});

/* ================= Dates ================= */
function parseDate(d){if(!d)return null;const p=d.split('-').map(Number);return new Date(p[0],p[1]-1,p[2])}
const dkey=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const today0=()=>{const t=new Date();t.setHours(0,0,0,0);return t};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
function daysUntil(d){const x=parseDate(d);return x?Math.round((x-today0())/864e5):null}
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
/* Freischalten nach Datum: m.unlock={chest:'JJJJ-MM-TT',…}. Ohne Eintrag sofort offen. */
const openDate=(m,id)=>m.unlock&&m.unlock[id]?m.unlock[id]:null;
const isOpen=(m,id)=>{const d=openDate(m,id);return !d||daysUntil(d)<=0};
function whenText(d){
  const n=daysUntil(d);
  if(n===1)return 'morgen';if(n===2)return 'übermorgen';
  return 'am '+parseDate(d).toLocaleDateString('de-DE',{weekday:'long'});
}
const played=d=>S.days.indexOf(dkey(d))>=0;

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
 {id:'perfect',icon:'✨',name:'Perfekt',desc:'3 Sterne in einer Welt'},
 {id:'all',icon:'🗺️',name:'Weltenbummler',desc:'Alle Welten eines Lernpakets'},
 {id:'boss',icon:'🐉',name:'Boss-Bezwinger',desc:'Einen Endgegner besiegt'},
 {id:'gold',icon:'👑',name:'Gold-Bezwinger',desc:'Den goldenen Endgegner besiegt'},
 {id:'exam',icon:'✍️',name:'Prüfungs-Profi',desc:'Probetest mit 3 Sternen'},
 {id:'gems10',icon:'💎',name:'Schatzsucher',desc:'10 Edelsteine gesammelt'},
 {id:'blitz15',icon:'⚡',name:'Blitzmerker',desc:'15 richtig in einer Blitzrunde'},
 {id:'daily',icon:'📅',name:'Dranbleiber',desc:'3 Tage vor dem Test jeden Tag geübt'},
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

/* ================= Spezial-Welten ================= */
const hasWrite=m=>m.worlds.some(w=>w.write);
function bossW(m){
  const b=m.boss;
  return {id:'boss',kind:'boss',name:b.name||'Endgegner',icon:b.icon||'🐉',color:b.color||'#dc2626',color2:b.color2||'#f97316',
    topic:b.topic||`Alles gemischt! ${b.count||15} Fragen, ${b.lives||3} Leben.`,count:b.count||15,lives:b.lives||3};
}
function goldW(m){
  return {id:'gold',kind:'boss',gold:true,name:'Goldener '+(m.boss.name||'Endgegner'),icon:'🐲',color:'#b45309',color2:'#facc15',
    topic:'Nur 1 Leben! 20 Fragen. Für echte Profis.',count:20,lives:1};
}
const examW=m=>({id:'exam',kind:'exam',name:'Probetest',icon:'✍️',color:'#0f766e',color2:'#14b8a6',topic:'Antworten selbst schreiben – wie im echten Test!',count:m.examCount||12});
const chestW=()=>({id:'chest',kind:'chest',name:'Fehler-Schatzkiste',icon:'💎',color:'#be185d',color2:'#ec4899',topic:'Deine kniffligen Fragen. 2× richtig = 1 Edelstein!'});
const blitzW=()=>({id:'blitz',kind:'blitz',name:'Blitzrunde',icon:'⚡',color:'#1d4ed8',color2:'#3b82f6',topic:'60 Sekunden – so viele richtig wie möglich!',seconds:60});
/** Welten mit Sternen */
const starWorlds=m=>m.worlds.concat(m.boss?[bossW(m),goldW(m)]:[]).concat(hasWrite(m)?[examW(m)]:[]);
const maxStars=m=>starWorlds(m).length*3;
const packStars=m=>starWorlds(m).reduce((a,w)=>a+getStars(m,w),0);
const totalStars=()=>LernApp.modules.reduce((a,m)=>a+packStars(m),0);
function findWorld(m,id){
  return m.worlds.find(x=>x.id===id)||[m.boss?bossW(m):null,m.boss?goldW(m):null,hasWrite(m)?examW(m):null,chestW(),blitzW()].find(x=>x&&x.id===id);
}

/* ================= Fragen-Pools (mit Schlüssel für die Schatzkiste) ================= */
const tag=(q,w,key)=>{q.key=key;q.wid=w.id;return q};
const pool=w=>w.cats().map((c,ci)=>c.map((f,ii)=>()=>tag(f(),w,`${w.id}:c${ci}:${ii}`)));
const writePool=w=>w.write?w.write().map((f,ii)=>()=>tag(f(),w,`${w.id}:w:${ii}`)):[];
function byKey(m,key){
  const p=key.split(':'),w=m.worlds.find(x=>x.id===p[0]);if(!w)return null;
  let f=null;
  if(p[1]==='w'){const l=w.write?w.write():[];f=l[+p[2]]}
  else{const c=w.cats()[+p[1].slice(1)];f=c?c[+p[2]]:null}
  return f?()=>tag(f(),w,key):null;
}
const chestCount=m=>Object.keys(mist(m)).length;

/* ================= Effects ================= */
let AC=null;
function sfx(t){
  if(!S.sound)return;
  try{
    AC=AC||new (window.AudioContext||window.webkitAudioContext)();
    if(AC.state==='suspended')AC.resume();
    const seq={good:[[660,0],[990,.09]],bad:[[260,0],[200,.14]],level:[[523,0],[659,.1],[784,.2],[1046,.3]],win:[[523,0],[659,.13],[784,.26],[1046,.39],[1318,.55]],combo:[[784,0],[988,.07],[1175,.14]],gem:[[1046,0],[1318,.08],[1568,.16],[2093,.24]],tick:[[880,0]]}[t];
    seq.forEach(p=>{
      const f=p[0],d=p[1],o=AC.createOscillator(),g=AC.createGain(),t0=AC.currentTime+d;
      o.type=t==='bad'?'square':'triangle';o.frequency.value=f;
      g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(t==='bad'?.06:t==='tick'?.08:.2,t0+.02);g.gain.exponentialRampToValueAtTime(.0001,t0+.28);
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
  stopTimer();Q=null;
  if(tryReload())return;
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
    <div class="chips"><span title="Sterne">⭐ ${totalStars()}</span><span title="Beste Serie">🔥 ${S.bestCombo}</span><span title="Richtige Antworten">✅ ${S.correct}</span>${S.gems?`<span title="Edelsteine">💎 ${S.gems}</span>`:''}</div>
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

/* ================= Tages-Serie ================= */
const WD=['So','Mo','Di','Mi','Do','Fr','Sa'];
function stripRange(m){
  const end=parseDate(m.date);if(!end||end<today0())return null;
  let start=today0();const min=addDays(end,-6);
  S.days.forEach(k=>{const d=parseDate(k);if(d<start&&d>=min)start=d});
  return {start,end};
}
function dayStrip(m){
  const r=stripRange(m);if(!r)return '';
  const t=today0();let html='',n=0,d=r.start;
  while(d<=r.end){
    const isTest=+d===+r.end,isToday=+d===+t,did=played(d);if(did)n++;
    const cls=did?'did':isToday?'today':d<t?'miss':'future';
    const icon=did?'🔥':isTest?'📝':isToday?'⭐':d<t?'💤':'·';
    html+=`<div class="day ${cls} ${isTest?'test':''}"><small>${isToday?'Heute':WD[d.getDay()]}</small><span>${icon}</span></div>`;
    d=addDays(d,1);
  }
  const msg=played(t)?`<b>${n} ${n===1?'Tag':'Tage'}</b> geübt – super, morgen wieder!`:'Spiel heute eine Runde für deine Flamme 🔥';
  return `<div class="section daystrip"><h3>📅 Dein Weg bis zum Test</h3><div class="days">${html}</div><div class="dmsg">${msg}</div></div>`;
}
function markDay(m){
  const k=dkey(today0());if(S.days.indexOf(k)<0)S.days.push(k);
  const end=parseDate(m.date);
  if(end&&daysUntil(m.date)>=0){
    const need=[1,2,3].map(n=>addDays(end,-n));
    if(need.every(played))grant('daily');
  }
}

/* ================= Lernpaket ================= */
function worldCard(m,w,i,locked,lockMsg){
  const st=getStars(m,w),hasStars=w.kind!=='chest'&&w.kind!=='blitz';
  let extra='';
  if(w.kind==='chest'){const c=chestCount(m);extra=`<div class="wx">${c?`${c} knifflige ${c===1?'Frage':'Fragen'} · 💎 ${S.gems}`:'Noch leer – super! 💎 '+S.gems}</div>`}
  if(w.kind==='blitz'){const b=S.blitz[m.id]||0;extra=`<div class="wx">🏆 Rekord: ${b}</div>`}
  const empty=w.kind==='chest'&&!chestCount(m);
  const click=locked?`LernApp._locked('${esc(lockMsg||'')}')`:empty?`LernApp._locked('Die Schatzkiste füllt sich mit Fragen, die du falsch hattest.')`:`LernApp.start('${w.id}')`;
  return `<button class="world ${w.kind||''} ${w.gold?'goldw':''} ${locked?'locked':''}" style="--wc:${w.color};--wc2:${w.color2||w.color};animation-delay:${i*.06}s" onclick="${click}">
    <div class="wi">${locked?'🔒':w.icon}</div><div class="wn">${esc(w.name)}</div><div class="wt">${w.topic||''}</div>
    ${hasStars?`<div class="ws">${[1,2,3].map(n=>`<span class="${n<=st?'':'off'}">⭐</span>`).join('')}</div>`:extra}
    <div class="play">${locked?'Gesperrt':empty?'Leer':st?'Nochmal ▶':'Los ▶'}</div></button>`;
}
function mysteryCard(m,w,i){
  const t=whenText(openDate(m,w.id));
  return `<button class="world mystery" style="--wc:#475569;--wc2:#64748b;animation-delay:${i*.06}s" onclick="LernApp._locked('Psst … diese Mission öffnet sich ${t}! 🤫')">
    <div class="wi">🎁</div><div class="wn">Geheime Mission</div><div class="wt">Wird ${t} freigeschaltet. Schau dann unbedingt vorbei!</div>
    <div class="wx">🔒 ${cap(t)}</div><div class="play">???</div></button>`;
}
function announceUnlocks(m){
  const fresh=[chestW(),blitzW(),m.boss?goldW(m):null,hasWrite(m)?examW(m):null].filter(w=>w&&openDate(m,w.id)&&isOpen(m,w.id)&&S.seen.indexOf(m.id+'/'+w.id)<0);
  if(!fresh.length)return;
  fresh.forEach(w=>S.seen.push(m.id+'/'+w.id));save();
  setTimeout(()=>{
    modal(`<div style="text-align:center"><div style="font-size:70px;animation:bob 1.6s ease-in-out infinite">🎁</div><h2>Neue ${fresh.length===1?'Mission':'Missionen'} freigeschaltet!</h2>
    ${fresh.map(w=>`<div class="rule" style="--wc:${w.color}"><h4>${w.icon} ${esc(w.name)}</h4>${w.topic}</div>`).join('')}
    <button class="btn primary" style="width:100%" onclick="this.closest('.modal').remove()">Los geht's! 🚀</button></div>`);
    sfx('win');bigConfetti();
  },500);
}
function renderPack(m){
  const allDone=m.worlds.every(w=>getStars(m,w)>0);
  const bossDone=m.boss&&getStars(m,bossW(m))>0;
  const hasRules=m.worlds.some(w=>w.rules);
  const special=[];
  const sp=(w,i,locked,msg)=>special.push(isOpen(m,w.id)?worldCard(m,w,i,locked,msg):mysteryCard(m,w,i));
  sp(chestW(),0,false);
  sp(blitzW(),1,false);
  if(m.boss)sp(goldW(m),2,!bossDone,'Besiege zuerst '+bossW(m).name+'!');
  if(hasWrite(m))sp(examW(m),3,false);
  app.innerHTML=`
  <div class="topbar"><button class="iconbtn" onclick="LernApp.go()" aria-label="Zurück">‹</button>
    <h1>${m.icon||''} ${esc(m.title)}<small>${esc(m.subject||'')}${m.date?' · '+fmtDate(m.date):''}</small></h1></div>
  <div class="hero"><div class="mascot">🦉</div><div class="bubble">${countdownText(m)}</div></div>
  ${statsHTML()}
  ${dayStrip(m)}
  <div class="stitle">🗺️ Welten</div>
  <div class="worlds">${m.worlds.map((w,i)=>worldCard(m,w,i,false)).join('')}${m.boss?worldCard(m,bossW(m),m.worlds.length,!allDone,'Schaffe zuerst alle Welten!'):''}</div>
  <div class="stitle">🎯 Spezial-Missionen</div>
  <div class="worlds">${special.join('')}</div>
  ${badgesHTML()}
  <div class="footer">${hasRules?`<button class="btn ghost" onclick="LernApp._cheat()">📜 Spickzettel</button>`:''}<button class="btn ghost" onclick="LernApp.go()">🏠 Alle Lernpakete</button></div>`;
  scrollTo(0,0);
  announceUnlocks(m);
}
function cheat(){
  const m=CUR;
  modal(`<h2>📜 Spickzettel</h2>${m.worlds.filter(w=>w.rules).map(w=>`<div class="rule" style="--wc:${w.color}"><h4>${w.icon} ${esc(w.name)}</h4>${w.rules}</div>`).join('')}
  <button class="btn primary" style="width:100%" onclick="this.closest('.modal').remove()">Alles klar!</button>`,true);
}
function resetAsk(){
  // Elternsperre: Rechenaufgabe, die ein Kind in Klasse 2–3 noch nicht im Kopf löst
  const a=12+Math.floor(Math.random()*8),b=3+Math.floor(Math.random()*7);
  const m=modal(`<div style="text-align:center"><h2>Alles zurücksetzen?</h2><p style="margin-bottom:12px;font-size:18px">Sterne, XP, Abzeichen und Edelsteine werden gelöscht. Das kann man nicht rückgängig machen!</p>
  <p style="margin-bottom:8px;font-size:16px">Nur für Eltern: Wie viel ist <b>${a} × ${b}</b>?</p>
  <form class="wform" style="justify-content:center;margin-bottom:8px" onsubmit="return false"><input id="rsum" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" placeholder="Ergebnis"></form>
  <div class="rbtns"><button class="btn" onclick="this.closest('.modal').remove()">Abbrechen</button><button class="btn primary" id="rgo">Ja, neu starten</button></div></div>`);
  const inp=m.querySelector('#rsum'),go=()=>{
    if(inp.value.trim()===String(a*b))return LernApp._reset(m.querySelector('#rgo'));
    m.remove();modal(`<div style="text-align:center"><h2>Nicht zurückgesetzt</h2><p style="margin-bottom:16px;font-size:18px">Das Ergebnis stimmt nicht. Dein Fortschritt bleibt erhalten. 🦉</p><div class="rbtns"><button class="btn primary" onclick="this.closest('.modal').remove()">OK</button></div></div>`);
  };
  m.querySelector('#rgo').onclick=go;
  m.querySelector('form').onsubmit=e=>{e.preventDefault();go();return false};
}

/* ================= Quiz ================= */
let Q=null;
const PRAISE=['Super!','Klasse!','Richtig! 🎯','Stark!','Genau!','Wow, toll!','Spitze!','Bravo!','Treffer!'];
const OOPS=['Fast!','Nicht ganz …','Knapp daneben!','Upps!'];
function mix(cats,n){
  const sh=cats.filter(c=>c.length).map(c=>shuffle(c));const out=[];let i=0;
  while(out.length<n&&sh.some(c=>c.length)){const c=sh[i%sh.length];if(c.length)out.push(c.pop()());i++}
  return shuffle(out);
}
const allChoice=m=>m.worlds.map(x=>flat(pool(x)));
function start(wid){
  const m=CUR;const w=findWorld(m,wid);if(!w||!isOpen(m,wid))return;
  stopTimer();
  const kind=w.kind||'world';let qs;
  if(kind==='boss')qs=mix(allChoice(m),w.count);
  else if(kind==='exam')qs=mix(m.worlds.map(writePool),w.count);
  else if(kind==='blitz')qs=mix(allChoice(m),60);
  else if(kind==='chest'){
    const M=mist(m),fs=[];
    Object.keys(M).forEach(k=>{const f=byKey(m,k);if(f)fs.push(f);else delete M[k]});
    qs=shuffle(fs).slice(0,10).map(f=>f());
    if(!qs.length){save();return go(m.id)}
  }
  else qs=mix(pool(w),w.count||m.questionsPerWorld||10);
  Q={m,w,kind,qs,i:0,errors:0,streak:0,maxStreak:0,xpGain:0,retry:[],inRetry:false,hearts:w.lives||0,lives:w.lives||0,
     total:qs.length,newBadges:[],wrongs:[],score:0,gemsWon:0,ok:0};
  if(kind==='blitz'){Q.end=Date.now()+w.seconds*1000;Q.timer=setInterval(blitzTick,100)}
  renderQ();
}
function stopTimer(){if(Q&&Q.timer){clearInterval(Q.timer);Q.timer=null}}
function blitzTick(){
  if(!Q||Q.kind!=='blitz')return;
  const left=Math.max(0,Q.end-Date.now()),f=$('.tfill'),t=$('.tleft');
  if(f)f.style.width=(left/(Q.w.seconds*1000)*100)+'%';
  if(t){const s=Math.ceil(left/1000);if(t.textContent!==s+'s'){t.textContent=s+'s';if(s<=5&&s>0)sfx('tick')}t.classList.toggle('urgent',s<=10)}
  if(!left&&!Q.locked)finish(false);
}
function heartsHTML(){return '❤️'.repeat(Math.max(Q.hearts,0))+'🖤'.repeat(Q.lives-Math.max(Q.hearts,0))}
function renderQ(){
  if(Q.i>=Q.qs.length){
    if(Q.kind==='world'&&Q.retry.length){Q.qs=Q.retry;Q.retry=[];Q.i=0;Q.inRetry=true;toast('🔁','Fehler-Runde: die kniffligen nochmal!')}
    else if(Q.kind==='blitz'){Q.qs=Q.qs.concat(mix(allChoice(Q.m),40))}
    else return finish(false);
  }
  const q=Q.qs[Q.i],w=Q.w;Q.locked=false;
  Q.opts=q.input?[]:q.fixed?q.options:shuffle(q.options);
  const blitz=Q.kind==='blitz';
  const pct=Math.round(Q.i/Q.qs.length*100);
  const body=q.input
    ?`<form class="wform" onsubmit="return LernApp._submit(event)"><input id="win" type="text" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" enterkeyhint="done" placeholder="Hier schreiben …"><button class="btn primary" type="submit">Prüfen</button></form><div class="whint">Achte auf Groß- und Kleinschreibung!</div>`
    :`<div class="opts ${q.big?'big':''} n${Q.opts.length}">${Q.opts.map((o,i)=>`<button class="opt" onclick="LernApp._answer(${i})"><span class="key">${i+1}</span>${esc(o)}</button>`).join('')}</div>`;
  app.innerHTML=`<div class="${w.gold?'goldq':''}" style="--wc:${w.color};--wc2:${w.color2||w.color}">
   <div class="qtop"><button class="iconbtn" onclick="LernApp._quit()" aria-label="Beenden">✕</button>
    ${blitz?`<div class="pbar"><div class="pfill tfill" style="width:${Math.max(0,Q.end-Date.now())/(w.seconds*1000)*100}%"></div></div><div class="streak tleft">${Math.ceil(Math.max(0,Q.end-Date.now())/1000)}s</div><div class="streak">⚡ ${Q.score}</div>`
      :`<div class="pbar"><div class="pfill" style="width:${pct}%"></div></div>${Q.kind==='boss'?`<div class="hearts">${heartsHTML()}</div>`:''}<div class="streak ${Q.streak>=3?'hot':''}">🔥 ${Q.streak}</div>`}</div>
   <div class="qmeta"><span>${w.icon} ${Q.inRetry?'Fehler-Runde':esc(w.name)}</span><span>${blitz?'Rekord: '+(S.blitz[Q.m.id]||0):`Frage ${Q.i+1} / ${Q.qs.length}`}</span></div>
   <div class="qcard ${blitz?'':'pop'}" id="qcard"><div class="qtask">${q.task||''}</div><div class="qprompt">${q.prompt}</div>${body}</div>
   <div id="fb"></div></div>`;
  if(!blitz)scrollTo({top:0,behavior:'smooth'});
  if(q.input){const inp=$('#win');if(inp)inp.focus()}
}
function answer(i){
  if(!Q||Q.locked||Q.qs[Q.i].input)return;
  const q=Q.qs[Q.i],ok=Q.opts[i]===q.answer;
  const btns=Array.prototype.slice.call(document.querySelectorAll('.opt'));
  btns.forEach((b,j)=>{b.disabled=true;if(Q.opts[j]===q.answer)b.classList.add('right')});
  if(!ok)btns[i].classList.add('wrong');
  judge(ok,btns[i],Q.opts[i]);
}
function submit(e){
  e.preventDefault();
  if(!Q||Q.locked)return false;
  const q=Q.qs[Q.i],inp=$('#win');const given=norm(inp.value);
  if(!given){inp.focus();return false}
  const acc=(q.accept||[q.answer]).map(norm);
  const ok=acc.indexOf(given)>=0;
  Q.caseHint=!ok&&acc.some(a=>a.toLowerCase()===given.toLowerCase());
  inp.disabled=true;inp.classList.add(ok?'right':'wrong');inp.blur();
  const b=document.querySelector('.wform button');if(b)b.disabled=true;
  judge(ok,inp,given);
  return false;
}
function judge(ok,el,given){
  Q.locked=true;
  const q=Q.qs[Q.i],m=Q.m,M=mist(m);
  document.querySelectorAll('.gap').forEach(g=>{g.textContent=q.fill||q.answer;g.classList.add(ok?'gap-ok':'gap-bad')});
  S.answered++;
  let gemMsg='';
  if(ok){
    S.correct++;Q.ok++;
    Q.streak++;Q.maxStreak=Math.max(Q.maxStreak,Q.streak);
    const gain=10+Math.min(Q.streak-1,5)*2;
    const before=level();S.xp+=gain;Q.xpGain+=gain;
    floatXP(el,'+'+gain+' XP');sfx('good');
    const r=el.getBoundingClientRect();confetti(r.left+r.width/2,r.top+r.height/2,Q.kind==='blitz'?10:22,.8);
    if(Q.kind!=='blitz'&&[3,5,10,15,20].indexOf(Q.streak)>=0){const sk=Q.streak;setTimeout(()=>{comboPop(`🔥 ${sk}er-Serie!`);sfx('combo')},250)}
    if(level()>before){const l=level();setTimeout(()=>{toast('⬆️',`Level ${l}: ${titleOf(l)}!`);sfx('level');bigConfetti()},600)}
    if(Q.streak>=5)grant('combo5');if(Q.streak>=10)grant('combo10');
    if(Q.kind==='chest'&&q.key&&q.key in M){
      M[q.key]=(M[q.key]||0)+1;
      if(M[q.key]>=2){delete M[q.key];S.gems++;Q.gemsWon++;gemMsg='💎 Edelstein gewonnen! Diese Frage kannst du jetzt.';
        setTimeout(()=>{comboPop('💎 +1 Edelstein!');sfx('gem');bigConfetti()},300);if(S.gems>=10)grant('gems10')}
      else{gemMsg='Noch 1× richtig, dann gibt es einen 💎! Die Frage kommt gleich nochmal.';Q.qs.push(q)}
    }
    if(Q.kind==='blitz')Q.score++;
  }else{
    if(Q.kind!=='blitz'){const c=$('#qcard');c.classList.remove('pop');void c.offsetWidth;c.classList.add('shake')}
    sfx('bad');Q.streak=0;Q.bad=(Q.bad||0)+1;
    if(q.key)M[q.key]=0; // ab in die Schatzkiste (bzw. dort von vorn)
    if(Q.kind==='boss')Q.hearts--;
    else if(Q.kind==='world'){if(!Q.inRetry)Q.errors++;Q.retry.push(q)}
    else if(Q.kind==='exam'){Q.errors++;Q.wrongs.push({p:plain(q.prompt),given,answer:q.answer})}
  }
  S.bestCombo=Math.max(S.bestCombo,Q.streak);
  if(S.answered>=50)grant('q50');if(S.answered>=150)grant('q150');if(S.answered>=500)grant('q500');
  save();
  if(Q.kind==='blitz'){
    const sc=document.querySelectorAll('.qtop .streak')[1];if(sc)sc.textContent='⚡ '+Q.score;
    if(!ok)$('#fb').innerHTML=`<div class="fb no blitzfb"><b>Richtig wäre:</b> ${esc(q.answer)}</div>`;
    setTimeout(()=>{if(!Q||Q.kind!=='blitz')return;if(Date.now()>=Q.end)return finish(false);Q.i++;renderQ()},ok?450:1400);
    return;
  }
  const st=document.querySelector('.streak');if(st){st.textContent='🔥 '+Q.streak;st.classList.toggle('hot',Q.streak>=3)}
  const h=document.querySelector('.hearts');if(h)h.textContent=heartsHTML();
  const dead=Q.kind==='boss'&&Q.hearts<=0;
  let sub='';
  if(!ok){
    sub=q.input?`Richtig ist: <b>${esc(q.answer)}</b>${Q.caseHint?'<br>👀 Fast! Achte auf <b>Groß- und Kleinschreibung</b>.':''}`:'Die richtige Antwort ist grün.';
    if(Q.kind==='world')sub+=' Die Frage kommt später nochmal!';
    if((Q.kind==='exam'||Q.kind==='boss')&&isOpen(m,'chest'))sub+=' Sie wandert in deine 💎 Schatzkiste.';
  }
  $('#fb').innerHTML=`<div class="fb ${ok?'ok':'no'}"><div class="fbhead"><span class="owl">🦉</span><div>
    <div class="fbtitle">${ok?rnd(PRAISE):rnd(OOPS)}</div>${ok&&Q.streak>=3?`<span class="combo">🔥 ${Q.streak} richtig am Stück</span>`:''}${sub?`<div class="fbsub">${sub}</div>`:''}</div></div>
    ${gemMsg?`<div class="gemmsg">${gemMsg}</div>`:''}
    ${q.explain?`<div class="explain">${q.explain}</div>`:''}
    <button class="btn next" onclick="LernApp._next()">${dead?'Oh nein … ➜':'Weiter ➜'}</button></div>`;
  setTimeout(()=>{const f=$('#fb .fb');if(f&&f.getBoundingClientRect().bottom>innerHeight)f.scrollIntoView({behavior:'smooth',block:'end'})},q.input?400:150);
  const pf=document.querySelector('.pfill');if(pf)pf.style.width=Math.round((Q.i+1)/Q.qs.length*100)+'%';
}
function next(){
  if(!Q||Q.kind==='blitz')return;
  if(Q.kind==='boss'&&Q.hearts<=0)return finish(true);
  Q.i++;renderQ();
}
function resultBtns(m,primaryId,primaryLabel){
  return `<div class="rbtns"><button class="btn" onclick="LernApp.go('${m.id}')">🗺️ Zur Karte</button><button class="btn primary" onclick="LernApp.start('${primaryId}')">${primaryLabel}</button></div>`;
}
function badgesNew(){
  return Q.newBadges.length?`<p><b>Neue Abzeichen!</b></p><div class="newbadges">${Q.newBadges.map(b=>`<div class="badge got"><div class="bi">${b.icon}</div><div class="bn">${b.name}</div></div>`).join('')}</div>`:'';
}
function starsRow(stars){return `<div class="stars">${[1,2,3].map(n=>`<span class="star ${n<=stars?'on':''}" style="animation-delay:${.2+n*.3}s">★</span>`).join('')}</div>`}
function finish(lost){
  stopTimer();
  const m=Q.m,w=Q.w,kind=Q.kind;
  markDay(m);
  /* ---- Blitzrunde ---- */
  if(kind==='blitz'){
    const old=S.blitz[m.id]||0,rec=Q.score>old;if(rec)S.blitz[m.id]=Q.score;
    if(Q.score>=15)grant('blitz15');save();
    app.innerHTML=`<div class="result" style="--wc:${w.color}"><div class="re">${rec?'🏆':'⚡'}</div>
      <h2>${Q.score} richtig in ${w.seconds} Sekunden!</h2>
      <p>${rec?(old?`Neuer Rekord! Vorher: ${old}`:'Dein erster Rekord!'):`Rekord: ${old} – schaffst du ihn beim nächsten Mal?`}</p>
      <div class="rstats"><div>${Q.score}<small>richtig</small></div><div>${Q.bad||0}<small>falsch</small></div><div>+${Q.xpGain} XP<small>gesammelt</small></div></div>
      <p class="challenge">👨‍👩‍👦 Fordere Mama oder Papa heraus: Wer schafft mehr?</p>
      ${badgesNew()}${resultBtns(m,'blitz','⚡ Nochmal')}</div>`;
    if(rec){sfx('win');bigConfetti()}else sfx('good');
    Q=null;scrollTo(0,0);return;
  }
  /* ---- Schatzkiste ---- */
  if(kind==='chest'){
    save();const left=chestCount(m);
    app.innerHTML=`<div class="result" style="--wc:${w.color}"><div class="re">💎</div>
      <h2>${Q.gemsWon?`${Q.gemsWon} ${Q.gemsWon===1?'Edelstein':'Edelsteine'} gewonnen!`:'Weiter so!'}</h2>
      <p>${left?`Noch ${left} knifflige ${left===1?'Frage':'Fragen'} in der Schatzkiste.`:'Die Schatzkiste ist leer – du kannst alle kniffligen Fragen! 🎉'}</p>
      <div class="rstats"><div>💎 ${S.gems}<small>Edelsteine insgesamt</small></div><div>+${Q.xpGain} XP<small>gesammelt</small></div></div>
      ${badgesNew()}${left?resultBtns(m,'chest','💎 Weiter sammeln'):`<div class="rbtns"><button class="btn primary" onclick="LernApp.go('${m.id}')">🗺️ Zur Karte</button></div>`}</div>`;
    if(Q.gemsWon){sfx('win');bigConfetti()}
    Q=null;scrollTo(0,0);return;
  }
  /* ---- Welten, Endgegner, Probetest ---- */
  let stars;
  if(kind==='boss')stars=lost?0:Math.max(1,Math.round(Q.hearts/Q.lives*3));
  else if(kind==='exam'){const p=Q.ok/Q.total;stars=p>=.9?3:p>=.75?2:1}
  else stars=Q.errors===0?3:Q.errors<=2?2:1;
  const k=starKey(m,w);if(stars>(S.stars[k]||0))S.stars[k]=stars;
  if(stars>0)grant('first');if(stars===3&&kind==='world')grant('perfect');
  if(kind==='boss'&&!lost)grant(w.gold?'gold':'boss');
  if(kind==='exam'&&stars===3)grant('exam');
  if(m.worlds.every(x=>getStars(m,x)>0))grant('all');
  if(packStars(m)>=maxStars(m))grant('stars');
  if(LernApp.modules.filter(p=>p.worlds.every(x=>getStars(p,x)>0)).length>=3)grant('packs3');
  save();
  const firstTry=kind==='boss'?Q.total-(Q.lives-Math.max(Q.hearts,0)):kind==='exam'?Q.ok:Q.total-Q.errors;
  let emoji,title,msg;
  const bn=esc(w.name);
  if(lost){emoji=w.icon;title=`${bn} war stärker …`;msg=isOpen(m,'chest')?'Kein Problem! Deine Fehler liegen jetzt in der 💎 Schatzkiste – übe sie und probier es nochmal.':'Kein Problem! Schau dir den Spickzettel an und probier es nochmal.'}
  else if(kind==='boss'){emoji=w.gold?'👑':'🏆';title=`${bn} besiegt!`;msg=w.gold?'Unglaublich – nur mit einem Leben! Du bist ein echter Profi!':'Wahnsinn! Du bist bereit für den Test!'}
  else if(kind==='exam'){emoji=stars===3?'🎓':stars===2?'😎':'💪';title=`${Q.ok} von ${Q.total} richtig`;msg=stars===3?'Wie im echten Test – und fast alles richtig! Super vorbereitet!':stars===2?'Richtig gut! Schau dir die Fehler unten an.':'Gut geübt! Schau dir die Fehler unten an und versuch es nochmal.'}
  else if(stars===3){emoji='🤩';title='Perfekt!';msg='Kein einziger Fehler – Wahnsinn!'}
  else if(stars===2){emoji='😎';title='Sehr gut!';msg='Fast perfekt! Schaffst du beim nächsten Mal 3 Sterne?'}
  else{emoji='💪';title='Geschafft!';msg='Übung macht den Meister – versuch es gleich nochmal!'}
  const bossNow=kind==='world'&&m.boss&&m.worlds.every(x=>getStars(m,x)>0)&&!S.stars[m.id+'/boss'];
  const goldNow=kind==='boss'&&!w.gold&&!lost&&!S.stars[m.id+'/gold']&&isOpen(m,'gold');
  const bw=m.boss?bossW(m):null;
  let primary=[w.id,'🔁 Nochmal'];
  if(bossNow)primary=['boss',bw.icon+' Zum Endgegner'];
  else if(goldNow)primary=['gold','🐲 Zum goldenen Gegner'];
  else if(lost&&chestCount(m)&&isOpen(m,'chest'))primary=['chest','💎 Zur Schatzkiste'];
  const wrongs=kind==='exam'&&Q.wrongs.length?`<div class="wrongs"><h3>So wäre es richtig:</h3>${Q.wrongs.map(x=>`<div class="wrong"><div class="wp">${esc(x.p)}</div><div><s>${esc(x.given)}</s> → <b>${esc(x.answer)}</b></div></div>`).join('')}</div>`:'';
  app.innerHTML=`<div class="result" style="--wc:${w.color}">
    <div class="re">${emoji}</div><h2>${title}</h2><p>${msg}</p>
    ${starsRow(stars)}
    <div class="rstats"><div>${firstTry} / ${Q.total}<small>${kind==='exam'?'richtig':'beim 1. Versuch richtig'}</small></div><div>+${Q.xpGain} XP<small>gesammelt</small></div><div>🔥 ${Q.maxStreak}<small>beste Serie</small></div></div>
    ${wrongs}${badgesNew()}
    ${bossNow?`<p class="awake">${bw.icon} ${esc(bw.name)} ist erwacht! Traust du dich?</p>`:''}
    ${goldNow?`<p class="awake gold">🐲 Ein goldener Drache ist aufgetaucht … nur 1 Leben!</p>`:''}
    ${resultBtns(m,primary[0],primary[1])}</div>`;
  [1,2,3].forEach(n=>{if(n<=stars)setTimeout(()=>{sfx('good');const s=document.querySelectorAll('.star')[n-1];if(s){const r=s.getBoundingClientRect();confetti(r.left+r.width/2,r.top+r.height/2,25,.9)}},500+n*300)});
  if(!lost){sfx('win');bigConfetti()}else sfx('bad');
  Q=null;scrollTo(0,0);
}

addEventListener('keydown',e=>{
  if(!Q||document.querySelector('.modal'))return;
  if(e.target&&e.target.tagName==='INPUT')return;
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
  _answer:answer,_submit:submit,_next:next,_cheat:cheat,_resetAsk:resetAsk,
  _quit(){stopTimer();Q=null;route()},
  _locked(msg){toast('🔒',msg||'Noch gesperrt!')},
  _setName(v){S.name=v.trim();save();route()},
  _toggleSound(){S.sound=!S.sound;save();route()},
  _reset(btn){S=Object.assign(FRESH(),{name:S.name,sound:S.sound});save();btn.closest('.modal').remove();route()},
  /** nur für tools/check.js */
  _internals:{pool,writePool,byKey,findWorld,starWorlds,cur:()=>Q}
});

/* ================= Boot & offline ================= */
function boot(){
  // Spielstände von vor der Tages-Serie: es wurde heute schon geübt (App ging erst heute online).
  if(!Array.isArray(SAVED.days)&&S.answered>0&&S.days.length===0){S.days=[dkey(today0())];save()}
  route();
  if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')){
    const sw=navigator.serviceWorker,hadCtrl=!!sw.controller;
    // Neuer Service Worker hat übernommen (skipWaiting + claim in sw.js) → neue Inhalte laden.
    sw.addEventListener('controllerchange',()=>{if(hadCtrl){UPD=true;tryReload()}});
    sw.register('sw.js').then(reg=>{
      // iOS prüft beim Zurückholen aus dem Hintergrund nicht von selbst → selbst nachfragen.
      const check=()=>{if(navigator.onLine!==false)reg.update().catch(()=>{})};
      document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){check();tryReload()}});
      addEventListener('pageshow',e=>{if(e.persisted)check()});
      setInterval(check,15*60*1000);
    }).catch(()=>{});
  }
}
/* Update erst laden, wenn gerade kein Quiz läuft und kein Fenster offen ist – sonst beim nächsten Seitenwechsel. */
var UPD=false;
function tryReload(){
  if(!UPD||Q||document.querySelector('.modal'))return false;
  UPD=false;location.reload();return true;
}
})();
