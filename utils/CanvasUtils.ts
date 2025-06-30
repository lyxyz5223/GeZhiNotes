import { TransformType } from '@/types/CanvasTypes';
import { Skia } from '@shopify/react-native-skia';

export function createPathFromPoints(points: { x: number; y: number }[]) {
  if (!points || points.length < 2) {
    //console.error('创建路径失败: 点数据不足', points);
    return null;
  }

  try {
    const path = Skia.Path.Make();
    path.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      path.lineTo(points[i].x, points[i].y);
    }
    return path;
  } catch (error) {
    console.error('创建Skia路径时出错:', error, points);
    return null;
  }
}

export function calculateRelativePathPosition(
  pageX: number,
  pageY: number,
  canvasLayout: { x: number; y: number },
  transform: TransformType
) {
  const relX =
    (pageX - canvasLayout.x - transform.translateX) / transform.scale;
  const relY =
    (pageY - canvasLayout.y - transform.translateY) / transform.scale;
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
  keys.forEach((key) => {
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

/**
 * 计算两个圆形画布之间的连接线点
 * @param fromCanvas 起始画布
 * @param toCanvas 目标画布
 * @returns 连接线的起点和终点坐标，已考虑圆的半径
 */
export function calculateCanvasConnectionPoints(
  fromCanvas: { x: number; y: number; width: number; height: number },
  toCanvas: { x: number; y: number; width: number; height: number }
) {  // 使用字符串连接方式安全地输出日志
  console.log('计算连接点 - 输入');

  if (
    !fromCanvas ||
    !toCanvas ||
    typeof fromCanvas.x !== 'number' ||
    typeof toCanvas.x !== 'number'
  ) {
    console.error('画布数据无效');
    throw new Error('画布数据无效');
  }

  // 计算两个圆的中心点
  const fromCenter = {
    x: fromCanvas.x + fromCanvas.width / 2,
    y: fromCanvas.y + fromCanvas.height / 2,
  };
  const toCenter = {
    x: toCanvas.x + toCanvas.width / 2,
    y: toCanvas.y + toCanvas.height / 2,
  };
  // 使用字符串连接方式安全地输出日志
  console.log('中心点计算结果');

  // 计算两个圆心之间的角度
  const angle = Math.atan2(
    toCenter.y - fromCenter.y,
    toCenter.x - fromCenter.x
  );
  // 使用字符串连接方式安全地输出日志
  console.log('角度计算结果: ' + angle);

  // 计算圆的半径
  const fromRadius = Math.min(fromCanvas.width, fromCanvas.height) / 2;
  const toRadius = Math.min(toCanvas.width, toCanvas.height) / 2;  // 使用字符串连接方式安全地输出日志
  console.log(
    '半径计算结果: fromRadius: ' + fromRadius + ', toRadius: ' + toRadius
  );

  // 计算连接线实际起点和终点（从圆的边缘开始）
  const startPoint = {
    x: fromCenter.x + Math.cos(angle) * fromRadius,
    y: fromCenter.y + Math.sin(angle) * fromRadius,
  };

  const endPoint = {
    x: toCenter.x - Math.cos(angle) * toRadius,
    y: toCenter.y - Math.sin(angle) * toRadius,
  };
  // 使用字符串连接方式安全地输出日志
  console.log('最终连接点已计算');

  return [startPoint, endPoint];
}
