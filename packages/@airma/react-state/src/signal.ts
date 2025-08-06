import {
  Action,
  createSignal,
  Dispatch,
  Model,
  ModelInstance,
  ModelKey,
  shallowEqual,
  Store
} from 'as-model';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePersistFn } from '@airma/react-hooks-core';
import { useInitialize, useModelInitialize } from './initialize';
import { SignalGenerator } from './type';

function useSignalSubscribeConnection<T extends ModelInstance>(
  signal: SignalGenerator<T>,
  subscription: (ins: T, act: Action | null) => void | (() => void)
) {
  const actionsCollectionRef = useRef<
    null | ((i: T) => ((...args: any[]) => any)[])
  >(null);
  const changesCollectionRef = useRef<{
    collections: any[] | null;
    collector: null | ((i: T) => any[]);
  }>({ collector: null, collections: null });
  const destroyRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    const unsubscribe = signal.subscribe(action => {
      const actionsCollector = actionsCollectionRef.current;
      const { collector: changesCollector, collections: changesCollections } =
        changesCollectionRef.current;
      const { method } = action;
      const instance = signal();
      const isActionMethodMatched = (function matchMethod() {
        if (!actionsCollector) {
          return true;
        }
        const methods = actionsCollector(instance);
        return (
          Array.isArray(methods) &&
          methods.some(m => typeof m === 'function' && m === method)
        );
      })();
      const isChangesMatched = (function matchChanges() {
        if (changesCollector == null) {
          return true;
        }
        const currentChanges = changesCollector(instance);
        changesCollectionRef.current.collections = currentChanges;
        return shallowEqual(changesCollections, currentChanges);
      })();
      if (method != null && (!isActionMethodMatched || !isChangesMatched)) {
        return;
      }
      const prevDestroy = destroyRef.current;
      if (prevDestroy) {
        prevDestroy();
      }
      const destroy = subscription(instance, action);
      destroyRef.current = destroy ?? null;
    });
    return () => {
      unsubscribe();
      const destroy = destroyRef.current;
      if (destroy) {
        destroy();
      }
    };
  }, []);
  const res = {
    onActions(collector: (i: T) => ((...args: any[]) => any)[]) {
      actionsCollectionRef.current = collector;
    },
    onChanges(collector: (i: T) => any[]) {
      changesCollectionRef.current.collector = collector;
    }
  };
  return {
    onActions(collector: (i: T) => ((...args: any[]) => any)[]) {
      res.onActions(collector);
      return {
        onChanges: res.onChanges
      };
    },
    onChanges(collector: (i: T) => any[]) {
      res.onChanges(collector);
      return {
        onActions: res.onActions
      };
    }
  };
}

function useSignalSubscribe<T extends ModelInstance>(
  signal: SignalGenerator<T>
) {
  const useWatch = function useWatch(
    subscription: (ins: T, act: Action | null) => void | (() => void)
  ) {
    return useSignalSubscribeConnection(signal, (ins, act) => {
      if (act?.method == null) {
        return undefined;
      }
      return subscription(ins, act);
    });
  };
  const useEffective = function useEffective(
    subscription: (ins: T, act: Action | null) => void | (() => void)
  ) {
    const [wrap, setWrap] = useState<{
      action: Action | null;
      instance: T;
    } | null>(null);
    const filter = useSignalSubscribeConnection(signal, (ins, act) => {
      setWrap({ action: act, instance: ins });
    });
    useEffect(() => {
      if (wrap == null) {
        return () => undefined;
      }
      return subscription(wrap.instance, wrap.action);
    }, [wrap]);
    return filter;
  };

  return {
    useWatch,
    useEffect: useEffective
  };
}

export function useSignal<S, T extends ModelInstance, D extends S>(
  modelLike: Model<S, T> | ModelKey<S, T> | Store<S, T>,
  state?: D
) {
  const hasDefaultState = arguments.length > 1;
  const store = useModelInitialize(modelLike, { hasDefaultState, state });
  const signalStore = useInitialize(() => {
    return createSignal(store);
  });
  const [token, setToken] = useState(signalStore.getToken());
  const signal = signalStore.getSignal();
  signal.startStatistics();
  useLayoutEffect(() => {
    signal.stopStatistics();
  });
  const subscription = usePersistFn(() => {
    const currentToken = signalStore.getToken();
    if (!token.isDifferent(currentToken)) {
      return;
    }
    setToken(currentToken);
  });
  useEffect(() => {
    return signalStore.subscribe(subscription);
  }, []);
  const signalCallback = function signalCallback() {
    return signal();
  };
  const handler = useSignalSubscribe(signal);
  signalCallback.useWatch = handler.useWatch;
  signalCallback.useEffect = handler.useEffect;
  signalCallback.store = signal.store;
  return usePersistFn(signalCallback);
}
