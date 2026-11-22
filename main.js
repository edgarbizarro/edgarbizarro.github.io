(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- reveals ---------- */
  const items = $$('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach((el) => io.observe(el));
  }

  /* ---------- hero: pointer glow on the dot grid ---------- */
  const hero = $('.hero');
  if (hero && !reduce && matchMedia('(pointer: fine)').matches) {
    let raf = 0, mx = 0, my = 0;
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      mx = e.clientX - r.left; my = e.clientY - r.top;
      if (!raf) raf = requestAnimationFrame(() => {
        hero.style.setProperty('--mx', mx + 'px'); hero.style.setProperty('--my', my + 'px'); raf = 0;
      });
    });
  }

  /* ---------- terminal ---------- */
  const out = $('#out'), form = $('#prompt'), input = $('#cmd'), term = $('#term');
  if (out && form && input) {
    const intro = [...out.children];
    let skipped = false;
    const toEnd = () => { out.scrollTop = out.scrollHeight; };

    const add = (html, cls = '') => {
      const d = document.createElement('div');
      d.className = 'ln ' + cls;
      d.innerHTML = html;
      out.append(d); toEnd();
      return d;
    };
    const echo = (text) => {
      const d = document.createElement('div');
      d.className = 'ln';
      const ps = document.createElement('span'); ps.className = 'ps'; ps.textContent = '$';
      d.append(ps, ' ' + text);
      out.append(d);
    };
    const link = (href, text) => `<a href="${href}" target="_blank" rel="noopener">${text}</a>`;
    const row = (name, desc) => add(`<span class="n">${name}</span>  <span class="muted">${desc}</span>`);

    const commands = {
      help() {
        add('Comandos disponíveis:');
        row('projetos ', 'lista os projetos em destaque');
        row('stack    ', 'tecnologias que uso');
        row('sobre    ', 'um resumo do meu trabalho');
        row('contato  ', 'e-mail, LinkedIn e GitHub');
        row('clear    ', 'limpa o terminal');
      },
      projetos() {
        add(`${link('https://github.com/edgarbizarro/fin_control', 'fin_control')}  <span class="muted">gestão financeira com Laravel e React</span>`);
        add(`${link('https://github.com/edgarbizarro/walletw', 'walletw')}      <span class="muted">carteira digital com transferências e estorno</span>`);
        add(`${link('https://github.com/edgarbizarro/spagc', 'spagc')}        <span class="muted">API de promoções regionais</span>`);
        add(`${link('https://github.com/edgarbizarro/rust_api', 'rust_api')}     <span class="muted">API REST em Rust com JWT</span>`);
        add('<span class="muted">Veja também a seção abaixo, que mostra onde cada um atua.</span>');
      },
      stack() {
        row('back-end ', 'PHP, Laravel, Livewire, Rust, Python');
        row('front-end', 'React, TypeScript, Inertia, Tailwind');
        row('dados    ', 'Power BI, Python, Apache Superset, Redash');
        row('infra    ', 'MySQL, PostgreSQL, SQLite, Docker');
      },
      sobre() {
        add('Desenvolvedor full stack. Atuo em aplicações web, integração de APIs e automação de processos, com base em análise de dados.');
      },
      contato() {
        add(`e-mail    ${link('mailto:edgar.h.bizarro@gmail.com', 'edgar.h.bizarro@gmail.com')}`);
        add(`linkedin  ${link('https://www.linkedin.com/in/edgar-bizarro-832902104/', 'edgar-bizarro')}`);
        add(`github    ${link('https://github.com/edgarbizarro', 'edgarbizarro')}`);
      },
      clear() { out.textContent = ''; },
    };
    commands.ajuda = commands.help; commands.projects = commands.projetos; commands.about = commands.sobre; commands.contact = commands.contato;

    const history = []; let hi = 0;
    const run = async (raw) => {
      const text = raw.trim();
      if (!text) return;
      skipIntro();
      history.push(text); hi = history.length;
      const name = text.toLowerCase();
      if (name === 'clear') { commands.clear(); return; }
      echo(text);
      if (name === 'sudo contratar' || name === 'sudo hire') {
        add('<span class="muted">[sudo] senha para visitante:</span> ••••••••');
        add('<span class="s">Acesso concedido.</span> Abrindo o contato.');
        await sleep(reduce ? 0 : 900);
        $('#contato')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      } else if (commands[name] && Object.hasOwn(commands, name)) {
        commands[name]();
      } else {
        const shown = text.length > 40 ? text.slice(0, 40) + '…' : text;
        const d = document.createElement('div'); d.className = 'ln warn';
        d.textContent = `comando não encontrado: ${shown}. Digite help.`;
        out.append(d);
      }
      toEnd();
    };

    function skipIntro() {
      if (skipped) return;
      skipped = true;
      intro.forEach((l) => { l.hidden = false; });
      const c = intro[0]?.querySelector('.cmd');
      if (c) c.textContent = c.dataset.full || c.textContent;
    }

    form.addEventListener('submit', (e) => { e.preventDefault(); const v = input.value; input.value = ''; run(v); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' && history.length) { e.preventDefault(); hi = Math.max(0, hi - 1); input.value = history[hi]; }
      else if (e.key === 'ArrowDown' && history.length) { e.preventDefault(); hi = Math.min(history.length, hi + 1); input.value = history[hi] || ''; }
      else if (e.key === 'Tab') {
        const v = input.value.trim().toLowerCase();
        const m = v && Object.keys(commands).filter((k) => k.startsWith(v));
        if (m && m.length === 1) { e.preventDefault(); input.value = m[0]; }
      } else skipIntro();
    });
    $$('#chips button').forEach((b) => b.addEventListener('click', () => run(b.dataset.cmd)));
    term.addEventListener('click', (e) => { if (!e.target.closest('a, button') && !getSelection().toString()) input.focus({ preventScroll: true }); });

    // typed intro
    if (!reduce) {
      const cmdEl = intro[0].querySelector('.cmd');
      cmdEl.dataset.full = cmdEl.textContent;
      const full = cmdEl.dataset.full;
      intro.forEach((l, i) => { if (i) l.hidden = true; });
      cmdEl.textContent = '';
      (async () => {
        await sleep(900);
        for (const ch of full) { if (skipped) return; cmdEl.textContent += ch; await sleep(30); }
        await sleep(350);
        for (const l of intro.slice(1)) { if (skipped) return; l.hidden = false; toEnd(); await sleep(85); }
      })();
    }
  }

  /* ---------- flow: scroll drives one variable ---------- */
  const flow = $('.flow');
  if (flow && !reduce) {
    flow.classList.add('flow-sticky');
    const nodes = $$('.node', flow), panels = $$('.panel', flow);
    const N = nodes.length;
    let ticking = false, cur = -1;

    const progress = () => {
      const r = flow.getBoundingClientRect();
      const total = flow.offsetHeight - innerHeight;
      return Math.min(1, Math.max(0, -r.top / total));
    };
    const update = () => {
      ticking = false;
      const p = progress();
      flow.style.setProperty('--p', p.toFixed(4));
      const idx = Math.round(p * (N - 1));
      if (idx !== cur) {
        cur = idx;
        nodes.forEach((n, i) => { n.classList.toggle('on', i === idx); n.classList.toggle('done', i < idx); n.removeAttribute('aria-current'); });
        nodes[idx].setAttribute('aria-current', 'step');
        panels.forEach((pn, i) => { pn.classList.toggle('on', i === idx); pn.setAttribute('aria-hidden', i === idx ? 'false' : 'true'); });
      }
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    nodes.forEach((n, i) => n.addEventListener('click', () => {
      const top = flow.getBoundingClientRect().top + scrollY;
      const total = flow.offsetHeight - innerHeight;
      scrollTo({ top: top + (i / (N - 1)) * total + 2, behavior: 'smooth' });
    }));
    update();
  } else if (flow) {
    $$('.panel', flow).forEach((p) => p.classList.add('on'));
  }
})();
