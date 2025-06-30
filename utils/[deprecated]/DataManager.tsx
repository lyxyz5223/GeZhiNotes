import { GlobalCanvasStates } from "@/types/MainCanvasType";

// 为画布的每个属性生成更新函数
// 用法: makePerCanvasStateSetter('paths', setGlobalState)(id)(paths);
export function makePerCanvasStateSetter<K extends keyof GlobalCanvasStates>(
  key: K,
  setGlobalState: React.Dispatch<React.SetStateAction<GlobalCanvasStates>>
) {
  type ItemType = GlobalCanvasStates[K][string];
  return (id: string) => (updater: ItemType | ((previous: ItemType) => ItemType)) => {
    setGlobalState(prevState => {
      const prevValue = prevState[key][id] as ItemType ?? ([] as unknown as ItemType);
      const newValue = typeof updater === 'function' ? (updater as (prev: ItemType) => ItemType)(prevValue) : updater;
      return {
        ...prevState,
        [key]: {
          ...prevState[key],
          [id]: newValue,
        },
      };
    });
  };
}
// 动态生成所有 setter
// 用法: createAllGlobalStateWithSetters(setGlobalState)(id).setPaths(paths);
// 返回一个包含所有 stateWithSetter 方法(如 setPaths、setTexts 等)作为返回值的参数为id的函数对象
export function createAllGlobalStateWithSetters(
  state: GlobalCanvasStates,
  setGlobalState: React.Dispatch<React.SetStateAction<GlobalCanvasStates>>,
  callback: (id: string, stateName: string, newValue: any, newGlobalData: GlobalCanvasStates) => void = () => { }// 回调函数，当每个 setter 被调用时执行（可选，默认为空函数）
) {
  return (id: string) => {
    const keys = Object.keys(initialGlobalState) as (keyof GlobalCanvasStates)[];
    const stateWithSetters: any = {};
    keys.forEach(key => {
      // setter 名如 setPaths、setTexts
      stateWithSetters[key] = {
        value: state[key][id],
        setValue: (newValue: any) => {
          setGlobalState(prevState => {
            const prevValue = prevState[key][id] as any ?? [];
            const updatedValue = typeof newValue === 'function' ? newValue(prevValue) : newValue;
            const newState = {
              ...prevState,
              [key]: {
                ...prevState[key],
                [id]: updatedValue,
              }
            };
            callback(id, key, updatedValue, newState); // 这里拿到 set 后的最新 globalState
            return newState;
          });
        }
      };
    });
    return stateWithSetters;
  };
}


export const initialGlobalState: GlobalCanvasStates = {
  paths: {},
  texts: {},
  images: {},
  audios: {},
  videos: {},
  links: {},
  webLinks: {},
  canvases: {},
};