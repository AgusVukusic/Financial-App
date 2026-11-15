import { parseAmountInput } from './amountInput';
import { localDateString } from './frequentExpenses';

/**
 * Texto natural para anotar un movimiento: "café 3500", "nafta 3,5k", "super 30 mil", "sueldo 1.850.000",
 * "farmacia 8000 ayer", "uber 4500 efectivo".
 *
 * Devuelve lo que se entendió; no decide nada por la persona: la hoja muestra la interpretación y deja corregir
 * categoría, cuenta, tipo y fecha. Función pura, sin acceso a datos.
 */

// Palabras enteras (exactas) y raíces (el comienzo de la palabra) por categoría. Sin tildes ni mayúsculas.
const CATEGORY_WORDS = {
  Comida: {
    exact: ['cafe', 'dia', 'bar', 'resto', 'mate', 'vino', 'birra', 'pan', 'carne', 'coto', 'jumbo', 'disco', 'rappi'],
    stems: ['almuerz', 'cena', 'desayun', 'meriend', 'super', 'verdu', 'carnic', 'panader', 'pedidosya', 'comida', 'helad', 'pizza', 'empanad', 'kiosc', 'restaur', 'cerveza', 'asado', 'hamburgues', 'sushi', 'carrefour', 'chino', 'fiambr', 'rotiser', 'delivery', 'bebida', 'gaseosa'],
  },
  Transporte: {
    exact: ['sube', 'uber', 'taxi', 'tren', 'gnc', 'moto', 'bondi'],
    stems: ['nafta', 'cabify', 'colectiv', 'peaje', 'estacion', 'subte', 'combustible', 'remis', 'bicicleta', 'patente', 'cochera', 'didi'],
  },
  Servicios: {
    exact: ['luz', 'gas', 'agua', 'abl', 'seguro', 'celular', 'movistar'],
    stems: ['edenor', 'edesur', 'metrogas', 'aysa', 'internet', 'fibertel', 'telecentro', 'netflix', 'spotify', 'disney', 'hbo', 'youtube', 'expensas', 'prepaga', 'obra social', 'cable', 'telefono', 'suscripcion', 'monotributo', 'impuesto', 'municipal', 'inmobiliaria'],
  },
  Hogar: {
    exact: ['casa', 'mueble', 'muebles', 'pintura', 'reparacion'],
    stems: ['alquiler', 'ferret', 'limpieza', 'plomer', 'electricista', 'jardin', 'colchon', 'cocina', 'lavarropas', 'heladera', 'decoracion', 'mantenimiento', 'cerrajer'],
  },
  Compras: {
    exact: ['ropa', 'libro', 'libros', 'regalo', 'compra', 'amazon'],
    stems: ['zapatill', 'auricular', 'mercadolibre', 'remera', 'pantalon', 'campera', 'zapato', 'juguete', 'tienda', 'shopping', 'electrodomest', 'notebook'],
  },
};

const INCOME_WORDS = {
  exact: ['sueldo', 'aguinaldo', 'cobre', 'cobro', 'ingreso', 'freelance', 'honorarios', 'reintegro', 'venta', 'vendi', 'premio'],
  phrases: ['me pagaron', 'me depositaron', 'me transfirieron'],
};

// Palabras que no sirven para reconocer una cuenta por su nombre.
const ACCOUNT_STOPWORDS = new Set(['cuenta', 'banco', 'caja', 'tarjeta', 'de', 'la', 'el', 'del', 'los', 'las', 'mi', 'mis']);

const strip = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Palabras de un texto ya sin tildes, con su posición en el original (las tildes no cambian el largo con NFC). */
const wordsOf = (text) => {
  const out = [];
  const re = /[\p{L}\p{N}]+/gu;
  let m;
  while ((m = re.exec(text))) out.push({ raw: m[0], norm: strip(m[0]), start: m.index, end: m.index + m[0].length });
  return out;
};

const matchesWords = (norm, { exact = [], stems = [], phrases = [] }, words) => {
  if (words.some((w) => exact.includes(w.norm))) return true;
  if (words.some((w) => stems.some((s) => w.norm.startsWith(s.trim())))) return true;
  return phrases.some((p) => norm.includes(p));
};

/** Categoría probable (una de las 6 de gasto) o null si no hay ninguna pista. */
export const guessCategory = (text) => {
  const norm = strip(text);
  const words = wordsOf(norm);
  for (const [category, rules] of Object.entries(CATEGORY_WORDS)) {
    if (matchesWords(norm, rules, words)) return category;
  }
  return null;
};

const NUMBER_RE = /(\$\s*)?(\d[\d.,]*)(?:\s*(k|mil|lucas?)(?![\p{L}\p{N}]))?/giu;

/** Todos los montos posibles del texto, con su posición. Un "número" que no es un monto válido ("1.2.3") se descarta. */
const findAmounts = (text) => {
  const found = [];
  let m;
  NUMBER_RE.lastIndex = 0;
  while ((m = NUMBER_RE.exec(text))) {
    // Un número pegado a letras ("2x1", "b12") no es un monto.
    const before = text[m.index - 1];
    const after = text[m.index + m[0].length];
    if (before && /\p{L}/u.test(before) && !m[1]) continue;
    if (!m[3] && after && /\p{L}/u.test(after)) continue;
    const base = parseAmountInput(m[2].replace(/[.,]+$/, ''));
    if (base === null || base <= 0) continue;
    const mult = m[3] ? 1000 : 1;
    found.push({
      value: Math.round(base * mult * 100) / 100,
      index: m.index,
      length: m[0].length,
      text: m[0],
      marked: Boolean(m[1]) || Boolean(m[3]),
      thousands: Boolean(m[3]),
    });
  }
  return found;
};

