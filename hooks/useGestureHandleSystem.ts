import { CanvasContext, CanvasType } from "@/types/CanvasTypes";
import useAddModuleGestureHandler from "./useAddModuleGestureHandler";
import { Gesture } from "react-native-gesture-handler";
import { usePinchContentsGestureHandler } from "./usePinchGestureHandler";
import { GestureRef } from "react-native-gesture-handler/lib/typescript/handlers/gestures/gesture";
import { useMemo } from "react";

const useGestureHandleSystem = (canvasContext: CanvasContext, childrenGestures: any[]) => {
  // 处理缩放手势
  const pinchContentsGestureHandler = usePinchContentsGestureHandler(canvasContext);
  const doubleTapGesture = useMemo(() => {
    const canvasType = canvasContext.canvasType;
    const setIsFullscreen = canvasContext.fullscreen?.setValue || (() => {});
    return Gesture.Simultaneous(Gesture.Tap()
      .numberOfTaps(2)
      .runOnJS(true)
      .onEnd((event: any) => {
        console.log(canvasContext.fullscreen);
        setIsFullscreen((prev) => {
          if (canvasType === CanvasType.Child && !prev) {
            return true; // 进入全屏
          } else if (canvasType === CanvasType.Child && prev) {
            return false; // 退出全屏
          }
          return prev; // 主画布不处理
        });
      }), Gesture.Tap());
  }, [canvasContext.canvasType, canvasContext.fullscreen?.setValue]);
  const handleAddModule = useAddModuleGestureHandler(canvasContext).requireExternalGestureToFail();
  // console.log('handleAddModule', handleAddModule);
  // 用 useMemo 缓存 Gesture 对象
  return useMemo(() => {
    if (canvasContext.fullscreen?.value === true) {
      if (canvasContext.canvasType === CanvasType.Child) {
        return Gesture.Simultaneous(pinchContentsGestureHandler);
      } 
      return Gesture.Simultaneous(pinchContentsGestureHandler, handleAddModule);
    }
    else {
      return Gesture.Simultaneous(doubleTapGesture);
    }
  }, [handleAddModule, pinchContentsGestureHandler, doubleTapGesture, canvasContext.fullscreen, canvasContext.canvasType]);
};

export default useGestureHandleSystem;