/** Every monetary amount in Budget Buddy is an integer count of centavos (₱1.00 = 100). Never float. */
export type Centavos = number;

function assertInteger(value: number, label: string): void {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer number of centavos, got ${value}`);
  }
}

export function addCentavos(...values: Centavos[]): Centavos {
  return values.reduce((total, value) => {
    assertInteger(value, "addCentavos operand");
    return total + value;
  }, 0);
}

export function subtractCentavos(a: Centavos, b: Centavos): Centavos {
  assertInteger(a, "subtractCentavos minuend");
  assertInteger(b, "subtractCentavos subtrahend");
  return a - b;
}

export function multiplyCentavos(amount: Centavos, count: number): Centavos {
  assertInteger(amount, "multiplyCentavos amount");
  assertInteger(count, "multiplyCentavos count");
  return amount * count;
}

export function sumCentavos(values: Centavos[]): Centavos {
  return addCentavos(...values);
}

/**
 * Splits `total` into `count` installments as evenly as possible, all integers, with any
 * remainder (from a total that doesn't divide evenly) added to the last installment — the
 * canonical rounding rule from ADR 0001.
 */
export function divideCentavosEvenly(total: Centavos, count: number): Centavos[] {
  assertInteger(total, "divideCentavosEvenly total");
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error(`divideCentavosEvenly count must be a positive integer, got ${count}`);
  }
  const base = Math.floor(total / count);
  const installments = new Array<Centavos>(count).fill(base);
  const remainder = total - base * count;
  installments[count - 1] += remainder;
  return installments;
}

/** The largest multiple of `multiple` that is <= `amount` (floors toward negative infinity). */
export function floorToMultiple(amount: Centavos, multiple: number): Centavos {
  assertInteger(amount, "floorToMultiple amount");
  assertInteger(multiple, "floorToMultiple multiple");
  if (multiple <= 0) {
    throw new Error(`floorToMultiple multiple must be positive, got ${multiple}`);
  }
  return Math.floor(amount / multiple) * multiple;
}
