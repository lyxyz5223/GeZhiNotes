import { UseCanvasContentsGestureParams, UseCanvasContentsMoveResizeGestureParams, UseDrawGestureParams } from "@/types/CanvasGestureTypes";
import { CanvasMode, DrawPathInfo, Point } from "@/types/CanvasTypes";
import { calculateRelativePathPosition, createPathFromPoints } from "@/utils/CanvasUtils";
import { useMemo, useRef } from "react";
import { GestureResponderEvent } from "react-native";

// 画布绘图处理函数
export function useDrawGesture(params: UseDrawGestureParams) {
  const {
    id,
    color,
    size,
    mode,
    path,
    contentsTransform,
    canvasViewRef,
  } = params;
  const {
    paths,
    setPaths,
    setCurrentPathInfo
  } = path;
  const {
    canvasContentsTransform,
  } = contentsTransform;

  const canvasLayoutRef = useRef<Point>({ x: 0, y: 0});

  const currentPathInfoRef = useRef<DrawPathInfo | null>(null);
  const isDoubleFingersRef = useRef(false);

  const panResponder = useMemo(() => {
    return {
      onStartShouldSetResponder: () => true,
      onMoveShouldSetResponder: () => true,
      onResponderGrant: (evt: GestureResponderEvent) => {
        if (!evt?.nativeEvent || !color || !size) return;
        if (isDoubleFingersRef.current) {
          return;// 双指缩放时不处理绘图
        }
        const { pageX, pageY } = evt.nativeEvent;
        // 计算相对画布的坐标
        if (canvasViewRef && canvasViewRef.current && canvasViewRef.current.measure) {
          canvasViewRef.current.measure(
            (x: number, y: number, width: number, height: number, absPageX: number, absPageY: number) => {
              canvasLayoutRef.current = { x: absPageX, y: absPageY };
            }
          );
        }
        // 计算相对画布的坐标，修正：考虑缩放和平移
        const [relX, relY] = calculateRelativePathPosition(
          pageX,
          pageY,
          canvasLayoutRef.current,
          canvasContentsTransform
        );
        // 橡皮擦：统一使用 blendMode: 'clear'，color/size 只影响擦除区域大小
        let drawColor = color;
        let drawSize = size;
        let isEraserPath = false;
        if (mode === CanvasMode.Eraser) {
          drawColor = '#000'; // 颜色无实际意义
          isEraserPath = true;
        }
        const points = [{ x: relX, y: relY }];
        const path = createPathFromPoints(points);
        const newPath: DrawPathInfo = { id, path, color: drawColor, size: drawSize, isEraser: isEraserPath, points, timestamp: evt.nativeEvent.timestamp };
        currentPathInfoRef.current = newPath;
        setCurrentPathInfo(newPath); // 更新实时预览状态
        console.log('onResponderGrant', '[ color:', newPath.color, '] [ location:', newPath.points[0], '] [ isEraser:', newPath.isEraser, ']');
      },
      onResponderMove: (evt: GestureResponderEvent) => {
        if (!evt?.nativeEvent) return;
        if (evt.nativeEvent.touches.length > 1 || isDoubleFingersRef.current) {
          console.log('双指缩放，忽略绘图');
          // 双指缩放时不进行绘图
          currentPathInfoRef.current = null;
          setCurrentPathInfo(null); // 清除实时预览状态
          isDoubleFingersRef.current = true; // 标记为双指缩放
          return;
        }
        console.log('单指绘图');
        if (!currentPathInfoRef.current) return;
        const { pageX, pageY } = evt.nativeEvent;
        // 计算相对画布的坐标，修正：考虑缩放和平移（不做边界裁剪，允许无限延伸）
        const [relX, relY] = calculateRelativePathPosition(
          pageX,
          pageY,
          canvasLayoutRef.current,
          canvasContentsTransform
        );
        const moveOldPoints = currentPathInfoRef.current.points;
        const moveNewPoints = [...moveOldPoints, { x: relX, y: relY }];
        const newPath = createPathFromPoints(moveNewPoints);
        currentPathInfoRef.current = {
          ...currentPathInfoRef.current,
          points: moveNewPoints,
          path: newPath,
        };
        setCurrentPathInfo(currentPathInfoRef.current); // 更新实时预览状态
        console.log('onResponderMove', moveNewPoints.length);
      },
      onResponderRelease: (evt: GestureResponderEvent) => {
        console.log('绘制结束onResponderRelease');
        // 只在非双指缩放时 push 完整一笔
        if (!isDoubleFingersRef.current && currentPathInfoRef.current && setPaths && paths) {
          setPaths(prev => [...prev, currentPathInfoRef.current!]);
        }
        currentPathInfoRef.current = null;
        setCurrentPathInfo(null); // 清除实时预览状态
        // 手指离开屏幕，说明是双指缩放结束
        if (isDoubleFingersRef.current && evt.nativeEvent.touches.length === 0) {
          isDoubleFingersRef.current = false; // 重置双指缩放状态
        }
      },
      onResponderTerminate: (evt: GestureResponderEvent) => {
        console.log('绘制结束onResponderTerminate');
        // 只在非双指缩放时 push 完整一笔
        if (!isDoubleFingersRef.current && currentPathInfoRef.current && setPaths && paths) {
          setPaths(prev => [...prev, currentPathInfoRef.current!]);
        }
        currentPathInfoRef.current = null;
        setCurrentPathInfo(null); // 清除实时预览状态
        isDoubleFingersRef.current = false; // 重置双指缩放状态
      }
    };
  }, [id, color, size, mode, setPaths, paths, canvasLayoutRef, canvasContentsTransform, canvasViewRef, setCurrentPathInfo]);

  return panResponder;
}

