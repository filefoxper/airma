import {
  ComponentType,
  ExoticComponent,
  FunctionComponent,
  ReactNode
} from 'react';
import {
  GlobalConfig as StateGlobalConfig,
  ModelCreation,
  ModelKey,
  ModelKeys
} from '@airma/react-state';
import { GlobalConfig as EffectGlobalConfig } from '@airma/react-effect';

export declare type GlobalConfig = StateGlobalConfig & EffectGlobalConfig;

export * from '@airma/react-hooks-core';

export {
  createKey,
  useModel,
  useSignal,
  useControlledModel,
  useSelector,
  model
} from '@airma/react-state';

export {
  createSessionKey,
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
  keys: ModelKeys
): <P extends Record<string, any>>(
  component: ComponentType<P> | ExoticComponent<P>
) => typeof component;

export declare const Provider: FunctionComponent<{
  value: ModelKeys;
  children?: ReactNode;
}>;

export declare function storeCreation(...args: (ModelKey<any> | ModelCreation)[]): {
  for: <P extends Record<string, any>>(
    component: ComponentType<P> | ExoticComponent<P>
  ) => typeof component;
};

export declare const ConfigProvider: FunctionComponent<{
  value: GlobalConfig;
  children?: ReactNode;
}>;
