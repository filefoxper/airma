export type Option = {
    refresh?:boolean
}

export type Optional ={
    refresh?:boolean,
    required?:boolean
}

export type Callback = (...args:any[])=>any;
