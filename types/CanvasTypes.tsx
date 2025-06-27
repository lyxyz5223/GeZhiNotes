import { Skia } from "@shopify/react-native-skia";

// 通用 StateUpdater 泛型，用于表示setState的setter函数
export type StateUpdater<T> = (updater: T | ((prev: T) => T)) => void;

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
  mode?: CanvasMode; // 绘制模式，默认为Draw
  moveable?: boolean; // 是否允许移动画布
  resizeable?: boolean; // 是否允许缩放画布
  borderRadius?: number; // 新增：允许自定义圆角，默认圆形
  // 全局数据统一传递
  globalData?: GlobalCanvasState;
  onExitFullscreen?: () => void; // 新增：全屏子画布退出全屏回调
  onEnterFullscreen?: () => void; // 新增：全屏子画布进入全屏回调
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
export type GlobalCanvasState = {
  images?: ImageBlockInfo[];
  setImages?: StateUpdater<ImageBlockInfo[]>;
  audios?: AudioBlockInfo[];
  setAudios?: StateUpdater<AudioBlockInfo[]>;
  videos?: VideoBlockInfo[];
  setVideos?: StateUpdater<VideoBlockInfo[]>;
  webLinks?: WebLinkBlockInfo[];
  setWebLinks?: StateUpdater<WebLinkBlockInfo[]>;
  texts?: TextBlockInfo[];
  setTexts?: StateUpdater<TextBlockInfo[]>;
  links?: LinkBlockInfo[];
  setLinks?: StateUpdater<LinkBlockInfo[]>;
  paths?: DrawPathInfo[];
  setPaths?: StateUpdater<DrawPathInfo[]>;
};

