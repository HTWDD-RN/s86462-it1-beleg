// Network First SW from: https://gist.github.com/JMPerez/8ca8d5ffcc0cc45a8b4e1c279efd8a94

// the cache version gets updated every time there is a new deployment
const CACHE_VERSION = 10;
const CURRENT_CACHE = `Lernprog-PWA-${CACHE_VERSION}`;

// these are the routes we are going to cache for offline support
const filesToCache = [
    "src/",
    "src/Lernprogramm.css",
    "src/Lernprogramm.html",
    "src/Lernprogramm.js",
    "src/manifest.webmanifest",
    "src/questions.json",
    "images/",
    "images/back.jpg",
    "images/backfull.jpg",
    "images/general.png",
    "images/math.png",
    "images/notes.png",
    "images/wwm.png",
    "images/mc.png",
    "images/web.png",
    "images/icon.png",
    "images/icon_pwa_192.png",
    "images/icon_pwa_512.png",
    "scripts/",
    "scripts/abcjs/abcjs-basic-min.js",
    "scripts/katex/katex.min.js",
    "scripts/katex/katex.min.css",
    "scripts/katex/contrib/auto-render.min.js",
    // KaTeX fonts (only .woff2 for compactness)
    "scripts/katex/fonts/KaTeX_AMS-Regular.woff2",
    "scripts/katex/fonts/KaTeX_Caligraphic-Bold.woff2",
    "scripts/katex/fonts/KaTeX_Caligraphic-Regular.woff2",
    "scripts/katex/fonts/KaTeX_Fraktur-Bold.woff2",
    "scripts/katex/fonts/KaTeX_Fraktur-Regular.woff2",
    "scripts/katex/fonts/KaTeX_Main-Bold.woff2",
    "scripts/katex/fonts/KaTeX_Main-BoldItalic.woff2",
    "scripts/katex/fonts/KaTeX_Main-Italic.woff2",
    "scripts/katex/fonts/KaTeX_Main-Regular.woff2",
    "scripts/katex/fonts/KaTeX_Math-BoldItalic.woff2",
    "scripts/katex/fonts/KaTeX_Math-Italic.woff2",
    "scripts/katex/fonts/KaTeX_SansSerif-Bold.woff2",
    "scripts/katex/fonts/KaTeX_SansSerif-Italic.woff2",
    "scripts/katex/fonts/KaTeX_SansSerif-Regular.woff2",
    "scripts/katex/fonts/KaTeX_Script-Regular.woff2",
    "scripts/katex/fonts/KaTeX_Size1-Regular.woff2",
    "scripts/katex/fonts/KaTeX_Size2-Regular.woff2",
    "scripts/katex/fonts/KaTeX_Size3-Regular.woff2",
    "scripts/katex/fonts/KaTeX_Size4-Regular.woff2",
    "scripts/katex/fonts/KaTeX_Typewriter-Regular.woff2"
];


// on activation we clean up the previously registered service workers
self.addEventListener('activate', evt =>
  evt.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CURRENT_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  )
);

// on install we download the routes we want to cache for offline
self.addEventListener('install', evt =>
  evt.waitUntil(
    caches.open(CURRENT_CACHE).then(cache => {
      return cache.addAll(filesToCache);
    })
  )
);

// fetch the resource from the network
const fromNetwork = (request, timeout) =>
  new Promise((fulfill, reject) => {
    const timeoutId = setTimeout(reject, timeout);
    fetch(request).then(response => {
      clearTimeout(timeoutId);
      fulfill(response);
      update(request);
    }, reject);
  });

// fetch the resource from the browser cache
const fromCache = request =>
  caches
    .open(CURRENT_CACHE)
    .then(cache =>
      cache
        .match(request)
        .then(matching => matching || cache.match('/offline/'))
    );

// cache the current page to make it available for offline
const update = request =>
  caches
    .open(CURRENT_CACHE)
    .then(cache =>
      fetch(request).then(response => cache.put(request, response))
    );

// general strategy when making a request (eg if online try to fetch it
// from the network with a timeout, if something fails serve from cache)
self.addEventListener('fetch', evt => {
  // custom Timeout for specific things to speed up loading
  const url = evt.request.url;
  if (url.startsWith('./questions.json')) {
    evt.respondWith(
      fromNetwork(evt.request, 2000).catch(() => fromCache(evt.request))
    );
    evt.waitUntil(update(evt.request));
    return;
  }

  if (url.startsWith('https://idefix.informatik.htw-dresden.de:8888/api/quizzes/')) {
    evt.respondWith(
      fromNetwork(evt.request, 5000).catch(() => fromCache(evt.request))
    );
    evt.waitUntil(update(evt.request));
    return;
  }
  
  // everything else
  evt.respondWith(
    fromNetwork(evt.request, 500).catch(() => fromCache(evt.request))
  );
  evt.waitUntil(update(evt.request));
});
