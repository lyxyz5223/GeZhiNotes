import {
  CanvasMode,
  CustomCanvasProps,
  EmbeddedCanvasData,
  LinkBlockInfo,
} from '@/types/CanvasTypes';
import { calculateCanvasConnectionPoints } from '@/utils/CanvasUtils';
import React, { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
// 正确导入ConnectNode和CanvasConnections组件
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
  const linksInGlobal = props.globalData?.links?.value || [];
  const setLinksInGlobal = props.globalData?.links?.setValue;
  const color = props.color || '#1976d2';
  const canvases = props.globalData?.canvases?.value || [];

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
  const [selectedFromCanvasData, setSelectedFromCanvasData] =
    useState<EmbeddedCanvasData | null>(null);

  // 点击画布处理
  const handleCanvasClick = useCallback(
    (canvas: EmbeddedCanvasData) => {
      if (!selectedFromCanvasData) {
        // 第一次点击，选择源画布
        setSelectedFromCanvasData(canvas);
      } else if (selectedFromCanvasData.id !== canvas.id) {
        // 第二次点击，选择目标画布并创建连线
        const fromCanvas = selectedFromCanvasData;
        const toCanvas = canvas;
        if (fromCanvas && toCanvas) {
          // 计算连线的路径点（起点和终点）
          // 使用从圆边缘开始的连接点
          let startPoint, endPoint;
          try {
            [startPoint, endPoint] = calculateCanvasConnectionPoints(
              fromCanvas,
              toCanvas
            );
            // 使用字符串连接方式安全地输出日志
            console.log('计算连线点成功');
          } catch (error) {
            console.error('计算连线点失败:', error);
            // 如果计算失败，使用画布中心点作为默认值
            startPoint = {
              x: fromCanvas.x + fromCanvas.width / 2,
              y: fromCanvas.y + fromCanvas.height / 2,
            };
            endPoint = {
              x: toCanvas.x + toCanvas.width / 2,
              y: toCanvas.y + toCanvas.height / 2,
            };
          }

          const points = [startPoint, endPoint];
          // 使用字符串连接方式安全地输出日志
          console.log('创建连线: ' + fromCanvas.id + ' -> ' + toCanvas.id);

          // 创建新连线，使用更复杂的ID确保唯一性
          const newLink: LinkBlockInfo = {
            id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            fromId: selectedFromCanvasData.id,
            toId: canvas.id,
            points,
            color,
          };

          // 保存连接线
          if (setLinksInGlobal) {
            setLinksInGlobal((prevLinks) => [...prevLinks, newLink]);
          }
        }

        // 重置选择状态
        setSelectedFromCanvasData(null);
      } else {
        // 点击了同一个画布，取消选择
        setSelectedFromCanvasData(null);
      }
    },
    [selectedFromCanvasData, color, setLinksInGlobal]
  ); // 获取当前模式 - 尝试从props.mode或extraParams中获取mode
  const currentMode = props.mode?.value || extraParams?.mode || CanvasMode.Hand;
  // 只有在Link模式下才显示连接点和删除按钮
  const isLinkMode = currentMode === CanvasMode.Link; // 添加调试日志，帮助确认当前模式
  const prevCanvasesRef = React.useRef<{ [id: string]: EmbeddedCanvasData }>(
    {}
  );

  // 检查画布是否真实移动了
  const canvasesMovedSinceLastUpdate = useCallback(() => {
    let moved = false;

    // 比较每个画布的当前位置和上一次位置
    for (const canvas of canvases) {
      const prev = prevCanvasesRef.current[canvas.id];
      if (
        !prev ||
        prev.x !== canvas.x ||
        prev.y !== canvas.y ||
        prev.width !== canvas.width ||
        prev.height !== canvas.height
      ) {
        moved = true;
        break;
      }
    }

    return moved;
  }, [canvases]);

  // 保存当前画布位置
  const saveCurrentCanvasPositions = useCallback(() => {
    const positions: { [id: string]: EmbeddedCanvasData } = {};
    for (const canvas of canvases) {
      positions[canvas.id] = { ...canvas };
    }
    prevCanvasesRef.current = positions;
  }, [canvases]);
  // 直接更新连接线位置的函数 - 不做任何条件检查，强制更新所有连接线
  const forceUpdateLinkPoints = useCallback(() => {
    if (!setLinksInGlobal || linksInGlobal.length === 0) return;

    console.log('强制更新所有连接线位置');

    // 创建一个新的链接数组用于更新
    const updatedLinks = linksInGlobal.map((link) => {
      // 找到起点和终点画布
      const fromCanvas = canvases.find((c) => c.id === link.fromId);
      const toCanvas = canvases.find((c) => c.id === link.toId);

      // 如果找到了画布，则重新计算连接点
      if (fromCanvas && toCanvas) {
        try {
          // 重新计算连接点
          const [startPoint, endPoint] = calculateCanvasConnectionPoints(
            fromCanvas,
            toCanvas
          );
          // 返回更新后的链接对象
          return {
            ...link,
            points: [startPoint, endPoint],
          };
        } catch (error) {
          console.error('更新连接线失败:', error);
        }
      }
      // 如果计算失败或找不到画布，返回原始链接
      return link;
    });

    // 更新全局链接状态，不做比较直接更新
    setLinksInGlobal(updatedLinks);

    // 保存当前画布位置以便下次比较
    saveCurrentCanvasPositions();
  }, [canvases, linksInGlobal, setLinksInGlobal, saveCurrentCanvasPositions]);

  // 有条件地更新连接线位置的函数 - 仅在画布移动时更新
  const updateLinkPoints = useCallback(() => {
    if (!setLinksInGlobal || linksInGlobal.length === 0) return;

    // 检查画布是否真的移动了
    if (!canvasesMovedSinceLastUpdate()) {
      return;
    }

    console.log('画布位置变化，重新计算连接线位置');

    // 执行强制更新
    forceUpdateLinkPoints();
  }, [
    canvasesMovedSinceLastUpdate,
    forceUpdateLinkPoints,
    linksInGlobal.length,
    setLinksInGlobal,
  ]);
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

  // 监听画布数组变化，立即更新连接线
  React.useEffect(() => {
    // 当画布数组变化时，立即更新所有连接线
    if (linksInGlobal.length > 0) {
      // 使用requestAnimationFrame进行节流，防止过于频繁的更新
      const rafId = requestAnimationFrame(() => {
        updateLinkPoints();
      });

      // 清理函数
      return () => cancelAnimationFrame(rafId);
    }
  }, [canvases, updateLinkPoints, linksInGlobal.length]);

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

// 定义样式
const styles = StyleSheet.create({
  deleteButton: {
    position: 'relative',
    width: 10,
    height: 10,
    borderRadius: 15,
    backgroundColor: 'rgba(235, 238, 238, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(44, 221, 203, 0.8)',
    shadowColor: 'rgba(29, 10, 10, 0.5)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  deleteText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 20,
  },
  connectNode: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    borderWidth: 2,
    borderColor: '#1976d2',
  },
  selectedNode: {
    borderColor: '#ff6b6b',
    transform: [{ scale: 1.2 }],
  },
  nodeInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1976d2',
  },
  connectNodeOuterCircle: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(25, 118, 210, 0.2)',
    borderWidth: 1,
    borderColor: '#1976d2',
  },
});

export default CanvasLinkModule;
