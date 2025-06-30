import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia';
import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { EmbeddedCanvasData, LinkBlockInfo } from '@/types/CanvasTypes';
import { calculateCanvasConnectionPoints } from '@/utils/CanvasUtils';

interface ConnectNodeProps {
  canvases: EmbeddedCanvasData[];
  onConnect: (link: LinkBlockInfo) => void;
  color?: string;
}

interface CanvasConnectionsProps {
  links: LinkBlockInfo[];
  onDelete?: (linkId: string) => void;
}

/**
 * 画布连接线组件 - 渲染在主画布之上的连接线
 */
const CanvasConnections: React.FC<CanvasConnectionsProps> = ({
  links,
  onDelete,
}) => {
  // 跟踪选中准备删除的连接线ID
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);

  // 获取连线中点坐标 - 计算真正的几何中点
  const getMidPoint = useCallback((points: { x: number; y: number }[]) => {
    if (!points || points.length < 2) return { x: 0, y: 0 };

    // 对于两点连接，直接计算中点
    if (points.length === 2) {
      return {
        x: (points[0].x + points[1].x) / 2,
        y: (points[0].y + points[1].y) / 2,
      };
    }

    // 对于多点连接，使用更精确的方法计算几何中点
    // 计算线段总长度
    let totalLength = 0;
    const segments = [];

    for (let i = 0; i < points.length - 1; i++) {
      const dx = points[i + 1].x - points[i].x;
      const dy = points[i + 1].y - points[i].y;
      const length = Math.sqrt(dx * dx + dy * dy);
      totalLength += length;
      segments.push({ start: i, length });
    }

    // 找到总长度的一半对应的点
    const halfLength = totalLength / 2;
    let accumulatedLength = 0;

    for (const segment of segments) {
      if (accumulatedLength + segment.length >= halfLength) {
        // 找到了包含中点的线段
        const i = segment.start;
        const ratio = (halfLength - accumulatedLength) / segment.length;
        return {
          x: points[i].x + ratio * (points[i + 1].x - points[i].x),
          y: points[i].y + ratio * (points[i + 1].y - points[i].y),
        };
      }
      accumulatedLength += segment.length;
    }

    // 如果上面的逻辑出现问题，回退到端点平均值
    return {
      x: (points[0].x + points[points.length - 1].x) / 2,
      y: (points[0].y + points[points.length - 1].y) / 2,
    };
  }, []);
  // 处理点击连接线
  const handleLinePress = useCallback(
    (linkId: string) => {
      console.log('连接线被点击:', linkId);
      setSelectedLinkId(linkId);

      // 显示确认删除对话框
      if (onDelete) {
        // 添加延迟以确保UI已经就绪
        setTimeout(() => {
          Alert.alert(
            '删除连接线',
            '确定要删除这条连接线吗？',
            [
              {
                text: '取消',
                style: 'cancel',
                onPress: () => setSelectedLinkId(null),
              },
              {
                text: '删除',
                style: 'destructive',
                onPress: () => {
                  console.log('确认删除连接线:', linkId);
                  // 直接调用删除函数
                  onDelete(linkId);
                  setSelectedLinkId(null);
                },
              },
            ],
            { cancelable: true }
          );
        }, 100);
      } else {
        console.log('没有提供onDelete回调，无法删除连接线');
      }
    },
    [onDelete]
  );

  // 使用安全的字符串化方式进行日志输出
  console.log('CanvasConnections渲染, 连接线数量: ' + links.length);
  if (links.length === 0) {
    return null;
  }
  // 完全重构结构，使删除按钮成为顶层元素
  return (
    <>
      {/* 第一层：连接线层（不接受任何点击事件） */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          pointerEvents: 'none', // 不拦截任何事件
        }}
      >
        <Canvas style={{ width: '100%', height: '100%' }}>
          <Group>
            {links.map((link, idx) => {
              if (!link.points || link.points.length < 2) return null;

              // 创建路径
              let path;
              try {
                path = Skia.Path.Make();
                path.moveTo(link.points[0].x, link.points[0].y);
                for (let i = 1; i < link.points.length; i++) {
                  path.lineTo(link.points[i].x, link.points[i].y);
                }
              } catch (error) {
                console.error('创建Skia路径出错:', error);
                return null;
              }

              if (!path) return null;

              // 使用link中的color属性作为连接线颜色
              const lineColor = link.color || '#000000';

              return (
                <Path
                  key={`path-${link.id}`}
                  path={path}
                  color={lineColor}
                  style="stroke"
                  strokeWidth={3}
                  strokeJoin="round"
                  strokeCap="round"
                />
              );
            })}
          </Group>
        </Canvas>
      </View>

      {/* 第二层：删除按钮层（完全分离，直接放置在顶层） */}
      {onDelete &&
        links.map((link) => {
          if (!link.points || link.points.length < 2) return null;

          // 计算连线中点
          const midPoint = getMidPoint(link.points);

          return (
            <TouchableOpacity
              key={`delete-btn-${link.id}`}
              style={{
                position: 'absolute',
                left: midPoint.x - 15, // 增大按钮尺寸
                top: midPoint.y - 15,
                width: 30, // 更大的按钮
                height: 30,
                borderRadius: 15,
                backgroundColor: '#ff0000', // 鲜明的红色
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: 'white',
                shadowColor: 'black',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.5,
                shadowRadius: 3,
                elevation: 8, // 更高的视觉层级
                zIndex: 500, // 确保在最上层
              }}
              activeOpacity={0.5}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }} // 更大的热区
              onPress={() => {
                console.log('删除按钮被点击 - linkId:', link.id);
                handleLinePress(link.id);
              }}
            >
              <Text
                style={{
                  color: 'white',
                  fontSize: 20,
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}
              >
                ×
              </Text>
            </TouchableOpacity>
          );
        })}
    </>
  );
};

