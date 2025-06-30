import { DrawPathInfo } from "@/types/CanvasTypes";
import { Path } from "@shopify/react-native-skia";
import React from "react";

/**
 * 单个笔画渲染组件（Skia Path）
 * @param pathInfo 笔画数据
 * @param transform 画布变换（如有，实际 Skia Path 不支持 transform，需在 Group 层处理）
 */
const CanvasDrawItem: React.FC<{ pathInfo: DrawPathInfo; transform?: any[] }> = ({ pathInfo }) => {
  if (!pathInfo || !pathInfo.path) return null;
  return (
    <Path
      path={pathInfo.path}
      color={pathInfo.color}
      style="stroke"
      strokeWidth={pathInfo.size}
      strokeJoin="round"
      strokeCap="round"
      {...(pathInfo.isEraser ? { blendMode: 'clear' } : {})}
    />
  );
};

export default CanvasDrawItem;
