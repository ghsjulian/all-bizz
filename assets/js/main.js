/* All Bizz Entertainment — main.js (vanilla JS, no dependencies) */
(function () {
  'use strict';

  var doc = document;
  var body = doc.body;

  /* ---------- Mobile nav ---------- */
  var toggle = doc.querySelector('.nav-toggle');
  var nav = doc.querySelector('.main-nav');
  function setNav(open) {
    body.classList.toggle('nav-open', open);
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { setNav(!body.classList.contains('nav-open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setNav(false); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') setNav(false); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 900) setNav(false); });
  }

  /* ---------- Scroll reveal ---------- */
  var reveals = doc.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Footer year ---------- */
  var y = doc.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- Application / consultation forms ---------- */
  var form = doc.querySelector('form[data-app-form]');
  if (!form) return;

  var storageKey = 'abe-draft-' + (form.getAttribute('data-app-form') || 'form');
  var fields = Array.prototype.slice.call(form.querySelectorAll('.field[data-q]'));
  var barFill = doc.querySelector('.progress-bar i');
  var progressText = doc.querySelector('[data-progress-text]');
  var percentText = doc.querySelector('[data-progress-percent]');

  function isFilled(field) {
    var inputs = field.querySelectorAll('input, select, textarea');
    for (var i = 0; i < inputs.length; i++) {
      var inp = inputs[i];
      if (inp.type === 'checkbox' || inp.type === 'radio') { if (inp.checked) return true; }
      else if (inp.value && inp.value.trim() !== '') return true;
    }
    return false;
  }

  function updateProgress() {
    if (!barFill) return;
    var done = fields.filter(isFilled).length;
    var pct = Math.round((done / fields.length) * 100);
    barFill.style.width = pct + '%';
    if (progressText) progressText.textContent = done + ' of ' + fields.length + ' questions answered';
    if (percentText) percentText.textContent = pct + '%';
  }

  function validateField(field) {
    if (field.getAttribute('data-required') !== 'true') { field.classList.remove('invalid'); return true; }
    var ok = isFilled(field);
    var emailInp = field.querySelector('input[type="email"]');
    if (ok && emailInp) ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInp.value.trim());
    var urlInp = field.querySelector('input[type="url"]');
    if (ok && urlInp && urlInp.value.trim()) {
      ok = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/i.test(urlInp.value.trim());
    }
    field.classList.toggle('invalid', !ok);
    return ok;
  }

  /* Save / restore draft */
  function collect() {
    var data = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.type === 'submit' || el.classList.contains('honey')) return;
      if (el.type === 'checkbox') { (data[el.name] = data[el.name] || []); if (el.checked) data[el.name].push(el.value); }
      else if (el.type === 'radio') { if (el.checked) data[el.name] = el.value; }
      else data[el.name] = el.value;
    });
    return data;
  }
  function saveDraft() { try { localStorage.setItem(storageKey, JSON.stringify(collect())); } catch (e) { /* ignore */ } }
  function restoreDraft() {
    try {
      var raw = localStorage.getItem(storageKey);
      if (!raw) return;
      var data = JSON.parse(raw);
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name || !(el.name in data)) return;
        if (el.type === 'checkbox') el.checked = (data[el.name] || []).indexOf(el.value) > -1;
        else if (el.type === 'radio') el.checked = data[el.name] === el.value;
        else el.value = data[el.name];
      });
    } catch (e) { /* ignore */ }
  }

  restoreDraft();
  updateProgress();

  form.addEventListener('input', function (e) {
    var f = e.target.closest('.field');
    if (f && f.classList.contains('invalid')) validateField(f);
    updateProgress(); saveDraft();
  });
  form.addEventListener('change', function (e) {
    var f = e.target.closest('.field');
    if (f && f.classList.contains('invalid')) validateField(f);
    updateProgress(); saveDraft();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var hp = form.querySelector('.honey');
    if (hp && hp.value) return; // bot
    var firstBad = null;
    fields.forEach(function (f) { if (!validateField(f) && !firstBad) firstBad = f; });
    if (firstBad) {
      firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var focusable = firstBad.querySelector('input, select, textarea');
      if (focusable) setTimeout(function () { focusable.focus({ preventScroll: true }); }, 450);
      return;
    }

    /* ------------------------------------------------------------------
       DEMO SUBMIT: this static site has no backend.
       To receive applications, point the form at your own endpoint:
         - set  data-endpoint="https://your-api.example.com/apply"  on the <form>
           (JSON POST), or
         - use a form service (Formspree, Getform, Netlify Forms, etc.).
       Without an endpoint the submission is only shown on screen.
       ------------------------------------------------------------------ */
    var endpoint = form.getAttribute('data-endpoint');
    var payload = collect();
    var btn = form.querySelector('button[type="submit"]');
    var original = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }

    function done() {
      try { localStorage.removeItem(storageKey); } catch (err) { /* ignore */ }
      var ok = doc.querySelector('.form-success');
      if (ok) { ok.classList.add('show'); ok.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      form.querySelectorAll('.form-section, .form-submit').forEach(function (n) { n.style.display = 'none'; });
      var pw = doc.querySelector('.progress-wrap'); if (pw) pw.style.display = 'none';
    }
    function fail() {
      if (btn) { btn.disabled = false; btn.textContent = original; }
      alert('Sorry, we could not submit your application. Please try again.');
    }

    if (endpoint) {
      fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { if (!r.ok) throw new Error('bad status'); done(); })
        .catch(fail);
    } else {
      if (window.console) console.info('Application payload (demo, not sent):', payload);
      setTimeout(done, 600);
    }
  });
})();

