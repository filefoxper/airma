import type { ComponentType, ExoticComponent, ReactNode } from 'react';
import type {
  GlobalConfig as StateGlobalConfig,
  ModelKey,
  StoreIndex
} from '@airma/react-state';
import type { GlobalConfig as EffectGlobalConfig } from '@airma/react-effect';

export declare type GlobalConfig = StateGlobalConfig & EffectGlobalConfig;

export * from '@airma/react-hooks-core';

export declare type ModelKeys =
  | StoreIndex<any, any, any>
  | ModelKey<any, any, any>;

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
    | StoreIndex<any, any>
    | ModelKey<any, any>
    | Record<string, StoreIndex<any, any>>
    | Record<string, ModelKey<any, any>>
    | Record<number, StoreIndex<any, any>>
    | Record<number, ModelKey<any, any>>
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
        | StoreIndex<any, any>
        | ModelKey<any, any>
        | Record<string, StoreIndex<any, any>>
        | Record<string, ModelKey<any, any>>
      >
    | Record<string, StoreIndex<any, any>>
    | Record<string, ModelKey<any, any>>;
  children?: ReactNode;
}>;

export declare const ConfigProvider: FC<{
  value: GlobalConfig;
  children?: ReactNode;
}>;
