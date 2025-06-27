import { UseCanvasMoveResizeGestureParams } from "@/types/CanvasGestureTypes";
import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';

export function useCanvasMoveResizeGesture(params: UseCanvasMoveResizeGestureParams) {
  const { x, y, width, height, onMoveResize, id } = params;
  // 用 sharedValue 管理动画状态
  const translateX = useSharedValue(x);
  const translateY = useSharedValue(y);
  const w = useSharedValue(width);
  const h = useSharedValue(height);

  // 拖动手势
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      // 可扩展：设置 active 状态
    })
    .onUpdate(e => {
      translateX.value = x + e.translationX;
      translateY.value = y + e.translationY;
    })
    .onEnd(() => {
      if (onMoveResize) {
        onMoveResize(id, translateX.value, translateY.value, w.value, h.value);
      }
    });

  // 可扩展：缩放手势（Pinch）
  // const pinchGesture = Gesture.Pinch() ...

  return {
    gesture: panGesture,
    translateX,
    translateY,
    w,
    h,
  };
}