/* =========================================================
   v2 — scroll progress, header state, hero carousel, tilt
   ========================================================= */
(function () {
  'use strict';
  var doc = document;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Scroll progress + header shadow */
  var bar = doc.querySelector('.scroll-progress');
  var header = doc.querySelector('.site-header');
  var ticking = false;
  function onScroll() {
    var h = doc.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    if (bar) bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    if (header) header.classList.toggle('scrolled', h.scrollTop > 12);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* Hero carousel */
  var root = doc.querySelector('[data-carousel]');
  if (root) {
    var viewport = root.querySelector('.hc-viewport');
    var track = root.querySelector('.hc-track');
    var slides = Array.prototype.slice.call(root.querySelectorAll('.hc-slide'));
    var dots = Array.prototype.slice.call(root.querySelectorAll('.hc-dot'));
    var count = root.querySelector('.hc-count');
    var prev = root.querySelector('[data-prev]');
    var next = root.querySelector('[data-next]');
    var delay = parseInt(root.getAttribute('data-interval') || '7000', 10);
    var index = 0, timer = null, hovering = false, dragging = false;
    var startX = 0, startY = 0, dx = 0, locked = null;

    root.style.setProperty('--dur', (delay / 1000) + 's');
    if (reduce) root.classList.add('static');

    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function go(i, user) {
      index = (i + slides.length) % slides.length;
      track.style.transform = 'translate3d(' + (-index * 100) + '%,0,0)';
      slides.forEach(function (s, n) {
        var on = n === index;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
        s.querySelectorAll('a,button').forEach(function (el) { el.tabIndex = on ? 0 : -1; });
      });
      dots.forEach(function (d, n) {
        d.classList.remove('active'); void d.offsetWidth; // restart progress animation
        if (n === index) d.classList.add('active');
        d.setAttribute('aria-selected', n === index ? 'true' : 'false');
      });
      if (count) count.textContent = pad(index + 1) + ' / ' + pad(slides.length);
      if (user) restart();
    }
    function stop() { clearTimeout(timer); timer = null; }
    function restart() {
      stop();
      if (reduce || hovering || dragging || doc.hidden) return;
      timer = setTimeout(function () { go(index + 1); restart(); }, delay);
    }
    function pause() { hovering = true; root.classList.add('paused'); stop(); }
    function resume() { hovering = false; root.classList.remove('paused'); go(index); restart(); }

    if (prev) prev.addEventListener('click', function () { go(index - 1, true); });
    if (next) next.addEventListener('click', function () { go(index + 1, true); });
    dots.forEach(function (d, n) { d.addEventListener('click', function () { go(n, true); }); });

    root.addEventListener('mouseenter', function (e) { if (window.matchMedia('(hover:hover)').matches) pause(); });
    root.addEventListener('mouseleave', function () { if (hovering) resume(); });
    root.addEventListener('focusin', pause);
    root.addEventListener('focusout', function (e) { if (!root.contains(e.relatedTarget)) resume(); });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { go(index - 1, true); }
      else if (e.key === 'ArrowRight') { go(index + 1, true); }
    });
    doc.addEventListener('visibilitychange', function () { if (doc.hidden) stop(); else { go(index); restart(); } });

    /* Touch / pointer swipe */
    function down(x, y) { dragging = true; locked = null; startX = x; startY = y; dx = 0; stop(); root.classList.add('paused'); }
    function move(x, y, ev) {
      if (!dragging) return;
      var mx = x - startX, my = y - startY;
      if (locked === null && (Math.abs(mx) > 8 || Math.abs(my) > 8)) locked = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
      if (locked !== 'x') return;
      if (ev && ev.cancelable) ev.preventDefault();
      dx = mx;
      track.classList.add('dragging');
      var w = viewport.clientWidth;
      track.style.transform = 'translate3d(calc(' + (-index * 100) + '% + ' + dx + 'px),0,0)';
    }
    function up() {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('dragging');
      root.classList.remove('paused');
      var w = viewport.clientWidth;
      if (locked === 'x' && Math.abs(dx) > Math.min(80, w * 0.18)) go(index + (dx < 0 ? 1 : -1), true);
      else { go(index); restart(); }
    }
    viewport.addEventListener('touchstart', function (e) { var t = e.touches[0]; down(t.clientX, t.clientY); }, { passive: true });
    viewport.addEventListener('touchmove', function (e) { var t = e.touches[0]; move(t.clientX, t.clientY, e); }, { passive: false });
    viewport.addEventListener('touchend', up);
    viewport.addEventListener('touchcancel', up);
    viewport.addEventListener('mousedown', function (e) { if (e.target.closest('a,button')) return; down(e.clientX, e.clientY); e.preventDefault(); });
    window.addEventListener('mousemove', function (e) { move(e.clientX, e.clientY); });
    window.addEventListener('mouseup', up);
    viewport.addEventListener('click', function (e) { if (Math.abs(dx) > 8) { e.preventDefault(); e.stopPropagation(); dx = 0; } }, true);

    go(0); restart();
  }

  /* Subtle 3D tilt on cards (mouse devices only) */
  if (!reduce && window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    doc.querySelectorAll('.program-card, .hero-card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(900px) rotateX(' + (-py * 5) + 'deg) rotateY(' + (px * 6) + 'deg) translateY(-4px)';
      });
      card.addEventListener('pointerleave', function () { card.style.transform = ''; });
    });
  }
})();
