import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { createStores, shallowEqual as shallowEq, validations } from 'as-model';
import type { ComponentType, FC, FunctionComponent, ReactNode } from 'react';
import type { ModelKey, StoreIndex } from 'as-model';
import type { GlobalConfig, ModelStores } from './type';

export const ModelStoresContext = createContext<ModelStores | undefined>(
  undefined
);

export const ConfigContext = createContext<GlobalConfig | undefined>(undefined);

function ifModelKeyOrStoreIndex(data: unknown): data is ModelKey | StoreIndex {
  return (
    validations.isModelKey(data) ||
    (!!data && validations.isModelKey((data as { key: unknown }).key))
  );
}

function parseKeySetToKeys(
  keySets:
    | Array<
        | StoreIndex
        | ModelKey
        | Record<string, StoreIndex>
        | Record<string, ModelKey>
      >
    | Record<string, StoreIndex>
    | Record<string, ModelKey>
) {
  const keySetArray = Array.isArray(keySets) ? keySets : [keySets];
  return keySetArray.reduce(
    (re, cur) => {
      if (ifModelKeyOrStoreIndex(cur)) {
        return [...re, cur];
      }
      const data = Object.values(cur).filter(ifModelKeyOrStoreIndex);
      return [...re, ...data];
    },
    [] as Array<ModelKey | StoreIndex>
  );
}

export const Provider: FC<{
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
}> = function RequiredModelProvider({ value, children }) {
  const storeKeys = (function extractCreators() {
    return parseKeySetToKeys(value);
  })();
  if (storeKeys == null) {
    throw new Error('You need to provide keys to `Provider`');
  }
  const parent = useContext(ModelStoresContext);
  const [stores, setStores] = useState((): ModelStores => {
    const collections = createStores(...storeKeys);
    return { collections, parent };
  });

  useEffect(() => {
    if (
      shallowEq(
        stores.collections.keys(),
        [...storeKeys].map(d => (validations.isModelKey(d) ? d : d.key))
      ) &&
      stores.parent === parent
    ) {
      return;
    }
    stores.collections.update(...storeKeys);
    setStores({ collections: stores.collections, parent });
  }, [stores, storeKeys, parent]);

  useEffect(() => {
    return () => {
      stores.collections.destroy();
      stores.parent = undefined;
    };
  }, []);

  return createElement(
    ModelStoresContext.Provider,
    { value: stores },
    children
  );
};

export function provide(
  ...keys: (
    | StoreIndex
    | ModelKey
    | Record<string, StoreIndex>
    | Record<string, ModelKey>
  )[]
) {
  const connect = function connect<
    P extends Record<string, any>,
    C extends ComponentType<P>
  >(Comp: C): ComponentType<P> {
    return function WithModelProviderComponent(props: P) {
      return createElement(
        Provider,
        { value: keys },
        createElement<P>(Comp as FunctionComponent<P>, props)
      );
    };
  };
  connect.to = function to<
    P extends Record<string, any>,
    C extends ComponentType<P>
  >(Comp: C): ComponentType<P> {
    return function WithModelProviderComponent(props: P) {
      return createElement(
        Provider,
        { value: keys },
        createElement<P>(Comp as FunctionComponent<P>, props)
      );
    };
  };
  return connect;
}

export const ConfigProvider: FC<{
  value: GlobalConfig;
  children?: ReactNode;
}> = function ConfigProvider(props) {
  const { value, children } = props;
  return createElement(ConfigContext.Provider, { value }, children);
};

export function useStores() {
  return useContext(ModelStoresContext);
}

export function useConfiguration() {
  const optimizeConfig = useContext(ConfigContext);
  const { batchUpdate } = optimizeConfig || {};
  return useMemo(() => ({ batchUpdate }), [batchUpdate]);
}

export function useActProcess() {
  const optimizeConfig = useContext(ConfigContext);
  const { test } = optimizeConfig || {};
  return {
    act(callback: () => any): ReturnType<typeof callback> {
      if (
        !test ||
        typeof process === 'undefined' ||
        process == null ||
        process.env == null ||
        process.env.NODE_ENV !== 'test'
      ) {
        return callback();
      }
      let result;
      test.act(() => {
        result = callback();
      });
      return result;
    }
  };
}
