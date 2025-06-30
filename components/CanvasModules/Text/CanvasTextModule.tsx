import { CustomCanvasProps, StateUpdater, TextBlockInfo, TransformType } from "@/types/CanvasTypes";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

const HANDLE_SIZE = 18;
const HANDLE_TOUCH_SIZE = 24;
const HANDLE_TOUCH_OFFSET = -HANDLE_TOUCH_SIZE / 2;

// 单个文本块组件
function CanvasTextItem({
  textBlock,
  textsInGlobal,
  setTextsInGlobal,
  active,
  setActive,
  contentsTransform
}: {
  textBlock: TextBlockInfo;
  textsInGlobal: TextBlockInfo[];
  setTextsInGlobal?: StateUpdater<TextBlockInfo[]>;
  active: { id: string | null; mode: 'drag' | 'resize' | null; corner?: 'br'|'tr'|'bl'|'tl' };
  setActive: React.Dispatch<React.SetStateAction<{ id: string | null; mode: 'drag' | 'resize' | null; corner?: 'br'|'tr'|'bl'|'tl' }>>;
  contentsTransform?: TransformType;
}) {
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
  }, [contentsTransform]);

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

  const gesture = useMemo(() => {
    return Gesture.Simultaneous(
      tapGesture,
      panGesture
    );
  }, [tapGesture, panGesture]);
  // 删除文本
  const handleDeleteText = useCallback(() => {
    if (!setTextsInGlobal) return;
    Alert.alert('删除文本', '确定要删除该文本吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => setTextsInGlobal((prev: TextBlockInfo[]) => (prev || []).filter(i => i.id !== textBlock.id)) }
    ]);
  }, [setTextsInGlobal, textBlock.id]);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.textWrap, animatedStyle, active.id === textBlock.id && active.mode === 'drag' ? styles.active : null]}>
        <Text style={styles.text}>{textBlock.text}</Text>
        <TouchableOpacity style={styles.delBtn} onPress={handleDeleteText}>
          <Text style={{ color: '#e74c3c', fontWeight: 'bold' }}>×</Text>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
}

// 文本模块主组件
function CanvasTextModule({ props, extraParams }: { props: CustomCanvasProps; extraParams: any }) {
  const textsInGlobal: TextBlockInfo[] = props.globalData?.texts?.value || [];
  const setTextsInGlobal: StateUpdater<TextBlockInfo[]> | undefined = props.globalData?.texts?.setValue;
  const [active, setActive] = useState<{ id: string | null; mode: 'drag' | 'resize' | null; corner?: 'br'|'tr'|'bl'|'tl' }>({ id: null, mode: null });
  // 画布 transform 透传
  const { canvasContentsTransform } = extraParams.contentsTransform || { canvasContentsTransform: { scale: 1, translateX: 0, translateY: 0 } };

  return (
    <View style={{ flex: 1 }}>
      {textsInGlobal.map((textBlock: TextBlockInfo) => (
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
    </View>
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
