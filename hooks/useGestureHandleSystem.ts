import { CanvasContext } from "@/types/CanvasGestureTypes";
import useAddModuleGestureHandler from "./useAddModuleGestureHandler";
import { Gesture } from "react-native-gesture-handler";
import usePinchGestureHandler from "./usePinchGestureHandler";

const useGestureHandleSystem = (canvasContext: CanvasContext) => {
  // 处理手势的逻辑
  const handleAddModule = useAddModuleGestureHandler(canvasContext);
  const pinchGestureHandler = usePinchGestureHandler(canvasContext);
  return Gesture.Simultaneous(handleAddModule, pinchGestureHandler);
};

export default useGestureHandleSystem;