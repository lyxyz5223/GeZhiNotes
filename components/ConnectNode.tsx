import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Defs, Line, Marker, Path } from 'react-native-svg';
import { CanvasMode } from './CanvasToolbar';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import { Button } from '@react-navigation/elements';
import { isTransparent } from '@excalidraw/excalidraw/utils';

// 连接线组件
interface ConnectionLineProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color?: string;
  strokeWidth?: number;
  showArrow?: boolean;
  onDelete?: () => void;
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({
  fromX,
  fromY,
  toX,
  toY,
  color = '#007aff',
  strokeWidth = 2,
  showArrow = true,
  onDelete,
}) => {
  // 计算SVG容器的位置和大小
  const minX = Math.min(fromX, toX) - 20;
  const minY = Math.min(fromY, toY) - 20;
  const maxX = Math.max(fromX, toX) + 20;
  const maxY = Math.max(fromY, toY) + 20;

  const width = maxX - minX;
  const height = maxY - minY;

  // 转换为相对坐标
  const relativeFromX = fromX - minX;
  const relativeFromY = fromY - minY;
  const relativeToX = toX - minX;
  const relativeToY = toY - minY;

  const handleLongPress = () => {
    if (onDelete) {
      Alert.alert('删除画板连线', '不要抛下我好不好？', [
        { text: '好', style: 'cancel' },
        { text: '不好', style: 'destructive', onPress: onDelete },
      ]);
    }
  };

  return (
    <View
      style={{
        position: 'absolute',
        left: minX,
        top: minY,
        width: width,
        height: height,
        pointerEvents: 'box-none',
      }}
    >
      <TouchableOpacity
        style={{ flex: 1 }}
        onLongPress={handleLongPress}
        activeOpacity={0.8}
        delayLongPress={500}
      >
        <Svg width={width} height={height}>
          <Defs>
            <Marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <Path d="M0,0 L0,7 L10,3.5 z" fill={color} />
            </Marker>
          </Defs>

          {/* 主连接线 */}
          <Line
            x1={relativeFromX}
            y1={relativeFromY}
            x2={relativeToX}
            y2={relativeToY}
            stroke={color}
            strokeWidth={strokeWidth}
            markerEnd={showArrow ? 'url(#arrowhead)' : undefined}
          />

          {/* 可点击的透明线条区域（增加点击范围） */}
          <Line
            x1={relativeFromX}
            y1={relativeFromY}
            x2={relativeToX}
            y2={relativeToY}
            stroke={color}
            strokeWidth={Math.max(1, strokeWidth)}
          />
        </Svg>
      </TouchableOpacity>
    </View>
  );
};

// 连接节点类型定义
export interface Connection {
  from: string;
  to: string;
  id: string;
}

export interface CanvasData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// 连接节点管理器接口
export interface ConnectNodeManagerProps {
  mode: CanvasMode;
  color: string;
  canvases: CanvasData[];
  mainCanvas?: CanvasData;
  children?: React.ReactNode;
}

