import { CanvasContext } from "@/types/CanvasTypes";
import { useMemo, useRef } from "react";
import { Gesture } from "react-native-gesture-handler";

export const usePinchContentsGestureHandler = (canvasContext: CanvasContext) => {
  const startScaleRef = useRef(1);
  const startTranslateRef = useRef({ x: 0, y: 0 });
  const startFocalRef = useRef({ x: 0, y: 0 });
  const baseScaleRef = useRef(1);
  const isPinchingRef = useRef(false);
  return useMemo(() => Gesture.Pinch().simultaneousWithExternalGesture()
    .runOnJS(true)
    .onBegin((event) => {
      isPinchingRef.current = false;
    })
    .onUpdate((event) => {
      // 保存当前event所有数据
      const { numberOfPointers, scale, focalX, focalY } = event;
      if (numberOfPointers !== 2) {
        isPinchingRef.current = false;
        return;
      }
      if (!isPinchingRef.current) {
        // 刚进入双指，归一化scale，只初始化，不setValue
        startScaleRef.current = canvasContext.contentsTransform.value.scale;
        startTranslateRef.current = {
          x: canvasContext.contentsTransform.value.translateX,
          y: canvasContext.contentsTransform.value.translateY,
        };
        startFocalRef.current = { x: focalX, y: focalY };
        baseScaleRef.current = scale;
        isPinchingRef.current = true;
        return;
      }
      // 只有双指且isPinchingRef为true时才setValue
      if (isPinchingRef.current) {
        const startScale = startScaleRef.current;
        const startTranslate = startTranslateRef.current;
        const startFocal = startFocalRef.current;
        const baseScale = baseScaleRef.current;
        const relativeScale = scale / baseScale;
        const newScale = startScale * relativeScale;
        const newTranslateX = focalX - (startFocal.x - startTranslate.x) * (newScale / startScale);
        const newTranslateY = focalY - (startFocal.y - startTranslate.y) * (newScale / startScale);
        canvasContext.contentsTransform.setValue?.((prev) => ({
          ...prev,
          translateX: newTranslateX,
          translateY: newTranslateY,
          scale: newScale,
        }));
      }
    })
    .onEnd(() => {
      isPinchingRef.current = false;
      console.log('Pinch gesture ended, current contentsTransform:', canvasContext.contentsTransform.value);
    })
    , [canvasContext.contentsTransform]);
};

export const usePanContentsGestureHandler = (canvasContext: CanvasContext) => {
  const startTranslateRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  return useMemo(() => Gesture.Pan()
    .minPointers(2)
    .maxPointers(2)
    .runOnJS(true)
    .onBegin(() => {
      isPanningRef.current = false;
    })
    .onUpdate((event) => {
      const { numberOfPointers, translationX, translationY } = event;
      if (numberOfPointers !== 2) {
        isPanningRef.current = false;
        return;
      }
      if (!isPanningRef.current) {
        startTranslateRef.current = {
          x: canvasContext.contentsTransform.value.translateX,
          y: canvasContext.contentsTransform.value.translateY,
        };
        isPanningRef.current = true;
        return;
      }
      if (isPanningRef.current) {
        const startTranslate = startTranslateRef.current;
        const newTranslateX = startTranslate.x + translationX;
        const newTranslateY = startTranslate.y + translationY;
        canvasContext.contentsTransform.setValue?.((prev) => ({
          ...prev,
          translateX: newTranslateX,
          translateY: newTranslateY,
        }));
      }
    })
    .onEnd(() => {
      isPanningRef.current = false;
    })
    , [canvasContext.contentsTransform]);
};

export const useMoveResizeGesture = (canvasContext: CanvasContext) => {
  const pinch = usePinchContentsGestureHandler(canvasContext);
  const pan = usePanContentsGestureHandler(canvasContext);
  return useMemo(() => Gesture.Simultaneous(
    pinch,
    pan
  ), [pinch, pan]);
};