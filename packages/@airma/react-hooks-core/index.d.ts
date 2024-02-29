export declare function usePersistFn<T extends (...args: any[]) => any>(
  callback: T
): T;

export declare function useMount(callback: () => (() => void) | void): void;

export declare function useUpdate(callback: () => (() => void) | void): void;
export declare function useUpdate<T extends any[]>(
  callback: (prevDeps: [...T]) => (() => void) | void,
  deps: [...T]
): void;

export declare function useRefresh<T extends (...args: any[]) => any>(
  method: T,
  params:
    | Parameters<T>
    | {
        refreshDeps?: any[];
        variables: Parameters<T>;
      }
): void;

export declare function useUnmount(destroy: () => void): void;

export declare function shallowEqual<R>(prev: R, current: R): boolean;

declare type Promisify<F extends (...args: any[]) => any> = F extends (
  ...args: infer A
) => infer R
  ? (...args: A) => Promise<R>
  : never;

export declare function useDebounceFn<F extends (...args: any[]) => any>(
  fn: F,
  option: number | { lead?: boolean; ms: number }
): Promisify<F>;
