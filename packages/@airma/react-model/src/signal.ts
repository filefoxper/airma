import {
  Action,
  createSignal,
  Dispatch,
  Model,
  ModelInstance,
  ModelKey,
  Store
} from 'as-model';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePersistFn } from '@airma/react-hooks-core';
import { useInitialize, useModelInitialize } from './initialize';
import { SignalGenerator } from './type';

function useSignalSubscribeConnection<T extends ModelInstance>(
  signal: SignalGenerator<T>,
  subscription: (
    ins: T,
    act: Action | null,
    comparator: null | ((i: T) => any[])
  ) => void | (() => void)
) {
  const actionsCollectionRef = useRef<null | ((i: T) => any[])>(null);
  const propertyCollectionRef = useRef<null | ((i: T) => any[])>(null);
  useEffect(() => {
    return signal.subscribe(action => {
      const { method } = action;
    });
  }, []);
  return {
    onActions(collection: (i: T) => ((...args: any[]) => any)[]) {
      actionsCollectionRef.current = collection;
    },
    onChanges(collection: (i: T) => any[]) {
      propertyCollectionRef.current = collection;
    }
  };
}

function useSignalSubscribe<T extends ModelInstance>(
  signal: SignalGenerator<T>
) {}

export function useSignal<S, T extends ModelInstance, D extends S>(
  modelLike: Model<S, T> | ModelKey<S, T> | Store<S, T>,
  state?: D
) {
  const hasDefaultState = arguments.length > 1;
  const [, refresh] = useState({});
  const store = useModelInitialize(modelLike, { hasDefaultState, state });
  const signalStore = useInitialize(() => {
    return createSignal(store);
  });
  const signal = signalStore.getSignal();
  signal.startStatistics();
  useLayoutEffect(() => {
    signal.stopStatistics();
  });
  useEffect(() => {
    return signalStore.subscribe(() => {
      refresh({});
    });
  }, []);
  const signalCallback = function signalCallback() {
    return signal();
  };
  useSignalSubscribe(signal);
  signalCallback.useWatch = function useWatch(
    callback: (ins: T, act: Action | null) => void | (() => void)
  ) {
    useEffect(() => {
      return signal.subscribe(action => {});
    }, []);
  };
  return usePersistFn(signalCallback);
}
