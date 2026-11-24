/* SNP Performance – Instagram-Beiträge als Galerie, Lightbox und Story-Highlights.
   Daten: posts.json (neueste zuerst). Neue Beiträge: Eintrag in posts.json + Fotos in ig/ ablegen. */
(() => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const LOGO = 'img/logo-instagram.jpg';
  const CATS = [['Neu', null], ['Service', 'Service'], ['Innenraum', 'Innenraum'], ['Tech', 'Tech'], ['Custom', 'Custom']];
  let POSTS = [];

  const lock = on => { document.documentElement.style.overflow = on ? 'hidden' : ''; };

  /* ---------- Lightbox ---------- */
  const lb = document.createElement('div');
  lb.id = 'lb'; lb.setAttribute('data-lenis-prevent', ''); lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
  document.body.appendChild(lb);
  let cur = null, idx = 0;
  const drawLb = () => {
    const p = cur, im = p.imgs[idx];
    lb.innerHTML = `<button class="x" aria-label="Schliessen">×</button><div class="in">
      <div><div class="main"><img src="${esc(im)}" alt="${esc(p.title)} – Foto ${idx + 1}">
        ${p.imgs.length > 1 ? `<button class="p" aria-label="Vorheriges Foto">‹</button><button class="n" aria-label="Nächstes Foto">›</button><span class="cnt">${idx + 1} / ${p.imgs.length}</span>` : ''}</div>
        <div class="thumbs">${p.imgs.map((s, i) => `<img src="${esc(s)}" alt="" data-i="${i}" class="${i === idx ? 'on' : ''}" loading="lazy">`).join('')}</div></div>
      <div class="side"><span class="k">${esc(p.cat)}</span><h3>${esc(p.title)}</h3><span class="d">${esc(p.date)}</span>
        <p class="t">${esc(p.text)}</p>
        <div class="acts"><a class="btn red" href="#kontakt" data-lbclose>Ähnliches anfragen</a><a class="btn ghost" href="https://www.instagram.com/p/${esc(p.id)}/" target="_blank" rel="noopener">Auf Instagram</a></div></div></div>`;
  };
  const openLb = (id, i = 0) => { cur = POSTS.find(p => p.id === id); if (!cur) return false; idx = i; drawLb(); lb.classList.add('open'); lock(true); lb.scrollTop = 0; return true; };
  const closeLb = () => { lb.classList.remove('open'); lock(false); };
  const step = d => { if (!cur) return; idx = (idx + d + cur.imgs.length) % cur.imgs.length; drawLb(); };
  lb.addEventListener('click', e => {
    if (e.target.closest('.x') || e.target === lb) return closeLb();
    if (e.target.closest('[data-lbclose]')) return closeLb();
    if (e.target.closest('.main .p')) return step(-1);
    if (e.target.closest('.main .n')) return step(1);
    const t = e.target.closest('.thumbs img'); if (t) { idx = +t.dataset.i; drawLb(); }
  });
  let sx = 0;
  lb.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, {passive: true});
  lb.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50 && e.target.closest('.main')) step(dx < 0 ? 1 : -1); });

  /* ---------- Story-Viewer ---------- */
  const st = document.createElement('div');
  st.id = 'story'; st.setAttribute('data-lenis-prevent', ''); st.setAttribute('role', 'dialog'); st.setAttribute('aria-modal', 'true');
  document.body.appendChild(st);
  let slides = [], si = 0, timer = null, label = '';
  const DUR = 4500;
  const showSlide = () => {
    clearTimeout(timer);
    const s = slides[si];
    st.innerHTML = `<div class="frame"><img src="${esc(s.img)}" alt="${esc(s.title)}">
      <div class="bars">${slides.map((_, i) => `<i><b style="width:${i < si ? 100 : 0}%"></b></i>`).join('')}</div>
      <div class="top"><img src="${LOGO}" alt="">snp.performance <span>${esc(label)} · ${esc(s.date)}</span><button class="x" aria-label="Schliessen">×</button></div>
      <button class="nav p" aria-label="Zurück"></button><button class="nav n" aria-label="Weiter"></button>
      <div class="cap"><b>${esc(s.title)}</b><br><a href="#" data-post="${esc(s.id)}">Ganzen Beitrag ansehen →</a></div></div>`;
    const bar = st.querySelectorAll('.bars b')[si];
    if (bar && bar.animate) bar.animate([{width: '0%'}, {width: '100%'}], {duration: DUR, fill: 'forwards'});
    timer = setTimeout(() => go(1), DUR);
    if (slides[si + 1]) { const pre = new Image(); pre.src = slides[si + 1].img; }
  };
  const go = d => { si += d; if (si < 0) si = 0; if (si >= slides.length) return closeSt(); showSlide(); };
  const openSt = (list, name, btn) => { slides = list; si = 0; label = name; st.classList.add('open'); lock(true); showSlide(); btn && btn.classList.add('seen'); };
  const closeSt = () => { clearTimeout(timer); st.classList.remove('open'); st.innerHTML = ''; lock(false); };
  st.addEventListener('click', e => {
    if (e.target.closest('.x') || e.target === st) return closeSt();
    if (e.target.closest('.nav.p')) return go(-1);
    if (e.target.closest('.nav.n')) return go(1);
    const a = e.target.closest('[data-post]'); if (a) { e.preventDefault(); const id = a.dataset.post; closeSt(); openLb(id); }
  });
  let ty = 0;
  st.addEventListener('touchstart', e => { ty = e.touches[0].clientY; }, {passive: true});
  st.addEventListener('touchend', e => { if (e.changedTouches[0].clientY - ty > 90) closeSt(); });
  addEventListener('keydown', e => {
    if (st.classList.contains('open')) { if (e.key === 'Escape') closeSt(); if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); }
    else if (lb.classList.contains('open')) { if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); }
  });

  /* ---------- Aufbau ---------- */
  const build = () => {
    /* Story-Highlights über dem Instagram-Raster */
    const groups = CATS.map(([name, cat]) => {
      const ps = cat ? POSTS.filter(p => p.cat === cat) : POSTS.slice(0, 2);
      const list = ps.flatMap(p => p.imgs.slice(0, cat ? 3 : 6).map(img => ({img, id: p.id, title: p.title, date: p.date}))).slice(0, 14);
      return {name, list};
    }).filter(g => g.list.length);
    const hl = document.createElement('div');
    hl.className = 'hl'; hl.setAttribute('aria-label', 'Story-Highlights');
    hl.innerHTML = groups.map((g, i) => `<button type="button" data-g="${i}"><span class="ring"><img src="${esc(g.list[0].img)}" alt="" loading="lazy"></span>${esc(g.name)}</button>`).join('');
    hl.addEventListener('click', e => { const b = e.target.closest('button'); if (b) openSt(groups[+b.dataset.g].list, groups[+b.dataset.g].name, b); });
    const ig = $('#ig'); if (ig) ig.parentElement.insertBefore(hl, ig);

    /* Instagram-Raster: neueste 6 Beiträge, falls kein Live-Feed läuft */
    const live = ig && [...ig.querySelectorAll('img')].some(i => !/^img\/|\/img\//.test(i.getAttribute('src') || ''));
    if (ig && !live) ig.innerHTML = POSTS.slice(0, 6).map(p => `<a href="https://www.instagram.com/p/${esc(p.id)}/" data-post="${esc(p.id)}"><img loading="lazy" src="${esc(p.imgs[0])}" alt="${esc(p.title)}"><span class="cap">${esc(p.title)}</span>${p.imgs.length > 1 ? `<span class="vid" aria-hidden="true">${p.imgs.length}</span>` : ''}</a>`).join('');

    /* Projekt-Log: echte Titelbilder */
    document.querySelectorAll('.job[href*="/p/"]').forEach(a => {
      const id = (a.getAttribute('href').match(/\/p\/([^/]+)/) || [])[1], p = POSTS.find(x => x.id === id);
      if (!p) return;
      a.dataset.post = id;
      const pic = a.querySelector('.pic'), big = pic && pic.querySelector('.big, img');
      if (big) { const img = document.createElement('img'); img.loading = 'lazy'; img.src = p.imgs[0]; img.alt = p.title; big.replaceWith(img); }
      const go = a.querySelector('.go'); if (go) go.textContent = `${p.imgs.length} Fotos ansehen →`;
    });
    if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 300);
  };

  /* Klicks auf Beiträge öffnen die Lightbox statt Instagram */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-post]');
    if (!a || a.closest('#story')) return;
    if (openLb(a.dataset.post)) e.preventDefault();
  }, true);

  const start = () => fetch('posts.json').then(r => r.json()).then(d => { POSTS = d; build(); }).catch(() => {});
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', () => setTimeout(start, 50)); else setTimeout(start, 50);
})();
