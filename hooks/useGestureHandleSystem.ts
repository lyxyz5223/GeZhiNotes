import { CanvasContext } from "@/types/CanvasTypes";
import useAddModuleGestureHandler from "./useAddModuleGestureHandler";
import { Gesture } from "react-native-gesture-handler";
import { usePinchContentsGestureHandler } from "./usePinchGestureHandler";
import { GestureRef } from "react-native-gesture-handler/lib/typescript/handlers/gestures/gesture";
import { useMemo } from "react";

const useGestureHandleSystem = (canvasContext: CanvasContext, childrenGestureRefs: GestureRef[]) => {  // 处理手势的逻辑
  const handleAddModule = useAddModuleGestureHandler(canvasContext).requireExternalGestureToFail(...(childrenGestureRefs?.filter(Boolean) ?? []));
  return handleAddModule;
};

export default useGestureHandleSystem;