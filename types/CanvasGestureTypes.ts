import { CanvasMode, CustomCanvasProps, DrawPathInfo, TransformType } from "./CanvasTypes";

// 通用 StateUpdater 类型
export type StateUpdater<T> = (updater: T | ((prev: T) => T)) => void;

// 缩放/拖动相关参数
export interface CanvasTransformParams {
  canvasContentsTransform: TransformType;
  setCanvasContentsTransform: StateUpdater<TransformType>;
}

export interface CanvasPathsParams {
  paths: DrawPathInfo[];
  setPaths: StateUpdater<DrawPathInfo[]>;
  currentPathInfo: DrawPathInfo | null;
  setCurrentPathInfo: StateUpdater<DrawPathInfo | null>;
}
// 绘图相关参数
export interface CanvasDrawParams {
  id: string;
  color: string;
  size: number;
  mode: CanvasMode;
  path: CanvasPathsParams;
  contentsTransform: CanvasTransformParams;
  canvasViewRef: React.RefObject<any>;
}

// 主手势参数类型
export type UseDrawGestureParams = CanvasDrawParams;
export type UseCanvasContentsGestureParams = CanvasDrawParams;
export type UseCanvasContentsMoveResizeGestureParams = CanvasTransformParams;
export type CanvasContext = CustomCanvasProps & { contentsTransform: CanvasTransformParams; canvasViewRef: React.RefObject<any>; };

// 画布移动/缩放手势参数类型
export interface UseCanvasMoveResizeGestureParams {
  x: number;
  y: number;
  width: number;
  height: number;
  onMoveResize: (id: string, x: number, y: number, width: number, height: number) => void;
  id: string;
  moveable: boolean;
  resizeable: boolean;
}

