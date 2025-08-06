import React, {
  memo,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState
} from 'react';
import {
    createKey,
    useSignal,
    useSelector,
    createSessionKey,
    provide,
    Strategy,
    useIsFetching,
    useMutation,
    useQuery,
    useSession,
    useUpdate,
    useResponse,
    useControlledModel, useModel
} from '@airma/react-hooks';
import { client as cli } from '@airma/restful';
import { pick } from 'lodash';
import {
  ErrorSessionState,
  session,
  useLazyComponent
} from '@airma/react-effect';
import { model, shallowEqual } from '@airma/react-state';

const { rest } = cli(c => ({
  ...c,
  headers: { ...c.headers, yige: 'yige' }
}));

type User = {
  id: string;
  name: string;
  username: string;
  age: number;
};

type Condition = {
  name: string;
  username: string;
  age?: string;
};

type Query = {
  display: Condition;
  valid: Condition;
  creating: boolean;
};

const defaultCondition: Condition = {
  name: 'Mr',
  username: '',
  age: undefined
};

const userQuery = (validQuery: Condition) =>
  rest('/api/user')
    .path('list')
    .setParams(validQuery)
    .get<User[]>()
    .then(
      d => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(d);
          }, 700);
        }) as Promise<User[]>;
      },
      e => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(e);
          }, 700);
        }) as Promise<User[]>;
      }
    );

const userSave = (u: Omit<User, 'id'>) =>
  new Promise((resolve, reject) => {
      setTimeout(()=>{
          resolve(
              rest('/api/user')
                  .setBody(u)
                  .post<null>()
                  .then(() => true)
          );
      },1000)
  });

export const fetchSession = session(userQuery, 'query').createKey();

export const saveSession = session(userSave, 'mutation');

const test = (state: number) => {
  return {
    state,
    add() {
      return state + 1;
    }
  };
};

const testKey = createKey(test)

const counting = (state: number) => {
  return {
    value: state,
    increase() {
      return state + 1;
    },
    decrease() {
      return state - 1;
    }
  };
};

const store = model((query: Query) => {
  const handleQuery = () => {
    return { ...query, valid: { ...query.display } };
  };
  const queryData = model.createField(() => {
    return {...query.valid};
  }, [query.valid]);
  const sourceQueryData = model.createField(()=>{
      return query.valid;
  });
  const displayQueryData = model.createField(()=>query.display)
  return {
    queryData,
    sourceQueryData,
    displayQueryData,
    displayQuery: query.display,
    validQuery: query.valid,
    creating: query.creating,
    getValidQuery:model.createMethod(()=>query.valid),
    create() {
      return { ...query, creating: true };
    },
    submit() {
      return { ...query, ...handleQuery(), creating: false };
    },
    cancel() {
      return { ...query, creating: false };
    },
    changeDisplay(display: Partial<Condition>) {
      return { ...query, display: { ...query.display, ...display } };
    },
    query: handleQuery
  };
})
  .createStore();

const Info = memo(() => {
  const [{ isFetching, isError, error,visited }] = fetchSession.useSession();
  if (isFetching&&!visited) {
    return <span>fetching...</span>;
  }
  return isError ? <span style={{ color: 'red' }}>{error}</span> : null;
});

const creatingStore = model((userData: Omit<User, 'id'>) => {
  return {
    user: userData,
    changeUsername(username: string) {
      return { ...userData, username };
    },
    changeName(name: string) {
      return { ...userData, name };
    },
    update() {
      return { ...userData };
    }
  };
})

const Creating = memo(
  ({ onClose, error }: { error?: ErrorSessionState; onClose: () => any }) => {
    const creating = store.useSelector(s => s.creating);
    const { user, changeUsername, changeName } = creatingStore.useModel({
      name: '',
      username: '',
      age: 10
    });

    const [fs, query] = fetchSession.useSession();

    const [sessionState, save] = saveSession.useMutation({
      variables: [user],
      strategy: [
        Strategy.validate(async ([u],isOnline) => {
            if(!isOnline()){
                return false;
            }
          if (!u.name || !u.username) {
            return false;
          }
          return true;
        }), 
        Strategy.once(),
      ]
    });

    useResponse.useSuccess(() => {
      console.log('save success');
      const promise = query();
      promise.then((d)=>{
          console.log('trigger query promise',d)
          if(d.abandon){
              return;
          }
          onClose();
      })
    }, sessionState);

    const lazySave = ()=>{
        onClose();
        setTimeout(()=>{
            save();
        },1000)
    }

    return (
      <div>
        <div>
          <input
            type="text"
            value={user.name}
            placeholder="input name"
            onChange={e => changeName(e.target.value)}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <input
            type="text"
            value={user.username}
            placeholder="input username"
            onChange={e => changeUsername(e.target.value)}
          />
        </div>
          <div style={{marginTop: 12}}>
              <button type="button" style={{marginLeft: 12}} onClick={save}>
                  submit
              </button>
              <button type="button" style={{marginLeft: 12}} onClick={lazySave}>
                  lazy submit
              </button>
              <button type="button" style={{marginLeft: 8}} onClick={onClose}>
                  cancel
              </button>
          </div>
      </div>
    );
  }
);