const ConnectNode: React.FC<ConnectNodeProps> = ({
  canvases,
  onConnect,
  color = '#1976d2',
}) => {
  const [selectedFromId, setSelectedFromId] = useState<string | null>(null);

  // 点击画布处理
  const handleCanvasClick = (canvas: EmbeddedCanvasData) => {
    if (!selectedFromId) {
      // 第一次点击，选择源画布
      setSelectedFromId(canvas.id);
    } else if (selectedFromId !== canvas.id) {      // 第二次点击，选择目标画布并创建连线
      const fromCanvas = canvases.find((c) => c.id === selectedFromId);
      const toCanvas = canvas;
        if (fromCanvas && toCanvas) {
        // 计算连线的路径点（起点和终点）
        // 使用从圆边缘开始的连接点
        let startPoint, endPoint;
        try {
          [startPoint, endPoint] = calculateCanvasConnectionPoints(fromCanvas, toCanvas);          // 使用字符串连接方式安全地输出日志
          console.log('计算连线点成功');
        } catch (error) {
          console.error('计算连线点失败:', error);
          // 如果计算失败，使用画布中心点作为默认值
          startPoint = { 
            x: fromCanvas.x + fromCanvas.width/2, 
            y: fromCanvas.y + fromCanvas.height/2 
          };
          endPoint = { 
            x: toCanvas.x + toCanvas.width/2, 
            y: toCanvas.y + toCanvas.height/2 
          };
        }
        
        const points = [startPoint, endPoint];
          // 使用字符串连接方式安全地输出日志
        console.log(
          '创建连线: ' + 
          fromCanvas.id + 
          ' -> ' + 
          toCanvas.id
        );

        // 创建新连线，使用更复杂的ID确保唯一性
        const newLink: LinkBlockInfo = {
          id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          fromId: selectedFromId,
          toId: canvas.id,
          points,
          color,
        };

        // 回调通知父组件
        onConnect(newLink);
      }

      // 重置选择状态
      setSelectedFromId(null);
    } else {
      // 点击了同一个画布，取消选择
      setSelectedFromId(null);
      Alert.alert('提示', '已取消选择');
    }
  };
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
              selectedFromId === canvas.id && styles.selectedNode,
            ]}
            onPress={() => handleCanvasClick(canvas)}
          >
            <View style={styles.connectNodeOuterCircle} />
            <View
              style={[
                styles.nodeInner,
                {
                  backgroundColor:
                    selectedFromId === canvas.id ? color : '#fff',
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

export default {ConnectNode, CanvasConnections};
