import React,{memo} from 'react';
import {render} from 'react-dom'
import {
    requireModels,
    RequiredModelProvider,
    useRequiredModel
} from '@airma/react-state';

const counter = (count:number = 0) =>{
    return {
        count,
        isNegative: count<0,
        increase:()=>count+1,
        decrease:()=>count-1
    };
};

const modelFactory =  requireModels((factory)=>({
    counter:factory(counter)
}));

const Increase = memo(()=>{
    const {increase} = useRequiredModel(modelFactory.counter);
    return (
        <button onClick={increase}>+</button>
    );
});

const Decrease = memo(()=>{
    const {decrease} = useRequiredModel(modelFactory.counter);
    return (
        <button onClick={decrease}>-</button>
    );
});

const CountValue = memo(()=>{
    const {count,isNegative} = useRequiredModel(modelFactory.counter);
    return (
        <span style={isNegative?{color:'red'}:undefined}>{count}</span>
    );
});

function Counter({index}:{index:number}){
    return (
        <div>
            counter:{index}
            <RequiredModelProvider value={modelFactory}>
                <div>
                    <Decrease/>
                    <CountValue/>
                    <Increase/>
                </div>
            </RequiredModelProvider>
        </div>
    );
}

export default function App(){
    return (
        <div>
            <Counter index={1}/>
        </div>
    );
}