const Condition = memo(function Condition({parentTrigger}: { parentTrigger: () => void }) {
  const q = useMemo(() => ({ ...defaultCondition, name: 'Mr' }), []);
  const { displayQuery, queryData,sourceQueryData,displayQueryData, create, changeDisplay, submit } =
    store.useModel();

  const isFetching = useIsFetching();
  const [,,execute] = fetchSession.useSession();

  const handleTrigger = () => {
    parentTrigger();
  };

  return (
    <div>
      <span>name:</span>
      <input
        type="text"
        value={displayQuery.name}
        onChange={e => changeDisplay({ name: e.target.value })}
      />
      <span style={{ marginLeft: 12 }}>username:</span>
      <input
        type="text"
        value={displayQuery.username}
        onChange={e => changeDisplay({ username: e.target.value })}
      />
      <span style={{ marginLeft: 12 }}>age:</span>
      <input
        type="text"
        value={displayQuery.age}
        onChange={e => changeDisplay({ age: e.target.value })}
      />
      <button type="button" style={{ marginLeft: 12 }} onClick={() => submit()}>
        query
      </button>
      <button type="button" style={{ marginLeft: 12 }} onClick={()=>execute.payload('trigger')({name:'Mr',username:''})}>
        trigger
      </button>
      <button type="button" style={{ marginLeft: 12 }} onClick={handleTrigger}>
        manual
      </button>
      <button
        type="button"
        disabled={isFetching}
        style={{ marginLeft: 8 }}
        onClick={create}
      >
        create
      </button>
    </div>
  );
})

// store.instance({
//     valid: defaultCondition,
//     display: defaultCondition,
//     creating: false
// }).changeDisplay({...defaultCondition,name:''});
// store.instance().submit();

export default provide(fetchSession).to(function App() {
  const conditionSignal = useSignal(store,{valid:defaultCondition,display:defaultCondition,creating:false});
  const { queryData, creating, cancel } = useSelector(store,
    s => pick(s, 'queryData', 'creating', 'cancel'),
      shallowEqual
  );

  console.log('render creating',creating)
    useEffect(() => {
        setTimeout(()=>{
            store.instance().changeDisplay({...defaultCondition,name:''})
            store.instance().submit()
        },1000)
    }, []);

  conditionSignal
    .useEffect(ins => {
      console.log('signal creating', ins.creating);
    });

  const querySession = useQuery(fetchSession,{
    variables: [queryData.get()],
    defaultData: [],
    payload:'effect',
    strategy: [
      Strategy.cache({ capacity: 10 }),
        Strategy.response.success((data, sessionData)=>{
            console.log('query payload',sessionData.payload)
        }),
      Strategy.response.failure(e => {
        console.log('error', e);
        // throw e;
      })
    ],
  });

  const [queryState] = querySession;

  const [{ data, variables }, t] = querySession;

  const [q] = variables ?? [];

  const [count, setCount] = useState(0);

  const instance = useControlledModel(counting, count, s => setCount(s));

  const { value, increase, decrease } = instance;

  const isFetching = useIsFetching();

  console.log('isFetching', isFetching)

  return (
    <div style={{ padding: '12px 24px', overflowY: 'auto', height: '100vh' }}>
      <div style={{ margin: '8px 0' }}>
        <button type="button" onClick={increase}>
          +
        </button>
        <span style={{ margin: '0 8px' }}>
          {count} : {value}
        </span>
        <button type="button" onClick={decrease}>
          -
        </button>
      </div>
      <Condition parentTrigger={t} />
      <div style={{ marginTop: 8, marginBottom: 8, minHeight: 36 }}>
        {creating ? <Creating onClose={cancel} /> : <Info />}
      </div>
      <div>
        {data.map(user => (
          <div key={user.id} style={{ padding: '4px 0' }}>
            <span style={{ marginRight: 12 }}>name: {user.name}</span>
            <span style={{ marginRight: 12 }}>username: {user.username}</span>
            <span style={{ marginRight: 12 }}>age: {user.age}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
