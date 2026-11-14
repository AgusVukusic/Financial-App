/* Base común de los conceptos: datos de demostración, store, odómetro, hoja inferior, toast y parser. */
(function () {
  var P = {
    plus: 'M5 12h14M12 5v14', home: 'm3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10', pie: 'M21.2 15.9A10 10 0 1 1 8 2.8M22 12A10 10 0 0 0 12 2v10z',
    user: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', chevL: 'm15 18-6-6 6-6', chevR: 'm9 18 6-6-6-6', x: 'M18 6 6 18M6 6l12 12',
    moon: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z', sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
    swap: 'M17 3l4 4-4 4M3 7h18M7 21l-4-4 4-4M21 17H3', alert: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
    clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2', bank: 'M3 21h18M5 21V10M19 21V10M9 21V10M15 21V10M2 10l10-7 10 7',
    wallet: 'M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4',
    cash: 'M2 6h20v12H2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', card: 'M2 5h20v14H2zM2 10h20', cup: 'M17 8h1a4 4 0 0 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4zM6 2v2M10 2v2M14 2v2',
    bag: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0', car: 'M5 17h14M3 13l2-6h14l2 6v4H3zM7 17v2M17 17v2',
    zap: 'M13 2 3 14h9l-1 8 10-12h-9z', more: 'M5 12h.01M12 12h.01M19 12h.01', up: 'M12 19V5M5 12l7-7 7 7', check: 'M20 6 9 17l-5-5', undo: 'M3 7v6h6M3 13a9 9 0 1 0 3-7',
    back: 'M19 12H5M12 19l-7-7 7-7', mic: 'M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v1a7 7 0 0 1-14 0v-1M12 18v4', house: 'm3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'
  };
  var CAT_ICON = { Comida: 'cup', Compras: 'bag', Hogar: 'house', Transporte: 'car', Servicios: 'zap', Otros: 'more' };
  var ACC_ICON = { bank: 'bank', cash: 'cash', wallet: 'wallet', card: 'card' };

  var DATA = {
    month: 'Noviembre 2026', day: 13, daysInMonth: 30,
    total: 15373721, income: 1970000, expense: 1003710,
    cats: ['Comida', 'Compras', 'Hogar', 'Transporte', 'Servicios', 'Otros'],
    accounts: [
      { id: 'ahorros', name: 'Ahorros USD (en pesos)', type: 'bank', balance: 13050000 },
      { id: 'efectivo', name: 'Efectivo', type: 'cash', balance: 86500 },
      { id: 'mp', name: 'Mercado Pago', type: 'wallet', balance: 2624720 },
      { id: 'visa', name: 'Visa Santander Platinum Internacional', type: 'card', balance: -387499 }
    ],
    budgets: [
      { cat: 'Compras', used: 387499, limit: 300000 }, { cat: 'Servicios', used: 46830, limit: 40000 },
      { cat: 'Hogar', used: 372300, limit: 400000 }, { cat: 'Comida', used: 138581, limit: 180000 },
      { cat: 'Transporte', used: 25500, limit: 60000 }, { cat: 'Otros', used: 33000, limit: null }
    ],
    fixed: [
      { name: 'Expensas', amount: 145000, days: -3, cat: 'Hogar', acc: 'mp' }, { name: 'Netflix', amount: 13999, days: -2, cat: 'Servicios', acc: 'visa' },
      { name: 'Spotify', amount: 3299, days: 2, cat: 'Servicios', acc: 'visa' }, { name: 'Seguro del auto', amount: 380000, days: 7, cat: 'Transporte', acc: 'mp', cycle: 'anual' },
      { name: 'Gimnasio', amount: 42000, days: 9, cat: 'Otros', acc: 'mp' }
    ],
    moves: [
      { id: 'm1', name: 'Supermercado Día', cat: 'Comida', amount: -29800, acc: 'mp', date: '13 nov', kind: 'expense' },
      { id: 'm2', name: 'Auriculares', cat: 'Compras', amount: -133000, acc: 'visa', date: '12 nov', kind: 'expense' },
      { id: 'm3', name: 'Nafta', cat: 'Transporte', amount: -7400, acc: 'mp', date: '12 nov', kind: 'expense' },
      { id: 'm4', name: 'Farmacia', cat: 'Otros', amount: -21000, acc: 'mp', date: '11 nov', kind: 'expense' },
      { id: 'm5', name: 'Ferretería', cat: 'Hogar', amount: -52300, acc: 'mp', date: '11 nov', kind: 'expense' },
      { id: 'm6', name: 'Ahorro del mes', cat: 'Transferencia', amount: 200000, acc: 'mp', to: 'ahorros', date: '8 nov', kind: 'transfer' },
      { id: 'm7', name: 'Freelance landing page', cat: 'Ingreso', amount: 120000, acc: 'mp', date: '6 nov', kind: 'income' },
      { id: 'm8', name: 'Sueldo', cat: 'Ingreso', amount: 1850000, acc: 'mp', date: '1 nov', kind: 'income' }
    ],
    frequent: [
      { label: 'Café', amount: 3500, cat: 'Comida', acc: 'efectivo' }, { label: 'SUBE', amount: 8900, cat: 'Transporte', acc: 'mp' },
      { label: 'Super', amount: 30000, cat: 'Comida', acc: 'mp' }, { label: 'Uber', amount: 9200, cat: 'Transporte', acc: 'mp' },
      { label: 'Almuerzo', amount: 6000, cat: 'Comida', acc: 'efectivo' }, { label: 'Farmacia', amount: 21000, cat: 'Otros', acc: 'mp' }
    ]
  };

  function fmt(n) { return (n < 0 ? '−' : '') + '$ ' + Math.abs(Math.round(n)).toLocaleString('es-AR'); }
  function sg(n) { return (n > 0 ? '+' : n < 0 ? '−' : '') + '$ ' + Math.abs(Math.round(n)).toLocaleString('es-AR'); }
  function icon(n, s, w) { s = s || 20; return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + (P[n] || P.more) + '"/></svg>'; }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function accById(id) { return DATA.accounts.filter(function (a) { return a.id === id; })[0]; }

  function newStore() {
    var s = {
      balance: DATA.total, income: DATA.income, expense: DATA.expense, uid: 100,
      accounts: DATA.accounts.map(function (a) { return Object.assign({}, a); }),
      budgets: DATA.budgets.map(function (b) { return Object.assign({}, b); }),
      fixed: DATA.fixed.map(function (f) { return Object.assign({ paid: false }, f); }),
      moves: DATA.moves.map(function (m) { return Object.assign({}, m); })
    };
    var subs = [];
    function notify(info) { subs.forEach(function (f) { f(s, info || {}); }); }
    function apply(m, sign) {
      s.balance += sign * m.amount; if (m.amount < 0) s.expense += sign * -m.amount;
      var a = s.accounts.filter(function (x) { return x.id === m.acc; })[0]; if (a) a.balance += sign * m.amount;
      var b = s.budgets.filter(function (x) { return x.cat === m.cat; })[0]; if (b && m.amount < 0) b.used += sign * -m.amount;
    }
    return {
      state: s,
      on: function (f) { subs.push(f); },
      /* item: {name, amount (positivo), cat, acc}. Devuelve una función que lo deshace. */
      add: function (item) {
        var m = { id: 'n' + (++s.uid), name: item.name, cat: item.cat || 'Otros', amount: -Math.abs(item.amount), acc: item.acc || 'mp', date: 'Hoy', kind: 'expense', isNew: true };
        s.moves.unshift(m); apply(m, 1); notify({ type: 'add', move: m });
        return function () { var i = s.moves.indexOf(m); if (i < 0) return; s.moves.splice(i, 1); apply(m, -1); notify({ type: 'undo', move: m }); };
      },
      /* Paga el gasto fijo número i. Devuelve la función que lo deshace. */
      pay: function (i) {
        var f = s.fixed[i]; if (!f || f.paid) return function () {};
        f.paid = true; var m = { id: 'p' + (++s.uid), name: f.name, cat: f.cat, amount: -f.amount, acc: f.acc, date: 'Hoy', kind: 'expense', isNew: true };
        s.moves.unshift(m); apply(m, 1); notify({ type: 'pay', move: m, fixed: f });
        return function () { var k = s.moves.indexOf(m); if (k < 0) return; s.moves.splice(k, 1); apply(m, -1); f.paid = false; notify({ type: 'undo', move: m }); };
      }
    };
  }

  /* Odómetro: cada dígito es una ventana de 1em con una pila 0-9 que se desplaza (solo transform). */
  function odometer(host, text) {
    host.classList.add('od'); host.setAttribute('role', 'text'); host.setAttribute('aria-label', text);
    var chars = Array.from(text);
    if (!host._od || host._od.length !== chars.length) {
      host.innerHTML = ''; host.classList.remove('od-ready');
      chars.forEach(function (ch) {
        if (/\d/.test(ch)) {
          var w = el('span', 'od-d'); w.setAttribute('aria-hidden', 'true'); var st = el('span', 'od-s');
          for (var i = 0; i < 10; i++) st.appendChild(el('span', '', String(i)));
          w.appendChild(st); host.appendChild(w);
        } else { var c = el('span', 'od-c', ch === ' ' ? ' ' : ch); c.setAttribute('aria-hidden', 'true'); host.appendChild(c); }
      });
      host._od = chars;
      requestAnimationFrame(function () { requestAnimationFrame(function () { host.classList.add('od-ready'); }); });
    }
    var k = 0, stacks = host.querySelectorAll('.od-s');
    chars.forEach(function (ch) { if (/\d/.test(ch)) stacks[k++].style.transform = 'translateY(-' + (+ch) * 10 + '%)'; });
  }

  function toast(phone, o) {
    var old = phone.querySelector('.ck-toast'); if (old) old.remove();
    var t = el('div', 'ck-toast'); t.setAttribute('role', 'status');
    t.appendChild(el('span', 't', o.text));
    var timer;
    if (o.actionLabel) { var b = el('button', '', o.actionLabel); b.type = 'button'; b.onclick = function () { clearTimeout(timer); t.remove(); o.onAction && o.onAction(); }; t.appendChild(b); }
    phone.appendChild(t); timer = setTimeout(function () { t.remove(); }, o.ms || 7000);
    return t;
  }

  function openSheet(phone, o) {
    var prev = document.activeElement, back = el('div', 'ck-back'), sh = el('div', 'ck-sheet');
    sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-modal', 'true'); sh.setAttribute('aria-label', o.title || 'Hoja');
    function close() { back.remove(); sh.remove(); if (prev && prev.focus) prev.focus(); o.onClose && o.onClose(); }
    back.onclick = close; sh.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    o.build(sh, close); phone.appendChild(back); phone.appendChild(sh);
    var f = sh.querySelector('input,button'); (f || sh).focus(); return { close: close, el: sh };
  }

  var KEYS = {
    Comida: /caf[eé]|almuerzo|cena|super|verdu|carnic|pedidosya|comida|panader|helado|pizza|kiosco|desayuno/i,
    Transporte: /sube|nafta|uber|cabify|colectivo|taxi|peaje|estacion|subte|tren/i,
    Servicios: /luz|edenor|edesur|gas|agua|internet|fibertel|celular|netflix|spotify|expensas/i,
    Hogar: /alquiler|ferret|mueble|limpieza|plomer|casa/i,
    Compras: /ropa|zapatill|auric|libro|regalo|compra|amazon|mercadolibre/i
  };
  /* "café 3500" -> {name, amount, cat, ok}. Entiende 3.500, 3500, 3,5k, 3k y "3 mil". */
  function parse(text) {
    var t = String(text || '').trim(), m = t.match(/(\d[\d.,]*)\s*(k|mil)?/i);
    if (!m) return { name: t, amount: 0, cat: 'Otros', ok: false };
    var raw = m[1], n;
    if (/^\d{1,3}(\.\d{3})+$/.test(raw)) n = parseFloat(raw.replace(/\./g, ''));
    else n = parseFloat(raw.replace(',', '.'));
    if (m[2]) n *= 1000;
    var name = (t.slice(0, m.index) + ' ' + t.slice(m.index + m[0].length)).replace(/\s+/g, ' ').trim() || 'Gasto';
    var cat = 'Otros'; Object.keys(KEYS).forEach(function (k) { if (cat === 'Otros' && KEYS[k].test(name)) cat = k; });
    return { name: name.charAt(0).toUpperCase() + name.slice(1), amount: Math.round(n), cat: cat, ok: isFinite(n) && n > 0, raw: m[0], index: m.index };
  }

  var CK = { data: DATA, icon: icon, fmt: fmt, sg: sg, el: el, catIcon: CAT_ICON, accIcon: ACC_ICON, accById: accById, newStore: newStore, odometer: odometer, toast: toast, openSheet: openSheet, parse: parse, concepts: [], register: function (c) { CK.concepts.push(c); } };
  window.CK = CK;
})();