const DATE_WORDS = [
  { re: /\b(anteayer|antes de ayer|antier)\b/i, back: 2 },
  { re: /\bayer\b/i, back: 1 },
  { re: /\bhoy\b/i, back: 0 },
];

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/**
 * Cuenta mencionada en el texto. Se reconoce por: el nombre completo ("mercado pago", "efectivo"), las iniciales de un
 * nombre de varias palabras ("mp"), o la primera palabra del nombre si es lo último que se escribió ("super 30000 visa").
 * Una palabra suelta del medio ("mercado del barrio", "ahorro del mes") no alcanza: sería adivinar. Si el texto menciona
 * dos cuentas distintas, no se elige ninguna.
 */
const findAccount = (text, accounts) => {
  if (!accounts || accounts.length === 0) return null;
  const norm = strip(text);
  const words = wordsOf(norm);
  const lastWord = words.length ? words[words.length - 1] : null;
  const hits = new Map(); // id -> [{ start, end }]
  const hit = (id, start, end) => hits.set(id, [...(hits.get(id) || []), { start, end }]);

  // Primera palabra de cada cuenta, para saber si es única entre todas.
  const firstWords = new Map();
  accounts.forEach((acc) => {
    const first = wordsOf(strip(acc.name)).map((w) => w.norm).find((w) => !ACCOUNT_STOPWORDS.has(w) && w.length >= 3);
    if (first) firstWords.set(first, [...(firstWords.get(first) || []), acc.id]);
  });

  accounts.forEach((acc) => {
    const nameWords = wordsOf(strip(acc.name)).map((w) => w.norm);
    const significant = nameWords.filter((w) => !ACCOUNT_STOPWORDS.has(w));
    if (nameWords.length === 0) return;

    // Nombre completo (con sus palabras seguidas).
    const phrase = nameWords.join('\\s+');
    const full = new RegExp(`(?<![\\p{L}\\p{N}])${phrase}(?![\\p{L}\\p{N}])`, 'u').exec(norm);
    if (full) hit(acc.id, full.index, full.index + full[0].length);

    // Iniciales de un nombre de varias palabras.
    if (significant.length >= 2) {
      const initials = significant.map((w) => w[0]).join('');
      if (initials.length >= 2) words.filter((w) => w.norm === initials).forEach((w) => hit(acc.id, w.start, w.end));
    }

    // Primera palabra, solo si es lo último escrito y no es de otra cuenta.
    const first = significant.find((w) => w.length >= 3);
    if (first && lastWord && lastWord.norm === first && (firstWords.get(first) || []).length === 1) hit(acc.id, lastWord.start, lastWord.end);
  });

  const ids = [...hits.keys()];
  if (ids.length !== 1) return null;
  return { id: ids[0], words: hits.get(ids[0]) };
};

/**
 * Interpreta el texto. `accounts` ([{ id, name }]) permite reconocer la cuenta; `today` es la fecha de referencia.
 * `ok` es verdadero solo si hay un monto mayor a cero.
 */
export const parseEntry = (text, { accounts = [], today = new Date() } = {}) => {
  const source = String(text ?? '');
  const trimmed = source.trim();
  if (!trimmed) return { ok: false, empty: true, amount: 0, description: '', category: null, type: null, accountId: null, date: null, amountToken: null };

  const amounts = findAmounts(source);
  let chosen = null;
  if (amounts.length === 1) chosen = amounts[0];
  else if (amounts.length > 1) {
    const marked = amounts.filter((a) => a.marked);
    chosen = marked.length === 1 ? marked[0] : amounts.reduce((best, a) => (a.value > best.value ? a : best));
  }

  // Lo que queda del texto sin el monto, la fecha y la cuenta es la descripción.
  const without = chosen ? source.slice(0, chosen.index) + ' ' + source.slice(chosen.index + chosen.length) : source;
  let rest = without;

  let date = null;
  for (const { re, back } of DATE_WORDS) {
    if (re.test(rest)) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - back);
      date = localDateString(d);
      rest = rest.replace(re, ' ');
      break;
    }
  }

  const account = findAccount(rest, accounts);
  if (account) {
    // Se quitan de atrás para adelante así las posiciones no se corren.
    [...account.words].sort((a, b) => b.start - a.start).forEach((w) => {
      rest = rest.slice(0, w.start) + ' ' + rest.slice(w.end);
    });
  }

  // "café por 3500" / "pagué en 3500": conectores que quedaron colgando en las puntas.
  const description = capitalize(
    rest
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^(por|de|en|x)\s+/i, '')
      .replace(/\s+(por|de|en|x|a)$/i, '')
      .trim(),
  );

  const norm = strip(description);
  const words = wordsOf(norm);
  const isIncome = matchesWords(norm, INCOME_WORDS, words);

  return {
    ok: Boolean(chosen),
    empty: false,
    amount: chosen ? chosen.value : 0,
    description,
    category: guessCategory(description),
    type: isIncome ? 'income' : null,
    accountId: account ? account.id : null,
    date,
    amountToken: chosen ? { text: chosen.text.trim(), index: chosen.index, thousands: chosen.thousands } : null,
  };
};
