export type Promisify<F extends (...args: any[]) => any> = F extends (
  ...args: infer A
) => infer R
  ? (...args: A) => Promise<R>
  : never;
