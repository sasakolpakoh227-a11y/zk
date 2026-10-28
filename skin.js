/* DEMOKIT, кожа MAISON: скрипт MAISON CAFÉ плюс общее для демо: подсказки вместо рабочих кнопок, статус «открыто» по московскому времени
   (у заведения могут быть свои часы в выходные: data-open-we, data-close-we), фильтр доски сортов.
   Исходный комментарий MAISON CAFÉ: общий скрипт демо. Механики по white-coffee.com, написано с нуля, без библиотек:
   заставка со знаком по буквам, шторка между страницами, плавная прокрутка, шапка прячется при прокрутке вниз,
   смена тона фона по разделам, проявления, параллакс внутри рамок, пара видео, коллаж, плейлист, раскрывающиеся кофейни,
   корзина (порог доставки, подписка, «к этому сорту берут»), страница сорта (свежесть, рецепт под помол), карта кофеен.
   Корзина живёт в браузере гостя (localStorage), на сервер ничего не уходит. «Оформить» открывает телеграм студии
   MERIDIAN с примером заказа: бренд вымышлен. Поле рассылки ничего не отправляет. */
(function () {
  'use strict';
  var html = document.documentElement;
  html.classList.remove('nojs');
  var BASE = html.dataset.base || '';
  var ROOT = new URL(BASE || './', location.href).pathname;
  var TG = 'https://t.me/S3nd1ttt';
  var D = window.MAISON || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function sess(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function rub(n) { return Math.round(n).toLocaleString('ru-RU').replace(/\s/g, ' ') + ' ₽'; }
  function lang() { return html.classList.contains('en') ? 'en' : 'ru'; }
  function T(ru, en) { return lang() === 'ru' ? ru : en; }
  var raf = function (fn) { var t = false; return function () { if (!t) { t = true; requestAnimationFrame(function () { t = false; fn(); }); } }; };
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ── язык ── */
  function setLang(l) {
    html.classList.toggle('en', l === 'en'); html.lang = l; store('demo-lang', l);
    $$('[data-ru]').forEach(function (el) {
      var v = el.dataset[l]; if (el.hasAttribute('placeholder')) el.placeholder = v; else el.setAttribute('aria-label', v);
    });
    $$('[data-set-lang]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.setLang === l); });
    document.dispatchEvent(new Event('lang'));
  }
  $$('[data-set-lang]').forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.setLang); }); });

  /* ── заставка: при первом входе знак поднимается по буквам и снизу выезжает кадр,
     дальше по сайту короткая графитовая шторка со знаком (она же продолжает шторку ухода со страницы) ── */
  var quick = !!sess('demo-seen'); sess('demo-seen', '1');
  if (quick) html.classList.add('quick');
  var t0 = performance.now();
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () {
    setTimeout(function () {
      html.classList.add('c1');
      setTimeout(function () {
        html.classList.add('c2'); reveal();
        setTimeout(function () { html.classList.add('c3'); }, 1200);
      }, quick ? 520 : 2000);
    }, Math.max(0, (quick ? 40 : 200) - (performance.now() - t0)));
  });

  /* ── шторка между страницами: графит опускается, потом переход ── */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target) return;
    var u = new URL(a.href, location.href);
    if (u.origin !== location.origin || u.pathname.indexOf(ROOT) !== 0) return;
    if (u.pathname === location.pathname && u.hash) return;          // якорь на этой же странице
    e.preventDefault();
    html.classList.add('leaving');
    setTimeout(function () { location.href = u.href; }, still ? 0 : 720);
  });
  addEventListener('pageshow', function (e) { if (e.persisted) html.classList.remove('leaving'); });

  /* ── видео: грузится и играет, только когда ролик в кадре; ушёл с экрана, пауза. Без автозапуска в разметке,
     чтобы на телефоне страница не тянула мегабайты, пока гость читает первый экран ── */
  var vids = $$('video[data-src]');
  if (vids.length) {
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var vio = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting && !reduce) {
          if (!v.getAttribute('src')) { v.src = v.dataset.src; v.preload = 'auto'; }
          var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
        } else if (!v.paused) v.pause();
      });
    }, { rootMargin: '120px 0px' }) : null;
    vids.forEach(function (v) {
      if (vio) { vio.observe(v); return; }
      v.src = v.dataset.src; v.autoplay = true;          // старый браузер без наблюдателя: играет сразу, как раньше
    });
    // страховка: если наблюдатель по какой-то причине промолчал, при прокрутке сами проверяем, не в кадре ли ролик
    var vcheck = function () {
      if (reduce) return;
      vids.forEach(function (v) {
        if (v.getAttribute('src')) return;
        var r = v.getBoundingClientRect();
        if (r.bottom > -120 && r.top < innerHeight + 120 && r.width) {
          v.src = v.dataset.src; v.preload = 'auto';
          var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
        }
      });
    };
    var vt = 0;
    addEventListener('scroll', function () { clearTimeout(vt); vt = setTimeout(vcheck, 150); }, { passive: true });
    setTimeout(vcheck, 1500);
  }

  /* ── проявления: строки заголовков, текст, кадры ── */
  function reveal() {
    var els = $$('.rv, .rv-f, .px, .sd, .bars, [data-n]');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in'); io.unobserve(e.target);
        if (e.target.dataset.n) count(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }
  function count(el) {
    var n = +el.dataset.n, t1 = performance.now();
    (function f(t) { var k = Math.min(1, (t - t1) / 1400); el.textContent = Math.round(n * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); })(t1);
  }

  /* ── плавная прокрутка колесом (как Lenis у референса), только мышь и тачпад на компьютере ── */
  var box = $('#cart');
  if (fine && !still) {
    var tgt = scrollY, cur = scrollY, on = false;
    var maxY = function () { return document.documentElement.scrollHeight - innerHeight; };
    var inner = function (el, dy) {   // колесо над прокручиваемым блоком (список кофеен, корзина) отдаём ему
      for (; el && el !== document.body && el !== html; el = el.parentElement) {
        var oy = getComputedStyle(el).overflowY;
        if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1 &&
          (dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0)) return true;
      }
      return false;
    };
    var tick = function () {
      cur += (tgt - cur) * 0.1;
      if (Math.abs(tgt - cur) < 0.5) { cur = tgt; on = false; }
      scrollTo(0, cur);
      if (on) requestAnimationFrame(tick);
    };
    addEventListener('wheel', function (e) {
      if (e.ctrlKey || e.metaKey || e.defaultPrevented) return;
      if (box && box.classList.contains('open')) return;
      var dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
      if (Math.abs(e.deltaX) > Math.abs(dy) || inner(e.target, dy)) return;
      e.preventDefault();
      if (!on) tgt = cur = scrollY;
      tgt = Math.max(0, Math.min(maxY(), tgt + dy));
      if (!on) { on = true; requestAnimationFrame(tick); }
    }, { passive: false });
    addEventListener('scroll', function () { if (!on) tgt = cur = scrollY; }, { passive: true });
  }

  /* ── шапка: прячется при прокрутке вниз, возвращается при прокрутке вверх ── */
  var lastY = scrollY, menu = $('#menu');
  addEventListener('scroll', raf(function () {
    var y = scrollY, dy = y - lastY;
    if (y < 120 || dy < -3) html.classList.remove('hd-up');
    else if (dy > 3 && (!menu || menu.hidden)) html.classList.add('hd-up');
    lastY = y;
  }), { passive: true });

  /* ── тон фона по разделу, который сейчас посередине экрана ── */
  var zones = $$('[data-bg]');
  var tone = raf(function () {
    var mid = innerHeight * 0.55, t = null;
    for (var i = 0; i < zones.length; i++) {
      var r = zones[i].getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) t = zones[i].dataset.bg;
    }
    if (t && html.dataset.tone !== t) html.dataset.tone = t;
  });
  if (zones.length) { addEventListener('scroll', tone, { passive: true }); addEventListener('resize', tone); tone(); }

  /* ── движение по прокрутке: пара видео растёт, коллаж плывёт, обжарка приближается, кадры едут в рамках ── */
  var duo = $('.duo'), fl = $$('.fl figure'), wides = $$('.roast .wide'), pxs = $$('.px');
  var move = raf(function () {
    var H = innerHeight;
    if (duo) {
      var r = duo.getBoundingClientRect();
      var k = Math.min(1, Math.max(0, -r.top / (r.height - H)));
      duo.style.setProperty('--k', (1 - Math.pow(1 - k, 2)).toFixed(3));
    }
    if (still) return;
    fl.forEach(function (f) {
      var s = +f.dataset.s || 0, r = f.parentNode.getBoundingClientRect();
      var p = (H - r.top) / (H + r.height);
      f.style.transform = 'translate3d(0,' + (-(p - 0.5) * s * H * 0.9).toFixed(1) + 'px,0)';
    });
    wides.forEach(function (w) {
      var r = w.getBoundingClientRect(), p = Math.min(1, Math.max(0, (H - r.top) / (H + r.height)));
      w.style.setProperty('--z', (1.14 - 0.14 * p).toFixed(4));
    });
    pxs.forEach(function (f) {
      var r = f.getBoundingClientRect();
      if (r.bottom < -50 || r.top > H + 50) return;
      var p = (H - r.top) / (H + r.height) - 0.5;      // от −0.5 (снизу) до 0.5 (ушёл вверх)
      f.style.setProperty('--py', (-p * r.height * 0.12).toFixed(1) + 'px');
    });
  });
  addEventListener('scroll', move, { passive: true }); addEventListener('resize', move); move();

  /* ── плейлист: обложка у курсора; кнопка честно говорит, что плейлист выдуман ── */
  var cover = $('.cover'), mqs = $('.mqs');
  if (cover && mqs && fine) {
    var ci = $('img', cover), curSrc = '';
    mqs.addEventListener('mousemove', function (e) {
      var t = e.target.closest('.tr');
      cover.style.left = e.clientX + 'px'; cover.style.top = e.clientY + 'px';
      if (!t) { cover.classList.remove('on'); return; }
      var src = BASE + 'img/pl-' + t.dataset.c + '.jpg?v=' + html.dataset.v;
      if (src !== curSrc) { ci.src = src; curSrc = src; }
      cover.classList.add('on');
    });
    mqs.addEventListener('mouseleave', function () { cover.classList.remove('on'); });
  } else if (cover && mqs) {
    // на телефоне наведения нет: обложка появляется по нажатию на слово и сама гаснет
    var ti = $('img', cover), tt = 0;
    mqs.addEventListener('click', function (e) {
      var t = e.target.closest('.tr'); if (!t) return;
      var r = cover.offsetWidth / 2 + 12;
      cover.style.left = Math.min(Math.max(e.clientX, r), innerWidth - r) + 'px';
      cover.style.top = Math.min(Math.max(e.clientY - r, r + 60), innerHeight - r) + 'px';
      ti.src = BASE + 'img/pl-' + t.dataset.c + '.jpg?v=' + html.dataset.v;
      cover.classList.add('on'); clearTimeout(tt);
      tt = setTimeout(function () { cover.classList.remove('on'); }, 1800);
    });
    addEventListener('scroll', function () { cover.classList.remove('on'); }, { passive: true });
  }
  $$('[data-pl]').forEach(function (b) { b.addEventListener('click', function () { var n = $('.pl-note'); if (n) n.hidden = false; }); });

  /* ── рассылка: ничего не отправляем ── */
  $$('[data-news]').forEach(function (f) {
    f.addEventListener('submit', function (e) { e.preventDefault(); $('input', f).value = ''; $('.said', f).hidden = false; });
  });

  /* ── меню на телефоне ── */
  var burger = $('.burger');
  if (burger && menu) burger.addEventListener('click', function () {
    var o = menu.hidden; menu.hidden = !o; burger.setAttribute('aria-expanded', o);
  });
  // пункт меню закрывает меню: иначе якорь на этой же странице прокручивает страницу под закрытым экраном меню
  if (burger && menu) menu.addEventListener('click', function (e) {
    if (e.target.closest('a[href]')) { menu.hidden = true; burger.setAttribute('aria-expanded', false); html.classList.remove('hd-up'); }
  });

  /* ── кофейни на главной: строка раскрывается в ленту фото, ленту можно тянуть мышью ── */
  $$('.ex').forEach(function (ex) {
    var b = $('.row', ex);
    b.addEventListener('click', function () {
      var open = !ex.classList.contains('open');
      $$('.ex.open').forEach(function (o) { if (o !== ex) { o.classList.remove('open'); $('.row', o).setAttribute('aria-expanded', 'false'); } });
      ex.classList.toggle('open', open); b.setAttribute('aria-expanded', open);
    });
  });
  $$('[data-drag]').forEach(function (d) {
    var st = null, moved = false;
    d.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.target.closest('a,button')) return;
      st = { x: e.clientX, l: d.scrollLeft }; moved = false; d.classList.add('grabbing'); d.setPointerCapture(e.pointerId);
    });
    d.addEventListener('pointermove', function (e) {
      if (!st) return; var dx = e.clientX - st.x; if (Math.abs(dx) > 4) moved = true; d.scrollLeft = st.l - dx;
    });
    var end = function () { st = null; d.classList.remove('grabbing'); };
    d.addEventListener('pointerup', end); d.addEventListener('pointercancel', end);
    d.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  });

  /* ── корзина ── */
  var C = D.cart || {};
  var KEY = 'demo-cart', FREE = 2500, SHIP = 290;
  var cart = [];
  try { cart = JSON.parse(store(KEY) || '[]') || []; } catch (e) { cart = []; }
  cart = cart.filter(function (x) { return C[x.id]; });
  var GR = { z: ['в зёрнах', 'whole bean'], e: ['под эспрессо', 'espresso grind'], f: ['под фильтр', 'filter grind'], t: ['под турку', 'cezve grind'] };
  function base(id, w) { var p = C[id][2]; return w === 1000 ? Math.round(p * 3.4 / 10) * 10 : p; }
  function price(x) { return base(x.id, x.w) * (x.s ? 0.9 : 1); }
  function wname(w) { return w === 1000 ? T('1 кг', '1 kg') : w === 750 ? T('3 × 250 г', '3 × 250 g') : T('250 г', '250 g'); }
  function save() { store(KEY, JSON.stringify(cart)); renderCart(); }
  function add(it) {
    var o = cart.filter(function (x) { return x.id === it.id && x.w === it.w && x.g === it.g && !!x.s === !!it.s; })[0];
    if (o) o.q += it.q; else cart.push(it);
    save();
    $$('[data-cart-n]').forEach(function (n) { n.classList.remove('bump'); void n.offsetWidth; n.classList.add('bump'); });
  }
  function count() { return cart.reduce(function (a, x) { return a + x.q; }, 0); }
  function subtotal() { return cart.reduce(function (a, x) { return a + price(x) * x.q; }, 0); }
  function desc(x) {
    return wname(x.w) + (x.g ? ', ' + GR[x.g][lang() === 'ru' ? 0 : 1] : '') + (x.s ? ', ' + T('каждые 2 недели', 'every 2 weeks') : '');
  }
  function message() {
    var sub = subtotal(), ship = sub >= FREE ? 0 : SHIP;
    var l0 = html.classList.contains('en'); html.classList.remove('en');
    var m = 'Здравствуйте! Пишу из демо-сайта MAISON CAFÉ, хочу такой же для своего заведения. Пример заказа из корзины:\n' +
      cart.map(function (x) { return '• ' + C[x.id][0] + ', ' + desc(x) + ' × ' + x.q; }).join('\n') +
      '\nДоставка: ' + (ship ? rub(ship) : 'бесплатно') + '\nИтого: ' + rub(sub + ship);
    if (l0) html.classList.add('en');
    return m;
  }
  function renderCart() {
    $$('[data-cart-n]').forEach(function (n) { n.textContent = count(); });
    if (!box) return;
    var body = $('.body', box);
    if (!cart.length) {
      body.innerHTML = '<div class="empty"><p>' + T('Пока пусто.<br>Начнём с зерна?', 'Nothing here yet.<br>Shall we start with beans?') +
        '</p><a class="btn" href="' + BASE + 'magazin/">' + T('Магазин', 'Shop') + '</a></div>';
      return;
    }
    var sub = subtotal(), left = Math.max(0, FREE - sub), ship = left ? SHIP : 0;
    var last = cart[cart.length - 1], pid = C[last.id][4];
    var sugg = pid && !cart.some(function (x) { return x.id === pid; }) ? pid : null;
    body.innerHTML =
      '<div class="ship">' + (left ? T('До бесплатной доставки ', 'Free delivery in ') + rub(left) : T('Доставка по Москве бесплатно', 'Free delivery in Moscow')) +
      '<div class="tr2"><i style="width:' + Math.min(100, sub / FREE * 100).toFixed(1) + '%"></i></div></div>' +
      '<ul>' + cart.map(function (x, i) {
        return '<li><img src="' + BASE + 'img/b-' + x.id + '.jpg?v=' + html.dataset.v + '" alt=""><span><b>' + C[x.id][lang() === 'ru' ? 0 : 1] + '</b><small>' +
          desc(x) + ' · ' + rub(price(x)) + (x.s ? ' <em>−10%</em>' : '') + '</small></span>' +
          '<span class="q"><button type="button" data-q="' + i + '" data-d="-1" aria-label="−">−</button><span>' + x.q + '</span>' +
          '<button type="button" data-q="' + i + '" data-d="1" aria-label="+">+</button></span></li>';
      }).join('') + '</ul>' +
      (sugg ? '<div class="sugg"><img src="' + BASE + 'img/b-' + sugg + '.jpg?v=' + html.dataset.v + '" alt=""><span><small>' + T('К этому сорту берут', 'Goes well with') +
        '</small><b>' + C[sugg][lang() === 'ru' ? 0 : 1] + '</b><small>250 ' + T('г', 'g') + ' · ' + rub(C[sugg][2]) + '</small></span>' +
        '<button type="button" data-sugg="' + sugg + '">' + T('Добавить', 'Add') + '</button></div>' : '') +
      '<div class="sumrow"><span>' + T('Товары', 'Items') + '</span><span>' + rub(sub) + '</span></div>' +
      '<div class="sumrow"><span>' + T('Доставка', 'Delivery') + '</span><span>' + (ship ? rub(ship) : T('бесплатно', 'free')) + '</span></div>' +
      '<div class="sum"><span>' + T('Итого', 'Total') + '</span><span>' + rub(sub + ship) + '</span></div>' +
      '<a class="go" target="_blank" rel="noopener" href="' + TG + '?text=' + encodeURIComponent(message()) + '">' +
      T('Оформить в телеграм ↗', 'Check out in Telegram ↗') + '</a>' +
      '<p class="fine2">' + T('Это демо: заказ не создаётся, откроется чат студии MERIDIAN с примером заказа. Цены демонстрационные.',
        'This is a demo: no order is placed, a chat with MERIDIAN studio opens with a sample order. Demo prices.') + '</p>';
  }
  var back = null;
  function openCart() { if (!box) return; back = document.activeElement; box.classList.add('open'); box.setAttribute('aria-hidden', 'false'); $('.x', box).focus({ preventScroll: true }); }
  function closeCart() { if (!box || !box.classList.contains('open')) return; box.classList.remove('open'); box.setAttribute('aria-hidden', 'true'); if (back) back.focus({ preventScroll: true }); }
  $$('[data-cart]').forEach(function (b) { b.addEventListener('click', openCart); });
  if (box) {
    box.addEventListener('click', function (e) {
      var q = e.target.closest('[data-q]');
      if (q) { var it = cart[+q.dataset.q]; it.q += +q.dataset.d; if (it.q < 1) cart.splice(+q.dataset.q, 1); save(); return; }
      var sg = e.target.closest('[data-sugg]');
      if (sg) { add({ id: sg.dataset.sugg, w: C[sg.dataset.sugg][3] === 's' ? 750 : 250, g: C[sg.dataset.sugg][3] === 's' ? '' : 'z', q: 1, s: false }); return; }
      if (e.target.closest('[data-close]') || e.target === box) closeCart();
    });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCart(); });
  }
  document.addEventListener('lang', renderCart);
  setLang(store('demo-lang') || 'ru');

  /* ── магазин: фильтр по линейкам ── */
  var tabs = $$('.tabs [data-f]');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (o) { o.setAttribute('aria-pressed', o === t); });
      $$('.shop .card').forEach(function (c) { c.hidden = t.dataset.f !== 'all' && c.dataset.line !== t.dataset.f; });
    });
  });

  /* ── страница сорта ── */
  var pdp = $('.pdp');
  if (pdp) {
    var id = pdp.dataset.id, set = C[id][3] === 's';
    var st = { id: id, w: set ? 750 : 250, g: set ? '' : 'z', q: 1, s: false };
    var upd = function () {
      $$('.seg [data-w]').forEach(function (b) { b.setAttribute('aria-pressed', +b.dataset.w === st.w); });
      $$('.seg [data-g]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.g === st.g); });
      $$('.seg [data-s]').forEach(function (b) { b.setAttribute('aria-pressed', (b.dataset.s === '1') === st.s); });
      $$('[data-rc]').forEach(function (r) { r.hidden = r.dataset.rc !== st.g; });
      $$('[data-qty]').forEach(function (n) { n.textContent = st.q; });
      $$('[data-price]').forEach(function (n) {
        n.textContent = rub(price(st) * st.q) + (st.s ? T(' раз в две недели', ' every two weeks') : '');
      });
    };
    $$('.seg [data-w]').forEach(function (b) { b.addEventListener('click', function () { st.w = +b.dataset.w; upd(); }); });
    $$('.seg [data-g]').forEach(function (b) { b.addEventListener('click', function () { st.g = b.dataset.g; upd(); }); });
    $$('.seg [data-s]').forEach(function (b) { b.addEventListener('click', function () { st.s = b.dataset.s === '1'; upd(); }); });
    $$('.qty [data-d]').forEach(function (b) { b.addEventListener('click', function () { st.q = Math.max(1, Math.min(20, st.q + +b.dataset.d)); upd(); }); });
    $$('[data-add]').forEach(function (b) {
      b.addEventListener('click', function () {
        add({ id: st.id, w: st.w, g: st.g, q: st.q, s: st.s });
        $$('[data-add]').forEach(function (o) { o.classList.add('done'); });
        clearTimeout(b._t); b._t = setTimeout(function () { $$('[data-add]').forEach(function (o) { o.classList.remove('done'); }); }, 1800);
        setTimeout(openCart, 650);
      });
    });
    document.addEventListener('lang', upd);
    upd();

    // дата обжарки: обжариваем по вторникам; считаем по московскому времени
    var roast = function () {
      var now = new Date(Date.now() + 3 * 3600e3), dow = now.getUTCDay(), back = (dow - 2 + 7) % 7;
      var d = new Date(now.getTime() - back * 86400e3);
      var M = lang() === 'ru' ? ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
        : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      var date = lang() === 'ru' ? d.getUTCDate() + ' ' + M[d.getUTCMonth()] : M[d.getUTCMonth()] + ' ' + d.getUTCDate();
      var t = back === 0 ? T('Обжарено сегодня, ', 'Roasted today, ') + date : T('Обжарено во вторник, ', 'Roasted on Tuesday, ') + date;
      t += T('. Отправим завтра утром', '. Ships tomorrow morning');
      $$('[data-roast]').forEach(function (n) { n.textContent = t; });
    };
    roast(); document.addEventListener('lang', roast);

    // телефон: листание фото пальцем и точки, липкая плашка покупки, пока панель покупки не видна
    var gal = $('[data-gal]'), dots = $$('.gdots i');
    if (gal) gal.addEventListener('scroll', raf(function () {
      var k = Math.round(gal.scrollLeft / Math.max(1, gal.clientWidth));
      dots.forEach(function (d, i) { d.classList.toggle('on', i === k); });
    }), { passive: true });
    var mbar = $('.mbar'), addrow = $('.addrow'), foot = $('.foot');
    if (mbar && addrow && 'IntersectionObserver' in window) {
      var seen = { a: true, f: false };
      var sync = function () { mbar.classList.toggle('show', !seen.a && !seen.f && scrollY > 200); };
      new IntersectionObserver(function (es) { es.forEach(function (e) { seen[e.target === addrow ? 'a' : 'f'] = e.isIntersecting; }); sync(); })
        .observe(addrow);
      if (foot) new IntersectionObserver(function (es) { seen.f = es[0].isIntersecting; sync(); }).observe(foot);
      addEventListener('scroll', raf(function () {   // прыжок прокрутки мимо панели наблюдатель не замечает: досчитываем сами
        var r = addrow.getBoundingClientRect(); seen.a = r.bottom > 0 && r.top < innerHeight; sync();
      }), { passive: true });
    }
  }

  /* ── кофейни: своя карта (SVG из OpenStreetMap), перетаскивание, масштаб, точки ── */
  var mb = $('#map'), SP = D.spots;
  if (mb && SP) {
    var layer = document.createElement('div'); layer.className = 'layer'; mb.prepend(layer);
    var view = { s: 1, x: 0, y: 0 }, MW = 2400, MH = 1, bb = null, pins = [];
    fetch(mb.dataset.src).then(function (r) { return r.text(); }).then(function (t) {
      layer.innerHTML = t;
      var svg = $('svg', layer); bb = svg.getAttribute('data-bbox').split(',').map(Number);
      MW = +svg.getAttribute('width'); MH = +svg.getAttribute('height');
      pins = SP.map(function (s, i) {
        var p = document.createElement('button'); p.type = 'button'; p.className = 'pin'; p.setAttribute('aria-label', s[0]);
        p.innerHTML = '<i>' + s[lang() === 'ru' ? 0 : 1] + '</i>';
        p.addEventListener('click', function () { pick(i, false); });
        mb.appendChild(p); return p;
      });
      fit();
      var h = parseInt((location.hash || '').slice(1), 10);
      pick(h >= 0 && h < SP.length ? h : 0, true);
    });
    var toPx = function (la, lo) { return [(lo - bb[1]) / (bb[3] - bb[1]) * MW, (bb[2] - la) / (bb[2] - bb[0]) * MH]; };
    var minS = function () { return Math.max(mb.clientWidth / MW, mb.clientHeight / MH); };
    var draw = function (anim) {
      var W = mb.clientWidth, H = mb.clientHeight, s = view.s;
      view.x = Math.min(0, Math.max(W - MW * s, view.x)); view.y = Math.min(0, Math.max(H - MH * s, view.y));
      var tr = anim ? '.9s cubic-bezier(.22,.8,.16,1)' : '0s';
      layer.style.transition = 'transform ' + tr;
      layer.style.transform = 'translate(' + view.x + 'px,' + view.y + 'px) scale(' + s + ')';
      pins.forEach(function (p, i) {
        var q = toPx(SP[i][2], SP[i][3]);
        p.style.transition = 'left ' + tr + ', top ' + tr + ', transform .3s';
        p.style.left = (view.x + q[0] * s) + 'px'; p.style.top = (view.y + q[1] * s) + 'px';
      });
    };
    var fit = function () { view.s = Math.max(minS(), 0.5); draw(false); };
    var centerOn = function (la, lo, anim) { var q = toPx(la, lo); view.x = mb.clientWidth / 2 - q[0] * view.s; view.y = mb.clientHeight / 2 - q[1] * view.s; draw(anim); };
    var zoom = function (k, cx, cy) {
      var s0 = view.s, s1 = Math.min(2.4, Math.max(minS(), s0 * k));
      cx = cx === undefined ? mb.clientWidth / 2 : cx; cy = cy === undefined ? mb.clientHeight / 2 : cy;
      view.x = cx - (cx - view.x) * s1 / s0; view.y = cy - (cy - view.y) * s1 / s0; view.s = s1; draw(true);
    };
    var pick = function (i, quiet) {
      pins.forEach(function (p, j) { p.classList.toggle('on', j === i); });
      $$('.spots li').forEach(function (li) {
        var b = $('button', li), me = +b.dataset.i === i;
        li.classList.toggle('on', me);
        if (me) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      });
      if (view.s < 0.9) view.s = 0.9;
      centerOn(SP[i][2], SP[i][3], !quiet);
    };
    $$('.spots button').forEach(function (b) { b.addEventListener('click', function () { pick(+b.dataset.i); }); });
    $$('[data-z]', mb).forEach(function (b) { b.addEventListener('click', function () { zoom(b.dataset.z === '1' ? 1.4 : 1 / 1.4); }); });
    mb.addEventListener('wheel', function (e) {
      if (!(e.ctrlKey || e.metaKey)) return;   // как у референса: масштаб колесом только с ⌘ или Ctrl, страница прокручивается
      e.preventDefault(); var r = mb.getBoundingClientRect(); zoom(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });
    var drag = null;
    mb.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button')) return;
      drag = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y }; mb.classList.add('grab'); mb.setPointerCapture(e.pointerId);
    });
    mb.addEventListener('pointermove', function (e) { if (!drag) return; view.x = drag.vx + e.clientX - drag.x; view.y = drag.vy + e.clientY - drag.y; draw(false); });
    mb.addEventListener('pointerup', function () { drag = null; mb.classList.remove('grab'); });
    addEventListener('resize', function () { if (bb) draw(false); });
    document.addEventListener('lang', function () { pins.forEach(function (p, i) { $('i', p).textContent = SP[i][lang() === 'ru' ? 0 : 1]; }); });
    var q = $('.find .q');
    if (q) q.addEventListener('input', function () {
      var v = q.value.trim().toLowerCase();
      $$('.spots li').forEach(function (li) { li.hidden = v && li.textContent.toLowerCase().indexOf(v) < 0; });
    });
  }
})();

