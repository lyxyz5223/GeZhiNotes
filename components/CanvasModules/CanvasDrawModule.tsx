import { CanvasMode, CustomCanvasProps, DrawPathInfo } from "@/types/CanvasTypes";
import { createPathFromPoints } from "@/utils/CanvasUtils";
import { Canvas, Group } from '@shopify/react-native-skia';
import React, { useState } from "react";
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useSharedValue } from 'react-native-reanimated';
import CanvasDrawItem from "./CanvasDrawItem";

// 绘图模块主组件，模仿 CanvasImageModule
function CanvasDrawModule({ props, extraParams }: { props: CustomCanvasProps; extraParams: any }) {
  const paths: DrawPathInfo[] = props.globalData?.paths || [];
  const id = props.id || '';
  // 画布 transform 透传
  const { canvasContentsTransform } = extraParams.contentsTransform || { canvasContentsTransform: { scale: 1, translateX: 0, translateY: 0 } };
  const transform = [
    { translateX: canvasContentsTransform.translateX },
    { translateY: canvasContentsTransform.translateY },
    { scale: canvasContentsTransform.scale },
  ];

  const currentDrawPathInfo = useSharedValue<DrawPathInfo | null>(null);
  const [renderedPath, setRenderedPath] = useState<DrawPathInfo | null>(null);
  const beginRenderedPath = (x: number, y: number, timestamp: number) => {
    const newPath = createPathFromPoints([{ x, y }]);
    const newPathInfo: DrawPathInfo = {
      id: `${id}-Path-${timestamp}`,
      points: [{ x, y }],
      color: props.color ?? '#000000',
      size: props.size ?? 3,
      isEraser: props.mode === CanvasMode.Eraser,
      path: newPath,
      timestamp: timestamp,
    };
    setRenderedPath(newPathInfo);
  };
  const updateRenderedPath = (newPoints: { x: number, y: number }[]) => {
    setRenderedPath(prev => {
      if (!prev) return null;
      const newPath = createPathFromPoints(newPoints);
      const newPathInfo: DrawPathInfo = {
        ...prev,
        points: newPoints,
        path: newPath,
      };
      return newPathInfo;
    });
  };
  const resetRenderedPath = () => {
    setRenderedPath(null);
  };
  // 可能会出问题的写法，但是能确保使用的是最新值
  // const setGlobalPaths = (setRenderedPath: StateUpdater<DrawPathInfo | null>) => {
  //   if (setRenderedPath) {
  //     setRenderedPath(p => {
  //       if (!p) return p;
  //       const renderedPath = p;
  //       props.globalData?.setPaths?.(prev => {
  //         return [...prev, renderedPath];
  //       });
  //       return p;
  //     });
  //   }
  //   resetRenderedPath();
  // };
  const setGlobalPaths = () => {
    if (renderedPath && renderedPath.points.length > 1) {
      props.globalData?.setPaths?.(prev => [...prev, renderedPath]);
    }
    resetRenderedPath();
  };
  const asyncPanGesture = Gesture.Pan()
    .enabled(props.mode === CanvasMode.Draw || props.mode === CanvasMode.Eraser)
    // .runOnJS(true) // 在 JS 端运行
    .onBegin(e => {
      if (props.mode !== CanvasMode.Draw && props.mode !== CanvasMode.Eraser) return;
      const timestamp = Date.now();
      const { x, y } = e;
      runOnJS(beginRenderedPath)(x, y, timestamp);
      console.log('asyncPanGesture onBegin');
    })
    .onUpdate(e => {
      if (!renderedPath) return;
      const newPoint = { x: e.x, y: e.y };
      const newPoints = [...renderedPath.points, newPoint];
      runOnJS(updateRenderedPath)(newPoints);
    })
    .onEnd(() => {
      // 结束时清空当前路径
      runOnJS(setGlobalPaths)();
      console.log('asyncPanGesture onEnd');
    })
    .onFinalize(() => {
      runOnJS(resetRenderedPath)();
      console.log('asyncPanGesture onFinalize');
    });
  const syncPanGesture = Gesture.Pan()
    .enabled(props.mode === CanvasMode.Draw || props.mode === CanvasMode.Eraser)
    .runOnJS(true) // 在 JS 端运行
    .onBegin(e => {
      if (props.mode !== CanvasMode.Draw && props.mode !== CanvasMode.Eraser) return;
      const timestamp = Date.now();
      const { x, y } = e;
      beginRenderedPath(x, y, timestamp);
      console.log('syncPanGesture onBegin, current canvas id:', id);
    })
    .onUpdate(e => {
      if (!renderedPath) return;
      const newPoint = { x: e.x, y: e.y };
      const newPoints = [...renderedPath.points, newPoint];
      updateRenderedPath(newPoints);
    })
    .onEnd(() => {
      setGlobalPaths();
      console.log('syncPanGesture onEnd');
    })
    .onFinalize(() => {
      resetRenderedPath();
      console.log('syncPanGesture onFinalize');
    });


  return (
    <View style={{ flex: 1 }}>
      <GestureDetector gesture={syncPanGesture}>
        <Animated.View style={{ flex: 1, backgroundColor: '#ff000022' }} pointerEvents="box-none">
          <Canvas style={[styles.canvas]} pointerEvents="none">
            <Group transform={transform} origin={{ x: 0, y: 0 }}>
              {paths?.filter(Boolean).map((p: DrawPathInfo, index: number) => (
                <CanvasDrawItem key={id + `path-${index}`} pathInfo={p} transform={transform} />
              ))}
              {/* 用 currentPath 渲染当前路径，避免直接读取 sharedValue.value */}
              {renderedPath && (
                <CanvasDrawItem key={id + `path-current`}
                  pathInfo={renderedPath}
                  transform={transform}
                />
              )}
            </Group>
          </Canvas>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default CanvasDrawModule;
