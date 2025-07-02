import {
  CanvasMode,
  CustomCanvasProps,
} from '@/types/CanvasTypes';
import { calculateCanvasConnectionPoints } from '@/utils/CanvasUtils';
import isEqual from 'lodash.isequal';
import React, { useCallback, useMemo } from 'react';
import CanvasLinkComponents from './CanvasLinkItem';

/**
 * 节点连接模块（连线、锚点等）
 * 渲染 linksInGlobal 结构：[{ id, fromId, toId, points, color }]
 */
const CanvasLinkModule: React.FC<{
  props: CustomCanvasProps;
  extraParams: any;
}> = ({ props, extraParams }) => {
  // 统一使用 globalData
  const linksInGlobal = useMemo(() => props.globalData?.links?.value || [], [props.globalData]);
  const setLinksInGlobal = props.globalData?.links?.setValue;
  const color = props.color || '#1976d2';
  const canvases = useMemo(() => props.globalData?.canvases?.value || [], [props.globalData]);

  // 处理删除连接线
  const handleDeleteLink = useCallback(
    (linkId: string) => {
      if (setLinksInGlobal) {
        setLinksInGlobal((prevLinks) =>
          prevLinks.filter((link) => link.id !== linkId)
        );
        console.log('删除连接线:', linkId);
      }
    },
    [setLinksInGlobal]
  );

  // 获取当前模式 - 尝试从props.mode或extraParams中获取mode
  const currentMode = props.mode?.value || extraParams?.mode || CanvasMode.Hand;
  // 只有在Link模式下才显示连接点和删除按钮
  const isLinkMode = currentMode === CanvasMode.Link; // 添加调试日志，帮助确认当前模式

  // 直接更新连接线位置的函数 - 仅在 points 变化时 setLinksInGlobal
  const forceUpdateLinkPoints = useCallback(() => {
    if (!setLinksInGlobal || linksInGlobal.length === 0) return;

    // 创建一个新的链接数组用于更新
    const updatedLinks = linksInGlobal.map((link) => {
      const fromCanvas = canvases.find((c) => c.id === link.fromId);
      const toCanvas = canvases.find((c) => c.id === link.toId);
      if (fromCanvas && toCanvas) {
        try {
          const [startPoint, endPoint] = calculateCanvasConnectionPoints(
            fromCanvas,
            toCanvas
          );
          // points 为空时不更新
          if (!startPoint || !endPoint) return link;
          return {
            ...link,
            points: [startPoint, endPoint],
          };
        } catch (error) {
          console.error('更新连接线失败:', error);
        }
      }
      return link;
    });

    // 只有 points 真的变化时才 setLinksInGlobal
    const pointsChanged = linksInGlobal.some((link, idx) => {
      return !isEqual(link.points, updatedLinks[idx].points);
    });
    if (pointsChanged) {
      setLinksInGlobal(updatedLinks);
    }
  }, [canvases, linksInGlobal, setLinksInGlobal]);

  // 使用间隔计时器强制定期更新连接线位置，解决可能的同步问题
  React.useEffect(() => {
    // 初始化时立即更新一次
    if (linksInGlobal.length > 0) {
      // 立即执行一次强制更新
      forceUpdateLinkPoints();

      // 设置定期更新间隔 (每秒更新一次，确保连接线始终正确)
      const intervalId = setInterval(() => {
        forceUpdateLinkPoints();
      }, 1000);

      // 清理函数
      return () => clearInterval(intervalId);
    }
  }, [forceUpdateLinkPoints, linksInGlobal.length]);

  // 监听画布数组变化，立即更新连接线（无定时器/raf）
  React.useEffect(() => {
    if (linksInGlobal.length > 0) {
      forceUpdateLinkPoints();
    }
    // 只依赖 canvases/linksInGlobal
  }, [canvases, linksInGlobal, forceUpdateLinkPoints]);

  // 获取画布内容缩放参数
  const contentsTransform = extraParams?.contentsTransform?.value || { scale: 1, translateX: 0, translateY: 0 };

  return (
    <>
      {/* 只在Link模式下渲染连接点 */}
      {isLinkMode && (
        <CanvasLinkComponents.ConnectNode
          canvases={canvases}
          color={color}
          mode={currentMode}
          onConnect={(link) => {
            if (setLinksInGlobal) {
              setLinksInGlobal((prevLinks) => [...prevLinks, link]);
            }
          }}
          contentsTransform={contentsTransform}
        />
      )}
      {/* 只在Link模式下渲染连接线和删除按钮 */}
      {linksInGlobal.length > 0 && (
        <CanvasLinkComponents.CanvasConnections
          links={linksInGlobal}
          onDelete={handleDeleteLink}
          mode={currentMode}
          contentsTransform={contentsTransform}
        />
      )}
    </>
  );
};

export default CanvasLinkModule;
