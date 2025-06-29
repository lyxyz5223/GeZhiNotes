import { CustomCanvasProps, LinkBlockInfo } from "@/types/CanvasTypes";
import { createPathFromPoints } from "@/utils/CanvasUtils";
import { Path, Skia } from "@shopify/react-native-skia";
import React from "react";
import { View } from "react-native";

/**
 * 节点连接模块（连线、锚点等）
 * 渲染 linksInGlobal 结构：[{ id, fromId, toId, points, color }]
 */
const CanvasLinkModule: React.FC<{ props: CustomCanvasProps; extraParams: any }> = ({ props, extraParams }) => {
  // 统一使用 globalData
  const linksInGlobal: LinkBlockInfo[] = props.globalData?.links?.value || [];

  return (
    <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
      {linksInGlobal.map((link: LinkBlockInfo, idx: number) => {
        const path = createPathFromPoints(link.points || []);
        if (!path) return null;
        return (
          <Path
            key={link.id || `link-${idx}`}
            path={path}
            color={link.color || '#1976d2'}
            style="stroke"
            strokeWidth={2}
            strokeJoin="round"
            strokeCap="round"
          />
        );
      })}
    </View>
  );
};

export default CanvasLinkModule;
