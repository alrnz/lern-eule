/* Lernwörter: jede Woche 10 neue Wörter aus der Schule.
 * Neue Woche = neuen Eintrag OBEN in WOCHEN anfügen. Jede Woche wird ein eigenes Lernpaket
 * (id "lernwoerter-<from>", nie ändern) und erscheint auf der Startseite unter „✏️ Lernwörter“:
 * die aktuelle und die letzte Woche direkt, ältere unter „Ältere Lernwörter“.
 * Eine Woche wird online erst ab `from` angezeigt (lokal immer).
 * closed:[…] sperrt Spiele vorerst (Welt-IDs oder chest/blitz/exam/gold). Freischalten: aus closed nehmen und
 * unlock:{id:'JJJJ-MM-TT'} setzen, dann kündigt die App sie an dem Tag an. Lokal ist immer alles offen.
 *
 * Wort-Eintrag: 'Wort' oder {w:'Wort', tip:'HTML', say:'Vorlese-Text', accept:['auch richtig'], wrong:['falsche Schreibweisen'],
 *   gap:['richtig','falsch',…] = Stelle fürs Lücken-Spiel (erstes Vorkommen), sonst automatisch}
 * (alles außer w optional). say nur im Notfall und dann nur das eine Wort (Hör-Diktat liest einzelne Wörter, keine Sätze),
 * accept z. B. mit Artikel ('der Abend'), wrong kommt vor den automatisch erzeugten Fehlern.
 * Groß/klein zählt beim Schreiben, also Nomen groß eintragen.
 * Reihenfolge der Wörter einer Woche nie ändern (Schatzkiste), höchstens hinten anfügen.
 */
