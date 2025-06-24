import { Skia } from "@shopify/react-native-skia";

export enum CanvasMode {
  Hand = 'hand',
  Draw = 'draw',
  Text = 'text',
  Eraser = 'eraser',
}

export type Point = {
  x: number;
  y: number;
}

export type TransformType = {
  scale: number;
  translateX: number;
  translateY: number;
  originX: number;
  originY: number;
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
  // 画布位置
  x?: number;
  y?: number;
  // 画布尺寸
  width: number;
  height: number;
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
  // 这个路径与设置器用于在子组件中保存路径到父亲，从而实现全局路径存储
  pathsInGlobal?: DrawPathInfo[];
  setPathsInGlobal?: (updater: DrawPathInfo[] | ((prev: DrawPathInfo[]) => DrawPathInfo[])) => void;
  mode?: CanvasMode; // 绘制模式，默认为Draw
  moveable?: boolean; // 是否允许移动画布
  resizeable?: boolean; // 是否允许缩放画布
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
  x: number;
  y: number;
  width: number;
  height: number;
};