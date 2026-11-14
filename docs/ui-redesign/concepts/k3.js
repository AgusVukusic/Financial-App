/* fonts: Geist Mono:wght@400;600|Hanken Grotesk:wght@400;600;700|Doto:wght@700 */
(function () {
  var CK = window.CK, ic = CK.icon, fmt = CK.fmt, D = CK.data;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function num(n) { return Math.abs(Math.round(n)).toLocaleString('es-AR'); }
  var ACC_SHORT = { ahorros: 'Ahorros', efectivo: 'Efectivo', mp: 'Mercado Pago', visa: 'Visa' };
  var TYPE_LBL = { bank: 'BANCO', cash: 'EFECTIVO', wallet: 'BILLETERA', card: 'TARJETA' };
  var CAT_ICON = CK.catIcon;
  var KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'del'];
  var KEY_LABEL = { '00': 'doble cero', '0': 'cero', del: 'Borrar' };

  function led(kind) {
    var s = '<svg class="k3-led ' + kind + '" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">';
    if (kind === 'paid') s += '<circle cx="12" cy="12" r="9" fill="currentColor"/><path d="M8 12.5l3 3 5-6" fill="none" stroke="var(--bg)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>';
    else if (kind === 'late') s += '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 20L20 4" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>';
    else s += '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>';
    return s + '</svg>';
  }

  CK.register({
    id: 'k3', name: '3 · Panel de taller',
    info: {
      tagline: 'Un instrumento de bolsillo: botones con relieve, serigrafía de panel y un solo naranja. Anotás escribiendo "café 3500" y ves cómo lo entendió la app antes de guardar.',
      novelty: [
        'Entrada por texto natural: escribís o dictás "café 3500", se resalta el monto, se muestra la interpretación y se corrige con chips. Escribir + 1 toque.',
        'Teclado numérico propio con teclas de 56 px, relieve y estado presionado, como alternativa dentro de la hoja.',
        'Gastos fijos como filas de estado LED: llena = pagado, hueca = pendiente, tachada = vencida, siempre con texto de días.',
        'Presupuestos como medidores de 10 segmentos; el exceso va en segmentos rayados con etiqueta de texto.',
        'Gasto por categoría en barra con tramas de puntos y rayas (dither): se distingue sin depender del color.'
      ],
      refs: ['Teenage Engineering: grilla rígida, serigrafía y un acento naranja de hardware', 'Nothing OS (Ndot/Doto): saldo en matriz de puntos', 'Playdate: texturas dither para los gráficos', 'Fantastical: lenguaje natural con resaltado de lo interpretado', 'Cash App: teclado numérico propio', 'Things: entrada rápida'],
      type: 'Geist Mono para etiquetas y cifras, Hanken Grotesk para lectura, Doto (puntos) solo en el saldo a 48 px. Claro "papel de taller" (crema, tinta casi negra) y oscuro "panel" (grafito cálido). Un único acento naranja; el vencido usa carmesí y el aviso ámbar, siempre con ícono y texto.',
      risks: [
        'Doto es ilegible chica: solo se usa a 48 px y el valor también está en el aria-label.',
        'Etiquetas de panel en mayúsculas de 10 a 11 px: cuestan de leer, no llevan información que no esté repetida en otro lado.',
        'El parser puede equivocarse ("1,5", "3 mil", rubros raros): por eso se muestra siempre la interpretación y se corrige con chips.',
        'La estética de hardware puede sentirse fría para quien quiere una app más amable.'
      ]
    },
    mount: function (phone, store) {
      var st = store.state, seen = {};
      phone.innerHTML = '';
      var app = CK.el('div', 'ck-app'), scroll = CK.el('div', 'ck-scroll'), nav = CK.el('nav', 'k3-nav');
      nav.setAttribute('aria-label', 'Principal');
      app.appendChild(scroll); app.appendChild(nav); phone.appendChild(app);

      /* ---- Cabecera fija (saldo con odómetro) ---- */
      var head = CK.el('header', 'k3-head',
        '<div class="k3-top"><span class="k3-sil">PANEL · ' + esc(D.month.toUpperCase()) + '</span><span class="k3-sil"><i class="k3-dot"></i> DÍA ' + D.day + '/' + D.daysInMonth + '</span></div>' +
        '<div class="k3-sil k3-lbl">SALDO TOTAL</div>' +
        '<div class="k3-bal"><span class="k3-cur" aria-hidden="true"></span><span class="k3-val"></span></div>' +
        '<div class="k3-io"><div class="k3-cell"><span class="k3-sil">' + ic('up', 14, 2.4) + ' ENTRÓ</span><b class="k3-in"></b></div>' +
        '<div class="k3-cell"><span class="k3-sil"><span class="k3-down">' + ic('up', 14, 2.4) + '</span> SALIÓ</span><b class="k3-out"></b></div></div>');
      scroll.appendChild(head);
      var body = CK.el('div', 'k3-body'); scroll.appendChild(body);

      /* ---- Registro rápido (estático) ---- */
      var quick = CK.el('section', 'k3-sec'); quick.setAttribute('aria-labelledby', 'k3q');
      quick.innerHTML = '<h2 class="k3-h" id="k3q"><span class="k3-sil">00</span> ANOTAR RÁPIDO</h2><div class="k3-fq"></div>' +
        '<button type="button" class="k3-key k3-main">' + ic('plus', 22, 2.6) + '<span>Anotar gasto</span><small>texto o teclado</small></button>';
      var fq = quick.querySelector('.k3-fq');
      D.frequent.forEach(function (f) {
        var b = CK.el('button', 'k3-key k3-f', '<span>' + esc(f.label) + '</span><b>' + fmt(f.amount) + '</b>');
        b.type = 'button'; b.setAttribute('aria-label', 'Registrar ' + f.label + ' ' + fmt(f.amount));
        b.onclick = function () {
          var undo = store.add({ name: f.label, amount: f.amount, cat: f.cat, acc: f.acc });
          CK.toast(phone, { text: 'Registrado · ' + f.label + ' ' + fmt(-f.amount), actionLabel: 'Deshacer', onAction: undo });
        };
        fq.appendChild(b);
      });
      quick.querySelector('.k3-main').onclick = openEntry;
      body.appendChild(quick);
      var dyn = CK.el('div', 'k3-dyn'); body.appendChild(dyn);

      /* ---- Navegación ---- */
      [['home', 'Inicio', 1], ['pie', 'Reportes'], ['plus', 'Anotar', 0, 1], ['user', 'Perfil']].forEach(function (n) {
        var b = CK.el('button', n[3] ? 'k3-key k3-fab' : 'k3-nb', ic(n[0], n[3] ? 26 : 22, n[3] ? 2.8 : 2) + '<span>' + n[1] + '</span>');
        b.type = 'button';
        if (n[2]) b.setAttribute('aria-current', 'page');
        if (n[3]) { b.setAttribute('aria-label', 'Anotar gasto'); b.onclick = openEntry; }
        nav.appendChild(b);
      });

      /* ---- Render ---- */
      var balHost = phone.querySelector('.k3-val'), curHost = phone.querySelector('.k3-cur');
      function rHead(s) {
        var neg = s.balance < 0;
        curHost.textContent = (neg ? '−' : '') + '$';
        CK.odometer(balHost, num(s.balance));
        balHost.setAttribute('aria-label', fmt(s.balance));
        phone.querySelector('.k3-in').textContent = CK.sg(s.income);
        phone.querySelector('.k3-out').textContent = CK.sg(-s.expense);
      }
      function rFixed(s) {
        var order = s.fixed.map(function (f, i) { return { f: f, i: i }; }).sort(function (a, b) { return a.f.days - b.f.days; });
        var late = s.fixed.filter(function (f) { return !f.paid && f.days < 0; }).length, pend = s.fixed.filter(function (f) { return !f.paid; }).length;
        var h = '<section class="k3-sec" aria-labelledby="k3p"><h2 class="k3-h" id="k3p"><span class="k3-sil">01</span> PARA PAGAR<em class="k3-sil">' + (late ? ic('alert', 13, 2.4) + ' ' + late + ' VENCIDOS · ' : '') + pend + ' PENDIENTES</em></h2><ul class="k3-list">';
        order.forEach(function (o) {
          var f = o.f, kind = f.paid ? 'paid' : f.days < 0 ? 'late' : 'pend', d = (f.days > 0 ? '+' : '−') + Math.abs(f.days) + ' d';
          var status = f.paid ? ic('check', 13, 2.6) + ' PAGADO' : f.days < 0 ? ic('alert', 13, 2.4) + ' VENCIDO ' + d : 'VENCE ' + d;
          h += '<li class="k3-fx ' + kind + '" data-row="' + o.i + '" tabindex="-1">' + led(kind) +
            '<div class="k3-mn"><span class="k3-nm">' + esc(f.name) + '</span><span class="k3-mt"><span class="k3-st">' + status + '</span><span class="k3-am">' + fmt(f.amount) + '</span>' + (f.cycle ? '<span class="k3-tag">ANUAL</span>' : '') + '</span></div>' +
            (f.paid ? '' : '<button type="button" class="k3-key k3-pay" data-pay="' + o.i + '" aria-label="Pagar ' + esc(f.name) + ' ' + fmt(f.amount) + '">Pagar</button>') + '</li>';
        });
        return h + '</ul></section>';
      }
      function rBudgets(s) {
        var tot = s.expense, h = '<section class="k3-sec" aria-labelledby="k3b"><h2 class="k3-h" id="k3b"><span class="k3-sil">02</span> PRESUPUESTOS</h2>';
        var legend = '', stack = '', label = [];
        D.cats.forEach(function (c, i) {
          var b = s.budgets.filter(function (x) { return x.cat === c; })[0]; if (!b) return;
          var p = tot > 0 ? b.used / tot * 100 : 0;
          stack += '<i class="k3-pat p' + i + '" style="width:' + p.toFixed(2) + '%"></i>';
          legend += '<li><i class="k3-pat k3-sw p' + i + '"></i><span>' + c + '</span><b>' + Math.round(p) + '%</b></li>';
          label.push(c + ' ' + Math.round(p) + '%');
        });
        h += '<div class="k3-card"><div class="k3-sil">GASTO DEL MES POR CATEGORÍA</div><div class="k3-stack" role="img" aria-label="Gasto del mes: ' + esc(label.join(', ')) + '">' + stack + '</div><ul class="k3-lg">' + legend + '</ul></div><ul class="k3-list">';
        s.budgets.forEach(function (b) {
          var left = '<span class="k3-ct">' + ic(CAT_ICON[b.cat], 18) + '<span>' + b.cat + '</span></span>', meter = '', st2, bot;
          if (b.limit == null) {
            st2 = '<span class="k3-bs">SIN TOPE</span>'; bot = '<span class="k3-am">' + fmt(b.used) + '</span><span class="k3-sil">SIN LÍMITE</span>';
            meter = '<div class="k3-meter nolim" role="img" aria-label="' + b.cat + ': sin tope"></div>';
          } else {
            var pct = b.used / b.limit * 100, over = pct > 100, near = !over && pct >= 90, segs = '', fill = Math.ceil(Math.min(pct, 100) / 10), ex = over ? Math.min(4, Math.ceil((pct - 100) / 10)) : 0;
            for (var i = 0; i < 10; i++) segs += '<i class="' + (i < fill ? 'on' : '') + '"></i>';
            for (var j = 0; j < ex; j++) segs += '<i class="ex"></i>';
            meter = '<div class="k3-meter' + (ex ? ' hasx' : '') + '" role="img" aria-label="' + b.cat + ': ' + Math.round(pct) + '% del tope">' + segs + '</div>';
            st2 = over ? '<span class="k3-bs bad">' + ic('alert', 14, 2.4) + ' SUPERADO +' + fmt(b.used - b.limit) + '</span>' : near ? '<span class="k3-bs warn">' + ic('alert', 14, 2.4) + ' CERCA DEL LÍMITE ' + Math.round(pct) + '%</span>' : '<span class="k3-bs ok">' + ic('check', 14, 2.6) + ' OK ' + Math.round(pct) + '%</span>';
            bot = '<span class="k3-am">' + fmt(b.used) + '</span><span class="k3-sil">DE ' + fmt(b.limit) + '</span>';
          }
          h += '<li class="k3-bg"><div class="k3-r1">' + left + st2 + '</div>' + meter + '<div class="k3-r2">' + bot + '</div></li>';
        });
        return h + '</ul></section>';
      }
      function rAccounts(s) {
        var h = '<section class="k3-sec" aria-labelledby="k3a"><h2 class="k3-h" id="k3a"><span class="k3-sil">03</span> CUENTAS</h2><ul class="k3-list">';
        s.accounts.forEach(function (a) {
          var debt = a.balance < 0;
          h += '<li class="k3-ac"><span class="k3-ico">' + ic(CK.accIcon[a.type], 20) + '</span><div class="k3-mn"><span class="k3-nm k3-two" title="' + esc(a.name) + '">' + esc(a.name) + '</span><span class="k3-sil">' + TYPE_LBL[a.type] + '</span></div>' +
            '<div class="k3-rt">' + (debt ? '<span class="k3-tag debt">DEUDA</span>' : '') + '<b class="k3-am">' + fmt(a.balance) + '</b></div></li>';
        });
        return h + '</ul></section>';
      }
      function rMoves(s) {
        var h = '<section class="k3-sec" aria-labelledby="k3m"><h2 class="k3-h" id="k3m"><span class="k3-sil">04</span> MOVIMIENTOS RECIENTES</h2><ul class="k3-list">';
        s.moves.slice(0, 8).forEach(function (m) {
          var isNew = m.isNew && !seen[m.id]; seen[m.id] = true;
          var inc = m.kind === 'income', tr = m.kind === 'transfer';
          var amt = tr ? '<b class="k3-am">' + fmt(Math.abs(m.amount)) + '</b>' : inc ? '<b class="k3-am inc">+ ' + fmt(m.amount) + '</b>' : '<b class="k3-am">' + fmt(m.amount) + '</b>';
          var meta;
          if (tr) { var o = CK.accById(m.acc), d = CK.accById(m.to); meta = '<span class="k3-flow"><span>' + esc(o ? o.name : '') + '</span><i><span class="ck-sr"> a </span><span aria-hidden="true">→</span></i><span>' + esc(d ? d.name : '') + '</span></span>'; }
          else { var a = CK.accById(m.acc); meta = '<span class="k3-sil">' + esc(m.date.toUpperCase()) + '</span><span class="k3-one">' + esc(m.cat) + ' · ' + esc(a ? a.name : '') + '</span>'; }
          h += '<li class="k3-mv' + (isNew ? ' isnew' : '') + '"><span class="k3-ico">' + ic(tr ? 'swap' : inc ? 'up' : CAT_ICON[m.cat] || 'more', 20) + '</span><div class="k3-mn"><span class="k3-nm k3-two" title="' + esc(m.name) + '">' + (isNew ? '<span class="k3-tag nw">NUEVO</span> ' : '') + esc(m.name) + '</span><span class="k3-mt">' + meta + '</span></div>' + amt + '</li>';
        });
        return h + '</ul></section>';
      }
      function render(s, info) {
        var top = scroll.scrollTop;
        rHead(s);
        dyn.innerHTML = rFixed(s) + rBudgets(s) + rAccounts(s) + rMoves(s);
        scroll.scrollTop = top;
        if (info && info.type === 'pay') { var row = dyn.querySelector('[data-row="' + s.fixed.indexOf(info.fixed) + '"]'); if (row) row.focus({ preventScroll: true }); }
      }
      dyn.addEventListener('click', function (e) {
        var b = e.target.closest('[data-pay]'); if (!b) return;
        var i = +b.getAttribute('data-pay'), f = st.fixed[i], undo = store.pay(i);
        CK.toast(phone, { text: 'Pagado · ' + f.name + ' ' + fmt(-f.amount), actionLabel: 'Deshacer', onAction: undo });
      });
      store.on(render);
      render(st);

      /* ---- Hoja "Anotar gasto" ---- */
      function openEntry() {
        var S = { text: '', digits: '', cat: null, acc: 'mp', pad: false };
        CK.openSheet(phone, {
          title: 'Anotar gasto',
          build: function (sh, close) {
            sh.classList.add('k3-sheet');
            sh.innerHTML = '<div class="k3-sh-t k3-sil" aria-hidden="true">ANOTAR GASTO</div>' +
              '<label class="k3-in-l k3-sil" for="k3-txt">QUÉ Y CUÁNTO</label>' +
              '<input id="k3-txt" class="k3-txt" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="ej: café 3500" aria-describedby="k3-pv">' +
              '<div id="k3-pv" class="k3-pv" aria-live="polite"></div>' +
              '<div class="k3-sil k3-cl">CATEGORÍA</div><div class="k3-chips" role="group" aria-label="Categoría"></div>' +
              '<div class="k3-sil k3-cl">CUENTA</div><div class="k3-chips" role="group" aria-label="Cuenta"></div>' +
              '<button type="button" class="k3-key k3-tg" aria-expanded="false">' + ic('plus', 18, 2.4) + '<span>Usar teclado numérico</span></button>' +
              '<div class="k3-pad" hidden><div class="k3-disp" aria-live="off"></div><div class="k3-keys"></div></div>' +
              '<button type="button" class="k3-key k3-save"></button>' +
              '<button type="button" class="k3-x" aria-label="Cerrar">' + ic('x', 22, 2.4) + '</button>';
            var inp = sh.querySelector('.k3-txt'), pv = sh.querySelector('.k3-pv'), chips = sh.querySelectorAll('.k3-chips'), save = sh.querySelector('.k3-save'),
              tg = sh.querySelector('.k3-tg'), pad = sh.querySelector('.k3-pad'), disp = sh.querySelector('.k3-disp'), keys = sh.querySelector('.k3-keys');
            sh.querySelector('.k3-x').onclick = close;
            D.cats.forEach(function (c) {
              var b = CK.el('button', 'k3-chip', ic(CAT_ICON[c], 16, 2.2) + '<span>' + c + '</span>'); b.type = 'button'; b.dataset.c = c;
              b.onclick = function () { S.cat = c; update(); }; chips[0].appendChild(b);
            });
            D.accounts.forEach(function (a) {
              var b = CK.el('button', 'k3-chip', ic(CK.accIcon[a.type], 16, 2.2) + '<span>' + ACC_SHORT[a.id] + '</span>'); b.type = 'button'; b.dataset.a = a.id; b.title = a.name;
              b.setAttribute('aria-label', a.name);
              b.onclick = function () { S.acc = a.id; update(); }; chips[1].appendChild(b);
            });
            KEYS.forEach(function (k) {
              var b = CK.el('button', 'k3-key k3-k', k === 'del' ? ic('back', 22, 2.4) : k); b.type = 'button';
              b.setAttribute('aria-label', KEY_LABEL[k] || k);
              b.onclick = function () {
                if (k === 'del') S.digits = S.digits.slice(0, -1);
                else if ((S.digits + k).replace(/^0+/, '').length <= 9) S.digits = (S.digits + k).replace(/^0+/, '');
                update();
              };
              keys.appendChild(b);
            });
            tg.onclick = function () {
              S.pad = !S.pad; pad.hidden = !S.pad; tg.setAttribute('aria-expanded', S.pad);
              tg.querySelector('span').textContent = S.pad ? 'Volver a escribir el monto' : 'Usar teclado numérico';
              inp.placeholder = S.pad ? 'en qué (opcional)' : 'ej: café 3500';
              inp.previousElementSibling.textContent = S.pad ? 'EN QUÉ (OPCIONAL)' : 'QUÉ Y CUÁNTO';
              update();
            };
            function calc() {
              var p = CK.parse(S.text), r;
              if (S.pad) { var a = +S.digits || 0, nm = S.text.trim() ? S.text.trim().charAt(0).toUpperCase() + S.text.trim().slice(1) : '', auto = CK.parse(S.text).cat; r = { name: nm || (S.cat || auto), amount: a, cat: S.cat || auto, ok: a > 0, p: null }; }
              else r = { name: p.name, amount: p.amount, cat: S.cat || p.cat, ok: p.ok, p: p };
              return r;
            }
            function update() {
              var r = calc(), html;
              if (S.pad) {
                disp.textContent = r.ok ? fmt(r.amount) : '$ 0';
                html = r.ok ? 'Leí <mark>' + fmt(r.amount) + '</mark> · ' + esc(r.name) + ' · ' + esc(r.cat) : 'Tocá las teclas para armar el monto.';
              } else if (!S.text.trim()) {
                html = '<span class="k3-mu">Escribí o dictá qué y cuánto: "café 3500", "nafta 3,5k" o "super 30 mil".</span>';
              } else if (!r.ok) {
                html = '<span class="k3-bad">' + ic('alert', 14, 2.4) + ' No encuentro un monto. Sumá un número, por ejemplo "' + esc(S.text.trim()) + ' 3500".</span>';
              } else {
                var p = r.p, raw = p.raw.trim(), shown = S.text.slice(p.index, p.index + raw.length), hint = '';
                if (/^\d{1,3}(\.\d{3})+$/.test(raw.replace(/\s*(k|mil)$/i, ''))) hint = 'el punto separa miles';
                else if (/[.,]/.test(raw)) hint = 'la coma es decimal' + (r.amount !== parseFloat(raw.replace(',', '.')) && !/k|mil/i.test(raw) ? ', se redondea' : '');
                if (/k|mil/i.test(raw)) hint = (hint ? hint + ' · ' : '') + 'k o mil multiplica por 1.000';
                html = '<div class="k3-hl">' + esc(S.text.slice(0, p.index)) + '<mark>' + esc(shown) + '</mark>' + esc(S.text.slice(p.index + raw.length)) + '</div>' +
                  '<div>Leí <b>' + fmt(r.amount) + '</b> · ' + esc(r.name) + ' · <b>' + esc(r.cat) + '</b>' + (hint ? '<br><span class="k3-mu">' + esc('"' + raw + '": ' + hint) + '</span>' : '') + '</div>';
              }
              pv.innerHTML = html;
              [].forEach.call(chips[0].children, function (b) { b.setAttribute('aria-pressed', String(b.dataset.c === r.cat)); });
              [].forEach.call(chips[1].children, function (b) { b.setAttribute('aria-pressed', String(b.dataset.a === S.acc)); });
              save.innerHTML = ic('check', 22, 2.8) + '<span>Anotar' + (r.ok ? ' · ' + fmt(r.amount) : '') + '</span>';
              save.setAttribute('aria-disabled', String(!r.ok));
            }
            function doSave() {
              var r = calc();
              if (!r.ok) { inp.focus(); return; }
              var undo = store.add({ name: r.name, amount: r.amount, cat: r.cat, acc: S.acc });
              close();
              CK.toast(phone, { text: 'Registrado · ' + r.name + ' ' + fmt(-r.amount), actionLabel: 'Deshacer', onAction: undo });
            }
            inp.addEventListener('input', function () { S.text = inp.value; update(); });
            inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); doSave(); } });
            save.onclick = doSave;
            update();
          }
        });
      }
    }
  });
})();
