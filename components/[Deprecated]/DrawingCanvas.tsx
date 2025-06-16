import { Canvas, Path, Skia, } from "@shopify/react-native-skia";
import React, { useRef, useState } from "react";
import { Alert, GestureResponderEvent, PanResponder, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import DrawingToolbar from "./DrawingToolbar";

type DrawPath = {
  path: ReturnType<typeof Skia.Path.Make>;
  color: string;
  size: number;
  isEraser?: boolean;
};

type DrawText = {
  type: 'text';
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
  fontFamily: string;
};

const STORAGE_KEY = "drawing-canvas-data";

// 字体选项（常见系统字体，支持中英文）
const FONT_OPTIONS = [
  { label: '系统默认', value: '' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: '微软雅黑', value: 'Microsoft YaHei' },
  { label: '黑体', value: 'SimHei' },
  { label: '宋体', value: 'SimSun' },
  { label: '苹方', value: 'PingFang SC' },
  { label: '楷体', value: 'KaiTi' },
  { label: '仿宋', value: 'FangSong' },
  { label: 'serif', value: 'serif' },
  { label: 'sans-serif', value: 'sans-serif' },
  { label: 'monospace', value: 'monospace' },
];

const HandwritingCanvas = () => {
  const [paths, setPaths] = useState<DrawPath[]>([]);
  const [redoStack, setRedoStack] = useState<DrawPath[]>([]);
  const [currentPath, setCurrentPath] = useState<DrawPath | null>(null);

  const [color, setColor] = useState("blue");
  const [size, setSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [mode, setMode] = useState<'draw' | 'text'>('draw');
  const [texts, setTexts] = useState<DrawText[]>([]);
  const [textInput, setTextInput] = useState('');
  const [textInputPos, setTextInputPos] = useState<{x: number, y: number} | null>(null);
  const [fontFamily, setFontFamily] = useState(''); // ''为系统默认

  // 新增：记录当前正在编辑的文本索引
  const [editingTextIndex, setEditingTextIndex] = useState<number | null>(null);

  // 记录上一次的 color/size，切换橡皮时恢复
  const lastColor = useRef(color);
  const lastSize = useRef(size);

  // 切换橡皮时自动切换颜色
  React.useEffect(() => {
    if (isEraser) {
      lastColor.current = color;
      lastSize.current = size;
      setColor("white");
      setSize(16);
    } else {
      setColor(lastColor.current);
      setSize(lastSize.current);
    }
    // eslint-disable-next-line
  }, [isEraser]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt: GestureResponderEvent) => {
      const { locationX, locationY } = evt.nativeEvent;
      const path = Skia.Path.Make();
      path.moveTo(locationX, locationY);
      setCurrentPath({ path, color, size, isEraser });
    },
    onPanResponderMove: (evt: GestureResponderEvent) => {
      if (currentPath) {
        const { locationX, locationY } = evt.nativeEvent;
        currentPath.path.lineTo(locationX, locationY);
        setCurrentPath({
          ...currentPath,
          path: currentPath.path.copy(),
        });
      }
    },
    onPanResponderRelease: () => {
      if (currentPath) {
        setPaths([...paths, currentPath]);
        setCurrentPath(null);
        setRedoStack([]); // 新操作后清空 redo
      }
    },
    onPanResponderTerminate: () => {
      if (currentPath) {
        setPaths([...paths, currentPath]);
        setCurrentPath(null);
        setRedoStack([]);
      }
    }
  });

  // 画布点击事件（文本模式下弹出输入框或新建文本）
  const handleCanvasPress = (evt: any) => {
    if (mode === 'text') {
      const { locationX, locationY } = evt.nativeEvent;
      // 检查是否点在已有文本上（简单用距离判断，后续可优化为更精确的 hit test）
      const hitIdx = texts.findIndex(t => {
        const dx = t.x - locationX;
        const dy = t.y - locationY;
        return Math.sqrt(dx*dx + dy*dy) < 30; // 30像素内算命中
      });
      if (hitIdx !== -1) {
        // 编辑已有文本
        setEditingTextIndex(hitIdx);
        setTextInput(texts[hitIdx].text);
        setTextInputPos({ x: texts[hitIdx].x, y: texts[hitIdx].y });
      } else {
        // 新建文本
        setEditingTextIndex(null);
        setTextInput('');
        setTextInputPos({ x: locationX, y: locationY });
      }
    }
  };

  // 文本输入完成（新建或编辑）
  const handleTextSubmit = () => {
    if (textInput.trim() && textInputPos) {
      if (editingTextIndex !== null) {
        setTexts(texts => texts.map((t, i) => i === editingTextIndex ? { ...t, text: textInput, x: textInputPos.x, y: textInputPos.y, color, size, fontFamily } : t));
      } else {
        const newText: DrawText = {
          type: 'text',
          text: textInput,
          x: textInputPos.x,
          y: textInputPos.y,
          color,
          size,
          fontFamily,
        };
        setTexts([...texts, newText]);
      }
      setTextInput('');
      setTextInputPos(null);
      setEditingTextIndex(null);
    }
  };

  // 取消编辑
  const handleTextCancel = () => {
    setTextInput('');
    setTextInputPos(null);
    setEditingTextIndex(null);
  };

  // 撤销（文本和路径都支持）
  const handleUndo = () => {
    if (mode === 'draw') {
      if (paths.length > 0) {
        setRedoStack([paths[paths.length - 1], ...redoStack]);
        setPaths(paths.slice(0, -1));
      }
    } else if (mode === 'text') {
      if (texts.length > 0) {
        setTexts(texts.slice(0, -1));
      }
    }
  };

  // 恢复（仅对画笔路径）
  const handleRedo = () => {
    if (mode === 'draw') {
      if (redoStack.length > 0) {
        setPaths([...paths, redoStack[0]]);
        setRedoStack(redoStack.slice(1));
      }
    }
  };

  // 保存到本地（包含文本）
  const handleSave = async () => {
    try {
      const data = {
        paths: paths.map(p => ({
          svg: p.path.toSVGString(),
          color: p.color,
          size: p.size,
          isEraser: p.isEraser,
        })),
        texts,
      };
      // @ts-ignore
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      Alert.alert("保存成功");
    } catch (e) {
      Alert.alert("保存失败", String(e));
    }
  };

  // 读取（包含文本）
  const handleLoad = async () => {
    try {
      // @ts-ignore
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      const loadedPaths = (data.paths || []).map((item: any) => ({
        path: Skia.Path.MakeFromSVGString(item.svg)!,
        color: item.color,
        size: item.size,
        isEraser: item.isEraser,
      }));
      setPaths(loadedPaths);
      setTexts(data.texts || []);
      setRedoStack([]);
      setCurrentPath(null);
      Alert.alert("读取成功");
    } catch (e) {
      Alert.alert("读取失败", String(e));
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <DrawingToolbar
        color={color}
        setColor={setColor}
        size={size}
        setSize={setSize}
        isEraser={isEraser}
        setIsEraser={setIsEraser}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleSave}
        onLoad={handleLoad}
        mode={mode}
        setMode={setMode}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
        fontOptions={FONT_OPTIONS}
      />
      <View
        style={styles.container}
        {...(mode === 'draw' ? panResponder.panHandlers : {})}
        onStartShouldSetResponder={() => mode === 'text'}
        onResponderRelease={mode === 'text' ? handleCanvasPress : undefined}
      >
        <Canvas style={styles.canvas}>
          {paths.map((p, index) => (
            <Path
              key={index}
              path={p.path}
              color={p.color}
              style="stroke"
              strokeWidth={p.size}
              strokeJoin="round"
              strokeCap="round"
            />
          ))}
          {currentPath && (
            <Path
              path={currentPath.path}
              color={currentPath.color}
              style="stroke"
              strokeWidth={currentPath.size}
              strokeJoin="round"
              strokeCap="round"
            />
          )}
        </Canvas>
        {/* 用 Text 组件渲染文本，支持系统字体 */}
        {texts.map((t, idx) => (
          <Text
            key={idx}
            style={{
              position: 'absolute',
              left: t.x,
              top: t.y,
              color: t.color,
              fontSize: t.size * 5 + 12,
              fontFamily: t.fontFamily || undefined,
              backgroundColor: 'transparent',
              zIndex: 2,
            }}
          >
            {t.text}
          </Text>
        ))}
        {/* 文本透明点击区域（便于点击编辑） */}
        {mode === 'text' && texts.map((t, idx) => (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.2}
            style={{ position: 'absolute', left: t.x - 30, top: t.y - 20, width: 80, height: 40, zIndex: 3 }}
            onPress={() => {
              setEditingTextIndex(idx);
              setTextInput(t.text);
              setTextInputPos({ x: t.x, y: t.y });
              setFontFamily(t.fontFamily || '');
              setColor(t.color);
              setSize(t.size);
            }}
          />
        ))}
        {/* 文本输入框浮层 */}
        {textInputPos && (
          <View style={{ position: 'absolute', left: textInputPos.x, top: textInputPos.y, backgroundColor: '#fff', borderRadius: 4, borderWidth: 1, borderColor: '#888', padding: 2, zIndex: 10 }}>
            <TextInput
              autoFocus
              value={textInput}
              onChangeText={setTextInput}
              onSubmitEditing={handleTextSubmit}
              onBlur={handleTextCancel}
              style={{ minWidth: 60, minHeight: 30, fontSize: size * 5 + 12, color, fontFamily: fontFamily || undefined }}
              placeholder="输入文本..."
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 2 }}>
              <TouchableOpacity onPress={handleTextSubmit} style={{ marginRight: 8 }}>
                <Text style={{ color: '#007aff' }}>确定</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleTextCancel}>
                <Text style={{ color: '#888' }}>取消</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  canvas: {
    flex: 1,
    backgroundColor: 'white',
  },
});

export default HandwritingCanvas;