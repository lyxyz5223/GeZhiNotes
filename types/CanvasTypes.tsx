import { Skia } from "@shopify/react-native-skia";
import { GlobalCanvasStates as MainGlobalCanvasStates} from "./MainCanvasType";
import { UndoRedoStack } from "@/hooks/useUndoRedo";
// 通用 StateUpdater 泛型，用于表示setState的setter函数
export type StateUpdater<T> = (updater: T | ((prev: T) => T)) => void;

export type StateWithSetter<T> = {
  value: T;
  setValue?: StateUpdater<T>;
};

export enum CanvasMode {
  Hand = 'hand',
  Draw = 'draw',
  Text = 'text',
  Eraser = 'eraser',
  Image = 'image',
  Video = 'video',
  WebLink = 'weblink',
  Audio = 'audio', // 音频模式
  Link = 'link',
  Canvas = 'canvas', // 嵌入式画布模式
  EmbeddedCanvas = Canvas, // 兼容
}

export enum CanvasType {
  Main = 'main',
  Child = 'child',
}

export type Point = {
  x: number;
  y: number;
}

export type TransformType = {
  scale: number;
  translateX: number;
  translateY: number;
  // originX: number;
  // originY: number;
}

export interface CanvasToolbarProps {
  color: string;
  setColor: (c: string) => void;
  size: number;
  setSize: (s: number) => void;
  mode: CanvasMode;
  setMode: (m: CanvasMode) => void;
  fontFamily: string;
  setFontFamily: (f: string) => void;
  showColorPicker: boolean;
  setShowColorPicker: (b: boolean) => void;
  customColor: string;
  setCustomColor: (c: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onLoad: () => void;
  toolbarPos: { x: number, y: number };
  toolbarHorizontalMargin: number;
  toolbarMaxWidth: number;
  toolbarDragging: boolean;
  toolbarPanHandlers: any;
  onToggleTheme: () => void;
}

export interface CustomCanvasProps {
  // 画布唯一标识符，用于父亲区分各个画布与画布中的路径
  id: string;
  parentId: string; // 父画布的唯一标识符，用于嵌入式画布
  // 画布位置
  x?: number;
  y?: number;
  // 画布尺寸
  width: number;
  height: number;
  canvasType?: CanvasType; // 新增：画布类型
  // 画布样式，比如是否有边框、阴影等
  style?: any;
  // 用于在主界面响应画布移动和缩放后的回调
  onMoveResize?: (id: string, x: number, y: number, width: number, height: number) => void;
  // 用于在主界面响应画布删除的回调
  onRemove?: (id: string) => void;
  // 画布背景色
  canvasBg?: string;
  // 画笔颜色
  color?: string;
  // 画笔大小
  size?: number;
  mode?: StateWithSetter<CanvasMode>; // 绘制模式，默认为Draw
  moveable?: boolean; // 是否允许移动画布
  resizeable?: boolean; // 是否允许缩放画布
  borderRadius?: number; // 新增：允许自定义圆角，默认圆形
  // 全局数据统一传递
  globalData?: GlobalCanvasStates;
  fullscreen?: StateWithSetter<boolean>; // 新增：是否全屏子画布
  canvasTransform?: StateWithSetter<TransformType>; // 新增：画布内容变换状态
  globalState: StateWithSetter<MainGlobalCanvasStates>; // 新增：画布数据状态
  globalUndoRedo?: UndoRedoStack<MainGlobalCanvasStates>; // 新增：撤销重做栈
};
export type CanvasContext = CustomCanvasProps & {
  contentsTransform: StateWithSetter<TransformType>;
  canvasViewRef: React.RefObject<any>;
  activeResizing: StateWithSetter<boolean>; // 是否正在缩放
  borderTouchWidth: number; // 边框触摸宽度
};

export type DrawPathInfo = {
  id: string;// 画布id
  path: ReturnType<typeof Skia.Path.Make>;
  color: string;
  size: number;
  isEraser: boolean;
  points: { x: number, y: number }[];
  timestamp: number; // 时间戳，用于记录绘制时间
};

export type EmbeddedCanvasData = {
  id: string;
  parentId: string; // 父画布的唯一标识符
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TextBlockInfo = {
  id: string;
  text: string;
  x: number;
  y: number;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
};

export type ImageBlockInfo = {
  id: string;
  uri: string;
  x: number;
  y: number;
  width: number;
  height: number;
  thumbUri?: string;
};

export type AudioBlockInfo = {
  id: string;
  uri: string;
  x: number;
  y: number;
  duration?: number;
};

export type LinkBlockInfo = {
  id: string;
  fromId: string;
  toId: string;
  points?: { x: number; y: number }[];
  color?: string;
};

export type VideoBlockInfo = {
  id: string;
  uri: string;
  x: number;
  y: number;
  width: number;
  height: number;
  duration?: number;
  thumbUri?: string;
};

export type WebLinkBlockInfo = {
  id: string;
  url: string;
  x: number;
  y: number;
  title?: string;
};


// 全局画布数据结构，包含所有类型的全局数据（每个字段为数组，直接传递给画布）
export type GlobalCanvasStates = {
  images?: StateWithSetter<ImageBlockInfo[]>;
  audios?: StateWithSetter<AudioBlockInfo[]>;
  videos?: StateWithSetter<VideoBlockInfo[]>;
  webLinks?: StateWithSetter<WebLinkBlockInfo[]>;
  texts?: StateWithSetter<TextBlockInfo[]>;
  links?: StateWithSetter<LinkBlockInfo[]>;
  paths?: StateWithSetter<DrawPathInfo[]>;
  canvases?: StateWithSetter<EmbeddedCanvasData[]>;
};
// export type GlobalCanvasStates = MainGlobalCanvasStates;

export type ModuleInsertOptionsType = Partial<{
  id: string; // 父亲画布的唯一标识符
  parentId: string; // 父亲画布的唯一标识符
  width: number;
  height: number;
  fontSize: number;
  duration: number;
  title: string;
}>;
