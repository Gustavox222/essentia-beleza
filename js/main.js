/* Essentia Salão de Beleza · interface e animações
   GSAP + ScrollTrigger + SplitText: entrada do hero (arco, folha desenhada, título em linhas),
   bio palavra a palavra no scroll, revelação das fotos do espaço, troca de imagem dos serviços.
   Motion: molas nos botões, botão magnético, parallax leve do arco seguindo o ponteiro. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var reduce = doc.classList.contains('reduce');
  var M = window.Motion || null;
  var G = window.gsap || null;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (G) {
    if (window.ScrollTrigger) G.registerPlugin(window.ScrollTrigger);
    if (window.SplitText) G.registerPlugin(window.SplitText);
  }

  /* ------------------------------------------------------------ ano */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ------------------------------------------------------------ nav */
  var nav = $('[data-nav]');
  var onScroll = function () { nav.classList.toggle('is-scrolled', window.scrollY > 20); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var toggle = $('[data-menu-toggle]');
  var menu = $('[data-menu]');
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.sr').textContent = open ? 'Fechar menu' : 'Abrir menu';
    doc.classList.toggle('menu-open', open);
    menu.hidden = !open;
    if (open && M && !reduce) {
      M.animate(menu, { opacity: [0, 1] }, { duration: 0.25 });
      M.animate($$('nav a', menu), { opacity: [0, 1], y: [16, 0] }, { delay: M.stagger ? M.stagger(0.05) : 0, duration: 0.4 });
    }
  }
  toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 1080 && !menu.hidden) setMenu(false); });

  // link ativo conforme a seção visível
  if ('IntersectionObserver' in window) {
    var links = $$('.nav__links a');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('is-here', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['servicos', 'ciencia', 'espaco', 'avaliacoes', 'visite'].forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ------------------------------------------------------------ horário (fuso de São Paulo) */
  (function hours() {
    var open = { 2: [9, 19], 3: [9, 19], 4: [9, 19], 5: [9, 19], 6: [9, 17] };
    var now;
    try {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
      var get = function (t) { var p = parts.find(function (x) { return x.type === t; }); return p ? p.value : ''; };
      var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      now = { d: days[get('weekday')], h: parseInt(get('hour'), 10) + parseInt(get('minute'), 10) / 60 };
    } catch (e) { var d = new Date(); now = { d: d.getDay(), h: d.getHours() + d.getMinutes() / 60 }; }
    var row = $('[data-hours] tr[data-day="' + now.d + '"]');
    if (row) row.classList.add('is-today');
    var today = open[now.d];
    var isOpen = today && now.h >= today[0] && now.h < today[1];
    var status = $('[data-status]');
    var chip = $('[data-open-status]');
    var nextOpen = function () {
      for (var i = 1; i <= 7; i++) {
        var dd = (now.d + i) % 7;
        if (open[dd]) return ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'][dd];
      }
      return '';
    };
    if (isOpen) {
      status.textContent = 'Aberto agora'; status.classList.add('is-open');
      if (chip) chip.textContent = 'Aberto hoje até ' + today[1] + 'h';
    } else {
      status.textContent = 'Fechado agora'; status.classList.add('is-closed');
      if (chip) {
        if (today && now.h < today[0]) chip.textContent = 'Abre hoje às ' + today[0] + 'h';
        else chip.textContent = 'Abre ' + nextOpen() + ' às 9h';
      }
    }
  })();

  /* ------------------------------------------------------------ faixa e avaliações: duplicar para o loop */
  var ribbon = $('[data-ribbon]');
  if (ribbon) ribbon.innerHTML += ribbon.innerHTML;
  var qTrack = $('[data-quotes-track]');
  if (qTrack) {
    $$('.quote', qTrack).forEach(function (q) {
      var c = q.cloneNode(true); c.setAttribute('aria-hidden', 'true'); qTrack.appendChild(c);
    });
  }
  var qBox = $('[data-quotes]');
  var qBtn = $('[data-quotes-pause]');
  if (qBtn) qBtn.addEventListener('click', function () {
    var paused = qBox.classList.toggle('is-paused');
    qBtn.setAttribute('aria-pressed', String(paused));
    qBtn.querySelector('use').setAttribute('href', paused ? '#i-play' : '#i-pause');
    qBtn.querySelector('.sr').textContent = paused ? 'Continuar avaliações' : 'Pausar avaliações';
  });

  /* ------------------------------------------------------------ serviços */
  var items = $$('[data-svc-item]');
  var stA = $('[data-svc-a]'), stB = $('[data-svc-b]'), stN = $('[data-svc-n]');
  var front = stA, back = stB, current = 0;
  var desktop = window.matchMedia('(min-width: 901px)');
  // pré-carrega as imagens grandes do palco
  if (desktop.matches) items.forEach(function (it) { var i = new Image(); i.src = $('.svc__img', it).getAttribute('data-src-lg'); });

  function setStage(idx) {
    if (!front) return;
    var src = $('.svc__img', items[idx]).getAttribute('data-src-lg');
    if (front.getAttribute('src') === src) return;
    back.src = src;
    back.classList.remove('is-off');
    front.classList.add('is-off');
    var t = front; front = back; back = t;
    stN.textContent = ('0' + (idx + 1)).slice(-2);
    if (M && !reduce) M.animate(stN, { opacity: [0, 1], y: [24, 0] }, { duration: 0.5, easing: [0.22, 0.8, 0.24, 1] });
  }
  function activate(idx, fromHover) {
    if (idx === current && !fromHover) {
      // no celular, tocar de novo fecha o item
      if (!desktop.matches) {
        var open = items[idx].classList.toggle('is-active');
        $('.svc__btn', items[idx]).setAttribute('aria-expanded', String(open));
      }
      return;
    }
    items.forEach(function (it, i) {
      var on = i === idx;
      it.classList.toggle('is-active', on);
      $('.svc__btn', it).setAttribute('aria-expanded', String(on));
    });
    current = idx;
    setStage(idx);
  }
  items.forEach(function (it, i) {
    var btn = $('.svc__btn', it);
    btn.addEventListener('click', function () { activate(i); });
    if (fine) btn.addEventListener('mouseenter', function () { if (desktop.matches && i !== current) activate(i, true); });
  });
  $$('[data-goto-svc]').forEach(function (a) {
    a.addEventListener('click', function () { activate(parseInt(a.getAttribute('data-goto-svc'), 10), true); });
  });

  /* ------------------------------------------------------------ spotlight (cartões da ciência) */
  $$('[data-spot]').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ------------------------------------------------------------ Motion: molas, ímã, parallax do arco */
  if (M && !reduce) {
    $$('.btn, .actionbar a, .socials a, .svc__btn, .quotes__pause').forEach(function (el) {
      el.addEventListener('pointerdown', function () { M.animate(el, { scale: 0.96 }, { type: 'spring', stiffness: 600, damping: 30 }); });
      var up = function () { M.animate(el, { scale: 1 }, { type: 'spring', stiffness: 420, damping: 16 }); };
      el.addEventListener('pointerup', up);
      el.addEventListener('pointerleave', up);
    });
    if (fine) {
      $$('[data-magnetic]').forEach(function (el) {
        el.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect();
          M.animate(el, { x: (e.clientX - r.left - r.width / 2) * 0.2, y: (e.clientY - r.top - r.height / 2) * 0.3 }, { type: 'spring', stiffness: 260, damping: 18 });
        });
        el.addEventListener('pointerleave', function () { M.animate(el, { x: 0, y: 0 }, { type: 'spring', stiffness: 260, damping: 14 }); });
      });
      var art = $('.hero__art'), img = $('[data-hero-img]'), leaf = $('[data-hero-leaf]');
      var hero = $('.hero');
      if (art && img) {
        hero.addEventListener('pointermove', function (e) {
          var r = hero.getBoundingClientRect();
          var nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
          M.animate(img, { x: nx * -18, y: ny * -12 }, { type: 'spring', stiffness: 80, damping: 20 });
          if (leaf) M.animate(leaf, { x: nx * 16, y: ny * 16, rotate: nx * 8 }, { type: 'spring', stiffness: 80, damping: 20 });
        });
        hero.addEventListener('pointerleave', function () {
          M.animate(img, { x: 0, y: 0 }, { type: 'spring', stiffness: 80, damping: 20 });
          if (leaf) M.animate(leaf, { x: 0, y: 0, rotate: 0 }, { type: 'spring', stiffness: 80, damping: 20 });
        });
      }
    }
  }

  /* ------------------------------------------------------------ barras de avaliação */
  var bars = $('[data-bars]');
  if (bars) {
    if (reduce || !('IntersectionObserver' in window)) bars.classList.add('is-in');
    else {
      var bo = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { bars.classList.add('is-in'); bo.disconnect(); } }, { threshold: 0.4 });
      bo.observe(bars);
    }
  }

  /* ------------------------------------------------------------ GSAP */
  if (!G || reduce) { doc.classList.add('ready'); return; }

  // -- entrada do hero (uma vez, no carregamento)
  (function heroEnter() {
    var title = $('[data-hero-title]');
    var split = null;
    try { if (window.SplitText) split = window.SplitText.create(title, { type: 'lines', mask: 'lines', linesClass: 'ln' }); } catch (e) { split = null; }
    var tl = G.timeline({ defaults: { ease: 'expo.out' }, onComplete: function () { doc.classList.add('ready'); } });
    var arch = $('[data-hero-arch]'), img = $('[data-hero-img]');
    var leafPaths = $$('[data-hero-leaf] path');
    leafPaths.forEach(function (p) { var L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
    tl.fromTo(arch, { clipPath: 'inset(100% 0% 0% 0% round 999px 999px 30px 30px)' }, { clipPath: 'inset(0% 0% 0% 0% round 999px 999px 30px 30px)', duration: 1.6, ease: 'expo.inOut', clearProps: 'clipPath' }, 0)
      .fromTo(img, { scale: 1.25 }, { scale: 1, duration: 2.2, ease: 'expo.out' }, 0.2);
    if (split && split.lines) tl.from(split.lines, { yPercent: 110, duration: 1.2, stagger: 0.12 }, 0.35);
    else tl.from(title, { opacity: 0, y: 30, duration: 1 }, 0.35);
    tl.fromTo('[data-hero-fade]', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 1, stagger: 0.1 }, 0.75)
      .to(leafPaths, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', stagger: 0.25 }, 0.9)
      .fromTo('[data-hero-chip]', { opacity: 0, y: 20, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'back.out(1.6)' }, 1.3)
      .fromTo('[data-hero-badge]', { opacity: 0, scale: 0.6, rotate: -40 }, { opacity: 1, scale: 1, rotate: 0, duration: 1.1, ease: 'back.out(1.4)' }, 1.45);
  })();

  if (!window.ScrollTrigger) return;
  var ST = window.ScrollTrigger;

  // -- bio: palavra a palavra conforme a leitura (momento 1)
  var bio = $('[data-words]');
  if (bio && window.SplitText) {
    try {
      var sw = window.SplitText.create(bio, { type: 'words', wordsClass: 'w' });
      bio.classList.add('is-split');
      G.to(sw.words, {
        opacity: 1, ease: 'none', stagger: 0.08,
        scrollTrigger: { trigger: bio, start: 'top 78%', end: 'bottom 45%', scrub: 0.6 }
      });
    } catch (e) { bio.classList.remove('is-split'); }
  }

  // -- espaço: fotos revelam por máscara, uma vez (momento 2)
  var reveals = $$('[data-reveal]');
  if (reveals.length) {
    reveals.forEach(function (fig, i) {
      var im = $('img', fig);
      G.set(fig, { clipPath: 'inset(0% 0% 100% 0%)' });
      G.set(im, { scale: 1.18 });
      ST.create({
        trigger: '.mosaic', start: 'top 80%', once: true,
        onEnter: function () {
          G.to(fig, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut', delay: i * 0.12, clearProps: 'clipPath' });
          G.to(im, { scale: 1, duration: 1.8, ease: 'expo.out', delay: i * 0.12 + 0.15, clearProps: 'transform' });
        }
      });
    });
  }

  // -- folha do fecho se desenha ao chegar
  var closeLeaf = $('.close__leaf');
  if (closeLeaf) {
    G.fromTo(closeLeaf, { rotate: -25, scale: 0.7, opacity: 0 }, { rotate: 0, scale: 1, opacity: 1, duration: 1.2, ease: 'back.out(1.6)', scrollTrigger: { trigger: closeLeaf, start: 'top 85%', once: true } });
  }

  window.addEventListener('load', function () { ST.refresh(); });
})();
