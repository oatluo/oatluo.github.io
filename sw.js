/* 罗舜学习工作台 · 离线 Service Worker
   作用：首次访问（http/https 环境）后缓存核心文件，之后断网也能打开工作台。
   注意：file:// 双击打开时浏览器不允许注册 SW，需通过本地服务器或托管访问才生效。

   更新策略（v2 起）：
   - 页面导航（HTML）：网络优先，离线才回落缓存 → 内容更新即时生效，不会再被旧缓存锁死。
   - 其他核心资源：缓存优先，保证离线可用；版本号变更时激活阶段自动清掉旧缓存。
   - 每次改版必须把 CACHE 版本号 +1（v1→v2→v3…），否则老用户拿不到更新。
*/
const CACHE = "luoshun-wb-v2";
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

  // 页面导航：网络优先，离线回落缓存
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy).catch(() => {}));
          return res;
        })
        .catch(() =>
          caches.match(req).then((hit) => hit || caches.match("./index.html"))
        )
    );
    return;
  }

  // 其他核心资源：缓存优先，保证离线可用
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy).catch(() => {}));
        return res;
      });
    })
  );
});
