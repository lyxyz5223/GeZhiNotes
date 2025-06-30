import { CanvasContext } from "@/types/CanvasTypes";
import { useMemo, useRef } from "react";
import { Gesture } from "react-native-gesture-handler";

/**
 * 用于处理画布内容的拖动（Pan）
 */
export const usePanContentsGestureHandler = (canvasContext: CanvasContext) => {
  const startTranslateRef = useRef({ x: 0, y: 0 });
  return useMemo(() =>
    Gesture.Pan()
      .runOnJS(true)
      .onBegin((event) => {
        // 记录初始平移
        startTranslateRef.current = {
          x: canvasContext.contentsTransform.value.translateX,
          y: canvasContext.contentsTransform.value.translateY,
        };
      })
      .onUpdate((event) => {
        console.log('ds figjdhskkfdbhunidmosdnfbfhhnidmos,pdfsfkkkkkkkkkkk哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈')
        // 只处理单指拖动
        if (event.numberOfPointers !== 1) return;
        const dx = event.translationX;
        const dy = event.translationY;
        const startTranslate = startTranslateRef.current;
        const newTranslateX = startTranslate.x + dx;
        const newTranslateY = startTranslate.y + dy;
        canvasContext.contentsTransform.setValue?.((prev) => ({
          ...prev,
          translateX: newTranslateX,
          translateY: newTranslateY,
        }));
        // 可选：输出调试信息
        // console.log('Pan update:', { translateX: newTranslateX, translateY: newTranslateY });
      })
      .onEnd(() => {
        // 拖动结束，可选收尾
      })
    , [canvasContext.contentsTransform]);
};

/**
 * 用于处理画布内容的缩放
 */
export const usePinchContentsGestureHandler = (canvasContext: CanvasContext, childrenGestures: any[]) => {
  const startScaleRef = useRef(1);
  const startFocalRef = useRef({ x: 0, y: 0 });
  const startTranslateRef = useRef({ x: 0, y: 0 });
  return useMemo(() => Gesture.Pinch().simultaneousWithExternalGesture()
    .runOnJS(true)
    .onBegin((event) => {
      // 记录缩放起点
      startScaleRef.current = canvasContext.contentsTransform.value.scale;
      // 记录初始锚点和初始平移
      startFocalRef.current = { x: event.focalX, y: event.focalY };
      startTranslateRef.current = {
        x: canvasContext.contentsTransform.value.translateX,
        y: canvasContext.contentsTransform.value.translateY,
      };
    })
    .onUpdate((event) => {
      // const prev = canvasContext.contentsTransform.canvasContentsTransform;
      const newScale = startScaleRef.current * event.scale;
      const clampedScale = Math.max(0.2, Math.min(newScale, 8));
      // 以手势中心为锚点调整平移
      const focal = { x: event.focalX, y: event.focalY };
      const startFocal = startFocalRef.current;
      const startTranslate = startTranslateRef.current;
      // 计算缩放后新的平移，使得缩放锚点保持在手势中心
      const dx = focal.x - startFocal.x;
      const dy = focal.y - startFocal.y;
      const scaleDelta = clampedScale / startScaleRef.current;
      const newTranslateX = startTranslate.x * scaleDelta + (1 - scaleDelta) * startFocal.x + dx;
      const newTranslateY = startTranslate.y * scaleDelta + (1 - scaleDelta) * startFocal.y + dy;
      canvasContext.contentsTransform.setValue?.((prev) => ({
        ...prev,
        scale: clampedScale,
        translateX: newTranslateX,
        translateY: newTranslateY,
      }));
      console.log('Pinch update:', {
        scale: clampedScale,
        translateX: newTranslateX,
        translateY: newTranslateY,
      });
    })
    .onEnd(() => {
      // 缩放结束，可选收尾
    })
    , [canvasContext.contentsTransform]); // 依赖 contentsTransform，确保更新时获取最新状态
};

