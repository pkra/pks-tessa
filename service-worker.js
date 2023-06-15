'use strict'
const cacheVersion = "v1.0.2";
const cachedResources = [
    '/',
    'index.html',
    'index.js',
    'styles.css',
    'tesseract-core-simd.wasm.js',
    'tesseract.min.js',
    'worker.min.js',
    // 'deu.traineddata.gz', //crashes serviceworker registration on Chrome; but tesseract will cache the file if we run 1 test on the network
];

const addResourcesToCache = async (resources) => {
    const cache = await caches.open(cacheVersion);
    await cache.addAll(resources);
};

const putInCache = async (request, response) => {
    const cache = await caches.open(cacheVersion);
    try {
        await cache.put(request, response);
    } catch (e) { }
};

const cacheFirst = async (request) => {
    // First try to get the resource from the cache
    const responseFromCache = await caches.match(request);
    if (responseFromCache) {
        return responseFromCache;
    }

    // Next try to get the resource from the network
    try {
        const responseFromNetwork = await fetch(request);
        // response may be used only once
        // we need to save clone to put one copy in cache
        // and serve second one
        putInCache(request, responseFromNetwork.clone());
        return responseFromNetwork;
    } catch (error) {
        // we must always return a Response object
        return new Response("Network error happened", {
            status: 408,
            headers: { "Content-Type": "text/plain" },
        });
    }
};

const deleteCache = async key => {
    await caches.delete(key)
}
const deleteOldCaches = async () => {
    const cacheKeepList = [cacheVersion];
    const keyList = await caches.keys()
    const cachesToDelete = keyList.filter(key => !cacheKeepList.includes(key))
    await Promise.all(cachesToDelete.map(deleteCache));
}

self.addEventListener("activate", (event) => {
    event.waitUntil(deleteOldCaches());
});

self.addEventListener("install", (event) => {
    event.waitUntil(
        addResourcesToCache(cachedResources)
    );
    self.skipWaiting();
});


self.addEventListener("fetch", (event) => {
    event.respondWith(
        cacheFirst(event.request)
    );
});
