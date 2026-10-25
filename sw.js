/* 罗舜学习工作台 · 离线 Service Worker
   作用：首次访问（http/https 环境）后缓存核心文件，之后断网也能打开工作台。
   注意：file:// 双击打开时浏览器不允许注册 SW，需通过本地服务器或托管访问才生效。
*/
const CACHE = "luoshun-wb-v1";
const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  // 核心文件：缓存优先，保证离线可用
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy).catch(() => {}));
          return res;
        })
        .catch(() => caches.match("./罗舜_学习工作台.html"));
    })
  );
});
