<<<<<<< HEAD
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { darkTheme, lightTheme } from './CanvasTheme';
import CanvasToolbar, { CanvasMode } from './CanvasToolbar';
import {
  ConnectNodeRenderer,
  ConnectionHint,
  HideConnectionLine,
  useConnectNode,
} from './ConnectNode';
import CustomCanvas from './CustomCanvas';

const INIT_SIZE = 300;

export type EmbeddedCanvasData = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};
=======
import { INIT_SIZE as CANVAS_INIT_SIZE } from "@/constants/CanvasConstants";
import { allThemes } from "@/constants/CanvasTheme";
import { useUndoRedo } from "@/hooks/UseUndoRedo";
import { CanvasMode, DrawPathInfo, EmbeddedCanvasData } from "@/types/CanvasTypes";
import { ThemeProvider } from "@react-navigation/native";
import React, { useCallback, useId, useState } from "react";
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import CanvasToolbar from "./CanvasToolbar";
import CustomCanvas from "./CustomCanvas";
import ThemeSelectorModal from "./ThemeSelectorModal";
import ThemedText from "./ThemedText";
>>>>>>> f8987debab86616617ade54e97795413c628a6e1

// 工具函数：包装 setPaths 以兼容函数式 setState 写法
function createSetPaths(
  setter: (paths: any[]) => void,
  getCurrent: () => any[]
) {
  return (updater: any[] | ((prev: any[]) => any[])) => {
    if (typeof updater === 'function') {
      const prev = getCurrent();
      setter((updater as (prev: any[]) => any[])(prev));
    } else {
      setter(updater);
    }
  };
}