// 连接节点管理器 Hook
export const useConnectNode = () => {
  const [connectNodes, setConnectNodes] = useState<string[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);

  // 计算两个矩形之间最短连接点的函数
  const getShortestConnectionPoints = useCallback(
    (fromCanvas: CanvasData, toCanvas: CanvasData) => {
      const fromCenterX = fromCanvas.x + fromCanvas.width / 2;
      const fromCenterY = fromCanvas.y + fromCanvas.height / 2;
      const toCenterX = toCanvas.x + toCanvas.width / 2;
      const toCenterY = toCanvas.y + toCanvas.height / 2;

      // 计算两个画布边框的四个中点
      const fromPoints = {
        top: { x: fromCenterX, y: fromCanvas.y },
        bottom: { x: fromCenterX, y: fromCanvas.y + fromCanvas.height },
        left: { x: fromCanvas.x, y: fromCenterY },
        right: { x: fromCanvas.x + fromCanvas.width, y: fromCenterY },
      };

      const toPoints = {
        top: { x: toCenterX, y: toCanvas.y },
        bottom: { x: toCenterX, y: toCanvas.y + toCanvas.height },
        left: { x: toCanvas.x, y: toCenterY },
        right: { x: toCanvas.x + toCanvas.width, y: toCenterY },
      };

      // 找到最短距离的连接点组合
      let minDistance = Infinity;
      let bestFromPoint = fromPoints.top;
      let bestToPoint = toPoints.top;

      Object.keys(fromPoints).forEach((fromKey) => {
        Object.keys(toPoints).forEach((toKey) => {
          const fromPoint = fromPoints[fromKey as keyof typeof fromPoints];
          const toPoint = toPoints[toKey as keyof typeof toPoints];

          const distance = Math.sqrt(
            Math.pow(toPoint.x - fromPoint.x, 2) +
              Math.pow(toPoint.y - fromPoint.y, 2)
          );

          if (distance < minDistance) {
            minDistance = distance;
            bestFromPoint = fromPoint;
            bestToPoint = toPoint;
          }
        });
      });

      return {
        from: bestFromPoint,
        to: bestToPoint,
        distance: minDistance,
      };
    },
    []
  );

  // 智能连接点计算（考虑画布相对位置）
  const getOptimizedConnectionPoints = useCallback(
    (fromCanvas: CanvasData, toCanvas: CanvasData) => {
      const fromCenterX = fromCanvas.x + fromCanvas.width / 2;
      const fromCenterY = fromCanvas.y + fromCanvas.height / 2;
      const toCenterX = toCanvas.x + toCanvas.width / 2;
      const toCenterY = toCanvas.y + toCanvas.height / 2;

      // 判断相对位置关系
      const deltaX = toCenterX - fromCenterX;
      const deltaY = toCenterY - fromCenterY;

      let fromPoint, toPoint;

      // 根据相对位置选择合适的连接点
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 水平距离更大，使用左右连接点
        if (deltaX > 0) {
          // to在from的右边
          fromPoint = {
            x: fromCanvas.x + fromCanvas.width,
            y: fromCenterY,
          };
          toPoint = {
            x: toCanvas.x,
            y: toCenterY,
          };
        } else {
          // to在from的左边
          fromPoint = {
            x: fromCanvas.x,
            y: fromCenterY,
          };
          toPoint = {
            x: toCanvas.x + toCanvas.width,
            y: toCenterY,
          };
        }
      } else {
        // 垂直距离更大，使用上下连接点
        if (deltaY > 0) {
          // to在from的下方
          fromPoint = {
            x: fromCenterX,
            y: fromCanvas.y + fromCanvas.height,
          };
          toPoint = {
            x: toCenterX,
            y: toCanvas.y,
          };
        } else {
          // to在from的上方
          fromPoint = {
            x: fromCenterX,
            y: fromCanvas.y,
          };
          toPoint = {
            x: toCenterX,
            y: toCanvas.y + toCanvas.height,
          };
        }
      }

      return { from: fromPoint, to: toPoint };
    },
    []
  );

  // 处理画布选择用于连接
  const handleCanvasSelect = useCallback(
    (canvasId: string, mode: CanvasMode) => {
      console.log('画布被选择用于连接:', canvasId);

      if (mode !== CanvasMode.Connector) return;

      setConnectNodes((prevNodes) => {
        const newNodes = [...prevNodes];

        if (newNodes.includes(canvasId)) {
          // 如果已经选中，则取消选择
          return newNodes.filter((id) => id !== canvasId);
        } else if (newNodes.length < 2) {
          // 如果少于2个节点，添加到选择列表
          newNodes.push(canvasId);

          // 如果选择了2个节点，创建连接
          if (newNodes.length === 2) {
            const newConnection = {
              from: newNodes[0],
              to: newNodes[1],
              id: `connection-${Date.now()}`,
            };
            setConnections((prev) => [...prev, newConnection]);
            console.log('创建连接:', newConnection);

            // 创建连接后清空选择
            return [];
          }
          return newNodes;
        }
        return newNodes;
      });
    },
    []
  );

  // 删除连接
  const handleDeleteConnection = useCallback((connectionId: string) => {
    setConnections((prev) => prev.filter((conn) => conn.id !== connectionId));
  }, []);

  // 清除所有连接节点选择
  const clearConnectNodes = useCallback(() => {
    setConnectNodes([]);
  }, []);

  // 清除所有连接
  const clearAllConnections = useCallback(() => {
    setConnections([]);
    setConnectNodes([]);
  }, []);

  return {
    connectNodes,
    connections,
    setConnectNodes,
    setConnections,
    handleCanvasSelect,
    handleDeleteConnection,
    clearConnectNodes,
    clearAllConnections,
    getShortestConnectionPoints,
    getOptimizedConnectionPoints,
  };
};

