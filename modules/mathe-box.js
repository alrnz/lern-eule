/* Lernpaket: Affen-Box – das Einmaleins wie mit der Karteikartenbox, dauerhaft zum Üben.
 * Idee nach Ina („Hallo Lernen“): so leicht anfangen, dass das Kind sofort merkt „Das kann ich!“,
 * dann in Minischritten steigern. Affe Kiki klettert Ast für Ast den Baum hoch:
 * 10er → 2er → 5er → 4er → 3er → 6er → 9er → 8er → 7er, oben wartet die Mix-Box (die 36 Karten 2·2 … 9·9).
 * Der nächste Ast öffnet sich erst mit 2 Sternen im Ast davor (w.after, siehe CLAUDE.md).
 * Ab dem 2. Ast kommen in jeder Runde auch Karten aus den schon geschafften Reihen dran („Das kannst du schon!“).
 *
 * Alle Fragen sind fest (keine Zufallszahlen), damit die Schatzkiste sie wiederfindet:
 * REIHEN nie umsortieren, neue Kategorien nur hinten anfügen.
 */
(function(){
const {pick3}=LernApp.util;
const G='<span class="gap">?</span>';

/* Reihenfolge = Kletterweg. how(k) erklärt k · n mit einem leichten Trick. */
const REIHEN=[
 {n:10,icon:'🍌',color:'#16a34a',color2:'#4ade80',tip:'Mal 10 ist leicht: Hänge einfach eine <b>0</b> an. 4 · 10 = 4<b>0</b>',
  how:k=>`Hänge an die ${k} eine 0 an → <b>${k*10}</b>`},
 {n:2,icon:'🐒',color:'#65a30d',color2:'#a3e635',tip:'Mal 2 heißt <b>verdoppeln</b>: 7 · 2 = 7 + 7 = 14',
  how:k=>`Verdoppeln: ${k} + ${k} = <b>${k*2}</b>`},
 {n:5,icon:'🥥',color:'#a16207',color2:'#facc15',tip:'Mal 5 ist die <b>Hälfte</b> von mal 10: 6 · 10 = 60, die Hälfte ist 30. Die Ergebnisse enden immer auf <b>0 oder 5</b>.',
  how:k=>`Die Hälfte von ${k} · 10 = ${k*10} ist <b>${k*5}</b>.`},
 {n:4,icon:'🦜',color:'#0891b2',color2:'#22d3ee',tip:'Mal 4 heißt <b>zweimal verdoppeln</b>: 6 → 12 → 24',
  how:k=>`Zweimal verdoppeln: ${k} → ${k*2} → <b>${k*4}</b>`},
 {n:3,icon:'🐸',color:'#059669',color2:'#34d399',tip:'Mal 3 ist mal 2 und <b>noch einmal dazu</b>: 6 · 3 = 12 + 6 = 18',
  how:k=>`${k} · 2 = ${k*2}, dazu noch ${k} → <b>${k*3}</b>`},
 {n:6,icon:'🦎',color:'#7c3aed',color2:'#a78bfa',tip:'Mal 6 ist mal 5 und <b>noch einmal dazu</b>: 7 · 6 = 35 + 7 = 42',
  how:k=>`${k} · 5 = ${k*5}, dazu noch ${k} → <b>${k*6}</b>`},
 {n:9,icon:'🐍',color:'#db2777',color2:'#f472b6',tip:'Mal 9 ist mal 10 und <b>einmal weniger</b>: 7 · 9 = 70 − 7 = 63',
  how:k=>`${k} · 10 = ${k*10}, weg ${k} → <b>${k*9}</b>`},
 {n:8,icon:'🦋',color:'#ea580c',color2:'#fb923c',tip:'Mal 8 heißt <b>dreimal verdoppeln</b>: 3 → 6 → 12 → 24',
  how:k=>`Dreimal verdoppeln: ${k} → ${k*2} → ${k*4} → <b>${k*8}</b>`},
 {n:7,icon:'🐆',color:'#dc2626',color2:'#f87171',tip:'Die 7er-Reihe kennst du fast schon! <b>Tauschaufgaben</b> helfen: 8 · 7 = 7 · 8 = 56. Neu ist eigentlich nur 7 · 7 = 49.',
  how:k=>`${k} · 5 = ${k*5}, dazu ${k} · 2 = ${k*2} → <b>${k*7}</b>`}
];
const R={};REIHEN.forEach(r=>{R[r.n]=r});

/* Kernaufgaben (mal 1, 2, 5, 10) gehen für jede Reihe gleich */
function way(k,n){
  const p=k*n;
  if([10,2,5].indexOf(n)>=0||[1,2,5,10].indexOf(k)<0)return R[n].how(k); // die leichten Reihen haben den einfachsten Trick
  if(k===1)return `Einmal ${n} ist einfach <b>${n}</b>.`;
  if(k===2)return `Verdoppeln: ${n} + ${n} = <b>${p}</b>`;
  if(k===5)return `Die Hälfte von 10 · ${n} = ${10*n} ist <b>${p}</b>.`;
  return `Hänge an die ${n} eine 0 an → <b>${p}</b>`;
}
/* Bananen-Bild: k Reihen mit je n Bananen (nur bei kleinen Aufgaben) */
const pic=(k,n)=>k*n>30?'':`<div class="bananas">${Array.from({length:k},()=>'🍌'.repeat(n)).join('<br>')}</div>`;
const explainOf=(k,n)=>`<div class="bigword">${k} · ${n} = ${k*n}</div>${way(k,n)}${pic(k,n)}`;
const opts=(ans,cands)=>{const a=String(ans);return [a].concat(pick3(a,cands.filter(x=>x>0).map(String)))};
const wrongP=(k,n)=>{const p=k*n;return [p+n,p-n,p+1,p-1,p+10,p-10,k+n,(k+1)*(n+1)]};
const K=[1,2,3,4,5,6,7,8,9,10];

/* ---------- Fragen ---------- */
const qMal=(k,n,task)=>({task:task||'Rechne!',prompt:`<div class="bigword">${k} · ${n} = ${G}</div>`,options:opts(k*n,wrongP(k,n)),answer:String(k*n),explain:explainOf(k,n)});
const qTausch=(k,n)=>({task:'Tauschaufgabe',prompt:`<div class="bigword">${n} · ${k} = ${G}</div>`,options:opts(k*n,wrongP(k,n)),answer:String(k*n),
  explain:`Tauschen ist erlaubt: ${n} · ${k} ist dasselbe wie ${k} · ${n}.${explainOf(k,n)}`});
const qLuecke=(k,n)=>({task:'Welche Zahl fehlt?',prompt:`<div class="bigword">${G} · ${n} = ${k*n}</div>`,options:opts(k,[k+1,k-1,k+2,k-2]),answer:String(k),big:true,
  explain:`Wie oft passt die ${n} in die ${k*n}? Genau <b>${k}</b>-mal.${explainOf(k,n)}`});
const qFolge=(s,n)=>{const a=[s*n,(s+1)*n,(s+2)*n],ans=(s+3)*n;
  return {task:`Wie geht die ${n}er-Reihe weiter?`,prompt:`<div class="bigword">${a.join(', ')}, ${G}</div>`,options:opts(ans,[ans+n,ans-1,ans+1,ans+2*n,ans+10]),answer:String(ans),
    explain:`In der ${n}er-Reihe kommt immer <b>${n}</b> dazu: ${a[2]} + ${n} = <b>${ans}</b>`}};
const qWrite=(k,n)=>({input:true,num:true,task:'Schreib das Ergebnis!',prompt:`<div class="bigword">${k} · ${n} = ${G}</div>`,answer:String(k*n),explain:explainOf(k,n)});

/* Die 36 Karten der Box: alle Aufgaben von 2 · 2 bis 9 · 9 ohne Tauschaufgabe */
const BOX=[];for(let a=2;a<=9;a++)for(let b=a;b<=9;b++)BOX.push([a,b]);

/* ---------- Welten = Äste ---------- */
const worlds=REIHEN.map((r,i)=>{
  const n=r.n,before=REIHEN.slice(0,i);
  return {
    id:'r'+n,name:`${n}er-Ast`,icon:r.icon,color:r.color,color2:r.color2,
    after:i?'r'+REIHEN[i-1].n:undefined,
    topic:i===0?'Ast 1 · Die 10er-Reihe – damit fängst du an!':`Ast ${i+1} · Die ${n}er-Reihe`,
    rules:`<div class="mini">${K.map(k=>`<span>${k} · ${n} = ${k*n}</span>`).join('')}</div><p>💡 ${r.tip}</p>`,
    cats:()=>{
      const c=[
        K.map(k=>()=>qMal(k,n)),
        K.filter(k=>k!==n).map(k=>()=>qTausch(k,n)),
        K.map(k=>()=>qLuecke(k,n)),
        [1,2,3,4,5,6,7].map(s=>()=>qFolge(s,n))
      ];
      // Wiederholung aus den schon geschafften Ästen
      if(before.length)c.push([].concat.apply([],before.map(b=>K.map(k=>()=>qMal(k,b.n,'🍌 Das kannst du schon!')))));
      return c;
    },
    write:()=>K.map(k=>()=>qWrite(k,n))
  };
});
worlds.push({
  id:'mix',name:'Mix-Box',icon:'📦',color:'#78350f',color2:'#d97706',after:'r7',
  topic:'Ganz oben: alle 36 Karten bunt gemischt!',
  rules:'Alle Reihen durcheinander. Denk an die Tricks: verdoppeln, die Hälfte von mal 10, Tauschaufgaben!',
  cats:()=>[
    BOX.map(([a,b])=>()=>qMal(a,b,'📦 Karte aus der Box')),
    BOX.map(([a,b])=>()=>qLuecke(a,b))
  ],
  write:()=>BOX.map(([a,b])=>()=>qWrite(a,b))
});

const ast=id=>c=>c.starsIn(id)>0;
LernApp.register({
  id:'mathe-box',
  subject:'Mathe', title:'Affen-Box', subtitle:'Einmaleins – Ast für Ast nach oben',
  icon:'🐵', color:'#a16207', mascot:'🐵', daily:true, dailyName:'Affen-Box',
  hello:'Ich bin Kiki! Wir fangen ganz unten an – das kannst du schon. Mit <b>2 Sternen</b> geht der nächste Ast auf. 🍌',
  questionsPerWorld:10, examCount:15,
  missionAfter:{blitz:'r2',exam:'r5'}, // Blitzrunde ab 2 Sternen im 2er-Ast, Probetest ab 2 Sternen im 5er-Ast
  worlds,
  boss:{name:'Gorilla Gustav',icon:'🦍',count:15,lives:3,goldName:'Goldener Gorilla'},
  badgeTitle:'Affen-Abzeichen',
  badges:[
    {id:'banane',icon:'🍌',name:'Erste Banane',desc:'Den 10er-Ast geschafft',test:ast('r10')},
    {id:'kern',icon:'🐒',name:'Kern-Kletterer',desc:'10er, 2er und 5er geschafft',test:c=>['r10','r2','r5'].every(id=>c.starsIn(id)>0)},
    {id:'halb',icon:'🌴',name:'Halb oben',desc:'5 Äste geschafft',test:c=>REIHEN.slice(0,5).every(r=>c.starsIn('r'+r.n)>0)},
    {id:'sieben',icon:'🐆',name:'7er-Bezwinger',desc:'Die schwerste Reihe geschafft',test:ast('r7')},
    {id:'wipfel',icon:'🌳',name:'Baumwipfel',desc:'Alle Reihen geschafft',test:c=>REIHEN.every(r=>c.starsIn('r'+r.n)>0)},
    {id:'sterne',icon:'⭐',name:'Sternen-Affe',desc:'3 Sterne auf 5 Ästen',test:c=>REIHEN.filter(r=>c.starsIn('r'+r.n)>=3).length>=5},
    {id:'box',icon:'📦',name:'Box-Profi',desc:'3 Sterne in der Mix-Box',test:c=>c.starsIn('mix')>=3},
    {id:'gorilla',icon:'🦍',name:'Gorilla-Bezwinger',desc:'Gorilla Gustav besiegt',test:c=>c.kind==='boss'&&c.won&&!c.gold},
    {id:'gold',icon:'👑',name:'Goldene Banane',desc:'Den goldenen Gorilla besiegt',test:c=>c.kind==='boss'&&c.won&&c.gold},
    {id:'liane',icon:'⚡',name:'Lianen-Blitz',desc:'20 richtig in einer Blitzrunde',test:c=>c.kind==='blitz'&&c.score>=20},
    {id:'r100',icon:'🧮',name:'Rechen-Affe',desc:'100 Aufgaben richtig',test:c=>c.correct>=100},
    {id:'r500',icon:'🏆',name:'Einmaleins-König',desc:'500 Aufgaben richtig',test:c=>c.correct>=500}
  ]
});
})();
