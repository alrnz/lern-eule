/* Lernpaket: Deutsch – Briefe schreiben (dauerhaft, ohne Testdatum)
 * Grundlage: Arbeitsblätter „Der Aufbau eines Briefs“ (Blatt 3 und 4), Ende November 2026.
 * 8 Teile: Ort/Datum, Anrede, Einleitung, Inhalt, Schluss, Gruß, Unterschrift, PS.
 * Komma nach der Anrede, kein Komma nach dem Gruß. Grüße nur wie auf dem Blatt.
 * Schatzkiste: Listen nie umsortieren, Neues nur hinten anfügen.
 */
(function(){
const {shuffle,esc,gapIn}=LernApp.util;

/* ---------- Die 8 Teile (Farben wie auf dem Arbeitsblatt) ---------- */
const PARTS=[
 {k:'ort',name:'Ort/Datum',emo:'🔴',col:'#dc2626',desc:'Damit der Empfänger weiß, <b>wo und wann</b> der Brief geschrieben wurde. Steht oben rechts.'},
 {k:'an',name:'Anrede',emo:'🔵',col:'#2563eb',desc:'Hier spreche ich den Empfänger <b>direkt an</b>. Danach kommt ein <b>Komma</b>.'},
 {k:'ein',name:'Einleitung',emo:'🟢',col:'#16a34a',desc:'Hier steht der <b>Grund</b>, warum ich schreibe – z. B. weil ich mich bedanken oder jemanden einladen möchte.'},
 {k:'inh',name:'Inhalt',emo:'🟣',col:'#7c3aed',desc:'Hier steht <b>alles, was der Empfänger wissen soll</b>. Ich kann auch Fragen stellen.'},
 {k:'sch',name:'Schluss',emo:'⚫',col:'#111827',desc:'Mit diesem Satz <b>schließe ich den Brief ab</b> – z. B. dass ich mich auf eine Antwort freue.'},
 {k:'gr',name:'Gruß',emo:'🟠',col:'#ea580c',desc:'Hier <b>verabschiede</b> ich mich: „Viele liebe Grüße“, „Mit freundlichen Grüßen“, „Bis bald“. <b>Kein Komma!</b>'},
 {k:'un',name:'Unterschrift',emo:'🩷',col:'#db2777',desc:'Hier steht <b>mein Name</b>, damit der Empfänger weiß, wer den Brief geschrieben hat.'},
 {k:'ps',name:'PS',emo:'🟡',col:'#ca8a04',desc:'PS heißt „post scriptum“: <b>Ich habe noch etwas vergessen.</b> Steht ganz unten.'}
];
const KEYS=PARTS.map(p=>p.k);
const P={};PARTS.forEach(p=>{P[p.k]=p});
const label=p=>p.emo+' '+p.name;
const ALL=PARTS.map(label);

/* ---------- Briefe der Tiere (Reihenfolge nie ändern) ---------- */
const BRIEFE=[
 {ort:'Afrika, der 3.12.2026',an:'Liebe Löwin,',ein:'endlich kann ich dir einen Brief schreiben.',
  inh:'Heute habe ich den ganzen Tag in der Sonne gelegen. Was hast du gemacht?',sch:'Ich freue mich schon auf dich.',
  gr:'Viele liebe Grüße',un:'dein Leo',ps:'PS: Bring bitte etwas zu essen mit!'},
 {ort:'Südpol, der 1.12.2026',an:'Lieber Opa,',ein:'ich schreibe dir, weil ich bald Geburtstag habe.',
  inh:'Ich möchte dich zu meiner Party einladen. Wir rutschen auf dem Eis und essen Fisch.',sch:'Ich hoffe, du kannst kommen!',
  gr:'Bis bald',un:'dein Pepe',ps:'PS: Zieh dich warm an!'},
 {ort:'Savanne, der 28.11.2026',an:'Liebe Zoe,',ein:'ich möchte mich für dein tolles Geschenk bedanken.',
  inh:'Der rote Schal passt genau um meinen langen Hals. Ich trage ihn jeden Tag.',sch:'Schreib mir bald zurück!',
  gr:'Viele liebe Grüße',un:'deine Gina',ps:'PS: Grüß deine Mama von mir!'},
 {ort:'Waldstadt, der 20.11.2026',an:'Liebe Oma,',ein:'ich schreibe dir, weil ich bald Winterschlaf mache.',
  inh:'Ich habe viele Blätter gesammelt und mir ein warmes Bett gebaut. Schläfst du auch so gern?',sch:'Ich freue mich, dich im Frühling zu sehen.',
  gr:'Viele liebe Grüße',un:'deine Ida',ps:'PS: Ich habe dich lieb!'},
 {ort:'Wiesenhausen, der 2.12.2026',an:'Liebes Eichhörnchen,',ein:'ich möchte dich zu meinem Wettrennen einladen.',
  inh:'Das Rennen ist am Samstag auf der großen Wiese. Wer gewinnt, bekommt eine Möhre.',sch:'Ich hoffe, du hast Zeit!',
  gr:'Bis bald',un:'dein Hugo',ps:'PS: Übe schon mal das Springen!'},
 {ort:'Dschungel, der 25.11.2026',an:'Lieber Bruder,',ein:'ich muss dir unbedingt etwas erzählen.',
  inh:'Gestern habe ich im Fluss gebadet und alle Affen nass gespritzt. Die haben vielleicht geschimpft!',sch:'Schreib mir, wie es dir geht!',
  gr:'Viele liebe Grüße',un:'dein Emil',ps:'PS: Die Affen sind nicht mehr sauer.'},
 {ort:'Am Nil, der 30.11.2026',an:'Liebe Tante Klara,',ein:'ich möchte mich für den schönen Besuch bedanken.',
  inh:'Der Ausflug zum Fluss war toll. Am schönsten war das Schwimmen mit den Fischen.',sch:'Hoffentlich sehen wir uns bald wieder.',
  gr:'Mit freundlichen Grüßen',un:'deine Kira',ps:'PS: Ich habe meine Zahnbürste bei dir vergessen!'},
 {ort:'Fuchsbau, der 4.12.2026',an:'Lieber Dachs,',ein:'ich schreibe dir, weil ich dich vermisse.',
  inh:'Seit du umgezogen bist, ist es im Wald langweilig. Wie ist dein neuer Bau?',sch:'Ich freue mich auf deine Antwort.',
  gr:'Bis bald',un:'dein Finn',ps:'PS: Ich schicke dir ein Bild von mir mit.'}
];

/* Brief als HTML. on = markierter Teil, lb = Teil-Namen davor zeigen, keys = welche Teile */
function brief(B,o){
  o=o||{};const ks=o.keys||KEYS;
  return '<div class="brief">'+ks.map(k=>`<div class="bz${k==='ort'?' r':''}${o.on===k?' on':''}">${o.lb?`<span class="lb" style="background:${P[k].col}">${P[k].name}</span>`:''}${esc(B[k])}</div>`).join('')+'</div>';
}
const RULES=PARTS.map(p=>`${p.emo} <b>${p.name}</b>`).join(' → ')+
 '<br><br><b>Anrede</b> mit Komma: Liebe Oma<b>,</b><br>Danach geht es <b>klein</b> weiter: <b>i</b>ch schreibe dir …<br><b>Gruß</b> ohne Komma: Viele liebe Grüße<br>Darunter die <b>Unterschrift</b>: dein Leo / deine Gina';

/* ---------- Welt 1: Pfeil-Maler – welcher Teil ist markiert? ---------- */
function qTeil(B,k){
  const p=P[k];
  return {task:'Welcher Teil des Briefs ist markiert?',prompt:brief(B,{on:k}),options:ALL,answer:label(p),fixed:true,
    explain:`${p.emo} <b>${p.name}</b>: ${p.desc}`};
}

/* ---------- Welt 2: Was ist was? ---------- */
// Beschreibungen in eigenen Worten (nach Blatt 4)
const DESC={
 ort:'Ich schreibe es auf, damit der Empfänger weiß, wo und wann der Brief geschrieben wurde.',
 an:'Hiermit spreche ich den Empfänger direkt an.',
 ein:'Hier nenne ich den Grund, warum ich den Brief schreibe.',
 inh:'Hier schreibe ich alles, was der Empfänger wissen muss. Ich kann auch Fragen stellen.',
 sch:'Mit diesem Satz schließe ich den Brief ab, z. B.: Ich freue mich auf deine Antwort.',
 gr:'Hier verabschiede ich mich, z. B. mit „Viele liebe Grüße“ oder „Bis bald“.',
 un:'Hier schreibe ich meinen Namen, damit der Empfänger weiß, wer den Brief geschrieben hat.',
 ps:'Die Abkürzung bedeutet „post scriptum“: Ich habe noch etwas vergessen.'
};
function qWasIst(k){
  const p=P[k];
  return {task:'Welcher Teil des Briefs ist das?',prompt:`<span class="bsatz">${DESC[k]}</span>`,options:ALL,answer:label(p),fixed:true,
    explain:`${p.emo} <b>${p.name}</b>: ${p.desc}`};
}
function qWozu(k){
  const p=P[k],others=shuffle(KEYS.filter(x=>x!==k)).slice(0,2);
  return {task:'Wozu ist dieser Teil da?',prompt:`<div class="bigword">${label(p)}</div>`,options:[DESC[k]].concat(others.map(x=>DESC[x])),answer:DESC[k],
    explain:`${p.emo} <b>${p.name}</b>: ${p.desc}`};
}
function qDanach(i){
  const a=PARTS[i],b=PARTS[i+1];
  return {task:'Was kommt im Brief danach?',prompt:`Nach ${a.emo} <b>${a.name}</b> kommt …`,options:ALL.filter(x=>x!==label(a)),answer:label(b),fixed:true,
    explain:PARTS.map(p=>p===b?`<b>${p.emo} ${p.name}</b>`:p.emo+' '+p.name).join(' → ')};
}
function qDavor(i){
  const a=PARTS[i],b=PARTS[i-1];
  return {task:'Was kommt im Brief davor?',prompt:`Vor ${a.emo} <b>${a.name}</b> kommt …`,options:ALL.filter(x=>x!==label(a)),answer:label(b),fixed:true,
    explain:PARTS.map(p=>p===b?`<b>${p.emo} ${p.name}</b>`:p.emo+' '+p.name).join(' → ')};
}
const FAKTEN=[
 ['Wo steht Ort und Datum?',['oben rechts','unten links','ganz unten'],'oben rechts','Ort und Datum stehen <b>oben rechts</b>, z. B. „Afrika, der 5.5.2020“.'],
 ['Was steht ganz am Ende des Briefs?',['🟡 PS','🔵 Anrede','🟣 Inhalt'],'🟡 PS','Das <b>PS</b> steht ganz unten – noch unter der Unterschrift.'],
 ['Was bedeutet PS?',['Ich habe noch etwas vergessen.','Bitte schnell antworten!','Pass auf!'],'Ich habe noch etwas vergessen.','PS heißt „post scriptum“ – „nachgeschrieben“. Da steht, was ich <b>vergessen</b> habe.'],
 ['Was steht nach der Anrede?',['ein Komma ,','ein Punkt .','ein Fragezeichen ?'],'ein Komma ,','Nach der Anrede kommt ein <b>Komma</b>: Liebe Löwin<b>,</b>'],
 ['Was steht nach dem Gruß?',['gar nichts','ein Komma ,','ein Punkt .'],'gar nichts','Nach dem Gruß kommt <b>kein Komma</b>: Viele liebe Grüße'],
 ['Wie viele Teile hat ein Brief?',['8','5','3'],'8','Ort/Datum, Anrede, Einleitung, Inhalt, Schluss, Gruß, Unterschrift, PS – das sind <b>8</b>.'],
 ['Wer bekommt den Brief?',['der Empfänger','der Absender','der Briefträger'],'der Empfänger','Der <b>Empfänger</b> bekommt den Brief. Wer ihn schreibt, ist der Absender.'],
 ['Wo steht die Unterschrift?',['unter dem Gruß','über der Anrede','neben dem Datum'],'unter dem Gruß','Erst der Gruß, darunter die <b>Unterschrift</b>: Viele liebe Grüße / dein Leo'],
 ['Welcher Teil sagt, warum ich schreibe?',['🟢 Einleitung','⚫ Schluss','🟠 Gruß'],'🟢 Einleitung','In der <b>Einleitung</b> steht der Grund, z. B. „ich möchte dich einladen“.'],
 ['Wo stelle ich meine Fragen?',['🟣 Inhalt','🔴 Ort/Datum','🩷 Unterschrift'],'🟣 Inhalt','Fragen gehören in den <b>Inhalt</b>: „Was hast du heute gemacht?“']
];
const qFakt=([q,o,a,e])=>({task:'Weißt du es?',prompt:q,options:o,answer:a,explain:e});

/* ---------- Welt 3: Satz-Sortierer ---------- */
const SORT=['ein','inh','sch','gr','ps'];
const SATZ=[
 ['ich schreibe dir, weil ich dich einladen möchte.','ein'],['ich möchte mich für dein Geschenk bedanken.','ein'],
 ['ich muss dir unbedingt etwas erzählen.','ein'],['ich schreibe dir, weil ich dich vermisse.','ein'],
 ['endlich habe ich Zeit, dir zu schreiben.','ein'],['ich möchte dir von meinen Ferien erzählen.','ein'],
 ['Gestern war ich mit Papa im Zoo.','inh'],['Wir haben einen riesigen Schneemann gebaut.','inh'],
 ['Mein Zahn wackelt schon.','inh'],['Wie geht es deinem Hund?','inh'],
 ['In der Schule lernen wir gerade, wie man Briefe schreibt.','inh'],['Die Party ist am Samstag um 15 Uhr.','inh'],
 ['Was hast du am Wochenende gemacht?','inh'],
 ['Ich freue mich auf deine Antwort.','sch'],['Ich freue mich, dich bald zu sehen.','sch'],['Schreib mir bald zurück!','sch'],
 ['Hoffentlich kannst du kommen.','sch'],['Ich hoffe, wir sehen uns bald.','sch'],
 ['Viele liebe Grüße','gr'],['Bis bald','gr'],['Mit freundlichen Grüßen','gr'],['Liebe Grüße','gr'],
 ['PS: Bring deine Badehose mit!','ps'],['PS: Vergiss das Geschenk nicht!','ps'],['PS: Grüß deine Schwester von mir!','ps']
];
const WHY={
 ein:'Die <b>Einleitung</b> sagt, <b>warum</b> ich schreibe. Sie steht gleich nach der Anrede – darum fängt sie <b>klein</b> an.',
 inh:'Im <b>Inhalt</b> erzähle ich, was passiert ist, oder stelle Fragen.',
 sch:'Der <b>Schluss</b> ist der letzte Satz vor dem Gruß: Ich freue mich, hoffe, warte auf eine Antwort …',
 gr:'Der <b>Gruß</b> ist der Abschied. Er ist kein ganzer Satz und hat <b>kein Komma</b>.',
 ps:'Das <b>PS</b> erkennt man an „PS:“. Dort steht, was ich vergessen habe.'
};
function qSortier([s,k]){
  return {task:'Wohin gehört das im Brief?',prompt:`<span class="bsatz">${esc(s)}</span>`,options:SORT.map(x=>label(P[x])),answer:label(P[k]),fixed:true,explain:WHY[k]};
}
function qWelcherSatz(k){
  const own=SATZ.filter(x=>x[1]===k),oth=SORT.filter(x=>x!==k&&x!=='ps');
  const right=own[Math.floor(Math.random()*own.length)][0];
  const wrong=shuffle(oth).slice(0,2).map(o=>{const l=SATZ.filter(x=>x[1]===o);return l[Math.floor(Math.random()*l.length)][0]});
  return {task:`Welcher Satz ist ${k==='gr'?'ein Gruß':k==='sch'?'ein Schluss':k==='ein'?'eine Einleitung':'Inhalt'}?`,prompt:`${P[k].emo} <b>${P[k].name}</b>`,
    options:[right].concat(wrong),answer:right,explain:WHY[k]};
}

/* ---------- Welt 4: Komma-Post ---------- */
const NOTHING='kein Zeichen';
const ANREDEN=['Liebe Oma','Lieber Opa','Liebe Mama','Lieber Papa','Liebes Eichhörnchen','Hallo Ben','Liebe Frau Müller',
 'Lieber Herr Klein','Lieber Leo','Liebe Lena','Liebe Löwin','Hallo Tante Anna'];
const GRUESSE=['Viele liebe Grüße','Bis bald','Mit freundlichen Grüßen','Liebe Grüße','Viele Grüße','Herzliche Grüße'];
const qAnredeZ=a=>({task:'Welches Zeichen gehört an die Stelle?',prompt:`<div class="brief"><div class="bz">${esc(a)}<span class="gap">?</span></div><div class="bz">ich …</div></div>`,
  options:[',','.',NOTHING],answer:',',fixed:true,explain:`Nach der <b>Anrede</b> kommt ein <b>Komma</b>: ${esc(a)}<b>,</b>`});
const qGrussZ=g=>({task:'Welches Zeichen gehört an die Stelle?',prompt:`<div class="brief"><div class="bz">${esc(g)}<span class="gap">?</span></div><div class="bz">dein Leo</div></div>`,
  options:[',','.',NOTHING],answer:NOTHING,fill:' ',fixed:true,explain:`Nach dem <b>Gruß</b> kommt <b>kein Komma</b>: ${esc(g)}<br>Darunter steht gleich die Unterschrift.`});
// [richtig, falsch, Rest des Satzes, Nomen?]
const KLEIN=[
 ['ich','Ich',' habe heute im Schnee gespielt.'],['endlich','Endlich',' habe ich Zeit, dir zu schreiben.'],
 ['vielen','Vielen',' Dank für das tolle Geschenk!'],['heute','Heute',' ist etwas Lustiges passiert.'],
 ['wie','Wie',' geht es dir?'],['gestern','Gestern',' war ich im Schwimmbad.'],['danke','Danke',' für deinen Brief!'],
 ['weißt','Weißt',' du was?'],['bald','Bald',' habe ich Geburtstag.'],
 ['Mama','mama',' hat mir beim Schreiben geholfen.',1],['Weihnachten','weihnachten',' ist bald!',1],['Papa','papa',' lässt dich grüßen.',1]
];
const qKlein=([r,f,rest,nomen])=>({task:'Groß oder klein?',prompt:`<div class="brief"><div class="bz">Lieber Opa,</div><div class="bz"><span class="gap">?</span>${esc(rest)}</div></div>`,
  options:[r,f],answer:r,explain:nomen?`<b>${r}</b> ist ein Nomen. Nomen schreibt man <b>immer groß</b> – auch nach der Anrede.`
    :`Nach der Anrede steht ein Komma. Darum geht es <b>klein</b> weiter: Lieber Opa,<br><b>${r}</b>${esc(rest)}`});
// Lieber / Liebe / Liebes [Nomen, Artikel]
const LIEB=[['Oma','die'],['Opa','der'],['Eichhörnchen','das'],['Mama','die'],['Papa','der'],['Pferd','das'],['Lena','die'],['Ben','der'],
 ['Tante Klara','die'],['Onkel Tom','der'],['Löwin','die'],['Krokodil','das'],['Giraffe','die'],['Bär','der'],['Schwein','das']];
const LF={der:'Lieber',die:'Liebe',das:'Liebes'};
const qLieb=([n,a])=>({task:'Welche Anrede passt?',prompt:gapIn(`___ ${n},`),options:['Lieber','Liebe','Liebes'],answer:LF[a],fixed:true,
  explain:`<b>${a}</b> ${n} → <b>${LF[a]}</b> ${n},<br>der → Lieber · die → Liebe · das → Liebes`});
// dein / deine [Name, Junge?]
const DEIN=[['Lena',0],['Ben',1],['Leo',1],['Gina',0],['Oma',0],['Opa',1],['Mia',0],['Tom',1],['Ida',0],['Finn',1],['Papa',1],['Mama',0]];
const qDein=([n,j])=>({task:'Wie unterschreibst du?',prompt:`<div class="brief"><div class="bz">Viele liebe Grüße</div><div class="bz"><span class="gap">?</span> ${n}</div></div>`,
  options:['dein','deine'],answer:j?'dein':'deine',fixed:true,
  explain:`${j?'Ein Junge oder Mann':'Ein Mädchen oder eine Frau'} schreibt <b>${j?'dein':'deine'}</b> ${n}. Die Unterschrift fängt <b>klein</b> an.`});

/* ---------- Welt 5: Brief-Puzzle ---------- */
const MITTE=['an','ein','inh','sch','gr'];
function qPuzzle(B,ks){
  return {task:'Lege die Zeilen in die richtige Reihenfolge!',prompt:ks.length<8?'Bring den Brief in Ordnung:':'Der ganze Brief ist durcheinander!',
    order:ks.map(k=>B[k]),answer:ks.map(k=>B[k]).join(' / '),explain:'So ist es richtig:'+brief(B,{keys:ks,lb:true})};
}

/* ---------- Mission: Brief-Detektiv ---------- */
const T=s=>s.split(' ').map(t=>{const m=t.match(/^(.*)\{(.*)\}$/);return m?{t:m[1],fix:m[2]}:{t}});
// Wort{Korrektur} = Fehler. Tokens mit Leerzeichen getrennt.
const SPOT=[
 'Liebe Oma , Ich{ich} habe dir ein Bild gemalt .',
 'Lieber{Liebe} Mama , ich vermisse dich .',
 'Liebe{Lieber} Opa , wie geht es dir ?',
 'Liebes{Lieber} Ben , ich komme am Samstag .',
 'Viele liebe Grüße ,{weg} dein Leo',
 'Lieber Papa .{,} ich habe eine Eins geschrieben .',
 'Bis bald ,{weg} deine Mia',
 'Hallo Lena , Endlich{endlich} habe ich Zeit .',
 'Liebe Oma , Vielen{vielen} Dank für das Geschenk ! Viele Grüße ,{weg} dein Tom',
 'Lieber Opa , ich komme bald . Viele Grüße deine{dein} Ben',
 'Liebe Lena , ich habe einen Hund . Bis bald dein{deine} Mia',
 'Lieber Leo .{,} Hast{hast} du Zeit ?',
 'Mit freundlichen Grüßen ,{weg} deine Gina',
 'Lieber{Liebe} Löwin , ich jage heute Gazellen .',
 'Liebe Tante Anna , mama{Mama} lässt dich grüßen .',
 'Liebes Pferd , Ich{ich} bringe dir Möhren mit . Bis bald ,{weg} dein Leo'
];
function qSpot(s){
  const tokens=T(s),n=tokens.filter(x=>x.fix).length;
  const ans=tokens.map(x=>x.fix==='weg'?'':x.fix||x.t).filter(x=>x).join(' ').replace(/ ([,.!?])/g,'$1');
  return {task:`Finde ${n===1?'den Fehler':'die '+n+' Fehler'}!`,prompt:'',spot:{tokens,n},answer:ans,
    explain:`Richtig: <b>${esc(ans)}</b><br>Nach der Anrede: Komma und klein weiter. Nach dem Gruß: kein Komma. der → Lieber, die → Liebe, das → Liebes.`};
}

/* ---------- Registrieren ---------- */
const W=n=>BRIEFE.map(B=>()=>n(B));
LernApp.register({
  id:'deutsch-brief',
  subject:'Deutsch',
  title:'Briefe schreiben',
  subtitle:'Die 8 Teile eines Briefs, Anrede, Gruß und Komma',
  icon:'✉️',
  color:'#e11d48',
  mascot:'🦁',
  hello:['Ich bin Leo, der Löwe! Hilf mir, meine Briefe richtig zu schreiben.','Weißt du noch? Nach der Anrede kommt ein Komma!',
    'Nach dem Gruß kein Komma – darunter kommt gleich die Unterschrift.','Ein Brief hat 8 Teile. Kennst du alle?',
    'PS heißt: Ich habe noch etwas vergessen!','Der Wirbelwind hat meine Briefe durcheinandergepustet. Hilfst du mir?'],
  worlds:[
    {id:'teile',name:'Pfeil-Maler',icon:'🎨',color:'#2563eb',color2:'#7c3aed',topic:'Welcher Teil des Briefs ist das? Male den Pfeil an!',rules:RULES,
     cats:()=>KEYS.map(k=>BRIEFE.map(B=>()=>qTeil(B,k)))},
    {id:'wasist',name:'Was ist was?',icon:'❓',color:'#0891b2',color2:'#14b8a6',topic:'Begriffe und Beschreibungen – und was kommt danach?',rules:RULES,
     cats:()=>[KEYS.map(k=>()=>qWasIst(k)),KEYS.map(k=>()=>qWozu(k)),
       PARTS.slice(0,-1).map((p,i)=>()=>qDanach(i)).concat(PARTS.slice(1).map((p,i)=>()=>qDavor(i+1))),FAKTEN.map(f=>()=>qFakt(f))]},
    {id:'saetze',name:'Satz-Sortierer',icon:'🗂️',color:'#16a34a',color2:'#84cc16',topic:'Einleitung, Inhalt, Schluss, Gruß oder PS?',rules:RULES,
     cats:()=>[SATZ.map(s=>()=>qSortier(s)),['ein','inh','sch','gr'].map(k=>()=>qWelcherSatz(k))]},
    {id:'komma',name:'Komma-Post',icon:'✏️',color:'#ea580c',color2:'#f59e0b',topic:'Komma oder nicht? Groß oder klein? Lieber oder Liebe?',rules:RULES,
     cats:()=>[ANREDEN.map(a=>()=>qAnredeZ(a)),GRUESSE.map(g=>()=>qGrussZ(g)),KLEIN.map(k=>()=>qKlein(k)),LIEB.map(l=>()=>qLieb(l)),DEIN.map(d=>()=>qDein(d))]},
    {id:'puzzle',name:'Brief-Puzzle',icon:'🧩',color:'#db2777',color2:'#f472b6',topic:'Der Wirbelwind hat die Briefe durcheinandergepustet. Leg sie richtig!',rules:RULES,
     noMix:true,count:6,after:'teile',afterStars:2,
     cats:()=>[W(B=>qPuzzle(B,MITTE)),W(B=>qPuzzle(B,KEYS))]}
  ],
  missions:[
    {id:'detektiv',name:'Brief-Detektiv',icon:'🕵️',color:'#334155',color2:'#64748b',count:8,topic:'In jedem Brief stecken Fehler. Findest du sie?',
     cats:()=>[SPOT.map(s=>()=>qSpot(s))]}
  ],
  boss:{name:'Brief-Wirbelwind',icon:'🌪️',count:15,lives:3},
  missionAfter:{blitz:'teile'},
  badgeTitle:'Brief-Abzeichen',
  badges:[
    {id:'maler',icon:'🎨',name:'Pfeil-Maler',desc:'3 Sterne im Pfeil-Maler',test:c=>c.starsIn('teile')>=3},
    {id:'kenner',icon:'❓',name:'Begriffe-Kenner',desc:'3 Sterne bei Was ist was?',test:c=>c.starsIn('wasist')>=3},
    {id:'sortierer',icon:'🗂️',name:'Satz-Sortierer',desc:'3 Sterne im Satz-Sortierer',test:c=>c.starsIn('saetze')>=3},
    {id:'komma',icon:'✏️',name:'Komma-Profi',desc:'3 Sterne in der Komma-Post',test:c=>c.starsIn('komma')>=3},
    {id:'puzzle',icon:'🧩',name:'Puzzle-Meister',desc:'3 Sterne im Brief-Puzzle',test:c=>c.starsIn('puzzle')>=3},
    {id:'detektiv',icon:'🕵️',name:'Brief-Detektiv',desc:'3 Sterne beim Brief-Detektiv',test:c=>c.starsIn('detektiv')>=3},
    {id:'wind',icon:'🌪️',name:'Wirbelwind-Bändiger',desc:'Den Brief-Wirbelwind besiegt',test:c=>c.kind==='boss'&&c.won&&!c.gold},
    {id:'goldwind',icon:'🏅',name:'Sturm-Held',desc:'Den goldenen Wirbelwind besiegt',test:c=>c.kind==='boss'&&c.won&&c.gold},
    {id:'r50',icon:'✉️',name:'Postbote',desc:'50 Brief-Fragen richtig',test:c=>c.correct>=50},
    {id:'r150',icon:'📮',name:'Briefkasten-Chef',desc:'150 Brief-Fragen richtig',test:c=>c.correct>=150},
    {id:'krone',icon:'👑',name:'König der Briefe',desc:'Alle Sterne bei Briefe schreiben',test:c=>c.allStars}
  ]
});
})();
