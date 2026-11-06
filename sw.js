// 숭의 전시 웹앱 오프라인 저장: 인식 모델·라이브러리(vendor/, models/, 같은 파일의 CDN 사본)는 한 번 받으면 저장해 두고 다시 받지 않는다.
// index.html은 늘 새로 받아 오고(업데이트가 바로 보이게), 인터넷이 끊기거나 사이트가 오류를 낼 때만 저장해 둔 것을 쓴다.
const C = 'gyeol-v1'; // 같은 이름의 파일을 바꿔 올릴 때는 숫자를 올린다 (예전 저장분을 버림)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const u = new URL(req.url), same = u.origin === self.location.origin;
  const heavy = (same && /\/(vendor|models)\//.test(u.pathname)) || /storage\.googleapis\.com\/mediapipe-models\/|cdn\.jsdelivr\.net\/npm\/(@mediapipe|@dimforge|peerjs|qrcode)|fonts\.(googleapis|gstatic)\.com\//.test(u.href);
  if (heavy) {
    e.respondWith(caches.open(C).then(async c => { const hit = await c.match(req); if (hit) return hit; const r = await fetch(req); if (r.ok || (r.type === 'opaque' && /fonts\.googleapis\.com/.test(u.host))) c.put(req, r.clone()); return r; }));
    return;
  }
  if (same && (u.pathname.endsWith('/') || u.pathname.endsWith('.html'))) {
    // 사이트가 잠깐 404·오류를 내거나(GitHub 배포 중 문제 등) 인터넷이 끊기면, 마지막으로 잘 열렸던 화면을 쓴다
    e.respondWith(fetch(req).then(async r => { if (r.ok) { const cl = r.clone(); caches.open(C).then(c => c.put(req, cl)); return r; } return (await caches.match(req)) || (await caches.match(new URL('./', self.registration.scope).href)) || r; })
      .catch(async () => (await caches.match(req)) || (await caches.match(new URL('./', self.registration.scope).href))));
  }
});
