import { createSessionStore, provide, Strategy, useQuery, useResponse, useSession } from '@airma/react-effect';
import { render, waitFor } from '@testing-library/react';
import React, { memo, useState } from 'react';
import { delay, renderEffectHook } from '@/util';

describe('useResponse 的基本用法', () => {
  const sessionCallback = (data: string) => {
    return Promise.resolve(`session:${data}`);
  };

  test('useResponse 可对会话的成功回合响应添加副作用', async () => {
    const responseEffect = jest.fn();
    renderEffectHook(() => {
      const [sessionState] = useQuery(sessionCallback, ['test']);
      useResponse(responseEffect, sessionState);
      return { sessionState };
    });
    await waitFor(() => expect(responseEffect).toBeCalledTimes(1));
  });

  test('useResponse 可对会话的异常回合响应添加副作用', async () => {
    const responseEffect = jest.fn();
    renderEffectHook(() => {
      const [sessionState] = useQuery((d: string) => Promise.reject(new Error('mock error')), ['test']);
      useResponse(responseEffect, sessionState);
      return { sessionState };
    });
    await waitFor(() => expect(responseEffect).toBeCalledTimes(1));
  });

  test('useResponse 在加载时会对已具备运行回合的会话做出加载副作用响应', async () => {
    const sessionStore = createSessionStore(sessionCallback);

    const responseEffect = jest.fn();

    const Child = () => {
      const [sessionState] = useSession(sessionStore);
      useResponse(responseEffect, sessionState);
      return <>{sessionState.data}</>;
    };
    const App = provide().to(
      memo(() => {
        const [sessionState] = useQuery(sessionStore, ['test']);
        return <>{sessionState.loaded ? <Child /> : null}</>;
      }),
    );

    render(<App />);
    await waitFor(() => expect(responseEffect).toBeCalledTimes(1));
  });

  test('通过设定 useResponse 依赖设定为 watchOnly 可解除对已具备运行回合的会话做出的加载副作用响应', async () => {
    const sessionStore = createSessionStore(sessionCallback);

    const responseEffect = jest.fn();

    const Child = () => {
      const [sessionState] = useSession(sessionStore);
      useResponse(responseEffect, [sessionState, { watchOnly: true }]);
      return <>{sessionState.data}</>;
    };
    const App = provide().to(
      memo(() => {
        const [sessionState] = useQuery(sessionStore, ['test']);
        return <>{sessionState.loaded ? <Child /> : null}</>;
      }),
    );

    const { findByText } = render(<App />);
    await waitFor(() => findByText('session:test'));
    expect(responseEffect).not.toBeCalled();
  });

  test('useResponse.useSuccess 只可对会话的成功回合响应添加副作用', async () => {
    const responseEffect = jest.fn();
    renderEffectHook(() => {
      const [sessionState] = useQuery(sessionCallback, ['test']);
      useResponse.useSuccess(responseEffect, sessionState);
      return { sessionState };
    });
    await waitFor(() => expect(responseEffect).toBeCalledTimes(1));
  });

  test('useResponse.useFailure 只可对会话的异常回合响应添加副作用', async () => {
    const responseEffect = jest.fn();
    renderEffectHook(() => {
      const [sessionState] = useQuery((d: string) => Promise.reject(new Error('mock error')), ['test']);
      useResponse.useFailure(responseEffect, sessionState);
      return { sessionState };
    });
    await waitFor(() => expect(responseEffect).toBeCalledTimes(1));
  });
});

