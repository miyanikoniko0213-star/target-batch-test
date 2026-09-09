// ========================================
// Service Worker - 受験英単語 Ver.8.2.0
//
// 【役割】
// HTML・manifest・アイコンを端末側へキャッシュし、
// 地下鉄・飛行機など通信できない環境でもアプリを起動できるようにする。
//
// 【設計方針】
// ・画面遷移(HTML)はオンライン時に最新版を確認し、失敗時はキャッシュへフォールバック。
// ・静的ファイルはキャッシュを優先して高速に返す。
// ・学習履歴はService Workerではなく、アプリ側のlocalStorageが担当する。
// ========================================
const CACHE_NAME='jukeneitango-v8.2.0';
const APP_SHELL=['./','./index.html','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;

  if(event.request.mode==='navigate'){
    event.respondWith(
      fetch(event.request)
        .then(response=>{
          const copy=response.clone();
          caches.open(CACHE_NAME).then(cache=>cache.put('./index.html',copy));
          return response;
        })
        .catch(()=>caches.match('./index.html').then(r=>r||caches.match('./')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy))}
      return response;
    }))
  );
});

self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
});
