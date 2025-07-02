// import { useCanvasContentsGesture, useCanvasContentsMoveResizeGesture, useDrawGesture } from "@/hooks/UseCanvasContentsGesture";
import { INIT_SIZE as CANVAS_INIT_SIZE } from "@/constants/CanvasConstants";
import RENDER_MODULE_LIST from "@/constants/CustomCanvasRenderModuleList";

import { useCanvasCircleBorderResizeGestureHandler } from "@/hooks/useCanvasGestureHandler";
import useGestureHandleSystem from "@/hooks/useGestureHandleSystem";
import { initialGlobalStates, useGlobalStatesWithSetters } from "@/hooks/useGlobalStatesWithSetters";
import { CanvasContext, CanvasMode, CanvasType, CustomCanvasProps, EmbeddedCanvasData, TransformType } from "@/types/CanvasTypes";
import { GlobalCanvasStates } from "@/types/MainCanvasType";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";

// 子画布id自增种子
let childCanvasIdSeed = 1;

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
  // 不要直接用这个状态，如需使用请使用 fullscreen.value 和 fullscreen.setValue，这个仅仅作为初始化用
  const [isFullscreen, setIsFullscreen] = useState(canvasType === CanvasType.Main);

  const {
    id, parentId, x = 0, y = 0, width, height,
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
    globalUndoRedo
  } = props;
  const undoRedo = useMemo(() => globalUndoRedo || {
    undo: () => { },
    redo: () => { },
    push: () => { },
    clear: () => { }
  }, [globalUndoRedo]);
  const handleGlobalStateChange = useCallback((id: string, stateName: string, newValue: any, newGlobalData: GlobalCanvasStates) => {
      undoRedo.push(newGlobalData);// 将操作后的新全局记录进入撤销栈
  }, [undoRedo]);
  useEffect(() => {
    console.log('[undoRedo] 发生变化', undoRedo);
  }, [undoRedo]);
  // 用 useMemo 缓存 globalDataSetters，避免每次渲染都新建 setter 函数
  const globalDataSetters = useGlobalStatesWithSetters(
    props.globalState?.value || initialGlobalStates,
    props.globalState?.setValue || (() => { }),
    handleGlobalStateChange
  );
  useEffect(() => {
    console.log('[globalDataSetters] 发生变化');
  }, [globalDataSetters]);
  // 用 useMemo 缓存 dataSetters，避免每次渲染都新建 setter 对象
  const dataSetters = React.useMemo(
    () => globalDataSetters(id),
    [globalDataSetters, id]
  );
  // 用 useMemo 缓存 globalData，避免每次渲染都新建对象
  const memoizedGlobalData = React.useMemo(() => ({ ...dataSetters }), [dataSetters]);
  
  const canvasViewRef = useRef<View>(null);
  // 记录画布View的屏幕绝对位置
  const canvasViewScreenPos = useRef({ left: 0, top: 0 });
  // 画布内容缩放
  const [canvasContentsTransform, setCanvasContentsTransform] = useState<TransformType>({
    translateX: 0,
    translateY: 0,
    scale: 1,
  });

  const contentsTransform = React.useMemo(() => ({
    value: canvasContentsTransform,
    setValue: setCanvasContentsTransform
  }), [canvasContentsTransform, setCanvasContentsTransform]);
  // 退出全屏
  const handleExitFullscreen = () => {
    fullscreen.setValue?.(false);
  };
  // 已废弃的全屏切换函数，后续如需支持可恢复
  // const handleEnterFullscreen = () => {
  //   fullscreen.setValue?.(true);
  // };
  // 画布边框可触摸区域宽度
  const borderTouchWidth = 20;
  // 画布是否正在缩放
  const [activeResizing, setActiveResizing] = useState(false);

  // 监听画布布局变化
  const handleLayout = (event: LayoutChangeEvent) => {
    // 获取画布View在屏幕上的绝对位置
    if (canvasViewRef.current) {
      canvasViewRef.current.measure((x, y, width, height, pageX, pageY) => {
        canvasViewScreenPos.current = { left: pageX, top: pageY };
      });
    }
  };

  // 点击添加子画布
  const handleAddChildCanvas = (evt: any) => {
    // 只允许主画布添加子画布
    if (canvasType !== CanvasType.Main || mode?.value !== CanvasMode.Canvas) return;
    // 用 pageX/pageY - 画布View屏幕左上角 得到相对画布内容的像素坐标
    const { pageX, pageY } = evt.nativeEvent;
    const { left, top } = canvasViewScreenPos.current;
    const localX = pageX - left;
    const localY = pageY - top;
    // 逆变换到画布坐标（需减去主画布x/y，适配transform）
    const scale = canvasContentsTransform.scale ?? 1;
    const tx = canvasContentsTransform.translateX ?? 0;
    const ty = canvasContentsTransform.translateY ?? 0;
    // 注意：主画布x/y为0，子画布有x/y时已在transform中处理
    const x = (localX - tx) / scale - CANVAS_INIT_SIZE / 2;
    const y = (localY - ty) / scale - CANVAS_INIT_SIZE / 2;
    // 递增生成唯一id
    const id = `${props.id}-child-canvas-${childCanvasIdSeed++}`;
    console.log(`Adding child canvas with id: ${id}, parentId: ${props.id}`);
    console.log(`Adding child canvas at local position: (${x}, ${y})`);
    const newCanvas: EmbeddedCanvasData = {
      id: id,
      parentId: props.id,
      x: x,
      y: y,
      width: CANVAS_INIT_SIZE,
      height: CANVAS_INIT_SIZE,
    };
    props.globalData?.canvases?.setValue?.((prev: EmbeddedCanvasData[] = []) => [...prev, newCanvas]);
  };

  // 统一收集所有画布状态和操作，后续可用 context 提供
  const canvasContext: CanvasContext = {
    ...props,
    globalData: memoizedGlobalData,// 更新全局数据，而不是每次都使用MainCanvas提供的setters
    contentsTransform: contentsTransform,
    canvasViewRef,
    activeResizing: {
      value: activeResizing,
      setValue: setActiveResizing,
    },
    borderTouchWidth
  };
  // 传递给子模块的 props
  const childProps: CustomCanvasProps = useMemo(() => ({
    ...props,
    globalData: memoizedGlobalData,
  }), [props, memoizedGlobalData]);

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


  // 统一遍历 RENDER_MODULE_LIST 渲染所有模块，自动依赖注入和手势包裹
  const allChildren = useMemo(() => RENDER_MODULE_LIST.flatMap((m, idx) => {
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
    const element = m.module(childProps, extraParams);
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
          return gesture ?
            <GestureDetector
              gesture={gesture}
              key={`gesture-${m.name}-Module-${idx}-${i}`}
            >
              {view}
            </GestureDetector>
            : view;
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
      return gesture ?
        <GestureDetector
          gesture={gesture}
          key={`gesture-${id}-${m.name}-Module-${idx}`}
        >
          {view}
        </GestureDetector>
        : view;
    } else {
      return element;
    }
  }), [allParams, gestureList, childProps, id]);

  const gesture = gestureHandleSystem;
  const rootViewStyle = {
    ...(() => {
      if (canvasType === CanvasType.Main || fullscreen.value) {
        const zIndex = canvasType === CanvasType.Child ? 99 : 0; // 主画布 zIndex 高于子画布
        return {
          position: 'relative',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          borderRadius: 0,
          zIndex: zIndex,
        };
      } else if (canvasType === CanvasType.Child) {
        const { scale } = canvasTransform.value;
        // 子画布相对于主画布的偏移
        const left = x * scale + canvasTransform.value.translateX;
        const top = y * scale + canvasTransform.value.translateY;
        const width = props.width * scale;
        const height = props.height * scale;
        const borderRadius = width / 2; // 默认圆形

        return {
          position: 'absolute',
          left: left,
          top: top,
          width: width,
          height: height,
          borderRadius: borderRadius,
          zIndex: 1, // 子画布 zIndex 较低
        };
      }
    })(),
    backgroundColor: canvasBg || '#fff',
    borderWidth: 2,
    borderColor: mode?.value === CanvasMode.Hand ? '#007aff' : '#bbb',
    overflow: 'hidden',
  };
  // 统一遍历 RENDER_MODULE_LIST 渲染所有模块，自动依赖注入和手势包裹
  // allChildren 已在上方定义并生成
  const [childFullscreenState, setChildFullscreenState] = useState(false);
  const childFullscreenObj = useMemo(() => ({
    value: childFullscreenState,
    setValue: setChildFullscreenState
  }), [childFullscreenState]);
  const modeObj = useMemo(() => ({ value: mode?.value || CanvasMode.Draw, setValue: () => { } }), [mode]);

  return (
    <GestureDetector gesture={gesture}>
      <View
        ref={canvasViewRef}
        style={[
          rootViewStyle,
          style,
          // canvasType === CanvasType.Child && !fullscreen.value && {
          //   transform: [
          //     { translateX: canvasTransform.value.translateX },
          //     { translateY: canvasTransform.value.translateY },
          //     { scale: canvasTransform.value.scale },
          //   ],
          //   transformOrigin: `${x} ${y}`, // 确保缩放中心在左上角
          // },
        ]}
        onLayout={handleLayout}
        onStartShouldSetResponder={() => true}
        onResponderRelease={handleAddChildCanvas}
      >
        {/* 全屏子画布时显示退出全屏按钮 */}
        {fullscreen.value && canvasType === CanvasType.Child && (
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
        {/* 画布内容 */}
        {fullscreen.value && (
          <View style={{ flex: 1 }} pointerEvents="box-none">
            {/* 合并后的所有模块内容 */}
            {allChildren}
          </View>
        )}
        {canvasType === CanvasType.Main && (
          props.globalData?.canvases?.value?.map(
            (canvas, idx) => (idx === 0 ? null : // 跳过主画布本身
              <CustomCanvas
                key={canvas.id} // 确保唯一性
                id={canvas.id}
                parentId={canvas.parentId} // 设置父画布 ID
                x={canvas.x}
                y={canvas.y}
                width={canvas.width}
                height={canvas.height}
                canvasType={CanvasType.Child} // 主画布类型
                onMoveResize={props.onMoveResize}
                onRemove={props.onRemove}
                canvasBg={props.canvasBg} // 用主题背景色
                color={color}
                size={size}
                mode={modeObj}
                moveable={true}
                resizeable={true}
                fullscreen={childFullscreenObj}
                globalData={memoizedGlobalData}
                globalState={props.globalState} // 传递全局状态
                style={{
                  ...props.style,
                }}
                canvasTransform={contentsTransform}
              />
            ))
        )}
        {/* 只有非全屏子画布允许resize和move，且无手柄，仅边框可拖动 */}
        {resizeable && !fullscreen.value && (
          <GestureDetector gesture={canvasCircleBorderResizeGestureHandler}>
            <View
              style={{
                position: 'absolute',
                left: -borderTouchWidth / 2,
                top: -borderTouchWidth / 2,
                right: -borderTouchWidth / 2,
                bottom: -borderTouchWidth / 2,
                borderRadius: (width + borderTouchWidth) / 2,
                zIndex: 99,
                // 环形命中区
                borderWidth: borderTouchWidth,
                borderColor: activeResizing ? 'rgba(255, 81, 0, 0.22)' : 'transparent',
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
