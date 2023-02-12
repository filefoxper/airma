export declare type ResponseParam<T> = T | ((d: T) => T);

export declare type ResponseType<T> = (data: ResponseParam<T>) => void;

export declare type SideEffectCallback<T> = (response: ResponseType<T>) => any;

export declare type PromiseResult<T> = {
  data: T | undefined;
  error?: any;
  isError: boolean;
  isFetching: boolean;
  abandon: boolean;
};

export declare function useSideEffect<T, C extends SideEffectCallback<T>>(
  callback: C,
  defaultState: T,
  config?: { deps?: any[]; manual?: boolean } | any[]
): [T, () => ReturnType<C>, { destroy: () => any }];

export declare function useQuery<T>(
  callback: () => Promise<T>,
  config?: { deps?: any[]; manual?: boolean } | any[]
): [PromiseResult<T>, () => Promise<PromiseResult<T>>];

export declare function useMutation<
  T,
  C extends (...params: any[]) => Promise<T>
>(
  callback: C,
  config?: { after?: (r: PromiseResult<T>) => any; repeatable?: boolean }
): [
  PromiseResult<T>,
  (...params: Parameters<typeof callback>) => Promise<PromiseResult<T>>
];