// 连接节点渲染器组件
export const ConnectNodeRenderer: React.FC<{
  connections: Connection[];
  canvases: CanvasData[];
  mainCanvas?: CanvasData;
  color: string;
  onDeleteConnection: (id: string) => void;
  connectionPointMode?: 'shortest' | 'optimized';
}> = ({
  connections,
  canvases,
  mainCanvas,
  color,
  onDeleteConnection,
  connectionPointMode = 'optimized',
}) => {
  const { getShortestConnectionPoints, getOptimizedConnectionPoints } =
    useConnectNode();

  const getConnectionPoints =
    connectionPointMode === 'shortest'
      ? getShortestConnectionPoints
      : getOptimizedConnectionPoints;

  return (
    <>
      {connections.map((connection) => {
        const fromCanvas =
          connection.from === 'main-canvas'
            ? mainCanvas
            : canvases.find((c) => c.id === connection.from);

        const toCanvas =
          connection.to === 'main-canvas'
            ? mainCanvas
            : canvases.find((c) => c.id === connection.to);

        if (!fromCanvas || !toCanvas) return null;

        const connectionPoints = getConnectionPoints(fromCanvas, toCanvas);

        // 计算连接线的中点，用于添加渐变或动画效果
        const midX = (connectionPoints.from.x + connectionPoints.to.x) / 2;
        const midY = (connectionPoints.from.y + connectionPoints.to.y) / 2;

        return (
          <ConnectionLine
            key={connection.id}
            fromX={connectionPoints.from.x}
            fromY={connectionPoints.from.y}
            toX={connectionPoints.to.x}
            toY={connectionPoints.to.y}
            color={getHideConnectionLine() ? "transparent" : `${color}CC`} // 添加透明度
            strokeWidth={1} // 增加线条宽度
            showArrow={true} // 显示箭头
            onDelete={() => onDeleteConnection(connection.id)}
          />
        );
      })}
    </>
  );
};

// 连接模式提示组件
export const ConnectionHint: React.FC<{
  mode: CanvasMode;
  connectNodes: string[];
}> = ({ mode, connectNodes }) => {
  if (mode !== CanvasMode.Connector) return null;

  return (
    <View style={styles.connectionHint}>
      <Text style={styles.connectionHintText}>
        {connectNodes.length === 0
          ? 'oi,点击第一个要连接画布'
          : connectNodes.length === 1
          ? 'oi,点击第二个要连接画布'
          : '连接已创建'}
      </Text>
    </View>
  );
};
/**
 * 隐藏连接线选择，仅在连接模式显示
 * 注意：hideConnectionLine 需要提升到父组件或用 context 管理，否则组件外无法访问和控制
 */

let globalHideConnectionLine = false;
let listeners: Array<(val: boolean) => void> = [];

export const getHideConnectionLine = () => globalHideConnectionLine;
export const subscribeHideConnectionLine = (cb: (val: boolean) => void) => {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
};

export const setHideConnectionLine = (val: boolean) => {
  globalHideConnectionLine = val;
  listeners.forEach((cb) => cb(val));
};

