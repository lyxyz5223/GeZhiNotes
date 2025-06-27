// import { useCanvasContentsGesture, useCanvasContentsMoveResizeGesture, useDrawGesture } from "@/hooks/UseCanvasContentsGesture";
import useAddModuleGestureHandler from "@/hooks/useAddModuleGestureHandler";
import useGestureHandleSystem from "@/hooks/useGestureHandleSystem";
import { CanvasContext } from "@/types/CanvasGestureTypes";
import { CanvasMode, CanvasType, CustomCanvasProps, TransformType } from "@/types/CanvasTypes";
import React, { useRef, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import CanvasAudioModule from "./CanvasModules/CanvasAudioModule";
import CanvasDrawModule from "./CanvasModules/CanvasDrawModule";
import CanvasImageModule from "./CanvasModules/CanvasImageModule";
import CanvasLinkModule from "./CanvasModules/CanvasLinkModule";
import CanvasTextModule from "./CanvasModules/CanvasTextModule";
import CanvasVideoModule from "./CanvasModules/CanvasVideoModule";
import CanvasWebLinkModule from "./CanvasWebLinkModule";

// 此模块的手势处理在 "@/hooks/UseGestureResponderFunctionsSelector" 中完成
// =================== Group 渲染模块注册区 ===================
// 每个模块对象包含 name、type、module、deps（依赖参数名数组）
// 新模块如需依赖主模块的参数，可以在 deps 中声明，同时在主模块中allParams 中提供对应参数
// type 枚举

const RENDER_MODULE_LIST = [
  {
    name: 'CanvasDrawModule',
    module: (props: CustomCanvasProps, extraParams: any) => <CanvasDrawModule props={props} extraParams={extraParams} />,
    deps: [], // 声明依赖
  },
  {
    name: 'CanvasTextModule',
    module: (props: CustomCanvasProps, extraParams: any) => <CanvasTextModule props={props} extraParams={extraParams} />,
    deps: [],
  },
  {
    name: 'CanvasImageModule',
    module: (props: CustomCanvasProps, extraParams: any) => <CanvasImageModule props={props} extraParams={extraParams} />,
    deps: ['contentsTransform'],
  },
  {
    name: 'CanvasVideoModule',
    module: (props: CustomCanvasProps, extraParams: any) => <CanvasVideoModule props={props} extraParams={extraParams} />,
    deps: [],
  },
  {
    name: 'CanvasWebLinkModule',
    module: (props: CustomCanvasProps, extraParams: any) => <CanvasWebLinkModule props={props} extraParams={extraParams} />,
    deps: [],
  },
  {
    name: 'CanvasAudioModule',
    module: (props: CustomCanvasProps, extraParams: any) => <CanvasAudioModule props={props} extraParams={extraParams} />,
    deps: [],
  },
  {
    name: 'CanvasLinkModule',
    module: (props: CustomCanvasProps, extraParams: any) => <CanvasLinkModule props={props} extraParams={extraParams} />,
    deps: [],
  }
  // 可以在这里添加更多渲染模块，如文本框
];
// =================== Group 渲染模块注册区 END ===================

// 只接收一个 props 对象，便于后续 context/解构扩展
const CustomCanvas: React.FC<CustomCanvasProps> = (props) => {
  const {
    id, x = 0, y = 0, width, height,
    style, onMoveResize, canvasBg, color, size, mode,
    moveable = true, resizeable = true,
    borderRadius = width / 2, // 默认圆形
    canvasType,
  } = props;
  
  const canvasViewRef = useRef<View>(null);
  // 画布内容缩放
  const [canvasContentsTransform, setCanvasContentsTransform] = useState<TransformType>({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });

  const contentsTransform = {
    canvasContentsTransform,
    setCanvasContentsTransform
  };
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
    mode: mode ?? CanvasMode.Draw,
    contentsTransform: contentsTransform,
    canvasViewRef,
  };

  const gestureHandleSystem = useGestureHandleSystem(canvasContext);
  const addModuleGestureHandler = useAddModuleGestureHandler(canvasContext);


  // 所有可被注入的参数池
  const allParams: Record<string, any> = {
    canvasViewRef,
    contentsTransform,
  };

  // 这个必须有，是画布的基础功能
  // 生成 Skia/RN 子控件
  // CanvasDrawModule 依赖 currentPathInfo、setCurrentPathInfo
  const skiaModule = RENDER_MODULE_LIST[0];
  let skiaExtraParams: Record<string, any> = {};
  if (Array.isArray(skiaModule.deps)) {
    skiaModule.deps.forEach(dep => {
      if (allParams[dep] !== undefined) skiaExtraParams[dep] = allParams[dep];
    });
  }
  const skiaChildren = skiaModule.module(props, skiaExtraParams);
  // React Native 子控件
  const rnChildren = RENDER_MODULE_LIST.flatMap((m, idx) => {
    if (m.name === skiaModule.name) return []; // 跳过 Skia 模块
    let extraParams: Record<string, any> = {};
    if (Array.isArray(m.deps)) {
      m.deps.forEach(dep => {
        if (allParams[dep] !== undefined) extraParams[dep] = allParams[dep];
      });
    }
    const element = m.module(props, extraParams);
    if (Array.isArray(element)) {
      return element.map((el, i) => el && React.isValidElement(el) ? React.cloneElement(el, { key: `${m.name}-ReactNative-${idx}-${i}` }) : el);
    } else if (element && React.isValidElement(element)) {
      return React.cloneElement(element, { key: `${id}-${m.name}-ReactNative-${idx}` });
    } else {
      return element;
    }
  });

  // const gestureResponderFunctionsSelector
  //   = useGestureResponderFunctionsSelector(canvasContext);

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

  // 全屏切换状态
  const [fullscreen, setFullscreen] = useState(canvasType === CanvasType.Main);

  // 双击手势：子画布可全屏
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .runOnJS(true)
    .onEnd(() => {
      console.log('双击事件触发');
      if (canvasType === CanvasType.Child && !fullscreen) {
        setFullscreen(true);
        props.onEnterFullscreen && props.onEnterFullscreen();
      }
    });

  // 退出全屏
  const handleExitFullscreen = () => {
    setFullscreen(false);
    props.onExitFullscreen && props.onExitFullscreen();
  };

  // 复合手势：全屏时允许编辑，否则只允许拖动/缩放/双击
  const gesture = fullscreen
    ? gestureHandleSystem // 全屏时允许编辑
    : doubleTapGesture; // 非全屏只允许双击和拖动缩放
  const rootViewStyle = {
    ...(() => {
      if (canvasType === CanvasType.Main || fullscreen) {
        return {
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          borderRadius: 0,
        };
      } else if (canvasType === CanvasType.Child) {
        return {
          left: x,
          top: y,
          width: width,
          height: height,
          borderRadius: borderRadius,
        };
      }
    })(),
    position: 'absolute',
    backgroundColor: canvasBg || '#fff',
    borderWidth: 2,
    borderColor: mode === CanvasMode.Hand ? '#007aff' : '#bbb',
    overflow: 'hidden',
  };

  return (
    <GestureDetector gesture={gesture}>
      <View
        ref={canvasViewRef}
        style={[
          rootViewStyle,
          style,
        ]}
        onLayout={handleLayout}
      >
        {/* 全屏子画布时显示退出全屏按钮 */}
        {fullscreen && canvasType === CanvasType.Child && (
          <View style={{ position: 'absolute', top: 100, right: 16, zIndex: 10 }}>
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
          {/* 只有全屏时才允许作图编辑内容 */}
          {(canvasType === CanvasType.Main
            || (fullscreen && canvasType === CanvasType.Child))
            ? skiaChildren : null}
        </View>
        <View style={{
          position: 'absolute',
          left: 0, top: 0,
          width, height,
          transform: rnTransform,
          transformOrigin: '0 0',
          pointerEvents: 'box-none', // 允许下层手势响应
        }}>
          {(canvasType === CanvasType.Main
            || (fullscreen && canvasType === CanvasType.Child))
            ? rnChildren : null}
        </View>
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