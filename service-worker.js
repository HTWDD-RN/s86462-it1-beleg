// Service Worker

const cacheName = "Lernprog-PWA1";
const filesToCache = [
    "src/",
    "src/Lernprogramm.css",
    "src/Lernprogramm.html",
    "src/Lernprogramm.js",
    "src/manifest.webmanifest",
    "src/questions.json",
    "images/back.jpg",
    "images/backfull.jpg",
    "images/general.png",
    "images/math.png",
    "images/notes.png",
    "images/WwM.png",
    "images/mc.png",
    "images/web.png",
    "images/icon.png",
    "images/icon_pwa_192.png",
    "images/icon_pwa_512.png",
    "scripts/abcjs/abcjs-basic-min.js",
    "scripts/katex/katex.min.js",
    "scripts/katex/katex.min.css",
    "scripts/katex/contrib/auto-render.min.js",
    // KaTeX fonts (nur .woff2 für Kompaktheit)
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

// Warte bis SW installiert
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(cacheName).then(function(cache) {
            return cache.addAll(filesToCache);
        })
    );
});


self.addEventListener('fetch', event => event.respondWith(
    caches.open(cacheName)
        .then(cache => cache.match(event.request)) // falls im Cache davon laden
        .then(response => response || fetch(event.request))
));

/*
self.addEventListener('fetch', event => event.respondWith(
    fetch(event.request).then(res => caches.open(cacheName).then(c => { c.put(event.request, res.clone()); return res; }))
    .catch(() => caches.match(event.request))
  ));
*/