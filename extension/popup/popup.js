// Popup launcher. External file on purpose: MV3 forbids inline scripts.
(async () => {
  const api = typeof browser !== 'undefined' ? browser : chrome;
  const appUrl = (hash) => api.runtime.getURL('app/index.html') + (hash || '');
  const open = async (hash) => { await api.tabs.create({ url: appUrl(hash) }); window.close(); };

  const data = await (await fetch('tools.json')).json();
  const { tools, groups } = data;
  document.getElementById('count').textContent = `${tools.length} tools · offline`;
  const list = document.getElementById('list');
  const chips = document.getElementById('chips');
  const q = document.getElementById('q');
  let group = 'all', active = 0, shown = [];

  const render = () => {
    const term = q.value.trim().toLowerCase();
    shown = tools.filter((t) => (group === 'all' || t.group === group) &&
      (!term || `${t.name} ${t.tagline} ${(t.keywords || []).join(' ')}`.toLowerCase().includes(term)));
    if (!term && group === 'all') shown = [...shown.filter((t) => t.popular), ...shown.filter((t) => !t.popular)];
    active = Math.min(active, Math.max(shown.length - 1, 0));
    list.replaceChildren(...(shown.length ? shown.map((t, i) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.className = i === active ? 'active' : '';
      const n = document.createElement('b'); n.textContent = t.name;
      const s = document.createElement('span'); s.textContent = t.tagline;
      b.append(n, s);
      b.addEventListener('click', () => open('#/tool/' + t.id));
      li.append(b);
      return li;
    }) : [Object.assign(document.createElement('div'), { className: 'empty', textContent: 'No tools match.' })]));
  };

  const mk = (id, label) => {
    const b = document.createElement('button');
    b.textContent = label; b.setAttribute('aria-pressed', String(group === id));
    b.addEventListener('click', () => { group = id; active = 0; chips.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); render(); });
    return b;
  };
  chips.append(mk('all', 'Popular'), ...groups.map((g) => mk(g.id, g.name)));
  q.addEventListener('input', () => { active = 0; render(); });
  q.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, shown.length - 1); render(); list.querySelector('.active')?.scrollIntoView({ block: 'nearest' }); }
    if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); render(); list.querySelector('.active')?.scrollIntoView({ block: 'nearest' }); }
    if (e.key === 'Enter' && shown[active]) open('#/tool/' + shown[active].id);
  });
  document.getElementById('open-app').addEventListener('click', () => open(''));
  render();
})();
