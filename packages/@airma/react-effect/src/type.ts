export type ResponseParam<T> = T | ((d: T) => T);

export type ResponseType<T> = (data: ResponseParam<T>) => void;

export type SideEffectCallback<T> = (response: ResponseType<T>) => any;

export type PromiseResult<T> = {
  data: T | undefined;
  error?: any;
  isError: boolean;
  isFetching: boolean;
  abandon: boolean;
};
