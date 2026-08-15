/* Подставляет фото и галерею из content/site.json (меняются через админке) */
(function () {
  'use strict';
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  /* Учитывает хостинг в подпапке (GitHub Pages): "/assets/..." -> "<текущая папка>/assets/..." */
  function fixUrl(u) {
    if (!u) return u;
    if (u.charAt(0) === '/' && u.charAt(1) !== '/') {
      var base = location.pathname.replace(/[^/]*$/, '');
      return base + u.slice(1);
    }
    return u;
  }
  function set(el, url) {
    if (!url) return;
    if (typeof el === 'string') el = document.querySelector(el);
    if (!el) return;
    el.removeAttribute('srcset'); el.removeAttribute('sizes');
    el.src = fixUrl(url);
  }
  fetch('content/site.json', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .catch(function () { return null; })
    .then(function (d) {
      if (!d) return;
      var P = d.photos || {};
      set('.hero-visual .photo-frame img', P.hero);
      set('.about-photo .photo-frame img', P.about);
      set('.video-frame img', P.showreel);
      var f = document.querySelectorAll('.fcard.ph img');
      if (f[0]) set(f[0], P.format1);
      if (f[1]) set(f[1], P.format2);
      var g = d.gallery, box = document.querySelector('.polas');
      if (Array.isArray(g) && g.length && box) {
        box.innerHTML = g.map(function (it) {
          return '<figure class="pola"><img src="' + esc(fixUrl(it.photo)) + '" width="520" height="650" loading="lazy" alt="' + esc(it.caption || '') + '"><figcaption>' + esc(it.caption || '') + '</figcaption></figure>';
        }).join('');
      }
    });
})();
