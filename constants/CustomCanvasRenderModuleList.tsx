import { CustomCanvasProps } from '@/types/CanvasTypes';
import React from 'react';
import CanvasAudioModule from '@/components/CanvasModules/Audio/CanvasAudioModule';
import CanvasDrawModule from '@/components/CanvasModules/Draw/CanvasDrawModule';
import CanvasImageModule from '@/components/CanvasModules/Image/CanvasImageModule';
import CanvasLinkModule from '@/components/CanvasModules/Link/CanvasLinkModule';
import CanvasTextModule from '@/components/CanvasModules/Text/CanvasTextModule';
import CanvasVideoModule from '@/components/CanvasModules/Video/CanvasVideoModule';
import CanvasWebLinkModule from '@/components/CanvasModules/WebLink/CanvasWebLinkModule';
import { Gesture } from 'react-native-gesture-handler';


export interface RenderModuleDef {
  name: string;
  module: (props: CustomCanvasProps, extraParams: any) => React.ReactNode;
  deps?: string[];
  gestureHandler?: ((props: CustomCanvasProps, extraParams: any) => any) | null;
  gestureDeps?: string[];
}

// TODO: 手势拦截函数未完成
const stopPropagationGestureHandler = (props: CustomCanvasProps, extraParams: any) => {
  // 停止手势事件传播，避免父组件的手势处理影响到当前模块
  // return Gesture.Tap();
  return null;
};

// =================== Group 渲染模块注册区 ===================
// 每个模块对象包含 name、type、module、deps（依赖参数名数组）
// 新模块如需依赖主模块的参数，可以在 deps 中声明，同时在主模块中allParams 中提供对应参数
// type 枚举
const RENDER_MODULE_LIST: RenderModuleDef[] = [
  {
    name: 'CanvasDrawModule',
    module: (props: CustomCanvasProps, extraParams: any) => <CanvasDrawModule props={props} extraParams={extraParams} />,
    deps: ['contentsTransform'],
    gestureHandler: stopPropagationGestureHandler, // 指定手势处理函数
    gestureDeps: [], // 手势依赖参数名数组
  },
  {
    name: 'CanvasTextModule',
    module: (props: CustomCanvasProps, extraParams: any) => <CanvasTextModule props={props} extraParams={extraParams} />,
    deps: ['contentsTransform'],
    gestureHandler: stopPropagationGestureHandler, // 指定手势处理函数
    gestureDeps: [], // 手势依赖参数名数组
  },
  {
    name: 'CanvasImageModule',
    module: (props: CustomCanvasProps, extraParams: any) => <CanvasImageModule props={props} extraParams={extraParams} />,
    deps: ['contentsTransform'],
    gestureHandler: stopPropagationGestureHandler, // 指定手势处理函数
    gestureDeps: [], // 手势依赖参数名数组
  },
  {
    name: 'CanvasVideoModule',
    module: (props: CustomCanvasProps, extraParams: any) => <CanvasVideoModule props={props} extraParams={extraParams} />,
    deps: ['contentsTransform'],
    gestureHandler: stopPropagationGestureHandler, // 指定手势处理函数
    gestureDeps: [], // 手势依赖参数名数组
  },
  {
    name: 'CanvasWebLinkModule',
    module: (props: CustomCanvasProps, extraParams: any) => <CanvasWebLinkModule props={props} extraParams={extraParams} />,
    deps: ['contentsTransform'],
    gestureHandler: stopPropagationGestureHandler, // 指定手势处理函数
    gestureDeps: [], // 手势依赖参数名数组
  },
  {
    name: 'CanvasAudioModule',
    module: (props: CustomCanvasProps, extraParams: any) => <CanvasAudioModule props={props} extraParams={extraParams} />,
    deps: ['contentsTransform'],
    gestureHandler: stopPropagationGestureHandler, // 指定手势处理函数
    gestureDeps: [], // 手势依赖参数名数组
  },
  {
    name: 'CanvasLinkModule',
    module: (props: CustomCanvasProps, extraParams: any) => <CanvasLinkModule props={props} extraParams={extraParams} />,
    deps: ['contentsTransform'],
    gestureHandler: stopPropagationGestureHandler, // 指定手势处理函数
    gestureDeps: [], // 手势依赖参数名数组
},
  // 可以在这里添加更多渲染模块，如文本框
];
// =================== Group 渲染模块注册区 END ===================


export default RENDER_MODULE_LIST;