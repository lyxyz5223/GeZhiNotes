import { CustomCanvasProps, StateUpdater, TextBlockInfo, TransformType } from "@/types/CanvasTypes";
import React, { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import RenderHTML from 'react-native-render-html';

const HANDLE_SIZE = 18;
const HANDLE_TOUCH_SIZE = 24;
const HANDLE_TOUCH_OFFSET = -HANDLE_TOUCH_SIZE / 2;

// 富文本数据结构扩展
export interface RichTextBlockInfo extends TextBlockInfo {
  content: string; // HTML 字符串
}

// 单个文本块组件
function CanvasTextItem({
  textBlock,
  textsInGlobal,
  setTextsInGlobal,
  active,
  setActive,
  contentsTransform
}: {
  textBlock: RichTextBlockInfo;
  textsInGlobal: RichTextBlockInfo[];
  setTextsInGlobal?: StateUpdater<RichTextBlockInfo[]>;
  active: { id: string | null; mode: 'drag' | 'resize' | 'edit' | null; corner?: 'br'|'tr'|'bl'|'tl' };
  setActive: React.Dispatch<React.SetStateAction<{ id: string | null; mode: 'drag' | 'resize' | 'edit' | null; corner?: 'br'|'tr'|'bl'|'tl' }>>;
  contentsTransform?: TransformType;
}) {
  const translateX = useSharedValue(textBlock.x);
  const translateY = useSharedValue(textBlock.y);
  const width = useSharedValue(textBlock.width || 120);
  const height = useSharedValue(textBlock.height || 40);
  const [editing, setEditing] = useState(false);
  const editorRef = React.useRef<any>(null);
  const [html, setHtml] = useState(textBlock.content || '<p style="color:#333;font-size:18px;">请输入文本</p>');
  const [showToolbar, setShowToolbar] = useState(false);
  // 动画样式，合并画布 transform
  const animatedStyle = useAnimatedStyle(() => {
    let transform: ({ translateX: number } | { translateY: number } | { scale: number })[] = [];
    if (contentsTransform) {
      transform = [
        { translateX: contentsTransform.translateX },
        { translateY: contentsTransform.translateY },
        { scale: contentsTransform.scale },
      ];
    }
    return {
      position: 'absolute',
      left: translateX.value,
      top: translateY.value,
      width: width.value,
      height: height.value,
      transform: transform.length > 0 ? transform : undefined,
      zIndex: editing ? 100 : 1,
    };
  }, [contentsTransform, editing]);

  // 点击文本块进入编辑
  const handleEdit = () => {
    setEditing(true);
    setActive({ id: textBlock.id, mode: 'edit' });
    setShowToolbar(true);
  };
  // 编辑完成保存
  const handleSave = (newHtml: string) => {
    setEditing(false);
    setShowToolbar(false);
    setHtml(newHtml);
    if (setTextsInGlobal) {
      setTextsInGlobal(prev => prev.map(item => item.id === textBlock.id ? { ...item, content: newHtml } : item));
    }
    setActive({ id: null, mode: null });
  };
  // 删除文本
  const handleDeleteText = useCallback(() => {
    if (!setTextsInGlobal) return;
    Alert.alert('删除文本', '确定要删除该文本吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => setTextsInGlobal((prev: RichTextBlockInfo[]) => (prev || []).filter(i => i.id !== textBlock.id)) }
    ]);
  }, [setTextsInGlobal, textBlock.id]);

  return (
    <GestureDetector gesture={Gesture.Tap().onEnd(handleEdit)}>
      <Animated.View style={[styles.textWrap, animatedStyle, active.id === textBlock.id && (active.mode === 'drag' || active.mode === 'edit') ? styles.active : null]}>
        {editing ? (
          <View style={{ flex: 1, minWidth: 100, minHeight: 40 }}>
            <RichEditor
              ref={editorRef}
              initialContentHTML={html}
              editorStyle={{ backgroundColor: '#fffbe6' }}
              onChange={setHtml}
              onBlur={() => handleSave(html)}
              placeholder="请输入文本"
              useContainer={false}
            />
            {showToolbar && (
              <RichToolbar
                editor={editorRef}
                actions={[actions.setBold, actions.setItalic, actions.setUnderline, actions.setStrikethrough, actions.fontSize, actions.foreColor]}
                iconTint="#007aff"
                selectedIconTint="#ff9800"
                style={{ backgroundColor: '#fff', borderRadius: 8, marginTop: 4 }}
              />
            )}
          </View>
        ) : (
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.8} onPress={handleEdit}>
            <RenderHTML contentWidth={width.value} source={{ html }} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.delBtn} onPress={handleDeleteText}>
          <Text style={{ color: '#e74c3c', fontWeight: 'bold' }}>×</Text>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
}

// 文本模块主组件
function CanvasTextModule({ props, extraParams }: { props: CustomCanvasProps; extraParams: any }) {
  // 类型断言，兼容老数据
  const textsInGlobal: RichTextBlockInfo[] = (props.globalData?.texts?.value || []).map((item: any) => ({
    ...item,
    content: item.content || '<p style="color:#333;font-size:18px;">请输入文本</p>',
    width: item.width || 120,
    height: item.height || 40,
  }));
  const setTextsInGlobal: StateUpdater<RichTextBlockInfo[]> | undefined = props.globalData?.texts?.setValue as unknown as StateUpdater<RichTextBlockInfo[]>;
  const [active, setActive] = useState<{ id: string | null; mode: 'drag' | 'resize' | 'edit' | null; corner?: 'br'|'tr'|'bl'|'tl' }>({ id: null, mode: null });
  // 画布 transform 透传
  const { canvasContentsTransform } = extraParams.contentsTransform || { canvasContentsTransform: { scale: 1, translateX: 0, translateY: 0 } };

  // 点击空白处添加文本
  const handleAddText = useCallback((e: any) => {
    if (!setTextsInGlobal) return;
    // 计算内容坐标（假设 e.nativeEvent 有 locationX/Y）
    const x = (e.nativeEvent?.locationX || 100) - (canvasContentsTransform?.translateX || 0);
    const y = (e.nativeEvent?.locationY || 100) - (canvasContentsTransform?.translateY || 0);
    setTextsInGlobal(prev => [
      ...prev,
      {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        x,
        y,
        width: 120,
        height: 40,
        content: '<p style="color:#333;font-size:18px;">请输入文本</p>',
        text: '', // Add the required 'text' property
      }
    ]);
  }, [setTextsInGlobal, canvasContentsTransform]);

  return (
    <>
      {props.mode?.value === 'text' && (
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleAddText} activeOpacity={0.8}>
          <View style={{ flex: 1 }} />
        </TouchableOpacity>
      )}
      {textsInGlobal.map((textBlock: RichTextBlockInfo) => (
        <CanvasTextItem
          key={textBlock.id}
          textBlock={textBlock}
          textsInGlobal={textsInGlobal}
          setTextsInGlobal={setTextsInGlobal}
          active={active}
          setActive={setActive}
          contentsTransform={canvasContentsTransform}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  textWrap: {
    position: 'absolute', minWidth: 60, minHeight: 32, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#fffbe6', borderRadius: 6, borderWidth: 1, borderColor: '#eee', flexDirection: 'row', alignItems: 'center',
  },
  text: {
    minWidth: 40, minHeight: 28, fontSize: 18, color: '#333',
  },
  delBtn: {
    marginLeft: 4, padding: 2, borderRadius: 8, backgroundColor: '#fff',
  },
  active: {
    borderColor: '#ff9800', borderWidth: 2,
    shadowColor: '#ff9800', shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
});

export default CanvasTextModule;
