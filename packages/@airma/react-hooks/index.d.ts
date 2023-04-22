export declare function usePersistFn<T extends (...args: any[]) => any>(
  callback: T
): T;

export declare function useMount(callback: () => (() => void) | void): void;

export declare function useUpdate(
  callback: () => (() => void) | void,
  deps?: any[]
): void;
