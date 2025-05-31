/* Interface */
export interface ISO8601StringFormat {
  isValid(input: string): boolean;
  fromString(input: string): ISO8601StringFormat;
  fromDate(date: Date): ISO8601StringFormat;
  toString(): string;
  toDate(): Date;
}

/* Class */
export class ISO8601String implements ISO8601StringFormat {
  private static readonly ISO8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/;
  private readonly value: string;

  constructor(value: string) {
    this.value = value;
  }

  // Validates if the input string is in ISO 8601 format
  isValid(input: string): boolean {
    return ISO8601String.ISO8601_REGEX.test(input) && !isNaN(Date.parse(input));
  }

  // string -> ISO 8601
  fromString(input: string): ISO8601StringFormat {
    if (!this.isValid(input)) {
      throw new Error('Invalid ISO 8601 string format');
    }
    return new ISO8601String(input);
  }

  // ISO 8601 -> string
  toString(): string {
    return this.value;
  }

  // Date -> ISO 8601
  fromDate(date: Date): ISO8601StringFormat {
    return new ISO8601String(date.toISOString());
  }

  // ISO 8601 -> Date
  toDate(): Date {
    const date = new Date(this.value);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid ISO 8601 date!');
    }
    return date;
  }

}

/* Exported functions (no need for controller) */
export function isValidISO(input: string): boolean { 
    const ISO = new ISO8601String(input);
    return ISO.isValid(input);
}

export function stringToISO(input: string): ISO8601StringFormat {
    const ISO = new ISO8601String(input);
    return ISO.fromString(input);
}

export function isoToString(iso: ISO8601StringFormat): string {   
  return iso.toString();
}

export function dateToISO(date: Date): ISO8601StringFormat {
    const ISO = new ISO8601String(date.toISOString());
    return ISO.fromDate(date);
}

export function isoToDate(iso: ISO8601StringFormat): Date {
    return iso.toDate();
}

