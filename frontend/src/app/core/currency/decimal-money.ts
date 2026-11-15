/** Conversión de presentación: céntimos y factor decimal exactos, ROUND_HALF_UP. */
export function convertEur(amount: string, rate: string): string {
  if (!/^[0-9]+\.[0-9]{2}$/.test(amount) || amount.length > 100) throw new Error('Importe no válido');
  const match = /^([0-9]+)(?:\.([0-9]+))?(?:e([+-]?[0-9]+))?$/i.exec(rate);
  if (!match || rate.length > 100) throw new Error('Tasa no válida');
  const fraction = match[2] ?? '';
  const exponent = Number(match[3] ?? '0'); // Exponente, nunca importe monetario.
  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > 400) throw new Error('Exponente no válido');
  const coefficient = BigInt(match[1]! + fraction);
  if (coefficient <= 0n) throw new Error('Tasa no positiva');
  const scale = fraction.length - exponent;
  let numerator = BigInt(amount.replace('.', '')) * coefficient;
  const denominator = scale > 0 ? 10n ** BigInt(scale) : 1n;
  if (scale < 0) numerator *= 10n ** BigInt(-scale);
  const cents = (numerator * 2n + denominator) / (2n * denominator);
  return `${cents / 100n}.${(cents % 100n).toString().padStart(2, '0')}`;
}