/* ── демо: подсказки, статус по часам, фильтр доски ── */
(function () {
  var toast = document.querySelector('.toast'), tt = 0;
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-hint]'); if (!b || !toast) return;
    toast.textContent = b.dataset.hint; toast.hidden = false;
    clearTimeout(tt); tt = setTimeout(function () { toast.hidden = true; }, 3600);
  });
  var TZ = +(document.documentElement.dataset.tz || 3);   // часовой пояс заведения от UTC (Москва 3, Калининград 2, Томск 7)
  function now() { var d = new Date(Date.now() + TZ * 3600e3); return { h: d.getUTCHours() + d.getUTCMinutes() / 60, we: d.getUTCDay() === 0 || d.getUTCDay() === 6, sun: d.getUTCDay() === 0 }; }
  function hm(v) { if (v === 24) return "24:00"; v = v % 24; var h = Math.floor(v), m = Math.round((v - h) * 60); if (m === 60) { h++; m = 0; } return h + ':' + (m < 10 ? '0' : '') + m; }
  function hrs(s, t) {
    var o = +((t.sun && s.dataset.openSun) || (t.we && s.dataset.openWe) || s.dataset.open), c = +((t.sun && s.dataset.closeSun) || (t.we && s.dataset.closeWe) || s.dataset.close);   // data-open-sun: своё воскресенье
    return { o: o, c: c, on: c > o ? t.h >= o && t.h < c : t.h >= o || t.h < c };   // c < o: работают после полуночи
  }
  function paint() {
    var t = now(), any = null;
    document.querySelectorAll('.st').forEach(function (s) {
      var x = hrs(s, t);
      if (x.o === 0 && x.c === 24) x.on = true;
      s.className = 'st ' + (x.on ? 'on' : 'off');
      s.textContent = x.o === 0 && x.c === 24 ? 'открыто круглосуточно' : x.on ? 'открыто до ' + hm(x.c) : (t.h < x.o ? 'закрыто, откроемся в ' + hm(x.o) : 'закрыто, завтра с утра');
      if (x.on) any = true; else if (any === null) any = false;
    });
    var n = document.querySelector('[data-now]');
    if (n && any !== null) n.textContent = any ? 'Сейчас открыто' : 'Сейчас закрыто';
  }
  paint(); setInterval(paint, 60000);
  document.querySelectorAll('.board .flt').forEach(function (f) {
    var bs = f.querySelectorAll('button');
    bs.forEach(function (b) {
      b.addEventListener('click', function () {
        bs.forEach(function (o) { o.setAttribute('aria-pressed', o === b); });
        f.parentNode.querySelectorAll('.lot').forEach(function (l) { l.hidden = b.dataset.f !== 'all' && l.dataset.f !== b.dataset.f; });
      });
    });
  });
})();
