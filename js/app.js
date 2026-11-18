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
/* Code für die Server-Sicherung: zwei Wörter und eine Zahl, z. B. TIGER-MOND-472 (vorne kommt zur Anzeige der Name dazu).
   110·110·900 ≈ 11 Mio. Möglichkeiten; der Server sperrt nach vielen Fehlversuchen. */
const CODE_WORDS=('TIGER MOND STERN APFEL BIRNE WOLKE SONNE REGEN BLITZ DRACHE ADLER BIBER DACHS ESEL FUCHS GANS HASE IGEL KATZE LAMA '+
  'PANDA PONY RABE ROBBE SCHAF SPATZ WAL WOLF ZEBRA ELCH OTTER KOALA AFFE BIENE HUMMEL DELFIN PINGUIN EULE HAI KRAKE '+
  'QUALLE FALKE SCHWAN ENTE HUHN KUH PFERD ZIEGE MAUS FROSCH SCHNECKE RAUPE BAUM BLATT BLUME ROSE TULPE KAKTUS NUSS KIRSCHE '+
  'MELONE BANANE ZITRONE MANGO KIWI TOMATE BOHNE ERBSE KEKS TORTE WAFFEL BREZEL HONIG NUDEL PIZZA BALL KRONE SCHATZ ANKER SCHIFF '+
  'BOOT RAKETE KOMET PLANET INSEL BERG WALD WIESE BACH MEER WELLE STRAND MUSCHEL PERLE FEDER KERZE LAMPE GLOCKE TROMMEL GEIGE '+
  'HARFE PINSEL KREIDE BUCH ROLLER SCHLITTEN IGLU SCHNEE NEBEL WIND').split(' ');
const CODE_RE=/^[A-Z]{2,12}-[A-Z]{2,12}-[0-9]{3}$/;
function rndInt(n){
  try{if(typeof crypto!=='undefined'&&crypto.getRandomValues){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n}}catch(e){}
  return Math.floor(Math.random()*n);
}
function newCode(){return CODE_WORDS[rndInt(CODE_WORDS.length)]+'-'+CODE_WORDS[rndInt(CODE_WORDS.length)]+'-'+(100+rndInt(900))}
/** Fehlende oder kaputte Felder ergänzen (ältere Spielstände, geladene Sicherungen). */
function fixState(){
  ['xp','answered','correct','bestCombo','gems'].forEach(k=>{if(typeof S[k]!=='number'||!(S[k]>=0))S[k]=0});
  ['stars','mistakes','blitz','pc'].forEach(k=>{if(!S[k]||typeof S[k]!=='object'||Array.isArray(S[k]))S[k]={}}); // pc: richtige Antworten je Lernpaket
  ['badges','days','seen','fullDays'].forEach(k=>{if(!Array.isArray(S[k]))S[k]=[]}); // seen: angekündigte Freischaltungen, fullDays: Tage mit Tages-Truhe
  if(typeof S.name!=='string')S.name='';
  if(!S.sync||typeof S.sync!=='object'||Array.isArray(S.sync))S.sync={}; // Server-Sicherung: id = Code ohne Namen
  if(!CODE_RE.test(S.sync.id||''))S.sync={id:newCode(),dirty:1};
}
fixState();
function store(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function save(){S.sync.dirty=1;store();syncLater()}
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
  if(d===null)return m.hello||'Wähle eine Welt und sammle Sterne!';
  if(d>1)return `Noch <b>${d} Tage</b> bis zum ${esc(what)}. Lass uns üben!`;
  if(d===1)return `<b>Morgen</b> ist der ${esc(what)} – noch eine Runde, dann bist du bereit!`;
  if(d===0)return `<b>Heute</b> ist ${esc(what)}-Tag! Du schaffst das! 🍀`;
  return 'Wiederholen lohnt sich immer. Sammle alle Sterne!';
}
const isDone=m=>{const d=daysUntil(m.date);return d!==null&&d<0};
/* Freischalten nach Datum: m.unlock={chest:'JJJJ-MM-TT',…}. Ohne Eintrag sofort offen. */
const openDate=(m,id)=>m.unlock&&m.unlock[id]?m.unlock[id]:null;
// Lokal (Mac oder Heimnetz) ist zum Ausprobieren alles offen; online gilt das Datum.
// Mit ?live in der Adresse verhält sich auch die lokale Version wie online (zum Ausprobieren der Freischaltungen).
const LOCAL=/^(localhost|127\.|192\.168\.|10\.)/.test(location.hostname)&&!/[?&]live\b/.test(location.search);
/* m.closed=['id',…]: vorerst gesperrt, noch ohne Datum. Später aus closed nehmen und unlock[id] setzen (dann mit Ankündigung). */
const isClosed=(m,id)=>!!(m.closed&&m.closed.indexOf(id)>=0);
const isOpen=(m,id)=>{const d=openDate(m,id);return LOCAL||(!isClosed(m,id)&&(!d||daysUntil(d)<=0))};
/* Freischalten nach Fortschritt: w.after='welt-id' → erst offen ab w.afterStars (Standard 2) Sternen in jener Welt.
 * Lokal ist auch das offen (mit ?live wie online). */
// Spezial-Missionen (chest, blitz, exam, gold) per m.missionAfter={exam:'welt-id',…}.
const afterOf=(m,w)=>w.after||(m.missionAfter&&m.missionAfter[w.id])||null;
const needOf=w=>w.afterStars||2;
const isReady=(m,w)=>{const a=afterOf(m,w);return LOCAL||!a||(S.stars[m.id+'/'+a]||0)>=needOf(w)};
function afterMsg(m,w){const a=afterOf(m,w),p=allWorlds(m).find(x=>x.id===a);return `Hol dir erst ${needOf(w)} Sterne in „${p?p.name:a}“, dann geht es hier weiter!`}
/** Alles, was nach Fortschritt aufgeht: Welten, Missionen und Spezial-Missionen */
const gated=m=>allWorlds(m).concat([chestW(),blitzW(),m.boss?goldW(m):null,hasWrite(m)?examW(m):null]).filter(x=>x&&afterOf(m,x));
/** Welten können per m.unlock[welt-id] auch erst ab einem Datum offen sein, per w.after erst nach Fortschritt. */
const openWorlds=m=>m.worlds.filter(w=>isOpen(m,w.id)&&isReady(m,w));
function whenText(d){
  const n=daysUntil(d);
  if(n===1)return 'morgen';if(n===2)return 'übermorgen';
  if(n>6)return 'am '+parseDate(d).toLocaleDateString('de-DE',{day:'numeric',month:'numeric'});
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
// Ab Level 31 fächerübergreifende Titel; nach dem letzten geht es mit Sternen weiter (… ⭐2, ⭐3).
TITLES.push('Zahlen-Ninja','Rechen-Rakete','Wissens-Wikinger','Gedanken-Blitz','Schlau-Kapitän','Knobel-König','Wissens-Komet','Lern-Ritter','Super-Denker','Weltraum-Forscher',
 'Wissens-Drache','Lern-Superheld','Mathe-Magier','Wort-und-Zahl-Zauberer','Sternen-Sammler','Wissens-Vulkan','Galaxie-Kapitän','Lern-Champion','Genie-Blitz','Wissens-Titan',
 'Planeten-Profi','Lern-Meteor','Super-Eule','Wissens-Großmeister','Sonnen-Genie','Lern-Gigant','Kosmos-Kenner','Wissens-Kaiser','Lern-Universum','Eulen-Legende');
const titleOf=l=>l<=TITLES.length?TITLES[l-1]:TITLES[TITLES.length-1]+' ⭐'+(l-TITLES.length+1);
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
 {id:'packs3',icon:'🎒',name:'Vielseitig',desc:'3 Lernpakete geschafft'},
 {id:'truhe1',icon:'🎁',name:'Erste Tages-Truhe',desc:'Alle Tagesaufgaben an einem Tag'},
 {id:'streak3',icon:'🔥',name:'Drei am Stück',desc:'3 Tage am Stück alle Tagesaufgaben'},
 {id:'streak5',icon:'📅',name:'Ganze Schulwoche',desc:'5 Tage am Stück alle Tagesaufgaben'},
 {id:'streak10',icon:'🏅',name:'Dauerbrenner',desc:'10 Tage am Stück alle Tagesaufgaben'},
 {id:'streak20',icon:'👑',name:'Übungs-König',desc:'20 Tage am Stück alle Tagesaufgaben'}
];
/* Eigene Abzeichen eines Lernpakets (m.badges): gespeichert als "<paket-id>:<abzeichen-id>". */
// Mehrere Lernpakete können sich Abzeichen teilen (m.badgeGroup, z. B. alle Lernwörter-Wochen).
const bkey=m=>m.badgeGroup||m.id;
const packBadges=m=>(m.badges||[]).map(b=>Object.assign({},b,{id:bkey(m)+':'+b.id}));
const findBadge=id=>BADGES.find(x=>x.id===id)||LernApp.modules.reduce((f,m)=>f||packBadges(m).find(x=>x.id===id),null);
function grant(id){
  if(S.badges.indexOf(id)>=0)return;
  const b=findBadge(id);if(!b)return;
  S.badges.push(id);save();
  if(Q)Q.newBadges.push(b);
  setTimeout(()=>{toast(b.icon,`Abzeichen: ${b.name}!`);sfx('level')},400);
}

