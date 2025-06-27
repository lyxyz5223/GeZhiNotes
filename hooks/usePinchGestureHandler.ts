import { CanvasContext } from "@/types/CanvasGestureTypes";
import { useRef } from "react";
import { Gesture } from "react-native-gesture-handler";

/**
 * 用于处理双指缩放手势，要求 CanvasContext.contentsTransform 结构标准
 */
const usePinchGestureHandler = (canvasContext: CanvasContext) => {
  const startScaleRef = useRef(1);
  const startFocalRef = useRef({ x: 0, y: 0 });
  const startTranslateRef = useRef({ x: 0, y: 0 });

  return Gesture.Pinch()
    .runOnJS(true)
    .onBegin((event) => {
      // 记录缩放起点
      startScaleRef.current = canvasContext.contentsTransform.canvasContentsTransform.scale;
      // 记录初始锚点和初始平移
      startFocalRef.current = { x: event.focalX, y: event.focalY };
      startTranslateRef.current = {
        x: canvasContext.contentsTransform.canvasContentsTransform.translateX,
        y: canvasContext.contentsTransform.canvasContentsTransform.translateY,
      };
    })
    .onUpdate((event) => {
      const prev = canvasContext.contentsTransform.canvasContentsTransform;
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
      canvasContext.contentsTransform.setCanvasContentsTransform((prev) => ({
        ...prev,
        scale: clampedScale,
        translateX: newTranslateX,
        translateY: newTranslateY,
      }));
    })
    .onEnd(() => {
      // 缩放结束，可选收尾
    });
};

export default usePinchGestureHandler;
