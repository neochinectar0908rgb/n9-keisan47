/* =========================================================
   Service Worker
   - 必要なファイルをキャッシュしてオフライン動作を可能にする
   - キャッシュ名にバージョンを付け、更新時に古いものを削除する
   ※ ファイルを更新したら CACHE_NAME の "v3" を v4, v5… と上げてください
   ========================================================= */

var CACHE_NAME = "suushiki-tool-v3";

// キャッシュするファイル（すべて相対パス：サブディレクトリ公開に対応）
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png"
];

// インストール：必要ファイルを先読みキャッシュ
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting(); // すぐに新バージョンへ切り替え
    })
  );
});

// 有効化：古いバージョンのキャッシュを削除
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE_NAME) {
            return caches.delete(key); // 古いキャッシュを残さない
          }
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// 取得：キャッシュ優先、無ければネットワーク
self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return; // GET 以外はそのまま

  event.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached; // キャッシュにあれば即返す（高速・オフライン可）

      return fetch(req).then(function (res) {
        return res;
      }).catch(function () {
        // オフラインでページ遷移する場合は index.html を返す
        if (req.mode === "navigate") {
          return caches.match("./index.html");
        }
      });
    })
  );
});