(function(){
const {shuffle,pick3,uniq,esc}=LernApp.util;

const WOCHEN=[
 {from:'2026-11-16', // optional: test:'2026-11-27' (Diktat-Datum, zeigt Countdown)
  unlock:{richtig:'2026-11-19',luecke:'2026-11-20',detektiv:'2026-11-20',chest:'2026-11-20',blitz:'2026-11-20',gold:'2026-11-20'},
  words:[
   {w:'Abend',accept:['der Abend'],tip:'Am Ende hört man t. Verlängern: die A-ben-<b>d</b>e → Aben<b>d</b>. Nomen schreibt man groß.'},
   {w:'befehlen',tip:'be-feh-len: Das <b>h</b> hört man nicht – merken!',wrong:['befelen','befählen']},
   {w:'befiehlt',accept:['er befiehlt'],tip:'Aus e wird <b>ie</b>: befehlen → er bef<b>ie</b>hlt. Das <b>h</b> bleibt!',wrong:['befielt','befehlt','befihlt']},
   {w:'Burg',accept:['die Burg'],tip:'Am Ende hört man k. Verlängern: die Bur-<b>g</b>en → Bur<b>g</b>.'},
   {w:'Burgen',gap:['g','k'],accept:['die Burgen'],tip:'Mehrzahl von die Burg: Bur-gen. Nomen schreibt man groß.'},
   {w:'essen',tip:'es-sen: kurzes e, darum doppeltes <b>ss</b>.'},
   {w:'iss',gap:['i','e'],tip:'Aus e wird <b>i</b>: essen → <b>i</b>ss! Das <b>ss</b> bleibt.',wrong:['is','ess','iß']},
   {w:'werfen',gap:['e','ä'],tip:'wer-fen: Sprich die Silben deutlich.',wrong:['wärfen','werfn']},
   {w:'wirf',gap:['i','e','ie'],tip:'Aus e wird <b>i</b>: werfen → w<b>i</b>rf!',wrong:['werf','wierf','wirv']},
   {w:'lesen',gap:['e','eh','ee'],tip:'le-sen: langes e, nur ein <b>s</b>.',wrong:['lehsen','leesen']},
   {w:'lies',tip:'Aus e wird <b>ie</b>: lesen → l<b>ie</b>s! (langes i)',wrong:['lis','les','liess']}
  ]}
];

/* ---------- Knifflige Stellen im Wort finden ---------- */
// Jede Regel: Muster, falsche Schreibweisen, Erklärung. Reihenfolge = Wichtigkeit für das Lücken-Spiel.
const RULES=[
 [/ie/g,()=>['i','ih'],'Langes i schreibt man meist <b>ie</b>.'],
 [/ck/g,()=>['k','kk'],'Nach kurzem Selbstlaut: <b>ck</b> (nie kk).'],
 [/tz/g,()=>['z','zz'],'Nach kurzem Selbstlaut: <b>tz</b> (nie zz).'],
 [/ß/g,()=>['ss','s'],'Nach langem Selbstlaut oder au/ei: <b>ß</b>.'],
 [/([aeiouäöü])h(?=[lmnrt])/g,s=>'aeo'.indexOf(s[0])>=0?[s[0],s[0]+s[0]]:[s[0]],'Das <b>h</b> hört man nicht – merken!'],
 [/(aa|ee|oo)/g,s=>[s[0],s[0]+'h'],'Doppelter Selbstlaut – ein Merkwort!'],
 [/äu/g,()=>['eu','oi'],'<b>äu</b> kommt von au (Haus – Häuser).'],
 [/eu/g,()=>['oi','äu'],'Man hört „oi“, man schreibt <b>eu</b>.'],
 [/ä(?!u)/g,()=>['e'],'<b>ä</b> kommt oft von a (Hand – Hände).'],
 [/(bb|dd|ff|gg|ll|mm|nn|pp|rr|ss|tt)/g,s=>s==='ss'?['s','ß']:[s[0]],'Nach kurzem Selbstlaut: doppelter Mitlaut.'],
 [/^[Ss][pt]/g,s=>[s[0]+'ch'+s[1]],'Am Anfang hört man „schp/scht“, man schreibt <b>sp/st</b>.'],
 [/[dgb]$/g,s=>[{d:'t',g:'k',b:'p'}[s]],'Verlängern hilft: Hun<b>d</b> – Hun<b>d</b>e.'],
 [/chs/g,()=>['x','ks'],'Hier schreibt man <b>chs</b>.'],
 [/qu/gi,s=>[s[0]==='Q'?'Kw':'kw'],'<b>Qu</b> spricht man wie kw.'],
 [/^[Vv]/g,s=>[s==='V'?'F':'f'],'Merkwort mit <b>V</b>.'],
 [/pf/g,()=>['f'],'Hier schreibt man <b>pf</b>.'],
 [/([aeiouäöü])h(?=[aeiouäöü])/g,s=>[s[0]],'Das <b>h</b> trennt die Silben (ge-hen) – sprich deutlich!'],
 [/ei/g,()=>['ai'],'Man hört „ai“, man schreibt meist <b>ei</b>.'],
 // Weniger knifflig, aber typische Fehler – damit jedes Wort genug falsche Schreibweisen hat:
 [/e[lnr]$/g,s=>s==='er'?['a','r']:[s[1]],'Am Ende nicht vergessen: <b>-el, -en, -er</b> (das e hört man kaum).',1],
 [/[bpdtgk](?!$)/,s=>[{b:'p',p:'b',d:'t',t:'d',g:'k',k:'g'}[s]],'Deutlich sprechen hilft: b oder p? d oder t? g oder k?',1]
];
const isNoun=w=>w[0]!==w[0].toLowerCase();
const swapCase=w=>(isNoun(w)?w[0].toLowerCase():w[0].toUpperCase())+w.slice(1);
const caseWhy=w=>isNoun(w)?'Nomen schreibt man <b>groß</b>.':'Verben und Adjektive schreibt man <b>klein</b>.';
/** Alle kniffligen Stellen: {i,len,seg,alts,why}. Die Groß/klein-Stelle kommt immer als letzte. */
function spots(w){
  const out=[],used={};
  RULES.forEach(r=>{
    r[0].lastIndex=0;let x;
    while((x=r[0].exec(w))){
      const i=x.index,len=x[0].length;let free=true;
      for(let k=i;k<i+len;k++)if(used[k])free=false;
      if(free){for(let k=i;k<i+len;k++)used[k]=1;out.push({i,len,seg:x[0],alts:r[1](x[0]).filter(a=>a!==x[0]),why:r[2],weak:!!r[3]})}
      if(!r[0].global)break;
    }
  });
  out.push({i:0,len:1,seg:w[0],alts:[swapCase(w)[0]],why:caseWhy(w),cs:true});
  return out;
}
/** Falsche Schreibweisen, immer in derselben Reihenfolge (die Schatzkiste muss Fragen wiederfinden). */
function wrongs(w,own){
  const v=(own||[]).slice();
  spots(w).forEach(s=>{if(!s.cs)s.alts.forEach(a=>v.push(w.slice(0,s.i)+a+w.slice(s.i+s.len)))});
  // Groß/klein als Fehler: bei Nomen immer; bei anderen Wörtern nur zur Not (das Essen, das Lesen gibt es ja auch).
  const c=swapCase(w),out=uniq(v).filter(x=>x!==w);
  return isNoun(w)||!out.length?uniq(out.concat([c])).filter(x=>x!==w):out;
}
/** Wort groß, knifflige Stellen markiert */
/** Stellen für die Erklärung: die echten Rechtschreib-Stellen, nur wenn es keine gibt die schwachen. */
function keySpots(w){
  const sp=spots(w).filter(s=>!s.cs),strong=sp.filter(s=>!s.weak);
  return strong.length?strong:sp;
}
function marked(w){
  const sp=keySpots(w).slice().sort((a,b)=>a.i-b.i);let h='',p=0;
  sp.forEach(s=>{h+=esc(w.slice(p,s.i))+`<span class="hl">${esc(s.seg)}</span>`;p=s.i+s.len});
  return `<div class="bigword">${h+esc(w.slice(p))}</div>`;
}
function tipOf(W){
  if(W.tip)return W.tip;
  return uniq(keySpots(W.w).map(s=>s.why)).slice(0,2).concat([caseWhy(W.w)]).join(' ');
}
const explainOf=W=>`${marked(W.w)}${tipOf(W)}`;

/* ---------- Lernpaket pro Woche ---------- */
// Wird noch ein Spiel später freigeschaltet? (für den Begrüßungstext)
function later(week){
  const t=new Date(),k=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
  return Object.keys(week.unlock||{}).some(id=>week.unlock[id]>k);
}
function build(week){
  const W=week.words.map(x=>{const o=typeof x==='string'?{w:x}:x;return {w:o.w,tip:o.tip||'',say:o.say||o.w,accept:[o.w].concat(o.accept||[]),wrong:o.wrong||[],gap:o.gap}});
  const ws=W.map(x=>x.w),n=W.length;
  const d=week.from.split('-'),label=`${+d[2]}.${+d[1]}.`;
  const list=`<div class="wlist">${W.map(x=>`<div>${esc(x.w)}</div>`).join('')}</div>`;
  LernApp.register({
    id:'lernwoerter-'+week.from, group:'lernwoerter', from:week.from,
    subject:'Lernwörter', title:'Lernwörter vom '+label,
    subtitle:ws.slice(0,4).join(', ')+(n>4?' …':''),
    date:week.test, testName:'Diktat',
    icon:'✏️', color:'#16a34a', daily:true, dailyName:'Lernwörter', questionsPerWorld:n, noExam:true,
    closed:week.closed, unlock:week.unlock,
    hello:(week.closed&&week.closed.length)||later(week)?`Deine ${n} Lernwörter! Weitere Spiele kommen bald. ✍️`
      :`Deine ${n} Lernwörter! Spiel die Welten und besieg zum Schluss das Wörter-Monster. ✍️`,
    worlds:[
      {id:'richtig',name:'Richtig geschrieben?',icon:'🔍',color:'#7c3aed',color2:'#a78bfa',
       topic:'Welches Wort ist richtig geschrieben?',
       cats:()=>[W.map(x=>()=>({task:'Welches Wort ist richtig geschrieben?',prompt:'🔍',options:[x.w].concat(wrongs(x.w,x.wrong).slice(0,3)),answer:x.w,explain:explainOf(x)}))]},
      {id:'luecke',name:'Lücken-Wörter',icon:'🧩',color:'#ea580c',color2:'#fb923c',
       topic:'Welche Buchstaben fehlen?',
       cats:()=>[W.map(x=>()=>{const s=x.gap?{i:x.w.indexOf(x.gap[0]),len:x.gap[0].length,seg:x.gap[0],alts:x.gap.slice(1)}:spots(x.w)[0];
         return {task:'Welche Buchstaben fehlen?',prompt:`<div class="bigword">${esc(x.w.slice(0,s.i))}<span class="gap">?</span>${esc(x.w.slice(s.i+s.len))}</div>`,
           options:[s.seg].concat(s.alts),answer:s.seg,big:true,explain:explainOf(x)}})]},
      {id:'detektiv',name:'Fehler-Finder',icon:'🕵️',color:'#334155',color2:'#64748b',
       topic:'Ein Wort ist falsch geschrieben. Findest du es?',
       cats:()=>[W.map((x,i)=>()=>{const v=wrongs(x.w,x.wrong),bad=v[(i*3)%v.length];
         return {task:'Ein Wort ist falsch geschrieben. Tipp es an!',prompt:'🕵️',options:[bad].concat(pick3(x.w,ws).filter(o=>o!==bad)),answer:bad,
           explain:`Richtig ist:${explainOf(x)}`}})]}
    ],
    boss:{name:'Wörter-Monster',icon:'👾',count:12,lives:3},
    // Abzeichen gelten für alle Lernwörter-Wochen gemeinsam
    badgeGroup:'lernwoerter',badgeTitle:'Lernwörter-Abzeichen',
    badges:[
      {id:'woche',icon:'✏️',name:'Wort-Starter',desc:'Ein Lernwörter-Spiel geschafft',test:c=>c.kind==='world'&&c.stars>0},
      {id:'ohr',retired:true,icon:'🎧',name:'Spitzen-Ohr',desc:'3 Sterne im Hör-Diktat',test:c=>c.world==='hoeren'&&c.stars>=3},
      {id:'blick',retired:true,icon:'👀',name:'Adlerauge',desc:'3 Sterne im Blitzblick',test:c=>c.world==='blick'&&c.stars>=3},
      {id:'finder',icon:'🕵️',name:'Fehler-Finder',desc:'3 Sterne im Fehler-Finder',test:c=>c.world==='detektiv'&&c.stars>=3},
      {id:'diktat',retired:true,icon:'📝',name:'Diktat-Profi',desc:'Probetest mit 3 Sternen',test:c=>c.kind==='exam'&&c.stars>=3},
      {id:'monster',icon:'👾',name:'Monster-Bändiger',desc:'Das Wörter-Monster besiegt',test:c=>c.kind==='boss'&&c.won&&!c.gold},
      {id:'woche3',icon:'🌟',name:'Wochen-Star',desc:'Alle Sterne einer Lernwörter-Woche',test:c=>c.allStars},
      {id:'r50',icon:'🖍️',name:'Schreib-Fleißig',desc:'50 Lernwörter richtig',test:c=>c.correct>=50},
      {id:'r300',icon:'🏅',name:'Wörter-Meister',desc:'300 Lernwörter richtig',test:c=>c.correct>=300}
    ]
  });
}
WOCHEN.forEach(build);
})();
