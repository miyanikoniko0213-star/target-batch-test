const CACHE_NAME='jukeneitango-v8.0.1';
const CORE_FILES=['./','./index.html','./manifest.webmanifest'];
const OPTIONAL_FILES=['./icon-180.png','./icon-192.png','./icon-512.png'];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await cache.addAll(CORE_FILES);
    await Promise.allSettled(OPTIONAL_FILES.map(file=>cache.add(file)));
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME&&k.startsWith('jukeneitango-')).map(k=>caches.delete(k)))),
    self.clients.claim()
  ]));
});

self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;

  if(event.request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const response=await fetch(event.request,{cache:'no-store'});
        if(response.ok){
          const cache=await caches.open(CACHE_NAME);
          await cache.put('./index.html',response.clone());
        }
        return response;
      }catch{
        return (await caches.match('./index.html')) || (await caches.match('./'));
      }
    })());
    return;
  }

  event.respondWith((async()=>{
    const cached=await caches.match(event.request);
    if(cached)return cached;
    const response=await fetch(event.request);
    if(response.ok){
      const cache=await caches.open(CACHE_NAME);
      await cache.put(event.request,response.clone());
    }
    return response;
  })());
});