// 画布内容缩放手势处理函数
export function useCanvasContentsMoveResizeGesture(params: UseCanvasContentsMoveResizeGestureParams) {
  const { canvasContentsTransform, setCanvasContentsTransform } = params;
  // 记录手势起始状态
  const gestureState = useRef<{
    startDist: number;
    startScale: number;
    startCenter: { x: number; y: number };
    origin: { x: number; y: number };
    startTranslate: { x: number; y: number };
    inited: boolean;
  }>({
    startDist: 0,
    startScale: 1,
    startCenter: { x: 0, y: 0 },
    origin: { x: 0, y: 0 },
    startTranslate: { x: 0, y: 0 },
    inited: false,
  });

  return {
    onStartShouldSetResponder: () => true,
    onMoveShouldSetResponder: () => true,
    onResponderGrant: () => {
      gestureState.current.inited = false;
    },
    onResponderMove: (evt: GestureResponderEvent) => {
      if (evt.nativeEvent.touches.length < 2) return;
      const [t1, t2] = evt.nativeEvent.touches;
      const layout = { x: 0, y: 0 };
      const currCenter = {
        x: (t1.pageX + t2.pageX) / 2,
        y: (t1.pageY + t2.pageY) / 2,
      };
      const currDist = Math.hypot(t2.pageX - t1.pageX, t2.pageY - t1.pageY);
      if (!gestureState.current.inited) {
        gestureState.current.startDist = currDist;
        gestureState.current.startScale = canvasContentsTransform.scale;
        gestureState.current.startCenter = currCenter;
        gestureState.current.startTranslate = {
          x: canvasContentsTransform.translateX,
          y: canvasContentsTransform.translateY,
        };
        // 计算锚点（内容坐标系下）
        gestureState.current.origin = {
          x: (currCenter.x - layout.x - canvasContentsTransform.translateX) / canvasContentsTransform.scale,
          y: (currCenter.y - layout.y - canvasContentsTransform.translateY) / canvasContentsTransform.scale,
        };
        gestureState.current.inited = true;
      }
      const { startDist, startScale, origin } = gestureState.current;
      if (startDist === 0) return;
      const scale = startScale * (currDist / startDist);
      const translateX = currCenter.x - layout.x - scale * origin.x;
      const translateY = currCenter.y - layout.y - scale * origin.y;
      setCanvasContentsTransform(prev => ({
        ...prev,
        scale,
        translateX,
        translateY,
        originX: origin.x,
        originY: origin.y,
      }));
    },
    onResponderRelease: () => {
      gestureState.current.inited = false;
    },
    onResponderTerminate: () => {
      gestureState.current.inited = false;
    },
  };
}

// 合并两个手势对象的事件处理函数，使同名事件都能被依次调用
function mergeResponderHandlers(objA: any, objB: any) {
  const keys = new Set([...Object.keys(objA), ...Object.keys(objB)]);
  const merged: any = {};
  keys.forEach(key => {
    const fnA = objA[key];
    const fnB = objB[key];
    if (typeof fnA === 'function' && typeof fnB === 'function') {
      merged[key] = (...args: any[]) => {
        const retA = fnA(...args);
        const retB = fnB(...args);
        // 对于需要返回值的 handler，优先返回 true 或非 undefined
        if (typeof retA !== 'undefined' || typeof retB !== 'undefined') {
          return retA !== undefined ? retA : retB;
        }
      };
    } else if (typeof fnA === 'function') {
      merged[key] = fnA;
    } else if (typeof fnB === 'function') {
      merged[key] = fnB;
    }
  });
  return merged;
}

export function useCanvasContentsGesture(
  params: UseCanvasContentsGestureParams
) {
  const {
    id,
    color,
    size,
    mode,
    path,
    contentsTransform,
    canvasViewRef,
  } = params;
  
  const drawGesture = useDrawGesture({
    id,
    color,
    size,
    mode,
    path,
    contentsTransform,
    canvasViewRef,
  });
  const canvasContentsMoveResize = useCanvasContentsMoveResizeGesture(
    contentsTransform
  );
  return mergeResponderHandlers(drawGesture, canvasContentsMoveResize);
}
