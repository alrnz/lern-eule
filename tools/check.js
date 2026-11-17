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
files.forEach(f=>vm.runInContext(fs.readFileSync(path.join(root,'modules',f),'utf8'),ctx,{filename:f}));

let errors=0,total=0;
const err=(m,w,msg,q)=>{errors++;console.log(`✗ ${m.id}/${w.id}: ${msg}`,q?JSON.stringify(q.options)+' → '+q.answer:'')};
if(ctx.LernApp.modules.length!==files.length)console.log(`✗ ${files.length} Dateien, aber ${ctx.LernApp.modules.length} Lernpakete registriert`),errors++;
const I=ctx.LernApp._internals;
const RESERVED=['boss','gold','exam','chest','blitz'];
ctx.LernApp.modules.forEach(m=>{
  if(m.date&&!/^\d{4}-\d{2}-\d{2}$/.test(m.date))err(m,{id:'-'},'date muss JJJJ-MM-TT sein');
  if(!/^[a-z0-9-]+$/.test(m.id))err(m,{id:'-'},'id nur a-z 0-9 -');
  if(m.unlock)Object.keys(m.unlock).forEach(k=>{if(['chest','blitz','gold','exam'].indexOf(k)<0)err(m,{id:'-'},'unlock: unbekannte Mission '+k);if(!/^\d{4}-\d{2}-\d{2}$/.test(m.unlock[k]))err(m,{id:'-'},'unlock-Datum JJJJ-MM-TT: '+k)});
  const ids=m.worlds.map(w=>w.id);if(new Set(ids).size!==ids.length)err(m,{id:'-'},'doppelte Welt-IDs');
  let n=0,nw=0;
  m.worlds.forEach(w=>{
    if(RESERVED.indexOf(w.id)>=0)err(m,w,`"${w.id}" ist als Welt-ID reserviert`);
    if(w.id.indexOf(':')>=0)err(m,w,'Welt-ID darf kein ":" enthalten');
    const cats=w.cats();
    if(!cats.length||cats.some(c=>!c.length))err(m,w,'leere Kategorie');
    const check=(f,write)=>{
      for(let r=0;r<5;r++){ // mehrfach, weil Fragen zufällige Teile haben können
        const q=f();
        if(!q.prompt)return err(m,w,'prompt fehlt',q);
        if(write||q.input){
          if(!q.input)return err(m,w,'Schreib-Frage braucht input:true',q);
          if(typeof q.answer!=='string'||!q.answer.trim())return err(m,w,'answer fehlt',q);
          if(q.accept&&q.accept.indexOf(q.answer)<0)return err(m,w,'accept muss answer enthalten',q);
        }else{
          if(!Array.isArray(q.options))return err(m,w,'options fehlt',q);
          if(q.options.indexOf(q.answer)<0)return err(m,w,'Antwort nicht in Optionen',q);
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
  total+=n;console.log(`✓ ${m.id}: ${m.worlds.length} Welten, ${n} Auswahl-Fragen, ${nw} Schreib-Fragen`);
});
console.log(errors?`\n${errors} Fehler gefunden`:'\nAlles in Ordnung ✨');
process.exit(errors?1:0);