/** Prüft die eigenen Abzeichen des Lernpakets. ev: Was gerade passiert ist (siehe CLAUDE.md). */
function checkPackBadges(m,ev){
  if(!m||!m.badges)return;
  const c=Object.assign({kind:null,world:null,stars:0,won:false,streak:0,score:0},ev,{
    correct:S.pc[bkey(m)]||0,
    starsIn:wid=>S.stars[m.id+'/'+wid]||0,
    allWorlds:m.worlds.every(x=>getStars(m,x)>0),
    allStars:packStars(m)>=maxStars(m),
    blitzRecord:S.blitz[m.id]||0
  });
  packBadges(m).forEach(b=>{if(S.badges.indexOf(b.id)<0){let ok=false;try{ok=!!b.test(c)}catch(e){}if(ok)grant(b.id)}});
}

/* ================= Spezial-Welten ================= */
const hasWrite=m=>m.worlds.some(w=>w.write);
function bossW(m){
  const b=m.boss;
  return {id:'boss',kind:'boss',name:b.name||'Endgegner',icon:b.icon||'🐉',color:b.color||'#dc2626',color2:b.color2||'#f97316',
    topic:b.topic||`Alles gemischt! ${b.count||15} Fragen, ${b.lives||3} Leben.`,count:b.count||15,lives:b.lives||3};
}
function goldW(m){
  return {id:'gold',kind:'boss',gold:true,name:m.boss.goldName||'Goldener '+(m.boss.name||'Endgegner'),icon:'🐲',color:'#b45309',color2:'#facc15',
    topic:'Nur 1 Leben! 20 Fragen. Für echte Profis.',count:20,lives:1};
}
const examW=m=>({id:'exam',kind:'exam',name:'Probetest',icon:'✍️',color:'#0f766e',color2:'#14b8a6',topic:'Antworten selbst schreiben – wie im echten Test!',count:m.examCount||12});
const chestW=()=>({id:'chest',kind:'chest',name:'Fehler-Schatzkiste',icon:'💎',color:'#be185d',color2:'#ec4899',topic:'Deine kniffligen Fragen. 2× richtig = 1 Edelstein!'});
// Blitzrunde: höchstens BLITZ_MAX Runden pro Tag (für alle Lernpakete zusammen). Gezählt wird beim Start.
const BLITZ_MAX=10;
function blitzLeft(){const d=dkey(today0()),b=S.blitzDay;return b&&b.d===d?Math.max(0,BLITZ_MAX-b.n):BLITZ_MAX}
function useBlitz(){const d=dkey(today0());if(!S.blitzDay||S.blitzDay.d!==d)S.blitzDay={d,n:0};S.blitzDay.n++;save()}
const BLITZ_DONE=`Für heute hast du alle ${BLITZ_MAX} Blitzrunden geschafft! ⚡ Morgen geht es weiter. Bis dahin warten die anderen Missionen auf dich! 🦉`;
const blitzW=()=>({id:'blitz',kind:'blitz',name:'Blitzrunde',icon:'⚡',color:'#1d4ed8',color2:'#3b82f6',topic:'60 Sekunden – so viele richtig wie möglich!',seconds:60});
/** Zusatz-Missionen aus dem Lernpaket (m.missions): wie Welten mit Sternen, aber nicht im Endgegner/Blitz
 *  und nicht nötig, um den Endgegner zu wecken. Können per m.unlock[id] erst ab einem Datum offen sein. */
const missions=m=>m.missions||[];
const allWorlds=m=>m.worlds.concat(missions(m));
/** Welten mit Sternen */
const starWorlds=m=>allWorlds(m).concat(m.boss?[bossW(m),goldW(m)]:[]).concat(hasWrite(m)?[examW(m)]:[]);
const maxStars=m=>starWorlds(m).length*3;
const packStars=m=>starWorlds(m).reduce((a,w)=>a+getStars(m,w),0);
const totalStars=()=>LernApp.modules.reduce((a,m)=>a+packStars(m),0);
function findWorld(m,id){
  return allWorlds(m).find(x=>x.id===id)||[m.boss?bossW(m):null,m.boss?goldW(m):null,hasWrite(m)?examW(m):null,chestW(),blitzW()].find(x=>x&&x.id===id);
}

