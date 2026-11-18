/* Prüft alle Lernpakete: node tools/check.js
 * Erzeugt jede mögliche Frage und meldet Fehler (Antwort fehlt in Optionen, doppelte Optionen …).
 */
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.join(__dirname,'..');
const el=()=>({getContext:()=>({setTransform(){},clearRect(){}}),classList:{add(){},remove(){},toggle(){}},style:{},getBoundingClientRect:()=>({}),appendChild(){}});
let files=[];
const ctx={console,setTimeout,location:{hash:'',protocol:'file:'},navigator:{},innerWidth:800,innerHeight:600,devicePixelRatio:1,
  addEventListener(){},scrollTo(){},requestAnimationFrame(){},localStorage:{getItem:()=>null,setItem(){}},
  document:{addEventListener(){},querySelector:el,querySelectorAll:()=>[],createElement:el,body:el()}};
ctx.window=ctx;vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'js/app.js'),'utf8'),ctx);
ctx.LernApp.loadModules=f=>{files=f};
vm.runInContext(fs.readFileSync(path.join(root,'modules/index.js'),'utf8'),ctx);
const empty=[];
files.forEach(f=>{const before=ctx.LernApp.modules.length;vm.runInContext(fs.readFileSync(path.join(root,'modules',f),'utf8'),ctx,{filename:f});
  if(ctx.LernApp.modules.length===before)empty.push(f);});

