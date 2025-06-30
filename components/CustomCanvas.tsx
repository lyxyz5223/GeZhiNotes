// import { useCanvasContentsGesture, useCanvasContentsMoveResizeGesture, useDrawGesture } from "@/hooks/UseCanvasContentsGesture";
import RENDER_MODULE_LIST from "@/constants/CustomCanvasRenderModuleList";

import { useCanvasCircleBorderResizeGestureHandler } from "@/hooks/useCanvasGestureHandler";
import useGestureHandleSystem from "@/hooks/useGestureHandleSystem";
import { CanvasContext, CanvasMode, CanvasType, CustomCanvasProps, TransformType } from "@/types/CanvasTypes";
import React, { useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";

// 只接收一个 props 对象，便于后续 context/解构扩展
const CustomCanvas: React.FC<CustomCanvasProps> = (props) => {
  // 画布整体缩放与拖动
  const [selfTransform, setSelfTransform] = useState({
    translateX: 0,
    translateY: 0,
    scale: 1,
  });
  // 全屏切换状态
  const canvasType = props.canvasType || CanvasType.Child; // 默认为子画布
  const [isFullscreen, setIsFullscreen] = useState(canvasType === CanvasType.Main);

  const {
    id, x = 0, y = 0, width, height,
    style, onMoveResize, canvasBg, color, size, mode,
    moveable = true, resizeable = true,
    borderRadius = width / 2, // 默认圆形
    fullscreen = {
      value: isFullscreen,
      setValue: setIsFullscreen
    }, // 全屏状态
    canvasTransform = {
      value: selfTransform,
      setValue: setSelfTransform,
    },// 画布整体变换状态

  } = props;

  const canvasViewRef = useRef<View>(null);
  // 画布内容缩放
  const [canvasContentsTransform, setCanvasContentsTransform] = useState<TransformType>({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });

  const contentsTransform = React.useMemo(() => ({
    value: canvasContentsTransform,
    setValue: setCanvasContentsTransform
  }), [canvasContentsTransform, setCanvasContentsTransform]);
  // 退出全屏
  const handleExitFullscreen = () => {
    setIsFullscreen(false);
  };
  // 已废弃的全屏切换函数，后续如需支持可恢复
  // const handleEnterFullscreen = () => {
  //   setIsFullscreen(true);
  // };
  // 画布边框可触摸区域宽度
  const borderTouchWidth = 20;
  // 画布是否正在缩放
  const [activeResizing, setActiveResizing] = useState(false);


  // 统一收集所有画布状态和操作，后续可用 context 提供
  const canvasContext: CanvasContext = {
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
    mode: mode,
    contentsTransform: contentsTransform,
    canvasViewRef,
    activeResizing: {
      value: activeResizing,
      setValue: setActiveResizing,
    },
    borderTouchWidth
  };


  // 所有可被注入的参数池
  const allParams: Record<string, any> = React.useMemo(() => ({
    canvasViewRef,
    contentsTransform,
  }), [canvasViewRef, contentsTransform]);


  // 用 useMemo 生成所有模块的 gestureList，避免每次渲染都生成新对象
  const gestureList = React.useMemo(() => {
    return RENDER_MODULE_LIST.map((m, idx) => {
      if (typeof m.gestureHandler === 'function') {
        let gestureParams: Record<string, any> = {};
        if (Array.isArray(m.gestureDeps)) {
          m.gestureDeps.forEach(dep => {
            if (allParams[dep] !== undefined) gestureParams[dep] = allParams[dep];
          });
        }
        const g = m.gestureHandler(props, gestureParams);
        // console.log(`Registered gesture for module ${m.name}`, g);
        return g;
      }
      return null;
    });
  }, [allParams, props]);

  const gestureHandleSystem = useGestureHandleSystem(canvasContext, gestureList);
  const canvasCircleBorderResizeGestureHandler = useCanvasCircleBorderResizeGestureHandler(canvasContext);

  useEffect(() => {
    console.log('[gestureHandleSystem] 发生改变');
  }, [gestureHandleSystem]);

  // 统一遍历 RENDER_MODULE_LIST 渲染所有模块，自动依赖注入和手势包裹
  const allChildren = RENDER_MODULE_LIST.flatMap((m, idx) => {
    // 收集依赖参数
    let extraParams: Record<string, any> = {};
    if (Array.isArray(m.deps)) {
      m.deps.forEach(dep => {
        if (allParams[dep] !== undefined) extraParams[dep] = allParams[dep];
      });
    }
    // 取用缓存的 gesture
    const gesture = gestureList[idx];
    // 渲染模块
    const element = m.module(props, extraParams);
    // 只包裹一层 View，若有手势则包裹 GestureDetector
    if (Array.isArray(element)) {
      return element.map((el, i) => {
        if (el && React.isValidElement(el)) {
          const view = <View style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            flex: 1,
          }} pointerEvents='box-none' key={`wrap-${m.name}-Module-${idx}-${i}`}>{React.cloneElement(el, { key: `${m.name}-Module-${idx}-${i}` })}</View>;
          return gesture ? <GestureDetector gesture={gesture} key={`gesture-${m.name}-Module-${idx}-${i}`}>{view}</GestureDetector> : view;
        }
        return el;
      });
    } else if (element && React.isValidElement(element)) {
      const view = <View style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        flex: 1,
      }} pointerEvents='box-none' key={`wrap-${id}-${m.name}-Module-${idx}`}>{React.cloneElement(element, { key: `${id}-${m.name}-Module-${idx}` })}</View>;
      return gesture ? <GestureDetector gesture={gesture} key={`gesture-${id}-${m.name}-Module-${idx}`}>{view}</GestureDetector> : view;
    } else {
      return element;
    }
  });

  // 监听画布布局变化
  const handleLayout = (event: LayoutChangeEvent) => {
    // const { x, y } = event.nativeEvent.layout;
    // console.log('画布布局', event.nativeEvent.layout);
    // canvasLayoutRef.current = { x: x, y: y };
  };

  // 计算 RN transform，保持与 Skia Group 一致（先平移再缩放，顺序与坐标换算严格对应）
  const rnTransform = [
    { translateX: canvasContentsTransform.translateX },
    { translateY: canvasContentsTransform.translateY },
    { scale: canvasContentsTransform.scale },
  ];
  const gesture = gestureHandleSystem;
  
  const rootViewStyle = {
    ...(() => {
      if (canvasType === CanvasType.Main || fullscreen) {
        const zIndex = canvasType === CanvasType.Child ? 99 : 0; // 主画布 zIndex 高于子画布
        return {
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          borderRadius: 0,
          zIndex: zIndex,
        };
      } else if (canvasType === CanvasType.Child) {
        return {
          left: x,
          top: y,
          width: width,
          height: height,
          borderRadius: borderRadius,
          zIndex: 1, // 子画布 zIndex 较低
        };
      }
    })(),
    position: 'absolute',
    backgroundColor: canvasBg || '#fff',
    borderWidth: 2,
    borderColor: mode?.value === CanvasMode.Hand ? '#007aff' : '#bbb',
    overflow: 'hidden',
  };
  // 统一遍历 RENDER_MODULE_LIST 渲染所有模块，自动依赖注入和手势包裹
  // allChildren 已在上方定义并生成

  return (
    <GestureDetector gesture={gesture}>
      <View
        ref={canvasViewRef}
        style={[
          rootViewStyle,
          style,
          {
            transform: [
              { translateX: canvasTransform.value.translateX },
              { translateY: canvasTransform.value.translateY },
              { scale: canvasTransform.value.scale },
            ],
          },
        ]}
        onLayout={handleLayout}
      >
        {/* 全屏子画布时显示退出全屏按钮 */}
        {fullscreen && canvasType === CanvasType.Child && (
          <View style={{ position: 'absolute', top: 100, right: 16, zIndex: 99 }}>
            <View style={styles.exitFullscreenBtnWrapper}>
              <Pressable style={styles.exitFullscreenBtnTouchable} onPress={handleExitFullscreen}>
                <View style={styles.exitFullscreenBtnTextWrap}>
                  <Text style={styles.exitFullscreenBtnText}>
                    退出全屏
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        )}
        <View style={{ flex: 1 }}>
          {/* 合并后的所有模块内容 */}
          {allChildren}
        </View>
        <View style={{
          position: 'absolute',
          left: 0, top: 0,
          width, height,
          transform: rnTransform,
          transformOrigin: '0 0',
          pointerEvents: 'box-none', // 允许下层手势响应
        }}>
          {props.globalData?.canvases?.value?.map(
            (canvas) => {
              return <CustomCanvas
                key={canvas.id}
                {...canvas}
                globalData={props.globalData}
                canvasType={CanvasType.Child} // 子画布
                resizeable={true} // 子画布允许缩放
                moveable={true} // 子画布允许移动
                fullscreen={{
                  value: false, // 子画布不全屏
                  setValue: () => { } // 子画布不需要全屏状态控制
                }}
              />
            }
          )}
        </View>
        {/* 只有非全屏子画布允许resize和move，且无手柄，仅边框可拖动 */}
        {resizeable && !fullscreen && (
          <GestureDetector gesture={canvasCircleBorderResizeGestureHandler}>
            <View
              style={{
                position: 'absolute',
                left: -borderTouchWidth / 2,
                top: -borderTouchWidth / 2,
                width: width + borderTouchWidth,
                height: height + borderTouchWidth,
                borderRadius: (width + borderTouchWidth) / 2,
                zIndex: 40,
                // 环形命中区
                borderWidth: borderTouchWidth,
                borderColor: activeResizing ? 'rgba(0,122,255,0.18)' : 'transparent',
                // 只让环形边缘响应事件
                backgroundColor: 'transparent',
                pointerEvents: 'auto',
              }}
            />
          </GestureDetector>
        )}
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  exitFullscreenBtnWrapper: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  exitFullscreenBtnTouchable: {
    borderRadius: 16,
    overflow: 'hidden' as 'hidden',
  },
  exitFullscreenBtnTextWrap: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  exitFullscreenBtnText: {
    fontSize: 16,
    color: '#007aff',
    fontWeight: 'bold' as 'bold',
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