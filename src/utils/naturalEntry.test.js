import { describe, it, expect } from 'vitest';
import { parseEntry, guessCategory } from './naturalEntry';

const ACCOUNTS = [
  { id: 'mp', name: 'Mercado Pago' },
  { id: 'ef', name: 'Efectivo' },
  { id: 'visa', name: 'Visa Santander Platinum Internacional' },
  { id: 'ah', name: 'Ahorros USD (en pesos)' },
];
const TODAY = new Date(2026, 10, 15, 12); // 15 de noviembre de 2026

const parse = (t, over = {}) => parseEntry(t, { accounts: ACCOUNTS, today: TODAY, ...over });

describe('parseEntry · monto', () => {
  it.each([
    ['café 3500', 3500],
    ['café 3.500', 3500],
    ['café $3500', 3500],
    ['café $ 3.500', 3500],
    ['café 3,5', 3.5],
    ['nafta 3,5k', 3500],
    ['nafta 3k', 3000],
    ['super 30 mil', 30000],
    ['super 30mil', 30000],
    ['regalo 2 lucas', 2000],
    ['sueldo 1.850.000', 1850000],
    ['alquiler 320000', 320000],
    ['3500 café', 3500],
    ['café por 3500', 3500],
  ])('"%s" → %s', (text, amount) => {
    const r = parse(text);
    expect(r.ok).toBe(true);
    expect(r.amount).toBe(amount);
  });

  it('con varios números toma el que lleva $, k o mil; si no, el más grande', () => {
    expect(parse('3 empanadas 4500').amount).toBe(4500);
    expect(parse('pizza 2 porciones $ 6.000').amount).toBe(6000);
    expect(parse('nafta 8000 20 litros').amount).toBe(8000);
    expect(parse('2 cafés 5 mil').amount).toBe(5000);
  });

  it('un número pegado a letras no es un monto, y "k" dentro de una palabra tampoco', () => {
    expect(parse('2x1 pizza 3500').amount).toBe(3500);
    expect(parse('kilos 3').amount).toBe(3);
    expect(parse('3 kilos pan').amount).toBe(3);
    expect(parse('café b12').ok).toBe(false);
  });

  it('sin monto no es válido y lo dice', () => {
    expect(parse('café').ok).toBe(false);
    expect(parse('café 0').ok).toBe(false);
    expect(parse('café 1.2.3').ok).toBe(false);
    expect(parse('   ').empty).toBe(true);
    expect(parse('').ok).toBe(false);
  });

  it('un monto con centavos conserva los centavos', () => {
    expect(parse('farmacia 1.250,75').amount).toBe(1250.75);
  });
});

describe('parseEntry · descripción', () => {
  it('es el texto sin el monto, con la primera letra en mayúscula', () => {
    expect(parse('café 3500').description).toBe('Café');
    expect(parse('3500 café con medialunas').description).toBe('Café con medialunas');
    expect(parse('supermercado coto 45.230').description).toBe('Supermercado coto');
  });

  it('saca los conectores que quedan colgando', () => {
    expect(parse('café por 3500').description).toBe('Café');
    expect(parse('pagué luz de 15000').description).toBe('Pagué luz');
  });

  it('solo el monto deja la descripción vacía', () => {
    expect(parse('3500').description).toBe('');
    expect(parse('$ 3.500').ok).toBe(true);
  });
});

describe('parseEntry · categoría, tipo, cuenta y fecha', () => {
  it.each([
    ['café 3500', 'Comida'],
    ['almuerzo 6000', 'Comida'],
    ['verdulería 12000', 'Comida'],
    ['nafta 8000', 'Transporte'],
    ['sube 2000', 'Transporte'],
    ['uber 4500', 'Transporte'],
    ['edenor 27840', 'Servicios'],
    ['internet 18990', 'Servicios'],
    ['netflix 13999', 'Servicios'],
    ['alquiler 320000', 'Hogar'],
    ['ferretería 52300', 'Hogar'],
    ['zapatillas 189999', 'Compras'],
    ['regalo 15000', 'Compras'],
  ])('"%s" es %s', (text, category) => {
    expect(parse(text).category).toBe(category);
  });

  it('sin pistas la categoría queda sin decidir (la hoja usa "Otros")', () => {
    expect(parse('cosas varias 1000').category).toBeNull();
  });

  it('no confunde "gasto" con "gas" ni "luzia" con "luz"', () => {
    expect(guessCategory('gasto chico')).toBeNull();
    expect(guessCategory('luzia')).toBeNull();
    expect(guessCategory('pago de la luz')).toBe('Servicios');
  });

  it('reconoce ingresos por palabras como sueldo o freelance, y no en un gasto común', () => {
    expect(parse('sueldo 1850000').type).toBe('income');
    expect(parse('me pagaron 120000').type).toBe('income');
    expect(parse('freelance landing 120.000').type).toBe('income');
    expect(parse('café 3500').type).toBeNull();
  });

  it('reconoce la cuenta por el nombre completo, por las iniciales o por la primera palabra si va al final, y la saca de la descripción', () => {
    const a = parse('uber 4500 efectivo');
    expect(a.accountId).toBe('ef');
    expect(a.description).toBe('Uber');
    expect(parse('café 3500 mp').accountId).toBe('mp');
    expect(parse('super 30000 visa').accountId).toBe('visa');
    expect(parse('super 30000 mercado').accountId).toBe('mp');
    expect(parse('super 30000 mercado pago').accountId).toBe('mp');
    expect(parse('super 30000 mercado pago').description).toBe('Super');
    expect(parse('efectivo café 3500').accountId).toBe('ef');
  });

  it('una palabra suelta del medio no alcanza para elegir una cuenta', () => {
    expect(parse('mercado del barrio 5000').accountId).toBeNull();
    expect(parse('mercado del barrio 5000').description).toBe('Mercado del barrio');
    expect(parse('ahorro del mes 200000', { accounts: [...ACCOUNTS, { id: 'caja', name: 'Caja de Ahorro Banco Provincia' }] }).accountId).toBeNull();
    expect(parse('visa santander café 3500 efectivo').accountId).toBe('ef'); // "visa" en el medio no cuenta; "efectivo" es un nombre completo
    expect(parse('café 3500 efectivo mp').accountId).toBeNull(); // dos cuentas distintas: no se elige ninguna
  });

  it('no inventa una cuenta: "pago de luz" no es Mercado Pago, y dos cuentas distintas no se eligen', () => {
    expect(parse('pago luz 15000').accountId).toBeNull();
    expect(parse('café 3500 efectivo visa').accountId).toBeNull();
    expect(parse('café 3500', { accounts: [] }).accountId).toBeNull();
  });

  it('"ayer" y "anteayer" cambian la fecha y no quedan en la descripción', () => {
    const y = parse('farmacia 8000 ayer');
    expect(y.date).toBe('2026-11-14');
    expect(y.description).toBe('Farmacia');
    expect(parse('farmacia 8000 anteayer').date).toBe('2026-11-13');
    expect(parse('farmacia 8000 hoy').date).toBe('2026-11-15');
    expect(parse('farmacia 8000').date).toBeNull();
  });

  it('ayer en el primer día del mes cae en el mes anterior', () => {
    expect(parse('café 3500 ayer', { today: new Date(2026, 11, 1, 12) }).date).toBe('2026-11-30');
  });

  it('devuelve dónde está el monto para resaltarlo', () => {
    const r = parse('nafta 3,5k hoy');
    expect(r.amountToken).toMatchObject({ text: '3,5k', index: 6, thousands: true });
  });
});
