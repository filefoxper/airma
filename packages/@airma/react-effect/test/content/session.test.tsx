import React from 'react';
import { provide, session, useMutation, useQuery, useSession } from '@airma/react-effect';
import { waitFor } from '@testing-library/react';
import { act } from '@testing-library/react-hooks';
import { renderEffectHook } from '@test/util';
import type { ReactNode } from 'react';

describe('session 的基本用法', () => {
  const sessionCallback = (data: string) => {
    return Promise.resolve(`session:${data}`);
  };

  test('通过 session 包装过的异步函数可以更精确地定义会话类型', async () => {
    const querySession = session(sessionCallback, 'query');
    const { result } = renderEffectHook(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const [sessionState] = querySession.useMutation(['test']);
      return { sessionState };
    });
    expect(result.error).not.toBeUndefined();
  });

  test('通过 session 包装过的异步函数可以更轻松地使用会话 hook', async () => {
    const querySession = session(sessionCallback, 'query');
    const { result } = renderEffectHook(() => {
      const [sessionState] = querySession.useQuery(['test']);
      return { sessionState };
    });
    await waitFor(() => result.current.sessionState.loaded);
    expect(result.current.sessionState.data).toBe('session:test');
  });

  test('通过 session 可以更容易地创建会话键', async () => {
    const querySessionKey = session(sessionCallback, 'query').createKey();
    const { result } = renderEffectHook(
      () => {
        querySessionKey.useQuery(['test']);
        const [sessionState] = querySessionKey.useSession();
        return { sessionState };
      },
      {
        wrapper: provide(querySessionKey).to(({ children }: { children?: ReactNode }) => <>{children}</>),
      },
    );
    await waitFor(() => result.current.sessionState.loaded);
    expect(result.current.sessionState.data).toBe('session:test');
  });

  test('通过 session 可以更容易地创建会话库', async () => {
    const mutationSessionStore = session(sessionCallback, 'mutation').createStore();
    const { result } = renderEffectHook(
      () => {
        const [, trigger] = mutationSessionStore.useMutation(['test']);
        const [sessionState] = mutationSessionStore.useSession();
        return { sessionState, trigger };
      },
      {
        wrapper: provide(mutationSessionStore).to(({ children }: { children?: ReactNode }) => <>{children}</>),
      },
    );
    act(() => {
      result.current.trigger();
    });
    await waitFor(() => result.current.sessionState.loaded);
    expect(result.current.sessionState.data).toBe('session:test');
  });

  test('通过 session 建立的会话，可以直接使用 useQuery/useMutation 访问', async () => {
    const querySession = session(sessionCallback, 'query');
    const { result } = renderEffectHook(() => {
      const [sessionState] = useQuery(querySession, ['test']);
      return { sessionState };
    });
    await waitFor(() => result.current.sessionState.loaded);
    expect(result.current.sessionState.data).toBe('session:test');
  });

  test('通过 session 创建的会话键，可以直接使用 useQuery/useMutation/useSession 访问', async () => {
    const querySessionKey = session(sessionCallback, 'query').createKey();
    const { result } = renderEffectHook(
      () => {
        useQuery(querySessionKey, ['test']);
        const [sessionState] = useSession(querySessionKey);
        return { sessionState };
      },
      {
        wrapper: provide(querySessionKey).to(({ children }: { children?: ReactNode }) => <>{children}</>),
      },
    );
    await waitFor(() => result.current.sessionState.loaded);
    expect(result.current.sessionState.data).toBe('session:test');
  });

  test('通过 session 创建的会话库，可以直接使用 useQuery/useMutation/useSession 访问', async () => {
    const mutationSessionStore = session(sessionCallback, 'mutation').createStore();
    const { result } = renderEffectHook(() => {
      const [, trigger] = useMutation(mutationSessionStore, ['test']);
      const [sessionState] = useSession(mutationSessionStore);
      return { sessionState, trigger };
    });
    act(() => {
      result.current.trigger();
    });
    await waitFor(() => result.current.sessionState.loaded);
    expect(result.current.sessionState.data).toBe('session:test');
  });

  test('同一时间同一由 session 创建的会话键的多个 useQuery/useMutation，只有一个能工作，其他的可以订阅会话状态', async () => {
    const testFn = jest.fn(sessionCallback);
    const querySessionKey = session(testFn, 'query').createKey();
    const { result } = renderEffectHook(
      () => {
        useQuery(querySessionKey, ['test']);
        querySessionKey.useQuery(['test']);
        const [sessionState] = useSession(querySessionKey);
        return { sessionState };
      },
      {
        wrapper: provide(querySessionKey).to(({ children }: { children?: ReactNode }) => <>{children}</>),
      },
    );
    await waitFor(() => result.current.sessionState.loaded);
    expect(testFn).toBeCalledTimes(1);
  });

  test('同一时间同一由 session 创建的会话库的多个 useQuery/useMutation，只有一个能工作，其他的可以订阅会话状态', async () => {
    const testFn = jest.fn(sessionCallback);
    const mutationSessionStore = session(testFn, 'mutation').createStore();
    const { result } = renderEffectHook(() => {
      const [, trigger1] = useMutation(mutationSessionStore, ['test']);
      const [, trigger2] = mutationSessionStore.useMutation(['test']);
      const [sessionState] = useSession(mutationSessionStore);
      return { sessionState, trigger1, trigger2 };
    });
    act(() => {
      result.current.trigger1();
      result.current.trigger2();
    });
    await waitFor(() => result.current.sessionState.loaded);
    expect(testFn).toBeCalledTimes(1);
  });
});
