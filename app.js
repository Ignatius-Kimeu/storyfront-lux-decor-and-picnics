/* =========================================================================
   Lux Decor & Picnics — shared behaviour
   Vanilla JS, no libraries. Every animated thing checks reduced-motion.
   ========================================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* speaker icons for the film sound toggles (cone filled, waves stroked) */
  var ICON_MUTED = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M4 9.5v5h3.6L12 18V6L7.6 9.5H4z" fill="currentColor" stroke="none"/>' +
    '<path d="M16.5 9.5l4 5M20.5 9.5l-4 5"/></svg>';
  var ICON_LOUD = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M4 9.5v5h3.6L12 18V6L7.6 9.5H4z" fill="currentColor" stroke="none"/>' +
    '<path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.6a7.6 7.6 0 0 1 0 10.8"/></svg>';

  /* ---------- preload splash ---------------------------------------------- */
  var splash = $('#splash');
  if (splash) {
    var killSplash = function () {
      splash.classList.add('is-gone');
      window.setTimeout(function () {
        if (splash && splash.parentNode) { splash.parentNode.removeChild(splash); }
      }, 800);
    };
    window.addEventListener('load', function () {
      window.setTimeout(killSplash, reduced ? 0 : 1450);
    });
    // Never let a stalled asset trap the visitor behind the splash.
    window.setTimeout(killSplash, 5000);
  }

  /* ---------- smart sticky header ----------------------------------------- */
  var hdr = $('#hdr');
  if (hdr) {
    var lastY = window.pageYOffset;
    var ticking = false;
    var onScroll = function () {
      var y = window.pageYOffset;
      if (y > lastY + 6 && y > 220) {
        hdr.classList.add('is-up');           // scrolling down -> tuck away
      } else if (y < lastY - 6) {
        hdr.classList.remove('is-up');        // any upward scroll brings it back
      }
      lastY = y;
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });
  }

  /* ---------- mobile drawer ------------------------------------------------ */
  var burger = $('#burger');
  var drawer = $('#drawer');
  if (burger && drawer) {
    var setDrawer = function (open) {
      burger.classList.toggle('is-open', open);
      drawer.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('is-locked', open);
    };
    burger.addEventListener('click', function () {
      setDrawer(!drawer.classList.contains('is-open'));
    });
    $$('a', drawer).forEach(function (a) {
      a.addEventListener('click', function () { setDrawer(false); });
    });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) { setDrawer(false); }
    });
  }

  /* ---------- scroll reveal ------------------------------------------------ */
  var revealables = $$('.rv');
  if (revealables.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      revealables.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var ro = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-in'); ro.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      revealables.forEach(function (el) { ro.observe(el); });
    }
  }

  /* ---------- counting stats ----------------------------------------------- */
  var counters = $$('[data-count]');
  if (counters.length) {
    var runCount = function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      var dec = (String(target).split('.')[1] || '').length;
      if (reduced) { el.textContent = target.toFixed(dec) + suffix; return; }
      var t0 = null, dur = 1400;
      var tick = function (now) {
        if (t0 === null) { t0 = now; }
        var p = Math.min((now - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(dec) + suffix;
        if (p < 1) { window.requestAnimationFrame(tick); }
      };
      window.requestAnimationFrame(tick);
    };
    if (!('IntersectionObserver' in window)) {
      counters.forEach(runCount);
    } else {
      var co = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { runCount(en.target); co.unobserve(en.target); }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { co.observe(el); });
    }
  }

  /* ---------- photo lightbox ----------------------------------------------- */
  var lb = $('#lb');
  var items = $$('.gal__item');
  if (lb && items.length) {
    var lbImg   = $('#lbImg');
    var lbCap   = $('#lbCap');
    var lbCount = $('#lbCount');
    var idx = 0;
    var lastFocus = null;

    var show = function (i) {
      idx = (i + items.length) % items.length;
      var it = items[idx];
      lbImg.classList.remove('is-ready');
      var full = it.getAttribute('data-full');
      var cap  = it.getAttribute('data-cap') || '';
      var pre = new Image();
      pre.onload = function () {
        lbImg.src = full;
        lbImg.alt = cap;
        lbImg.classList.add('is-ready');
      };
      pre.src = full;
      lbCap.textContent = cap;
      lbCount.textContent = (idx + 1) + ' / ' + items.length;
    };
    var open = function (i) {
      lastFocus = document.activeElement;
      show(i);
      lb.classList.add('is-open');
      document.body.classList.add('is-locked');
      $('#lbClose').focus();
    };
    var close = function () {
      lb.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      if (lastFocus) { lastFocus.focus(); }
    };

    items.forEach(function (it, i) {
      it.addEventListener('click', function () { open(i); });
    });
    $('#lbClose').addEventListener('click', close);
    $('#lbPrev').addEventListener('click', function () { show(idx - 1); });
    $('#lbNext').addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.classList.contains('lb__stage')) { close(); }
    });
    window.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) { return; }
      if (e.key === 'Escape') { close(); }
      if (e.key === 'ArrowLeft') { show(idx - 1); }
      if (e.key === 'ArrowRight') { show(idx + 1); }
    });

    // swipe on touch
    var sx = 0;
    lb.addEventListener('touchstart', function (e) { sx = e.changedTouches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 45) { show(dx < 0 ? idx + 1 : idx - 1); }
    }, { passive: true });
  }

  /* ---------- films: autoplay on scroll, one sound at a time --------------- */
  var vids = $$('.film video');
  if (vids.length) {
    var soundOn = null;

    var muteAll = function (except) {
      vids.forEach(function (v) {
        if (v !== except) {
          v.muted = true;
          var b = v.closest('.film').querySelector('.js-sound');
          if (b) { b.setAttribute('aria-label', 'Turn sound on'); b.innerHTML = ICON_MUTED; }
        }
      });
    };

    if ('IntersectionObserver' in window) {
      var vo = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var v = en.target;
          if (en.isIntersecting) {
            if (!reduced) { var p = v.play(); if (p && p.catch) { p.catch(function () {}); } }
          } else {
            v.pause();
            if (v === soundOn) { v.muted = true; soundOn = null; muteAll(null); }
          }
        });
      }, { threshold: 0.45 });
      vids.forEach(function (v) { vo.observe(v); });
    }

    $$('.js-sound').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var v = btn.closest('.film').querySelector('video');
        if (v.muted) {
          muteAll(v);
          v.muted = false;
          soundOn = v;
          btn.setAttribute('aria-label', 'Turn sound off');
          btn.innerHTML = ICON_LOUD;
          var p = v.play(); if (p && p.catch) { p.catch(function () {}); }
        } else {
          v.muted = true;
          soundOn = null;
          btn.setAttribute('aria-label', 'Turn sound on');
          btn.innerHTML = ICON_MUTED;
        }
      });
    });

    /* video lightbox */
    var vlb = $('#vlb');
    if (vlb) {
      var vlbVid = $('#vlbVid');
      var openVid = function (src) {
        vlbVid.src = src;
        vlbVid.muted = false;
        vlb.classList.add('is-open');
        document.body.classList.add('is-locked');
        vids.forEach(function (v) { v.pause(); });
        var p = vlbVid.play(); if (p && p.catch) { p.catch(function () {}); }
      };
      var closeVid = function () {
        vlb.classList.remove('is-open');
        document.body.classList.remove('is-locked');
        vlbVid.pause();
        vlbVid.removeAttribute('src');
        vlbVid.load();
      };
      $$('.film').forEach(function (card) {
        var src = card.querySelector('video').getAttribute('src');
        card.querySelector('video').addEventListener('click', function () { openVid(src); });
        var fs = card.querySelector('.js-full');
        if (fs) {
          fs.addEventListener('click', function (e) { e.stopPropagation(); openVid(src); });
        }
      });
      $('#vlbClose').addEventListener('click', closeVid);
      vlb.addEventListener('click', function (e) { if (e.target === vlb) { closeVid(); } });
      window.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && vlb.classList.contains('is-open')) { closeVid(); }
      });
    }
  }

  /* ---------- booking wizard ------------------------------------------------
     Premium feature: a 4-step request flow that assembles a structured,
     pre-filled WhatsApp message. Front-end only, no backend.
     -------------------------------------------------------------------------- */
  var wiz = $('#wiz');
  if (wiz) {
    var WA = '254790442983';
    var panels = $$('.wiz__panel', wiz);
    var steps  = $$('.wiz__step', wiz);
    var btnNext = $('#wizNext');
    var btnBack = $('#wizBack');
    var current = 0;

    var data = { occasion: '', guests: '', town: '', date: '', name: '', venue: '', palette: '', notes: '' };

    /* chip groups write straight into `data` */
    $$('.chips', wiz).forEach(function (group) {
      var key = group.getAttribute('data-key');
      $$('.chip', group).forEach(function (chip) {
        chip.addEventListener('click', function () {
          $$('.chip', group).forEach(function (c) { c.classList.remove('is-on'); });
          chip.classList.add('is-on');
          data[key] = chip.textContent.trim();
          clearErr(group.closest('.js-req'));
          buildPreview();
        });
      });
    });

    $$('input,textarea,select', wiz).forEach(function (f) {
      f.addEventListener('input', function () {
        if (f.name && Object.prototype.hasOwnProperty.call(data, f.name)) { data[f.name] = f.value.trim(); }
        clearErr(f.closest('.field'));
        buildPreview();
      });
    });

    function clearErr(el) { if (el) { el.classList.remove('has-err'); } }

    function validate(i) {
      var ok = true;
      $$('.js-req', panels[i]).forEach(function (holder) {
        var key = holder.getAttribute('data-req');
        if (!data[key]) { holder.classList.add('has-err'); ok = false; }
      });
      return ok;
    }

    function paint() {
      panels.forEach(function (p, i) {
        p.classList.toggle('is-live', i === current);
      });
      steps.forEach(function (s, i) {
        s.classList.toggle('is-now', i === current);
        s.classList.toggle('is-done', i < current);
      });
      btnBack.classList.toggle('is-hidden', current === 0);
      btnNext.textContent = current === panels.length - 1 ? 'Send on WhatsApp' : 'Continue';
      wiz.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    }

    function message() {
      var L = [];
      L.push('Hi Lux Decor & Picnics — I would like to request a setup.');
      L.push('');
      if (data.occasion) { L.push('Occasion: ' + data.occasion); }
      if (data.guests)   { L.push('Guests: ' + data.guests); }
      if (data.town)     { L.push('Location: ' + data.town); }
      if (data.date)     { L.push('Preferred date: ' + data.date); }
      if (data.venue)    { L.push('Venue / area: ' + data.venue); }
      if (data.palette)  { L.push('Colour palette: ' + data.palette); }
      if (data.notes)    { L.push('Notes: ' + data.notes); }
      L.push('');
      L.push('My name is ' + (data.name || '—') + '.');
      L.push('(Sent from the website)');
      return L.join('\n');
    }

    function buildPreview() {
      var pre = $('#wizPreview');
      if (pre) { pre.textContent = message(); }
    }

    btnNext.addEventListener('click', function () {
      if (!validate(current)) { return; }
      if (current === panels.length - 1) {
        window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(message()), '_blank', 'noopener');
        return;
      }
      current += 1;
      paint();
    });
    btnBack.addEventListener('click', function () {
      if (current === 0) { return; }
      current -= 1;
      paint();
      panels[current].classList.add('is-back');
      window.setTimeout(function () { panels[current].classList.remove('is-back'); }, 520);
    });

    paint();
    buildPreview();
  }

  /* ---------- year in footer ------------------------------------------------ */
  $$('.js-year').forEach(function (el) { el.textContent = new Date().getFullYear(); });
}());
