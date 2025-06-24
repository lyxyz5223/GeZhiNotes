import { UseGestureResponderFunctionsSelectorParams } from '@/types/CanvasGestureTypes';
import { CanvasMode } from '@/types/CanvasTypes';
import { mergeResponderHandlers } from '@/utils/CanvasUtils';
import { useCanvasContentsGesture, useDrawGesture } from './UseCanvasContentsGesture';
import { useCanvasMoveResizeGesture } from './UseMoveResizeGesture';


/*
 * 画布手势响应函数选择器
 * @param params 画布参数与手势相关参数的合并体
 * @return 返回对应模式下的手势响应函数
*/
export function useGestureResponderFunctionsSelector(
  params: UseGestureResponderFunctionsSelectorParams
) {
  // 顶层调用所有相关 Hook，避免条件调用
  const canvasContentsGesture = useCanvasContentsGesture({
    id: params.id ?? '',
    color: params.color ?? '#000',
    size: params.size ?? 2,
    mode: params.mode ?? CanvasMode.Draw,
    path: params.path,
    contentsTransform: params.contentsTransform,
    canvasViewRef: params.canvasViewRef ?? { current: null },
  });
  const moveResizeGesture = useCanvasMoveResizeGesture({
    x: params.x ?? 0,
    y: params.y ?? 0,
    width: params.width ?? 0,
    height: params.height ?? 0,
    onMoveResize: params.onMoveResize ?? (() => {}),
    id: params.id ?? '',
    moveable: params.moveable,
    resizeable: params.resizeable,
  });

  // 手势函数列表，支持多函数与条件
  const gestureFunctions = {
    [CanvasMode.Draw]: [
      { func: canvasContentsGesture, condition: true },
    ],
    [CanvasMode.Eraser]: [
      { func: canvasContentsGesture, condition: true },
    ],
    [CanvasMode.Hand]: [
      {
        func: moveResizeGesture,
        condition: params.moveable || params.resizeable
      },
    ],
  };

  // 支持 mode 为数组或单个
  const modeArr: CanvasMode[] = Array.isArray(params.mode) ? params.mode : [params.mode];
  // 收集所有满足条件的手势对象
  let gestureList: any[] = [];
  for (const m of modeArr) {
    const arr = (gestureFunctions as Record<string, any[]>)[m] || [];
    for (const item of arr) {
      if (item.condition && item.func) gestureList.push(item.func);
    }
  }
  if (gestureList.length === 0) {
    return {
      onStartShouldSetResponder: () => false,
      onMoveShouldSetResponder: () => false,
    };
  } else if (gestureList.length === 1) {
    return gestureList[0];
  } else {
    return gestureList.reduce((acc, cur) => mergeResponderHandlers(acc, cur));
  }
}
