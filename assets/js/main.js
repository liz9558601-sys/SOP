/* shared site JS — loaded on every page */
(() => {
  'use strict';

  /* ============ scroll: nav shadow + progress + totop ============ */
  const nav = document.getElementById('nav');
  const prog = document.getElementById('prog');
  const totop = document.getElementById('totop');
  const onScroll = () => {
    if (nav) nav.classList.toggle('stuck', scrollY > 10);
    if (prog) {
      const h = document.documentElement.scrollHeight - innerHeight;
      prog.style.width = (h > 0 ? (scrollY / h * 100) : 0) + '%';
    }
    if (totop) totop.classList.toggle('on', scrollY > innerHeight * 0.8);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (totop) totop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  /* ============ mobile menu ============ */
  const burger = document.getElementById('burger');
  const mmenu = document.getElementById('mmenu');
  if (burger && mmenu) {
    const setMenu = (on) => {
      burger.classList.toggle('on', on);
      mmenu.classList.toggle('on', on);
      document.body.classList.toggle('locked', on);
      burger.setAttribute('aria-expanded', String(on));
      burger.setAttribute('aria-label', on ? '关闭菜单' : '打开菜单');
    };
    burger.addEventListener('click', () => setMenu(!mmenu.classList.contains('on')));
    mmenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  }

  /* ============ reveal ============ */
  const io = new IntersectionObserver(es => {
    es.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: .12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.rv').forEach((el, i) => {
    el.style.transitionDelay = (Math.min(i % 6, 5) * 55) + 'ms';
    io.observe(el);
  });

  /* ============ toast + clipboard ============ */
  const toast = document.getElementById('toast');
  let tt;
  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('on');
    clearTimeout(tt);
    tt = setTimeout(() => toast.classList.remove('on'), 1800);
  };
  async function copyText(t, btn) {
    try {
      if (navigator.clipboard && isSecureContext) {
        await navigator.clipboard.writeText(t);
      } else {
        const ta = document.createElement('textarea');
        ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); ta.remove();
      }
      if (btn) {
        const o = btn.textContent;
        btn.textContent = '已复制';
        btn.classList.add('done');
        setTimeout(() => { btn.textContent = o; btn.classList.remove('done'); }, 1400);
      }
      showToast('已复制到剪贴板');
    } catch { showToast('复制失败，请手动选择'); }
  }

  /* ============ step prompt copy (process page) ============ */
  document.querySelectorAll('.copy[data-copy]').forEach(b => {
    b.addEventListener('click', () => {
      const el = document.getElementById(b.dataset.copy);
      if (el) copyText(el.textContent.trim(), b);
    });
  });

  /* ============ card copy + expand (library page) ============ */
  document.querySelectorAll('.card').forEach(card => {
    const pre = card.querySelector('pre'),
      btn = card.querySelector('.copy'),
      more = card.querySelector('.more');
    if (btn) btn.addEventListener('click', () => copyText(pre.textContent.trim(), btn));
    if (more) more.addEventListener('click', () => {
      const open = card.classList.toggle('open');
      more.textContent = open ? '收起' : '展开';
    });
  });

  /* ============ pbox expand (process page step cards) ============ */
  document.querySelectorAll('.pbox').forEach(box => {
    const pre = box.querySelector('pre');
    const more = box.querySelector('.pbox__more');
    if (!more || !pre) return;
    if (pre.scrollHeight <= pre.clientHeight + 4) { more.remove(); return; }
    more.addEventListener('click', () => {
      const open = box.classList.toggle('open');
      more.textContent = open ? '收起全文' : '展开全文';
    });
  });

  /* ============ library: filters + bulk copy ============ */
  const fbar = document.getElementById('filters');
  const bulk = document.getElementById('bulk');
  const allCards = [...document.querySelectorAll('#cards .card')];
  if (fbar && allCards.length) {
    const visible = () => allCards.filter(c => !c.hidden);
    const syncBulk = () => { if (bulk) bulk.textContent = `复制当前 ${visible().length} 条`; };
    fbar.addEventListener('click', e => {
      const b = e.target.closest('button[data-f]'); if (!b) return;
      fbar.querySelectorAll('button[data-f]').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      const f = b.dataset.f;
      allCards.forEach(c => { c.hidden = !(f === 'all' || c.dataset.k === f); });
      syncBulk();
    });
    if (bulk) {
      bulk.addEventListener('click', async () => {
        const list = visible();
        if (!list.length) { showToast('当前没有可复制的提示词'); return; }
        const text = list.map(c => {
          const id = c.querySelector('.card__id').textContent.trim();
          const title = c.querySelector('h4').textContent.trim();
          const body = c.querySelector('pre').textContent.trim();
          return `【${id} · ${title}】\n${body}`;
        }).join('\n\n' + '—'.repeat(28) + '\n\n');
        await copyText(text, bulk);
        const o = bulk.textContent;
        bulk.textContent = `已复制 ${list.length} 条`;
        setTimeout(() => { bulk.textContent = o; }, 1600);
      });
    }
    syncBulk();
  }

  /* ============ process: sticky step index ============ */
  const steps = [...document.querySelectorAll('.step')];
  const navBtns = [...document.querySelectorAll('#procNav button')];
  if (navBtns.length && steps.length) {
    navBtns.forEach(b => b.addEventListener('click', () => {
      const idx = +b.dataset.i;
      if (steps[idx]) steps[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }));
    const sio = new IntersectionObserver(es => {
      es.forEach(e => {
        if (e.isIntersecting) {
          const i = steps.indexOf(e.target);
          navBtns.forEach((b, n) => b.classList.toggle('on', n === i));
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    steps.forEach(s => sio.observe(s));
  }

})();