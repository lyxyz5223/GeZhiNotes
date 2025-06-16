import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import React, { useState } from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { darkTheme, lightTheme } from "./CanvasTheme";
import CanvasToolbar, { CanvasMode } from "./CanvasToolbar";
import CustomCanvas from "./CustomCanvas";

const INIT_SIZE = 300;

export type EmbeddedCanvasData = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

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
  const [canvases, setCanvases] = useState<EmbeddedCanvasData[]>(
    [
      { id: "canvas-1", x: 0, y: 0, width: Dimensions.get("window").width, height: Dimensions.get("window").height - 60 },
    ]
  );
  const [isDark, setIsDark] = useState(false);
  // 工具栏状态
  const [color, setColor] = useState("#007aff");
  const [size, setSize] = useState(4);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState("#007aff");
  const [mode, setMode] = useState(CanvasMode.Draw);

  // 全局 paths 状态
  const [allPaths, setAllPaths] = useState<{ [id: string]: any[] }>({});
  // redo 栈：每项 { canvasId, path }
  const [/*redoStack*/, setRedoStack] = useState<{ canvasId: string, path: any }[]>([]);

  // 主题切换方法
  const handleToggleTheme = () => setIsDark(d => !d);

  // 添加新嵌入画布（居中）
  const addCanvas = () => {
      const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
      setCanvases(cs => [
          ...cs,
          {
              id: `canvas-${Date.now()}`,
              x: (screenWidth - INIT_SIZE) / 2,
              y: (screenHeight - INIT_SIZE) / 2,
              width: INIT_SIZE,
              height: INIT_SIZE,
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
    setAllPaths(prev => {
      let lastCanvasId: string | null = null;
      let lastIndex = -1;
      let lastTimestamp = -1;
      for (const cid of Object.keys(prev)) {
        const paths = prev[cid];
        if (paths && paths.length > 0) {
          const ts = paths[paths.length - 1]?.timestamp || 0;
          if (ts > lastTimestamp || (ts === -1 && lastIndex < paths.length - 1)) {
            lastTimestamp = ts;
            lastCanvasId = cid;
            lastIndex = paths.length - 1;
          }
        }
      }
      if (!lastCanvasId || lastIndex < 0) return prev;
      // 将被撤销的 path 推入 redoStack
      const removedPath = prev[lastCanvasId][lastIndex];
      setRedoStack(stack => [...stack, { canvasId: lastCanvasId!, path: removedPath }]);
      return { ...prev, [lastCanvasId]: prev[lastCanvasId].slice(0, -1) };
    });
  };

  // redo（重做）
  const handleRedo = () => {
    setRedoStack(stack => {
      if (stack.length === 0) return stack;
      const last = stack[stack.length - 1];
      setAllPaths(prev => {
        const prevPaths = prev[last.canvasId] || [];
        return { ...prev, [last.canvasId]: [...prevPaths, last.path] };
      });
      return stack.slice(0, -1);
    });
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
    <ThemeProvider value={isDark ? { ...darkTheme, fonts: DarkTheme.fonts } : { ...lightTheme, fonts: DefaultTheme.fonts }}>
      <View style={[styles.root, { backgroundColor: isDark ? '#181a20' : '#fffbe6' }]}> {/* 根背景色同步主题 */}
        {/* 浮动加号按钮 */}
        <TouchableOpacity
          style={styles.fab}
          onPress={addCanvas}
          activeOpacity={0.8}
        >
          <Text style={styles.fabIcon}>＋</Text>
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
              key={canvases[0].id}
              id={canvases[0].id}
              x={canvases[0].x}
              y={canvases[0].y}
              width={Dimensions.get("window").width}
              height={Dimensions.get("window").height - 60}
              onMoveResize={updateCanvas}
              onRemove={removeCanvas}
              onToggleTheme={handleToggleTheme}
              canvasBg={isDark ? '#23242a' : '#fffbe6'}
              color={color}
              size={size}
              paths={allPaths[canvases[0].id] || []}
              setPaths={createSetPaths(
                paths => setAllPaths(prev => ({ ...prev, [canvases[0].id]: paths })),
                () => allPaths[canvases[0].id] || []
              )}
              mode={mode}
              moveable={false} // 第一个画布不允许移动或缩放
              resizeable={false} // 第一个画布不允许缩放
            />
          )}
          {/* 渲染其他画布 */}
          {canvases.map((c, idx) => idx === 0 ? null : (
            <CustomCanvas
              key={c.id}
              id={c.id}
              x={c.x}
              y={c.y}
              width={idx === 0 ? Dimensions.get("window").width : c.width}
              height={idx === 0 ? Dimensions.get("window").height - 60 : c.height}
              onMoveResize={updateCanvas}
              onRemove={removeCanvas}
              onToggleTheme={handleToggleTheme}
              canvasBg={isDark ? '#23242a' : '#fffbe6'}
              color={color}
              size={size}
              paths={allPaths[c.id] || []}
              setPaths={createSetPaths(
                paths => setAllPaths(prev => ({ ...prev, [c.id]: paths })),
                () => allPaths[c.id] || []
              )}
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
