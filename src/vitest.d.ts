declare module "vitest" {
  type TestCallback = () => void | Promise<void>;

  export function describe(name: string, callback: TestCallback): void;
  export function it(name: string, callback: TestCallback): void;

  export function expect<T>(actual: T): {
    toBe(expected: T): void;
    toBeGreaterThanOrEqual(expected: number): void;
    toBeLessThanOrEqual(expected: number): void;
  };
}
