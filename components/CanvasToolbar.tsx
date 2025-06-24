import { COMMON_COLORS } from "@/constants/CanvasConstants";
import { CanvasMode, CanvasToolbarProps } from "@/types/CanvasTypes";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ThemedText from "./ThemedText";
import ThemedTextInput from "./ThemedTextInput";

const CanvasToolbar: React.FC<CanvasToolbarProps> = (props) => {
  const {
    color, setColor, size, setSize, mode, setMode, fontFamily, setFontFamily,
    showColorPicker, setShowColorPicker, customColor, setCustomColor,
    onUndo, onRedo, onSave, onLoad,
    toolbarPos, toolbarHorizontalMargin, toolbarMaxWidth, toolbarDragging, toolbarPanHandlers
  } = props;

  // 主题色获取
  const theme = useTheme();
  const toolbarBg = theme.colors.card || '#f8f8fa';
  const borderColor = theme.colors.border || '#ddd';
  const activeBg = theme.colors.primary + '22' || '#e0eaff';
  const activeBorder = theme.colors.primary || '#007aff';
  // const textColor = theme.colors.text || '#222'; // 已由 ThemedTextInput 统一处理，无需单独变量
  const iconBtnBg = theme.colors.background || '#fff';
  const iconBtnBorder = theme.colors.border || '#bbb';

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
          zIndex: 20,
          height: 48,
          minHeight: 48,
          width: toolbarMaxWidth,
          maxWidth: toolbarMaxWidth,
          paddingVertical: 0,
        }
      ]}
      {...toolbarPanHandlers}
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
      >
        {/* 模式切换 */}
        <TouchableOpacity
          style={[styles.toolbarBtn, mode === CanvasMode.Hand && { backgroundColor: activeBg, borderColor: activeBorder }]}
          onPress={() => setMode(CanvasMode.Hand)}
        >
          <ThemedText style={{ fontSize: 18 }}>🔲</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolbarBtn, mode === CanvasMode.Draw && { backgroundColor: activeBg, borderColor: activeBorder }]}
          onPress={() => setMode(CanvasMode.Draw)}
        >
          <ThemedText style={{ fontSize: 18 }}>✏️</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolbarBtn, mode === CanvasMode.Text && {backgroundColor: activeBg, borderColor: activeBorder}]}
          onPress={() => setMode(CanvasMode.Text)}
        >
          <ThemedText style={{ fontSize: 18 }}>🔤</ThemedText>
        </TouchableOpacity>
        {/* 颜色选择 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
          {COMMON_COLORS.map(c => (
            <TouchableOpacity
              key={c}
              style={{
                width: 24, height: 24, borderRadius: 12, marginHorizontal: 2,
                backgroundColor: c,
                borderWidth: color === c ? 2 : 1,
                borderColor: color === c ? activeBorder : borderColor,
              }}
              onPress={() => { setColor(c); setCustomColor(c); }}
            />
          ))}
          {/* 下拉调色板 */}
          <TouchableOpacity
            style={{
              width: 28, height: 28, borderRadius: 14, marginLeft: 4,
              borderWidth: 1, borderColor: borderColor, alignItems: 'center', justifyContent: 'center',
              backgroundColor: color.startsWith('#') && !COMMON_COLORS.includes(color) ? color : iconBtnBg
            }}
            onPress={() => setShowColorPicker(true)}
          >
            <ThemedText style={{ fontSize: 16 }}>🎨</ThemedText>
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
                <ThemedText style={{ marginBottom: 8 }}>选择颜色</ThemedText>
                <ThemedTextInput
                  value={customColor}
                  onChangeText={setCustomColor}
                  style={{
                    borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 6, marginBottom: 8,
                    width: 120, textAlign: 'center'
                  }}
                  placeholder="#RRGGBB"
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View
                    style={{
                      width: 32, height: 32, borderRadius: 16, backgroundColor: customColor,
                      borderWidth: 1, borderColor: '#888', marginRight: 8
                    }}
                  />
                  <ThemedText>{customColor}</ThemedText>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
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
                    <Text style={{ color: theme.colors.primary }}>确定</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
        {/* 粗细 */}
        <ThemedText style={{ fontSize: 16, marginLeft: 8 }}>Size:</ThemedText>
        <View style={{ marginLeft: 0 }}>
          <ThemedTextInput
            value={String(size)}
            onChange={v => {
              v.nativeEvent.text = v.nativeEvent.text.replace(/[^0-9]/g, ''); // 只允许数字输入
              const num = v.nativeEvent.text.trim();
              if (!num || isNaN(Number(num))) {
                setSize(0); // 如果输入无效，重置为0
                return;
              }
              const n = Math.max(1, parseInt(num));
              setSize(n);
            }}
            keyboardType="numeric"
            style={{
              width: 32, height: 28, borderWidth: 1, borderColor: '#ccc', borderRadius: 6,
              padding: 0, textAlign: 'center', fontSize: 16, marginLeft: 2
            }}
          />
        </View>
        {/* 橡皮擦 */}
        <TouchableOpacity
          style={[styles.toolbarBtn, mode === CanvasMode.Eraser && {backgroundColor: activeBg, borderColor: activeBorder}, { marginLeft: 8 }]}
          onPress={() => setMode(mode === CanvasMode.Eraser ? CanvasMode.Draw : CanvasMode.Eraser)}
        >
          <ThemedText style={{ fontSize: 18 }}>🧽</ThemedText>
        </TouchableOpacity>
        {/* 字体选择（文本模式下显示） */}
        {mode === CanvasMode.Text && (
          <View style={{ marginLeft: 8 }}>
            <ThemedText style={{ fontSize: 16 }}>A</ThemedText>
            <ThemedTextInput
              value={fontFamily}
              onChangeText={setFontFamily}
              placeholder="字体"
              style={{
                width: 60, height: 28, borderWidth: 1, borderColor: '#ccc', borderRadius: 6,
                padding: 0, textAlign: 'center', fontSize: 14, marginLeft: 2
              }}
            />
          </View>
        )}
        {/* 撤销/恢复/保存/读取 图标按钮 */}
        <View style={{ flexDirection: 'row', marginLeft: 8 }}>
          <TouchableOpacity style={[styles.iconBtn, {backgroundColor: iconBtnBg, borderColor: iconBtnBorder}]} onPress={onUndo}>
            <ThemedText style={styles.iconBtnText}>↩️</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, {backgroundColor: iconBtnBg, borderColor: iconBtnBorder}]} onPress={onRedo}>
            <ThemedText style={styles.iconBtnText}>↪️</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, {backgroundColor: iconBtnBg, borderColor: iconBtnBorder}]} onPress={onSave}>
            <ThemedText style={styles.iconBtnText}>💾</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, {backgroundColor: iconBtnBg, borderColor: iconBtnBorder}]} onPress={onLoad}>
            <ThemedText style={styles.iconBtnText}>📂</ThemedText>
          </TouchableOpacity>
          {/* 主题切换按钮 */}
          <TouchableOpacity
            style={[styles.iconBtn, {backgroundColor: iconBtnBg, borderColor: iconBtnBorder, marginLeft: 8}]}
            onPress={props.onToggleTheme}
          >
            <ThemedText style={styles.iconBtnText}>🌓</ThemedText>
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
