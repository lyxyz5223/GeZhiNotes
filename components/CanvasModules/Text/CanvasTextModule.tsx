import { CustomCanvasProps, StateUpdater, TextBlockInfo, TransformType } from "@/types/CanvasTypes";
import React, { ForwardedRef, useCallback, useMemo, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Toolbar from "./CanvasTextToolbar";

const HANDLE_SIZE = 18;
const HANDLE_TOUCH_SIZE = 24;
const HANDLE_TOUCH_OFFSET = -HANDLE_TOUCH_SIZE / 2;

// 单个文本块组件
interface CanvasTextItemProps {
  textBlock: TextBlockInfo;
  textsInGlobal: TextBlockInfo[];A
  setTextsInGlobal?: StateUpdater<TextBlockInfo[]>;
  active: { id: string | null; mode: 'drag' | 'resize' | null; corner?: 'br'|'tr'|'bl'|'tl' };
  setActive: React.Dispatch<React.SetStateAction<{ id: string | null; mode: 'drag' | 'resize' | null; corner?: 'br'|'tr'|'bl'|'tl' }>>;
  contentsTransform?: TransformType;
  editingId?: string | null;
  setEditingId?: (id: string | null) => void;
}

const CanvasTextItem = React.forwardRef(function CanvasTextItem(
  props: CanvasTextItemProps,
  ref: ForwardedRef<any>
) {
  const {
    textBlock,
    textsInGlobal,
    setTextsInGlobal,
    active,
    setActive,
    contentsTransform,
    editingId,
    setEditingId,
  } = props;
  const translateX = useSharedValue(textBlock.x);
  const translateY = useSharedValue(textBlock.y);
  const width = useSharedValue(120);
  const height = useSharedValue(40);

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
    };
  });

  // 编辑相关
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(typeof textBlock.text === 'string' ? textBlock.text : '');
  const inputRef = useRef<TextInput>(null);

  // 保证 editValue 与 textBlock.text 同步（组件复用/props 变化时）
  React.useEffect(() => {
    if (isEditing) {
      setEditValue(typeof textBlock.text === 'string' ? textBlock.text : '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, textBlock.id]);

  const tapGesture = useMemo(() =>
    Gesture.Tap()
      .runOnJS(true)
      .onBegin(() => {
      })
      .onEnd(() => {
      })
    ,[]);
  // 拖动手势
  const panGesture = useMemo(() =>
    Gesture.Pan()
      .onBegin(() => {
        runOnJS(setActive)({ id: textBlock.id, mode: 'drag' });
      })
      .onUpdate(e => {
        const scale = contentsTransform?.scale ?? 1;
        translateX.value = textBlock.x + e.translationX / scale;
        translateY.value = textBlock.y + e.translationY / scale;
      })
      .onEnd(() => {
        runOnJS(setActive)({ id: null, mode: null });
        if (setTextsInGlobal) {
          let newArr: TextBlockInfo[] = textsInGlobal.map((item: TextBlockInfo) =>
            item.id === textBlock.id
              ? { ...item, x: Number(translateX.value), y: Number(translateY.value) }
              : item
          );
          runOnJS(setTextsInGlobal)(newArr);
        }
      })
    ,[setTextsInGlobal, textBlock.id, textBlock.x, textBlock.y, contentsTransform, translateX, translateY, setActive, textsInGlobal]);

    // 双击手势，直接进入编辑并激活当前文本块（不再直接 focus）
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(setActive)({ id: textBlock.id, mode: 'drag' });
      runOnJS(setEditValue)(typeof textBlock.text === 'string' ? textBlock.text : '');
      runOnJS(setIsEditing)(true);
    });

  // 监听 isEditing，变为 true 时安全 focus
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // 组合手势，保证拖动、单击、双击都能响应
  const composedGesture = Gesture.Simultaneous(panGesture, tapGesture, doubleTapGesture);

  // 删除文本
  const handleDeleteText = useCallback(() => {
    if (!setTextsInGlobal) return;
    Alert.alert('删除文本', '确定要删除该文本吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => setTextsInGlobal((prev: TextBlockInfo[]) => (prev || []).filter(i => i.id !== textBlock.id)) }
    ]);
  }, [setTextsInGlobal, textBlock.id]);

  const handleContentSizeChange = (e: any) => {
    const contentSize = e?.nativeEvent?.contentSize;
    if (!contentSize) return;
    const { width: newWidth, height: newHeight } = contentSize;
    // 更新文本框尺寸（保留最小宽度/高度）
    width.value = Math.max(newWidth + 12, 60); // +12 是 padding
    height.value = Math.max(newHeight + 8, 32);
  };

  const handleTextLayout = (e: any) => {
    const layout = e?.nativeEvent?.layout;
    if (!layout) return;
    const { width: newWidth, height: newHeight } = layout;
    width.value = Math.max(newWidth + 12, 60);
    height.value = Math.max(newHeight + 8, 32);
  };

  // 编辑完成
  const handleEndEditing = () => {
    setIsEditing(false);
    if (setTextsInGlobal) {
      let newArr: TextBlockInfo[] = textsInGlobal.map((item: TextBlockInfo) =>
        item.id === textBlock.id ? { 
          ...item, 
          text: editValue,
          width: width.value,
          height: height.value
        } : item
      );
      setTextsInGlobal(newArr);
    }
  };

  // 保证 editValue 始终与 textBlock.text 同步，且为 string
  React.useEffect(() => {
    if (!isEditing) {
      setEditValue(typeof textBlock.text === 'string' ? textBlock.text : '');
    }
  }, [textBlock.text, isEditing]);
  
return (
  <GestureDetector gesture={composedGesture}>
    <Animated.View
      style={[styles.textWrap, animatedStyle, active.id === textBlock.id && active.mode === 'drag' ? styles.active : null]}
    >
      {isEditing ? (
        <TextInput
          ref={inputRef}
          style={[
            styles.text,
            {
              width: 'auto', // 关键：允许宽度自适应
              minWidth: 60,  // 设置最小宽度（可选）
              padding: 0,    // 避免内边距影响计算
              fontFamily: textBlock.fontFamily || 'System',
              color: textBlock.color || '#000000',
              fontSize: textBlock.fontSize || 16,
            }
          ]}
          value={editValue}
          onChangeText={setEditValue}
          onContentSizeChange={handleContentSizeChange} // 动态调整大小
          multiline // 允许换行
          onEndEditing={handleEndEditing}
          onBlur={() => setIsEditing(false)}
          autoFocus
        />
      ) : (
        <Text 
          style={[
            styles.text,
            {
              fontFamily: textBlock.fontFamily || 'System',
              color: textBlock.color || '#000000',
              fontSize: textBlock.fontSize || 16,
            }
          ]}
          onTextLayout={handleTextLayout} // 静态文本尺寸测量//
        >
          {textBlock.text}
        </Text>
      )}
      <TouchableOpacity style={styles.delBtn} onPress={handleDeleteText}>
        <Text style={{ color: '#e74c3c', fontWeight: 'bold' }}>×</Text>
      </TouchableOpacity>
    </Animated.View>
  </GestureDetector>
  );
});

