import { CanvasMode, ModuleInsertOptionsType } from "@/types/CanvasTypes";
import { insertAudio, insertCanvas, insertImage, insertText, insertVideo, insertWebLink } from "@/utils/CanvasAddModuleContentUtils";
import { useEffect, useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";


// 策略表工厂
function getModuleInsertStrategies(globalData: any) {
  return {
    [CanvasMode.Image]: (x: number, y: number, options?: ModuleInsertOptionsType) => insertImage(globalData, x, y, options),
    [CanvasMode.Text]: (x: number, y: number, options?: ModuleInsertOptionsType) => insertText(globalData, x, y, options),
    [CanvasMode.Video]: (x: number, y: number, options?: ModuleInsertOptionsType) => insertVideo(globalData, x, y, options),
    [CanvasMode.WebLink]: (x: number, y: number, options?: ModuleInsertOptionsType) => insertWebLink(globalData, x, y, options),
    [CanvasMode.Audio]: (x: number, y: number, options?: ModuleInsertOptionsType) => insertAudio(globalData, x, y, options),
    [CanvasMode.Canvas]: (x: number, y: number, options?: ModuleInsertOptionsType) => insertCanvas(globalData, x, y, options),
    // 其它模式可扩展...
  };
}

/**
 * 用于 CustomCanvas，处理画布点击/缩放等手势，根据当前 mode 添加新模块内容（RNGH 体系专用）
 * @param canvasContext 画布上下文，需包含 mode、globalData、contentsTransform 等
 * @returns gesture handler props，可直接 {...useAddModuleGestureHandler(canvasContext)} 用于 TapGestureHandler
 */
const useAddModuleGestureHandler = (canvasContext: any) => {

  return useMemo(() => {
    const globalData = canvasContext.globalData; // 全局数据
    if (!globalData) {
      console.warn('useAddModuleGestureHandler: globalData is undefined');
      return Gesture.Tap().runOnJS(true); // 返回一个空的手势处理器
    }
    // 获取插入模块的策略函数
    const moduleInsertStrategies = getModuleInsertStrategies(globalData);
    // const { mode, globalData, id, fontSize, width, height } = canvasContext;
    const id = canvasContext.id; // 画布 ID
    const parentId = canvasContext.parentId; // 父画布 ID
    const width = canvasContext.width; // 画布宽度
    const height = canvasContext.height; // 画布高度
    const mode = canvasContext.mode; // 当前模式
    const fontSize = canvasContext.fontSize; // 字体大小
    return Gesture.Tap()
      .numberOfTaps(1)
      .runOnJS(true)
      .onEnd((event: any, success: boolean) => {
        if (event.numberOfPointers > 1) return; // 仅单指生效
        const x = event.absoluteX as number;
        const y = event.absoluteY as number;
        console.log('当前模式:', mode?.value, '插入位置:', x, y);
        const insertFn = moduleInsertStrategies[mode?.value as keyof typeof moduleInsertStrategies];
        if (insertFn) {
          try {
            // 计算最大宽高（不超过画布宽高的2/3）
            let options: any = {};
            if (width && height) {
              options.width = Math.floor(width * 2 / 3);
              options.height = Math.floor(height * 2 / 3);
            }
            if (fontSize) {
              options.fontSize = fontSize;
            }
            if (id) {
              options.id = id; // 传递画布ID用于 Canvas 模块
            }
            if (parentId) {
              options.parentId = parentId; // 传递父ID用于 Canvas 模块
            }
            insertFn(x, y, options);
          } catch (e) {
            console.error('插入模块失败', e);
          }
        }
      })
  }, [canvasContext.id, canvasContext.parentId, canvasContext.width, canvasContext.height, canvasContext.fontSize, canvasContext.mode, canvasContext.globalData]); // 依赖项确保更新;
};


export default useAddModuleGestureHandler;