export const HideConnectionLine: React.FC<{ mode: CanvasMode }> = ({ mode }) => {
  const [hide, setHide] = useState(globalHideConnectionLine);

  React.useEffect(() => {
    const unsub = subscribeHideConnectionLine(setHide);
    return unsub;
  }, []);

  if (mode !== CanvasMode.Connector) return null;
  return (
    <TouchableOpacity
      style={[
        styles.HideConnectionLine,
        { zIndex: 9999, elevation: 20 }, // 提高层级，确保可点击
      ]}
      activeOpacity={0.7}
      onPress={() => setHideConnectionLine(!hide)}
    >
      <Text>
        {`是否隐藏连接线,目前为${hide ? '是' : '否'}`}
      </Text>
    </TouchableOpacity>
  );
};

// 画布选择包装器组件
export const ConnectableCanvas: React.FC<{
  id: string;
  mode: CanvasMode;
  isSelected: boolean;
  onCanvasSelect?: (id: string) => void;
  children: React.ReactNode;
}> = ({ id, mode, isSelected, onCanvasSelect, children }) => {
  const handleCanvasPress = useCallback(() => {
    console.log('连接模式点击，画布ID:', id);
    if (mode === CanvasMode.Connector && onCanvasSelect) {
      onCanvasSelect(id);
    }
  }, [mode, onCanvasSelect, id]);

  return (
    <View style={{ position: 'relative' }}>
      {children}
      {/* 连接模式下的点击层 - 调整透明度 */}
      {mode === CanvasMode.Connector && (
        <TouchableOpacity
          style={[
            styles.connectableOverlay,
            {
              // 修改透明度：选中时橙色半透明，未选中时完全透明或轻微透明
              backgroundColor: isSelected
                ? 'rgba(255, 102, 0, 0。4)' // 橙色，40% 透明度
                : 'rgba(0, 122, 255, 0.05)', // 蓝色，5% 透明度（几乎不可见）
              borderColor: isSelected ? '#FF6600' : 'rgba(0, 122, 255, 0.3)',
              borderWidth: isSelected ? 3 : 1, // 选中时边框更粗
              borderStyle: isSelected ? 'solid' : 'dashed', // 选中时实线，未选中时虚线
            },
          ]}
          onPress={handleCanvasPress}
          activeOpacity={0.7}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  connectionHint: {
    position: 'absolute', // 设置绝对定位
    top: 80, // 距顶部80单位
    left: 20, // 距左侧20单位
    right: 20, // 距右侧20单位
    backgroundColor: 'rgba(255, 0, 179, 0.9)', // 半透明绿色背景
    borderRadius: 8, // 圆角8单位
    padding: 12, // 内边距12单位
    zIndex: 30, // 层级为30
    alignItems: 'center', // 子元素居中对齐
  },
  connectionHintText: {
    color: 'white', // 文字颜色为白色
    fontSize: 16, // 字体大小16单位
    fontWeight: '500', // 字体粗细500
    fontFamily: '楷体', // 使用苹方字体
  },
  connectableOverlay: {
    position: 'absolute', // 设置绝对定位
    top: 0, // 贴顶
    left: 0, // 贴左
    right: 0, // 贴右
    bottom: 0, // 贴底
    zIndex: 100, // 层级为100
    borderRadius: 8, // 圆角8单位
  },
  HideConnectionLine: {
    position: 'absolute', // 设置绝对定位
    top: 0, // 距顶部80单位
    left: 20, // 距左侧20单位
    right: 20, // 距右侧20单位
    backgroundColor: 'rgba(0, 255, 110, 0.9)', // 半透明绿色背景
    borderRadius: 8, // 圆角8单位
    padding: 12, // 内边距12单位
    zIndex: 100, // 层级为30
  },
});

export default {
  ConnectionLine,
  useConnectNode,
  ConnectNodeRenderer,
  ConnectionHint,
  ConnectableCanvas,
  HideConnectionLine,
};
