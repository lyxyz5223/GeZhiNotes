import { GlobalCanvasStates } from "@/types/MainCanvasType";
import { useCallback, useEffect } from "react";

export const initialGlobalStates: GlobalCanvasStates = {
  paths: { },
  texts: { },
  images: { },
  audios: { },
  videos: { },
  links: { },
  webLinks: { },
  canvases: { },
};

// 动态生成所有 setter
// 用法: useGlobalStatesWithSetters(setGlobalState)(id).setPaths(paths);
// 返回一个包含所有 stateWithSetter 方法(如 setPaths、setTexts 等)作为返回值的参数为id的函数对象
export function useGlobalStatesWithSetters(
  state: GlobalCanvasStates,
  setGlobalState: React.Dispatch<React.SetStateAction<GlobalCanvasStates>>,
  callback: (id: string, stateName: string, newValue: any, newGlobalData: GlobalCanvasStates) => void = () => { }// 回调函数，当每个 setter 被调用时执行（可选，默认为空函数）
) {
  useEffect(() => {
    console.log('[setGlobalState] 发生变化');
  }, [setGlobalState]);
  useEffect(() => {
    console.log('[state] 发生变化');
  }, [state]);
  useEffect(() => {
    console.log('[callback] 发生变化');
  }, [callback]);

  return useCallback((id: string) => {
    const keys = Object.keys(initialGlobalStates) as (keyof GlobalCanvasStates)[];
    const stateWithSetters: any = {};
    keys.forEach(key => {
      // setter 名如 setPaths、setTexts
      stateWithSetters[key] = {
        value: state[key][id],
        setValue: (newValue: any) => {
          setGlobalState(prevState => {
            const prevValue = prevState[key][id] ?? [];
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
  }, [setGlobalState, state, callback]);
  
}


