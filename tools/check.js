/* Prüft alle Lernpakete: node tools/check.js
 * Erzeugt jede mögliche Frage und meldet Fehler (Antwort fehlt in Optionen, doppelte Optionen …).
 */
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.join(__dirname,'..');
const el=()=>({getContext:()=>({setTransform(){},clearRect(){}}),classList:{add(){},remove(){},toggle(){}},style:{},getBoundingClientRect:()=>({}),appendChild(){}});
let files=[];
const ctx={console,setTimeout,location:{hash:'',protocol:'file:'},navigator:{},innerWidth:800,innerHeight:600,devicePixelRatio:1,
  addEventListener(){},scrollTo(){},requestAnimationFrame(){},localStorage:{getItem:()=>null,setItem(){}},
  document:{querySelector:el,querySelectorAll:()=>[],createElement:el,body:el()}};
ctx.window=ctx;vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'js/app.js'),'utf8'),ctx);
ctx.LernApp.loadModules=f=>{files=f};
vm.runInContext(fs.readFileSync(path.join(root,'modules/index.js'),'utf8'),ctx);
files.forEach(f=>vm.runInContext(fs.readFileSync(path.join(root,'modules',f),'utf8'),ctx,{filename:f}));

let errors=0,total=0;
const err=(m,w,msg,q)=>{errors++;console.log(`✗ ${m.id}/${w.id}: ${msg}`,q?JSON.stringify(q.options)+' → '+q.answer:'')};
if(ctx.LernApp.modules.length!==files.length)console.log(`✗ ${files.length} Dateien, aber ${ctx.LernApp.modules.length} Lernpakete registriert`),errors++;
ctx.LernApp.modules.forEach(m=>{
  if(m.date&&!/^\d{4}-\d{2}-\d{2}$/.test(m.date))err(m,{id:'-'},'date muss JJJJ-MM-TT sein');
  const ids=m.worlds.map(w=>w.id);if(new Set(ids).size!==ids.length)err(m,{id:'-'},'doppelte Welt-IDs');
  let n=0;
  m.worlds.forEach(w=>{
    if(w.id==='boss')err(m,w,'"boss" ist als Welt-ID reserviert');
    const cats=w.cats();
    if(!cats.length||cats.some(c=>!c.length))err(m,w,'leere Kategorie');
    cats.forEach(c=>c.forEach(f=>{
      for(let r=0;r<5;r++){ // mehrfach, weil Fragen zufällige Teile haben können
        const q=f();n++;
        if(!q.prompt||!Array.isArray(q.options))return err(m,w,'prompt/options fehlt',q);
        if(q.options.indexOf(q.answer)<0)return err(m,w,'Antwort nicht in Optionen',q);
        if(new Set(q.options).size!==q.options.length)return err(m,w,'doppelte Optionen',q);
        if(q.options.length<2||q.options.length>9)return err(m,w,'2–9 Optionen nötig',q);
      }
    }));
  });
  total+=n;console.log(`✓ ${m.id}: ${m.worlds.length} Welten, ${n/5} Fragen`);
});
console.log(errors?`\n${errors} Fehler gefunden`:'\nAlles in Ordnung ✨');
process.exit(errors?1:0);
