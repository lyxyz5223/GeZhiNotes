import { CanvasMode } from "@/types/CanvasTypes";
import { insertAudio, insertImage, insertText, insertVideo, insertWebLink } from "@/utils/CanvasAddModuleContentUtils";
import { Gesture } from "react-native-gesture-handler";



// 策略表工厂（移到组件外部，避免 useMemo 依赖警告）
function getModuleInsertStrategies(globalData: any) {
  return {
    [CanvasMode.Image]: (x: number, y: number, options?: { width?: number; height?: number }) => insertImage(globalData, x, y, options),
    [CanvasMode.Text]: (x: number, y: number, options?: { fontSize?: number }) => insertText(globalData, x, y, options),
    [CanvasMode.Video]: (x: number, y: number, options?: { width?: number; height?: number }) => insertVideo(globalData, x, y, options),
    [CanvasMode.WebLink]: (x: number, y: number, options?: { title?: string }) => insertWebLink(globalData, x, y, options),
    [CanvasMode.Audio]: (x: number, y: number, options?: { duration?: number }) => insertAudio(globalData, x, y, options),
    // 其它模式可扩展...
  };
}

/**
 * 用于 CustomCanvas，处理画布点击/缩放等手势，根据当前 mode 添加新模块内容（RNGH 体系专用）
 * @param canvasContext 画布上下文，需包含 mode、globalData、contentsTransform 等
 * @returns gesture handler props，可直接 {...useAddModuleGestureHandler(canvasContext)} 用于 TapGestureHandler
 */
export default function useAddModuleGestureHandler(canvasContext: any) {
  const { mode, globalData } = canvasContext;


  const moduleInsertStrategies = getModuleInsertStrategies(globalData);

  // 统一处理 TapGestureHandler 的 onEnded 事件
  const handleTap = async (event: any, success: boolean) => {
    if (event.numberOfPointers > 1) return; // 仅单指生效
    if (!globalData) return;
    const x = event.x as number;
    const y = event.y as number;
    const insertFn = moduleInsertStrategies[mode as keyof typeof moduleInsertStrategies];
    if (insertFn) {
      try {
        // 计算最大宽高（不超过画布宽高的2/3）
        let options: any = {};
        if (canvasContext.width && canvasContext.height) {
          options.width = Math.floor(canvasContext.width * 2 / 3);
          options.height = Math.floor(canvasContext.height * 2 / 3);
        }
        await insertFn(x, y, options);
      } catch (e) {
        console.error('插入模块失败', e);
      }
    }
  };

  // 返回 RNGH TapGestureHandler 的 props
  return Gesture.Tap()
    .runOnJS(true)
    .onEnd(handleTap);
}