let errors=0,total=0;
const err=(m,w,msg,q)=>{errors++;console.log(`✗ ${m.id}/${w.id}: ${msg}`,q?JSON.stringify(q.options)+' → '+q.answer:'')};
// Eine Datei darf mehrere Lernpakete registrieren (z. B. eins pro Lernwörter-Woche), aber nicht keins.
empty.forEach(f=>{console.log(`✗ ${f}: kein Lernpaket registriert`);errors++});
const I=ctx.LernApp._internals;
const RESERVED=['boss','gold','exam','chest','blitz'];
ctx.LernApp.modules.forEach(m=>{
  if(m.date&&!/^\d{4}-\d{2}-\d{2}$/.test(m.date))err(m,{id:'-'},'date muss JJJJ-MM-TT sein');
  if(!/^[a-z0-9-]+$/.test(m.id))err(m,{id:'-'},'id nur a-z 0-9 -');
  const all=m.worlds.concat(m.missions||[]);
  if(m.closed)m.closed.forEach(k=>{if(['chest','blitz','gold','exam'].concat(all.map(x=>x.id)).indexOf(k)<0)err(m,{id:'-'},'closed: unbekannte Welt/Mission '+k)});
  if(m.unlock)Object.keys(m.unlock).forEach(k=>{if(['chest','blitz','gold','exam'].concat(all.map(x=>x.id)).indexOf(k)<0)err(m,{id:'-'},'unlock: unbekannte Welt/Mission '+k);if(!/^\d{4}-\d{2}-\d{2}$/.test(m.unlock[k]))err(m,{id:'-'},'unlock-Datum JJJJ-MM-TT: '+k)});
  if(!m.badges||!m.badges.length)err(m,{id:'-'},'jedes Lernpaket braucht eigene Abzeichen (badges)');
  // test(c) einmal mit Beispielwerten aufrufen: findet Tippfehler in Welt-IDs (starsIn) und Programmfehler
  if(m.badges){const wids=all.map(w=>w.id).concat(['boss','gold','exam']);
    const fake={kind:'world',world:all[0].id,stars:3,won:true,gold:false,streak:5,score:10,correct:10,allWorlds:false,allStars:false,blitzRecord:0,
      starsIn:id=>{if(wids.indexOf(id)<0)throw new Error('unbekannte Welt-ID in starsIn: '+id);return 0}};
    m.badges.forEach(b=>{try{if(typeof b.test==='function')b.test(fake)}catch(e){err(m,{id:'-'},'Abzeichen '+b.id+': '+e.message)}});}
  if(m.badges){const bi=m.badges.map(b=>b.id);if(new Set(bi).size!==bi.length)err(m,{id:'-'},'doppelte Abzeichen-IDs');
    m.badges.forEach(b=>{if(!/^[a-z0-9-]+$/.test(b.id||''))err(m,{id:'-'},'Abzeichen-ID nur a-z 0-9 -: '+b.id);if(!b.icon||!b.name||!b.desc)err(m,{id:'-'},'Abzeichen braucht icon, name, desc: '+b.id);if(typeof b.test!=='function')err(m,{id:'-'},'Abzeichen braucht test(c): '+b.id)});}
  const ids=all.map(w=>w.id);if(new Set(ids).size!==ids.length)err(m,{id:'-'},'doppelte Welt-IDs');
  let n=0,nw=0;
  all.forEach(w=>{
    if(RESERVED.indexOf(w.id)>=0)err(m,w,`"${w.id}" ist als Welt-ID reserviert`);
    if(w.id.indexOf(':')>=0)err(m,w,'Welt-ID darf kein ":" enthalten');
    const cats=w.cats();
    if(!cats.length||cats.some(c=>!c.length))err(m,w,'leere Kategorie');
    const check=(f,write)=>{
      for(let r=0;r<5;r++){ // mehrfach, weil Fragen zufällige Teile haben können
        const q=f();
        if(!q.prompt&&!q.say&&!q.spot)return err(m,w,'prompt fehlt',q);
        if(q.say&&!q.input)return err(m,w,'say nur bei Schreib-Fragen (input:true)',q);
        if(q.spot){
          const t=q.spot.tokens,n=t.filter(x=>x.fix).length;
          if(!Array.isArray(t)||!t.length)return err(m,w,'spot.tokens fehlt',q);
          if(!n||n!==q.spot.n)return err(m,w,`spot.n (${q.spot.n}) passt nicht zu ${n} Fehlern`,q);
          if(t.some(x=>!x.t||x.fix===x.t))return err(m,w,'spot: leeres Wort oder Fehler gleich Korrektur',q);
          if(typeof q.answer!=='string')return err(m,w,'answer fehlt',q);
        }else if(write||q.input){
          if(!q.input)return err(m,w,'Schreib-Frage braucht input:true',q);
          if(typeof q.answer!=='string'||!q.answer.trim())return err(m,w,'answer fehlt',q);
          if(q.accept&&q.accept.indexOf(q.answer)<0)return err(m,w,'accept muss answer enthalten',q);
        }else{
          if(!Array.isArray(q.options))return err(m,w,'options fehlt',q);
          if(q.options.indexOf(q.answer)<0)return err(m,w,'Antwort nicht in Optionen',q);
          if(q.options.some(o=>typeof o!=='string'))return err(m,w,'Optionen müssen Text sein',q);
          if(new Set(q.options).size!==q.options.length)return err(m,w,'doppelte Optionen',q);
          if(q.options.length<2||q.options.length>9)return err(m,w,'2–9 Optionen nötig',q);
        }
      }
    };
    cats.forEach(c=>c.forEach(f=>{check(f,false);n++}));
    if(w.write)w.write().forEach(f=>{check(f,true);nw++});
    // Schatzkisten-Schlüssel müssen die gleiche Frage wiederfinden
    I.pool(w).concat([I.writePool(w)]).forEach(c=>c.forEach(f=>{const q=f(),g=I.byKey(m,q.key);
      if(!g)return err(m,w,'Schlüssel nicht auflösbar: '+q.key);
      if(g().prompt.replace(/class="st gap"/,'')!==q.prompt.replace(/class="st gap"/,'')&&g().answer!==q.answer)err(m,w,'Schlüssel liefert andere Frage: '+q.key)}));
  });
  total+=n;console.log(`✓ ${m.id}: ${m.worlds.length} Welten, ${(m.missions||[]).length} Missionen, ${n} Fragen, ${nw} Schreib-Fragen${m.badges?', '+m.badges.length+' eigene Abzeichen':''}`);
});
console.log(errors?`\n${errors} Fehler gefunden`:'\nAlles in Ordnung ✨');
process.exit(errors?1:0);
