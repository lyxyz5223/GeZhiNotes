import { CanvasMode, CustomCanvasProps, DrawPathInfo } from "@/types/CanvasTypes";
import { createPathFromPoints } from "@/utils/CanvasUtils";
import { Canvas, Group } from '@shopify/react-native-skia';
import React, { useRef, useState } from "react";
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useSharedValue } from 'react-native-reanimated';
import CanvasDrawItem from "./CanvasDrawItem";

// 绘图模块主组件，模仿 CanvasImageModule
function CanvasDrawModule({ props, extraParams }: { props: CustomCanvasProps; extraParams: any }) {
  const paths: DrawPathInfo[] = props.globalData?.paths?.value || [];
  const id = props.id || '';
  // 画布 transform 透传
  const canvasContentsTransform = extraParams.contentsTransform?.value || { translateX: 0, translateY: 0, scale: 1 };
  const currentDrawPathInfo = useSharedValue<DrawPathInfo | null>(null);
  const [renderedPath, setRenderedPath] = useState<DrawPathInfo | null>(null);
  // 工具函数：将屏幕坐标转为画布坐标
  const toCanvasPoint = (x: number, y: number) => {
    const scale = canvasContentsTransform.scale ?? 1;
    const tx = canvasContentsTransform.translateX ?? 0;
    const ty = canvasContentsTransform.translateY ?? 0;
    return {
      x: (x - tx) / scale,
      y: (y - ty) / scale,
    };
  };

  const beginRenderedPath = (x: number, y: number, timestamp: number) => {
    const pt = toCanvasPoint(x, y);
    const newPath = createPathFromPoints([pt]);
    const newPathInfo: DrawPathInfo = {
      id: `${id}-Path-${timestamp}`,
      points: [pt],
      color: props.color ?? '#000000',
      size: props.size ?? 3,
      isEraser: props.mode?.value === CanvasMode.Eraser,
      path: newPath,
      timestamp: timestamp,
    };
    setRenderedPath(newPathInfo);
  };
  const updateRenderedPath = (prevCanvasPoints: { x: number, y: number }[], newScreenPoint: { x: number, y: number }) => {
    // prevCanvasPoints 已是画布坐标，newScreenPoint 需逆变换
    const pt = toCanvasPoint(newScreenPoint.x, newScreenPoint.y);
    const pts = [...prevCanvasPoints, pt];
    setRenderedPath(prev => {
      if (!prev) return null;
      const newPath = createPathFromPoints(pts);
      const newPathInfo: DrawPathInfo = {
        ...prev,
        points: pts,
        path: newPath,
      };
      return newPathInfo;
    });
  };
  const resetRenderedPath = () => {
    setRenderedPath(null);
  };

  const setGlobalPaths = () => {
    if (renderedPath && renderedPath.points.length > 1) {
      props.globalData?.paths?.setValue?.(prev => [...prev, renderedPath]);
    }
    resetRenderedPath();
    console.log('globalData', props.globalData);
  };
  const asyncPanGesture = Gesture.Pan()
    .enabled(props.mode?.value === CanvasMode.Draw || props.mode?.value === CanvasMode.Eraser)
    // .runOnJS(true) // 在 JS 端运行
    .onBegin(e => {
      if (props.mode?.value !== CanvasMode.Draw && props.mode?.value !== CanvasMode.Eraser) return;
      const timestamp = Date.now();
      const { x, y } = e;
      runOnJS(beginRenderedPath)(x, y, timestamp);
      console.log('asyncPanGesture onBegin');
    })
    .onUpdate(e => {
      if (!renderedPath) return;
      const newScreenPoint = { x: e.x, y: e.y };
      runOnJS(updateRenderedPath)(renderedPath.points, newScreenPoint);
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
  const willDraw = useRef(true);
  const syncPanGesture = Gesture.Pan()
    .maxPointers(1) // 限制为单指手势
    .minPointers(1) // 至少需要一个手指
    .runOnJS(true) // 在 JS 端运行
    .onBegin(e => {
      if (e.numberOfPointers > 1) {
        willDraw.current = false; // 仅单指生效
        return;
      }
      if (props.mode?.value !== CanvasMode.Draw && props.mode?.value !== CanvasMode.Eraser) return;
      const timestamp = Date.now();
      const { x, y } = e;
      beginRenderedPath(x, y, timestamp);
      console.log('syncPanGesture onBegin, current canvas id:', id);
    })
    .onUpdate(e => {
      if (e.numberOfPointers > 1) {
        willDraw.current = false; // 仅单指生效
        return;
      }
      if (!renderedPath) return;
      const newScreenPoint = { x: e.x, y: e.y };
      updateRenderedPath(renderedPath.points, newScreenPoint);
      console.log('CanvasDrawModule current draw canvas id:', props.id);
    })
    .onEnd((e) => {
      willDraw.current = true; // 仅单指生效
      if (e.numberOfPointers > 1) {
        resetRenderedPath();
        return;
      }
      setGlobalPaths();
      console.log('syncPanGesture onEnd');
    })
    .onFinalize(() => {
      willDraw.current = true; // 仅单指生效
      resetRenderedPath();
      console.log('syncPanGesture onFinalize');
    })
    .enabled(willDraw && (props.mode?.value === CanvasMode.Draw || props.mode?.value === CanvasMode.Eraser));


  return (
    <View style={{ flex: 1 }}>
      <GestureDetector gesture={syncPanGesture}>
        <Animated.View style={{ flex: 1 }} pointerEvents="box-none">
          <Canvas style={[styles.canvas]} pointerEvents="none">
            <Group transform={[
              { translateX: canvasContentsTransform.translateX },
              { translateY: canvasContentsTransform.translateY },
              { scale: canvasContentsTransform.scale },
            ]} origin={{ x: 0, y: 0 }}>
              {paths?.filter(Boolean).map((p: DrawPathInfo, index: number) => (
                <CanvasDrawItem key={id + `path-${index}`} pathInfo={p} />
              ))}
              {/* 用 currentPath 渲染当前路径，避免直接读取 sharedValue.value */}
              {renderedPath && (
                <CanvasDrawItem key={id + `path-current`} pathInfo={renderedPath} />
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