// 文本模块主组件
function CanvasTextModule({ props, extraParams }: { props: CustomCanvasProps; extraParams: any }) {
  const textsInGlobal: TextBlockInfo[] = props.globalData?.texts?.value || [];
  const setTextsInGlobal: StateUpdater<TextBlockInfo[]> | undefined = props.globalData?.texts?.setValue;
  const [active, setActive] = useState<{ id: string | null; mode: 'drag' | 'resize' | null; corner?: 'br'|'tr'|'bl'|'tl' }>({ id: null, mode: null });
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingItemRef = useRef<any>(null);
  // 画布 transform 透传
  const { canvasContentsTransform } = extraParams.contentsTransform || { canvasContentsTransform: { scale: 1, translateX: 0, translateY: 0 } };
  // 更新文本样式
  const updateTextStyle = (id: string, style: Partial<TextBlockInfo>) => {
    if (setTextsInGlobal) { // 检查 setTextsInGlobal 是否被定义
    setTextsInGlobal(prevTexts => 
      prevTexts.map(text => 
        text.id === id ? { ...text, ...style } : text
      )
    );
  }
  };
  // 处理字体变化
  const handleFontChange = (font: string) => {
    if (active.id) {
      updateTextStyle(active.id, { fontFamily: font });
    }
  };

  // 处理颜色变化
  const handleColorChange = (color: string) => {
    if (active.id) {
      updateTextStyle(active.id, { color });
    }
  };

  // 处理字号变化
  const handleSizeChange = (size: number) => {
    if (active.id) {
      updateTextStyle(active.id, { fontSize: size });
    }
  };
  // 新建文本框方法
  const addTextBlock = (x = 100, y = 100) => {
    if (!setTextsInGlobal) return;
    const id = Date.now().toString();
    setTextsInGlobal([
      ...textsInGlobal,
      {
        id,
        text: '',
        x,
        y,
        color: '#000000',
        fontSize: 16,
        fontFamily: 'System'
      } as TextBlockInfo
    ]);
    setEditingId(id);
  };

  // 只允许空白区域点击新建文本框
  const handleCanvasPress = (e: any) => {
    if (editingId) {
      if (editingItemRef.current && editingItemRef.current.blur) {
        editingItemRef.current.blur();
      }
      return;
    }
    // 获取点击位置（相对于画布）
    const { locationX, locationY } = e.nativeEvent || {};
    addTextBlock(locationX ?? 100, locationY ?? 100);
  };

  return (
      <Pressable style={{ flex: 1 }} onPressIn={handleCanvasPress}>
        <View style={{ flex: 1 }} pointerEvents="box-none">
          {textsInGlobal.map((textBlock: TextBlockInfo) => (
            <CanvasTextItem
              key={textBlock.id}
              ref={editingId === textBlock.id ? editingItemRef : undefined}
              textBlock={textBlock}
              textsInGlobal={textsInGlobal}
              setTextsInGlobal={setTextsInGlobal}
              active={active}
              setActive={setActive}
              contentsTransform={canvasContentsTransform}
              editingId={editingId}
              setEditingId={setEditingId}
            />
          ))}
        </View>
        {/* 添加工具栏 */}
        <Toolbar 
          onFontChange={handleFontChange}
          onColorChange={handleColorChange}
          onSizeChange={handleSizeChange}
          activeId={active.id}
        />
      </Pressable>
  );
}

const styles = StyleSheet.create({
  textWrap: {
    position: 'absolute', minWidth: 60, minHeight: 32, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#fffbe6', borderRadius: 6, borderWidth: 1, borderColor: '#eee', flexDirection: 'row', alignItems: 'center',
  },
  text: {
    minWidth: 40, minHeight: 28,includeFontPadding: false,
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