export default function MainCanvas() {
<<<<<<< HEAD
  const [canvases, setCanvases] = useState<EmbeddedCanvasData[]>([
    {
      id: 'canvas-1',
      x: 0,
      y: 0,
      width: Dimensions.get('window').width,
      height: Dimensions.get('window').height - 60,
    },
  ]);
  const [isDark, setIsDark] = useState(false);
=======
  // 画布列表
  const canvasIdPrefix = "canvas";
  const canvasIdConnector = '-';
  const defaultCanvasId = useId();
  const createCanvasId = useCallback(
    () => canvasIdPrefix + canvasIdConnector + defaultCanvasId + canvasIdConnector + Date.now().toString(),
    [canvasIdPrefix, canvasIdConnector, defaultCanvasId]
  );
  const [canvases, setCanvases] = useState<EmbeddedCanvasData[]>(
    [
      {
        id: createCanvasId(), x: 0, y: 0, width: 0, height: 0
      },
    ]
  );
>>>>>>> f8987debab86616617ade54e97795413c628a6e1
  // 工具栏状态
  const [color, setColor] = useState('#007aff');
  const [size, setSize] = useState(4);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState('#007aff');
  const [mode, setMode] = useState(CanvasMode.Select); // 改为默认 Select 模式

<<<<<<< HEAD
  // 全局 paths 状态
  const [allPaths, setAllPaths] = useState<{ [id: string]: any[] }>({});
  // redo 栈：每项 { canvasId, path }
  const [, /*redoStack*/ setRedoStack] = useState<
    { canvasId: string; path: any }[]
  >([]);

  // 连接相关状态
  const {
    connectNodes,
    connections,
    handleCanvasSelect,
    handleDeleteConnection,
    clearConnectNodes,
  } = useConnectNode();

  // 主题切换方法
  const handleToggleTheme = () => setIsDark((d) => !d);

  // 添加新嵌入画布（居中）
  const addCanvas = () => {
    const { width: screenWidth, height: screenHeight } =
      Dimensions.get('window');
    setCanvases((cs) => [
      ...cs,
      {
        id: `canvas-${Date.now()}`,
        x: (screenWidth - INIT_SIZE) / 2,
        y: (screenHeight - INIT_SIZE) / 2,
        width: INIT_SIZE,
        height: INIT_SIZE,
      },
    ]);
=======
  // 用 useUndoRedo 管理 allPaths 撤销重做
  const undoRedo = useUndoRedo<{ [id: string]: DrawPathInfo[] }>();
  // 保存每一笔路径，allPaths[画布id] = 路径列表
  const [allPaths, setAllPaths] = useState<{ [id: string]: DrawPathInfo[] }>({});

  // 主题选择弹窗
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [themeIndex, setThemeIndex] = useState(0);
  const currentTheme = allThemes[themeIndex].value;

  // 主题切换方法（弹窗方式）
  const handleToggleTheme = () => setThemeModalVisible(true);

  // 处理根组件布局变化，获取屏幕尺寸
  const handleLayout = useCallback((event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setCanvases(cs => cs.map(
      (canvas, index) => (index === 0 ?
        { ...canvas, width, height }
          : canvas
      )
    ));
  }, []);

  // 添加新嵌入画布（居中）
  const addCanvas = () => {
      const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
      setCanvases(cs => [
          ...cs,
          {
            id: createCanvasId(),
            x: (screenWidth - CANVAS_INIT_SIZE) / 2,
            y: (screenHeight - CANVAS_INIT_SIZE) / 2,
            width: CANVAS_INIT_SIZE,
            height: CANVAS_INIT_SIZE,
          },
      ]);
>>>>>>> f8987debab86616617ade54e97795413c628a6e1
  };
  // 拖动/缩放回调
  const updateCanvas = (
    id: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    // cs.map遍历，修改指定id的画布数据，然后重新设置canvases
    setCanvases((cs) =>
      cs.map((c) => (c.id === id ? { ...c, x, y, width, height } : c))
    );
  };

  // 删除画布
  const removeCanvas = (id: string) => {
    setCanvases((cs) => cs.filter((c) => c.id !== id));
  };

  // 撤销（全局撤回，找到上一笔所在的画布并撤销）
  const handleUndo = () => {
<<<<<<< HEAD
    setAllPaths((prev) => {
      let lastCanvasId: string | null = null;
      let lastIndex = -1;
      let lastTimestamp = -1;
      for (const cid of Object.keys(prev)) {
        const paths = prev[cid];
        if (paths && paths.length > 0) {
          const ts = paths[paths.length - 1]?.timestamp || 0;
          if (
            ts > lastTimestamp ||
            (ts === -1 && lastIndex < paths.length - 1)
          ) {
            lastTimestamp = ts;
            lastCanvasId = cid;
            lastIndex = paths.length - 1;
          }
        }
      }
      if (!lastCanvasId || lastIndex < 0) return prev;
      // 将被撤销的 path 推入 redoStack
      const removedPath = prev[lastCanvasId][lastIndex];
      setRedoStack((stack) => [
        ...stack,
        { canvasId: lastCanvasId!, path: removedPath },
      ]);
      return { ...prev, [lastCanvasId]: prev[lastCanvasId].slice(0, -1) };
=======
    const last = undoRedo.undo();
    setAllPaths(prev => {
      return last ? last : {};
>>>>>>> f8987debab86616617ade54e97795413c628a6e1
    });
  };

  // redo（重做）
  const handleRedo = () => {
<<<<<<< HEAD
    setRedoStack((stack) => {
      if (stack.length === 0) return stack;
      const last = stack[stack.length - 1];
      setAllPaths((prev) => {
        const prevPaths = prev[last.canvasId] || [];
        return { ...prev, [last.canvasId]: [...prevPaths, last.path] };
=======
    const next = undoRedo.redo();
    if (next)
    {
      setAllPaths(prev => {
        return next;
>>>>>>> f8987debab86616617ade54e97795413c628a6e1
      });
    }
  };


  // 更新 allPaths 的方法，替代 setAllPaths
  const updateAllPaths = (
    updater: (prev: { [id: string]: DrawPathInfo[] }) => { [id: string]: DrawPathInfo[] }
  ) => {
    setAllPaths(prev => {
      const next = updater(prev);
      undoRedo.push(next);
      return next;
    });
  };

<<<<<<< HEAD
  // 添加缺失的保存和加载函数
  const handleSave = () => {
    // 保存当前画布数据
    const saveData = {
      canvases,
      allPaths,
      connections,
      settings: {
        color,
        size,
        isDark,
        customColor,
      },
      timestamp: Date.now(),
    };

    console.log('保存数据:', saveData);
    // 这里可以添加实际的保存逻辑，比如保存到本地存储或云端
    // 例如：AsyncStorage.setItem('canvas_data', JSON.stringify(saveData));

    // 临时提示（实际应用中可以替换为 Toast 或其他提示方式）
    alert('数据已保存！');
  };

  const handleLoad = () => {
    // 加载画布数据
    console.log('加载数据');

    // 临时提示
    alert('加载功能暂未实现');
  };

  // 直接处理画布点击的函数
  const handleCanvasPress = useCallback(
    (canvasId: string) => {
      console.log('MainCanvas: 画布被点击', canvasId, '当前模式:', mode);
      if (mode === CanvasMode.Connector) {
        handleCanvasSelect(canvasId, mode);
      }
    },
    [mode, handleCanvasSelect]
  );

  return (
    <ThemeProvider
      value={
        isDark
          ? { ...darkTheme, fonts: DarkTheme.fonts }
          : { ...lightTheme, fonts: DefaultTheme.fonts }
      }
    >
      <View
        style={[
          styles.root,
          { backgroundColor: isDark ? '#181a20' : '#fffbe6' },
        ]}
      >
=======
  // 传递给组件的setPaths方法
  // 定义一个函数setPaths，接收一个参数canvas，类型为EmbeddedCanvasData
  const setPaths = (canvas: EmbeddedCanvasData) => {
    // 调用createSetPaths函数，传入两个参数，第一个参数为一个函数，用于更新所有路径，第二个参数为一个函数，用于获取当前canvas的路径
    return createSetPaths(
      // 第一个参数函数，接收一个参数paths，用于更新所有路径
      paths => updateAllPaths(prev => ({ ...prev, [canvas.id]: paths })),
      // 第二个参数函数，用于获取当前canvas的路径，如果当前canvas的路径不存在，则返回一个空数组
      () => allPaths[canvas.id] || []
    )
  };

  // 读取
  const handleLoad = async () => {
    // TODO: 实现读取本地存储的画布数据
  };
  // 保存
  const handleSave = async () => {
    // TODO: 实现保存当前所有画布数据到本地存储
  };


  return (
    <ThemeProvider value={currentTheme}>
      <View style={[styles.root, { backgroundColor: currentTheme.colors.background }]}
        onLayout={handleLayout}
      >
        {/* 主题选择弹窗 */}
        <ThemeSelectorModal
          visible={themeModalVisible}
          currentIndex={themeIndex}
          onSelect={idx => {
            setThemeIndex(idx);
            setThemeModalVisible(false);
          }}
          onClose={() => setThemeModalVisible(false)}
        />
        {/* 浮动加号按钮 */}
        <TouchableOpacity
          style={styles.fab}
          onPress={addCanvas}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.fabIcon}>＋</ThemedText>
        </TouchableOpacity>
        {/* 全局工具栏 */}
>>>>>>> f8987debab86616617ade54e97795413c628a6e1
        <CanvasToolbar
          color={color}
          setColor={(c) => {
            setColor(c);
            setCustomColor(c);
          }}
          size={size}
          setSize={setSize}
          mode={mode}
          setMode={(newMode) => {
            if (newMode !== CanvasMode.Connector) {
              clearConnectNodes();
            }
            setMode(newMode);
          }}
          fontFamily={''}
          setFontFamily={() => {}}
          showColorPicker={showColorPicker}
          setShowColorPicker={setShowColorPicker}
          customColor={customColor}
          setCustomColor={setCustomColor}
          connectNodes={connectNodes}
          setConnectNodes={() => {}} // 不再直接使用
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSave={handleSave}
          onLoad={handleLoad}
          toolbarPos={{ x: 16, y: 40 }}
          toolbarHorizontalMargin={16}
          toolbarMaxWidth={Dimensions.get('window').width - 32}
          toolbarDragging={false}
          toolbarPanHandlers={{}}
          onToggleTheme={handleToggleTheme}
        />

        <View style={styles.canvasArea}>
          {/* 连接模式提示 */}
          <ConnectionHint mode={mode} connectNodes={connectNodes} />

          {/* 隐藏连接线*/}
          <HideConnectionLine mode={mode} />

          {/* 主画布 - 完全重新设计 */}
          <View style={{ position: 'relative' }}>
            <CustomCanvas
<<<<<<< HEAD
              id="main-canvas"
              x={0}
              y={0}
              width={Dimensions.get('window').width}
              height={Dimensions.get('window').height - 100}
              canvasBg={isDark ? '#2c2c2e' : '#fff'}
              color={color}
              size={size}
              paths={allPaths['main-canvas'] || []}
              setPaths={createSetPaths(
                (paths) => {
                  setAllPaths((prev) => ({ ...prev, 'main-canvas': paths }));
                },
                () => allPaths['main-canvas'] || []
              )}
=======
              id={canvases[0].id}
              key={canvases[0].id}
              x={canvases[0].x}
              y={canvases[0].y}
              width={canvases[0].width}
              height={canvases[0].height}
              onMoveResize={updateCanvas}
              onRemove={removeCanvas}
              canvasBg={currentTheme.colors.background} // 用主题背景色
              color={color}
              size={size}
              pathsInGlobal={allPaths[canvases[0].id] || []}
              setPathsInGlobal={setPaths(canvases[0])}
>>>>>>> f8987debab86616617ade54e97795413c628a6e1
              mode={mode}
              moveable={false}
              resizeable={false}
            />
<<<<<<< HEAD

            {/* 连接模式覆盖层 - 完全独立 */}
            {mode === CanvasMode.Connector && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: Dimensions.get('window').width,
                  height: Dimensions.get('window').height - 100,
                  backgroundColor: connectNodes.includes('main-canvas')
                    ? 'rgba(255, 102, 0, 0.2)'
                    : 'rgba(0, 122, 255, 0.1)',
                  borderColor: connectNodes.includes('main-canvas')
                    ? '#FF6600'
                    : 'transparent',
                  borderWidth: connectNodes.includes('main-canvas') ? 3 : 0,
                  borderRadius: 8,
                  zIndex: 1000,
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('主画布连接层被点击');
                  handleCanvasPress('main-canvas');
                }}
              />
            )}
          </View>

          {/* 嵌入画布 - 完全重新设计 */}
          {canvases.map((canvas) => (
            <View key={canvas.id} style={{ position: 'relative' }}>
              <CustomCanvas
                id={canvas.id}
                x={canvas.x}
                y={canvas.y}
                width={canvas.width}
                height={canvas.height}
                canvasBg={isDark ? '#2c2c2e' : '#fff'}
                color={color}
                size={size}
                paths={allPaths[canvas.id] || []}
                setPaths={createSetPaths(
                  (paths) => {
                    setAllPaths((prev) => ({ ...prev, [canvas.id]: paths }));
                  },
                  () => allPaths[canvas.id] || []
                )}
                mode={mode}
                onMoveResize={updateCanvas}
                onRemove={() => removeCanvas(canvas.id)}
              />

              {/* 连接模式覆盖层 - 使用绝对定位 */}
              {mode === CanvasMode.Connector && (
                <View
                  style={{
                    position: 'absolute',
                    top: canvas.y,
                    left: canvas.x,
                    width: canvas.width,
                    height: canvas.height,
                    backgroundColor: connectNodes.includes(canvas.id)
                      ? 'rgba(255, 102, 0, 0.2)'
                      : 'rgba(0, 122, 255, 0.1)',
                    borderColor: connectNodes.includes(canvas.id)
                      ? '#FF6600'
                      : 'transparent',
                    borderWidth: connectNodes.includes(canvas.id) ? 3 : 0,
                    borderRadius: 8,
                    zIndex: 1000,
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('画布连接层被点击:', canvas.id);
                    handleCanvasPress(canvas.id);
                  }}
                />
              )}
            </View>
=======
          )}
          {/* 渲染其他画布 */}
          {canvases.map((c, idx) => idx === 0 ? null : (
            <CustomCanvas
              id={c.id}
              key={c.id}
              x={c.x}
              y={c.y}
              width={c.width}
              height={c.height}
              onMoveResize={updateCanvas}
              onRemove={removeCanvas}
              canvasBg={currentTheme.colors.background} // 用主题背景色
              color={color}
              size={size}
              pathsInGlobal={allPaths[c.id] || []}
              setPathsInGlobal={setPaths(c)}
              mode={mode}
            />
>>>>>>> f8987debab86616617ade54e97795413c628a6e1
          ))}

          {/* 渲染连接线 */}
          <ConnectNodeRenderer
            connections={connections}
            canvases={canvases}
            mainCanvas={{
              id: 'main-canvas',
              x: 0,
              y: 0,
              width: Dimensions.get('window').width,
              height: Dimensions.get('window').height - 100,
            }}
            color={color}
            onDeleteConnection={handleDeleteConnection}
            connectionPointMode="optimized"
          />
        </View>

        {/* 添加画布按钮 */}
        <TouchableOpacity style={styles.fab} onPress={addCanvas}>
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      </View>
    </ThemeProvider>
  );
}

// 在文件末尾添加完整的样式定义

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  canvasArea: {
    flex: 1,
    position: 'relative',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007aff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabIcon: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
});
