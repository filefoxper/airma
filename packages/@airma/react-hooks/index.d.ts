import type { ComponentType, ExoticComponent, ReactNode } from 'react';
import type {
  GlobalConfig as StateGlobalConfig,
  Model,
  ModelKey,
  StoreIndex
} from '@airma/react-state';
import type { GlobalConfig as EffectGlobalConfig } from '@airma/react-effect';

export declare type GlobalConfig = StateGlobalConfig & EffectGlobalConfig;

export * from '@airma/react-hooks-core';

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
    | StoreIndex<Model, any>
    | ModelKey<Model, any>
    | Record<string, StoreIndex<Model, any>>
    | Record<string, ModelKey<Model, any>>
    | Record<number, StoreIndex<Model, any>>
    | Record<number, ModelKey<Model, any>>
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
        | StoreIndex<Model, any>
        | ModelKey<Model, any>
        | Record<string, StoreIndex<Model, any>>
        | Record<string, ModelKey<Model, any>>
      >
    | Record<string, StoreIndex<Model, any>>
    | Record<string, ModelKey<Model, any>>;
  children?: ReactNode;
}>;

export declare const ConfigProvider: FC<{
  value: GlobalConfig;
  children?: ReactNode;
}>;
