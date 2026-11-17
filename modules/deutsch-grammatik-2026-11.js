/* Lernpaket: Deutsch – Grammatiktest am Fr, 20.11.2026
 * Themen laut Elternnachricht: Adjektive steigern, aus Nomen Adjektive bilden,
 * d/t, g/k, b/p durch Verlängern, Satzarten.
 */
(function(){
const {shuffle,cap,pick3,gapIn}=LernApp.util;

/* ---------- Daten: Adjektive steigern ---------- */
const ADJ=[
 ['schnell','schneller','am schnellsten'],['groß','größer','am größten'],['klein','kleiner','am kleinsten'],
 ['alt','älter','am ältesten'],['jung','jünger','am jüngsten'],['warm','wärmer','am wärmsten'],
 ['kalt','kälter','am kältesten'],['lang','länger','am längsten'],['kurz','kürzer','am kürzesten'],
 ['stark','stärker','am stärksten'],['laut','lauter','am lautesten'],['leise','leiser','am leisesten'],
 ['hoch','höher','am höchsten'],['gut','besser','am besten'],['viel','mehr','am meisten'],
 ['gern','lieber','am liebsten'],['dick','dicker','am dicksten'],['schön','schöner','am schönsten'],
 ['klug','klüger','am klügsten'],['hell','heller','am hellsten'],['weit','weiter','am weitesten']
];
const COMP_SENT=[
 ['Ein Elefant ist ___ als eine Maus.','groß','k'],['Ein Gepard ist ___ als eine Schnecke.','schnell','k'],
 ['Opa ist ___ als ich.','alt','k'],['Im Sommer ist es ___ als im Winter.','warm','k'],
 ['Ein Turm ist ___ als ein Haus.','hoch','k'],['Flüstern ist ___ als Schreien.','leise','k'],
 ['Pizza esse ich ___ als Spinat.','gern','k'],['Mein kleiner Bruder ist ___ als ich.','jung','k'],
 ['Ein Löwe ist ___ als eine Katze.','stark','k'],['Eine Ameise ist ___ als ein Hund.','klein','k'],
 ['Von allen Tieren läuft der Gepard ___.','schnell','s'],['Von allen Bergen ist der Mount Everest ___.','hoch','s'],
 ['Von allen Kindern kann Lea ___ rechnen.','gut','s'],['Von allen Jahreszeiten ist es im Winter ___.','kalt','s'],
 ['Beim Weitsprung springt Ben ___ von allen.','weit','s'],['Von allen Tieren ist die Giraffe ___.','groß','s'],
 ['Von allen Sachen esse ich Eis ___.','gern','s']
];
const ALSWIE=[
 ['Tim ist größer ___ Lea.','als'],['Die Sonne ist heller ___ der Mond.','als'],['Mein Rad ist schneller ___ deins.','als'],
 ['Ein Pferd ist stärker ___ ein Pony.','als'],['Ich bin so groß ___ mein Bruder.','wie'],['Der Kuchen ist so süß ___ Honig.','wie']
];

/* ---------- Daten: Nomen -> Adjektiv [Nomen, Adjektiv, falsche Endung] ---------- */
const NA=[
 ['das Glück','glücklich','glückig'],['die Sonne','sonnig','sonnlich'],['der Freund','freundlich','freundig'],
 ['der Wind','windig','windlich'],['die Gefahr','gefährlich','gefahrig'],['die Angst','ängstlich','angstig'],
 ['der Mut','mutig','mutlich'],['der Sand','sandig','sandlich'],['die Wolke','wolkig','wolklich'],
 ['das Salz','salzig','salzlich'],['der Durst','durstig','durstlich'],['der Hunger','hungrig','hungerlich'],
 ['der Schmutz','schmutzig','schmutzlich'],['der Saft','saftig','saftlich'],['die Lust','lustig','lustlich'],
 ['die Ruhe','ruhig','ruhlich'],['die Kraft','kräftig','kraftlich'],['der Herbst','herbstlich','herbstig'],
 ['der Sturm','stürmisch','sturmig'],['der Regen','regnerisch','regenig'],['das Herz','herzlich','herzisch'],
 ['die Ehre','ehrlich','ehrig'],['der Fleiß','fleißig','fleißlich'],['der Schreck','schrecklich','schreckig'],
 ['das Eis','eisig','eislich'],['der Witz','witzig','witzlich'],['der Feind','feindlich','feindig'],
 ['die Natur','natürlich','naturig'],['der Ärger','ärgerlich','ärgerig'],['der Stein','steinig','steinlich'],
 ['das Kind','kindlich','kindig'],['der Neid','neidisch','neidlich']
];

/* ---------- Daten: Wörter verlängern [Wort mit _, Buchstabe, Verlängerung] ---------- */
const VL=[
 ['der Hun_','d','die Hunde'],['der Wal_','d','die Wälder'],['das Kin_','d','die Kinder'],['das Bil_','d','die Bilder'],
 ['das Ra_','d','die Räder'],['der Mun_','d','die Münder'],['das Gel_','d','die Gelder'],['das Pfer_','d','die Pferde'],
 ['das Hem_','d','die Hemden'],['run_','d','runde Bälle'],['wil_','d','wilde Tiere'],['der Freun_','d','die Freunde'],
 ['das Wor_','t','die Wörter'],['das Bro_','t','die Brote'],['der Hu_','t','die Hüte'],['das Zel_','t','die Zelte'],
 ['bun_','t','bunte Farben'],['lau_','t','laute Musik'],['kal_','t','kalte Füße'],['der Mona_','t','die Monate'],
 ['der Ber_','g','die Berge'],['der Zwer_','g','die Zwerge'],['der Ta_','g','die Tage'],['der Zu_','g','die Züge'],
 ['der We_','g','die Wege'],['klu_','g','kluge Kinder'],['sie sa_t','g','sagen'],['er fra_t','g','fragen'],
 ['es flie_t','g','fliegen'],['sie lie_t','g','liegen'],
 ['der Schran_','k','die Schränke'],['die Ban_','k','die Bänke'],['das Geschen_','k','die Geschenke'],['der Par_','k','die Parks'],
 ['star_','k','starke Arme'],['kran_','k','kranke Kinder'],['er schen_t','k','schenken'],['sie win_t','k','winken'],['er den_t','k','denken'],
 ['der Kor_','b','die Körbe'],['der Die_','b','die Diebe'],['das Kal_','b','die Kälber'],['gel_','b','gelbe Blumen'],
 ['hal_','b','halbe Pizza'],['lie_','b','liebe Grüße'],['sie le_t','b','leben'],['er gi_t','b','geben'],['es kle_t','b','kleben'],
 ['er hu_t','p','hupen'],['sie pum_t','p','pumpen'],['der Mo_s','p','die Möpse'],['der Ty_','p','die Typen']
];
const PAIR={d:['d','t'],t:['d','t'],g:['g','k'],k:['g','k'],b:['b','p'],p:['b','p']};

/* ---------- Daten: Satzarten ---------- */
const SATZ=[
 ['Heute scheint die Sonne','A'],['Mein Hund heißt Bello','A'],['Wir spielen im Garten Fußball','A'],['Der Igel schläft im Winter','A'],
 ['Ich esse gern Pizza','A'],['Am Freitag schreiben wir einen Test','A'],['Die Katze sitzt auf dem Dach','A'],['Im Herbst fallen die Blätter','A'],
 ['Wie spät ist es','F'],['Kommst du mit zum Spielplatz','F'],['Wo wohnst du','F'],['Hast du deine Hausaufgaben gemacht','F'],
 ['Warum ist der Himmel blau','F'],['Wer hat das Fenster offen gelassen','F'],['Magst du Eis','F'],['Wann beginnt die Pause','F'],
 ['Komm bitte her','B'],['Räum dein Zimmer auf','B'],['Sei leise','B'],['Mach die Tür zu','B'],
 ['Hör mir gut zu','B'],['Gib mir bitte den Ball','B'],['Pass auf','B'],['Wasch dir die Hände','B']
];
const STYPES={
 A:{name:'Aussagesatz',mark:'.',ex:'Ein <b>Aussagesatz</b> erzählt etwas. Am Ende steht ein <b>Punkt (.)</b>'},
 F:{name:'Fragesatz',mark:'?',ex:'Ein <b>Fragesatz</b> fragt etwas – oft mit einem W-Wort (wer, wie, wo, warum …) oder das Verb steht ganz vorne. Am Ende: <b>Fragezeichen (?)</b>'},
 B:{name:'Aufforderungssatz',mark:'!',ex:'Ein <b>Aufforderungssatz</b> ist eine Bitte oder ein Befehl. Am Ende: <b>Ausrufezeichen (!)</b>'}
};

/* ---------- Fragen bauen ---------- */
const naiveK=p=>p.endsWith('e')?p+'r':p+'er';
const naiveS=p=>'am '+p+(/(t|d|z|s|ß|sch)$/.test(p)?'esten':'sten');
const chainHTML=(p,k,s)=>`<div class="mini"><span><small>Grundstufe</small>${p}</span>→<span><small>Vergleichsstufe</small>${k}</span>→<span><small>Höchststufe</small>${s}</span></div>`;

function qChain([p,k,s],which){
  const ans=which==='s'?s:k;
  const wrong=which==='s'?pick3(s,[naiveS(p),'am '+k+'sten',k,'mehr '+p,'am '+p]):pick3(k,[naiveK(p),'mehr '+p,s,p+'est','am '+k]);
  const gap='<span class="st gap">?</span>';
  return {task:'Welche Stufe fehlt?',
    prompt:`<div class="chain"><span class="st">${p}</span><span class="arr">➜</span>${which==='s'?`<span class="st">${k}</span>`:gap}<span class="arr">➜</span>${which==='s'?gap:`<span class="st">${s}</span>`}</div>`,
    options:[ans].concat(wrong),answer:ans,explain:`So wird <b>${p}</b> gesteigert:`+chainHTML(p,k,s)};
}
function qCompSent([sent,p,lvl]){
  const [,k,s]=ADJ.find(a=>a[0]===p);const ans=lvl==='k'?k:s;
  const rule=lvl==='k'?'Zwei Dinge vergleichen → <b>Vergleichsstufe + als</b>.':'Das Allerbeste von allen → <b>Höchststufe: am …sten</b>.';
  return {task:'Setze die richtige Form ein!',prompt:gapIn(sent),options:[p,k,s],fixed:true,answer:ans,
    explain:`${rule}<br>${sent.replace('___',`<b>${ans}</b>`)}`};
}
function qAlsWie([sent,ans]){
  return {task:'als oder wie?',prompt:gapIn(sent),options:['als','wie','als wie'],fixed:true,answer:ans,
    explain:`Verschieden → <b>größer als</b>, <b>schneller als</b>.<br>Gleich → <b>so groß wie</b>.<br>„als wie“ gibt es nicht!<br>${sent.replace('___',`<b>${ans}</b>`)}`};
}
function qNomen([n,a,w]){
  return {task:'Welches Adjektiv steckt in dem Nomen?',prompt:`<div class="bigword">${n}</div>`,options:[a,cap(a),w,cap(w)],answer:a,
    explain:`${n} → <b>${a}</b><br>Adjektive schreibt man <b>klein</b>! Typische Endungen: <b>-ig</b>, <b>-lich</b>, <b>-isch</b>.`};
}
function qEndung([n,a]){
  const noun=n.split(' ')[1];const end=a.endsWith('isch')?'-isch':a.endsWith('lich')?'-lich':'-ig';
  return {task:'Welche Endung macht daraus ein Adjektiv?',prompt:`<div class="bigword">${noun} + <span class="gap">?</span></div>`,options:['-ig','-lich','-isch'],fixed:true,answer:end,
    explain:`${n} → <b>${a.replace(/(isch|lich|ig)$/,'<span class="hl">$1</span>')}</b> (klein geschrieben!)`};
}
function qVerl([w,ans,long]){
  const full=w.replace('_',ans);const li=long.lastIndexOf(ans);
  const longHL=long.slice(0,li)+`<span class="hl">${ans}</span>`+long.slice(li+1);
  return {task:'Detektiv-Frage: Welcher Buchstabe fehlt? Verlängere das Wort!',prompt:`<div class="bigword">${w.replace('_','<span class="gap">?</span>')}</div>`,
    options:PAIR[ans],fixed:true,big:true,answer:ans,explain:`🔍 Verlängern: <b>${longHL}</b> – jetzt hörst du es!<br>Also: <b>${full}</b>`};
}
function qSatzTyp([s,t]){
  const T=STYPES[t];
  return {task:'Welche Satzart ist das?',prompt:`„${s}<span class="gap">?</span>“`,options:['Aussagesatz','Fragesatz','Aufforderungssatz'],fixed:true,answer:T.name,fill:T.mark,
    explain:`${T.ex}<br>„${s}<b>${T.mark}</b>“`};
}
function qZeichen([s,t]){
  const T=STYPES[t];
  return {task:'Welches Satzzeichen gehört ans Ende?',prompt:`„${s}<span class="gap">?</span>“`,options:['.','?','!'],fixed:true,big:true,answer:T.mark,
    explain:`Das ist ein ${T.ex.replace('Ein ','')}`};
}

/* ---------- Registrieren ---------- */
LernApp.register({
  id:'deutsch-grammatik-2026-11',
  subject:'Deutsch',
  title:'Grammatiktest',
  subtitle:'Adjektive steigern & bilden, Wörter verlängern, Satzarten',
  testName:'Grammatiktest',
  date:'2026-11-20',
  icon:'📘',
  color:'#7c3aed',
  worlds:[
    {id:'steigern',name:'Steiger-Turm',icon:'🚀',color:'#f97316',color2:'#f59e0b',topic:'Adjektive steigern: schnell, schneller als, am schnellsten',
     rules:'schnell → <b>schneller als</b> → <b>am schnellsten</b><br>Vorsicht, Ausnahmen: gut → besser → am besten · viel → mehr → am meisten · gern → lieber → am liebsten · hoch → höher → am höchsten<br>Verschieden: <b>größer als</b> · Gleich: <b>so groß wie</b>',
     cats:()=>[ADJ.map(a=>()=>qChain(a,'s')),ADJ.map(a=>()=>qChain(a,'k')),COMP_SENT.map(c=>()=>qCompSent(c)),ALSWIE.map(c=>()=>qAlsWie(c))]},
    {id:'nomen',name:'Wort-Werkstatt',icon:'🛠️',color:'#16a34a',color2:'#10b981',topic:'Aus Nomen Adjektive bilden: das Glück → glücklich',
     rules:'Mit den Endungen <b>-ig</b>, <b>-lich</b>, <b>-isch</b>: das Glück → glück<b>lich</b>, die Sonne → sonn<b>ig</b>, der Sturm → stürm<b>isch</b><br>Adjektive schreibt man <b>klein</b>!',
     cats:()=>[NA.map(x=>()=>qNomen(x)),NA.map(x=>()=>qEndung(x))]},
    {id:'verl',name:'Detektiv-Büro',icon:'🔍',color:'#7c3aed',color2:'#a855f7',topic:'d oder t? g oder k? b oder p? Wörter verlängern',
     rules:'Am Wortende hört man es nicht. Darum: <b>Wort verlängern!</b><br>der Hund → die Hun<b>d</b>e · der Berg → die Ber<b>g</b>e · der Korb → die Kör<b>b</b>e<br>Bei Verben: Grundform bilden: sie sagt → sa<b>g</b>en',
     cats:()=>['dt','gk','bp'].map(pr=>VL.filter(v=>pr.indexOf(v[1])>=0).map(v=>()=>qVerl(v)))},
    {id:'satz',name:'Satz-Insel',icon:'🏝️',color:'#0284c7',color2:'#06b6d4',topic:'Satzarten: Frage-, Aussage- und Aufforderungssatz',
     rules:'<b>Aussagesatz</b> erzählt etwas → <b>.</b><br><b>Fragesatz</b> fragt (W-Wort oder Verb vorne) → <b>?</b><br><b>Aufforderungssatz</b> ist Bitte oder Befehl → <b>!</b>',
     cats:()=>[SATZ.map(s=>()=>qSatzTyp(s)),SATZ.map(s=>()=>qZeichen(s))]}
  ],
  boss:{name:'Grammatik-Drache',icon:'🐉',count:15,lives:3}
});
})();
