import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'countryName' })
export class CountryNamePipe implements PipeTransform {
  private readonly names = new Intl.DisplayNames(['es'], { type: 'region' });

  transform(code: string): string {
    return this.names.of(code) ?? code;
  }
}

@Pipe({ name: 'utcDate' })
export class UtcDatePipe implements PipeTransform {
  private readonly format = new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium', timeStyle: 'medium', timeZone: 'UTC',
  });

  transform(isoDate: string): string {
    const date = new Date(isoDate);
    return Number.isNaN(date.getTime()) ? 'Fecha no disponible' : this.format.format(date);
  }
}
