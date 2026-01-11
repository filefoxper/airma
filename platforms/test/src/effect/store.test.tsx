import React from 'react';
import { createSessionKey, createSessionStore, provide, useQuery, useSession } from '@airma/react-effect';
import { waitFor } from '@testing-library/react';
import { renderEffectHook } from '@/util';
import type { ReactNode } from 'react';

describe('静态会话库的用法', () => {
  const sessionCallback = (data: string) => {
    return Promise.resolve(`session:${data}`);
  };

  test('使用 createSessionStore 可创建静态会话库，每个静态库都是一个独立的可订阅库，它们不需要 provide 提供帮助', async () => {
    const sessionStore = createSessionStore(sessionCallback, 'query');
    const { result } = renderEffectHook(() => {
      const [sessionState] = useQuery(sessionStore, ['test']);
      return { sessionState };
    });
    await waitFor(() => expect(result.current.sessionState.data).toBe('session:test'));
  });

  test('静态会话库的订阅点之间保持状态同步', async () => {
    const sessionStore = createSessionStore(sessionCallback, 'query');
    const { result: r1 } = renderEffectHook(() => {
      const [sessionState] = useQuery(sessionStore, ['test']);
      return { sessionState };
    });

    const { result: r2 } = renderEffectHook(() => {
      useQuery(sessionStore);
      const [sessionState] = useSession(sessionStore);
      return { sessionState };
    });
    await waitFor(() => r1.current.sessionState.loaded);
    expect(r1.current.sessionState).toEqual(r2.current.sessionState);
  });

  test('强行对静态库使用 provide 会导致 provide 范围内的该静态库变成 provide 维护的动态库，并与原静态库断开联系', async () => {
    const sessionStore = createSessionStore(sessionCallback, 'query');
    const { result: r1 } = renderEffectHook(
      () => {
        const [sessionState] = useQuery(sessionStore, ['test']);
        return { sessionState };
      },
      { wrapper: provide(sessionStore).to(({ children }: { children?: ReactNode }) => <>{children}</>) },
    );

    const { result: r2 } = renderEffectHook(() => {
      useQuery(sessionStore);
      const [sessionState] = useSession(sessionStore);
      return { sessionState };
    });
    await waitFor(() => r1.current.sessionState.loaded);
    expect(r1.current.sessionState).not.toEqual(r2.current.sessionState);
  });
});

describe('动态会话库的用法', () => {
  const sessionCallback = (data: string) => {
    return Promise.resolve(`session:${data}`);
  };

  test('使用 createSessionKey 可创建会话键， provide 通过会话键生成动态库', async () => {
    const sessionKey = createSessionKey(sessionCallback, 'query');
    const { result } = renderEffectHook(
      () => {
        const [sessionState] = useQuery(sessionKey, ['test']);
        return { sessionState };
      },
      { wrapper: provide(sessionKey).to(({ children }: { children?: ReactNode }) => <>{children}</>) },
    );
    await waitFor(() => expect(result.current.sessionState.data).toBe('session:test'));
  });

  test('会话键不能在其 provide 范围外使用', async () => {
    const sessionKey = createSessionKey(sessionCallback, 'query');
    const { result } = renderEffectHook(() => {
      const [sessionState] = useQuery(sessionKey, ['test']);
      return { sessionState };
    });
    expect(result.error).not.toBeUndefined();
  });

  test('相同会话键在相同 provide 中建立的同一个动态库的不同订阅点之间，状态同步', async () => {
    const sessionKey = createSessionKey(sessionCallback, 'query');
    const { result } = renderEffectHook(
      () => {
        const [sessionState1] = useQuery(sessionKey, ['test']);
        const [sessionState2] = useQuery(sessionKey);
        return { sessionState1, sessionState2 };
      },
      { wrapper: provide(sessionKey).to(({ children }: { children?: ReactNode }) => <>{children}</>) },
    );
    await waitFor(() => result.current.sessionState1.loaded);
    expect(result.current.sessionState1).toEqual(result.current.sessionState2);
  });

  test('相同会话键在不同 provide 中建立的不同动态库的订阅点之间，状态不同步', async () => {
    const sessionKey = createSessionKey(sessionCallback, 'query');
    const { result: r1 } = renderEffectHook(
      () => {
        const [sessionState] = useQuery(sessionKey, ['test']);
        return { sessionState };
      },
      { wrapper: provide(sessionKey).to(({ children }: { children?: ReactNode }) => <>{children}</>) },
    );

    const { result: r2 } = renderEffectHook(
      () => {
        useQuery(sessionKey);
        const [sessionState] = useSession(sessionKey);
        return { sessionState };
      },
      { wrapper: provide(sessionKey).to(({ children }: { children?: ReactNode }) => <>{children}</>) },
    );
    await waitFor(() => r1.current.sessionState.loaded);
    expect(r1.current.sessionState).not.toEqual(r2.current.sessionState);
  });
});
