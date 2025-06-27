import React, { useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import {
  useSharedValue,
  useDerivedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {
  Canvas,
  Path,
  Skia,
  LinearGradient,
  vec,
  // useComputedValue, // Removed because it's not exported
  PathCommand,
} from '@shopify/react-native-skia';
import { debounce } from 'lodash';

// 类型定义
interface Point {
  x: number;
  y: number;
}

type DrawingPath = Point[];

interface DrawingCanvasProps {
  paths: DrawingPath[];
  setPaths: (paths: DrawingPath[]) => void;
  strokeWidth?: number;
  strokeColor?: string;
  backgroundColor?: string;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  paths,
  setPaths,
  strokeWidth = 4,
  strokeColor = '#000000',
  backgroundColor = '#FFFFFF',
}) => {
  // 性能优化：使用共享值处理手势数据
  const currentPath = useSharedValue<Point[]>([]);
  const isDrawing = useSharedValue(false);
  const sharedPaths = useSharedValue<DrawingPath[]>(paths);

  // 防抖更新外部状态
  const debouncedSetPaths = useMemo(
    () => debounce(setPaths, 300, { leading: false, trailing: true }),
    [setPaths]
  );

  // 同步外部路径变化到共享值
  useEffect(() => {
    sharedPaths.value = paths;
  }, [paths, sharedPaths]);

  // 将路径转换为Skia Path对象
  const convertToSkiaPath = useCallback((points: Point[]): PathCommand[] => {
    if (points.length === 0) return [];

    const commands: PathCommand[] = [['moveTo', points[0].x, points[0].y]];
    for (let i = 1; i < points.length; i++) {
      commands.push(['lineTo', points[i].x, points[i].y]);
    }
    return commands;
  }, []);

  // 计算所有路径的Skia Path
  const renderedPaths = useDerivedValue(() => {
    return sharedPaths.value.map((path) => ({
      path: convertToSkiaPath(path),
      color: strokeColor,
    }));
  }, [strokeColor]);

  // 计算当前绘制路径的Skia Path
  const currentSkiaPath = useDerivedValue(() => {
    return {
      path: convertToSkiaPath(currentPath.value),
      color: strokeColor,
    };
  }, [currentPath, strokeColor]);

  // 手势处理 - 绘制
  const panGesture = Gesture.Pan()
    .onStart((e) => {
      isDrawing.value = true;
      currentPath.value = [{ x: e.x, y: e.y }];
    })
    .onUpdate((e) => {
      if (isDrawing.value) {
        currentPath.value = [...currentPath.value, { x: e.x, y: e.y }];
      }
    })
    .onEnd(() => {
      if (currentPath.value.length > 1) {
        const newPaths = [...sharedPaths.value, currentPath.value];
        sharedPaths.value = newPaths;
        runOnJS(debouncedSetPaths)(newPaths);
      }
      currentPath.value = [];
      isDrawing.value = false;
    })
    .minDistance(1); // 设置最小移动距离，避免误触

  // 清除画布
  const clearCanvas = useCallback(() => {
    sharedPaths.value = [];
    setPaths([]);
    currentPath.value = [];
  }, [setPaths]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      debouncedSetPaths.cancel();
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={[styles.canvasContainer, { backgroundColor }]}>
        <GestureDetector gesture={panGesture}>
          <Canvas style={styles.canvas}>
            {/* 背景 */}
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, 400)}
              colors={[backgroundColor, `${backgroundColor}80`]}
            />

            {/* 已绘制的路径 */}
            {renderedPaths.value.map((pathData, index) => (
              <Path
                key={`path-${index}`}
                path={pathData.path}
                color={pathData.color}
                style="stroke"
                strokeWidth={strokeWidth}
                strokeJoin="round"
                strokeCap="round"
                antiAlias
              />
            ))}

            {/* 当前正在绘制的路径 */}
            {currentPath.value.length > 0 && (
              <Path
                path={currentSkiaPath.value.path}
                color={currentSkiaPath.value.color}
                style="stroke"
                strokeWidth={strokeWidth}
                strokeJoin="round"
                strokeCap="round"
                antiAlias
              />
            )}
          </Canvas>
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  canvasContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  canvas: {
    flex: 1,
  },
});

export default React.memo(DrawingCanvas);