/* ================= Fragen-Pools (mit Schlüssel für die Schatzkiste) ================= */
const tag=(q,w,key)=>{q.key=key;q.wid=w.id;return q};
const pool=w=>w.cats().map((c,ci)=>c.map((f,ii)=>()=>tag(f(),w,`${w.id}:c${ci}:${ii}`)));
const writePool=w=>w.write?w.write().map((f,ii)=>()=>tag(f(),w,`${w.id}:w:${ii}`)):[];
function byKey(m,key){
  const p=key.split(':'),w=allWorlds(m).find(x=>x.id===p[0]);if(!w)return null;
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
      <div class="pmeta"><span>⭐ ${st} / ${mx}</span>${m.date?dateChip(m):weekChip(m)}</div></div></button>`;
}
/* Lernwörter (m.group==='lernwoerter', m.from = Wochenbeginn): eigener Bereich, neueste Woche zuerst. */
const isLW=m=>m.group==='lernwoerter';
function weekChip(m){
  if(!m.from)return '';
  const d=daysUntil(m.from),lw=LernApp.modules.filter(x=>isLW(x)&&x.from&&daysUntil(x.from)<=0).sort((a,b)=>a.from<b.from?1:-1);
  if(lw[0]===m)return '<span class="datechip">Diese Woche ✨</span>';
  if(lw[1]===m)return '<span class="datechip soon">Letzte Woche</span>';
  return `<span class="datechip past">${d>0?'ab':'vom'} ${parseDate(m.from).toLocaleDateString('de-DE',{day:'numeric',month:'numeric'})}</span>`;
}
/* Bereich „Jeden Tag üben“: Tages-Truhe, dann aktuelle Lernwörter, die anderen daily-Pakete, letzte Woche; ältere eingeklappt. */
function dailySection(){
  const lw=LernApp.modules.filter(m=>isLW(m)&&visibleLW(m)).sort((a,b)=>(a.from||'')<(b.from||'')?1:-1);
  const reg=LernApp.modules.filter(m=>m.daily&&!isLW(m));
  if(!lw.length&&!reg.length)return '';
  const list=lw.slice(0,1).concat(reg,lw.slice(1,2)),old=lw.slice(2);
  return `<div class="stitle">🗓️ Jeden Tag üben</div>${dailyPanel()}<div class="packs">${list.map(packCard).join('')}</div>
  ${old.length?`<details class="older"><summary>Ältere Lernwörter (${old.length})</summary><div class="packs">${old.map(packCard).join('')}</div></details>`:''}`;
}
const isDaily=m=>isLW(m)||!!m.daily;
function sortPacks(list){
  return list.slice().sort((a,b)=>{const da=daysUntil(a.date),db=daysUntil(b.date);
    if(da===null&&db===null)return 0;if(da===null)return 1;if(db===null)return -1;return da-db});
}
const gotN=list=>list.filter(b=>S.badges.indexOf(b.id)>=0).length;
const bgrid=list=>`<div class="bgrid">${list.map(b=>`<div class="badge ${S.badges.indexOf(b.id)>=0?'got':''}"><div class="bi">${b.icon}</div><div class="bn">${b.name}</div><div class="bd">${b.desc}</div></div>`).join('')}</div>`;
const badgeTitle=m=>`${m.icon||'🏅'} ${esc(m.badgeTitle||'Abzeichen: '+m.title)}`;
/** Lernpaket-Seite: nur die eigenen Abzeichen des Pakets */
const packBadgesHTML=m=>m.badges&&m.badges.length?`<div class="section"><h3>${badgeTitle(m)} (${gotN(packBadges(m))}/${m.badges.length})</h3>${bgrid(packBadges(m))}</div>`:'';
/** Startseite: alle Abzeichen gesammelt – allgemeine und die aller Lernpakete (geteilte Gruppen nur einmal) */
function allBadgesHTML(){
  const groups=[{title:'🦉 Allgemein',list:BADGES}],seen={};
  LernApp.modules.forEach(m=>{if(!m.badges||!m.badges.length||seen[bkey(m)])return;seen[bkey(m)]=1;groups.push({title:badgeTitle(m),list:packBadges(m)})});
  const all=[].concat.apply([],groups.map(g=>g.list));
  return `<div class="section"><h3>🏅 Alle Abzeichen (${gotN(all)}/${all.length})</h3>${groups.map(g=>`<h4 class="bsub">${g.title} <small>${gotN(g.list)}/${g.list.length}</small></h4>${bgrid(g.list)}`).join('')}</div>`;
}
function renderHome(){
  const active=sortPacks(LernApp.modules.filter(m=>!isDone(m)&&!isDaily(m)));
  const done=sortPacks(LernApp.modules.filter(m=>isDone(m)&&!isDaily(m))).reverse();
  const next=active.find(m=>daysUntil(m.date)!==null);
  const greet=next?`${countdownText(next)} <br><small>(${esc(next.title)} · ${fmtDate(next.date)})</small>`:'Wähle ein Lernpaket und sammle Sterne!';
  app.innerHTML=`
  <div class="title">Lern-Eule<small>Deine Lern-App</small></div>
  <div class="hero"><div class="mascot">🦉</div><div class="bubble">Hallo ${S.name?`<b>${esc(S.name)}</b>`:'Lern-Held'}! ${greet}</div></div>
  <div class="namebar">Ich heiße <input value="${esc(S.name)}" placeholder="Dein Name" maxlength="16" onchange="LernApp._setName(this.value)"></div>
  ${statsHTML()}
  ${dailySection()}
  <div class="stitle">📚 Lernpakete</div>
  <div class="packs">${active.length?active.map(packCard).join(''):'<div class="empty">Gerade steht nichts an. 🎉</div>'}</div>
  ${done.length?`<div class="stitle">✅ Schon geschrieben</div><div class="packs">${done.map(packCard).join('')}</div>`:''}
  ${allBadgesHTML()}
  <div class="footer"><button class="btn ghost" onclick="LernApp._toggleSound()">${S.sound?'🔊 Ton an':'🔇 Ton aus'}</button><button class="btn ghost" onclick="LernApp._backupAsk()">💾 Sichern / Laden</button><button class="btn ghost" onclick="LernApp._resetAsk()">↺ Neu starten</button></div>`;
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

/* ================= Jeden Tag üben (m.daily) ================= */
/* Lernpakete mit daily:true (Lernwörter, Affen-Box) sind Tagesaufgaben, eine je Gruppe (bkey: alle Lernwörter-Wochen
 * zusammen). Eine Runde mit mindestens einer richtigen Antwort hakt die Aufgabe für heute ab (+DAILY_XP).
 * Alle abgehakt → Tages-Truhe mit Bonus. Serie = Tage mit Truhe am Stück; Samstag/Sonntag unterbrechen sie nicht. */
const DAILY_XP=20;
const visibleLW=m=>LOCAL||!m.from||daysUntil(m.from)<=0;
function dailyGoals(){
  const out=[],seen={};
  LernApp.modules.filter(m=>m.daily&&visibleLW(m)).sort((a,b)=>(a.from||'')<(b.from||'')?1:-1).forEach(m=>{
    const k=bkey(m);if(seen[k])return;seen[k]=1;out.push({key:k,m,name:m.dailyName||m.title,icon:m.icon||'📘'})}); // Lernwörter: neueste Woche
  return out;
}
function todayRec(){const d=dkey(today0());if(!S.dd||S.dd.d!==d)S.dd={d,done:[]};return S.dd}
const isDoneToday=k=>todayRec().done.indexOf(k)>=0;
function dailyStreak(){
  const has=d=>S.fullDays.indexOf(dkey(d))>=0;
  let d=today0(),n=0;if(!has(d))d=addDays(d,-1); // heute noch offen: Serie von gestern zählt weiter
  for(let i=0;i<500;i++){if(has(d))n++;else if(d.getDay()%6!==0)break;d=addDays(d,-1)}
  return n;
}
function dailyDone(m,ok){
  if(!m.daily||!ok)return;
  const k=bkey(m),t=todayRec();if(t.done.indexOf(k)>=0)return;
  const lvBefore=level();t.done.push(k);S.xp+=DAILY_XP;
  const g=dailyGoals(),full=g.every(x=>t.done.indexOf(x.key)>=0)&&S.fullDays.indexOf(t.d)<0;
  if(full){
    S.fullDays.push(t.d);
    const st=dailyStreak(),bonus=30+Math.min(st,10)*5;S.xp+=bonus;
    if(level()>lvBefore){const l=level();setTimeout(()=>{toast('⬆️',`Level ${l}: ${titleOf(l)}!`);sfx('level')},3200)}
    grant('truhe1');if(st>=3)grant('streak3');if(st>=5)grant('streak5');if(st>=10)grant('streak10');if(st>=20)grant('streak20');
    setTimeout(()=>{
      modal(`<div style="text-align:center"><div style="font-size:80px;animation:bob 1.6s ease-in-out infinite">🎁</div><h2>Tages-Truhe geöffnet!</h2>
      <p style="font-size:18px">Alle Tagesaufgaben für heute geschafft. Super!</p>
      <div class="rstats"><div>+${bonus+DAILY_XP} XP<small>Belohnung</small></div><div>🔥 ${st}<small>${st===1?'Tag':'Tage'} am Stück</small></div></div>
      <p class="mini" style="display:block;margin-bottom:12px">Morgen wartet die nächste Truhe – je länger deine Serie, desto mehr XP!</p>
      <button class="btn primary" style="width:100%" onclick="this.closest('.modal').remove()">Juhu! 🎉</button></div>`);
      sfx('win');bigConfetti();
    },1200);
  }else{
    const left=g.filter(x=>t.done.indexOf(x.key)<0);
    if(level()>lvBefore){const l=level();setTimeout(()=>{toast('⬆️',`Level ${l}: ${titleOf(l)}!`);sfx('level')},3200)}
    setTimeout(()=>{toast(m.icon||'✅',`Tagesaufgabe geschafft! +${DAILY_XP} XP${left.length?' · Noch: '+left.map(x=>esc(x.name)).join(', '):''}`);sfx('gem')},1200);
  }
  save();
}
function dailyPanel(){
  const g=dailyGoals();if(!g.length)return '';
  const t=todayRec(),st=dailyStreak(),left=g.filter(x=>!isDoneToday(x.key)),full=!left.length;
  const now=today0(),mon=addDays(now,-((now.getDay()+6)%7));let days='';
  for(let i=0;i<7;i++){
    const d=addDays(mon,i),did=S.fullDays.indexOf(dkey(d))>=0,isToday=+d===+now,we=i>=5;
    if(we&&!did&&!isToday)continue;
    const cls=did?'did':isToday?'today':d<now?'miss':'future';
    days+=`<div class="day ${cls}"><small>${isToday?'Heute':WD[d.getDay()]}</small><span>${did?'🎁':isToday?'⭐':'·'}</span></div>`;
  }
  const msg=full?'Alles geschafft! Morgen wartet die nächste Truhe. 🌙'
    :`Noch ${left.length===1?'eine Runde':left.length+' Runden'}, dann öffnet sich die Truhe! 🎁`;
  return `<div class="section daily"><h3>🎁 Tages-Truhe <span class="dstreak">${st?`🔥 ${st} ${st===1?'Tag':'Tage'}`:'🔥 Serie starten!'}</span></h3>
    <div class="dgoals">${g.map(x=>{const d=isDoneToday(x.key);return `<button class="dgoal ${d?'did':''}" onclick="LernApp.go('${x.m.id}')"><span>${d?'✅':x.icon}</span>${esc(x.name)}</button>`}).join('')}<div class="dchest ${full?'open':''}">${full?'🎉':'🎁'}</div></div>
    <div class="days">${days}</div><div class="dmsg">${msg}</div></div>`;
}

/* ================= Lernpaket ================= */
function worldCard(m,w,i,locked,lockMsg){
  const st=getStars(m,w),hasStars=w.kind!=='chest'&&w.kind!=='blitz';
  let extra='';
  if(w.kind==='chest'){const c=chestCount(m);extra=`<div class="wx">${c?`${c} knifflige ${c===1?'Frage':'Fragen'} · 💎 ${S.gems}`:'Noch leer – super! 💎 '+S.gems}</div>`}
  if(w.kind==='blitz'){const b=S.blitz[m.id]||0,l=blitzLeft();extra=`<div class="wx">🏆 Rekord: ${b} · ${l?`noch ${l}× heute`:'morgen wieder'}</div>`;if(!l&&!locked){locked=true;lockMsg=BLITZ_DONE}}
  const empty=w.kind==='chest'&&!chestCount(m);
  const click=locked?`LernApp._locked('${esc(lockMsg||'')}')`:empty?`LernApp._locked('Die Schatzkiste füllt sich mit Fragen, die du falsch hattest.')`:`LernApp.start('${w.id}')`;
  return `<button class="world ${w.kind||''} ${w.gold?'goldw':''} ${locked?'locked':''}" style="--wc:${w.color};--wc2:${w.color2||w.color};animation-delay:${i*.06}s" onclick="${click}">
    <div class="wi">${locked?'🔒':w.icon}</div><div class="wn">${esc(w.name)}</div><div class="wt">${w.topic||''}</div>
    ${hasStars?`<div class="ws">${[1,2,3].map(n=>`<span class="${n<=st?'':'off'}">⭐</span>`).join('')}</div>`:extra}
    <div class="play">${locked&&w.kind==='blitz'&&!blitzLeft()?'Morgen wieder 🌙':locked?'Gesperrt':empty?'Leer':st?'Nochmal ▶':'Los ▶'}</div></button>`;
}
function mysteryCard(m,w,i){
  const d=openDate(m,w.id),t=d&&!isClosed(m,w.id)?whenText(d):'bald',what=m.worlds.indexOf(w)>=0?['Welt','Geheime Welt']:['Mission','Geheime Mission'];
  return `<button class="world mystery" style="--wc:#475569;--wc2:#64748b;animation-delay:${i*.06}s" onclick="LernApp._locked('Psst … diese ${what[0]} öffnet sich ${t}! 🤫')">
    <div class="wi">🎁</div><div class="wn">${what[1]}</div><div class="wt">Wird ${t} freigeschaltet. Schau dann unbedingt vorbei!</div>
    <div class="wx">🔒 ${cap(t)}</div><div class="play">???</div></button>`;
}
function announceUnlocks(m){
  const fresh=m.worlds.concat([chestW(),blitzW(),m.boss?goldW(m):null,hasWrite(m)?examW(m):null],missions(m)).filter(w=>w&&openDate(m,w.id)&&isOpen(m,w.id)&&S.seen.indexOf(m.id+'/'+w.id)<0);
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
  // Ein schon besiegter Endgegner bleibt offen, auch wenn später eine neue Welt dazukommt.
  const allDone=m.worlds.every(w=>getStars(m,w)>0);
  const bossDone=m.boss&&getStars(m,bossW(m))>0;
  const hasRules=m.worlds.some(w=>w.rules);
  const special=[];
  const sp=(w,i,locked,msg)=>special.push(isOpen(m,w.id)?worldCard(m,w,i,locked||!isReady(m,w),isReady(m,w)?msg:afterMsg(m,w)):mysteryCard(m,w,i));
  sp(chestW(),0,false);
  sp(blitzW(),1,false);
  if(m.boss)sp(goldW(m),2,!bossDone,'Besiege zuerst '+bossW(m).name+'!');
  if(hasWrite(m))sp(examW(m),3,false);
  missions(m).forEach((w,i)=>sp(w,4+i,false));
  app.innerHTML=`
  <div class="topbar"><button class="iconbtn" onclick="LernApp.go()" aria-label="Zurück">‹</button>
    <h1>${m.icon||''} ${esc(m.title)}<small>${esc(m.subject||'')}${m.date?' · '+fmtDate(m.date):''}</small></h1></div>
  <div class="hero"><div class="mascot">${m.mascot||'🦉'}</div><div class="bubble">${countdownText(m)}</div></div>
  ${statsHTML()}
  ${m.daily?dailyPanel():dayStrip(m)}
  <div class="stitle">🗺️ Welten</div>
  <div class="worlds">${m.worlds.map((w,i)=>isOpen(m,w.id)?worldCard(m,w,i,!isReady(m,w),isReady(m,w)?'':afterMsg(m,w)):mysteryCard(m,w,i)).join('')}${m.boss?(m.worlds.some(w=>!isOpen(m,w.id)&&isClosed(m,w.id))?mysteryCard(m,bossW(m),m.worlds.length):worldCard(m,bossW(m),m.worlds.length,!allDone&&!bossDone,'Schaffe zuerst alle Welten!')):''}</div>
  <div class="stitle">🎯 Spezial-Missionen</div>
  <div class="worlds">${special.join('')}</div>
  ${packBadgesHTML(m)}
  <div class="footer">${hasRules?`<button class="btn ghost" onclick="LernApp._cheat()">📜 Spickzettel</button>`:''}<button class="btn ghost" onclick="LernApp.go()">🏠 Alle Lernpakete</button></div>`;
  scrollTo(0,0);
  announceUnlocks(m);
}
function cheat(){
  const m=CUR;
  modal(`<h2>📜 Spickzettel</h2>${m.worlds.filter(w=>w.rules).map(w=>`<div class="rule" style="--wc:${w.color}"><h4>${w.icon} ${esc(w.name)}</h4>${w.rules}</div>`).join('')}
  <button class="btn primary" style="width:100%" onclick="this.closest('.modal').remove()">Alles klar!</button>`,true);
}
/* ================= Sichern & Wiederherstellen (für Eltern) ================= */
// Elternsperre: Rechenaufgabe, die ein Kind in Klasse 2–3 noch nicht im Kopf löst
function parentGate(title,text,okLabel,onOk){
  const a=12+Math.floor(Math.random()*8),b=3+Math.floor(Math.random()*7);
  const m=modal(`<div style="text-align:center"><h2>${title}</h2><p style="margin-bottom:12px;font-size:18px">${text}</p>
  <p style="margin-bottom:8px;font-size:16px">Nur für Eltern: Wie viel ist <b>${a} × ${b}</b>?</p>
  <form class="wform" style="justify-content:center;margin-bottom:8px" onsubmit="return false"><input id="gsum" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" placeholder="Ergebnis"></form>
  <div class="rbtns"><button class="btn" onclick="this.closest('.modal').remove()">Abbrechen</button><button class="btn primary" id="ggo">${okLabel}</button></div></div>`);
  const inp=m.querySelector('#gsum'),go=()=>{
    if(inp.value.trim()===String(a*b)){m.remove();return onOk()}
    m.remove();modal(`<div style="text-align:center"><h2>Das stimmt leider nicht</h2><p style="margin-bottom:16px;font-size:18px">Dein Fortschritt bleibt, wie er ist. 🦉</p><div class="rbtns"><button class="btn primary" onclick="this.closest('.modal').remove()">OK</button></div></div>`);
  };
  m.querySelector('#ggo').onclick=go;
  m.querySelector('form').onsubmit=e=>{e.preventDefault();go();return false};
}
const BACKUP_APP='lern-eule';
/** Kurzbeschreibung eines Spielstands (auch für geladene Sicherungen) */
function stateSummary(st){
  const stars=Object.keys(st.stars||{}).reduce((a,k)=>a+(+st.stars[k]||0),0);
  return `Level <b>${levelInfo(st.xp||0).lvl}</b> · ⭐ ${stars} Sterne · 🏅 ${(st.badges||[]).length} Abzeichen · ✅ ${st.correct||0} richtig${st.gems?' · 💎 '+st.gems:''}`;
}
function backupAsk(){
  parentGate('💾 Sichern / Laden','Hier kannst du den Spielstand als Datei sichern oder eine Sicherung zurückholen.','Weiter',backupMenu);
}
function backupMenu(){
  modal(`<div style="text-align:center"><h2>💾 Spielstand</h2>
  <p style="font-size:16px;margin-bottom:6px">${S.name?esc(S.name)+': ':''}${stateSummary(S)}</p>
  ${SYNC_URL?syncBox():''}
  <p class="bnote">${SYNC_URL?'Zusätzlich als Datei sichern':'Die Sicherung ist eine kleine Datei'}: z. B. in iCloud Drive, „Dateien“ ablegen oder per Mail/AirDrop schicken.</p>
  <div class="bmenu">${SYNC_URL?'<button class="btn" onclick="LernApp._codeAsk()">🔑 Code eingeben (anderes Gerät)</button>':''}
  <button class="btn primary" onclick="LernApp._backupSave(this)">💾 Spielstand als Datei sichern</button>
  <button class="btn" onclick="LernApp._backupPick()">📂 Datei laden</button>
  <button class="btn bclose" onclick="this.closest('.modal').remove()">Schließen</button></div>
  <input type="file" id="bfile" accept=".json,application/json" style="display:none" onchange="LernApp._backupLoad(this)"></div>`,true);
  if(SYNC_URL)syncPush().then(syncBoxUpdate);
}
function backupSave(btn){
  const d=dkey(today0()),name='lern-eule-'+(S.name?S.name.replace(/[^A-Za-z0-9ÄÖÜäöüß-]/g,'')+'-':'')+d+'.json';
  const data=JSON.stringify({app:BACKUP_APP,v:1,saved:new Date().toISOString(),state:S},null,1);
  const done=()=>{S.lastBackup=d;save();const p=btn&&btn.closest('.bmenu');if(p&&!document.querySelector('.bok'))p.insertAdjacentHTML('beforebegin','<p class="bok">✅ Gesichert!</p>')};
  const download=()=>{
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'application/json'}));a.download=name;
    document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);done();
  };
  // iPhone/iPad: Teilen-Menü (Dateien, AirDrop, Mail). Sonst normaler Download.
  try{
    const f=new File([data],name,{type:'application/json'});
    if(navigator.canShare&&navigator.canShare({files:[f]})){
      navigator.share({files:[f],title:'Lern-Eule Sicherung'}).then(done).catch(e=>{if(!e||e.name!=='AbortError')download()});
      return;
    }
  }catch(e){}
  download();
}
function backupLoad(inp){
  const f=inp.files&&inp.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=()=>{
    let b=null;try{b=JSON.parse(r.result)}catch(e){}
    inp.value='';
    if(!b||b.app!==BACKUP_APP||!b.state||typeof b.state!=='object'||typeof b.state.xp!=='number'){
      toast('⚠️','Das ist keine Lern-Eule-Sicherung.');return;
    }
    const when=b.saved?new Date(b.saved).toLocaleDateString('de-DE',{day:'numeric',month:'numeric',year:'numeric'}):'?';
    const m=modal(`<div style="text-align:center"><h2>📂 Sicherung laden?</h2>
      <p style="font-size:16px;margin-bottom:10px"><b>Sicherung vom ${when}</b>${b.state.name?' ('+esc(b.state.name)+')':''}<br>${stateSummary(b.state)}</p>
      <p style="font-size:16px">Der jetzige Spielstand wird ersetzt:<br>${stateSummary(S)}</p>
      <div class="rbtns"><button class="btn" onclick="this.closest('.modal').remove()">Abbrechen</button><button class="btn primary" id="bgo">Ja, laden</button></div></div>`);
    m.querySelector('#bgo').onclick=()=>{
      const sy=S.sync;S=Object.assign(FRESH(),b.state);S.sync=sy;fixState();save();
      syncPush(true); // bewusst geladen: auch auf dem Server ersetzen
      document.querySelectorAll('.modal').forEach(x=>x.remove());route();
      toast('📂','Sicherung geladen!');sfx('win');
    };
  };
  r.onerror=()=>toast('⚠️','Die Datei konnte nicht gelesen werden.');
  r.readAsText(f);
}

/* ================= Server-Sicherung ================= */
// Adresse von server/backup.php auf dem Hosting. Leer = aus (dann gibt es nur die Datei-Sicherung).
const SYNC_URL=(typeof location!=='undefined'&&(location.hostname==='localhost'||location.hostname==='127.0.0.1'))
  ?'http://localhost:8767/backup.php':'https://lern-eule.lrnz.net/backup.php';
var SY={timer:null,busy:false,err:''};
const umlautUp=t=>String(t||'').toUpperCase().replace(/Ä/g,'AE').replace(/Ö/g,'OE').replace(/Ü/g,'UE').replace(/ß/g,'SS');
/** Code zum Anzeigen: Name vorne dran, z. B. MIA-TIGER-MOND-472. Der Name zählt beim Eingeben nicht mit. */
function showCode(){const n=umlautUp(S.name).replace(/[^A-Z]/g,'').slice(0,10);return (n?n+'-':'')+S.sync.id}
function parseCode(t){const p=umlautUp(t).split(/[^A-Z0-9]+/).filter(Boolean);if(p.length<3)return null;const c=p.slice(-3).join('-');return CODE_RE.test(c)?c:null}
function syncReq(body){
  // text/plain: keine CORS-Vorabanfrage nötig
  return fetch(SYNC_URL,{method:'POST',body,headers:{'Content-Type':'text/plain'},cache:'no-store',keepalive:body.length<60000})
    .then(r=>r.json().catch(()=>({})).then(j=>({s:r.status,j})));
}
/** Nach Änderungen höchstens einmal pro Minute hochladen */
function syncLater(){if(SYNC_URL&&!SY.timer)SY.timer=setTimeout(()=>{SY.timer=null;syncPush()},60000)}
function syncPush(force){
  const sy=S.sync;
  if(!SYNC_URL||SY.busy||(!sy.dirty&&!force)||(sy.conflict&&!force))return Promise.resolve();
  if(!force&&!(S.xp>0||S.answered>0))return Promise.resolve(); // noch nichts geübt: nichts anlegen
  if(navigator.onLine===false){SY.err='offline';return Promise.resolve()}
  const st=JSON.parse(JSON.stringify(S));st.sync={id:sy.id};
  SY.busy=true;sy.dirty=0;
  return syncReq(JSON.stringify({action:'put',id:sy.id,base:sy.base||'',force:!!force,state:st})).then(x=>{
    if(x.s===200&&x.j.ok){sy.base=x.j.rev;sy.at=x.j.saved;delete sy.conflict;SY.err=''}
    else if(x.s===409){sy.conflict={saved:x.j.saved,xp:x.j.xp};sy.dirty=1;SY.err=''}
    else{sy.dirty=1;SY.err='server'}
  },()=>{sy.dirty=1;SY.err='offline'}).then(()=>{SY.busy=false;store()});
}
const fmtWhen=iso=>{const d=new Date(iso);return isNaN(d)?'?':d.toLocaleString('de-DE',{weekday:'short',day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit'})+' Uhr'};
function syncStatus(){
  const sy=S.sync;
  if(sy.conflict)return `⚠️ Auf dem Server liegt ein Stand von einem anderen Gerät mit mehr XP (${fmtWhen(sy.conflict.saved)}, Level ${levelInfo(sy.conflict.xp||0).lvl}). Dieser Stand wird erst wieder gesichert, wenn du entscheidest:
    <span class="bbtns"><button class="btn" onclick="LernApp._codeLoad('${sy.id}')">☁️ Server-Stand laden</button><button class="btn" onclick="LernApp._syncForce(this)">⬆️ Diesen Stand behalten</button></span>`;
  let t=sy.at?'✅ Automatisch gesichert: '+fmtWhen(sy.at):'Wird automatisch gesichert, sobald geübt wurde.';
  if(sy.dirty&&SY.err==='offline')t+=' · gerade offline, wird nachgeholt';
  else if(sy.dirty&&SY.err==='server')t+=' · Server gerade nicht erreichbar';
  return t;
}
function syncBox(){
  return `<div class="bsync"><p class="bstat">${syncStatus()}</p>
  <p>Dein Code: <b class="bcode">${esc(showCode())}</b> <button class="btn bcopy" onclick="LernApp._copyCode(this)">📋</button></p>
  <p class="bnote" style="margin:4px 0 0">Auf einem anderen Gerät weiterspielen: dort „💾 Sichern / Laden“ → „🔑 Code eingeben“.</p></div>`;
}
function syncBoxUpdate(){const e=document.querySelector('.bstat');if(e)e.innerHTML=syncStatus()}
function codeAsk(){
  const m=modal(`<div style="text-align:center"><h2>🔑 Code eingeben</h2>
  <p style="font-size:16px;margin-bottom:10px">Den Code findest du auf dem anderen Gerät unter „💾 Sichern / Laden“.</p>
  <form class="wform" style="justify-content:center;margin-bottom:8px" onsubmit="return false"><input id="ccode" type="text" autocapitalize="characters" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="z. B. MIA-TIGER-MOND-472"></form>
  <p class="cerr" style="color:var(--bad,#dc2626);min-height:22px"></p>
  <div class="rbtns"><button class="btn" onclick="this.closest('.modal').remove()">Abbrechen</button><button class="btn primary" id="cgo">Weiter</button></div></div>`);
  const inp=m.querySelector('#ccode'),er=m.querySelector('.cerr'),go=()=>{
    const c=parseCode(inp.value);
    if(!c){er.textContent='Der Code sieht nicht richtig aus. Er endet mit Wort-Wort-Zahl.';return}
    er.textContent='Suche …';
    codeLoad(c,null,m);
  };
  m.querySelector('#cgo').onclick=go;
  m.querySelector('form').onsubmit=e=>{e.preventDefault();go();return false};
  setTimeout(()=>inp.focus(),50);
}
/** Stand zum Code vom Server holen und nach Rückfrage laden */
function codeLoad(id,day,from){
  const fail=t=>{const e=from&&from.querySelector('.cerr');if(e)e.textContent=t;else toast('⚠️',t)};
  syncReq(JSON.stringify({action:'get',id,day:day||''})).then(x=>{
    if(x.s===404&&!day)return fail('Zu diesem Code gibt es keine Sicherung.');
    if(x.s===429)return fail('Zu viele Versuche. Bitte in einer Stunde nochmal.');
    if(x.s!==200||!x.j.ok||!x.j.state)return fail('Das hat nicht geklappt. Bitte später nochmal.');
    if(from)from.remove();
    const j=x.j,same=id===S.sync.id;
    const days=(j.days||[]).filter(d=>d.saved!==j.saved).slice(0,10);
    const m=modal(`<div style="text-align:center"><h2>☁️ Stand vom Server laden?</h2>
      <p style="font-size:16px;margin-bottom:10px"><b>${fmtWhen(j.saved)}</b>${j.state.name?' ('+esc(j.state.name)+')':''}<br>${stateSummary(j.state)}</p>
      ${days.length?`<p class="bnote" style="margin:0 0 10px">Ältere Stände: ${days.map(d=>`<a href="#" class="bday" data-day="${d.day}">${new Date(d.saved).toLocaleDateString('de-DE',{day:'numeric',month:'numeric'})} (Level ${levelInfo(d.xp).lvl})</a>`).join(' · ')}</p>`:''}
      <p style="font-size:16px">Der jetzige Spielstand ${same?'':'auf diesem Gerät '}wird ersetzt:<br>${stateSummary(S)}</p>
      <div class="rbtns"><button class="btn" onclick="this.closest('.modal').remove()">Abbrechen</button><button class="btn primary" id="sgo">Ja, laden</button></div></div>`);
    m.querySelectorAll('.bday').forEach(a=>a.onclick=e=>{e.preventDefault();m.remove();codeLoad(id,a.dataset.day)});
    m.querySelector('#sgo').onclick=()=>{
      S=Object.assign(FRESH(),j.state);
      // Älterer Tag gewählt: beim nächsten Sichern bewusst den neuesten Stand ersetzen
      S.sync={id,base:j.head,at:j.saved,dirty:j.rev!==j.head?1:0};
      fixState();store();
      document.querySelectorAll('.modal').forEach(x=>x.remove());route();
      toast('☁️','Spielstand geladen!');sfx('win');
    };
  },()=>fail('Keine Verbindung zum Server. Bist du online?'));
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
const allChoice=m=>openWorlds(m).filter(x=>!x.noMix).map(x=>flat(pool(x))); // noMix: Schreib-Spiele nicht in Endgegner/Blitz
function start(wid){
  const m=CUR;const w=findWorld(m,wid);if(!w||!isOpen(m,wid)||!isReady(m,w))return;
  stopTimer();
  const kind=w.kind||'world';let qs;
  if(kind==='blitz'){if(!blitzLeft())return LernApp._locked(BLITZ_DONE);useBlitz()}
  if(kind==='boss')qs=mix(allChoice(m),w.count);
  else if(kind==='exam')qs=mix(openWorlds(m).map(writePool),w.count);
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
  Q.opts=q.input||q.spot?[]:q.fixed?q.options:shuffle(q.options);Q.marks=[];
  const blitz=Q.kind==='blitz';
  const pct=Math.round(Q.i/Q.qs.length*100);
  const body=q.spot
    ?`<div class="spot">${q.spot.tokens.map((k,i)=>`<button class="tok ${/^[.,!?:;]$/.test(k.t)?'pt':''}" onclick="LernApp._tap(${i})">${esc(k.t)}</button>`).join('')}</div>
      <div class="spotbar"><span id="spotn">0 von ${q.spot.n} gefunden</span><button class="btn primary" id="spotgo" disabled onclick="LernApp._spotCheck()">Prüfen</button></div>`
    :q.input
    ?`<form class="wform" onsubmit="return LernApp._submit(event)"><input id="win" type="text"${q.num?' inputmode="decimal"':''} autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" enterkeyhint="done" placeholder="${q.num?'Zahl eintippen …':'Hier schreiben …'}"><button class="btn primary" type="submit">Prüfen</button></form>${q.num?'':'<div class="whint">Achte auf Groß- und Kleinschreibung!</div>'}`
    :`<div class="opts ${q.big?'big':''} n${Q.opts.length}">${Q.opts.map((o,i)=>`<button class="opt" onclick="LernApp._answer(${i})"><span class="key">${i+1}</span>${esc(o)}</button>`).join('')}</div>`;
  app.innerHTML=`<div class="${w.gold?'goldq':''}" style="--wc:${w.color};--wc2:${w.color2||w.color}">
   <div class="qtop"><button class="iconbtn" onclick="LernApp._quit()" aria-label="Beenden">✕</button>
    ${blitz?`<div class="pbar"><div class="pfill tfill" style="width:${Math.max(0,Q.end-Date.now())/(w.seconds*1000)*100}%"></div></div><div class="streak tleft">${Math.ceil(Math.max(0,Q.end-Date.now())/1000)}s</div><div class="streak">⚡ ${Q.score}</div>`
      :`<div class="pbar"><div class="pfill" style="width:${pct}%"></div></div>${Q.kind==='boss'?`<div class="hearts">${heartsHTML()}</div>`:''}<div class="streak ${Q.streak>=3?'hot':''}">🔥 ${Q.streak}</div>`}</div>
   <div class="qmeta"><span>${w.icon} ${Q.inRetry?'Fehler-Runde':esc(w.name)}</span><span>${blitz?'Rekord: '+(S.blitz[Q.m.id]||0):`Frage ${Q.i+1} / ${Q.qs.length}`}</span></div>
   <div class="qcard ${blitz?'':'pop'}" id="qcard"><div class="qtask">${q.task||''}</div><div class="qprompt">${q.say?sayHTML():''}${q.prompt}</div>${body}</div>
   <div id="fb"></div></div>`;
  if(!blitz)scrollTo({top:0,behavior:'smooth'});
  if(q.input){const inp=$('#win');if(inp)inp.focus()}
  if(q.say)say(); // direkt im Tipp des Kindes, sonst spielt iOS nichts ab
}
/* ---- Hör-Diktat: Vorlesen mit der eingebauten Sprachausgabe ---- */
const canSpeak=()=>'speechSynthesis' in window&&'SpeechSynthesisUtterance' in window;
function sayHTML(){
  if(!canSpeak())return `<div class="saynot">Dein Gerät kann leider nicht vorlesen. Lass dir das Wort von Mama oder Papa sagen: <b>${esc(Q.qs[Q.i].say)}</b></div>`;
  return `<div class="say"><button class="sayb" onclick="LernApp._say()" aria-label="Anhören">🔊</button><button class="btn ghost slow" onclick="LernApp._say(1)">🐢 Langsam</button></div>`;
}
function say(slow){
  if(!Q||!canSpeak())return;
  const q=Q.qs[Q.i];if(!q||!q.say)return;
  try{
    const ss=speechSynthesis;ss.cancel();
    const u=new SpeechSynthesisUtterance(q.say);u.lang='de-DE';u.rate=slow?.55:.85;
    const v=ss.getVoices().filter(x=>/^de/i.test(x.lang));
    if(v.length)u.voice=v.find(x=>/Anna|Petra|Helena|Google/i.test(x.name))||v[0];
    ss.speak(u);
    const b=$('.sayb');if(b){b.classList.remove('talk');void b.offsetWidth;b.classList.add('talk')}
  }catch(e){}
}
if(canSpeak()){try{speechSynthesis.getVoices();speechSynthesis.onvoiceschanged=()=>{}}catch(e){}}
/* ---- Fehler-Detektiv: falsche Wörter antippen ---- */
function tap(i){
  if(!Q||Q.locked)return;
  const q=Q.qs[Q.i];if(!q.spot)return;
  const k=Q.marks.indexOf(i);
  if(k>=0)Q.marks.splice(k,1);
  else{if(Q.marks.length>=q.spot.n){toast('🕵️',`Es sind nur ${q.spot.n} ${q.spot.n===1?'Fehler':'Fehler'}. Tippe ein Wort nochmal an, um es abzuwählen.`);return}Q.marks.push(i)}
  document.querySelectorAll('.tok').forEach((b,j)=>b.classList.toggle('on',Q.marks.indexOf(j)>=0));
  const n=$('#spotn');if(n)n.textContent=`${Q.marks.length} von ${q.spot.n} gefunden`;
  const g=$('#spotgo');if(g)g.disabled=Q.marks.length!==q.spot.n;
  sfx('tick');
}
function spotCheck(){
  if(!Q||Q.locked)return;
  const q=Q.qs[Q.i];if(!q.spot||Q.marks.length!==q.spot.n)return;
  let ok=true;
  document.querySelectorAll('.tok').forEach((b,j)=>{
    const t=q.spot.tokens[j],marked=Q.marks.indexOf(j)>=0;b.disabled=true;b.classList.remove('on');
    if(t.fix){b.innerHTML=`<s>${esc(t.t)}</s> ${esc(t.fix)}`;b.classList.add(marked?'right':'missed');if(!marked)ok=false}
    else if(marked){b.classList.add('wrong');ok=false}
  });
  const g=$('#spotgo');if(g)g.disabled=true;
  judge(ok,g||$('#qcard'),Q.marks.join(','));
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
    S.correct++;Q.ok++;S.pc[bkey(m)]=(S.pc[bkey(m)]||0)+1;
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
  if(ok)checkPackBadges(m,{kind:Q.kind,world:Q.w.id,streak:Q.streak});
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
    sub=q.spot?'<span class="k right">grün</span> = gefunden · <span class="k missed">orange</span> = übersehen · <span class="k wrong">rot</span> = war gar kein Fehler.'
      :q.input?`Richtig ist: <b>${esc(q.answer)}</b>${Q.caseHint?'<br>👀 Fast! Achte auf <b>Groß- und Kleinschreibung</b>.':''}`:'Die richtige Antwort ist grün.';
    if(Q.kind==='world')sub+=' Die Frage kommt später nochmal!';
    if((Q.kind==='exam'||Q.kind==='boss')&&isOpen(m,'chest'))sub+=' Sie wandert in deine 💎 Schatzkiste.';
  }
  $('#fb').innerHTML=`<div class="fb ${ok?'ok':'no'}"><div class="fbhead"><span class="owl">${m.mascot||'🦉'}</span><div>
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
  markDay(m);dailyDone(m,Q.ok>0);
  /* ---- Blitzrunde ---- */
  if(kind==='blitz'){
    const old=S.blitz[m.id]||0,rec=Q.score>old;if(rec)S.blitz[m.id]=Q.score;
    if(Q.score>=15)grant('blitz15');checkPackBadges(m,{kind,world:w.id,score:Q.score,won:true});save();
    app.innerHTML=`<div class="result" style="--wc:${w.color}"><div class="re">${rec?'🏆':'⚡'}</div>
      <h2>${Q.score} richtig in ${w.seconds} Sekunden!</h2>
      <p>${rec?(old?`Neuer Rekord! Vorher: ${old}`:'Dein erster Rekord!'):`Rekord: ${old} – schaffst du ihn beim nächsten Mal?`}</p>
      <div class="rstats"><div>${Q.score}<small>richtig</small></div><div>${Q.bad||0}<small>falsch</small></div><div>+${Q.xpGain} XP<small>gesammelt</small></div></div>
      <p class="challenge">👨‍👩‍👦 Fordere Mama oder Papa heraus: Wer schafft mehr?</p>
      ${badgesNew()}${(()=>{const l=blitzLeft();return l?`<p class="mini">Heute noch ${l} ${l===1?'Blitzrunde':'Blitzrunden'}.</p>${resultBtns(m,'blitz','⚡ Nochmal')}`:`<p>Das war deine letzte Blitzrunde für heute. Morgen geht's weiter! 🌙</p><div class="rbtns"><button class="btn primary" onclick="LernApp.go('${m.id}')">🗺️ Zur Karte</button></div>`})()}</div>`;
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
  const readyBefore=gated(m).filter(x=>isReady(m,x)).map(x=>x.id);
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
  checkPackBadges(m,{kind,world:w.id,gold:!!w.gold,stars,won:!lost,errors:Q.errors,best:Q.maxStreak});
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
  // Durch diese Runde neu freigeschaltet (w.after) – oder: was mit mehr Sternen aufgehen würde
  const fresh=gated(m).filter(x=>isOpen(m,x.id)&&isReady(m,x)&&readyBefore.indexOf(x.id)<0);
  const nextW=gated(m).filter(x=>afterOf(m,x)===w.id&&isOpen(m,x.id)&&!isReady(m,x));
  let primary=[w.id,'🔁 Nochmal'];
  if(fresh.length)primary=[fresh[0].id,fresh[0].icon+' Weiter: '+esc(fresh[0].name)];
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
    ${fresh.length?`<p class="awake fresh">🎁 Neu freigeschaltet: ${fresh.map(x=>x.icon+' '+esc(x.name)).join(', ')}!</p>`:''}
    ${nextW.length&&!lost?`<p class="mini nextw">🔒 Mit ${needOf(nextW[0])} Sternen ${nextW.length>1?'öffnen sich':'öffnet sich'} ${nextW.map(x=>x.icon+' '+esc(x.name)).join(' und ')}.</p>`:''}
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
  _backupAsk:backupAsk,_backupSave:backupSave,_backupLoad:backupLoad,
  _backupPick(){const i=$('#bfile');if(i)i.click()},
  _codeAsk:codeAsk,_codeLoad(id){document.querySelectorAll('.modal').forEach(x=>x.remove());codeLoad(id)},
  _syncForce(btn){btn.disabled=true;syncPush(true).then(syncBoxUpdate)},
  _copyCode(btn){const c=showCode(),ok=()=>{btn.textContent='✅'};
    try{navigator.clipboard.writeText(c).then(ok,()=>prompt('Code:',c))}catch(e){prompt('Code:',c)}},
  _answer:answer,_submit:submit,_tap:tap,_spotCheck:spotCheck,_say:say,_next:next,_cheat:cheat,_resetAsk:resetAsk,
  _quit(){stopTimer();Q=null;route()},
  _locked(msg){toast('🔒',msg||'Noch gesperrt!')},
  _setName(v){S.name=v.trim();save();route()},
  _toggleSound(){S.sound=!S.sound;save();route()},
  _reset(btn){S=Object.assign(FRESH(),{name:S.name,sound:S.sound,sync:S.sync});save();btn.closest('.modal').remove();route()},
  /** nur für tools/check.js */
  _internals:{pool,writePool,byKey,findWorld,starWorlds,checkPackBadges,cur:()=>Q}
});

/* ================= Boot & offline ================= */
function boot(){
  // Spielstände von vor der Tages-Serie: es wurde heute schon geübt (App ging erst heute online).
  if(!Array.isArray(SAVED.days)&&S.answered>0&&S.days.length===0){S.days=[dkey(today0())];save()}
  route();
  // Server-Sicherung: beim Start, beim Wegwechseln und wenn wieder online
  if(SYNC_URL){
    setTimeout(()=>syncPush(),3000);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')syncPush()});
    addEventListener('online',()=>syncPush());
  }
  // Speicher als dauerhaft markieren, damit der Browser den Spielstand nicht von selbst wegräumt
  try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{})}catch(e){}
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
