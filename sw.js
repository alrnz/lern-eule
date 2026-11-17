/* Service Worker: macht die App offline-fähig.
 * Strategie: eigene Dateien "network first" (online immer aktuell, offline aus dem Cache),
 * Google Fonts "cache first".
 * Bei jedem Deploy VERSION erhöhen, dann laden offene Apps die neuen Inhalte von selbst (nicht mitten im Quiz).
 */
const VERSION='2026-11-17-13';
const CACHE='lern-eule-'+VERSION;
const SHELL=['./','index.html','css/app.css','js/app.js','modules/index.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.indexOf('lern-eule-')===0&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin===location.origin){
    // no-cache: immer beim Server nachfragen (304 ist billig), sonst hält der Browser-Cache Updates bis zu 10 Min. zurück
    e.respondWith(fetch(req.url,{cache:'no-cache',credentials:'same-origin'}).then(res=>{
      if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}
      return res;
    }).catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match('index.html'))));
  }else if(url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com'){
    e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));return res})));
  }
});
