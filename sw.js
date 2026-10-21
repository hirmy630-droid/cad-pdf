/* CAD PDF scoped, revision-consistent offline assets. Updates activate after all app windows close. */
const BUILD = "0571bb353405";
const BASE = new URL(self.registration.scope);
const PREFIX = 'cad-pdf-' + encodeURIComponent(BASE.pathname) + '-';
const CACHE = PREFIX + BUILD;
const FILES = ["index.html", "style.css", "app.js", "manifest.json", "vendor/NotoSansCJKjp-Regular.otf", "vendor/NotoSansJP.ttf", "vendor/ezjww_wasm_bg.wasm", "vendor/jww.js", "vendor/pdfjs/cmaps.json", "vendor/pdfjs/iccs/CGATS001Compat-v2-micro.icc", "vendor/pdfjs/pdf.min.mjs", "vendor/pdfjs/pdf.worker.min.mjs", "vendor/pdfjs/standard_fonts/FoxitDingbats.pfb", "vendor/pdfjs/standard_fonts/FoxitFixed.pfb", "vendor/pdfjs/standard_fonts/FoxitFixedBold.pfb", "vendor/pdfjs/standard_fonts/FoxitFixedBoldItalic.pfb", "vendor/pdfjs/standard_fonts/FoxitFixedItalic.pfb", "vendor/pdfjs/standard_fonts/FoxitSerif.pfb", "vendor/pdfjs/standard_fonts/FoxitSerifBold.pfb", "vendor/pdfjs/standard_fonts/FoxitSerifBoldItalic.pfb", "vendor/pdfjs/standard_fonts/FoxitSerifItalic.pfb", "vendor/pdfjs/standard_fonts/FoxitSymbol.pfb", "vendor/pdfjs/standard_fonts/LiberationSans-Bold.ttf", "vendor/pdfjs/standard_fonts/LiberationSans-BoldItalic.ttf", "vendor/pdfjs/standard_fonts/LiberationSans-Italic.ttf", "vendor/pdfjs/standard_fonts/LiberationSans-Regular.ttf", "vendor/pdfjs/wasm/jbig2.wasm", "vendor/pdfjs/wasm/jbig2_nowasm_fallback.js", "vendor/pdfjs/wasm/openjpeg.wasm", "vendor/pdfjs/wasm/openjpeg_nowasm_fallback.js", "vendor/pdfjs/wasm/qcms_bg.wasm", "vendor/pdfjs/wasm/quickjs-eval.js", "vendor/pdfjs/wasm/quickjs-eval.wasm"];
const URLS = FILES.map(path => new URL(path, BASE).href);
const INDEX = new URL('index.html',BASE).href;
self.addEventListener('install', event => {
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    try {
      const fetched=await Promise.all(URLS.map(async url=>{
        const response=await fetch(new Request(url,{cache:'reload'}));
        if(!response.ok)throw new Error('Missing app asset');
        return [url,response];
      }));
      for(const [url,response] of fetched)await cache.put(url,response);
    } catch(error) { await caches.delete(CACHE); throw error; }
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    for(const key of keys)if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==BASE.origin)return;
  const isIndex=(url.pathname===BASE.pathname||url.pathname===new URL(INDEX).pathname);
  if(request.mode==='navigate'){
    if(!isIndex)return;
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      try{
        const response=await fetch(new Request(request,{cache:'no-store'}));
        if(!response.ok)return response;
        const html=await response.clone().text();
        // Keep this release coherent while a complete newer release waits for app windows to close.
        if(!html.includes('name="cad-build" content="'+BUILD+'"'))return (await cache.match(INDEX))||response;
        await cache.put(INDEX,response.clone());return response;
      }catch(error){return (await cache.match(INDEX))||Response.error();}
    })());return;
  }
  if(url.search||!URLS.includes(url.href))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    return (await cache.match(url.href))||fetch(request);
  })());
});
