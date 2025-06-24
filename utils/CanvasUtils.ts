import { TransformType } from "@/types/CanvasTypes";
import { Skia } from "@shopify/react-native-skia";

export function createPathFromPoints(points: { x: number, y: number }[]) {
  const path = Skia.Path.Make();
  if (points.length > 0) {
    path.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      path.lineTo(points[i].x, points[i].y);
    }
  }
  return path;
}

export function calculateRelativePathPosition(
  pageX: number,
  pageY: number,
  canvasLayout: { x: number; y: number },
  transform: TransformType
) {
  const originX = transform.originX || 0;
  const originY = transform.originY || 0;
  const relX = (((pageX - canvasLayout.x) - originX) / transform.scale + originX) - transform.translateX;
  const relY = (((pageY - canvasLayout.y) - originY) / transform.scale + originY) - transform.translateY;
  return [relX, relY];
}


// 获取当前时间戳
export const getTimestamp = () => {
  return Date.now();
};

// 合并两个响应者处理函数对象
// 如果两个对象中有相同的键，则返回值同时包含两个函数，按参数传递顺序优先有序执行
export function mergeResponderHandlers(objA: any, objB: any) {
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