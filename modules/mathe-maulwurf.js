/* Lernpaket: Mathe-Maulwurf – Mathe Klasse 3, ohne Testdatum (dauerhaft zum Üben).
 * Themen angelehnt an „Denken und Rechnen 3 – Forderheft“ (Westermann 2024): Zahlen bis 1000,
 * Kopfrechnen, Einmaleins, schriftlich rechnen, Größen (Geld, Längen, Gewichte, Zeit), Knobeln.
 * Alle Aufgaben sind selbst geschrieben.
 *
 * Die Zahlen werden mit festem Startwert (seed) erzeugt: Jede Frage hat damit immer dieselbe Position,
 * die Schatzkiste findet sie wieder. Neue Aufgaben nur hinten anhängen bzw. neue Kategorien hinten anfügen,
 * seeds und Anzahlen bestehender Listen nicht ändern.
 */
(function(){
const {shuffle,pick3,gapIn}=LernApp.util;

/* ---------- Werkzeuge ---------- */
function seeded(s){return ()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296}}
/** n verschiedene Datensätze, reproduzierbar über seed. make(ri) bekommt ri(a,b) = Zufallszahl a…b. */
function gen(seed,n,make){
  const R=seeded(seed),ri=(a,b)=>a+Math.floor(R()*(b-a+1)),out=[],seen={};
  for(let k=0;k<n*30&&out.length<n;k++){const d=make(ri,R);if(!d)continue;const key=JSON.stringify(d);if(!seen[key]){seen[key]=1;out.push(d)}}
  return out;
}
/** Antwort + bis zu 3 falsche Zahlen-Antworten (keine negativen, keine Doppelten). */
function opts(ans,cands){
  const a=String(ans);
  return [a].concat(pick3(a,cands.map(String).filter(x=>x!=='NaN'&&x.charAt(0)!=='-')));
}
const near=(n,steps)=>steps.map(s=>n+s);
const G='<span class="gap">?</span>';
const eur=ct=>(ct/100).toFixed(2).replace('.',',')+' €';
const two=n=>String(n).padStart(2,'0');
const tm=min=>`${Math.floor(min/60)}:${two(min%60)} Uhr`;

/* Zahlwörter bis 999 */
const ONES=['','eins','zwei','drei','vier','fünf','sechs','sieben','acht','neun'];
const TEENS=['zehn','elf','zwölf','dreizehn','vierzehn','fünfzehn','sechzehn','siebzehn','achtzehn','neunzehn'];
const TENS=['','','zwanzig','dreißig','vierzig','fünfzig','sechzig','siebzig','achtzig','neunzig'];
function u100(n){
  if(n<10)return ONES[n];if(n<20)return TEENS[n-10];
  const t=Math.floor(n/10),e=n%10;return e?(e===1?'ein':ONES[e])+'und'+TENS[t]:TENS[t];
}
const word=n=>{const h=Math.floor(n/100),r=n%100;return (h?(h===1?'ein':ONES[h])+'hundert':'')+(r?u100(r):'')};

/* Stellenwerttafel */
const stw=n=>{const d=String(n).padStart(3,'0').split('');return `<table class="stw"><tr><th>H</th><th>Z</th><th>E</th></tr><tr>${d.map(x=>`<td>${x}</td>`).join('')}</tr></table>`};
/* Schriftliche Rechnung untereinander */
function calc(a,b,op,res){
  const W=4,cells=n=>String(n).padStart(W,' ').split('').map(x=>`<td>${x===' '?'':x}</td>`).join('');
  return `<table class="calc"><tr><td></td>${cells(a)}</tr><tr><td>${op}</td>${cells(b)}</tr><tr class="sum"><td></td><td colspan="${W}">${res===undefined?G:res}</td></tr></table>`;
}
/* Zahlenmauer: unten a b c, Mitte a+b b+c, oben Summe. hole = Index (0 oben, 1–2 Mitte, 3–5 unten) */
function mauer(v,hole){
  const b=(i)=>`<span class="brick">${i===hole?G:v[i]}</span>`;
  return `<div class="mauer"><div>${b(0)}</div><div>${b(1)}${b(2)}</div><div>${b(3)}${b(4)}${b(5)}</div></div>`;
}

/* ===================== Welt 1: Zahlen-Tunnel (Zahlen bis 1000) ===================== */
const STELLEN=gen(11,30,ri=>{const n=ri(101,989);return n%10&&Math.floor(n/10)%10?[n,ri(0,2)]:null});
function qStelle([n,t]){
  const [h,z,e]=String(n).split('').map(Number);
  if(t===0){
    return {task:'Welche Zahl ist das?',prompt:`<div class="bigword">${h} H &nbsp;${z} Z &nbsp;${e} E</div>`,
      options:opts(n,[100*h+10*e+z,100*z+10*h+e,100*e+10*z+h,1000*h+10*z+e,100*h+z+e*10]),answer:String(n),
      explain:`H = Hunderter, Z = Zehner, E = Einer.${stw(n)}${h} Hunderter, ${z} Zehner und ${e} Einer sind <b>${n}</b>.`};
  }
  const which=t===1?['Zehner',z]:['Hunderter',h];
  return {task:`Wie viele ${which[0]} hat die Zahl?`,prompt:`<div class="bigword">${n}</div>`,options:opts(which[1],[h,z,e,which[1]+1,which[1]+2,which[1]-1]),answer:String(which[1]),big:true,
    explain:`Schau in die Stellenwerttafel:${stw(n)}<b>${n}</b> hat <b>${which[1]} ${which[0]}</b>.`};
}
function uniq3(list){const a=list.map(String);const u=a.filter((x,i)=>a.indexOf(x)===i);return u.length>=2?u:u.concat(String(+u[0]+1))}

const NACHBAR=gen(12,30,ri=>[ri(102,988),ri(0,4)]);
function qNachbar([n,t]){
  const T=[
    ['Welche Zahl kommt direkt danach? (Nachfolger)',n+1,[n-1,n+10,n+11,n]],
    ['Welche Zahl kommt direkt davor? (Vorgänger)',n-1,[n+1,n-10,n-11,n]],
    ['Welche Zahl ist um 10 größer?',n+10,[n+1,n+100,n-10,n+11]],
    ['Welche Zahl ist um 100 kleiner?',n-100,[n-10,n+100,n-1,n-110]],
    ['Welcher Zehner kommt danach? (Nachbarzehner)',Math.floor(n/10)*10+10,[Math.floor(n/10)*10,Math.floor(n/10)*10+20,Math.floor(n/100)*100+100,n+10]]
  ][t];
  return {task:T[0],prompt:`<div class="bigword">${n}</div>`,options:opts(T[1],T[2]),answer:String(T[1]),
    explain:['Der <b>Nachfolger</b> ist um 1 größer.','Der <b>Vorgänger</b> ist um 1 kleiner.','10 mehr: Die <b>Zehnerziffer</b> wird um 1 größer.','100 weniger: Die <b>Hunderterziffer</b> wird um 1 kleiner.','Die <b>Nachbarzehner</b> sind die Zehnerzahlen links und rechts davon.'][t]+`<br>${n} → <b>${T[1]}</b>`};
}
const MITTE=gen(13,24,ri=>{const step=[10,100,20,50,200][ri(0,4)],a=ri(0,Math.floor((1000-2*step)/step))*step;return a+2*step<=1000?[a,a+2*step]:null});
function qMitte([a,b]){
  const m=(a+b)/2,d=(b-a)/2;
  return {task:'Zahlenstrahl: Welche Zahl liegt genau in der Mitte?',
    prompt:`<div class="strahl"><span>${a}</span><span class="mid">${G}</span><span>${b}</span></div>`,
    options:opts(m,[m+d/2,m-d/2,m+10,m-10,m+1]),answer:String(m),
    explain:`Von ${a} bis ${b} sind es ${b-a}. Die Hälfte davon ist ${d}.<br>${a} + ${d} = <b>${m}</b>`};
}
const RUNDEN=gen(14,36,ri=>{const n=ri(101,994);return n%10?[n,ri(0,1)]:null});
function qRunden([n,t]){
  const step=t?100:10,down=Math.floor(n/step)*step,up=down+step,ans=n-down<step/2?down:up;
  const key=t?Math.floor(n/10)%10:n%10;
  return {task:`Runde auf ${t?'Hunderter':'Zehner'}!`,prompt:`<div class="bigword">${n} ≈ ${G}</div>`,
    options:opts(ans,[down,up,t?Math.round(n/10)*10:Math.round(n/100)*100,ans===down?down-step:up+step]),answer:String(ans),
    explain:`Schau auf die ${t?'Zehnerziffer':'Einerziffer'}: <b>${key}</b>.<br>0, 1, 2, 3, 4 → abrunden · 5, 6, 7, 8, 9 → aufrunden.<br>${n} ≈ <b>${ans}</b>`};
}
const VERGL=gen(15,30,ri=>{const a=ri(100,999),t=ri(0,3);const b=t===0?a:t===1?Number(String(a).split('').reverse().join('')):a+[1,-1,10,-10,100,-100][ri(0,5)];return b>=100&&b<=999?[a,b]:null});
function qVergl([a,b]){
  const ans=a<b?'<':a>b?'>':'=';
  return {task:'Welches Zeichen passt?',prompt:`<div class="bigword">${a} ${G} ${b}</div>`,options:['<','=','>'],fixed:true,big:true,answer:ans,
    explain:'Vergleiche erst die Hunderter, dann die Zehner, dann die Einer.<br>Das Krokodil frisst immer die <b>größere</b> Zahl: &lt; heißt „kleiner als“, &gt; heißt „größer als“.'+`<br>${a} <b>${ans}</b> ${b}`};
}
const WORT=gen(16,30,ri=>{const n=ri(101,999);const z=Math.floor(n/10)%10,e=n%10;return z!==e&&e&&z!==1?n:null});
function qWort(n){
  const [h,z,e]=String(n).split('').map(Number);
  return {task:'Welche Zahl ist das?',prompt:`<div class="bigword" style="font-size:24px">${word(n)}</div>`,
    options:opts(n,[100*h+10*e+z,1000*h+10*z+e,100*h+e,100*h+10*z,100*z+10*e+h]),answer:String(n),
    explain:`Im Deutschen sprechen wir die Einer vor den Zehnern: <b>${ONES[e]==='eins'?'ein':ONES[e]}</b>und<b>${TENS[z]}</b>.<br>Schreibe zuerst die Hunderter, dann die Zehner, dann die Einer: <b>${n}</b>`};
}

/* ===================== Welt 2: Kopfrechen-Höhle ===================== */
const PLUS=gen(21,40,ri=>{const t=ri(0,3);
  if(t===0){const a=ri(1,8)*100,b=ri(1,9-a/100)*100;return ['+',a,b]}
  if(t===1){const a=ri(10,89)*10,b=ri(1,9)*10;return a+b<=1000?['+',a,b]:null}
  if(t===2){const a=ri(100,989),b=ri(2,9);return a%10+b>=10&&a+b<1000?['+',a,b]:null}
  const a=ri(100,890),b=ri(11,99);return a+b<=1000?['+',a,b]:null});
const MINUS=gen(22,40,ri=>{const t=ri(0,3);
  if(t===0){const a=ri(3,10)*100,b=ri(1,a/100-1)*100;return ['−',a,b]}
  if(t===1){const a=ri(11,99)*10,b=ri(1,9)*10;return a-b>0?['−',a,b]:null}
  if(t===2){const a=ri(110,999),b=ri(2,9);return a%10<b?['−',a,b]:null}
  const a=ri(200,999),b=ri(11,99);return ['−',a,b]});
function qKopf([op,a,b]){
  const r=op==='+'?a+b:a-b;
  const steps=b<10?`${a} ${op} ${b}: Erst bis zum Zehner, dann weiter.`:b%100===0?`Nur die Hunderter rechnen: ${a/100} ${op} ${b/100} = ${r/100}.`:b%10===0?`Rechne mit Zehnern: ${a/10} Z ${op} ${b/10} Z = ${r/10} Z.`:
    `Erst die Zehner, dann die Einer: ${a} ${op} ${b-b%10} = ${op==='+'?a+b-b%10:a-b+b%10}, dann ${op} ${b%10}.`;
  return {task:'Rechne im Kopf!',prompt:`<div class="bigword">${a} ${op} ${b} = ${G}</div>`,options:opts(r,near(r,[10,-10,1,-1,100,-100])),answer:String(r),
    explain:`${steps}<br>${a} ${op} ${b} = <b>${r}</b>`};
}
const ERG=gen(23,30,ri=>{const t=ri(0,2);
  if(t===0){const a=ri(1,99)*10;return [a,1000]}
  if(t===1){const a=ri(101,989);return a%100?[a,Math.ceil(a/100)*100]:null}
  const a=ri(1,19)*50;return [a,1000]});
function qErg([a,z]){
  const r=z-a;
  return {task:'Wie viel fehlt?',prompt:`<div class="bigword">${a} + ${G} = ${z}</div>`,options:opts(r,near(r,[10,-10,100,-100,1])),answer:String(r),
    explain:`Rechne rückwärts: ${z} − ${a} = <b>${r}</b>.<br>Probe: ${a} + ${r} = ${z} ✔️`};
}
const UEB=gen(24,30,ri=>{const a=ri(102,689),b=ri(102,989-a);return b>101&&Math.abs(a%100-50)>8&&Math.abs(b%100-50)>8?[ri(0,1)?'+':'−',a,b]:null});
function qUeb([op,a,b]){
  if(op==='−'&&a<b){const t=a;a=b;b=t}
  const ra=Math.round(a/100)*100,rb=Math.round(b/100)*100,r=op==='+'?ra+rb:ra-rb;
  if(r<=0)return qUeb(['+',a,b]);
  return {task:'Überschlage! Runde beide Zahlen auf Hunderter.',prompt:`<div class="bigword">${a} ${op} ${b} ≈ ${G}</div>`,options:opts(r,near(r,[100,-100,200,-200])),answer:String(r),
    explain:`${a} ≈ ${ra} und ${b} ≈ ${rb}<br>${ra} ${op} ${rb} = <b>${r}</b><br>Mit dem Überschlag merkst du, ob dein genaues Ergebnis stimmen kann.`};
}
const WEG=gen(25,30,ri=>{const a=ri(111,699),b=ri(111,299);return a+b<1000&&a%10&&b%10&&b%100>10?[a,b]:null});
function qWeg([a,b]){
  const h=b-b%100,z=b%100-b%10,e=b%10,r=a+b;
  return {task:'Rechne Schritt für Schritt!',prompt:`<div class="bigword">${a} + ${b} = ${G}</div>`,options:opts(r,near(r,[10,-10,100,-100,1,-1])),answer:String(r),
    explain:`Zerlege die zweite Zahl: ${b} = ${h} + ${z} + ${e}<div class="mini"><span>${a} + ${h} = ${a+h}</span><span>${a+h} + ${z} = ${a+h+z}</span><span>${a+h+z} + ${e} = <b>${r}</b></span></div>`};
}

/* ===================== Welt 3: Einmaleins-Mine ===================== */
const MAL=gen(31,45,ri=>[ri(2,10),ri(2,10)]);
function qMal([a,b]){
  const r=a*b;
  return {task:'Einmaleins',prompt:`<div class="bigword">${a} · ${b} = ${G}</div>`,options:opts(r,[r+a,r-a,r+b,r-b,(a+1)*(b+1),a+b]),answer:String(r),
    explain:`${a} · ${b} heißt: ${b<=5?Array(b).fill(a).join(' + '):`${b}-mal die ${a}`} = <b>${r}</b>${b>5&&b<10?`<br>Trick: ${a} · ${b} = ${a} · 5 + ${a} · ${b-5} = ${a*5} + ${a*(b-5)}`:''}`};
}
const GETEILT=gen(32,40,ri=>[ri(2,10),ri(2,10)]);
function qGeteilt([a,b]){
  const p=a*b;
  return {task:'Geteilt',prompt:`<div class="bigword">${p} : ${a} = ${G}</div>`,options:opts(b,[b+1,b-1,a,b+2,p-a]),answer:String(b),
    explain:`Denk an die Malaufgabe: ${a} · <b>${b}</b> = ${p}.<br>Also: ${p} : ${a} = <b>${b}</b>`};
}
const PLATZ=gen(33,30,ri=>[ri(3,10),ri(3,10),ri(0,1)]);
function qPlatz([a,b,t]){
  const p=a*b;
  return {task:'Welche Zahl fehlt?',prompt:`<div class="bigword">${t?`${a} · ${G} = ${p}`:`${G} : ${a} = ${b}`}</div>`,options:opts(t?b:p,t?[b+1,b-1,p-a,a]:[p+a,p-a,a+b,b]),answer:String(t?b:p),
    explain:t?`Wie oft passt ${a} in ${p}? ${p} : ${a} = <b>${b}</b>`:`Umkehraufgabe: ${b} · ${a} = <b>${p}</b>`};
}
const PVS=gen(34,30,ri=>[ri(2,20),ri(2,9),ri(2,9),ri(0,2)]);
function qPvs([a,b,c,t]){
  let s,r,wrong;
  if(t===0){s=`${a} + ${b} · ${c}`;r=a+b*c;wrong=(a+b)*c}
  else if(t===1){s=`${b} · ${c} − ${Math.min(a,b*c-1)}`;r=b*c-Math.min(a,b*c-1);wrong=b*(c-Math.min(a,b*c-1))}
  else{s=`${a} + ${b*c} : ${c}`;r=a+b;wrong=(a+b*c)/c}
  return {task:'Punktrechnung vor Strichrechnung!',prompt:`<div class="bigword">${s} = ${G}</div>`,options:opts(r,[wrong,r+1,r-1,r+c].filter(x=>x===Math.floor(x))),answer:String(r),
    explain:`<b>Mal (·) und geteilt (:) zuerst</b>, dann plus und minus.<br>${s} = <b>${r}</b>`};
}
const GROSS=gen(35,36,ri=>{const a=ri(2,9),b=ri(2,9),t=ri(0,2);return [a,b,t]});
function qGross([a,b,t]){
  let s,r,ex;
  if(t===0){s=`${a*10} · ${b}`;r=a*b*10;ex=`${a} · ${b} = ${a*b}, also ${a} <b>Zehner</b> · ${b} = ${a*b} Zehner = <b>${r}</b>`}
  else if(t===1){s=`${a} · ${b*100}`;r=a*b*100;ex=`${a} · ${b} = ${a*b}, also ${a} · ${b} <b>Hunderter</b> = <b>${r}</b>`}
  else{s=`${a*b*10} : ${a}`;r=b*10;ex=`${a*b} : ${a} = ${b}, also ${a*b} Zehner : ${a} = ${b} Zehner = <b>${r}</b>`}
  return {task:'Mit großen Zahlen',prompt:`<div class="bigword">${s} = ${G}</div>`,options:opts(r,[r*10,r/10,r+10,r-10].filter(x=>x===Math.floor(x))),answer:String(r),explain:ex};
}
const HMAL=gen(36,30,ri=>{const t=ri(0,1);if(t===0)return [0,ri(11,19),ri(3,9)];const d=ri(3,8),q=ri(11,19);return d*q<=150?[1,d*q,d]:null});
function qHmal([t,a,b]){
  if(t===0){const r=a*b,z=a-a%10,e=a%10;
    return {task:'Rechne geschickt!',prompt:`<div class="bigword">${a} · ${b} = ${G}</div>`,options:opts(r,[r+b,r-b,z*b+e,r+10]),answer:String(r),
      explain:`Zerlege ${a} in ${z} + ${e}:<div class="mini"><span>${z} · ${b} = ${z*b}</span><span>${e} · ${b} = ${e*b}</span><span>${z*b} + ${e*b} = <b>${r}</b></span></div>`}}
  const r=a/b,z=10*b;
  return {task:'Rechne geschickt!',prompt:`<div class="bigword">${a} : ${b} = ${G}</div>`,options:opts(r,[r+1,r-1,r+10,r+2]),answer:String(r),
    explain:`Zerlege ${a} in ${z} + ${a-z}:<div class="mini"><span>${z} : ${b} = 10</span><span>${a-z} : ${b} = ${(a-z)/b}</span><span>10 + ${(a-z)/b} = <b>${r}</b></span></div>`};
}

/* ===================== Welt 4: Rechen-Werkstatt (schriftlich) ===================== */
const SADD=gen(41,36,ri=>{const a=ri(123,689),b=ri(112,999-a);return b>=111&&(a%10+b%10>=10||a%100+b%100>=100)?[a,b]:null});
function noCarryAdd(a,b){let r=0,p=1;while(a||b){r+=((a%10+b%10)%10)*p;a=Math.floor(a/10);b=Math.floor(b/10);p*=10}return r}
function qSadd([a,b]){
  const r=a+b;
  return {task:'Rechne schriftlich!',prompt:calc(a,b,'+'),options:opts(r,[noCarryAdd(a,b),r+10,r-10,r+100,r-100]),answer:String(r),
    explain:`Von rechts nach links: Einer, Zehner, Hunderter. Ist eine Spalte 10 oder mehr, schreibst du den <b>Übertrag</b> klein in die nächste Spalte.${calc(a,b,'+','<b>'+r+'</b>')}`};
}
const SSUB=gen(42,36,ri=>{const a=ri(312,999),b=ri(111,a-100);return a%10<b%10||Math.floor(a/10)%10<Math.floor(b/10)%10?[a,b]:null});
function digitDiff(a,b){let r=0,p=1;while(a||b){r+=Math.abs(a%10-b%10)*p;a=Math.floor(a/10);b=Math.floor(b/10);p*=10}return r}
function qSsub([a,b]){
  const r=a-b;
  return {task:'Rechne schriftlich!',prompt:calc(a,b,'−'),options:opts(r,[digitDiff(a,b),r+10,r-10,r+100]),answer:String(r),
    explain:`Von rechts nach links. Reicht es in einer Spalte nicht, entbündelst du: Nimm 1 von der nächsten Stelle (1 Z = 10 E).<br>Vorsicht: Immer <b>oben minus unten</b> rechnen, nicht einfach die kleinere Ziffer von der größeren!${calc(a,b,'−','<b>'+r+'</b>')}<br>Probe: ${r} + ${b} = ${a} ✔️`};
}
const ZIFFER=gen(43,30,ri=>{const a=ri(123,589),b=ri(123,989-a),pos=ri(0,2),op=ri(0,1);return b>=111?[a,b,pos,op]:null});
function qZiffer([a,b,pos,op]){
  const top=op?a+b:a,bottom=b,r=op?a:a+b;
  const s=String(top),d=s.charAt(pos),masked=s.slice(0,pos)+'▢'+s.slice(pos+1);
  const sign=op?'−':'+';
  return {task:'Welche Ziffer fehlt im Kästchen?',prompt:`<div class="bigword" style="font-size:30px">${masked} ${sign} ${bottom} = ${r}</div>`,
    options:uniq3([d,(+d+1)%10,(+d+9)%10,(+d+2)%10]),big:true,answer:d,fill:d,
    explain:`Rechne mit der Umkehraufgabe: ${op?`${r} + ${bottom}`:`${r} − ${bottom}`} = <b>${top}</b>.<br>Die fehlende Ziffer ist also <b>${d}</b>.`};
}

/* ===================== Welt 5: Größen-Lager ===================== */
const GELD=gen(51,36,ri=>{const e=ri(0,19),c=[5,10,20,25,40,45,50,75,80,95,1,2,9][ri(0,12)];return [e,c,ri(0,2)]});
function qGeld([e,c,t]){
  const ct=e*100+c;
  if(t===0)return {task:'Schreibe mit Komma!',prompt:`<div class="bigword">${e} € ${c} ct = ${G}</div>`,
    options:uniq3([eur(ct),c<10?`${e},${c} €`:eur(e*100+(c%10)*10+Math.floor(c/10)),eur(ct+100),eur(ct+10),`${ct} €`]),answer:eur(ct),
    explain:`Nach dem Komma stehen immer <b>zwei Ziffern</b> für die Cent.${c<10?` ${c} ct schreibt man als <b>0${c}</b>.`:''}<br>${e} € ${c} ct = <b>${eur(ct)}</b>`};
  if(t===1)return {task:'Wie viel Cent sind das?',prompt:`<div class="bigword">${eur(ct)} = ${G} ct</div>`,
    options:opts(ct,[e*10+c,ct*10,e*100+c*10,ct+100]),answer:String(ct),fill:ct+' ct',
    explain:`1 € = 100 ct. Also ${e} € = ${e*100} ct, dazu ${c} ct:<br>${eur(ct)} = <b>${ct} ct</b>`};
  const r=(Math.ceil(ct/1000)*1000)-ct||500;
  return {task:'Wie viel Rückgeld?',prompt:`Du bezahlst <b>${eur(ct+r)}</b>. Es kostet <b>${eur(ct)}</b>. Wie viel bekommst du zurück?`,
    options:uniq3([eur(r),eur(r+100),r>100?eur(r-100):eur(r+50),eur(r+10)]),answer:eur(r),
    explain:`Ergänze bis zum bezahlten Betrag: ${eur(ct)} + <b>${eur(r)}</b> = ${eur(ct+r)}`};
}
const LAENGE=gen(52,36,ri=>{const t=ri(0,3);
  if(t===0)return [0,ri(1,9),ri(5,95)];   // m + cm -> cm
  if(t===1)return [1,ri(1,9),ri(1,19)*50]; // km + m -> m
  if(t===2)return [2,ri(1,30),ri(1,9)];   // cm + mm -> mm
  return [3,ri(1,9)*100,0]});              // cm -> m
function qLaenge([t,a,b]){
  const T=[
    [`${a} m ${b} cm = ${G} cm`,a*100+b,[a*10+b,a*1000+b,a*100+b*10,Number(`${a}${b}`)!==a*100+b?Number(`${a}${b}`):a*100+b+1],'1 m = 100 cm',' cm'],
    [`${a} km ${b} m = ${G} m`,a*1000+b,[a*100+b,a*1000+b*10,a*10000+b,(a+1)*1000+b],'1 km = 1000 m',' m'],
    [`${a} cm ${b} mm = ${G} mm`,a*10+b,[a*100+b,a+b,a*10+b+10,a*10],'1 cm = 10 mm',' mm'],
    [`${a} cm = ${G} m`,a/100,[a/10,a,a*100,a/100+1],'100 cm = 1 m',' m']
  ][t];
  return {task:'Rechne um!',prompt:`<div class="bigword" style="font-size:32px">${T[0]}</div>`,options:opts(T[1],T[2]),answer:String(T[1]),fill:T[1]+T[4],
    explain:`Merke: <b>${T[3]}</b><br>${T[0].replace(G,'<b>'+T[1]+'</b>')}`};
}
const GEWICHT=gen(53,30,ri=>{const t=ri(0,2);
  if(t===0)return [0,ri(1,9),ri(1,19)*50];
  if(t===1)return [1,ri(1,9),0];
  return [2,ri(1,9)*100,ri(1,9)*100]});
function qGewicht([t,a,b]){
  if(t===0){const r=a*1000+b;return {task:'Rechne um!',prompt:`<div class="bigword" style="font-size:32px">${a} kg ${b} g = ${G} g</div>`,options:opts(r,[a*100+b,a*1000+b*10,r+1000,a+b]),answer:String(r),fill:r+' g',
    explain:`Merke: <b>1 kg = 1000 g</b><br>${a} kg = ${a*1000} g, dazu ${b} g → <b>${r} g</b>`}}
  if(t===1){const r=a*1000+500;return {task:'Wie viel Gramm sind das?',prompt:`<div class="bigword" style="font-size:32px">${a} ½ kg = ${G} g</div>`,options:opts(r,[a*1000+50,a*100+50,a*1000+250,a*1000]),answer:String(r),fill:r+' g',
    explain:`Ein halbes Kilogramm sind <b>500 g</b>.<br>${a} kg + 500 g = <b>${r} g</b>`}}
  const s=a+b,ans=s>=1000?`${s/1000===Math.floor(s/1000)?s/1000+' kg':s+' g'}`:s+' g';
  return {task:'Zusammen wiegt das …',prompt:`Ein Paket wiegt <b>${a} g</b>, ein zweites <b>${b} g</b>. Wie schwer sind beide zusammen?`,
    options:uniq3([ans,(s+100)+' g',(s-100)+' g',s+' kg']),answer:ans,
    explain:`${a} g + ${b} g = <b>${s} g</b>${s>=1000?' = '+(s/1000)+' kg (1000 g = 1 kg)':''}`};
}
const ZEIT=gen(54,36,ri=>{const t=ri(0,2);
  if(t===0)return [0,ri(6,17)*60+ri(0,11)*5,ri(3,18)*5];
  if(t===1)return [1,ri(6,17)*60+ri(0,11)*5,[15,20,30,45,50,75,90][ri(0,6)]];
  return [2,ri(1,4),[0,15,30,45][ri(0,3)]]});
function qZeit([t,a,b]){
  if(t===0){const e=a+b;return {task:'Wie lange dauert das?',prompt:`Von <b>${tm(a)}</b> bis <b>${tm(e)}</b> sind es …`,options:uniq3([b+' min',(b+5)+' min',Math.abs(b-5)+' min',(b+10)+' min',(b+60)+' min']),answer:b+' min',
    explain:`Zähle in Schritten: Erst bis zur vollen Stunde, dann weiter.<br>${tm(a)} → ${tm(e)}: <b>${b} Minuten</b>${b>=60?` (= ${Math.floor(b/60)} h ${b%60} min)`:''}`}}
  if(t===1){const e=a+b;return {task:'Wie spät ist es dann?',prompt:`Es ist <b>${tm(a)}</b>. In <b>${b} Minuten</b> ist es …`,options:uniq3([tm(e),tm(e+10),tm(e-10),tm(a+b%60+(b>=60?0:60))]),answer:tm(e),
    explain:`Eine Stunde hat <b>60 Minuten</b>.<br>${tm(a)} + ${b} min = <b>${tm(e)}</b>`}}
  const r=a*60+b;return {task:'Wie viele Minuten sind das?',prompt:`<div class="bigword" style="font-size:32px">${a} h ${b?b+' min':''} = ${G} min</div>`,options:opts(r,[a*100+b,a*60,r+15,a*10+b]),answer:String(r),fill:r+' min',
    explain:`Merke: <b>1 h = 60 min</b><br>${a} · 60 = ${a*60}${b?`, dazu ${b} min`:''} → <b>${r} min</b>`};
}
/* Größenvorstellung: [Frage, richtig, falsch, falsch, falsch] */
const VORST=[
 ['Wie schwer ist ein Apfel ungefähr?','150 g','15 g','15 kg','150 kg'],
 ['Wie schwer ist ein Schulkind ungefähr?','30 kg','3 kg','300 kg','30 g'],
 ['Wie schwer ist eine Tafel Schokolade?','100 g','10 g','1 kg','10 kg'],
 ['Wie schwer ist ein Auto ungefähr?','1000 kg','100 kg','10 kg','100 g'],
 ['Wie schwer ist eine Feder?','1 g','1 kg','100 g','10 kg'],
 ['Wie lang ist ein Bleistift ungefähr?','17 cm','17 mm','17 m','1 km'],
 ['Wie hoch ist eine Zimmertür ungefähr?','2 m','20 cm','20 m','2 km'],
 ['Wie lang ist ein Fußballfeld ungefähr?','100 m','10 m','100 cm','10 km'],
 ['Wie lang ist eine Ameise ungefähr?','5 mm','5 cm','5 m','50 cm'],
 ['Wie weit läufst du in 15 Minuten ungefähr?','1 km','1 m','100 km','10 cm'],
 ['Wie lange dauert eine Schulstunde?','45 min','45 s','4 h','45 h'],
 ['Wie lange dauert es, sich die Zähne zu putzen?','3 min','3 h','3 s','30 min'],
 ['Wie lange schläft ein Kind in der Nacht ungefähr?','10 h','10 min','1 h','24 h'],
 ['Was kostet ein Brötchen ungefähr?','50 ct','50 €','5 ct','500 €'],
 ['Was kostet ein Fahrrad ungefähr?','300 €','3 €','30 ct','30 000 €'],
 ['Wie viel Wasser passt in einen Eimer ungefähr?','10 l','10 ml','100 l','1 l'],
 ['Wie hoch ist ein Haus mit 3 Stockwerken ungefähr?','10 m','10 cm','100 m','1 km'],
 ['Wie schwer ist ein Liter Milch ungefähr?','1 kg','1 g','10 kg','100 g']
];
function qVorst(v){
  return {task:'Schätze!',prompt:v[0],options:v.slice(1,5),answer:v[1],
    explain:`Am besten passt <b>${v[1]}</b>.<br>Tipp: Vergleiche mit Dingen, die du kennst. 1 kg ist z. B. eine Packung Zucker, 1 m ist ein großer Schritt.`};
}

/* ===================== Welt 6: Knobel-Kammer ===================== */
const MAUER=gen(61,30,ri=>{const a=ri(5,60),b=ri(5,60),c=ri(5,60);return [a,b,c,ri(0,5)]});
function qMauer([a,b,c,hole]){
  const v=[a+2*b+c,a+b,b+c,a,b,c],r=v[hole];
  return {task:'Zahlenmauer: Welche Zahl fehlt?',prompt:mauer(v,hole),options:opts(r,near(r,[1,-1,10,-10,2])),answer:String(r),
    explain:`In der Zahlenmauer ist jeder Stein die <b>Summe der beiden Steine darunter</b>.${hole>=3?' Fehlt unten ein Stein, rechnest du minus.':''}${mauer(v,-1)}`};
}
const FOLGE=gen(62,30,ri=>{const t=ri(0,2);
  if(t===0){const s=ri(1,50),d=ri(3,25);return [0,s,d]}
  if(t===1){const s=ri(150,400),d=ri(3,25);return [1,s,d]}
  const s=ri(1,9),d=ri(1,4);return [2,s,d]});
function qFolge([t,s,d]){
  let seq;
  if(t===0)seq=[0,1,2,3,4].map(i=>s+i*d);
  else if(t===1)seq=[0,1,2,3,4].map(i=>s-i*d);
  else{seq=[s];for(let i=1;i<5;i++)seq.push(seq[i-1]+d*i)}
  const r=seq[4],rule=t===0?`immer <b>+ ${d}</b>`:t===1?`immer <b>− ${d}</b>`:`erst + ${d}, dann + ${2*d}, dann + ${3*d} … (es wird jedes Mal <b>${d} mehr</b>)`;
  return {task:'Wie geht die Zahlenfolge weiter?',prompt:`<div class="bigword" style="font-size:30px">${seq.slice(0,4).join(', ')}, ${G}</div>`,options:opts(r,near(r,[d,-d,1,-1,t===2?d*4:d*2])),answer:String(r),
    explain:`Die Regel: ${rule}.<br>${seq.join(', ')}`};
}
/* Sachaufgaben (Daten fest, Text mit Zahlen) */
const SACH=gen(63,30,ri=>{const t=ri(0,5);return [t,ri(2,9),ri(2,9),ri(2,6),ri(1,5)]});
function qSach([t,a,b,c,d]){
  let txt,r,ex,unit='',wrong=[];
  if(t===0){const k=a,e=a+b;txt=`Im Schwimmbad kostet ein Kind <b>${k} €</b>, ein Erwachsener <b>${e} €</b>. Wie viel zahlen <b>${d} Erwachsene</b> und <b>${c} Kinder</b>?`;r=d*e+c*k;unit=' €';
    ex=`${d} · ${e} € = ${d*e} €<br>${c} · ${k} € = ${c*k} €<br>Zusammen: <b>${r} €</b>`;wrong=[(d+c)*e,(d+c)*k,d*e+k,r+k]}
  else if(t===1){const p=a*10;txt=`Mia hat <b>${p+b*10} €</b>. Sie kauft ein Spiel für <b>${p-b} €</b>. Wie viel Geld hat sie noch?`;r=b*11;unit=' €';
    ex=`${p+b*10} € − ${p-b} € = <b>${r} €</b>`;wrong=[r+10,r-10,r+2,p+b*10+p-b]}
  else if(t===2){const j=a;txt=`Jan taucht <b>${j} m</b> weit. Papa taucht <b>${c}-mal</b> so weit. Wie weit taucht Papa?`;r=j*c;unit=' m';
    ex=`${c}-mal so weit heißt: ${j} m · ${c} = <b>${r} m</b>`;wrong=[j+c,r+j,r-j,j*(c+1)+1]}
  else if(t===3){const n=a*c;txt=`<b>${n} Kinder</b> fahren mit Booten. In jedes Boot passen <b>${c} Kinder</b>. Wie viele Boote brauchen sie?`;r=a;unit=' Boote';
    ex=`${n} : ${c} = <b>${a}</b>, denn ${a} · ${c} = ${n}`;wrong=[a+1,a-1,n-c,a+c]}
  else if(t===4){const n=a*c+d;txt=`<b>${n} Kinder</b> wollen Boot fahren. In jedes Boot passen <b>${c} Kinder</b>. Wie viele Boote brauchen sie mindestens?`;r=a+1;unit=' Boote';
    ex=`${n} : ${c} = ${a} Rest ${d}.<br>Die ${d} übrigen Kinder brauchen auch ein Boot! Also <b>${a+1} Boote</b>.`;wrong=[a,a+2,a-1,n-c]}
  else{const s=a*5,k=b;txt=`Ein Heft kostet <b>${k} €</b>, ein Stift <b>2 €</b>. Lea kauft <b>${c} Hefte</b> und <b>${d} Stifte</b>. Was kostet alles zusammen?`;r=c*k+d*2;unit=' €';
    ex=`${c} · ${k} € = ${c*k} €<br>${d} · 2 € = ${d*2} €<br>Zusammen: <b>${r} €</b>`;wrong=[(c+d)*k,c*k+2,r+k,r-2,s]}
  const o=opts(r,wrong.concat([r+1,r+2])).map(x=>x+unit);
  return {task:'Sachaufgabe: Lies genau!',prompt:txt,options:o,answer:r+unit,explain:ex};
}
const KOMBI=[
 [3,2,'T-Shirts','Hosen'],[2,2,'Mützen','Schals'],[4,2,'Eissorten','Waffeln'],[3,3,'Brote','Beläge'],
 [4,3,'Shirts','Hosen'],[2,5,'Hosen','Pullis'],[5,2,'Eissorten','Becher'],[3,4,'Kappen','Jacken']
].map(x=>[0].concat(x)).concat([[1,1],[1,2],[2,3],[2,4],[2,5]]);
function qKombi(k){
  if(k[0]===0){const [,a,b,A,B]=k,r=a*b;
    return {task:'Wie viele Möglichkeiten gibt es?',prompt:`Tom hat <b>${a} ${A}</b> und <b>${b} ${B}</b>. Wie viele verschiedene Kombinationen kann er bilden?`,
      options:opts(r,[a+b,r+1,r-1,r+a,a*b*2]),answer:String(r),
      explain:`Zu jedem der ${a} ${A} passen ${b} ${B}: ${a} · ${b} = <b>${r}</b>. Ein Baumdiagramm hilft beim Zählen!`}}
  if(k[0]===1){const n=k[1]+1,ds=[1,2,3,4].slice(0,n),r=n===3?6:2;
    return {task:'Zahlenschloss',prompt:`Wie viele verschiedene ${n}-stellige Zahlen kannst du aus den Ziffern <b>${ds.join(', ')}</b> legen? Jede Ziffer kommt genau einmal vor.`,
      options:opts(r,[n,r+1,r*2,n*n]),answer:String(r),
      explain:n===3?'Für die erste Stelle gibt es 3 Möglichkeiten, dann 2, dann 1: 3 · 2 · 1 = <b>6</b><br>123, 132, 213, 231, 312, 321':'12 und 21 – also <b>2</b>.'}}
  const n=k[1],r=n*(n-1)/2;
  return {task:'Jeder gegen jeden',prompt:`<b>${n} Kinder</b> spielen Tischtennis. Jedes Kind spielt <b>einmal</b> gegen jedes andere. Wie viele Spiele gibt es?`,
    options:opts(r,[n*(n-1),n,r+1,n*2]),answer:String(r),
    explain:`Zähle geschickt: Das erste Kind spielt gegen ${n-1}, das zweite noch gegen ${n-2} neue … <br>${Array.from({length:n-1},(_,i)=>n-1-i).join(' + ')} = <b>${r}</b>`};
}
/* Geometrie: [Frage, richtig, falsch…] */
const GEO=[
 ['Wie viele Ecken hat ein Würfel?','8','6','12','4'],
 ['Wie viele Kanten hat ein Würfel?','12','8','6','10'],
 ['Wie viele Flächen hat ein Würfel?','6','4','8','12'],
 ['Wie viele Ecken hat ein Quader?','8','6','4','12'],
 ['Wie viele Flächen hat ein Quader?','6','4','8','5'],
 ['Welcher Körper hat keine Ecken und keine Kanten?','Kugel','Würfel','Zylinder','Pyramide'],
 ['Welcher Körper kann rollen und hat 2 kreisrunde Flächen?','Zylinder','Kugel','Kegel','Quader'],
 ['Welcher Körper hat eine Spitze und eine runde Fläche?','Kegel','Zylinder','Pyramide','Kugel'],
 ['Wie viele Ecken hat eine Pyramide mit quadratischer Grundfläche?','5','4','8','6'],
 ['Welche Form haben alle Flächen eines Würfels?','Quadrat','Rechteck','Dreieck','Kreis'],
 ['Welcher Großbuchstabe ist achsensymmetrisch?','A','F','G','R'],
 ['Welcher Großbuchstabe ist achsensymmetrisch?','H','L','P','J'],
 ['Welcher Großbuchstabe ist achsensymmetrisch?','M','N','S','Z'],
 ['Welcher Großbuchstabe ist NICHT achsensymmetrisch?','F','A','T','O'],
 ['Wie viele Symmetrieachsen hat ein Quadrat?','4','2','1','0'],
 ['Wie viele Symmetrieachsen hat ein Rechteck (kein Quadrat)?','2','4','1','0'],
 ['Ein Würfelnetz besteht aus wie vielen Quadraten?','6','4','8','5'],
 ['Ein Würfelgebäude hat 2 Schichten mit je 4 Würfeln. Wie viele Würfel sind es?','8','6','4','16']
];
const GEOEX={
 Würfel:'Ein Würfel hat <b>8 Ecken</b>, <b>12 Kanten</b> und <b>6 Flächen</b> (alles Quadrate).',
 Quader:'Ein Quader hat wie der Würfel 8 Ecken, 12 Kanten und 6 Flächen – aber die Flächen sind Rechtecke.',
 sym:'Achsensymmetrisch heißt: Faltest du die Figur in der Mitte, liegen beide Hälften genau aufeinander. Tipp: Halte einen Spiegel an die Mitte!'
};
function qGeo(g){
  const ex=/symmetr/i.test(g[0])?GEOEX.sym:/Würfel/.test(g[0])&&!/netz|gebäude/.test(g[0])?GEOEX.Würfel:/Quader/.test(g[0])?GEOEX.Quader:'';
  return {task:'Geometrie',prompt:g[0],options:g.slice(1,5),answer:g[1],
    explain:`Richtig ist <b>${g[1]}</b>.${ex?'<br>'+ex:''}${/netz/.test(g[0])?'<br>Ein Würfel hat 6 Flächen, darum hat sein Netz 6 Quadrate.':''}${/gebäude/.test(g[0])?'<br>2 · 4 = 8 Würfel.':''}`};
}
/* Zufall: [Frage, richtig, Optionen…, Erklärung] */
const ZUFALL=[
 ['Im Säckchen sind 8 rote und 2 blaue Kugeln. Welche Farbe ziehst du wahrscheinlich?','rot',['rot','blau','beide gleich wahrscheinlich'],'Es gibt viel mehr rote Kugeln. Rot ist <b>wahrscheinlicher</b>.'],
 ['Im Säckchen sind 5 rote und 5 blaue Kugeln. Welche Farbe ziehst du wahrscheinlich?','beide gleich wahrscheinlich',['rot','blau','beide gleich wahrscheinlich'],'Von beiden Farben gibt es gleich viele.'],
 ['Im Säckchen sind nur gelbe Kugeln. Du ziehst eine gelbe Kugel. Das ist …','sicher',['sicher','möglich','unmöglich'],'Es gibt nur gelbe Kugeln – es kommt <b>sicher</b> eine gelbe.'],
 ['Im Säckchen sind nur gelbe Kugeln. Du ziehst eine grüne Kugel. Das ist …','unmöglich',['sicher','möglich','unmöglich'],'Es ist keine grüne Kugel drin – das ist <b>unmöglich</b>.'],
 ['Du würfelst mit einem normalen Würfel eine 7. Das ist …','unmöglich',['sicher','möglich','unmöglich'],'Ein Würfel hat nur die Zahlen 1 bis 6.'],
 ['Du würfelst eine 6. Das ist …','möglich',['sicher','möglich','unmöglich'],'Die 6 kann kommen, muss aber nicht: <b>möglich</b>.'],
 ['Du würfelst eine Zahl kleiner als 7. Das ist …','sicher',['sicher','möglich','unmöglich'],'Alle Zahlen auf dem Würfel (1–6) sind kleiner als 7.'],
 ['Ein Glücksrad hat 6 Felder: 4 grün, 2 rot. Wo bleibt es wahrscheinlich stehen?','grün',['grün','rot','beide gleich wahrscheinlich'],'Grün hat mehr Felder, also ist grün <b>wahrscheinlicher</b>.'],
 ['Ein Glücksrad hat 4 Felder: 2 gelb, 2 blau. Wo bleibt es wahrscheinlich stehen?','beide gleich wahrscheinlich',['gelb','blau','beide gleich wahrscheinlich'],'Beide Farben haben gleich viele Felder.'],
 ['Du wirfst eine Münze. Kommt eher Kopf oder Zahl?','beide gleich wahrscheinlich',['Kopf','Zahl','beide gleich wahrscheinlich'],'Eine Münze hat zwei Seiten – beide sind gleich wahrscheinlich.']
];
function qZufall(z){return {task:'Zufall und Wahrscheinlichkeit',prompt:z[0],options:z[2],fixed:true,answer:z[1],explain:z[3]}}

/* ---------- Schreib-Fragen (Probetest): Ergebnis als Zahl eintippen ---------- */
const num=(q,task)=>({input:true,num:true,task:task||'Tippe das Ergebnis ein!',prompt:q.prompt,answer:q.answer,explain:q.explain,fill:q.fill});

/* ---------- Mascot: Maulwurf mit Grubenhelm ---------- */
const MOLE=`<svg viewBox="0 0 100 100" width="1em" height="1em" style="vertical-align:-.12em;overflow:visible" aria-hidden="true">
<ellipse cx="50" cy="64" rx="36" ry="31" fill="#57534e"/><ellipse cx="22" cy="88" rx="11" ry="7" fill="#f9a8d4"/><ellipse cx="78" cy="88" rx="11" ry="7" fill="#f9a8d4"/>
<ellipse cx="50" cy="72" rx="17" ry="13" fill="#d6c2b4"/><ellipse cx="50" cy="64" rx="8" ry="6" fill="#ec4899"/><ellipse cx="47.5" cy="62" rx="2.5" ry="1.6" fill="#fbcfe8"/>
<circle cx="37" cy="53" r="4" fill="#1c1917"/><circle cx="63" cy="53" r="4" fill="#1c1917"/><circle cx="38.3" cy="51.7" r="1.3" fill="#fff"/><circle cx="64.3" cy="51.7" r="1.3" fill="#fff"/>
<path d="M44 77 Q50 81 56 77" stroke="#78350f" stroke-width="2" fill="none" stroke-linecap="round"/>
<path d="M17 44 A33 30 0 0 1 83 44 Z" fill="#facc15"/><rect x="12" y="41" width="76" height="8" rx="4" fill="#eab308"/>
<circle cx="50" cy="27" r="8" fill="#fef9c3" stroke="#ca8a04" stroke-width="3"/></svg>`;

/* ---------- Registrieren ---------- */
LernApp.register({
  id:'mathe-maulwurf',          // nie ändern (Sterne und Abzeichen hängen daran)
  subject:'Mathe',
  title:'Mathe-Maulwurf',
  subtitle:'Klasse 3: Zahlen bis 1000, Einmaleins, schriftlich rechnen, Größen, Knobeln',
  icon:MOLE,
  mascot:MOLE,
  color:'#a16207',
  badgeTitle:'Maulwurf-Abzeichen',
  worlds:[
    {id:'zahlen',name:'Zahlen-Tunnel',icon:'🔢',color:'#0ea5e9',color2:'#38bdf8',topic:'Zahlen bis 1000: Stellenwerte, Nachbarn, Runden, Vergleichen',
     rules:'<b>H Z E</b> = Hunderter, Zehner, Einer: 347 = 3 H 4 Z 7 E<br><b>Runden:</b> 0–4 abrunden, 5–9 aufrunden (347 ≈ 350 ≈ 300)<br><b>&lt;</b> kleiner als · <b>&gt;</b> größer als – erst die Hunderter vergleichen',
     cats:()=>[STELLEN.map(x=>()=>qStelle(x)),NACHBAR.map(x=>()=>qNachbar(x)),MITTE.map(x=>()=>qMitte(x)),RUNDEN.map(x=>()=>qRunden(x)),VERGL.map(x=>()=>qVergl(x)),WORT.map(x=>()=>qWort(x))],
     write:()=>RUNDEN.map(x=>()=>num(qRunden(x))).concat(WORT.slice(0,15).map(x=>()=>num(qWort(x),'Schreibe die Zahl mit Ziffern!')))},
    {id:'kopf',name:'Kopfrechen-Höhle',icon:'🧠',color:'#16a34a',color2:'#22c55e',topic:'Plus und minus bis 1000, ergänzen, überschlagen',
     rules:'Zerlegen hilft: 346 + 238 = 346 + 200 + 30 + 8<br><b>Ergänzen:</b> 650 + ? = 1000 → 1000 − 650 = 350<br><b>Überschlagen:</b> beide Zahlen runden, dann rechnen: 398 + 207 ≈ 400 + 200 = 600',
     cats:()=>[PLUS.map(x=>()=>qKopf(x)),MINUS.map(x=>()=>qKopf(x)),ERG.map(x=>()=>qErg(x)),UEB.map(x=>()=>qUeb(x)),WEG.map(x=>()=>qWeg(x))],
     write:()=>PLUS.map(x=>()=>num(qKopf(x))).concat(MINUS.map(x=>()=>num(qKopf(x))),ERG.map(x=>()=>num(qErg(x))))},
    {id:'einmaleins',name:'Einmaleins-Mine',icon:'⛏️',color:'#d97706',color2:'#f59e0b',topic:'Mal und geteilt, Punkt vor Strich, große Zahlen',
     rules:'Geteilt ist die Umkehrung von mal: 56 : 7 = 8, weil 7 · 8 = 56<br><b>Punkt vor Strich:</b> erst · und :, dann + und −<br>Große Zahlen: 30 · 4 = 3 Z · 4 = 12 Z = 120<br>Zerlegen: 14 · 6 = 10 · 6 + 4 · 6',
     cats:()=>[MAL.map(x=>()=>qMal(x)),GETEILT.map(x=>()=>qGeteilt(x)),PLATZ.map(x=>()=>qPlatz(x)),PVS.map(x=>()=>qPvs(x)),GROSS.map(x=>()=>qGross(x)),HMAL.map(x=>()=>qHmal(x))],
     write:()=>MAL.map(x=>()=>num(qMal(x))).concat(GETEILT.map(x=>()=>num(qGeteilt(x))),PVS.map(x=>()=>num(qPvs(x))))},
    {id:'schriftlich',name:'Rechen-Werkstatt',icon:'🛠️',color:'#7c3aed',color2:'#a78bfa',topic:'Schriftlich addieren und subtrahieren',
     rules:'Stellengerecht untereinander schreiben: E unter E, Z unter Z, H unter H.<br>Von <b>rechts nach links</b> rechnen.<br>Plus: Übertrag klein in die nächste Spalte.<br>Minus: entbündeln, wenn es nicht reicht. Immer oben minus unten!<br>Probe: Ergebnis + untere Zahl = obere Zahl',
     cats:()=>[SADD.map(x=>()=>qSadd(x)),SSUB.map(x=>()=>qSsub(x)),ZIFFER.map(x=>()=>qZiffer(x))],
     write:()=>SADD.map(x=>()=>num(qSadd(x))).concat(SSUB.map(x=>()=>num(qSsub(x))))},
    {id:'groessen',name:'Größen-Lager',icon:'⚖️',color:'#db2777',color2:'#f472b6',topic:'Geld, Längen, Gewichte und Zeit',
     rules:'1 € = 100 ct · 3 € 5 ct = 3,05 €<br>1 km = 1000 m · 1 m = 100 cm · 1 cm = 10 mm<br>1 kg = 1000 g · ½ kg = 500 g<br>1 h = 60 min',
     cats:()=>[GELD.map(x=>()=>qGeld(x)),LAENGE.map(x=>()=>qLaenge(x)),GEWICHT.map(x=>()=>qGewicht(x)),ZEIT.map(x=>()=>qZeit(x)),VORST.map(x=>()=>qVorst(x))],
     write:()=>LAENGE.filter(x=>x[0]!==3).map(x=>()=>num(qLaenge(x),'Rechne um und tippe die Zahl ein!')).concat(ZEIT.filter(x=>x[0]===2).map(x=>()=>num(qZeit(x),'Rechne um und tippe die Zahl ein!')))},
    {id:'knobel',name:'Knobel-Kammer',icon:'🧩',color:'#0d9488',color2:'#2dd4bf',topic:'Zahlenmauern, Zahlenfolgen, Sachaufgaben, Geometrie, Zufall',
     rules:'<b>Zahlenmauer:</b> Jeder Stein ist die Summe der beiden darunter.<br><b>Sachaufgaben:</b> Lies genau, frag dich: Was ist gesucht? Dann rechnen und antworten.<br><b>Kombinationen:</b> 3 Shirts und 2 Hosen → 3 · 2 = 6<br><b>Würfel:</b> 8 Ecken, 12 Kanten, 6 Flächen',
     cats:()=>[MAUER.map(x=>()=>qMauer(x)),FOLGE.map(x=>()=>qFolge(x)),SACH.map(x=>()=>qSach(x)),KOMBI.map(x=>()=>qKombi(x)),GEO.map(x=>()=>qGeo(x)),ZUFALL.map(x=>()=>qZufall(x))],
     write:()=>MAUER.map(x=>()=>num(qMauer(x))).concat(FOLGE.map(x=>()=>num(qFolge(x))))}
  ],
  // Zum Start nur zwei Welten, dann alle zwei Tage eine neue (nach dem Grammatiktest am 20.11.)
  unlock:{chest:'2026-11-19',blitz:'2026-11-20',exam:'2026-11-22',gold:'2026-11-28',einmaleins:'2026-11-21',schriftlich:'2026-11-23',groessen:'2026-11-25',knobel:'2026-11-27'},
  boss:{name:'Der große Dachs',goldName:'Der goldene Dachs',icon:'🦡',color:'#44403c',color2:'#a8a29e',count:15,lives:3},
  // Eigene Abzeichen. test(c) siehe CLAUDE.md.
  badges:[
    {id:'erster',icon:'🕳️',name:'Erstes Loch',desc:'Eine Mathe-Welt geschafft',test:c=>c.kind==='world'&&c.stars>0},
    {id:'tunnel',icon:'🗺️',name:'Tunnelgräber',desc:'Alle 6 Mathe-Welten geschafft',test:c=>c.allWorlds},
    {id:'einmaleins',icon:'⛏️',name:'Einmaleins-Meister',desc:'3 Sterne in der Einmaleins-Mine',test:c=>c.starsIn('einmaleins')>=3},
    {id:'schriftlich',icon:'🛠️',name:'Rechen-Handwerker',desc:'3 Sterne in der Rechen-Werkstatt',test:c=>c.starsIn('schriftlich')>=3},
    {id:'knobel',icon:'🧩',name:'Knobel-Profi',desc:'3 Sterne in der Knobel-Kammer',test:c=>c.starsIn('knobel')>=3},
    {id:'serie15',icon:'🔥',name:'Rechen-Serie',desc:'15 Mathe-Aufgaben richtig am Stück',test:c=>c.streak>=15},
    {id:'blitz20',icon:'⚡',name:'Kopfrechen-Blitz',desc:'20 richtig in einer Mathe-Blitzrunde',test:c=>c.kind==='blitz'&&c.score>=20},
    {id:'r100',icon:'💯',name:'Hundert!',desc:'100 Mathe-Aufgaben richtig',test:c=>c.correct>=100},
    {id:'r1000',icon:'🧮',name:'Rechen-Maschine',desc:'1000 Mathe-Aufgaben richtig',test:c=>c.correct>=1000},
    {id:'dachs',icon:'🦡',name:'Dachs-Bezwinger',desc:'Den großen Dachs besiegt',test:c=>c.kind==='boss'&&c.won&&!c.gold},
    {id:'gold',icon:'🏆',name:'Goldener Maulwurf',desc:'Den goldenen Dachs besiegt',test:c=>c.kind==='boss'&&c.won&&c.gold},
    {id:'diamant',icon:'💎',name:'Diamant-Maulwurf',desc:'Alle Sterne im Mathe-Maulwurf',test:c=>c.allStars}
  ]
});
})();
