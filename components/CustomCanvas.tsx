import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import React, { useRef, useState } from "react";
import { GestureResponderEvent, StyleSheet, View } from "react-native";
import { CanvasMode } from "./CanvasToolbar";

export interface CustomCanvasProps {
  id?: string;
  x?: number;
  y?: number;
  width: number;
  height: number;
  style?: any;
  onMoveResize?: (id: string, x: number, y: number, width: number, height: number) => void;
  onRemove?: (id: string) => void;
  onToggleTheme?: () => void;
  canvasBg?: string;
  color?: string;
  size?: number;
  paths?: DrawPathInfo[];
  setPaths?: (paths: DrawPathInfo[]) => void;
  mode?: CanvasMode; // 绘制模式，默认为Draw
  moveable?: boolean; // 是否允许移动或缩放画布
  resizeable?: boolean; // 是否允许缩放画布
};

type DrawPathInfo = {
  path: ReturnType<typeof Skia.Path.Make>;
  color: string;
  size: number;
  isEraser?: boolean;
  points: { x: number, y: number }[];
  timestamp?: number; // 时间戳，用于记录绘制时间
};

const CustomCanvas: React.FC<CustomCanvasProps> = ({
  id = '', x = 0, y = 0, width, height, style, onMoveResize, onRemove, onToggleTheme, canvasBg, color, size, paths, setPaths, mode, moveable = true, resizeable = true
}: CustomCanvasProps) => {
  // 画笔状态
  const currentPathInfoRef = useRef<DrawPathInfo | null>(null);
  // 当手指按下绘图时，实时显示绘制的图案
  const [currentPathInfo, setCurrentPathInfo] = useState<DrawPathInfo | null>(null);
  const canvasLayoutRef = useRef<{x: number, y: number}>({x: 0, y: 0});
  const canvasViewRef = useRef<View>(null);
  const fingerDistanceSquareRef = useRef(0); // 用于记录当前两个手指的距离
  
  // 获取当前时间戳
  const getTimestamp = React.useCallback(() => {
    return Date.now();
  }, []);

  // 工具函数：由点数组生成 Skia.Path
  function createPathFromPoints(points: { x: number, y: number }[]) {
    const path = Skia.Path.Make();
    if (points.length > 0) {
      path.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        path.lineTo(points[i].x, points[i].y);
      }
    }
    return path;
  }

  // 监听画布布局变化，获取画布的绝对位置
  const handleLayout = (event: any) => {
    // const { x, y } = event.nativeEvent.layout;
    console.log('画布布局', event.nativeEvent.layout);
    // [Deprecated] 每次触摸都会重新动态计算一遍，因此不需要这个
    // canvasLayoutRef.current = { x, y };
  };

  // 绘图手势
  const panResponderDraw = React.useMemo(() => {
    return {
      onStartShouldSetResponder: () => true,
      onMoveShouldSetResponder: () => true,
      onResponderGrant: (evt: GestureResponderEvent) => {
        if (!evt?.nativeEvent || !color || !size) return;
        const { pageX, pageY } = evt.nativeEvent;
        // 计算相对画布的坐标
        canvasViewRef.current?.measure(
          (x, y, width, height, pageX, pageY) => {
            canvasLayoutRef.current = { x: pageX, y: pageY };
          }
        );
        const relX = pageX - canvasLayoutRef.current.x;
        const relY = pageY - canvasLayoutRef.current.y;

        // 橡皮擦：统一使用 blendMode: 'clear'，color/size 只影响擦除区域大小
        let drawColor = color;
        let drawSize = size;
        let isEraserPath = false;
        if (mode === CanvasMode.Eraser) {
          drawColor = '#000'; // 颜色无实际意义
          isEraserPath = true;
        }
        const points = [{ x: relX, y: relY }];
        const path = createPathFromPoints(points);
        const newPath: DrawPathInfo = { path, color: drawColor, size: drawSize, isEraser: isEraserPath, points, timestamp: getTimestamp() };
        currentPathInfoRef.current = newPath;
        setCurrentPathInfo(newPath); // 更新实时预览状态
        console.log('onResponderGrant', '[ color:', newPath.color, '] [ location:', newPath.points[0], '] [ isEraser:', newPath.isEraser, ']');
      },
      onResponderMove: (evt: GestureResponderEvent) => {
        if (!evt?.nativeEvent) return;
        const { pageX, pageY } = evt.nativeEvent;
        if (!currentPathInfoRef.current) return;
        const relX = pageX - canvasLayoutRef.current.x;
        const relY = pageY - canvasLayoutRef.current.y;
        const moveOldPoints = currentPathInfoRef.current.points;
        const moveNewPoints = [...moveOldPoints, { x: relX, y: relY }];
        const newPath = createPathFromPoints(moveNewPoints);
        currentPathInfoRef.current = {
          ...currentPathInfoRef.current,
          points: moveNewPoints,
          path: newPath,
        };
        setCurrentPathInfo(currentPathInfoRef.current); // 更新实时预览状态
        console.log('onResponderMove', moveNewPoints.length);
      },
      onResponderRelease: () => {
        console.log('绘制结束onResponderRelease');
        // 只在此处 push 完整一笔
        if (currentPathInfoRef.current && setPaths && paths) {
          setPaths([...paths, currentPathInfoRef.current]);
        }
        currentPathInfoRef.current = null;
        setCurrentPathInfo(null); // 清除实时预览状态
      },
      onResponderTerminate: () => {
        console.log('绘制结束onResponderTerminate');
        // 只在此处 push 完整一笔
        if (currentPathInfoRef.current && setPaths && paths) {
          setPaths([...paths, currentPathInfoRef.current]);
        }
        currentPathInfoRef.current = null;
        setCurrentPathInfo(null); // 清除实时预览状态
      }
    };
  }, [color, size, mode, setPaths, paths, getTimestamp]);

  // 拖动相关
  const dragOffset = useRef<{dx: number, dy: number}>({dx: 0, dy: 0});
  // 缩放相关
  const resizeStart = useRef<{w: number, h: number, x: number, y: number, startX: number, startY: number}>({w: width, h: height, x, y, startX: 0, startY: 0});

  // 拖动手势（仅选择模式且moveable为true）和缩放手势（仅选择模式且resizeable为true）
  const panResponderMove = React.useMemo(() => {
    if (mode !== CanvasMode.Select || !moveable) return {};
    return {
      onStartShouldSetResponder: () => true,
      onMoveShouldSetResponder: () => true,
      onResponderGrant: (evt: GestureResponderEvent) => {
        if (evt.nativeEvent.touches.length === 1) {
          console.log('One finger drag started');
          dragOffset.current = {
            dx: evt.nativeEvent.pageX - x,
            dy: evt.nativeEvent.pageY - y,
          };
        }
        else if (evt.nativeEvent.touches.length === 2) {
          // 不处理，因为双指缩放在 onResponderMove 中处理，这个if分支无法进入！
        }
      },
      onResponderMove: (evt: GestureResponderEvent) => {
        if (!onMoveResize) return;
        if (evt.nativeEvent.touches.length === 1)
        {
          console.log('One finger drag move');
          const newX = evt.nativeEvent.pageX - dragOffset.current.dx;
          const newY = evt.nativeEvent.pageY - dragOffset.current.dy;
          onMoveResize(id, newX, newY, width, height);
        }
        else if (evt.nativeEvent.touches.length === 2) {
          console.log('双指缩放');
          // 双指缩放逻辑
          if (!fingerDistanceSquareRef.current) {
            console.log('Two fingers scale started');
            const touch1 = evt.nativeEvent.touches[0];
            const touch2 = evt.nativeEvent.touches[1];
            const dx = touch2.pageX - touch1.pageX;
            const dy = touch2.pageY - touch1.pageY;
            fingerDistanceSquareRef.current = dx * dx + dy * dy;
            canvasViewRef.current?.measure(
              (x, y, width, height, pageX, pageY) => {
                resizeStart.current = {
                  w: width,
                  h: height,
                  x,
                  y,
                  startX: x,
                  startY: y
                };
              }
            );
            return;
          }
          const touch1 = evt.nativeEvent.touches[0];
          const touch2 = evt.nativeEvent.touches[1];
          const dx = touch2.pageX - touch1.pageX;
          const dy = touch2.pageY - touch1.pageY;
          const distanceSquare = dx * dx + dy * dy;
          let lambda = Math.sqrt(Math.abs(distanceSquare - fingerDistanceSquareRef.current));
          if (distanceSquare < fingerDistanceSquareRef.current) {
            // 缩小
            lambda = -lambda;
          }
          const newX = resizeStart.current.startX - lambda / 2;
          const newY = resizeStart.current.startY - lambda / 2;
          const newWidth = resizeStart.current.w + lambda;
          const newHeight = resizeStart.current.h + lambda;
          onMoveResize(id, newX, newY, newWidth, newHeight);
        }
      },
      onResponderRelease: () => {
        fingerDistanceSquareRef.current = 0; // 重置双指距离
        
      },
      onResponderTerminate: () => {},
    };
  }, [mode, moveable, x, y, width, height, onMoveResize, id]);

  // 缩放手柄手势（仅选择模式且resizeable为true）
  const handleResizeGrant = (evt: GestureResponderEvent) => {
    resizeStart.current = {
      w: width,
      h: height,
      x,
      y,
      startX: evt.nativeEvent.pageX,
      startY: evt.nativeEvent.pageY,
    };
  };
  const handleResizeMove = (evt: GestureResponderEvent) => {
    console.log('画布大小改变');
    if (!onMoveResize) return;
    const { w, h, x: ox, y: oy, startX, startY } = resizeStart.current;
    const dw = evt.nativeEvent.pageX - startX;
    const dh = evt.nativeEvent.pageY - startY;
    onMoveResize(id, ox, oy, Math.max(60, w + dw), Math.max(60, h + dh));
  };

  return (
    <View
      ref={canvasViewRef}
      style={[
        { position: 'absolute', left: x, top: y, width, height, backgroundColor: canvasBg || '#fff', borderRadius: 8, borderWidth: 2, borderColor: mode === CanvasMode.Select ? '#007aff' : '#bbb', overflow: 'hidden' },
        style
      ]}
      onLayout={handleLayout}
    >
      {/* 缩放手柄，仅选择模式且resizeable为true时显示 */}
      {mode === CanvasMode.Select && resizeable && (
        <View
          style={{
            position: 'absolute',
            right: -12,
            bottom: -12,
            width: 24,
            height: 24,
            backgroundColor: '#fff',
            borderRadius: 12,
            borderWidth: 2,
            borderColor: '#007aff',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={handleResizeGrant}
          onResponderMove={handleResizeMove}
        >
          <View style={{ width: 12, height: 12, borderRightWidth: 2, borderBottomWidth: 2, borderColor: '#007aff' }} />
        </View>
      )}
      <View style={{ flex: 1 }}
        {...((mode === CanvasMode.Draw || mode === CanvasMode.Eraser) ? panResponderDraw : mode === CanvasMode.Select && resizeable ? panResponderMove : {})}
        pointerEvents="auto"
      >
        <Canvas style={styles.canvas}>
          {paths?.filter(Boolean).map((p, index) => (
            p && p.path ? (
              <Path
                key={index}
                path={p.path}
                color={p.color}
                style="stroke"
                strokeWidth={p.size}
                strokeJoin="round"
                strokeCap="round"
                {...(p.isEraser ? { blendMode: 'clear' } : {})}
              />
            ) : null
          ))}
          {/* 实时预览当前一笔 */}
          {currentPathInfo && (
            <Path
              key='-1'
              path={currentPathInfo.path}
              color={currentPathInfo.color}
              style="stroke"
              strokeWidth={currentPathInfo.size}
              strokeJoin="round"
              strokeCap="round"
              {...(currentPathInfo.isEraser ? { blendMode: 'clear' } : {})}
            />
          )}
        </Canvas>
      </View>
    </View>
    
  );
};

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default CustomCanvas;
