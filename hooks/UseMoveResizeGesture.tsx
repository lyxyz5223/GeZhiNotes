import { useMemo, useRef } from "react";
import { GestureResponderEvent } from "react-native";
import { UseCanvasMoveResizeGestureParams } from "@/types/CanvasGestureTypes";

export function useCanvasMoveResizeGesture(params: UseCanvasMoveResizeGestureParams) {
  const { x, y, width, height, onMoveResize, id } = params;

  const dragOffset = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const resizeStart = useRef<{ w: number; h: number; x: number; y: number; startX: number; startY: number }>({ w: width, h: height, x, y, startX: 0, startY: 0 });
  const fingerDistanceSquareRef = useRef<number>(0);

  const panResponder = useMemo(() => {
    return {
      onStartShouldSetResponder: () => true,
      onMoveShouldSetResponder: () => true,
      onResponderGrant: (evt: GestureResponderEvent) => {
        if (evt.nativeEvent.touches.length === 1) {
          console.log('One finger drag started');
          dragOffset.current = {
            dx: evt.nativeEvent.pageX - x,
            dy: evt.nativeEvent.pageY - y,
          };
        }
        else if (evt.nativeEvent.touches.length === 2) {
          // 不处理，因为双指缩放在 onResponderMove 中处理，这个if分支无法进入！
        }
      },
      onResponderMove: (evt: GestureResponderEvent) => {
        if (!onMoveResize) return;
        if (evt.nativeEvent.touches.length === 1) {
          console.log('One finger drag move');
          const newX = evt.nativeEvent.pageX - dragOffset.current.dx;
          const newY = evt.nativeEvent.pageY - dragOffset.current.dy;
          onMoveResize(id, newX, newY, width, height);
        }
        else if (evt.nativeEvent.touches.length === 2) {
          console.log('双指缩放');
          // 双指缩放逻辑
          if (!fingerDistanceSquareRef.current) {
            console.log('Two fingers scale started');
            const touch1 = evt.nativeEvent.touches[0];
            const touch2 = evt.nativeEvent.touches[1];
            const dx = touch2.pageX - touch1.pageX;
            const dy = touch2.pageY - touch1.pageY;
            fingerDistanceSquareRef.current = dx * dx + dy * dy;
            resizeStart.current = {
              w: width,
              h: height,
              x,
              y,
              startX: x,
              startY: y
            };
            return;
          }
          const touch1 = evt.nativeEvent.touches[0];
          const touch2 = evt.nativeEvent.touches[1];
          const dx = touch2.pageX - touch1.pageX;
          const dy = touch2.pageY - touch1.pageY;
          const distanceSquare = dx * dx + dy * dy;
          let lambda = Math.sqrt(Math.abs(distanceSquare - fingerDistanceSquareRef.current));
          if (distanceSquare < fingerDistanceSquareRef.current) {
            // 缩小
            lambda = -lambda;
          }
          const newX = resizeStart.current.startX - lambda / 2;
          const newY = resizeStart.current.startY - lambda / 2;
          const newWidth = resizeStart.current.w + lambda;
          const newHeight = resizeStart.current.h + lambda;
          onMoveResize(id, newX, newY, newWidth, newHeight);
        }
      },
      onResponderRelease: () => {
        fingerDistanceSquareRef.current = 0; // 重置双指距离
        resizeStart.current = {
          w: width,
          h: height,
          x,
          y,
          startX: x,
          startY: y
        };
      },
      onResponderTerminate: () => { },
    };
  }, [x, y, width, height, onMoveResize, id]);
  return panResponder;
}
