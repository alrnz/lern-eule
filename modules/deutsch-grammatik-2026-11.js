/* Lernpaket: Deutsch – Grammatiktest am Fr, 20.11.2026
 * Themen laut Elternnachricht: Adjektive steigern, aus Nomen Adjektive bilden,
 * d/t, g/k, b/p durch Verlängern, Satzarten.
 */
(function(){
const {shuffle,cap,pick3,gapIn,uniq}=LernApp.util;

/* ---------- Daten: Adjektive steigern ---------- */
const ADJ=[
 ['schnell','schneller','am schnellsten'],['groß','größer','am größten'],['klein','kleiner','am kleinsten'],
 ['alt','älter','am ältesten'],['jung','jünger','am jüngsten'],['warm','wärmer','am wärmsten'],
 ['kalt','kälter','am kältesten'],['lang','länger','am längsten'],['kurz','kürzer','am kürzesten'],
 ['stark','stärker','am stärksten'],['laut','lauter','am lautesten'],['leise','leiser','am leisesten'],
 ['hoch','höher','am höchsten'],['gut','besser','am besten'],['viel','mehr','am meisten'],
 ['gern','lieber','am liebsten'],['dick','dicker','am dicksten'],['schön','schöner','am schönsten'],
 ['klug','klüger','am klügsten'],['hell','heller','am hellsten'],['weit','weiter','am weitesten'],
 // aus dem Buch (ABC der Tiere 3, S. 26/27):
 ['heiß','heißer','am heißesten'],['süß','süßer','am süßesten'],['weich','weicher','am weichsten'],
 ['langsam','langsamer','am langsamsten'],['schwer','schwerer','am schwersten'],['dunkel','dunkler','am dunkelsten']
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
 ['Von allen Sachen esse ich Eis ___.','gern','s'],
 // aus dem Buch (S. 26/27):
 ['Ein Zug fährt ___ als ein Fahrrad.','schnell','k'],['Von allen Orten der Welt ist es am Südpol ___.','kalt','s'],
 ['Eine Katze ist ___ als ein Elefant.','klein','k'],['Die Suppe ist ___ als der Tee.','heiß','k'],
 ['Von allen Erdbeeren sind die dunkelroten ___.','süß','s'],['In Bremen sind es 16 Grad, in Berlin 18 Grad. In Bremen ist es ___ als in Berlin.','kalt','k'],
 ['Karlsruhe hat 21 Grad, mehr als alle anderen Städte. In Karlsruhe ist es ___.','warm','s'],
 ['Ein Kissen ist ___ als ein Stein.','weich','k'],['Eine Schnecke ist ___ als ein Hase.','langsam','k'],
 ['Ein Stein ist ___ als eine Feder.','schwer','k'],['Von allen Tagen ist es heute ___.','heiß','s']
];
/* alte und neue Einträge getrennt, für Listen, in denen sie hintereinander stehen */
const ADJ0=ADJ.slice(0,21),ADJ1=ADJ.slice(21),COMP0=COMP_SENT.slice(0,17),COMP1=COMP_SENT.slice(17);
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
 ['das Kind','kindlich','kindig'],['der Neid','neidisch','neidlich'],
 // aus dem Buch (S. 24):
 ['der Tag','täglich','tagig'],['der Süden','südlich','südig'],['der Osten','östlich','ostig'],
 ['der Norden','nördlich','nordig'],['der Westen','westlich','westig'],['der Sport','sportlich','sportig'],
 ['die Ecke','eckig','ecklich']
];
/* Lückensätze -ig/-lich [Satz, Adjektiv, falsche Endung] */
const NSENT=[
 ['Malte geht durch den Matsch. Danach sind seine Schuhe ___.','schmutzig','schmutzlich'],
 ['Mia kann gut schwimmen und klettern. Sie ist ___.','sportlich','sportig'],
 ['Der Hund trinkt Wasser, weil er ___ ist.','durstig','durstlich'],
 ['Die Sonne scheint den ganzen Tag. Es ist ___.','sonnig','sonnlich'],
 ['Der Wind weht stark. Heute ist es ___.','windig','windlich'],
 ['Am Himmel sind viele Wolken. Es ist ___.','wolkig','wolklich'],
 ['Die Blätter werden bunt. Es ist ___.','herbstlich','herbstig'],
 ['Ich putze jeden Tag die Zähne. Ich putze sie ___.','täglich','tagig'],
 ['Ein Würfel hat Ecken. Er ist ___.','eckig','ecklich'],
 ['Lea hat beim Wettlauf gewonnen. Sie ist sehr ___.','glücklich','glückig'],
 ['Der Vogel fliegt nach Süden. Er fliegt in ___ Richtung.','südliche','südige']
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
 ['er hu_t','p','hupen'],['sie pum_t','p','pumpen'],['der Mo_s','p','die Möpse'],['der Ty_','p','die Typen'],
 // Wetter-Wörter (passend zu Kapitel „Wetter, Wasser, Wind“):
 ['der Win_','d','die Winde'],['mil_','d','milde Luft'],['trü_','b','trübe Tage']
];
const PAIR={d:['d','t'],t:['d','t'],g:['g','k'],k:['g','k'],b:['b','p'],p:['b','p']};

/* ---------- Daten: Satzarten ---------- */
const SATZ=[
 ['Heute scheint die Sonne','A'],['Mein Hund heißt Bello','A'],['Wir spielen im Garten Fußball','A'],['Der Igel schläft im Winter','A'],
 ['Ich esse gern Pizza','A'],['Am Freitag schreiben wir einen Test','A'],['Die Katze sitzt auf dem Dach','A'],['Im Herbst fallen die Blätter','A'],
 ['Wie spät ist es','F'],['Kommst du mit zum Spielplatz','F'],['Wo wohnst du','F'],['Hast du deine Hausaufgaben gemacht','F'],
 ['Warum ist der Himmel blau','F'],['Wer hat das Fenster offen gelassen','F'],['Magst du Eis','F'],['Wann beginnt die Pause','F'],
 ['Komm bitte her','B'],['Räum dein Zimmer auf','B'],['Sei leise','B'],['Mach die Tür zu','B'],
 ['Hör mir gut zu','B'],['Gib mir bitte den Ball','B'],['Pass auf','B'],['Wasch dir die Hände','B'],
 // Wetter-Sätze und Ausrufe (Buch: „Fragesatz – Aussagesatz“, „Aufforderungssatz – Ausruf“):
 ['Morgen regnet es','A'],['Der Wind weht stark','A'],['Scheint morgen die Sonne','F'],['Wie wird das Wetter','F'],
 ['Nimm deinen Regenschirm mit','B'],['Zieh deine Mütze an','B'],
 ['Oh, ist das kalt','R'],['Hurra, es schneit','R'],['So ein toller Regenbogen','R'],['Igitt, ist das nass','R'],
 ['Was für ein Sturm','R'],['Juhu, endlich Ferien','R'],['Au, das tut weh','R'],['Wie schön das ist','R']
];
const STYPES={
 R:{name:'Ausrufesatz',mark:'!',ex:'Ein <b>Ausrufesatz</b> zeigt ein Gefühl: Freude, Staunen, Schreck oder Ärger. Oft beginnt er mit <i>Oh, Hurra, Igitt, Au, So ein …</i> Am Ende: <b>Ausrufezeichen (!)</b>'},
 A:{name:'Aussagesatz',mark:'.',ex:'Ein <b>Aussagesatz</b> erzählt etwas. Am Ende steht ein <b>Punkt (.)</b>'},
 F:{name:'Fragesatz',mark:'?',ex:'Ein <b>Fragesatz</b> fragt etwas – oft mit einem W-Wort (wer, wie, wo, warum …) oder das Verb steht ganz vorne. Am Ende: <b>Fragezeichen (?)</b>'},
 B:{name:'Aufforderungssatz',mark:'!',ex:'Ein <b>Aufforderungssatz</b> ist eine Bitte oder ein Befehl. Am Ende: <b>Ausrufezeichen (!)</b>'}
};

/* ---------- Fragen bauen ---------- */
const naiveK=p=>p.endsWith('e')?p+'r':p+'er';
const naiveS=p=>'am '+p+(/(t|d|z|s|ß|sch)$/.test(p)?'esten':'sten');
const chainHTML=(p,k,s)=>`<div class="mini"><span><small>Grundstufe</small>${p}</span>→<span><small>Vergleichsstufe</small>${k} als</span>→<span><small>Höchststufe</small>${s}</span></div>`;

function qChain([p,k,s],which){
  const ka=k+' als'; // Vergleichsstufe immer mit „als“
  const ans=which==='s'?s:ka;
  const wrong=which==='s'?pick3(s,[naiveS(p),'am '+k+'sten',ka,'mehr '+p,'am '+p]):pick3(ka,[naiveK(p)+' als','mehr '+p+' als',s,p+' als','am '+k]);
  const gap='<span class="st gap">?</span>';
  return {task:'Welche Stufe fehlt?',
    prompt:`<div class="chain"><span class="st">${p}</span><span class="arr">➜</span>${which==='s'?`<span class="st">${ka}</span>`:gap}<span class="arr">➜</span>${which==='s'?gap:`<span class="st">${s}</span>`}</div>`,
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
  return {task:'Welche Satzart ist das?',prompt:`„${s}<span class="gap">?</span>“`,options:['Aussagesatz','Fragesatz','Aufforderungssatz','Ausrufesatz'],fixed:true,answer:T.name,fill:T.mark,
    explain:`${T.ex}<br>„${s}<b>${T.mark}</b>“`};
}
function qZeichen([s,t]){
  const T=STYPES[t];
  return {task:'Welches Satzzeichen gehört ans Ende?',prompt:`„${s}<span class="gap">?</span>“`,options:['.','?','!'],fixed:true,big:true,answer:T.mark,
    explain:`Das ist ein ${T.ex.replace('Ein ','')}`};
}
function qNSent([sent,a,w]){
  return {task:'Welches Adjektiv passt? -ig oder -lich?',prompt:gapIn(sent),options:[a,w,cap(a)],answer:a,
    explain:`${sent.replace('___',`<b>${a.replace(/(liche?|ig)$/,'<span class="hl">$1</span>')}</b>`)}<br>Adjektive schreibt man <b>klein</b>!`};
}

/* ---------- Adjektiv-Labor: Adjektive erkennen (Buch S. 22/23) ---------- */
/* [Adjektiv, Gegenteil, Artikel + Adjektiv + Nomen] – nur hinten anhängen */
const PROBE=[
 ['kalt','warm','das kalte Wasser'],['stark','schwach','der starke Löwe'],['alt','jung','der alte Mann'],
 ['leise','laut','die leise Musik'],['schwer','leicht','der schwere Koffer'],['klein','groß','die kleine Maus'],
 ['dunkel','hell','die dunkle Nacht'],['nass','trocken','die nasse Jacke'],['weich','hart','das weiche Kissen'],
 ['langsam','schnell','die langsame Schnecke'],['heiß','kalt','der heiße Tee'],['süß','sauer','die süße Erdbeere'],
 ['dick','dünn','das dicke Buch'],['lang','kurz','der lange Weg'],['voll','leer','die volle Tasse'],
 ['neu','alt','das neue Fahrrad'],['tief','flach','die tiefe Pfütze'],['hell','dunkel','der helle Blitz'],
 ['sauber','schmutzig','die saubere Hose'],['glücklich','traurig','das glückliche Kind']
];
/* Wörter, die die Probe nicht bestehen (Buch: bei, von, danach, schwimmt, rollt) */
const NOADJ=['bei','von','danach','schwimmt','rollt','läuft','mit','und','schläft','unter','singt','auf','hüpft','regnet','weht','oder'];
/* [Satz, Adjektiv darin] */
const ADJSENT=[
 ['Der Blitz ist hell.','hell'],['Die Wolke ist grau.','grau'],['Ich sehe den bunten Regenbogen.','bunten'],
 ['Die Pfütze ist tief.','tief'],['Die Schneeflocke ist weiß.','weiß'],['Der Wind ist stark.','stark'],
 ['Das Kissen ist weich.','weich'],['Opa trinkt heißen Tee.','heißen'],['Wir sehen einen grellen Blitz.','grellen'],
 ['Der Koffer ist schwer.','schwer'],['Die Jacke ist nass.','nass'],['Das grüne Blatt fällt.','grüne'],
 ['Die Musik ist leise.','leise'],['Der Hund hat ein weiches Fell.','weiches'],['Im Winter ist es kalt.','kalt']
];
const probeHTML=([a,o,ph])=>`🧪 Adjektiv-Probe mit <b>${a}</b>:<br>1. Wie ist etwas? → <b>${a}</b> ✓<br>2. Zwischen Artikel und Nomen: <b>${ph}</b> ✓<br>3. Gegenteil: <b>${a} – ${o}</b> ✓`;
const partners=a=>PROBE.filter(x=>x[0]===a||x[1]===a).map(x=>x[0]===a?x[1]:x[0]);
function qWhichAdj(p){
  return {task:'Welches Wort ist ein Adjektiv?',prompt:'<div class="bigword">🧪 Mach die Adjektiv-Probe!</div>',options:[p[0]].concat(pick3(p[0],NOADJ)),answer:p[0],
    explain:probeHTML(p)+'<br>Wörter wie <i>bei, von, schwimmt</i> bestehen die Probe nicht.'};
}
function qGegenteil(p){
  const no=[p[0]].concat(partners(p[0]));
  const pool=uniq(PROBE.map(x=>x[0]).concat(PROBE.map(x=>x[1]))).filter(x=>no.indexOf(x)<0);
  return {task:'Gegenteil-Probe: Was ist das Gegenteil?',prompt:`<div class="bigword">${p[0]} ↔ <span class="gap">?</span></div>`,options:[p[1]].concat(pick3(p[1],pool)),answer:p[1],
    explain:probeHTML(p)};
}
function qArtikel(p){
  const [art,adj,noun]=p[2].split(' ');
  return {task:'Artikel-Probe: Was passt zwischen Artikel und Nomen?',prompt:gapIn(`${art} ___ ${noun}`),options:[adj].concat(pick3(adj,NOADJ)),answer:adj,
    explain:probeHTML(p)};
}
function qFindAdj([s,a]){
  return {task:'Welches Wort ist das Adjektiv?',prompt:`„${s}“`,options:uniq(s.replace(/[.!?]/g,'').split(' ')),fixed:true,answer:a,
    explain:`„${s.replace(a,`<span class="hl">${a}</span>`)}“<br><b>${a}</b> beschreibt, <b>wie</b> etwas ist. Das ist ein Adjektiv – klein geschrieben!`};
}
function wGegenteil(p){
  return {input:true,task:'Schreibe das Gegenteil!',prompt:`<div class="bigword">${p[0]} ↔ <span class="gap">?</span></div>`,answer:p[1],accept:uniq([p[1]].concat(partners(p[0]))),explain:probeHTML(p)};
}
function wFindAdj(x){
  const q=qFindAdj(x);
  return {input:true,task:'Schreibe das Adjektiv aus dem Satz ab!',prompt:q.prompt,answer:q.answer,explain:q.explain};
}

/* ---------- Schreib-Fragen (Probetest) ---------- */
function wChain(a,which){
  const q=qChain(a,which);
  return {input:true,task:'Schreibe die fehlende Stufe!',prompt:q.prompt,answer:which==='s'?a[2]:a[1]+' als',accept:which==='s'?[a[2]]:[a[1]+' als',a[1]],explain:q.explain};
}
function wCompSent(c){
  const q=qCompSent(c);
  return {input:true,task:'Schreibe die richtige Form in die Lücke!',prompt:q.prompt,answer:q.answer,explain:q.explain};
}
function wAlsWie(c){
  const q=qAlsWie(c);
  return {input:true,task:'als oder wie? Schreibe es!',prompt:q.prompt,answer:q.answer,explain:q.explain};
}
function wNomen([n,a]){
  return {input:true,task:'Bilde aus dem Nomen ein Adjektiv!',prompt:`<div class="bigword">${n} → <span class="gap">?</span></div>`,answer:a,
    explain:`${n} → <b>${a.replace(/(isch|lich|ig)$/,'<span class="hl">$1</span>')}</b><br>Adjektive schreibt man <b>klein</b>!`};
}
function wNSent(x){
  const q=qNSent(x);
  return {input:true,task:'Schreibe das Adjektiv in die Lücke!',prompt:q.prompt,answer:q.answer,explain:q.explain};
}
function wVerl(v){
  const q=qVerl(v),full=v[0].replace('_',v[1]),parts=full.split(' ');
  const accept=[full];
  if(parts.length>1){accept.push(cap(full));accept.push(parts.slice(1).join(' '))}
  return {input:true,task:'Schreibe das ganze Wort richtig!',prompt:q.prompt,answer:full,accept,fill:v[1],explain:q.explain};
}
function wZeichen(x){
  const q=qZeichen(x);
  return {input:true,task:'Welches Satzzeichen fehlt? Tippe es ein!',prompt:q.prompt,answer:q.answer,explain:q.explain};
}

/* ---------- Fehler-Detektiv: Sätze mit eingebauten Fehlern ----------
 * {richtig|falsch~Hinweis|falsch2~Hinweis} ist ein Wort, das falsch sein kann. Pro Frage werden 1–2 davon falsch gezeigt.
 * Hinweis-Kürzel: V <Verlängerung> · G <Verlängerung> (Endung -ig) · A (Adjektiv klein) · N (Nomen groß) · K (Vergleichsstufe)
 *                 S (Höchststufe) · W (als/wie) · P (Satzzeichen) · X <freier Text>
 * Nur hinten anhängen (die Schatzkiste merkt sich die Position).
 */
const SPOT=[
 'Der {Hund|Hunt~V die Hunde} ist schneller {als|wie~W} die Katze.',
 'Im {Wald|Walt~V die Wälder} ist es ganz {ruhig|ruhich~G ruhige|Ruhig~A}.',
 'Wo ist mein {Korb|Korp~V die Körbe} {?|.~P}',
 'Der Elefant ist {größer|großer~K} als die {Maus|maus~N}.',
 'Mein {Freund|Freunt~V die Freunde} ist sehr {lustig|lustich~G lustige|Lustig~A}.',
 'Räum bitte dein {Zimmer|zimmer~N} auf {!|?~P}',
 'Von allen Tieren ist die {Giraffe|giraffe~N} {am größten|am größesten~S|am großten~S}.',
 'Der {Zug|Zuk~V die Züge} fährt {am schnellsten|am schnellesten~S}.',
 'Heute ist es {windig|windich~G windige|windlich~X Aus <b>der Wind</b> wird wind<b>ig</b>.} und {kalt|kald~V kalte Füße}.',
 'Hast du das {Geld|Gelt~V die Gelder} {?|.~P}',
 'Das {Kind|Kint~V die Kinder} malt ein {Bild|Bilt~V die Bilder}.',
 'Im {Herbst|herbst~N} ist es oft {stürmisch|stürmich~X Endung <b>-isch</b>: stürm<b>isch</b>|stürmig~X Aus <b>der Sturm</b> wird stürm<b>isch</b>.}.',
 'Sie {sagt|sakt~V sagen}, der {Berg|Berk~V die Berge} ist hoch.',
 'Ein Löwe ist {stärker|starker~K} {als|wie~W} ein {Hund|Hunt~V die Hunde}.',
 'Ich bin so groß {wie|als~X Gleich groß → <b>so groß wie</b>.} mein {Bruder|bruder~N}.',
 'Er {gibt|gipt~V geben} mir ein {Geschenk|Gescheng~V die Geschenke}.',
 'Der {Weg|Wek~V die Wege} zum {Zelt|Zeld~V die Zelte} ist {lang|lank~V lange Wege}.',
 'Wie heißt dein {Pferd|Pfert~V die Pferde} {?|!~P}',
 'Pizza esse ich {lieber|gerner~X Ausnahme: gern → <b>lieber</b> → am liebsten} als {Spinat|spinat~N}.',
 'Die {Bank|Bang~V die Bänke} im {Park|Parg~V die Parks} ist {gelb|gelp~V gelbe Blumen}.',
 'Am Freitag schreiben wir einen {Test|test~N} {.|?~P}',
 'Der Turm ist {höher|hocher~X Ausnahme: hoch → <b>höher</b> → am höchsten} als das {Haus|haus~N}.',
 'Opa ist {älter|alter~K} als Papa, aber Uroma ist {am ältesten|am altesten~S}.',
 'Das ist ein {freundlicher|freundiger~X Aus <b>der Freund</b> wird freund<b>lich</b>.|Freundlicher~A} {Hund|Hunt~V die Hunde}.',
 'Der {Dieb|Diep~V die Diebe} schleicht ganz {leise|Leise~A} {.|?~P}',
 'Wann beginnt die {Pause|pause~N} {?|.~P}',
 'Mein {Rad|Rat~V die Räder} ist {schneller|schnella~K} als deins.',
 'Der {Zwerg|Zwerk~V die Zwerge} ist {klug|kluk~V kluge Kinder} und {mutig|mutich~G mutige|Mutig~A}.'
];
function spotHint(code,right){
  const c=code.charAt(0),t=code.slice(1).trim();
  if(c==='V')return `🔍 Verlängern: <b>${t}</b>. Jetzt hörst du es!`;
  if(c==='G')return `🔍 Endung <b>-ig</b>, das hörst du beim Verlängern: <b>${t}</b>.`;
  if(c==='A')return 'Adjektive schreibt man <b>klein</b>.';
  if(c==='N')return 'Nomen schreibt man <b>groß</b>. (Man kann <i>der, die, das</i> davorsetzen.)';
  if(c==='K')return 'Vergleichsstufe: <b>'+right+' als</b> (mit Umlaut: a → ä, o → ö, u → ü).';
  if(c==='S')return 'Höchststufe: <b>am …sten</b>.';
  if(c==='W')return 'Verschieden → <b>als</b> (größer als). Gleich → <b>wie</b> (so groß wie).';
  if(c==='P'){const T=STYPES[{'.':'A','?':'F','!':'B'}[right]];return T.ex+'.'}
  return t;
}
function qSpot(src){
  const parts=src.match(/\{[^}]*\}|[^\s{]+/g);
  const tokens=parts.map(p=>{
    if(p.charAt(0)!=='{')return {t:p};
    const alts=p.slice(1,-1).split('|');
    return {t:alts[0],wrongs:alts.slice(1).map(a=>{const i=a.indexOf('~');return i<0?{t:a,h:''}:{t:a.slice(0,i),h:a.slice(i+1)}})};
  });
  const slots=tokens.map((k,i)=>k.wrongs?i:-1).filter(i=>i>=0);
  const n=Math.min(slots.length,Math.random()<.45?1:2);
  const pick=shuffle(slots).slice(0,n).sort((a,b)=>a-b),notes=[];
  const out=tokens.map((k,i)=>{
    if(pick.indexOf(i)<0)return {t:k.t};
    const w=shuffle(k.wrongs)[0];const qt=x=>/^[.!?]$/.test(x)?`„${x}“`:x;notes.push(`<s>${qt(w.t)}</s> → <b>${qt(k.t)}</b>: ${spotHint(w.h,k.t)}`);
    return {t:w.t,fix:k.t};
  });
  const right=tokens.map(k=>k.t).join(' ').replace(/ ([.,!?])/g,'$1');
  return {task:'Tippe die falschen Wörter an!',prompt:`<div class="spothead">🕵️ In diesem Satz ${n===1?'steckt <b>1 Fehler</b>':`stecken <b>${n} Fehler</b>`}.</div>`,
    spot:{tokens:out,n},answer:right,explain:notes.join('<br>')+`<br>Richtig: „${right}“`};
}

/* ---------- Hör-Diktat: die Eule liest vor, das Kind schreibt ---------- */
const isNoun=w=>/^(der|die|das) /.test(w);
function dVerl(v){
  const full=v[0].replace('_',v[1]),q=qVerl(v);
  const noun=isNoun(full),verb=/^(er|sie|es) /.test(full);
  const accept=[full];if(noun||verb)accept.push(cap(full));if(noun)accept.push(full.split(' ').slice(1).join(' '));
  return {input:true,say:full,task:noun?'Hör gut zu und schreibe das Nomen mit Artikel!':verb?'Hör gut zu und schreibe genau, was du hörst!':'Hör gut zu und schreibe das Adjektiv!',
    prompt:'',answer:full,accept,explain:q.explain};
}
function dNomen([n,a]){
  return {input:true,say:a,task:'Hör gut zu und schreibe das Adjektiv!',prompt:`<div class="dtip">Tipp: Es kommt von <b>${n}</b>.</div>`,answer:a,
    explain:`${n} → <b>${a.replace(/(isch|lich|ig)$/,'<span class="hl">$1</span>')}</b><br>Adjektive schreibt man <b>klein</b>!`};
}
function dStufe([p,k,s],which){
  const ans=which==='s'?s:k+' als';
  return {input:true,say:ans,task:which==='s'?'Hör gut zu und schreibe die Höchststufe!':'Hör gut zu und schreibe die Vergleichsstufe mit „als“!',
    prompt:`<div class="dtip">Grundstufe: <b>${p}</b></div>`,answer:ans,explain:`So wird <b>${p}</b> gesteigert:`+chainHTML(p,k,s)};
}
const DSATZ=SATZ.filter(s=>s[0].split(' ').length<=4&&s[0].indexOf(',')<0);
function dSatz([s,t]){
  const T=STYPES[t],full=s+T.mark;
  return {input:true,say:full,task:'Hör gut zu und schreibe den ganzen Satz – mit Satzzeichen!',prompt:'',answer:full,accept:[full,s+' '+T.mark],
    explain:`${T.ex}<br>„${full}“`};
}

/* ---------- Registrieren ---------- */
LernApp.register({
  id:'deutsch-grammatik-2026-11',
  subject:'Deutsch',
  title:'Grammatiktest',
  subtitle:'Adjektive erkennen, steigern & bilden, Wörter verlängern, Satzarten',
  testName:'Grammatiktest',
  date:'2026-11-20',
  icon:'📘',
  color:'#7c3aed',
  worlds:[
    {id:'probe',name:'Adjektiv-Labor',icon:'🧪',color:'#db2777',color2:'#f472b6',topic:'Ist das ein Adjektiv? Mach die Adjektiv-Probe!',
     rules:'Die <b>Adjektiv-Probe</b>:<br>1. Passt die Frage <b>Wie ist jemand / etwas?</b> → Das Wasser ist <b>kalt</b>.<br>2. Passt es <b>zwischen Artikel und Nomen</b>? → das <b>kalte</b> Wasser<br>3. Gibt es ein <b>Gegenteil</b>? → kalt – warm<br>Adjektive schreibt man <b>klein</b>.',
     cats:()=>[PROBE.map(p=>()=>qWhichAdj(p)),PROBE.map(p=>()=>qGegenteil(p)),PROBE.map(p=>()=>qArtikel(p)),ADJSENT.map(x=>()=>qFindAdj(x))],
     write:()=>PROBE.map(p=>()=>wGegenteil(p)).concat(ADJSENT.map(x=>()=>wFindAdj(x)))},
    {id:'steigern',name:'Steiger-Turm',icon:'🚀',color:'#f97316',color2:'#f59e0b',topic:'Adjektive steigern: schnell, schneller als, am schnellsten',
     rules:'schnell → <b>schneller als</b> → <b>am schnellsten</b><br>Vorsicht, Ausnahmen: gut → besser → am besten · viel → mehr → am meisten · gern → lieber → am liebsten · hoch → höher → am höchsten<br>Verschieden: <b>größer als</b> · Gleich: <b>so groß wie</b>',
     cats:()=>[ADJ.map(a=>()=>qChain(a,'s')),ADJ.map(a=>()=>qChain(a,'k')),COMP_SENT.map(c=>()=>qCompSent(c)),ALSWIE.map(c=>()=>qAlsWie(c))],
     // Schreib-Reihenfolge: erst die alten Fragen, die neuen hinten dran (Schatzkiste merkt sich die Position)
     write:()=>ADJ0.map(a=>()=>wChain(a,'s')).concat(ADJ0.map(a=>()=>wChain(a,'k')),COMP0.map(c=>()=>wCompSent(c)),ALSWIE.map(c=>()=>wAlsWie(c)),
       ADJ1.map(a=>()=>wChain(a,'s')),ADJ1.map(a=>()=>wChain(a,'k')),COMP1.map(c=>()=>wCompSent(c)))},
    {id:'nomen',name:'Wort-Werkstatt',icon:'🛠️',color:'#16a34a',color2:'#10b981',topic:'Aus Nomen Adjektive bilden: das Glück → glücklich',
     rules:'Mit den Endungen <b>-ig</b> und <b>-lich</b>: das Glück → glück<b>lich</b>, die Sonne → sonn<b>ig</b>, der Tag → täg<b>lich</b><br>Manchmal auch <b>-isch</b>: der Sturm → stürm<b>isch</b><br>Adjektive schreibt man <b>klein</b>!',
     cats:()=>[NA.map(x=>()=>qNomen(x)),NA.map(x=>()=>qEndung(x)),NSENT.map(x=>()=>qNSent(x))],
     write:()=>NA.map(x=>()=>wNomen(x)).concat(NSENT.map(x=>()=>wNSent(x)))},
    {id:'verl',name:'Detektiv-Büro',icon:'🔍',color:'#7c3aed',color2:'#a855f7',topic:'d oder t? g oder k? b oder p? Wörter verlängern',
     rules:'Am Wortende hört man es nicht. Darum: <b>Wort verlängern!</b><br>der Hund → die Hun<b>d</b>e · der Berg → die Ber<b>g</b>e · der Korb → die Kör<b>b</b>e<br>Bei Verben: Grundform bilden: sie sagt → sa<b>g</b>en',
     cats:()=>['dt','gk','bp'].map(pr=>VL.filter(v=>pr.indexOf(v[1])>=0).map(v=>()=>qVerl(v))),
     write:()=>VL.map(v=>()=>wVerl(v))},
    {id:'satz',name:'Satz-Insel',icon:'🏝️',color:'#0284c7',color2:'#06b6d4',topic:'Satzarten: Aussage-, Frage-, Aufforderungs- und Ausrufesatz',
     rules:'<b>Aussagesatz</b> erzählt etwas → <b>.</b><br><b>Fragesatz</b> fragt (W-Wort oder Verb vorne) → <b>?</b><br><b>Aufforderungssatz</b> ist Bitte oder Befehl → <b>!</b><br><b>Ausrufesatz</b> zeigt ein Gefühl (Oh! Hurra! Igitt! Au!) → <b>!</b>',
     cats:()=>[SATZ.map(s=>()=>qSatzTyp(s)),SATZ.map(s=>()=>qZeichen(s))],
     write:()=>SATZ.map(s=>()=>wZeichen(s))}
  ],
  boss:{name:'Grammatik-Drache',icon:'🐉',count:15,lives:3},
  badgeTitle:'Grammatik-Abzeichen',
  badges:[
    {id:'labor',icon:'🧪',name:'Adjektiv-Forscher',desc:'3 Sterne im Adjektiv-Labor',test:c=>c.starsIn('probe')>=3},
    {id:'turm',icon:'🚀',name:'Turm-Kletterer',desc:'3 Sterne im Steiger-Turm',test:c=>c.starsIn('steigern')>=3},
    {id:'werkstatt',icon:'🛠️',name:'Wort-Schmied',desc:'3 Sterne in der Wort-Werkstatt',test:c=>c.starsIn('nomen')>=3},
    {id:'detektiv',icon:'🔍',name:'Meister-Detektiv',desc:'3 Sterne im Detektiv-Büro',test:c=>c.starsIn('verl')>=3},
    {id:'insel',icon:'🏝️',name:'Insel-Kapitän',desc:'3 Sterne auf der Satz-Insel',test:c=>c.starsIn('satz')>=3},
    {id:'fehler',icon:'🕵️',name:'Fehler-Jäger',desc:'3 Sterne beim Fehler-Detektiv',test:c=>c.starsIn('detektiv')>=3},
    {id:'ohr',icon:'🎧',name:'Gute Ohren',desc:'3 Sterne im Hör-Diktat',test:c=>c.starsIn('diktat')>=3},
    {id:'drache',icon:'🐉',name:'Drachen-Zähmer',desc:'Den Grammatik-Drachen besiegt',test:c=>c.kind==='boss'&&c.won&&!c.gold},
    {id:'r100',icon:'📖',name:'Grammatik-Fan',desc:'100 Grammatik-Fragen richtig',test:c=>c.correct>=100},
    {id:'krone',icon:'👑',name:'Grammatik-König',desc:'Alle Sterne im Grammatiktest',test:c=>c.allStars}
  ],
  missions:[
    {id:'detektiv',name:'Fehler-Detektiv',icon:'🕵️',color:'#334155',color2:'#64748b',count:8,topic:'In jedem Satz verstecken sich Fehler. Findest du sie alle?',
     cats:()=>[SPOT.map(x=>()=>qSpot(x))]},
    {id:'diktat',name:'Hör-Diktat',icon:'🎧',color:'#9333ea',color2:'#ec4899',count:10,topic:'Die Eule liest vor – du schreibst! Ton anschalten 🔊',
     cats:()=>[VL.filter(v=>'dt'.indexOf(v[1])>=0).map(v=>()=>dVerl(v)),VL.filter(v=>'gkbp'.indexOf(v[1])>=0).map(v=>()=>dVerl(v)),
       NA.map(x=>()=>dNomen(x)),ADJ0.map(a=>()=>dStufe(a,'k')).concat(ADJ0.map(a=>()=>dStufe(a,'s')),ADJ1.map(a=>()=>dStufe(a,'k')),ADJ1.map(a=>()=>dStufe(a,'s'))),DSATZ.map(x=>()=>dSatz(x))]}
  ],
  // Spannung bis zum Test: jeden Tag kommt etwas Neues dazu
  unlock:{blitz:'2026-11-17',chest:'2026-11-18',gold:'2026-11-18',exam:'2026-11-18',detektiv:'2026-11-18',diktat:'2026-11-19'}
});
})();
