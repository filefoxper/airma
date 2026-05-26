import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { createKey, createStore, provide, useModel, useSignal } from '@airma/react-state';
import type { ReactNode } from 'react';

const counter = function counter(count: number) {
  return {
    count,
    increase: () => count + 1,
    decrease: () => count - 1,
  };
};

describe('将模型初始化成实例对象', () => {
  test('使用 useModel 初始化模型可获取实例对象', () => {
    const { result } = renderHook(() => {
      return useModel(counter, 0);
    });
    expect(result.current).toMatchObject({ count: 0 });
  });

  test('使用 useSignal 初始化模型可获取实例对象', () => {
    const { result } = renderHook(() => {
      return useSignal(counter, 0);
    });
    expect(result.current()).toMatchObject({ count: 0 });
  });
});

describe('将模型初始化成库对象', () => {
  test('使用 createStore 初始化模型可获取库对象', () => {
    const store = createStore(counter);
    expect(store).toHaveProperty('getInstance');
  });

  test('未提供初始化状态的库为休眠库，直接使用会引起异常', () => {
    const store = createStore(counter);
    const { result } = renderHook(() => {
      return useModel(store);
    });
    expect(result.error).not.toBeUndefined();
  });

  test('未提供初始化状态的库为休眠库，可通过 useModel/useSignal 再激活后使用', () => {
    const store = createStore(counter);
    const { result } = renderHook(() => {
      return useModel(store, 0);
    });
    expect(result.current).toMatchObject({ count: 0 });
  });
});

describe('将模型初始化成模型键', () => {
  test('使用 createKey 初始化模型可获取模型键', () => {
    const key = createKey(counter);
    expect(key).toHaveProperty('createStore');
  });

  test('模型键必须通过 Provider 建立相关的动态库后才能使用，否则会引起异常', () => {
    const key = createKey(counter);
    const { result } = renderHook(() => useModel(key, 0));
    expect(result.error).not.toBeUndefined();
  });

  test('模型键必须通过 Provider 建立相关的动态库后才能使用', () => {
    const key = createKey(counter);
    const { result } = renderHook(() => useModel(key, 0), {
      wrapper: provide(key)(({ children }: { children?: ReactNode }) => <>{children}</>),
    });
    expect(result.current).toMatchObject({ count: 0 });
  });

  test('未提供初始化状态的模型键通过 Provider 建立的是休眠动态库，直接使用会引起异常', () => {
    const key = createKey(counter);
    const { result } = renderHook(() => useModel(key), {
      wrapper: provide(key)(({ children }: { children?: ReactNode }) => <>{children}</>),
    });
    expect(result.error).not.toBeUndefined();
  });

  test('未提供初始化状态的模型键通过 Provider 建立的是休眠动态库，可通过 useModel/useSignal 再激活后使用', () => {
    const key = createKey(counter);
    const { result } = renderHook(
      () => {
        return useModel(key, 0);
      },
      {
        wrapper: provide(key)(({ children }: { children?: ReactNode }) => <>{children}</>),
      },
    );
    expect(result.current).toMatchObject({ count: 0 });
  });
});
