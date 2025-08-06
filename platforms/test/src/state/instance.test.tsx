import { renderHook, act } from '@testing-library/react-hooks';
import { model, useModel } from '@airma/react-state';

const counter = function counter(count: number) {
  const symbol = (function computeSymbol() {
    if (count === 0) {
      return '';
    }
    if (count < 0) {
      return '-';
    }
    return '+';
  })();
  const info = model.createField(() => ({ symbol }), [symbol]);
  return {
    count,
    info,
    increase: () => count + 1,
    decrease: () => count - 1,
    setCount: (value: number) => value,
  };
};

describe('实例的行为方法', () => {
  test('通过调用实例的行为方法可产生新状态，并以新状态为参数再次调用模型', () => {
    const modelFn = jest.fn(counter);
    const { result } = renderHook(() => {
      return useModel(modelFn, 0);
    });
    let newState;
    act(() => {
      newState = result.current.increase();
    });
    expect(modelFn).toBeCalledWith(newState);
  });

  test('通过调用实例的行为方法可产生新状态，并更新实例', () => {
    const { result } = renderHook(() => {
      return useModel(counter, 0);
    });
    act(() => {
      result.current.increase();
    });
    expect(result.current).toMatchObject({ count: 1 });
  });

  test('只有直接实例包含的直接方法才是行为方法，其他形式透出的函数或方法均不能更新实例', () => {
    const enhanceCounter = function enhanceCounter(count: number) {
      return {
        count,
        query: {
          isNegate: () => count < 0,
        },
        increase: () => count + 1,
        decrease: () => count - 1,
      };
    };
    const { result } = renderHook(() => {
      return useModel(enhanceCounter, 0);
    });
    act(() => {
      result.current.query.isNegate();
    });
    expect(result.current).toMatchObject({ count: 0 });
  });

  test('实例的行为方法至创建起就是恒定不变的', () => {
    const { result } = renderHook(() => {
      return useModel(counter, 0);
    });
    const initializedActionMethod = result.current.increase;
    act(() => {
      result.current.increase();
    });
    const updatedActionMethod = result.current.increase;
    expect(initializedActionMethod).toBe(updatedActionMethod);
  });

  test('实例的行为方法至创建起就是恒定不变的，但每次运行时使用的状态始终是最新的', () => {
    const { result } = renderHook(() => {
      return useModel(counter, 0);
    });
    const { increase } = result.current;
    let staleActionResult;
    act(() => {
      result.current.increase();
      staleActionResult = increase();
    });
    expect(staleActionResult).toBe(2);
  });
});

describe('实例的字段', () => {
  const enhanceCounter = function enhanceCounter(count: number) {
    const symbol = (function computeSymbol() {
      if (count === 0) {
        return '';
      }
      if (count < 0) {
        return '-';
      }
      return '+';
    })();
    const countBase = Math.floor(count / 10);
    const info = model.createField(() => ({ symbol }), [symbol]);
    const fullInfo = model.createField(() => ({ ...info.get(), base: countBase }), [info, countBase]);
    return {
      count,
      info,
      fullInfo,
      deepInfo: { info },
      increase: () => count + 1,
      decrease: () => count - 1,
    };
  };

  test('实例的字段必须通过 model.createField 生成，并通过其 get 方法获取字段值', () => {
    const { result } = renderHook(() => {
      return useModel(enhanceCounter, 0);
    });
    act(() => {
      result.current.increase();
    });
    expect(result.current.info.get()).toEqual({ symbol: '+' });
  });

  test('若实例字段的缓存依赖队列值均无改变，则通过 get 方法获取的字段值不变', () => {
    const { result } = renderHook(() => {
      return useModel(enhanceCounter, 1);
    });
    const infoStaleValue = result.current.info.get();
    act(() => {
      result.current.increase();
    });
    const infoNewValue = result.current.info.get();
    expect(infoStaleValue).toBe(infoNewValue);
  });

  test('通过实例字段的 get 方法获取的值，永远是最新更新的', () => {
    const { result } = renderHook(() => {
      return useModel(enhanceCounter, 0);
    });
    const { info, count } = result.current;
    act(() => {
      result.current.increase();
    });
    expect([count, info.get().symbol]).toEqual([0, '+']);
  });

  test('实例字段可互相依赖，其依赖会逐级传递', () => {
    const { result } = renderHook(() => {
      return useModel(enhanceCounter, 1);
    });
    const staleFullInfoValue = result.current.fullInfo.get();
    act(() => {
      result.current.increase();
    });
    expect(result.current.fullInfo.get()).toBe(staleFullInfoValue);
  });

  test('为直接挂载在实例属性上的字段不是实例字段，没有缓存效果', () => {
    const { result } = renderHook(() => {
      return useModel(enhanceCounter, 1);
    });
    const staleDeepInfoValue = result.current.deepInfo.info.get();
    act(() => {
      result.current.increase();
    });
    expect(result.current.deepInfo.info.get()).not.toBe(staleDeepInfoValue);
  });
});

describe('实例的加工', () => {
  const simulateCounter = model(counter).produce((getInstance) => {
    const instance = getInstance();
    const countBase = Math.floor(instance.count / 10);
    const { info } = instance;
    const fullInfo = model.createField(() => ({ ...info.get(), base: countBase }), [info, countBase]);
    return {
      ...instance,
      fullInfo,
      async increaseBySetting() {
        const setting = await Promise.resolve(2);
        const { count, setCount } = getInstance();
        setCount(count + setting);
      },
    };
  });

  test('通过 produce 方法，可以在原实例的基础上加工出虚拟实例', async () => {
    const { result } = renderHook(() => {
      return useModel(simulateCounter, 0);
    });
    await act(async () => {
      await result.current.increaseBySetting();
    });
    expect(result.current.count).toBe(2);
  });

  test('produce 方法提供的实例获取函数，可提供最新实例数据', async () => {
    const { result } = renderHook(() => {
      return useModel(simulateCounter, 0);
    });
    await act(async () => {
      const increasing = result.current.increaseBySetting();
      result.current.increase();
      await increasing;
    });
    expect(result.current.count).toBe(3);
  });

  test('通过 produce 方法加工的虚拟实例，不影响原实例透出的字段特性', async () => {
    const { result } = renderHook(() => {
      return useModel(simulateCounter, 1);
    });
    const staleInfoValue = result.current.info.get();
    await act(async () => {
      const increasing = result.current.increaseBySetting();
      result.current.increase();
      await increasing;
    });
    const newInfoValue = result.current.info.get();
    expect(staleInfoValue).toBe(newInfoValue);
  });

  test('可以为虚拟实例使用字段', () => {
    const { result } = renderHook(() => {
      return useModel(simulateCounter, 1);
    });
    const staleInfoValue = result.current.fullInfo.get();
    act(() => {
      result.current.increase();
    });
    const newInfoValue = result.current.fullInfo.get();
    expect(staleInfoValue).toBe(newInfoValue);
  });
});
