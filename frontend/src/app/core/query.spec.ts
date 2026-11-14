import { FormControl } from '@angular/forms';
import { parseCustomerId, parseOffset, searchError, searchValidator } from './query';

describe('Entradas de navegación y búsqueda', () => {
  it('admite únicamente IDs positivos representables sin pérdida', () => {
    expect(parseCustomerId('0001')).toBe(1);
    expect(parseCustomerId('9007199254740991')).toBe(9007199254740991);
    for (const value of ['0', '-1', '1.0', '1e2', '9007199254740992', 'abc', null]) {
      expect(parseCustomerId(value)).toBeNull();
    }
  });

  it('recupera el offset seguro de una URL y vuelve al inicio ante uno inválido', () => {
    expect(parseOffset('40')).toBe(40);
    for (const value of ['-1', '1.5', 'Infinity', '9007199254740992', null]) expect(parseOffset(value)).toBe(0);
  });

  it('cuenta puntos de código como el contrato y no exige control fiscal al término', () => {
    expect(searchError('😀'.repeat(200))).toBeNull();
    expect(searchError('😀'.repeat(201))).toContain('200');
    expect(searchError('00000023A')).toBeNull();
    expect(searchError('ÁBACO %_')).toBeNull();
  });

  it('invalida controles incluso en los extremos y permite corregir el formulario', () => {
    const control = new FormControl('\nÁbaco', { nonNullable: true, validators: [searchValidator] });
    expect(control.invalid).toBe(true);
    control.setValue('  Ábaco  ');
    expect(control.valid).toBe(true);
  });
});
