import { describe, it, expect } from 'vitest';
import {
  resolveDashboardPeriod,
  shiftDashboardPeriod,
  dashboardPeriodToSearchParams,
} from './dashboardPeriod';

describe('dashboardPeriod Massive Scaling Tests', () => {
  it('1. efficiently processes massive loops of simultaneous URL search parameter resolutions', () => {
    const start = performance.now();

    // Simulate 10,000 rapid concurrent dashboard page loads parsing a custom URL date range
    const inputs = Array.from({ length: 10000 }).map(() => ({
      from: '2024-01-01T00:00:00.000Z',
      to: '2024-12-31T23:59:59.000Z',
    }));

    const results = inputs.map((input) => resolveDashboardPeriod(input));
    const duration = performance.now() - start;

    expect(results.length).toBe(10000);
    expect(results[9999].kind).toBe('range');
    expect(duration).toBeLessThan(1500); // Verify fast execution times
  });

  it('2. safely prevents regex ReDoS attacks when parsing gigabyte-scale invalid month and year strings', () => {
    // Generate massive strings mimicking maliciously malformed URL parameters
    const massiveYearString = '2'.repeat(500000);
    const massiveMonthString = '2024-' + '1'.repeat(500000);

    const start = performance.now();
    const resultYear = resolveDashboardPeriod({ year: massiveYearString });
    const resultMonth = resolveDashboardPeriod({ month: massiveMonthString });
    const duration = performance.now() - start;

    // Both should safely fail regex cleanly and fall back to the "rolling" 12-month default
    expect(resultYear.kind).toBe('rolling');
    expect(resultMonth.kind).toBe('rolling');
    expect(duration).toBeLessThan(500); // Fast failure without hanging the Node event loop
  });

  it('3. handles extreme forward shifting operations across high bounds (shifting 5000 months ahead)', () => {
    let currentPeriod = resolveDashboardPeriod({ month: '2024-01' });

    const start = performance.now();
    // Simulate a user furiously shifting the calendar period 5,000 times
    for (let i = 0; i < 5000; i++) {
      currentPeriod = shiftDashboardPeriod(currentPeriod, 'next');
    }
    const duration = performance.now() - start;

    expect(currentPeriod.kind).toBe('month');
    // 2024 + Math.floor(5000/12) years ~ Year 2440
    expect(currentPeriod.from.startsWith('2440')).toBe(true);
    expect(duration).toBeLessThan(1500);
  });

  it('4. maintains performance under heavy serialization loads to URLSearchParams', () => {
    const period = resolveDashboardPeriod({ year: '2022' });

    const start = performance.now();
    // Simulate serializing dashboard state to URL parameters 20,000 times
    const paramsArray = Array.from({ length: 20000 }).map(() =>
      dashboardPeriodToSearchParams(period)
    );
    const duration = performance.now() - start;

    expect(paramsArray.length).toBe(20000);
    expect(paramsArray[19999].get('year')).toBe('2022');
    expect(duration).toBeLessThan(1000);
  });

  it('5. scales safely without breaking layout trees when shifting extremely wide date ranges backwards', () => {
    // Range spanning exactly 10,000 days (approx 27.3 years)
    const widePeriod = resolveDashboardPeriod({
      from: '2000-01-01T00:00:00.000Z',
      to: '2027-05-19T23:59:59.000Z',
    });

    const start = performance.now();
    // Shift this enormous time block backwards, forcing arithmetic over massive spans
    const shifted = shiftDashboardPeriod(widePeriod, 'prev');
    const duration = performance.now() - start;

    expect(shifted.kind).toBe('range');
    expect(new Date(shifted.from).getUTCFullYear()).toBeLessThan(2000);
    expect(duration).toBeLessThan(500);
  });
});
