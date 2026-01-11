import type { ComponentType, ExoticComponent, ReactNode } from 'react';
import type {
  GlobalConfig as StateGlobalConfig,
  ModelKey,
  StoreIndex
} from '@airma/react-state';
import type { GlobalConfig as EffectGlobalConfig } from '@airma/react-effect';

export declare type GlobalConfig = StateGlobalConfig & EffectGlobalConfig;

export * from '@airma/react-hooks-core';

export declare type ModelKeys = StoreIndex | ModelKey;

export {
  createKey,
  createStore,
  useModel,
  useSignal,
  useControlledModel,
  useSelector,
  model
} from '@airma/react-state';

export {
  createSessionKey,
  createSessionStore,
  Strategy,
  useQuery,
  useMutation,
  useSession,
  useLoadedSession,
  useResponse,
  useIsFetching,
  useLazyComponent,
  session
} from '@airma/react-effect';

export declare function provide(
  ...storeCreators: (
    | StoreIndex
    | ModelKey
    | Record<string, StoreIndex>
    | Record<string, ModelKey>
    | Record<number, StoreIndex>
    | Record<number, ModelKey>
  )[]
): {
  <P extends Record<string, any>>(
    component: ComponentType<P> | ExoticComponent<P>
  ): typeof component;
  to: <P extends Record<string, any>>(
    component: ComponentType<P> | ExoticComponent<P>
  ) => typeof component;
};

export declare const Provider: FC<{
  value:
    | Array<
        | StoreIndex
        | ModelKey
        | Record<string, StoreIndex>
        | Record<string, ModelKey>
      >
    | Record<string, StoreIndex>
    | Record<string, ModelKey>;
  children?: ReactNode;
}>;

export declare const ConfigProvider: FC<{
  value: GlobalConfig;
  children?: ReactNode;
}>;
