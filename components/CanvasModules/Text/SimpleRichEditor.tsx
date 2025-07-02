import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '@react-navigation/native';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export type SimpleRichEditorProps = {
  value: string;
  onChange: (val: string) => void;
  // 新增：支持样式 props
  fontSize?: number;
  fontFamily?: string;
  fontColor?: string;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  onStyleChange?: (style: {
    fontSize: number;
    fontFamily?: string;
    fontColor: string;
    isBold: boolean;
    isItalic: boolean;
    isUnderline: boolean;
  }) => void;
};

// 工具栏图标按钮
export const ToolbarIcon = ({ color = '#fff' }) => (
  <MaterialCommunityIcons name="format-list-bulleted" size={24} color={color} />
);

// 富文本工具栏（独立组件，便于外部调用）
export const Toolbar = ({
  fontSize,
  fontFamily,
  fontColor,
  isBold,
  isItalic,
  isUnderline,
  setFontSize,
  setFontFamily,
  setFontColor,
  onStyleChange = () => {},
  onClose,
  colors: themeColors,
  fontSizeInput // 新增：是否用输入框
}: {
  fontSize: number;
  fontFamily?: string;
  fontColor: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  setFontSize: (v: number) => void;
  setFontFamily: (v?: string) => void;
  setFontColor: (v: string) => void;
  onStyleChange?: (style: any) => void;
  onClose?: () => void;
  colors?: any;
  fontSizeInput?: boolean;
}) => {
  const { colors } = useTheme();
  const mergedColors = themeColors || colors;
  return (
    <>
      {/* 关闭按钮 */}
      <TouchableOpacity onPress={onClose} style={{ position: 'absolute', right: 8, top: 8, zIndex: 10, padding: 4 }}>
        <MaterialCommunityIcons name="close" size={20} color={mergedColors.text} />
      </TouchableOpacity>
      <ScrollView style={{ maxHeight: 340, minWidth: 160, paddingTop: 8 }} contentContainerStyle={{ paddingBottom: 12 }} pointerEvents="box-none">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
          <TouchableOpacity onPress={() => onStyleChange({ isBold: !isBold, isItalic, isUnderline, fontSize, fontFamily, fontColor })} style={[styles.toolbarBtn, isBold && { backgroundColor: mergedColors.primary }]}> 
            <MaterialCommunityIcons name="format-bold" size={22} color={isBold ? '#fff' : mergedColors.text || '#333'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onStyleChange({ isBold, isItalic: !isItalic, isUnderline, fontSize, fontFamily, fontColor })} style={[styles.toolbarBtn, isItalic && { backgroundColor: mergedColors.primary }]}> 
            <MaterialCommunityIcons name="format-italic" size={22} color={isItalic ? '#fff' : mergedColors.text || '#333'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onStyleChange({ isBold, isItalic, isUnderline: !isUnderline, fontSize, fontFamily, fontColor })} style={[styles.toolbarBtn, isUnderline && { backgroundColor: mergedColors.primary }]}> 
            <MaterialCommunityIcons name="format-underline" size={22} color={isUnderline ? '#fff' : mergedColors.text || '#333'} />
          </TouchableOpacity>
        </View>
        {/* 字号选择：输入框或下拉 */}
        <View style={{ marginBottom: 10 }} pointerEvents="auto">
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ marginRight: 6, color: mergedColors.text }}>字号</Text>
            {fontSizeInput ? (
              <TextInput
                value={String(fontSize)}
                onChangeText={v => {
                  const n = parseInt(v.replace(/[^0-9]/g, ''));
                  if (!isNaN(n) && n > 0) setFontSize(n);
                }}
                keyboardType="numeric"
                style={{
                  width: 54, height: 36, borderWidth: 1, borderColor: mergedColors.border, borderRadius: 6,
                  padding: 0, textAlign: 'center', fontSize: 16, backgroundColor: mergedColors.card, color: mergedColors.text
                }}
                placeholder="字号"
                placeholderTextColor={mergedColors.text + '88'}
              />
            ) : (
              <View style={{ borderWidth: 1, borderColor: mergedColors.border, borderRadius: 6, overflow: 'hidden', backgroundColor: mergedColors.card, width: 70 }} pointerEvents="auto">
                <Picker
                  selectedValue={fontSize}
                  style={{ width: 70, height: 36, color: mergedColors.text }}
                  dropdownIconColor={mergedColors.primary}
                  onValueChange={v => setFontSize(v)}
                  mode="dropdown"
                >
                  {[14, 17, 20, 24].map(size => (
                    <Picker.Item key={size} label={size + ''} value={size} />
                  ))}
                </Picker>
              </View>
            )}
          </View>
        </View>
        {/* 字体选择 */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
          {[undefined, 'serif', 'monospace', 'sans-serif'].map((fam, idx) => (
            <TouchableOpacity key={fam || 'default'} onPress={() => setFontFamily(fam)} style={[styles.toolbarBtn, fontFamily === fam && { backgroundColor: mergedColors.primary }]}> 
              <Text style={{ color: fontFamily === fam ? '#fff' : mergedColors.text, fontFamily: fam, fontSize: 16 }}>{fam ? fam : '默认'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* 颜色选择 */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {['#333', '#007aff', '#ff9800', '#e91e63', '#4caf50', '#9c27b0'].map(c => (
            <TouchableOpacity key={c} onPress={() => setFontColor(c)} style={[styles.toolbarBtn, { backgroundColor: c, borderWidth: fontColor === c ? 2 : 0, borderColor: mergedColors.primary }]}> 
              {fontColor === c ? <MaterialCommunityIcons name="check" size={16} color="#fff" /> : null}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </>
  );
};

const SimpleRichEditor = forwardRef<{ injectJavaScript: (js: string) => void }, SimpleRichEditorProps & { showToolbar?: boolean }>((props, ref) => {
  const { value, onChange, fontSize: fontSizeProp, fontFamily: fontFamilyProp, fontColor: fontColorProp, isBold: isBoldProp, isItalic: isItalicProp, isUnderline: isUnderlineProp, onStyleChange, showToolbar = true } = props;
  const { colors } = useTheme();
  const [isBold, setBold] = useState(isBoldProp ?? false);
  const [isItalic, setItalic] = useState(isItalicProp ?? false);
  const [isUnderline, setUnderline] = useState(isUnderlineProp ?? false);
  const [fontSize, setFontSize] = useState(fontSizeProp ?? 17);
  const [fontFamily, setFontFamily] = useState<string|undefined>(fontFamilyProp);
  const [fontColor, setFontColor] = useState<string>(fontColorProp ?? '#333');
  const [toolbarVisible, setToolbarVisible] = useState(false);

  // 同步外部 props 变化
  React.useEffect(() => { if (isBoldProp !== undefined) setBold(isBoldProp); }, [isBoldProp]);
  React.useEffect(() => { if (isItalicProp !== undefined) setItalic(isItalicProp); }, [isItalicProp]);
  React.useEffect(() => { if (isUnderlineProp !== undefined) setUnderline(isUnderlineProp); }, [isUnderlineProp]);
  React.useEffect(() => { if (fontSizeProp !== undefined) setFontSize(fontSizeProp); }, [fontSizeProp]);
  React.useEffect(() => { if (fontFamilyProp !== undefined) setFontFamily(fontFamilyProp); }, [fontFamilyProp]);
  React.useEffect(() => { if (fontColorProp !== undefined) setFontColor(fontColorProp); }, [fontColorProp]);

  // 每次样式变化时回调
  React.useEffect(() => {
    onStyleChange?.({ fontSize, fontFamily, fontColor, isBold, isItalic, isUnderline });
  }, [fontSize, fontFamily, fontColor, isBold, isItalic, isUnderline, onStyleChange]);

  // 兼容外部调用格式化命令
  useImperativeHandle(ref, () => ({
    injectJavaScript: (js: string) => {
      if (js.includes("'bold'")) setBold(b => !b);
      if (js.includes("'italic'")) setItalic(i => !i);
      if (js.includes("'underline'")) setUnderline(u => !u);
    }
  }), []);

  // 只保留纯文本内容
  const handleTextChange = (val: string) => {
    // 去除<p ...>等标签，仅保留文本
    const plain = val.replace(/<[^>]+>/g, '');
    onChange(plain);
  };

  // 统一样式，确保 TextInput 和只读 Text 完全一致
  const sharedTextStyle = {
    fontWeight: isBold ? 'bold' : 'normal',
    fontStyle: isItalic ? 'italic' : 'normal',
    textDecorationLine: isUnderline ? 'underline' : 'none',
    fontSize,
    color: fontColor,
    fontFamily,
    minHeight: 100,
    minWidth: 120,
    textAlignVertical: 'top',
    // 下面这些必须和只读 Text 完全一致
    backgroundColor: colors.card || '#fffbe6',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: isBold || isItalic || isUnderline ? colors.primary : '#e0e0e0',
    padding: 10,
  } as const;

  // 传递 setFontSize/setFontFamily/setFontColor 给 Toolbar
  return (
    <View style={{ width: '100%', minWidth: 120, height: '100%', position: 'relative', overflow: 'hidden' }}>
      <TextInput
        style={[
          sharedTextStyle,
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }
        ]}
        multiline
        value={value.replace(/<[^>]+>/g, '')}
        onChangeText={handleTextChange}
        placeholder="请输入文本"
        placeholderTextColor={colors.border || '#bbb'}
        underlineColorAndroid="transparent"
      />
      {/* 工具栏按钮和菜单，仅在 showToolbar=true 时渲染 */}
      {showToolbar && (
        <View style={{ position: 'absolute', right: -52, top: 0, zIndex: 20, pointerEvents: 'box-none' }}>
          <TouchableOpacity
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 2, pointerEvents: 'auto' }}
            onPress={e => {
              setToolbarVisible(v => !v);
            }}
          >
            <MaterialCommunityIcons name="format-list-bulleted" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
      {showToolbar && toolbarVisible && (
        <View style={{ position: 'absolute', right: 0, top: 48, backgroundColor: colors.card, borderRadius: 12, padding: 12, elevation: 8, maxWidth: 320, minWidth: 180, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, zIndex: 9999, width: 220 }} pointerEvents="box-none">
          <Toolbar
            fontSize={fontSize}
            fontFamily={fontFamily}
            fontColor={fontColor}
            isBold={isBold}
            isItalic={isItalic}
            isUnderline={isUnderline}
            setFontSize={setFontSize}
            setFontFamily={setFontFamily}
            setFontColor={setFontColor}
            onStyleChange={onStyleChange}
            onClose={() => setToolbarVisible(false)}
            colors={colors}
          />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 6,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  toolbarBtn: {
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    padding: 6,
    marginRight: 4,
    marginBottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 28,
    minHeight: 28,
  },
  selected: {
    backgroundColor: '#007aff',
  },
});

SimpleRichEditor.displayName = 'SimpleRichEditor';

export default SimpleRichEditor;
