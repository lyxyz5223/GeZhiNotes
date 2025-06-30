import {
  CustomCanvasProps,
  EmbeddedCanvasData,
  LinkBlockInfo,
} from '@/types/CanvasTypes';
import { calculateCanvasConnectionPoints } from '@/utils/CanvasUtils';
import React, { useCallback, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

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
    [selectedFromCanvasData]
  );
  return (
    <>
      {canvases.map((canvas, index) =>
        index === 0 ? null : (
          <TouchableOpacity
            key={canvas.id}
            style={[
              styles.connectNode,
              {
                left: canvas.x + canvas.width / 2 - 15,
                top: canvas.y + canvas.height / 2 - 15,
              },
              selectedFromCanvasData?.id === canvas.id && styles.selectedNode,
            ]}
            onPress={() => handleCanvasClick(canvas)}
          >
            <View style={styles.connectNodeOuterCircle} />
            <View
              style={[
                styles.nodeInner,
                {
                  backgroundColor:
                    selectedFromCanvasData?.id === canvas.id ? color : '#fff',
                },
              ]}
            />
          </TouchableOpacity>
        )
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
