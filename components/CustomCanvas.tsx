// import { useCanvasContentsGesture, useCanvasContentsMoveResizeGesture, useDrawGesture } from "@/hooks/UseCanvasContentsGesture";
import { useGestureResponderFunctionsSelector } from "@/hooks/UseGestureResponderFunctionsSelector";
import { UseGestureResponderFunctionsSelectorParams } from "@/types/CanvasGestureTypes";
import { CanvasMode, CustomCanvasProps } from "@/types/CanvasTypes";
import { Canvas, Group, Path } from "@shopify/react-native-skia";
import React, { useRef, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";

// 此模块的手势处理在 "@/hooks/UseGestureResponderFunctionsSelector" 中完成
// =================== Group 渲染模块注册区 ===================
// 每个模块对象包含 name、module、deps（依赖参数名数组）
// 新模块如需依赖主模块的参数，可以在 deps 中声明，同时在主模块中allParams 中提供对应参数
const RENDER_MODULE_LIST = [
  {
    name: 'CanvasDrawModule',
    module: (props: CustomCanvasProps, extraParams: any) => <CanvasDrawModule props={props} extraParams={extraParams} />,
    deps: ['currentPathInfo', 'setCurrentPathInfo'], // 声明依赖
  },

  // 可以在这里添加更多渲染模块，如文本框
];
// =================== Group 渲染模块注册区 END ===================

// CanvasDrawModule 作为一个独立渲染模块
function CanvasDrawModule({ props, extraParams }: { props: CustomCanvasProps; extraParams: any }) {
  const { id = '', pathsInGlobal } = props;
  const paths = pathsInGlobal;
  // currentPathInfo 由父组件传递
  const { currentPathInfo, setCurrentPathInfo } = extraParams;
  
  return (
    <>
      {paths?.filter(Boolean).map((p, index) => (
        p && p.path ? (
          <Path
            key={id + `path-${index}`}
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
          key={id + `path-${-1}`}
          path={currentPathInfo.path}
          color={currentPathInfo.color}
          style="stroke"
          strokeWidth={currentPathInfo.size}
          strokeJoin="round"
          strokeCap="round"
          {...(currentPathInfo.isEraser ? { blendMode: 'clear' } : {})}
        />
      )}
    </>
  );
}

// 只接收一个 props 对象，便于后续 context/解构扩展
const CustomCanvas: React.FC<CustomCanvasProps> = (props) => {
  const {
    id, x = 0, y = 0, width, height, style, onMoveResize, onRemove, canvasBg, color, size, pathsInGlobal, setPathsInGlobal, mode, moveable = true, resizeable = true
  } = props;
  const canvasViewRef = useRef<View>(null);
  // 画布内容缩放
  const [canvasContentsTransform, setCanvasContentsTransform] = useState({
    scale: 1,
    translateX: 0,
    translateY: 0,
    originX: 0,
    originY: 0,
  });
  // 当前绘制路径状态提升到 CustomCanvas
  const [currentPathInfo, setCurrentPathInfo] = useState<any>(null);

  // 统一收集所有画布状态和操作，后续可用 context 提供
  const canvasContext: UseGestureResponderFunctionsSelectorParams = {
    ...props,
    x: x ?? 0,
    y: y ?? 0,
    width: width ?? 0,
    height: height ?? 0,
    onMoveResize: onMoveResize ?? (() => { }),
    moveable: moveable ?? true,
    resizeable: resizeable ?? true,
    color: color ?? '#000000',
    size: size ?? 2,
    mode: mode ?? CanvasMode.Draw,
    path: {
      paths: pathsInGlobal ?? [],
      setPaths: setPathsInGlobal ?? (() => {}),
      currentPathInfo,
      setCurrentPathInfo
    },
    contentsTransform: {
      canvasContentsTransform,
      setCanvasContentsTransform
    },
    canvasViewRef,
  };

  // setCanvasState 只用于 context 场景，这里不再主动调用
  const setCanvasState = (updater: typeof canvasContext) => {
    Object.assign(canvasContext, updater);
  };
  
  // 所有可被注入的参数池
  const allParams: Record<string, any> = {
    canvasContext,
    setCanvasState,
    currentPathInfo,
    setCurrentPathInfo,
  };

  // 生成 Group 子控件，遍历所有模块，按声明依赖注入参数
  const groupChildren = RENDER_MODULE_LIST.flatMap((m, idx) => {
    let extraParams: Record<string, any> = {};
    if (Array.isArray(m.deps)) {
      m.deps.forEach(dep => {
        if (allParams[dep] !== undefined) extraParams[dep] = allParams[dep];
      });
    }
    // 为每个模块渲染结果加唯一 key
    const element = m.module(props, extraParams);
    if (Array.isArray(element)) {
      return element.map((el, i) => el && React.isValidElement(el) ? React.cloneElement(el, { key: `${m.name}-${idx}-${i}` }) : el);
    } else if (element && React.isValidElement(element)) {
      return React.cloneElement(element, { key: `${id}-${m.name}-${idx}` });
    } else {
      return element;
    }
  });

  const gestureResponderFunctionsSelector
    = useGestureResponderFunctionsSelector(canvasContext);

  // 监听画布布局变化
  const handleLayout = (event: LayoutChangeEvent) => {
    // const { x, y } = event.nativeEvent.layout;
    // console.log('画布布局', event.nativeEvent.layout);
    // canvasLayoutRef.current = { x: x, y: y };
  };


  return (
    <View
      ref={canvasViewRef}
      style={[
        { position: 'absolute', left: x, top: y, width, height, backgroundColor: canvasBg || '#fff', borderRadius: 8, borderWidth: 2, borderColor: mode === CanvasMode.Hand ? '#007aff' : '#bbb', overflow: 'hidden' },
        style
      ]}
      onLayout={handleLayout}
    >
      <View style={{ flex: 1 }}
        {...gestureResponderFunctionsSelector}
        pointerEvents="auto"
      >
        <Canvas style={styles.canvas}>
          <Group
            transform={[
              { scale: canvasContentsTransform.scale },
              { translateX: canvasContentsTransform.translateX },
              { translateY: canvasContentsTransform.translateY },
            ]}
            origin={{ x: canvasContentsTransform.originX, y: canvasContentsTransform.originY }}
          >
            {groupChildren}
          </Group>
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


/*
 * 保存一下手势函数调用方法、
 * 方便后续维护和修改
 *
 * const gestureResponderFunctionsSelector = useGestureResponderFunctionsSelector({
    id,
    x,
    y,
    width,
    height,
    style,
    onMoveResize,
    onRemove,
    onToggleTheme,
    canvasBg,
    color,
    size,
    paths,
    setPaths,
    mode: mode!,
    moveable,
    resizeable,
    canvasContentsMoveResize: {}, // 如有具体实现可替换
    canvasLayoutRef,
    canvasContentsTransform,
    canvasViewRef,
    setCanvasContentsTransform,
    lastTouches,
    lastTransform,
    currentPathInfo,
    setCurrentPathInfo
  });
  const drawGesture = useDrawGesture({
    color,
    size,
    mode,
    setPaths,
    paths,
    canvasLayoutRef,
    canvasContentsTransform,
    canvasViewRef,
    currentPathInfo,
    setCurrentPathInfo
  });
  const canvasContentsMoveResizeGesture = useCanvasContentsMoveResizeGesture({
    canvasLayoutRef,
    canvasContentsTransform,
    setCanvasContentsTransform,
    lastTouches,
    lastTransform
  });

  const canvasContentsGesture = useCanvasContentsGesture({
    color,
    size,
    mode,
    setPaths,
    paths,
    canvasLayoutRef,
    canvasContentsTransform,
    setCanvasContentsTransform,
    lastTouches,
    lastTransform,
    canvasViewRef,
    currentPathInfo,
    setCurrentPathInfo,
  });

 */