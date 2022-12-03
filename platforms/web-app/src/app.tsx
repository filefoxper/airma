import React, { memo, useLayoutEffect, useState } from 'react';
import { useEffect, useReducer, useRef } from 'react';
import {useModel} from "@airma/react-state";

const re = (state: number) => {
  console.log('arg...', state);
  const baseState = state >= 0 ? state : 0;
  return {
    state: baseState,
    increase() {
      console.log('base...', baseState);
      return baseState + 1;
    },
    decrease() {
      console.log('base...', baseState);
      return baseState - 1;
    }
  };
};

const ReactStateEx = memo(() => {
  const { state, increase, decrease } = useModel((state: number) => {
    const baseState = state >= 0 ? state : 0;
    return {
      state: baseState,
      increase() {
        return baseState + 1;
      },
      decrease() {
        return baseState - 1;
      }
    };
  }, 0);

  useEffect(()=>{
    console.log('change increase')
  },[increase])

  return (
    <div>
      <div>react state ex 1</div>
      <div>
        <button onClick={decrease}>-</button>
        <span>{state}</span>
        <button onClick={increase}>+</button>
      </div>
    </div>
  );
});

export default function App() {
  return (
    <div>
      App
      <ReactStateEx />
    </div>
  );
}
