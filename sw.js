/* Service worker per Sartoria · Social Studio
   Opzionale: serve solo per far funzionare l'app anche senza connessione.
   Va caricato su GitHub Pages INSIEME al file HTML, nella stessa cartella.
   Senza questo file l'app funziona comunque, ma richiede connessione. */

const CACHE_NOME = 'sartoria-studio-v1';
const FILE_DA_SALVARE = [
  './',
  './sartoria-social-studio.html'
];

// Installazione: salva i file in cache
self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NOME).then((cache) => cache.addAll(FILE_DA_SALVARE))
  );
  self.skipWaiting();
});

// Attivazione: pulisce le vecchie cache
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((nomi) =>
      Promise.all(
        nomi.filter((n) => n !== CACHE_NOME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

// Richieste: prima prova la rete, se non c'è usa la cache.
// Le chiamate all'API Gemini passano sempre dalla rete (non vanno mai in cache).
self.addEventListener('fetch', (evento) => {
  const url = evento.request.url;

  // Non intercettare mai le chiamate alle API esterne
  if (url.includes('generativelanguage.googleapis.com') ||
      url.includes('googleapis.com') ||
      url.includes('gstatic.com')) {
    return; // lascia passare normalmente alla rete
  }

  evento.respondWith(
    fetch(evento.request)
      .then((risposta) => {
        // aggiorna la cache con la versione fresca
        const copia = risposta.clone();
        caches.open(CACHE_NOME).then((cache) => {
          cache.put(evento.request, copia).catch(() => {});
        });
        return risposta;
      })
      .catch(() => caches.match(evento.request))
  );
});
