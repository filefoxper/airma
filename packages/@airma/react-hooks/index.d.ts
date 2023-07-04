export declare function usePersistFn<T extends (...args: any[]) => any>(
  callback: T
): T;

export declare function useMount(callback: () => (() => void) | void): void;

export declare function useUpdate<T extends any[]>(
  callback: (prevDeps: undefined | T) => (() => void) | void,
  deps?: T
): void;

export declare function useUnmount(destroy: () => void): void;
