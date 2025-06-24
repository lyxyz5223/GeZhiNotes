import { useTheme } from '@react-navigation/native';
import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const COMMON_COLORS = ['#007aff', '#e74c3c', '#2ecc40'];

export enum CanvasMode {
  Select = 'select',
  Draw = 'draw',
  Text = 'text',
  Eraser = 'eraser',
  Connector = 'connector',
}

export interface CanvasToolbarProps {
  color: string;
  setColor: (c: string) => void;
  size: number;
  setSize: (s: number) => void;
  mode: CanvasMode;
  setMode: (m: CanvasMode) => void;
  fontFamily: string;
  setFontFamily: (f: string) => void;
  showColorPicker: boolean;
  setShowColorPicker: (b: boolean) => void;
  customColor: string;
  setCustomColor: (c: string) => void;
  // 新增连接相关属性
  connectNodes?: string[];
  setConnectNodes?: (nodes: string[]) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onLoad: () => void;
  toolbarPos: { x: number; y: number };
  toolbarHorizontalMargin: number;
  toolbarMaxWidth: number;
  toolbarDragging: boolean;
  toolbarPanHandlers: any;
  onToggleTheme: () => void;
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = (props) => {
  const {
    color,
    setColor,
    size,
    setSize,
    mode,
    setMode,
    fontFamily,
    setFontFamily,
    showColorPicker,
    setShowColorPicker,
    customColor,
    setCustomColor,
    connectNodes = [],
    setConnectNodes,
    onUndo,
    onRedo,
    onSave,
    onLoad,
    toolbarPos,
    toolbarHorizontalMargin,
    toolbarMaxWidth,
    toolbarDragging,
    toolbarPanHandlers,
  } = props;

  // 主题色获取
  const theme = useTheme();
  const toolbarBg = theme.colors.card || '#f8f8fa';
  const borderColor = theme.colors.border || '#ddd';
  const activeBg = theme.colors.primary + '22' || '#e0eaff';
  const activeBorder = theme.colors.primary || '#007aff';
  const iconBtnBg = theme.colors.background || '#fff';
  const iconBtnBorder = theme.colors.border || '#bbb';

  // 处理连接模式切换
  const handleConnectorPress = () => {
    if (mode === CanvasMode.Connector) {
      // 如果当前已经是连接模式，切换回选择模式并清除选择
      setMode(CanvasMode.Select);
      if (setConnectNodes) {
        setConnectNodes([]);
      }
    } else {
      // 切换到连接模式
      setMode(CanvasMode.Connector);
    }
  };

  return (
    <View
      style={[
        styles.floatingToolbar,
        {
          backgroundColor: toolbarBg,
          borderColor: borderColor,
          left: Math.max(toolbarPos.x, toolbarHorizontalMargin),
          top: toolbarPos.y,
          opacity: toolbarDragging ? 0.85 : 1,
          zIndex: 10000, // 提高工具栏的层级
          height: 48,
          minHeight: 48,
          width: toolbarMaxWidth,
          maxWidth: toolbarMaxWidth,
          paddingVertical: 0,
        },
      ]}
      {...toolbarPanHandlers}
      // 确保工具栏始终可以接收事件
      pointerEvents="auto"
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexDirection: 'row',
          alignItems: 'center',
          minWidth: '100%',
          flexGrow: 1,
        }}
        style={{ flex: 1 }}
        pointerEvents="auto"
      >
        {/* 模式切换 */}
        <TouchableOpacity
          style={[
            styles.toolbarBtn,
            mode === CanvasMode.Select && {
              backgroundColor: activeBg,
              borderColor: activeBorder,
            },
          ]}
          onPress={() => setMode(CanvasMode.Select)}
        >
          <Text style={{ fontSize: 18 }}>🔲</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toolbarBtn,
            mode === CanvasMode.Draw && {
              backgroundColor: activeBg,
              borderColor: activeBorder,
            },
          ]}
          onPress={() => setMode(CanvasMode.Draw)}
        >
          <Text style={{ fontSize: 18 }}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toolbarBtn,
            mode === CanvasMode.Text && {
              backgroundColor: activeBg,
              borderColor: activeBorder,
            },
          ]}
          onPress={() => setMode(CanvasMode.Text)}
        >
          <Text style={{ fontSize: 18 }}>🔤</Text>
        </TouchableOpacity>
        {/*节点连接*/}
        <TouchableOpacity
          style={[
            styles.toolbarBtn,
            mode === CanvasMode.Connector && {
              backgroundColor: activeBg,
              borderColor: activeBorder,
            },
          ]}
          onPress={handleConnectorPress}
        >
          <Text style={{ fontSize: 18 }}>🔗</Text>
        </TouchableOpacity>
        {/* 颜色选择 */}
        <View
          style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}
        >
          {COMMON_COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                marginHorizontal: 2,
                backgroundColor: c,
                borderWidth: color === c ? 2 : 1,
                borderColor: color === c ? activeBorder : borderColor,
              }}
              onPress={() => {
                setColor(c);
                setCustomColor(c);
              }}
            />
          ))}
          {/* 下拉调色板 */}
          <TouchableOpacity
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              marginLeft: 4,
              borderWidth: 1,
              borderColor: borderColor,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor:
                color.startsWith('#') && !COMMON_COLORS.includes(color)
                  ? color
                  : iconBtnBg,
            }}
            onPress={() => setShowColorPicker(true)}
          >
            <Text style={{ fontSize: 16 }}>🎨</Text>
          </TouchableOpacity>
          {/* 颜色调色板弹窗 */}
          <Modal
            visible={showColorPicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowColorPicker(false)}
          >
            <View style={styles.colorPickerModalBg}>
              <View style={styles.colorPickerModal}>
                <Text style={{ marginBottom: 8 }}>选择颜色</Text>
                <TextInput
                  value={customColor}
                  onChangeText={setCustomColor}
                  style={{
                    borderWidth: 1,
                    borderColor: '#ccc',
                    borderRadius: 6,
                    padding: 6,
                    marginBottom: 8,
                    width: 120,
                    textAlign: 'center',
                  }}
                  placeholder="#RRGGBB"
                />
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: customColor,
                      borderWidth: 1,
                      borderColor: '#888',
                      marginRight: 8,
                    }}
                  />
                  <Text>{customColor}</Text>
                </View>
                <View
                  style={{ flexDirection: 'row', justifyContent: 'flex-end' }}
                >
                  <TouchableOpacity
                    onPress={() => setShowColorPicker(false)}
                    style={{ marginRight: 16 }}
                  >
                    <Text style={{ color: '#888' }}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setColor(customColor);
                      setShowColorPicker(false);
                    }}
                  >
                    <Text style={{ color: '#007aff' }}>确定</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
        {/* 粗细 */}
        <View style={{ marginLeft: 8 }}>
          <Text style={{ fontSize: 16 }}>✚</Text>
          <TextInput
            value={String(size)}
            onChangeText={(v) => {
              const n = Math.max(1, Math.min(32, parseInt(v) || 1));
              setSize(n);
            }}
            keyboardType="numeric"
            style={{
              width: 32,
              height: 28,
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 6,
              padding: 0,
              textAlign: 'center',
              fontSize: 16,
              marginLeft: 2,
            }}
          />
        </View>
        {/* 橡皮擦 */}
        <TouchableOpacity
          style={[
            styles.toolbarBtn,
            mode === CanvasMode.Eraser && {
              backgroundColor: activeBg,
              borderColor: activeBorder,
            },
            { marginLeft: 8 },
          ]}
          onPress={() =>
            setMode(
              mode === CanvasMode.Eraser ? CanvasMode.Draw : CanvasMode.Eraser
            )
          }
        >
          <Text style={{ fontSize: 18 }}>🧽</Text>
        </TouchableOpacity>
        {/* 字体选择（文本模式下显示） */}
        {mode === CanvasMode.Text && (
          <View style={{ marginLeft: 8 }}>
            <Text style={{ fontSize: 16 }}>A</Text>
            <TextInput
              value={fontFamily}
              onChangeText={setFontFamily}
              placeholder="字体"
              style={{
                width: 60,
                height: 28,
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 6,
                padding: 0,
                textAlign: 'center',
                fontSize: 14,
                marginLeft: 2,
              }}
            />
          </View>
        )}
        {/* 撤销/恢复/保存/读取 图标按钮 */}
        <View style={{ flexDirection: 'row', marginLeft: 8 }}>
          <TouchableOpacity
            style={[
              styles.iconBtn,
              { backgroundColor: iconBtnBg, borderColor: iconBtnBorder },
            ]}
            onPress={onUndo}
          >
            <Text style={styles.iconBtnText}>↩️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.iconBtn,
              { backgroundColor: iconBtnBg, borderColor: iconBtnBorder },
            ]}
            onPress={onRedo}
          >
            <Text style={styles.iconBtnText}>↪️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.iconBtn,
              { backgroundColor: iconBtnBg, borderColor: iconBtnBorder },
            ]}
            onPress={onSave}
          >
            <Text style={styles.iconBtnText}>💾</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.iconBtn,
              { backgroundColor: iconBtnBg, borderColor: iconBtnBorder },
            ]}
            onPress={onLoad}
          >
            <Text style={styles.iconBtnText}>📂</Text>
          </TouchableOpacity>
          {/* 主题切换按钮 */}
          <TouchableOpacity
            style={[
              styles.iconBtn,
              {
                backgroundColor: iconBtnBg,
                borderColor: iconBtnBorder,
                marginLeft: 8,
              },
            ]}
            onPress={props.onToggleTheme}
          >
            <Text style={styles.iconBtnText}>🌓</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingToolbar: {
    position: 'absolute',
    minHeight: 48,
    backgroundColor: '#f8f8fa',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'visible',
  },
  toolbarBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  toolbarBtnActive: {
    backgroundColor: '#e0eaff',
    borderColor: '#007aff',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#bbb',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  iconBtnText: {
    fontSize: 20,
  },
  colorPickerModalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorPickerModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    width: 220,
    alignItems: 'center',
    elevation: 8,
  },
});

export default CanvasToolbar;
