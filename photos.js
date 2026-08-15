/* Применяет цвета, фото, галерею и ВСЕ текстовые поля из content/site.json */
(function () {
  'use strict';
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var fmtEm = function (s) { return esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>'); };
  var fmtNum = function (n) { return Number(n).toLocaleString('ru-RU'); };
  function fixUrl(u) {
    if (!u) return u;
    if (u.charAt(0) === '/' && u.charAt(1) !== '/') {
      return location.pathname.replace(/[^/]*$/, '') + u.slice(1);
    }
    return u;
  }
  function setImg(el, url) {
    if (!url) return;
    if (typeof el === 'string') el = document.querySelector(el);
    if (!el) return;
    el.removeAttribute('srcset'); el.removeAttribute('sizes');
    el.src = fixUrl(url);
  }
  function txt(sel, v) {
    var el = (typeof sel === 'string') ? document.querySelector(sel) : sel;
    if (el && v != null) el.textContent = v;
  }
  function setFirstText(el, v) {
    if (!el || v == null) return;
    for (var i = 0; i < el.childNodes.length; i++)
      if (el.childNodes[i].nodeType === 3) { el.childNodes[i].nodeValue = v; return; }
    el.insertBefore(document.createTextNode(v), el.firstChild);
  }
  function sectionByNum(num) {
    var secs = document.querySelectorAll('section');
    for (var i = 0; i < secs.length; i++) {
      var n = secs[i].querySelector('.sec-num');
      if (n && n.textContent.trim() === String(num)) return secs[i];
    }
    return null;
  }
  /* ── цвета ── */
  function hexToRgb(hex) {
    var m = String(hex).replace('#', '');
    if (m.length === 3) m = m[0] + m[0] + m[1] + m[1] + m[2] + m[2];
    var n = parseInt(m, 16);
    if (isNaN(n)) return null;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgba(hex, a) {
    var c = hexToRgb(hex);
    return c ? 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')' : null;
  }
  function applyColors(C) {
    if (!C) return;
    var r = document.documentElement.style;
    var direct = {
      bg: '--bg', bg2: '--bg2', panel: '--panel',
      ink: '--ink', muted: '--muted', faint: '--faint',
      accent: '--rose', gold: '--gold',
      cream: '--cream', creamInk: '--cream-ink', creamMut: '--cream-mut',
      creamRose: '--cream-rose', warn: '--warn'
    };
    for (var k in direct) if (C[k]) r.setProperty(direct[k], C[k]);
    if (C.accent) {
      r.setProperty('--rose-soft', rgba(C.accent, .14));
      r.setProperty('--line', rgba(C.accent, .24));
    }
    if (C.ink) r.setProperty('--line-soft', rgba(C.ink, .09));
    if (C.creamInk) r.setProperty('--cream-line', rgba(C.creamInk, .16));
  }

  fetch('content/site.json', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .catch(function () { return null; })
    .then(function (d) {
      if (!d) return;
      applyColors(d.colors);
      var P = d.photos || {}, S = d.sections || {};

      /* ── мета-данные ── */
      var M = d.meta || {};
      if (M.title) document.title = M.title;
      var md = document.querySelector('meta[name="description"]');
      if (md && M.description) md.setAttribute('content', M.description);
      [['og:title', M.title], ['og:description', M.description], ['og:image', M.ogImage]].forEach(function (p) {
        var el = document.querySelector('meta[property="' + p[0] + '"]');
        if (el && p[1]) el.setAttribute('content', p[1]);
      });

      /* ── кнопки ── */
      var H = d.hero || {};
      if (H.ctaButton) {
        var b1 = document.querySelector('.hero-actions .btn');
        if (b1) b1.innerHTML = esc(H.ctaButton) + ' <span class="arr">→</span>';
        var st = document.querySelector('#stickyCta a');
        if (st) st.textContent = H.ctaButton + ' ✦';
      }
      if (H.videoButton) txt('.hero-actions .link-line', H.videoButton);
      if (H.title) { var ht = document.querySelector('.hero-title'); if (ht) ht.innerHTML = fmtEm(H.title); }

      /* ── ярлыки и заголовки всех секций ── */
      ['about','video','formats','cases','prices','process','rituals','gallery','reviews','faq','booking']
        .forEach(function (k) {
          var cfg = S[k]; if (!cfg) return;
          var sec = sectionByNum(cfg.number); if (!sec) return;
          if (cfg.title) txt(sec.querySelector('.sec-name'), cfg.title);
          if (cfg.heading) { var h = sec.querySelector('h2'); if (h) h.innerHTML = fmtEm(cfg.heading); }
        });

      /* ── обо мне ── */
      if (S.about) {
        var A = S.about;
        var ps = document.querySelectorAll('.about-txt > p');
        if (A.text && ps.length) {
          var parts = String(A.text).split(/\n\n+/);
          for (var i = 0; i < ps.length; i++) ps[i].textContent = (parts[i] != null ? parts[i] : parts[0]) || '';
        }
        if (A.quote) txt('.about-quote', A.quote);
        if (A.signature) txt('.sign', A.signature);
        if (A.years != null) txt('.exp-badge b', A.years);
        var stats = document.querySelector('.stats');
        if (stats && Array.isArray(A.stats)) {
          stats.innerHTML = A.stats.map(function (s) {
            return '<div class="stat"><span class="num">' + fmtNum(+s.value || 0) + esc(s.suffix || '') + '</span><small>' + esc(s.label || '') + '</small></div>';
          }).join('');
        }
      }

      /* ── видео ── */
      if (S.video) {
        var vc = document.querySelectorAll('.video-cap > *');
        if (vc[0] && S.video.description) vc[0].textContent = S.video.description;
        if (vc[1] && S.video.subdescription) vc[1].textContent = S.video.subdescription;
        var frame = document.querySelector('.video-frame');
        if (frame && S.video.videoId) frame.dataset.video = 'https://www.youtube.com/embed/' + S.video.videoId;
      }

      /* ── форматы событий ── */
      if (S.formats && Array.isArray(S.formats.items) && S.formats.items.length) {
        var grid = document.querySelector('.f-grid');
        if (grid) {
          var layout = ['c7 ph', 'c5 ph', 'c5', 'c7'];
          grid.innerHTML = S.formats.items.map(function (f, i) {
            var photo = i === 0 ? P.format1 : (i === 1 ? P.format2 : null);
            var img = photo ? '<img src="' + esc(fixUrl(photo)) + '" loading="lazy" alt="">' : '';
            var tags = Array.isArray(f.tags) ? f.tags.map(function (t) {
              return '<span>' + esc(typeof t === 'string' ? t : (t.tag || '')) + '</span>';
            }).join('') : '';
            return '<div class="fcard ' + (layout[i] || '') + '">' + img +
              '<div class="f-in"><span class="f-num">' + esc(f.number || '') + '</span><h3>' + esc(f.name || '') +
              '</h3><p>' + esc(f.description || '') + '</p><div class="f-tags">' + tags +
              '</div></div><span class="f-arr">→</span></div>';
          }).join('');
        }
      } else {
        var f = document.querySelectorAll('.fcard.ph img');
        if (f[0]) setImg(f[0], P.format1);
        if (f[1]) setImg(f[1], P.format2);
      }

      /* ── как рождается событие ── */
      if (S.process) {
        if (S.process.description) txt('.flow-left p', S.process.description);
        if (S.process.ctaButton) {
          var pb = document.querySelector('.flow-left .btn');
          if (pb) pb.innerHTML = esc(S.process.ctaButton) + ' <span class="arr">→</span>';
        }
        var stepsBox = document.querySelector('.flow-right') || (document.querySelector('.step') ? document.querySelector('.step').parentNode : null);
        if (stepsBox && Array.isArray(S.process.steps)) {
          stepsBox.innerHTML = S.process.steps.map(function (s) {
            return '<div class="step"><span class="step-n">' + esc(s.number || '') + '</span><div><h3>' + esc(s.title || '') + '</h3><p>' + esc(s.text || '') + '</p></div></div>';
          }).join('');
        }
        if (S.process.antiList) {
          txt('.anti h3', S.process.antiList.title);
          var ul = document.querySelector('.anti ul');
          if (ul && Array.isArray(S.process.antiList.items)) {
            ul.innerHTML = S.process.antiList.items.map(function (it) {
              return '<li>' + esc(typeof it === 'string' ? it : (it.item || '')) + '</li>';
            }).join('');
          }
        }
      }

      /* ── мелочи секций ── */
      if (S.prices) { txt('.pk-note', S.prices.note); txt('.team-cap', S.prices.teamTitle); }
      if (S.rituals) txt('.rit-hint', S.rituals.scrollHint);
      if (S.faq) txt('.faq-left p', S.faq.description);
      if (S.booking) txt('.b-left .note', S.booking.description);

      /* ── контакты: география ── */
      if (d.contacts && d.contacts.geography) txt('.c-list .row b', d.contacts.geography);

      /* ── футер ── */
      var F = d.footer || {};
      var fb = document.querySelector('.foot-brand');
      if (fb) {
        setFirstText(fb, F.brand);
        if (F.subtitle) { var sm = fb.querySelector('small'); if (sm) sm.textContent = F.subtitle; }
      }
      if (F.copyright || F.disclaimer) {
        var fc = document.querySelector('.foot-copy');
        if (fc) fc.textContent = [F.copyright, F.disclaimer].filter(Boolean).join(' · ');
      }

      /* ── фото и галерея ── */
      setImg('.hero-visual .photo-frame img', P.hero);
      setImg('.about-photo .photo-frame img', P.about);
      setImg('.video-frame img', P.showreel);
      var g = d.gallery, box = document.querySelector('.polas');
      if (Array.isArray(g) && g.length && box) {
        box.innerHTML = g.map(function (it) {
          return '<figure class="pola"><img src="' + esc(fixUrl(it.photo)) + '" width="520" height="650" loading="lazy" alt="' + esc(it.caption || '') + '"><figcaption>' + esc(it.caption || '') + '</figcaption></figure>';
        }).join('');
      }
    });
})();
