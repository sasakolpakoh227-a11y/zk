/* печати поворачиваются от прокрутки */
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var s = [].slice.call(document.querySelectorAll('.sl-stamp,.sl-pm')), raf = 0;
  function f() { raf = 0; var y = scrollY; s.forEach(function (e, i) { e.style.transform = 'rotate(' + (y * (i % 2 ? -.12 : .16)) + 'deg)'; }); }
  addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(f); }, { passive: true }); f();
})();
