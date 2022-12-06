import React, { memo, useLayoutEffect, useState } from 'react';
import {useModel, useTupleModel, useControlledModel, useRefreshModel} from "@airma/react-state";

const re = (state: number) => {
  const count = state>=0?state:0;
  return {
    count,
    isNegative: count < 0,
    increase() {
      return count + 1;
    },
    decrease() {
      return count - 1;
    }
  }
};

const ReactStateEx = memo(() => {
  const [value,setValue] = useState(0);
  const {count, isNegative, increase, decrease} = useRefreshModel((state:number)=>{
    const count = state>=0?state:0;
    return {
      count,
      isNegative: count<0,
      increase(){
        return count + 1;
      },
      decrease(){
        return count - 1;
      }
    };
  },value);

  return (
    <div>
      <div>react state ex 1</div>
      <div>{value}</div>
      <div><button onClick={()=>setValue(v=>v+1)}>rest</button></div>
      <div>
        <button onClick={decrease}>-</button>
          <span style={isNegative?{color:'red'}:undefined}>{count}</span>
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
