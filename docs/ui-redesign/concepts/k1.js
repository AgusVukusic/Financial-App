/* fonts: Archivo:wdth,wght@62..125,400..900 */
(function () {
  var CK = window.CK, D = CK.data, E = CK.el, I = CK.icon;
  var LET = { Comida: 'A', Compras: 'B', Hogar: 'C', Transporte: 'D', Servicios: 'E', Otros: 'H' };
  var COL = { Comida: 'a', Compras: 'b', Hogar: 'c', Transporte: 'd', Servicios: 'e', Otros: 'h' };

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function rd(cat, extra) {
    if (cat === 'Transferencia') return '<span class="k1-rd k1-rd-x ' + (extra || '') + '" aria-hidden="true">' + I('swap', 14, 2.4) + '</span>';
    if (cat === 'Ingreso') return '<span class="k1-rd k1-rd-in ' + (extra || '') + '" aria-hidden="true">' + I('plus', 14, 2.8) + '</span>';
    return '<span class="k1-rd ' + (extra || '') + '" style="--c:var(--c' + COL[cat] + ')" aria-hidden="true">' + LET[cat] + '</span>';
  }
  function accName(id) { var a = CK.accById(id); return a ? a.name : id; }
  function when(d) {
    if (d < 0) return 'vencido hace ' + (-d) + (d === -1 ? ' día' : ' días');
    if (d === 0) return 'hoy';
    if (d === 1) return 'mañana';
    return 'en ' + d + ' días';
  }
  var TRAIN = '<svg width="30" height="22" viewBox="0 0 30 22" aria-hidden="true"><rect x="1" y="1" width="28" height="15" rx="6" fill="currentColor"/><rect x="5" y="4.5" width="7" height="6" rx="1.5" fill="var(--surf)"/><rect x="14" y="4.5" width="7" height="6" rx="1.5" fill="var(--surf)"/><circle cx="8" cy="19" r="2.2" fill="currentColor"/><circle cx="22" cy="19" r="2.2" fill="currentColor"/></svg>';

  CK.register({
    id: 'k1', name: '1 · Estación',
    info: {
      tagline: 'La cartelería del subte llevada a la plata: el saldo es el cartel de la estación, cada categoría es una línea con su letra y su color, y el mes se lee como un recorrido.',
      novelty: [
        'Saldo con odómetro dentro de un cartel de estación; al anotar un gasto los dígitos ruedan y el monto sube desde abajo.',
        'Termómetro de ritmo: una línea con un tren que marca lo gastado contra lo esperado a esta altura del mes, con banda de rango y frase explícita.',
        'Próximas paradas: los gastos fijos como estaciones sobre una línea vertical, con el vencido marcado con ícono y texto.',
        'Movimientos como estaciones con roundel de la línea de su categoría; la transferencia lleva doble anillo.',
        'Hoja Anotar con teclado numérico propio: toque 1 el monto, toque 2 la categoría y queda guardado (cuenta Mercado Pago por defecto).'
      ],
      refs: [
        'Cartelería del subte de Buenos Aires: rotulación, líneas y letras',
        'Gentler Streak: banda de rango',
        'Copilot Money: línea de ritmo',
        'NumberFlow: odómetro',
        'Emil Kowalski / Vaul: hoja con inercia al arrastrar',
        'Cashew: frecuentes de un toque'
      ],
      type: 'Archivo con eje de ancho: condensada en rótulos y montos, normal en lectura. Cartel azul noche en ambos temas; categorías en celeste, magenta, azul, violeta, verde azulado y gris pizarra; el verde, el rojo y el ámbar quedan reservados para ingreso, superado y cerca del límite.',
      risks: [
        'Seis letras y colores se aprenden con el uso; hasta entonces el nombre de la categoría siempre acompaña.',
        'Mucho vocabulario de línea y estación puede cansar a quien no conoce el subte.',
        'La hoja guarda al elegir categoría: un toque equivocado se corrige solo con Deshacer.',
        'El termómetro agrega los topes en una sola barra y oculta cuál categoría empuja el desvío.',
        'La fuente variable pesa más que una del sistema.'
      ]
    },
    mount: function (phone, store) {
      var S = store.state, newId = null;
      phone.innerHTML = '';
      var app = E('div', 'ck-app'), scroll = E('div', 'ck-scroll'), nav = E('nav', 'k1-nav');
      nav.setAttribute('aria-label', 'Principal');
      scroll.innerHTML =
        '<header class="k1-sign">' +
          '<div class="k1-sg-top"><span class="k1-sg-lab">ESTACIÓN · SALDO TOTAL</span><span class="k1-sg-mo">' + esc(D.month) + '</span></div>' +
          '<div class="k1-bal"></div>' +
          '<div class="k1-flows"><p><span class="k1-fl">Entró</span><span class="k1-fv k1-fin"></span></p><p><span class="k1-fl">Salió</span><span class="k1-fv k1-fout"></span></p></div>' +
          '<div class="k1-lines" aria-hidden="true">' + D.cats.map(function (c) { return '<i style="background:var(--c' + COL[c] + ')"></i>'; }).join('') + '</div>' +
          '<div class="k1-ghosts" aria-hidden="true"></div>' +
        '</header>' +
        '<div class="k1-quick">' +
          '<button type="button" class="k1-cta">' + I('plus', 22, 2.6) + '<span>Anotar gasto</span></button>' +
          '<h2 class="k1-kick">Frecuentes · un toque lo registra</h2>' +
          '<div class="k1-chips" role="group" aria-label="Gastos frecuentes">' +
            D.frequent.map(function (f, i) {
              return '<button type="button" class="k1-chip" data-f="' + i + '" aria-label="Registrar ' + esc(f.label) + ' ' + CK.fmt(f.amount) + '">' + rd(f.cat) + '<span class="k1-cl">' + esc(f.label) + '</span><span class="k1-cv">' + CK.fmt(f.amount) + '</span></button>';
            }).join('') +
          '</div>' +
        '</div>' +
        '<section class="k1-card k1-pace" aria-labelledby="k1-pt">' +
          '<h2 class="k1-kick" id="k1-pt">Termómetro de ritmo</h2>' +
          '<p class="k1-pace-t"></p>' +
          '<div class="k1-line" aria-hidden="true">' +
            '<span class="k1-band"></span><span class="k1-trk"><span class="k1-fill"></span></span>' +
            '<span class="k1-pw k1-pw-e"><span class="k1-tick"></span><span class="k1-elab"></span></span>' +
            '<span class="k1-pw k1-pw-t"><span class="k1-train">' + TRAIN + '</span></span>' +
          '</div>' +
          '<ul class="k1-legend"><li><i class="k1-sw k1-sw-band"></i>Zona de ritmo (±10%)</li><li><i class="k1-sw k1-sw-tick"></i>Esperado hoy</li><li><span class="k1-lt">' + TRAIN + '</span>Gastado</li></ul>' +
          '<p class="k1-pace-s"></p>' +
        '</section>' +
        '<section class="k1-card" aria-labelledby="k1-hp"><h2 class="k1-kick" id="k1-hp">Próximas paradas · para pagar</h2><ol class="k1-stops"></ol></section>' +
        '<section class="k1-card" aria-labelledby="k1-hb"><h2 class="k1-kick" id="k1-hb">Presupuestos</h2><ul class="k1-buds"></ul></section>' +
        '<section class="k1-card" aria-labelledby="k1-ha"><h2 class="k1-kick" id="k1-ha">Cuentas</h2><ul class="k1-accs"></ul></section>' +
        '<section class="k1-card" aria-labelledby="k1-hm"><h2 class="k1-kick" id="k1-hm">Movimientos recientes</h2><ol class="k1-moves"></ol></section>' +
        '<div class="k1-end" aria-hidden="true"></div>';
      nav.innerHTML =
        '<button type="button" class="k1-nb k1-cur" aria-current="page">' + I('home', 22) + '<span>Inicio</span></button>' +
        '<button type="button" class="k1-nb">' + I('pie', 22) + '<span>Reportes</span></button>' +
        '<button type="button" class="k1-nb k1-nadd" aria-label="Anotar gasto">' + I('plus', 24, 2.8) + '<span>Anotar</span></button>' +
        '<button type="button" class="k1-nb">' + I('user', 22) + '<span>Perfil</span></button>';
      app.appendChild(scroll); app.appendChild(nav); phone.appendChild(app);

      var q = function (s) { return scroll.querySelector(s); };
      var balEl = q('.k1-bal'), fin = q('.k1-fin'), fout = q('.k1-fout'), ghosts = q('.k1-ghosts');
      var stops = q('.k1-stops'), buds = q('.k1-buds'), accs = q('.k1-accs'), moves = q('.k1-moves');

      /* ---------- Presupuestos: lista persistente para que las barras se animen ---------- */
      buds.innerHTML = S.budgets.map(function (b) {
        return '<li class="k1-b" data-cat="' + b.cat + '"><div class="k1-bt">' + rd(b.cat) + '<span class="k1-bn">' + b.cat + '</span><span class="k1-bv"></span></div>' +
          '<div class="k1-bar" aria-hidden="true"><span class="k1-bf" style="--p:0;--c:var(--c' + COL[b.cat] + ')"></span></div><p class="k1-st"></p></li>';
      }).join('');
      function updBud(first) {
        S.budgets.forEach(function (b) {
          var li = buds.querySelector('[data-cat="' + b.cat + '"]'), st, cls, pct;
          if (b.limit) {
            pct = b.used / b.limit * 100;
            if (pct > 100) { cls = 'over'; st = I('alert', 16, 2.4) + '<span>Superado por ' + CK.fmt(b.used - b.limit) + '</span>'; }
            else if (pct >= 90) { cls = 'near'; st = I('alert', 16, 2.4) + '<span>Cerca del límite · ' + Math.round(pct) + '%</span>'; }
            else { cls = 'ok'; st = I('check', 16, 2.6) + '<span>Dentro del tope · ' + Math.round(pct) + '%</span>'; }
            li.querySelector('.k1-bv').innerHTML = CK.fmt(b.used) + ' <i>de ' + CK.fmt(b.limit) + '</i>';
          } else {
            cls = 'none'; st = '<span>Sin tope · no suma al ritmo</span>'; pct = 0;
            li.querySelector('.k1-bv').innerHTML = CK.fmt(b.used);
          }
          li.className = 'k1-b k1-b-' + cls;
          li.querySelector('.k1-st').innerHTML = st;
          li.querySelector('.k1-bf').style.setProperty('--p', first ? 0 : Math.min(1, pct / 100));
          li._p = Math.min(1, pct / 100);
        });
      }

      /* ---------- Termómetro de ritmo ---------- */
      function updPace(first) {
        var lim = 0, sp = 0;
        S.budgets.forEach(function (b) { if (b.limit) { lim += b.limit; sp += b.used; } });
        var exp = lim * D.day / D.daysInMonth, max = Math.max(lim, sp) || 1;
        var diff = exp ? Math.round((sp / exp - 1) * 100) : 0, state = diff > 10 ? 'over' : diff < -10 ? 'under' : 'ok';
        var t = q('.k1-pace-t');
        t.className = 'k1-pace-t k1-p-' + state;
        t.innerHTML = state === 'over' ? I('alert', 20, 2.4) + '<span>Vas ' + diff + '% por encima del ritmo</span>'
          : state === 'under' ? I('check', 20, 2.6) + '<span>Vas ' + (-diff) + '% por debajo del ritmo</span>'
          : I('check', 20, 2.6) + '<span>Vas en ritmo</span>';
        q('.k1-pace-s').textContent = 'Llevás ' + CK.fmt(sp) + ' gastados en categorías con tope; a día ' + D.day + ' de ' + D.daysInMonth + ' lo esperado es ' + CK.fmt(exp) + '. Tope total del mes: ' + CK.fmt(lim) + '.';
        var line = q('.k1-line');
        line.className = 'k1-line k1-l-' + state;
        var band = q('.k1-band');
        band.style.left = (exp * 0.9 / max * 100) + '%';
        band.style.width = (exp * 0.2 / max * 100) + '%';
        q('.k1-pw-e').style.setProperty('--x', (exp / max * 100) + '%');
        q('.k1-pw-t').style.setProperty('--x', (first ? 0 : sp / max * 100) + '%');
        q('.k1-fill').style.setProperty('--p', first ? 0 : sp / max);
        q('.k1-elab').textContent = 'Hoy · día ' + D.day;
        line._t = [sp / max * 100, sp / max];
      }

      /* ---------- Próximas paradas ---------- */
      function renderStops() {
        var order = S.fixed.map(function (f, i) { return i; }).sort(function (a, b) {
          var A = S.fixed[a], B = S.fixed[b]; return (A.paid - B.paid) || (A.days - B.days);
        });
        stops.innerHTML = order.map(function (i) {
          var f = S.fixed[i], late = !f.paid && f.days < 0, cls = f.paid ? 'paid' : late ? 'late' : 'ok';
          var dot = f.paid ? I('check', 14, 3) : late ? I('alert', 14, 2.6) : '';
          var w = f.paid ? '<p class="k1-sw-t">' + I('check', 15, 2.6) + '<span>Pagado</span></p>'
            : late ? '<p class="k1-sw-t k1-late">' + I('alert', 15, 2.4) + '<span>' + when(f.days).charAt(0).toUpperCase() + when(f.days).slice(1) + '</span></p>'
            : '<p class="k1-sw-t"><span>' + (f.days <= 1 ? 'Vence ' : 'Vence ') + when(f.days) + '</span></p>';
          var act = f.paid ? '<span class="k1-pd">' + CK.fmt(f.amount) + '</span>' :
            '<span class="k1-pd">' + CK.fmt(f.amount) + '</span><button type="button" class="k1-pay" data-pay="' + i + '" aria-label="Pagar ' + esc(f.name) + ' ' + CK.fmt(f.amount) + '">Pagar</button>';
          return '<li class="k1-stop k1-s-' + cls + '"><span class="k1-dot" aria-hidden="true">' + dot + '</span><div class="k1-sb"><p class="k1-sn">' + esc(f.name) + (f.cycle ? ' <em>' + f.cycle + '</em>' : '') + '</p>' + w +
            '<p class="k1-sm">' + f.cat + ' · ' + esc(accName(f.acc)) + '</p></div><div class="k1-sa">' + act + '</div></li>';
        }).join('');
      }

      function renderAccs() {
        accs.innerHTML = S.accounts.map(function (a) {
          var debt = a.balance < 0;
          return '<li class="k1-ac"><span class="k1-ai" aria-hidden="true">' + I(CK.accIcon[a.type], 20) + '</span><span class="k1-an">' + esc(a.name) + '</span>' +
            '<span class="k1-av">' + (debt ? '<span class="k1-tag">Deuda</span>' : '') + '<b>' + CK.fmt(a.balance) + '</b></span></li>';
        }).join('');
      }

      function renderMoves() {
        moves.innerHTML = S.moves.slice(0, 8).map(function (m) {
          var tr = m.kind === 'transfer', inc = m.kind === 'income';
          var amt = tr ? '<span class="k1-mt">' + I('swap', 14, 2.4) + CK.fmt(Math.abs(m.amount)) + '</span>' : inc ? '<span class="k1-mi">' + CK.sg(m.amount) + '</span>' : '<span class="k1-mo">' + CK.sg(m.amount) + '</span>';
          var meta = tr ? esc(accName(m.acc)) + ' → ' + esc(accName(m.to)) : esc(m.cat === 'Ingreso' ? 'Ingreso' : m.cat) + ' · ' + esc(accName(m.acc));
          return '<li class="k1-m' + (m.id === newId ? ' k1-new' : '') + '"><span class="k1-ms">' + rd(m.cat) + '</span><div class="k1-mb"><p class="k1-mn">' + esc(m.name) + '</p><p class="k1-mm">' + meta + ' · ' + m.date + '</p></div><div class="k1-ma">' + amt + '</div></li>';
        }).join('');
      }

      function ghost(m) {
        var g = E('span', 'k1-ghost', CK.sg(m.amount)); ghosts.appendChild(g);
        setTimeout(function () { g.remove(); }, 1300);
      }

      var first = true;
      function render(s, info) {
        info = info || {};
        if (info.type === 'add' || info.type === 'pay') { newId = info.move.id; ghost(info.move); } else if (info.type === 'undo') newId = null;
        CK.odometer(balEl, CK.fmt(s.balance));
        fin.textContent = CK.sg(s.income); fout.textContent = CK.sg(-s.expense);
        renderStops(); renderAccs(); renderMoves(); updBud(first); updPace(first);
        if (first) {
          first = false;
          requestAnimationFrame(function () { requestAnimationFrame(function () {
            updBud(false); updPace(false);
          }); });
        }
      }
      store.on(render);
      render(S, {});

      /* ---------- Acciones ---------- */
      function toastUndo(text, undo) { CK.toast(phone, { text: text, actionLabel: 'Deshacer', onAction: undo }); }
      scroll.addEventListener('click', function (e) {
        var c = e.target.closest('[data-f]'), p = e.target.closest('[data-pay]');
        if (c) {
          var f = D.frequent[+c.dataset.f], undo = store.add({ name: f.label, amount: f.amount, cat: f.cat, acc: f.acc });
          toastUndo('Registrado · ' + f.label + ' −' + CK.fmt(f.amount), undo);
        } else if (p) {
          var i = +p.dataset.pay, fx = S.fixed[i], u = store.pay(i);
          toastUndo('Pagado · ' + fx.name + ' ' + CK.fmt(fx.amount), u);
        } else if (e.target.closest('.k1-cta')) openAnotar();
      });
      nav.querySelector('.k1-nadd').addEventListener('click', function () { openAnotar(); });

      function openAnotar() {
        var amt = '', acc = 'mp';
        CK.openSheet(phone, {
          title: 'Anotar gasto',
          build: function (sh, close) {
            sh.classList.add('k1-sheet');
            var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'del'];
            sh.innerHTML =
              '<input class="k1-in ck-sr" type="text" inputmode="none" autocomplete="off" aria-label="Monto del gasto (también podés escribir con el teclado)">' +
              '<div class="k1-grab"><span class="k1-grip" aria-hidden="true"></span></div>' +
              '<div class="k1-sh-h"><h2>Anotar gasto</h2><button type="button" class="k1-x" aria-label="Cerrar">' + I('x', 20, 2.4) + '</button></div>' +
              '<div class="k1-av2" role="status"><span class="k1-av-l">Monto</span><span class="k1-av-v"></span></div>' +
              '<div class="k1-pad" role="group" aria-label="Teclado numérico">' + keys.map(function (k) {
                return k === 'del' ? '<button type="button" class="k1-key k1-key-d" data-k="del" aria-label="Borrar último dígito">' + I('back', 24, 2.2) + '</button>' : '<button type="button" class="k1-key" data-k="' + k + '">' + k + '</button>';
              }).join('') + '</div>' +
              '<div class="k1-accrow" role="group" aria-label="Cuenta">' + D.accounts.map(function (a) {
                return '<button type="button" class="k1-ab" data-a="' + a.id + '" aria-pressed="' + (a.id === acc) + '">' + I(CK.accIcon[a.type], 16, 2.2) + '<span>' + esc(a.name) + '</span></button>';
              }).join('') + '</div>' +
              '<p class="k1-hint" role="status"></p>' +
              '<div class="k1-cats" role="group" aria-label="Categoría: tocá una para guardar">' + D.cats.map(function (c) {
                return '<button type="button" class="k1-cat" data-c="' + c + '" aria-label="Guardar en ' + c + '">' + rd(c, 'k1-rd-l') + '<span>' + c + '</span></button>';
              }).join('') + '</div>';
            var input = sh.querySelector('.k1-in'), val = sh.querySelector('.k1-av-v'), hint = sh.querySelector('.k1-hint');
            function setHint(msg, warn) { hint.innerHTML = warn ? I('alert', 16, 2.4) + '<span>' + msg + '</span>' : '<span>' + msg + '</span>'; hint.classList.toggle('k1-warn', !!warn); }
            function paint() {
              val.textContent = '$ ' + (amt ? (+amt).toLocaleString('es-AR') : '0');
              val.classList.toggle('k1-zero', !amt); input.value = amt;
              setHint(amt ? 'Tocá una categoría para guardar' : 'Ingresá el monto con el teclado');
            }
            function press(k) {
              if (k === 'del') amt = amt.slice(0, -1);
              else { var n = (amt + k).replace(/^0+/, ''); if (n.length <= 9) amt = n; }
              paint();
            }
            sh.addEventListener('click', function (e) {
              var kb = e.target.closest('[data-k]'), ab = e.target.closest('[data-a]'), cb = e.target.closest('[data-c]');
              if (e.target.closest('.k1-x')) { close(); return; }
              if (kb) press(kb.dataset.k);
              else if (ab) {
                acc = ab.dataset.a;
                [].forEach.call(sh.querySelectorAll('[data-a]'), function (b) { b.setAttribute('aria-pressed', b.dataset.a === acc); });
              } else if (cb) {
                if (!amt || +amt <= 0) { setHint('Primero ingresá el monto', true); return; }
                var cat = cb.dataset.c, n = +amt, undo = store.add({ name: cat, amount: n, cat: cat, acc: acc });
                close(); toastUndo('Registrado · ' + cat + ' −' + CK.fmt(n), undo);
              }
            });
            sh.addEventListener('keydown', function (e) {
              if (e.ctrlKey || e.metaKey || e.altKey) return;
              if (/^\d$/.test(e.key)) { e.preventDefault(); press(e.key); }
              else if (e.key === 'Backspace') { e.preventDefault(); press('del'); }
            });
            input.addEventListener('input', function () { amt = input.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 9); paint(); });
            /* Arrastrar la manija: cierra con distancia o con velocidad; si no, vuelve con inercia */
            var grab = sh.querySelector('.k1-grab'), y0 = 0, t0 = 0, dy = 0, drag = false;
            grab.addEventListener('pointerdown', function (e) { drag = true; y0 = e.clientY; t0 = Date.now(); dy = 0; sh.style.transition = 'none'; if (grab.setPointerCapture) { try { grab.setPointerCapture(e.pointerId); } catch (x) { /* sin captura */ } } });
            grab.addEventListener('pointermove', function (e) { if (!drag) return; dy = Math.max(0, e.clientY - y0); sh.style.transform = 'translateY(' + dy + 'px)'; });
            function end() {
              if (!drag) return; drag = false;
              var v = dy / Math.max(1, Date.now() - t0);
              if (dy > 110 || (v > 0.6 && dy > 30)) close();
              else { sh.style.transition = 'transform .35s cubic-bezier(.2,.9,.25,1)'; sh.style.transform = ''; }
            }
            grab.addEventListener('pointerup', end); grab.addEventListener('pointercancel', end);
            paint();
          }
        });
      }
    }
  });
})();
