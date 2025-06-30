import { INIT_SIZE as CANVAS_INIT_SIZE } from "@/constants/CanvasConstants";
import { allThemes } from "@/constants/CanvasTheme";
import { initialGlobalStates, useGlobalStatesWithSetters } from "@/hooks/useGlobalStatesWithSetters";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { CanvasMode, CanvasType, DrawPathInfo, EmbeddedCanvasData } from "@/types/CanvasTypes";
import { GlobalCanvasStates, GlobalPathsType, } from "@/types/MainCanvasType";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from "@react-navigation/native";
import { Skia } from '@shopify/react-native-skia';
import React, { useCallback, useEffect, useId, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import CanvasToolbar from "./CanvasToolbar";
import CustomCanvas from "./CustomCanvas";
import ThemeSelectorModal from "./ThemeSelectorModal";



export default function MainCanvas() {
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
  // 工具栏状态
  const [color, setColor] = useState("#007aff");
  const [size, setSize] = useState(4);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState("#007aff");
  const [mode, setMode] = useState(CanvasMode.Draw);

  // 用 useUndoRedo 管理全局画布数据（所有类型）撤销重做
  const undoRedo = useUndoRedo<GlobalCanvasStates>();
  const [globalState, setGlobalState] = useState<GlobalCanvasStates>(initialGlobalStates);

  const handleGlobalStateChange = useCallback((id: string, stateName: string, newValue: any, newGlobalData: GlobalCanvasStates) => {
      undoRedo.push(newGlobalData);// 将操作后的新全局记录进入撤销栈
  }, [undoRedo]);
  useEffect(() => {
    console.log('[undoRedo] 发生变化', undoRedo);
  }, [undoRedo]);
  // 用 useMemo 缓存 globalDataSetters，避免每次渲染都新建 setter 函数
  const globalDataSetters = useGlobalStatesWithSetters(
    globalState,
    setGlobalState,
    handleGlobalStateChange
  );
  useEffect(() => {
    console.log('[globalDataSetters] 发生变化');
  }, [globalDataSetters]);

  const firstCanvasId = canvases[0]?.id;
  // 用 useMemo 缓存 dataSetters，避免每次渲染都新建 setter 对象
  const dataSetters = React.useMemo(
    () => globalDataSetters(firstCanvasId),
    [globalDataSetters, firstCanvasId]
  );

  // 用 useMemo 缓存 globalData，避免每次渲染都新建对象
  const memoizedGlobalData = React.useMemo(() => ({ ...dataSetters }), [dataSetters]);
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
  };
  // 拖动/缩放回调
  const updateCanvas = (id: string, x: number, y: number, width: number, height: number) => {
    // cs.map遍历，修改指定id的画布数据，然后重新设置canvases
    setCanvases(cs => cs.map(c => c.id === id ? { ...c, x, y, width, height } : c));
  };

  // 删除画布
  const removeCanvas = (id: string) => {
    setCanvases(cs => cs.filter(c => c.id !== id));
  };

  // 撤销
  const handleUndo = () => {
    const last = undoRedo.undo();
    setGlobalState(prev => last ? last : initialGlobalStates);
  };
  // 重做
  const handleRedo = () => {
    const next = undoRedo.redo();
    if (next) setGlobalState(next);
  };


  // 监听 globalState 变化，自动 push 到撤销重做栈
  // 这种逻辑有问题！故注释掉
  // useEffect(() => {
  //   undoRedo.push(globalState);
  //   console.log('Global state updated, current state:', globalState);
  // }, [undoRedo, globalState]);


  // 持久化存储 key
  const STORAGE_KEY = 'GeZhiNotes:canvasData';
  // 读取本地所有画布和全局数据
  const handleLoad = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.canvases && Array.isArray(parsed.canvases)) setCanvases(parsed.canvases);
        if (parsed.globalState && typeof parsed.globalState === 'object') {
          // 路径反序列化
          const fixedPaths: GlobalPathsType = {};
          Object.entries(parsed.globalState.paths || {}).forEach(([cid, arr]) => {
            fixedPaths[cid] = Array.isArray(arr)
              ? (arr.map((item: any) => {
                  if (item && typeof item.path === 'string' && item.path.startsWith('M')) {
                    return { ...item, path: Skia.Path.MakeFromSVGString(item.path) };
                  }
                  return item;
                }) as DrawPathInfo[])
              : (arr as DrawPathInfo[]);
          });
          setGlobalState({
            ...initialGlobalStates,
            ...parsed.globalState,
            paths: fixedPaths,
          });
        }
      }
    } catch (e) {
      console.error('读取失败', e);
    }
  };
  // 保存所有画布和全局数据到本地
  const handleSave = async () => {
    try {
      // 路径序列化
      const serializablePaths: GlobalPathsType = {};
      Object.entries(globalState.paths).forEach(([canvasId, arr]) => {
        serializablePaths[canvasId] = Array.isArray(arr) ? arr.map(
          (item: any) => {
              if (item && item.path && typeof item.path.toSVGString === 'function') {
                return { ...item, path: item.path.toSVGString() };
              }
              if (item && typeof item.path === 'string') {
                return { ...item };
              }
              return item;
            })
          : arr;
      });
      const data = JSON.stringify({
        canvases: canvases,
        globalState: { ...globalState, paths: serializablePaths },
      });
      await AsyncStorage.setItem(STORAGE_KEY, data);
    } catch (e) {
      console.error('保存失败', e);
    }
  };

  // 启动时自动读取
  // React.useEffect(() => {
  //   handleLoad();
  // }, []);

  // memo化 mode 和 fullscreen，避免对象引用频繁变化
  const modeObj = React.useMemo(() => ({ value: mode, setValue: setMode }), [mode, setMode]);
  const fullscreenObj = React.useMemo(() => ({ value: true, setValue: () => {} }), []);


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
        {/* <TouchableOpacity
          style={styles.fab}
          onPress={addCanvas}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.fabIcon}>＋</ThemedText>
        </TouchableOpacity> */}
        {/* 全局工具栏 */}
        <CanvasToolbar
          color={color}
          setColor={c => { setColor(c); setCustomColor(c); }}
          size={size}
          setSize={setSize}
          mode={mode}
          setMode={setMode}
          fontFamily={''}
          setFontFamily={() => {}}
          showColorPicker={showColorPicker}
          setShowColorPicker={setShowColorPicker}
          customColor={customColor}
          setCustomColor={setCustomColor}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSave={handleSave}
          onLoad={handleLoad}
          toolbarPos={{ x: 16, y: 40 }}
          toolbarHorizontalMargin={16}
          toolbarMaxWidth={Dimensions.get("window").width - 32}
          toolbarDragging={false}
          toolbarPanHandlers={{}}
          onToggleTheme={handleToggleTheme}
        />
        <View style={styles.canvasArea}>
          {/* 渲染第一个画布 */}
          {canvases.length > 0 && canvases[0] && (
            <CustomCanvas
              id={canvases[0].id}
              key={canvases[0].id}
              x={canvases[0].x}
              y={canvases[0].y}
              width={canvases[0].width}
              height={canvases[0].height}
              canvasType={CanvasType.Main} // 主画布类型
              onMoveResize={updateCanvas}
              onRemove={removeCanvas}
              canvasBg={currentTheme.colors.background} // 用主题背景色
              color={color}
              size={size}
              mode={modeObj}
              moveable={false}
              resizeable={false}
              fullscreen={fullscreenObj}
              globalData={memoizedGlobalData}
            />
          )}
          {/* 渲染其他画布 */}
          {/* {canvases.map((c, idx) => idx === 0 ? null : (
            <CustomCanvas
              id={c.id}
              key={c.id}
              x={c.x}
              y={c.y}
              width={c.width}
              height={c.height}
              canvasType={CanvasType.Child} // 子画布类型
              onMoveResize={updateCanvas}
              onRemove={removeCanvas}
              canvasBg={currentTheme.colors.background} // 用主题背景色
              color={color}
              size={size}
              mode={{
                value: mode,
                setValue: setMode
              }} // 子画布不需要 mode 状态
              globalData={
                {
                  ...globalDataSetters(c.id)
                }
              }
            />
          ))} */}
        </View>
      </View>
    </ThemeProvider>
  );
}


const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  canvasArea: { flex: 1, position: 'relative' },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32, // 由 top: 32 改为 bottom: 32
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007aff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 100,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 36,
  },
});
