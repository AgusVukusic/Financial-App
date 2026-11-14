/* fonts: Unbounded:wght@600;800|Hanken Grotesk:wght@400;600;700 */
(function () {
  var CK = window.CK, E = CK.el, I = CK.icon;
  var SHORT = { ahorros: 'Ahorros USD', efectivo: 'Efectivo', mp: 'Mercado Pago', visa: 'Visa Santander' };
  var MONTHS = 'nov';
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function vib() { try { if (navigator.vibrate) navigator.vibrate(15); } catch (e) { /* complemento */ } }
  function plural(n, a, b) { return n + ' ' + (n === 1 ? a : b); }

  CK.register({
    id: 'k2', name: '2 · Frascos',
    info: {
      tagline: 'Neobrutalismo con frascos: el mes entero es un frasco que se vacía y cada tope de presupuesto es un frasco chico.',
      novelty: [
        'El saldo del mes es un frasco grande (nivel = lo que queda de lo que entró) con resorte; cada gasto deja caer una moneda y el odómetro rueda y vibra.',
        'Cinco frascos por categoría con tope: superado = trama rayada + etiqueta SUPERADO con ícono; cerca = borde punteado + etiqueta CERCA.',
        'Vencimientos como tickets con muescas y sello VENCIDO rotado; movimientos como burbujas que se anulan deslizando o con botón visible.',
        'Anotar en 3 toques: monto, categoría (ya sugerida), guardar.'
      ],
      refs: ['NN/g: neobrutalismo', 'Budget Vials', 'HyperJar', 'Jar of Coins (Rive)', 'Up Bank (contornos gruesos)', 'Penny (botones con sombra dura)', 'ZAR Wallet'],
      type: 'Unbounded (ancha, pesada) para saldo y títulos; Hanken Grotesk para lectura.',
      risks: [
        'Sobrecarga de bordes: tanto contorno grueso cansa si se suman más secciones.',
        'La trama rayada puede ser difícil de leer en frascos muy chicos; por eso el estado siempre va también en texto e ícono.',
        'Puede sentirse infantil o lúdico para un tema serio como la deuda y el dinero.',
        'En oscuro la sombra dura usa el acento: hay que cuidar que no compita con los estados.'
      ]
    },
    mount: function (phone, store) {
      var s = store.state, D = CK.data, undos = {};
      var app = E('div', 'ck-app'), sc = E('div', 'ck-scroll');

      var bj = s.budgets.filter(function (b) { return b.limit; }).map(function (b) {
        return '<li class="k2-bj" data-cat="' + b.cat + '"><div class="k2-jwrap"><div class="k2-jar k2-mini" aria-hidden="true"><div class="k2-liq"></div></div></div>' +
          '<div class="k2-bn">' + I(CK.catIcon[b.cat], 16, 2.5) + '<span>' + b.cat + '</span></div><div class="k2-bm"></div><div class="k2-tag"></div></li>';
      }).join('');

      sc.innerHTML =
        '<header class="k2-top"><h1 class="k2-h1">' + D.month + '</h1><span class="k2-day">Día ' + D.day + ' de ' + D.daysInMonth + '</span></header>' +
        '<section class="k2-hero" aria-label="Saldo total"><p class="k2-lab">Saldo total</p><div class="k2-bal" data-bal></div>' +
        '<div class="k2-jarrow"><div class="k2-jwrap k2-bigwrap"><div class="k2-lid" aria-hidden="true"></div><div class="k2-jar k2-big" data-jar role="img"><div class="k2-liq"></div><div class="k2-coins" aria-hidden="true"></div></div></div>' +
        '<div class="k2-jtxt"><p class="k2-lvl" data-lvl></p><p class="k2-cap">Nivel del frasco: lo que queda del mes (entró − salió).</p>' +
        '<dl class="k2-io"><div><dt>' + I('up', 16, 3) + ' Entró</dt><dd class="k2-in" data-in></dd></div><div><dt>' + I('undo', 16, 3) + ' Salió</dt><dd data-out></dd></div></dl></div></div></section>' +
        '<button type="button" class="k2-cta" data-add>' + I('plus', 22, 3) + '<span>Anotar gasto</span></button>' +
        '<section aria-labelledby="k2-t-fr"><h2 class="k2-h2" id="k2-t-fr">Frecuentes <small>Un toque y se registra</small></h2><div class="k2-freq">' +
        D.frequent.map(function (f, i) { return '<button type="button" class="k2-fq" data-f="' + i + '"><span class="k2-fqn">' + f.label + '</span><span class="k2-fqa">' + CK.fmt(f.amount) + '</span></button>'; }).join('') + '</div></section>' +
        '<section aria-labelledby="k2-t-pp"><h2 class="k2-h2" id="k2-t-pp">Para pagar</h2><ul class="k2-list" data-fixed></ul></section>' +
        '<section aria-labelledby="k2-t-pr"><h2 class="k2-h2" id="k2-t-pr">Presupuestos <small>Frasco lleno = tope alcanzado</small></h2><ul class="k2-bgrid">' + bj +
        '<li class="k2-otros" data-otros></li></ul></section>' +
        '<section aria-labelledby="k2-t-ac"><h2 class="k2-h2" id="k2-t-ac">Cuentas</h2><ul class="k2-agrid" data-acc></ul></section>' +
        '<section aria-labelledby="k2-t-mv"><h2 class="k2-h2" id="k2-t-mv">Movimientos recientes</h2><ul class="k2-list k2-feed" data-moves></ul></section>';

      var nav = E('nav', 'k2-nav');
      nav.setAttribute('aria-label', 'Principal');
      nav.innerHTML =
        '<button type="button" aria-current="page" class="k2-nb">' + I('home', 22, 2.5) + '<span>Inicio</span></button>' +
        '<button type="button" class="k2-nb">' + I('pie', 22, 2.5) + '<span>Reportes</span></button>' +
        '<button type="button" class="k2-fab" data-add aria-label="Anotar gasto">' + I('plus', 28, 3) + '</button>' +
        '<button type="button" class="k2-nb">' + I('user', 22, 2.5) + '<span>Perfil</span></button>';
      app.appendChild(sc); app.appendChild(nav); phone.appendChild(app);

      var q = function (sel) { return sc.querySelector(sel); };
      var balEl = q('[data-bal]'), jar = q('[data-jar]'), jarLiq = jar.querySelector('.k2-liq'), coins = q('.k2-coins');

      /* ---- registrar ---- */
      function addExp(item) {
        var u = store.add(item); undos[s.moves[0].id] = u; vib();
        CK.toast(phone, { text: 'Registrado · ' + item.name + ' ' + CK.fmt(-Math.abs(item.amount)), actionLabel: 'Deshacer', onAction: u });
      }
      function payFixed(i) {
        var f = s.fixed[i], u = store.pay(i); if (!f) return;
        if (s.moves[0] && s.moves[0].name === f.name) undos[s.moves[0].id] = u;
        vib(); CK.toast(phone, { text: 'Pagado · ' + f.name + ' ' + CK.fmt(-f.amount), actionLabel: 'Deshacer', onAction: u });
      }
      function voidMove(id) {
        if (undos[id]) { undos[id](); delete undos[id]; CK.toast(phone, { text: 'Movimiento anulado', ms: 3500 }); }
        else CK.toast(phone, { text: 'Es un movimiento de demostración: no se puede anular.', ms: 4000 });
      }

      /* ---- hoja Anotar ---- */
      function openAdd() {
        var cat = 'Comida', acc = 'mp';
        CK.openSheet(phone, {
          title: 'Anotar gasto',
          build: function (sh, close) {
            sh.innerHTML =
              '<div class="k2-sh"><h2 class="k2-sht">Anotar gasto</h2>' +
              '<label class="k2-amt"><span class="ck-sr">Monto en pesos</span><span class="k2-cur" aria-hidden="true">$</span><input type="text" inputmode="decimal" autocomplete="off" placeholder="0" data-amt></label>' +
              '<p class="k2-err" role="alert" data-err></p>' +
              '<fieldset class="k2-fs"><legend>Categoría</legend><div class="k2-chips" data-cats>' +
              D.cats.map(function (c) { return '<button type="button" class="k2-chip" data-c="' + c + '" aria-pressed="' + (c === cat) + '">' + I(CK.catIcon[c], 16, 2.5) + c + '</button>'; }).join('') + '</div></fieldset>' +
              '<fieldset class="k2-fs"><legend>Cuenta</legend><div class="k2-chips" data-accs>' +
              D.accounts.map(function (a) { return '<button type="button" class="k2-chip" data-a="' + a.id + '" aria-pressed="' + (a.id === acc) + '">' + I(CK.accIcon[a.type], 16, 2.5) + SHORT[a.id] + '</button>'; }).join('') + '</div></fieldset>' +
              '<label class="k2-det"><span>Detalle (opcional)</span><input type="text" autocomplete="off" maxlength="60" placeholder="¿En qué?" data-det></label>' +
              '<button type="button" class="k2-save" data-save>' + I('check', 22, 3) + '<span>Guardar gasto</span></button></div>' +
              '<button type="button" class="k2-x" aria-label="Cerrar">' + I('x', 22, 3) + '</button>';
            var amt = sh.querySelector('[data-amt]'), err = sh.querySelector('[data-err]');
            function pick(box, attr, val) { [].forEach.call(box.querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute(attr) === val)); }); }
            sh.querySelector('[data-cats]').onclick = function (e) { var b = e.target.closest('[data-c]'); if (b) { cat = b.getAttribute('data-c'); pick(this, 'data-c', cat); } };
            sh.querySelector('[data-accs]').onclick = function (e) { var b = e.target.closest('[data-a]'); if (b) { acc = b.getAttribute('data-a'); pick(this, 'data-a', acc); } };
            sh.querySelector('.k2-x').onclick = close;
            function save() {
              var p = CK.parse(amt.value);
              if (!p.ok) { err.innerHTML = I('alert', 16, 2.5) + ' Ingresá un monto mayor a cero.'; amt.focus(); return; }
              var det = sh.querySelector('[data-det]').value.trim();
              close(); addExp({ name: det || cat, amount: p.amount, cat: cat, acc: acc });
            }
            sh.querySelector('[data-save]').onclick = save;
            sh.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); save(); } });
          }
        });
      }

      /* ---- eventos ---- */
      sc.addEventListener('click', function (e) {
        var t = e.target.closest('button'); if (!t) return;
        if (t.hasAttribute('data-add')) openAdd();
        else if (t.hasAttribute('data-f')) { var f = D.frequent[+t.getAttribute('data-f')]; addExp({ name: f.label, amount: f.amount, cat: f.cat, acc: f.acc }); }
        else if (t.hasAttribute('data-pay')) payFixed(+t.getAttribute('data-pay'));
        else if (t.hasAttribute('data-void')) voidMove(t.getAttribute('data-void'));
      });
      nav.addEventListener('click', function (e) { if (e.target.closest('[data-add]')) openAdd(); });

      /* deslizar a la izquierda para anular (la alternativa por botón siempre está visible) */
      var drag = null;
      sc.addEventListener('pointerdown', function (e) {
        var b = e.target.closest('.k2-bub'); if (!b || e.target.closest('button')) return;
        drag = { el: b, x: e.clientX, dx: 0, id: e.pointerId };
      });
      sc.addEventListener('pointermove', function (e) {
        if (!drag || e.pointerId !== drag.id) return;
        drag.dx = Math.min(0, e.clientX - drag.x);
        if (drag.dx < -6) { drag.el.parentNode.classList.add('k2-drag'); drag.el.style.transform = 'translateX(' + drag.dx + 'px)'; }
      });
      function endDrag(e) {
        if (!drag || (e && e.pointerId !== drag.id)) return;
        var d = drag; drag = null; d.el.parentNode.classList.remove('k2-drag'); d.el.style.transform = '';
        if (d.dx < -90) voidMove(d.el.getAttribute('data-id'));
      }
      sc.addEventListener('pointerup', endDrag); sc.addEventListener('pointercancel', endDrag);

      /* ---- render ---- */
      function coin() {
        var c = E('span', 'k2-coin', '$'); c.setAttribute('aria-hidden', 'true'); coins.appendChild(c);
        setTimeout(function () { c.remove(); }, 900);
        balEl.classList.remove('k2-shake'); void balEl.offsetWidth; balEl.classList.add('k2-shake');
      }
      function pct(n) { return Math.round(n * 100); }

      function render(st, info) {
        CK.odometer(balEl, CK.fmt(st.balance));
        var left = st.income > 0 ? Math.max(0, Math.min(1, (st.income - st.expense) / st.income)) : 0;
        jarLiq.style.transform = 'translateY(' + ((1 - left) * 100) + '%)';
        q('[data-lvl]').innerHTML = 'Te queda <b>' + pct(left) + '%</b> del mes';
        jar.setAttribute('aria-label', 'Frasco del mes: queda el ' + pct(left) + '% de lo que entró');
        q('[data-in]').textContent = '+ ' + CK.fmt(st.income);
        q('[data-out]').textContent = '− ' + CK.fmt(st.expense);

        /* presupuestos (se actualizan, no se reconstruyen: así el nivel se anima) */
        st.budgets.forEach(function (b) {
          if (!b.limit) { q('[data-otros]').innerHTML = I('more', 16, 2.5) + '<span><b>Otros</b> · ' + CK.fmt(b.used) + ' · sin tope</span>'; return; }
          var li = q('.k2-bj[data-cat="' + b.cat + '"]'), p = b.used / b.limit, state = p > 1 ? 'over' : p >= 0.9 ? 'near' : 'ok';
          var j = li.querySelector('.k2-jar');
          j.classList.toggle('k2-over', state === 'over'); j.classList.toggle('k2-near', state === 'near');
          j.querySelector('.k2-liq').style.transform = 'translateY(' + ((1 - Math.min(p, 1)) * 100) + '%)';
          li.querySelector('.k2-bm').innerHTML = '<b>' + pct(p) + '%</b> ' + CK.fmt(b.used) + '<br><span>de ' + CK.fmt(b.limit) + '</span>';
          var tag = li.querySelector('.k2-tag'); tag.className = 'k2-tag k2-t-' + state;
          tag.innerHTML = state === 'over' ? I('alert', 13, 3) + 'Superado' : state === 'near' ? I('clock', 13, 3) + 'Cerca' : I('check', 13, 3) + 'Ok';
        });

        /* para pagar */
        var order = st.fixed.map(function (f, i) { return { f: f, i: i }; }).sort(function (a, b) { return (a.f.paid - b.f.paid) || (a.f.days - b.f.days); });
        q('[data-fixed]').innerHTML = order.map(function (o) {
          var f = o.f, late = !f.paid && f.days < 0, day = D.day + f.days;
          var when = f.paid ? 'Pagado' : f.days < 0 ? 'Venció hace ' + plural(-f.days, 'día', 'días') : f.days === 0 ? 'Vence hoy' : 'Vence en ' + plural(f.days, 'día', 'días');
          return '<li class="k2-tk' + (f.paid ? ' k2-paid' : '') + (late ? ' k2-late' : '') + '"><div class="k2-stub"><b>' + day + '</b><span>' + MONTHS + '</span></div>' +
            '<div class="k2-tkb"><p class="k2-tkn">' + esc(f.name) + '</p><p class="k2-tkm">' + CK.fmt(f.amount) + (f.cycle ? ' · ' + f.cycle : '') + '</p>' +
            '<p class="k2-tkw">' + (late ? '<span class="k2-stamp">' + I('alert', 14, 3) + 'VENCIDO</span> ' : f.paid ? I('check', 14, 3) : I('clock', 14, 2.5)) + '<span>' + when + '</span></p></div>' +
            (f.paid ? '<span class="k2-done" aria-hidden="true">' + I('check', 22, 3) + '</span>' : '<button type="button" class="k2-pay" data-pay="' + o.i + '" aria-label="Pagar ' + esc(f.name) + ', ' + CK.fmt(f.amount) + '">Pagar</button>') + '</li>';
        }).join('');

        /* cuentas */
        q('[data-acc]').innerHTML = st.accounts.map(function (a) {
          var debt = a.balance < 0;
          return '<li class="k2-ac' + (debt ? ' k2-debt' : '') + '"><div class="k2-aci">' + I(CK.accIcon[a.type], 20, 2.5) + (debt ? '<span class="k2-tag k2-t-over">' + I('alert', 13, 3) + 'Deuda</span>' : '') + '</div>' +
            '<p class="k2-acn">' + esc(a.name) + '</p><p class="k2-acb">' + CK.fmt(a.balance) + '</p></li>';
        }).join('');

        /* movimientos */
        var newId = info && (info.type === 'add' || info.type === 'pay') && info.move ? info.move.id : null;
        q('[data-moves]').innerHTML = st.moves.slice(0, 8).map(function (m) {
          var tr = m.kind === 'transfer', inc = m.kind === 'income';
          var ic = tr ? 'swap' : inc ? 'up' : (CK.catIcon[m.cat] || 'more');
          var meta = tr ? esc(SHORT[m.acc] || m.acc) + ' → ' + esc(SHORT[m.to] || m.to) : esc(m.cat) + ' · ' + esc(SHORT[m.acc] || m.acc);
          var amount = tr ? CK.fmt(m.amount) : CK.sg(m.amount);
          return '<li class="k2-bw"><div class="k2-bg" aria-hidden="true">' + I('undo', 18, 3) + ' Anular</div>' +
            '<div class="k2-bub' + (m.id === newId ? ' k2-new' : '') + (inc ? ' k2-inc' : '') + '" data-id="' + m.id + '"><span class="k2-mi" aria-hidden="true">' + I(ic, 18, 2.5) + '</span>' +
            '<div class="k2-mt"><p class="k2-mn">' + esc(m.name) + '</p><p class="k2-mm">' + meta + ' · ' + m.date + '</p></div>' +
            '<div class="k2-mr"><p class="k2-ma' + (inc ? ' k2-in' : '') + '">' + amount + '</p><button type="button" class="k2-vd" data-void="' + m.id + '" aria-label="Anular ' + esc(m.name) + '">Anular</button></div></div></li>';
        }).join('');

        if (info && (info.type === 'add' || info.type === 'pay')) coin();
      }

      store.on(render);
      render(s, {});
    }
  });
})();
