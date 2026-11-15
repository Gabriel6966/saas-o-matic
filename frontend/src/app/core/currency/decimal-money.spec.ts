import { convertEur } from './decimal-money';

describe('Conversión decimal de presentación, ROUND_HALF_UP', () => {
  it.each([
    ['0.00', '1.2345', '0.00'], ['0.01', '0.5', '0.01'], ['0.01', '0.499999', '0.00'],
    ['0.03', '0.5', '0.02'], ['1.00', '1.005', '1.01'], ['1.00', '1.004999', '1.00'],
    ['169.40', '0.85', '143.99'], ['168.00', '1.2345', '207.40'],
    ['5950202.30', '1.103776', '6567690.49'], ['9007199254740993.01', '1', '9007199254740993.01'],
    ['1.00', '1e-3', '0.00'], ['100.00', '5e-5', '0.01'], ['0.01', '2e2', '2.00'],
  ])('%s × %s = %s sin punto flotante monetario', (amount, rate, expected) => {
    expect(convertEur(amount, rate)).toBe(expected);
  });

  it.each(['1.2', '1e2', '-1.00', 'NaN', '1,00'])('rechaza el importe fuera de contrato %s', (amount) => {
    expect(() => convertEur(amount, '1')).toThrow();
  });
  it.each(['0', '-1', 'NaN', 'Infinity', '1e9999'])('rechaza la tasa %s', (rate) => {
    expect(() => convertEur('1.00', rate)).toThrow();
  });
});
