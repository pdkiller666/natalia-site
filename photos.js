/* Применяет цвета, фото, галерею с категориями и ВСЕ текстовые поля из content/site.json */
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

  /* ── полноэкранный просмотрщик галереи (с категориями) ── */
  function initLightbox() {
    if (document.getElementById('lightbox')) return;
    if (!document.getElementById('lbStyle')) {
      var st = document.createElement('style');
      st.id = 'lbStyle';
      st.textContent =
        '#lightbox{position:fixed;inset:0;z-index:9999;background:rgba(10,8,10,.94);display:none;align-items:center;justify-content:center;flex-direction:column;padding:16px}' +
        '#lightbox.open{display:flex}' +
        '#lightbox img{max-width:92vw;max-height:76vh;object-fit:contain;border-radius:6px;box-shadow:0 20px 60px rgba(0,0,0,.6)}' +
        '#lbCap{margin-top:14px;color:#f9f6f0;font:500 15px/1.4 system-ui,sans-serif;text-align:center}' +
        '#lbCap small{display:block;color:#c8c2bc;margin-top:4px}' +
        '#lbCount{position:absolute;top:16px;left:16px;color:#c8c2bc;font:600 12px/1 system-ui;letter-spacing:.12em}' +
        '.lb-btn{position:absolute;background:rgba(249,246,240,.08);border:1px solid rgba(224,169,157,.35);color:#e0a99d;width:46px;height:46px;border-radius:50%;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center}' +
        '#lbClose{top:12px;right:12px}' +
        '#lbPrev{left:10px;top:50%;transform:translateY(-50%)}' +
        '#lbNext{right:10px;top:50%;transform:translateY(-50%)}' +
        '.pola{cursor:pointer}.fcard{cursor:pointer}' +
        '.case-gal-btn{margin-top:14px;background:rgba(249,246,240,.08);border:1px solid rgba(224,169,157,.35);color:#e0a99d;padding:9px 16px;border-radius:999px;font:600 12px/1 system-ui,sans-serif;letter-spacing:.08em;cursor:pointer;display:inline-block}';
      document.head.appendChild(st);
    }
    var lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.innerHTML = '<span id="lbCount"></span><button class="lb-btn" id="lbClose" aria-label="Закрыть">✕</button><button class="lb-btn" id="lbPrev" aria-label="Назад">←</button><img alt=""><button class="lb-btn" id="lbNext" aria-label="Вперёд">→</button><div id="lbCap"></div>';
    document.body.appendChild(lb);
    var img = lb.querySelector('img'), cap = document.getElementById('lbCap'), cnt = document.getElementById('lbCount');
    var items = [], idx = 0;
    function show(i) {
      if (!items.length) return;
      idx = (i + items.length) % items.length;
      var it = items[idx];
      img.src = fixUrl(it.photo);
      img.alt = it.caption || '';
      cap.innerHTML = esc(it.caption || '') + (it.event ? '<small>' + esc(it.event) + '</small>' : '');
      cnt.textContent = (idx + 1) + ' / ' + items.length;
    }
    function openLb(list, i) {
      if (!list || !list.length) return;
      items = list; show(i);
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeLb() { lb.classList.remove('open'); document.body.style.overflow = ''; }
    lb.querySelector('#lbClose').onclick = closeLb;
    lb.querySelector('#lbPrev').onclick = function (e) { e.stopPropagation(); show(idx - 1); };
    lb.querySelector('#lbNext').onclick = function (e) { e.stopPropagation(); show(idx + 1); };
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
    var sx = 0;
    lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    }, { passive: true });
    window.__openLb = openLb;
  }

  /* ── кейсы: фоновое фото + кнопка галереи ── */
  function decorateCases(list) {
    var wrap = document.getElementById('casesList');
    if (!wrap || !Array.isArray(list)) return;
    var nodes = wrap.querySelectorAll('.case');
    for (var i = 0; i < nodes.length && i < list.length; i++) {
      (function (el, c) {
        if (el.dataset.decorated) return;
        el.dataset.decorated = '1';
        if (c.photo) {
          el.style.backgroundImage = 'linear-gradient(rgba(20,17,20,.84), rgba(20,17,20,.88)), url("' + fixUrl(c.photo) + '")';
          el.style.backgroundSize = 'cover';
          el.style.backgroundPosition = 'center';
        }
        if (Array.isArray(c.gallery) && c.gallery.length) {
          var btn = document.createElement('button');
          btn.textContent = '📸 Фото кейса · ' + c.gallery.length;
          btn.style.cssText = 'margin-top:14px;background:rgba(249,246,240,.08);border:1px solid rgba(224,169,157,.35);color:#e0a99d;padding:9px 16px;border-radius:999px;font:600 12px/1 system-ui,sans-serif;letter-spacing:.08em;cursor:pointer';
          btn.onclick = function (e) { e.stopPropagation(); window.__openLb(c.gallery, 0); };
          el.appendChild(btn);
        }
      })(nodes[i], list[i]);
    }
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
        var st2 = document.querySelector('#stickyCta a');
        if (st2) st2.textContent = H.ctaButton + ' ✦';
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
        // videoUrl теперь обрабатывается через toEmbedUrl() в index.html
      }

      /* ── форматы событий ── */
      if (S.formats && Array.isArray(S.formats.items) && S.formats.items.length) {
        var grid = document.querySelector('.f-grid');
        if (grid) {
          var layout = ['c7', 'c5', 'c5', 'c7'];
          var fphotos = [P.format1, P.format2, P.format3, P.format4];
          grid.innerHTML = S.formats.items.map(function (f, i) {
            var photo = fphotos[i] || null;
            var img = photo ? '<img src="' + esc(fixUrl(photo)) + '" loading="lazy" alt="">' : '';
            var tags = Array.isArray(f.tags) ? f.tags.map(function (t) {
              return '<span>' + esc(typeof t === 'string' ? t : (t.tag || '')) + '</span>';
            }).join('') : '';
            return '<div class="fcard ' + (layout[i] || '') + (photo ? ' ph' : '') + '">' + img +
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

      /* ── кнопки соцсетей из списка ── */
      if (Array.isArray(d.socials) && d.socials.length) {
        var firstSoc = document.getElementById('socTg') || document.getElementById('socWa');
        if (firstSoc && firstSoc.parentNode) {
          var socCls = firstSoc.className;
          firstSoc.parentNode.innerHTML = d.socials.map(function (s) {
            return '<a class="' + socCls + '" href="' + esc(s.url || '#') + '" target="_blank" rel="noopener">' + esc(s.label || '') + '</a>';
          }).join('');
        }
      }

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

      /* ── фото, галерея с категориями, карточки форматов ── */
      setImg('.hero-visual .photo-frame img', P.hero);
      setImg('.about-photo .photo-frame img', P.about);
      setImg('.video-frame img', P.showreel);
      var g = Array.isArray(d.gallery) ? d.gallery : [];
      initLightbox();
      var box = document.querySelector('.polas');
      if (g.length && box) {
        box.innerHTML = g.map(function (it, i) {
          return '<figure class="pola" data-idx="' + i + '"><div class="pola-img"><img src="' + esc(fixUrl(it.photo)) + '" width="520" height="650" loading="lazy" alt="' + esc(it.caption || '') + '"></div><figcaption>' + esc(it.caption || '') + '</figcaption></figure>';
        }).join('');
        box.addEventListener('click', function (e) {
          var fig = e.target.closest('.pola');
          if (!fig) return;
          var it = g[+fig.getAttribute('data-idx') || 0];
          var cat = it.category || 'other';
          var list = g.filter(function (x) { return (x.category || 'other') === cat; });
          window.__openLb(list, list.indexOf(it));
        });
      }
      /* карточки форматов открывают свою категорию */
      var catMap = ['wedding', 'corporate', 'jubilee', 'private'];
      var cards = document.querySelectorAll('.fcard');
      for (var ci = 0; ci < cards.length; ci++) {
        (function (card, i) {
          card.addEventListener('click', function () {
            var list = g.filter(function (x) { return (x.category || 'other') === catMap[i]; });
            if (list.length) window.__openLb(list, 0);
          });
        })(cards[ci], ci);
      }
    });
})();
