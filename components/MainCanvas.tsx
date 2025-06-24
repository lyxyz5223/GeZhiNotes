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

// 工具函数：包装 setPaths 以兼容函数式 setState 写法
function createSetPaths(setter: (paths: any[]) => void, getCurrent: () => any[]) {
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

  // 撤销（全局撤回，找到上一笔所在的画布并撤销）
  const handleUndo = () => {
    const last = undoRedo.undo();
    setAllPaths(prev => {
      return last ? last : {};
    });
  };

  // redo（重做）
  const handleRedo = () => {
    const next = undoRedo.redo();
    if (next)
    {
      setAllPaths(prev => {
        return next;
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
              onMoveResize={updateCanvas}
              onRemove={removeCanvas}
              canvasBg={currentTheme.colors.background} // 用主题背景色
              color={color}
              size={size}
              pathsInGlobal={allPaths[canvases[0].id] || []}
              setPathsInGlobal={setPaths(canvases[0])}
              mode={mode}
              moveable={false}
              resizeable={false}
            />
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
          ))}
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