describe('Strategy.response 的基本用法', () => {
  const sessionCallback = (data: string) => {
    return Promise.resolve(`session:${data}`);
  };

  test('Strategy.response 策略可对会话的成功回合响应添加副作用', async () => {
    const responseEffect = jest.fn();
    renderEffectHook(() => {
      const [sessionState] = useQuery(sessionCallback, {
        variables: ['test'],
        strategy: Strategy.response(responseEffect),
      });
      return { sessionState };
    });
    await waitFor(() => expect(responseEffect).toBeCalledTimes(1));
  });

  test('Strategy.response 策略可对会话的异常回合响应添加副作用', async () => {
    const responseEffect = jest.fn();
    renderEffectHook(() => {
      const [sessionState] = useQuery((d: string) => Promise.reject(new Error('mock error')), {
        variables: ['test'],
        strategy: Strategy.response(responseEffect),
      });
      return { sessionState };
    });
    await waitFor(() => expect(responseEffect).toBeCalledTimes(1));
  });

  test('Strategy.response 策略与 useResponse 互不影响，可同时运行', async () => {
    const responseEffect = jest.fn();
    renderEffectHook(() => {
      const [sessionState] = useQuery((d: string) => Promise.reject(new Error('mock error')), {
        variables: ['test'],
        strategy: Strategy.response(responseEffect),
      });
      useResponse(responseEffect, sessionState);
      return { sessionState };
    });
    await waitFor(() => expect(responseEffect).toBeCalledTimes(2));
  });

  test('若 Strategy.response 的使用者在会话结束前被卸载，则 Strategy.response 的回调不执行', async () => {
    const responseEffect = jest.fn();
    const { result, unmount } = renderEffectHook(() => {
      const [sessionState] = useQuery(
        (d: string) =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve(d);
            }, 300);
          }),
        {
          variables: ['test'],
          strategy: Strategy.response(responseEffect),
        },
      );
      return { sessionState };
    });
    await waitFor(() => result.current.sessionState.isFetching);
    unmount();
    await delay(300);
    expect(responseEffect).not.toBeCalled();
  });

  test('Strategy.response.success 策略只可对会话的成功回合响应添加副作用', async () => {
    const { result } = renderEffectHook(() => {
      const [successRounds, setSuccessRounds] = useState(0);
      const [sessionState] = useQuery(sessionCallback, {
        variables: ['test'],
        strategy: Strategy.response.success(() => {
          setSuccessRounds((r) => r + 1);
        }),
      });
      return { sessionState, successRounds };
    });
    await waitFor(() => expect(result.current.successRounds).toBe(1));
  });

  test('Strategy.response.failure 策略只可对会话的异常回合响应添加副作用', async () => {
    const responseEffect = jest.fn();
    renderEffectHook(() => {
      const [sessionState] = useQuery((d: string) => Promise.reject(new Error('mock error')), {
        variables: ['test'],
        strategy: Strategy.response.failure(responseEffect),
      });
      return { sessionState };
    });
    await waitFor(() => expect(responseEffect).toBeCalledTimes(1));
  });

  test('Strategy.response.failure 策略可将不能处理的回合异常抛往更高层的 Strategy.response.failure 异常处理', async () => {
    const responseEffect = jest.fn();
    renderEffectHook(() => {
      const [sessionState] = useQuery((d: string) => Promise.reject(new Error('mock error')), {
        variables: ['test'],
        strategy: [
          Strategy.response.failure(responseEffect),
          Strategy.response.failure((e) => {
            throw e;
          }),
        ],
      });
      return { sessionState };
    });
    await waitFor(() => expect(responseEffect).toBeCalledTimes(1));
  });

  test('若 Strategy.response.failure 策略对当前异常做出了处理，并且没有抛出异常，则高层 Strategy.response.failure 不做处理', async () => {
    const responseEffect = jest.fn();
    const { result } = renderEffectHook(() => {
      const [errorProcessed, setErrorProcessed] = useState(false);
      const [sessionState] = useQuery((d: string) => Promise.reject(new Error('mock error')), {
        variables: ['test'],
        strategy: [
          Strategy.response.failure(responseEffect),
          Strategy.response.failure((e) => {
            if ((e as Error).message.startsWith('mock')) {
              setErrorProcessed(true);
              return;
            }
            throw e;
          }),
        ],
      });
      return { sessionState, errorProcessed };
    });
    await waitFor(() => result.current.errorProcessed);
    expect(responseEffect).not.toBeCalled();
  });

  test('Strategy.response.failure 策略可将不能处理的回合异常抛往更高层的 Strategy.failure 异常处理', async () => {
    const responseEffect = jest.fn();
    renderEffectHook(
      () => {
        const [sessionState] = useQuery((d: string) => Promise.reject(new Error('mock error')), {
          variables: ['test'],
          strategy: [
            Strategy.response.failure((e) => {
              throw e;
            }),
          ],
        });
        return { sessionState };
      },
      {
        config: {
          strategy(s) {
            return [Strategy.failure(responseEffect), ...s];
          },
        },
      },
    );
    await waitFor(() => expect(responseEffect).toBeCalledTimes(1));
  });

  test('若 Strategy.response.failure 策略对当前异常做出了处理，并且没有抛出异常，则高层 Strategy.failure 不做处理', async () => {
    const responseEffect = jest.fn();
    const { result } = renderEffectHook(
      () => {
        const [errorProcessed, setErrorProcessed] = useState(false);
        const [sessionState] = useQuery((d: string) => Promise.reject(new Error('mock error')), {
          variables: ['test'],
          strategy: [
            Strategy.response.failure((e) => {
              if ((e as Error).message.startsWith('mock')) {
                setErrorProcessed(true);
                return;
              }
              throw e;
            }),
          ],
        });
        return { sessionState, errorProcessed };
      },
      {
        config: {
          strategy(s) {
            return [Strategy.failure(responseEffect), ...s];
          },
        },
      },
    );
    await waitFor(() => result.current.errorProcessed);
    expect(responseEffect).not.toBeCalled();
  });

  test('若 Strategy.response.failure 策略所在hook被卸载时，则高层 Strategy.failure 需对异常做处理', async () => {
    const responseEffect = jest.fn();
    const effect = jest.fn();
    const testFn = jest.fn(
      (d: string) =>
        new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error('mock error'));
          }, 200);
        }),
    );
    const { result, unmount } = renderEffectHook(
      () => {
        const [sessionState] = useQuery(testFn, {
          variables: ['test'],
          strategy: [Strategy.response.failure(responseEffect)],
        });
        return { sessionState };
      },
      {
        config: {
          strategy(s) {
            return [Strategy.failure(effect), ...s];
          },
        },
      },
    );
    await waitFor(() => result.current.sessionState.isFetching);
    unmount();
    await delay(400);
    expect(responseEffect).not.toBeCalled();
    expect(effect).toBeCalledTimes(1);
  });
});
