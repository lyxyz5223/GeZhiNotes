import { CanvasContext, CanvasType } from "@/types/CanvasTypes";
import { Gesture } from "react-native-gesture-handler";
import React, { useRef } from "react";

// 此文件仅用于处理画布的手势事件

const minWidth = 80; // 最小宽度（用于resize时的最小半径）

export const useDragCanvasGestureHandler = (props: CanvasContext) => {
  const {
    x, y, width, height,
    canvasType = CanvasType.Child,
    fullscreen = { value: false, setValue: () => { } },
    canvasTransform,
  } = props;
  const dragStartRef = React.useRef({ x: 0, y: 0 });
  const pinchStartRef = React.useRef({ scale: 1, translateX: 0, translateY: 0, focalX: 0, focalY: 0 });
  // 只有非全屏子画布允许resize
  const canResize = !fullscreen.value && canvasType === CanvasType.Child;
  // 保持圆形：宽高同步变化，borderRadius始终为min(width, height)/2
  // 双击手势：子画布可全屏
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .runOnJS(true)
    .onEnd(() => {
      console.log('双击事件触发');
      if (canvasType === CanvasType.Child && !fullscreen.value) {
        fullscreen.setValue?.(true);
      }
    });
  // 拖动手势：单指拖动
  const dragGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .runOnJS(true)
    .onBegin(() => {
      dragStartRef.current = {
        x: canvasTransform?.value.translateX || 0,
        y: canvasTransform?.value.translateY || 0,
      };
    })
    .onUpdate((event) => {
      canvasTransform?.setValue?.((prev) => ({
        ...prev,
        translateX: dragStartRef.current.x + event.translationX,
        translateY: dragStartRef.current.y + event.translationY,
      }));
    });

  // 缩放手势：双指缩放
  // const pinchGesture = Gesture.Pinch()
  //   .runOnJS(true)
  //   .onBegin((event) => {
  //     const minScale = 0.2;
  //     const maxScale = 8;
  //     // clamp 初始 scale，保证后续一致
  //     let startScale = Math.max(minScale, Math.min(maxScale, canvasTransform.scale));
  //     pinchStartRef.current = {
  //       scale: startScale,
  //       translateX: canvasTransform.translateX,
  //       translateY: canvasTransform.translateY,
  //       focalX: event.focalX,
  //       focalY: event.focalY,
  //     };
  //   })
  //   .onUpdate((event) => {
  //     const { scale, focalX, focalY } = event;
  //     setCanvasTransform((prev) => {
  //       const minScale = 0.2;
  //       const maxScale = 8;
  //       const start = pinchStartRef.current;
  //       // 先算 newScale 并 clamp
  //       let newScale = start.scale * scale;
  //       newScale = Math.max(minScale, Math.min(maxScale, newScale));
  //       // 反推实际用于锚点算法的 scale
  //       const scaleForMath = newScale / start.scale;
  //       // 缩放前，焦点在内容坐标系中的点
  //       const originContentX = (start.focalX - start.translateX) / start.scale;
  //       const originContentY = (start.focalY - start.translateY) / start.scale;
  //       // 缩放后，translate 需要保证内容坐标的 originContentX/Y 依然在当前手指位置
  //       const newTranslateX = focalX - originContentX * newScale;
  //       const newTranslateY = focalY - originContentY * newScale;
  //       return {
  //         scale: newScale,
  //         translateX: newTranslateX,
  //         translateY: newTranslateY,
  //       };
  //     });
  //   });
  return Gesture.Simultaneous(
    doubleTapGesture,
    dragGesture
  );
};

// ============== 画布resize边框实现 START ===============
export const useCanvasCircleBorderResizeGestureHandler = (canvasContext: CanvasContext) => {
  // 拖动高亮状态
  const { value: activeResizing, setValue: setActiveResizing } = canvasContext.activeResizing;
  const {
    id, x = 0, y = 0, width = 0, height = 0,
    onMoveResize,
    borderTouchWidth,
  } = canvasContext;
  // allowResize需用ref，保证onUpdate等回调能访问到
  const allowResizeRef = useRef(false);
  // 圆环resize手势（任意角度，屏幕坐标判定，缩放平滑）
  let start = { x: 0, y: 0, width: 0, height: 0, centerX: 0, centerY: 0, startR: 0, startTouchR: 0 };
  return Gesture.Pan()
    .runOnJS(true)
    .onBegin((event) => {
      // 画布中心的屏幕坐标（用start.x/start.y+start.width/2，保证锚点不受props异步影响）
      const centerX = (canvasContext.x ?? 0) + (canvasContext.width ?? 0) / 2;
      const centerY = (canvasContext.y ?? 0) + (canvasContext.height ?? 0) / 2;
      const touchR = Math.sqrt(Math.pow(event.absoluteX - centerX, 2) + Math.pow(event.absoluteY - centerY, 2));
      start = { x, y, width, height, centerX, centerY, startR: width / 2, startTouchR: touchR };
      const allow = (touchR >= start.startR && touchR <= start.startR + borderTouchWidth) || activeResizing;
      allowResizeRef.current = allow;
      setActiveResizing?.(allow);
    })
    .onUpdate((event) => {
      if (!allowResizeRef.current) return;
      // 以start.centerX/start.centerY为锚点，计算新半径
      const currR = Math.sqrt(Math.pow(event.absoluteX - start.centerX, 2) + Math.pow(event.absoluteY - start.centerY, 2));
      let newR = Math.max(start.startR + (currR - start.startTouchR), minWidth / 2);
      let newW = newR * 2;
      let newH = newR * 2;
      // 保持resize起始时的圆心不变（用start.x/start.y+start.width/2）
      let newX = start.centerX - newR;
      let newY = start.centerY - newR;
      onMoveResize && onMoveResize(id, newX, newY, newW, newH);
    })
    .onEnd(() => {
      setActiveResizing?.(false);
      allowResizeRef.current = false;
    })
    .onFinalize(() => {
      setActiveResizing?.(false);
      allowResizeRef.current = false;
    });
}
// ============== 画布resize边框实现 END ===============
