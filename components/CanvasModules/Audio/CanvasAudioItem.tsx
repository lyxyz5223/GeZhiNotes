import { AudioBlockInfo, TransformType } from "@/types/CanvasTypes";
import { MaterialIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import React, { useCallback, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from "react-native-reanimated";

const CanvasAudioItem: React.FC<{
  audio: AudioBlockInfo;
  audiosInGlobal: [AudioBlockInfo[], React.Dispatch<React.SetStateAction<AudioBlockInfo[]>>];
  contentsTransform: TransformType;
}> = ({ audio, audiosInGlobal, contentsTransform }) => {
  // 拖动相关
  const translateX = useSharedValue(audio.x);
  const translateY = useSharedValue(audio.y);

  // 独立音频播放状态
  const [soundObj, setSoundObj] = useState<Audio.Sound | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // 音频块宽度和高度支持动态调整，初始值由外部audio传入
  const [blockWidth, setBlockWidth] = useState(
    typeof audio.width === 'number' ? audio.width : 180
  );
  const [blockHeight, setBlockHeight] = useState(
    typeof audio.height === 'number' ? audio.height : 40
  );
  const blockWidthRef = useRef(blockWidth);
  React.useEffect(() => { blockWidthRef.current = blockWidth; }, [blockWidth]);
  const blockHeightRef = useRef(blockHeight);
  React.useEffect(() => { blockHeightRef.current = blockHeight; }, [blockHeight]);
  // resize 拖动起点
  const leftResizeStart = useRef({ width: 0, x: 0 });
  const rightResizeStart = useRef({ width: 0 });
  const topResizeStart = useRef({ height: 0, y: 0 });
  const bottomResizeStart = useRef({ height: 0 });

  // 四角resize拖拽起点
  const tlResizeStart = useRef({ width: 0, height: 0, x: 0, y: 0 });
  const trResizeStart = useRef({ width: 0, height: 0, y: 0 });
  const blResizeStart = useRef({ width: 0, height: 0, x: 0 });
  const brResizeStart = useRef({ width: 0, height: 0 });

  // 动态计算最小宽度：按钮+间距+padding+文本最小宽度
  const playBtnW = 32;
  const delBtnW = 24;
  const btnGap = 6; // playBtn右margin
  const paddingH = 8 * 2; // 左右padding
  const minTextW = 32; // 文本最小宽度
  const MIN_WIDTH = playBtnW + btnGap + delBtnW + paddingH + minTextW;

  // 动态计算最小高度（按钮高度+padding，保证内容不裁切）
  const playBtnH = 32;
  const delBtnH = 24;
  const paddingV = 4 * 2; // 上下padding
  const minTextH = 16; // 文本最小高度
  const MIN_HEIGHT = Math.max(playBtnH, delBtnH) + paddingV + minTextH;

  // 合理的最小宽度（与按钮宽度一致）
  // const MIN_WIDTH = 32;

  // 拖动宽度时，实时更新 blockWidth
  const leftResizeGesture = React.useMemo(() =>
    Gesture.Pan()
      .onBegin(() => {
        runOnJS(setIsResizing)(true);
        leftResizeStart.current = { width: blockWidthRef.current, x: translateX.value };
      })
      .onUpdate(e => {
        const scale = contentsTransform?.scale ?? 1;
        const startWidth = leftResizeStart.current.width;
        const startX = leftResizeStart.current.x;
        let newWidth = startWidth - e.translationX / scale;
        let newX = startX + e.translationX / scale;
        if (newWidth < MIN_WIDTH) {
          newX -= (MIN_WIDTH - newWidth);
          newWidth = MIN_WIDTH;
        }
        setBlockWidth(newWidth);
        blockWidthRef.current = newWidth;
        translateX.value = newX;
      })
      .onEnd(() => {
        runOnJS(setIsResizing)(false);
        audiosInGlobal[1]((prev: AudioBlockInfo[]) =>
          (prev || []).map(a => a.id === audio.id ? { ...a, width: blockWidthRef.current, x: translateX.value } : a)
        );
      })
      .runOnJS(true),
    [contentsTransform, translateX, audiosInGlobal, audio.id, MIN_WIDTH]
  );
  const rightResizeGesture = React.useMemo(() =>
    Gesture.Pan()
      .onBegin(() => {
        runOnJS(setIsResizing)(true);
        rightResizeStart.current = { width: blockWidthRef.current };
      })
      .onUpdate(e => {
        const scale = contentsTransform?.scale ?? 1;
        const startWidth = rightResizeStart.current.width;
        let newWidth = startWidth + e.translationX / scale;
        if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
        setBlockWidth(newWidth);
        blockWidthRef.current = newWidth;
      })
      .onEnd(() => {
        runOnJS(setIsResizing)(false);
        audiosInGlobal[1]((prev: AudioBlockInfo[]) =>
          (prev || []).map(a => a.id === audio.id ? { ...a, width: blockWidthRef.current } : a)
        );
      })
      .runOnJS(true),
    [contentsTransform, audiosInGlobal, audio.id, MIN_WIDTH]
  );
  // 拖动高度时，实时更新 blockHeight
  const topResizeGesture = React.useMemo(() =>
    Gesture.Pan()
      .onBegin(() => {
        runOnJS(setIsResizing)(true);
        topResizeStart.current = { height: blockHeightRef.current, y: translateY.value };
      })
      .onUpdate(e => {
        const scale = contentsTransform?.scale ?? 1;
        const startHeight = topResizeStart.current.height;
        const startY = topResizeStart.current.y;
        let newHeight = startHeight - e.translationY / scale;
        let newY = startY + e.translationY / scale;
        if (newHeight < MIN_HEIGHT) {
          newY -= (MIN_HEIGHT - newHeight);
          newHeight = MIN_HEIGHT;
        }
        setBlockHeight(newHeight);
        blockHeightRef.current = newHeight;
        translateY.value = newY;
      })
      .onEnd(() => {
        runOnJS(setIsResizing)(false);
        audiosInGlobal[1]((prev: AudioBlockInfo[]) =>
          (prev || []).map(a => a.id === audio.id ? { ...a, height: blockHeightRef.current, y: translateY.value } : a)
        );
      })
      .runOnJS(true),
    [contentsTransform, translateY, audiosInGlobal, audio.id, MIN_HEIGHT]
  );
  const bottomResizeGesture = React.useMemo(() =>
    Gesture.Pan()
      .onBegin(() => {
        runOnJS(setIsResizing)(true);
        bottomResizeStart.current = { height: blockHeightRef.current };
      })
      .onUpdate(e => {
        const scale = contentsTransform?.scale ?? 1;
        const startHeight = bottomResizeStart.current.height;
        let newHeight = startHeight + e.translationY / scale;
        if (newHeight < MIN_HEIGHT) newHeight = MIN_HEIGHT;
        setBlockHeight(newHeight);
        blockHeightRef.current = newHeight;
      })
      .onEnd(() => {
        runOnJS(setIsResizing)(false);
        audiosInGlobal[1]((prev: AudioBlockInfo[]) =>
          (prev || []).map(a => a.id === audio.id ? { ...a, height: blockHeightRef.current } : a)
        );
      })
      .runOnJS(true),
    [contentsTransform, audiosInGlobal, audio.id, MIN_HEIGHT]
  );
  // 左上角拖拽
  const tlResizeGesture = React.useMemo(() =>
    Gesture.Pan()
      .onBegin(() => {
        runOnJS(setIsResizing)(true);
        tlResizeStart.current = { width: blockWidthRef.current, height: blockHeightRef.current, x: translateX.value, y: translateY.value };
      })
      .onUpdate(e => {
        const scale = contentsTransform?.scale ?? 1;
        const s = tlResizeStart.current;
        let newWidth = s.width - e.translationX / scale;
        let newHeight = s.height - e.translationY / scale;
        let newX = s.x + e.translationX / scale;
        let newY = s.y + e.translationY / scale;
        if (newWidth < MIN_WIDTH) {
          newX -= (MIN_WIDTH - newWidth);
          newWidth = MIN_WIDTH;
        }
        if (newHeight < MIN_HEIGHT) {
          newY -= (MIN_HEIGHT - newHeight);
          newHeight = MIN_HEIGHT;
        }
        setBlockWidth(newWidth);
        setBlockHeight(newHeight);
        blockWidthRef.current = newWidth;
        blockHeightRef.current = newHeight;
        translateX.value = newX;
        translateY.value = newY;
      })
      .onEnd(() => {
        runOnJS(setIsResizing)(false);
        audiosInGlobal[1]((prev: AudioBlockInfo[]) =>
          (prev || []).map(a => a.id === audio.id ? { ...a, width: blockWidthRef.current, height: blockHeightRef.current, x: translateX.value, y: translateY.value } : a)
        );
      })
      .runOnJS(true),
    [contentsTransform, translateX, translateY, audiosInGlobal, audio.id, MIN_WIDTH, MIN_HEIGHT]
  );
  // 右上角拖拽
  const trResizeGesture = React.useMemo(() =>
    Gesture.Pan()
      .onBegin(() => {
        runOnJS(setIsResizing)(true);
        trResizeStart.current = { width: blockWidthRef.current, height: blockHeightRef.current, y: translateY.value };
      })
      .onUpdate(e => {
        const scale = contentsTransform?.scale ?? 1;
        const s = trResizeStart.current;
        let newWidth = s.width + e.translationX / scale;
        let newHeight = s.height - e.translationY / scale;
        let newY = s.y + e.translationY / scale;
        if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
        if (newHeight < MIN_HEIGHT) {
          newY -= (MIN_HEIGHT - newHeight);
          newHeight = MIN_HEIGHT;
        }
        setBlockWidth(newWidth);
        setBlockHeight(newHeight);
        blockWidthRef.current = newWidth;
        blockHeightRef.current = newHeight;
        translateY.value = newY;
      })
      .onEnd(() => {
        runOnJS(setIsResizing)(false);
        audiosInGlobal[1]((prev: AudioBlockInfo[]) =>
          (prev || []).map(a => a.id === audio.id ? { ...a, width: blockWidthRef.current, height: blockHeightRef.current, y: translateY.value } : a)
        );
      })
      .runOnJS(true),
    [contentsTransform, translateY, audiosInGlobal, audio.id, MIN_WIDTH, MIN_HEIGHT]
  );
  // 左下角拖拽
  const blResizeGesture = React.useMemo(() =>
    Gesture.Pan()
      .onBegin(() => {
        runOnJS(setIsResizing)(true);
        blResizeStart.current = { width: blockWidthRef.current, height: blockHeightRef.current, x: translateX.value };
      })
      .onUpdate(e => {
        const scale = contentsTransform?.scale ?? 1;
        const s = blResizeStart.current;
        let newWidth = s.width - e.translationX / scale;
        let newHeight = s.height + e.translationY / scale;
        let newX = s.x + e.translationX / scale;
        if (newWidth < MIN_WIDTH) {
          newX -= (MIN_WIDTH - newWidth);
          newWidth = MIN_WIDTH;
        }
        if (newHeight < MIN_HEIGHT) newHeight = MIN_HEIGHT;
        setBlockWidth(newWidth);
        setBlockHeight(newHeight);
        blockWidthRef.current = newWidth;
        blockHeightRef.current = newHeight;
        translateX.value = newX;
      })
      .onEnd(() => {
        runOnJS(setIsResizing)(false);
        audiosInGlobal[1]((prev: AudioBlockInfo[]) =>
          (prev || []).map(a => a.id === audio.id ? { ...a, width: blockWidthRef.current, height: blockHeightRef.current, x: translateX.value } : a)
        );
      })
      .runOnJS(true),
    [contentsTransform, translateX, audiosInGlobal, audio.id, MIN_WIDTH, MIN_HEIGHT]
  );
  // 右下角拖拽
  const brResizeGesture = React.useMemo(() =>
    Gesture.Pan()
      .onBegin(() => {
        runOnJS(setIsResizing)(true);
        brResizeStart.current = { width: blockWidthRef.current, height: blockHeightRef.current };
      })
      .onUpdate(e => {
        const scale = contentsTransform?.scale ?? 1;
        const s = brResizeStart.current;
        let newWidth = s.width + e.translationX / scale;
        let newHeight = s.height + e.translationY / scale;
        if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
        if (newHeight < MIN_HEIGHT) newHeight = MIN_HEIGHT;
        setBlockWidth(newWidth);
        setBlockHeight(newHeight);
        blockWidthRef.current = newWidth;
        blockHeightRef.current = newHeight;
      })
      .onEnd(() => {
        runOnJS(setIsResizing)(false);
        audiosInGlobal[1]((prev: AudioBlockInfo[]) =>
          (prev || []).map(a => a.id === audio.id ? { ...a, width: blockWidthRef.current, height: blockHeightRef.current } : a)
        );
      })
      .runOnJS(true),
    [contentsTransform, audiosInGlobal, audio.id, MIN_WIDTH, MIN_HEIGHT]
  );

  // 是否正在resize（需提前声明，供所有resize手势用）
  const [isResizing, setIsResizing] = useState(false);

  // 拖动结束写回全局
  const handleEnd = useCallback(() => {
    audiosInGlobal[1]((prev: AudioBlockInfo[]) =>
      (prev || []).map(a => a.id === audio.id ? { ...a, x: translateX.value, y: translateY.value, width: blockWidth } : a)
    );
  }, [audio.id, translateX, translateY, blockWidth, audiosInGlobal]);

  // 拖动手势（仅非resize时生效）
  const panGesture = React.useMemo(() =>
    Gesture.Pan()
      .onUpdate(e => {
        if (isResizing) return;
        const scale = contentsTransform?.scale ?? 1;
        translateX.value = audio.x + e.translationX / scale;
        translateY.value = audio.y + e.translationY / scale;
      })
      .onEnd(() => {
        if (isResizing) return;
        runOnJS(handleEnd)();
      })
      .runOnJS(true),
    [audio.x, audio.y, contentsTransform, translateX, translateY, handleEnd, isResizing]
  );

  // 拖动动画样式，适配画布缩放/平移和缩放尺寸
  const scale = contentsTransform?.scale ?? 1;
  const width = blockWidth * scale;
  const height = blockHeight * scale;
  const animatedStyle = useAnimatedStyle(() => {
    const scale = contentsTransform?.scale ?? 1;
    const tx = contentsTransform?.translateX ?? 0;
    const ty = contentsTransform?.translateY ?? 0;
    return {
      position: 'absolute',
      left: translateX.value * scale + tx,
      top: translateY.value * scale + ty,
      width: width,
      height: height,
      minWidth: MIN_WIDTH * scale,
      minHeight: 36 * scale,
      borderRadius: 8 * scale,
      paddingHorizontal: 8 * scale,
      paddingVertical: 4 * scale,
    };
  }, [contentsTransform, translateX, translateY, width, height]);

  // 缩放后过小则隐藏按钮
  const showButtons = scale * 40 >= 28; // 40为音频块高，28为按钮直径，阈值可调

  // 音频名自适应字体大小逻辑
  const getInitFontSize = React.useCallback(() => Math.max(12, 14 * scale), [scale]);
  const [fontSize, setFontSize] = useState(getInitFontSize());
  const fontSizeRef = useRef(fontSize);
  React.useEffect(() => { fontSizeRef.current = fontSize; }, [fontSize]);
  const prevScale = useRef(scale);
  const prevShowButtons = useRef(showButtons);
  const prevName = useRef(audio.name);
  const lastTextWidth = useRef(0);
  const allowFontSizeDecrease = useRef(true); // 只允许在缩放/音频名变化后递减一次字号

  React.useLayoutEffect(() => {
    // 仅在 scale/showButtons/audio.name 变大/变化时重置字号
    if (
      scale > prevScale.current ||
      showButtons !== prevShowButtons.current ||
      audio.name !== prevName.current
    ) {
      setFontSize(getInitFontSize());
      allowFontSizeDecrease.current = true; // 允许递减字号
    }
    prevScale.current = scale;
    prevShowButtons.current = showButtons;
    prevName.current = audio.name;
  }, [scale, showButtons, audio.name, getInitFontSize]);

  const onTextLayout = (e: any) => {
    const textWidth = e.nativeEvent?.lines?.[0]?.width || e.nativeEvent?.layout?.width || 0;
    const btnSpace = showButtons ? (32 + 24 + 8 * 2) * scale : 0;
    const available = blockWidth * scale - btnSpace - 12 * scale;
    // 只在允许时递减字号，resize 时不递减
    if (
      allowFontSizeDecrease.current &&
      textWidth > available &&
      fontSizeRef.current > 12 &&
      lastTextWidth.current !== textWidth
    ) {
      setFontSize(f => Math.max(12, f - 1));
      allowFontSizeDecrease.current = false; // 只递减一次，直到下次缩放/音频名变化
    }
    lastTextWidth.current = textWidth;
  };

  // 音频数据变化时重置位置
  React.useEffect(() => {
    translateX.value = audio.x;
    translateY.value = audio.y;
  }, [audio.x, audio.y, translateX, translateY]);

  // 播放/暂停音频（独立）
  const handlePlayAudio = async () => {
    if (isPlaying && soundObj) {
      await soundObj.pauseAsync();
      setIsPlaying(false);
      return;
    }
    setIsLoading(true);
    let _sound = null;
    try {
      if (soundObj) {
        await soundObj.unloadAsync();
        setSoundObj(null);
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri: audio.uri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
            setIsLoading(false);
            sound.unloadAsync();
          }
        }
      );
      // 设置音频对象
      _sound = sound;
      setSoundObj(sound);
      setIsPlaying(true);
    } catch (e) {
      Alert.alert('播放失败', String(e));
      setIsPlaying(false);
      _sound?.unloadAsync();
    } finally {
      setIsLoading(false);
    }
  };

  // 卸载时释放音频
  React.useEffect(() => {
    return () => {
      if (soundObj) {
        soundObj.unloadAsync();
      }
    };
  }, [soundObj]);

  // 删除音频
  const handleDeleteAudio = () => {
    Alert.alert('删除音频', '确定要删除该音频吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => audiosInGlobal[1]((prev: AudioBlockInfo[]) => (prev || []).filter(a => a.id !== audio.id)) }
    ]);
  };

  // 获取可读文件名（支持本地、网络、十六进制等情况）
  const getDisplayName = useCallback((uri: string) => {
    try {
      let name = uri.split('/').pop() || uri;
      name = name.split('?')[0].split('#')[0];
      if (/^[0-9a-fA-F]{32,}\.[a-zA-Z0-9]+$/.test(name)) {
        return '音频文件';
      }
      if (!/\.[a-zA-Z0-9]+$/.test(name) && name.length > 20) return '音频文件';
      if (/^(document|audio|file|tmp)[\-_]?[0-9a-fA-F]{8,}/i.test(name)) return '音频文件';
      let decoded = name;
      try { decoded = decodeURIComponent(name); } catch { }
      if (/^%[0-9a-fA-F]{2,}/.test(decoded)) return '音频文件';
      if (/^\d{10,}$/.test(decoded)) return '音频文件';
      if (/^[0-9a-fA-F]{16,}\.[a-zA-Z0-9]+$/.test(decoded)) return '音频文件';
      return decoded;
    } catch {
      return '音频文件';
    }
  }, []);

  // 拉伸边界热区宽度（像素，随 scale 缩放）
  const edgeHotWidth = 12 * scale;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[
        styles.audioWrap,
        animatedStyle
      ]} >
        {/* 四角透明拖拽区 */}
        <GestureDetector gesture={tlResizeGesture}>
          <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: edgeHotWidth, height: edgeHotWidth, zIndex: 20 }} pointerEvents="box-only" />
        </GestureDetector>
        <GestureDetector gesture={trResizeGesture}>
          <Animated.View style={{ position: 'absolute', right: 0, top: 0, width: edgeHotWidth, height: edgeHotWidth, zIndex: 20 }} pointerEvents="box-only" />
        </GestureDetector>
        <GestureDetector gesture={blResizeGesture}>
          <Animated.View style={{ position: 'absolute', left: 0, bottom: 0, width: edgeHotWidth, height: edgeHotWidth, zIndex: 20 }} pointerEvents="box-only" />
        </GestureDetector>
        <GestureDetector gesture={brResizeGesture}>
          <Animated.View style={{ position: 'absolute', right: 0, bottom: 0, width: edgeHotWidth, height: edgeHotWidth, zIndex: 20 }} pointerEvents="box-only" />
        </GestureDetector>
        {/* 上边界透明拖拽区 */}
        <GestureDetector gesture={topResizeGesture}>
          <Animated.View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: edgeHotWidth,
              zIndex: 10,
              // backgroundColor: 'rgba(0,0,255,0.05)',
            }}
            pointerEvents="box-only"
          />
        </GestureDetector>
        {/* 下边界透明拖拽区 */}
        <GestureDetector gesture={bottomResizeGesture}>
          <Animated.View
            style={{
              position: 'absolute',
              left: 0,
              bottom: 0,
              width: '100%',
              height: edgeHotWidth,
              zIndex: 10,
              // backgroundColor: 'rgba(255,0,0,0.05)',
            }}
            pointerEvents="box-only"
          />
        </GestureDetector>
        {/* 左边界透明拖拽区 */}
        <GestureDetector gesture={leftResizeGesture}>
          <Animated.View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: edgeHotWidth,
              height: '100%',
              zIndex: 10,
              // backgroundColor: 'rgba(0,0,0,0.05)', // 调试可开
            }}
            pointerEvents="box-only"
          />
        </GestureDetector>
        {/* 右边界透明拖拽区 */}
        <GestureDetector gesture={rightResizeGesture}>
          <Animated.View
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: edgeHotWidth,
              height: '100%',
              zIndex: 10,
              // backgroundColor: 'rgba(0,0,0,0.05)',
            }}
            pointerEvents="box-only"
          />
        </GestureDetector>
        {showButtons && (
          <TouchableOpacity
            style={[
              styles.playBtn,
              {
                width: 32 * scale,
                height: 32 * scale,
                borderRadius: 16 * scale,
                marginRight: 6 * scale,
              },
            ]}
            onPress={handlePlayAudio}
          >
            {isLoading ? (
              <MaterialIcons name="hourglass-empty" size={Math.max(12, 20 * scale)} color="#388e3c" />
            ) : (
              <MaterialIcons name={isPlaying ? "pause" : "play-arrow"} size={Math.max(12, 20 * scale)} color="#388e3c" />
            )}
          </TouchableOpacity>
        )}
        <Text
          style={[
            styles.audioText,
            { fontSize, flex: 1, minWidth: undefined, maxWidth: undefined },
          ]}
          numberOfLines={1}
          ellipsizeMode="middle"
          onTextLayout={onTextLayout}
        >
          {audio.name ? audio.name : getDisplayName(audio.uri)}
        </Text>
        {showButtons && (
          <TouchableOpacity
            style={[
              styles.delBtn,
              {
                width: 24 * scale,
                height: 24 * scale,
                borderRadius: 12 * scale,
                marginLeft: 'auto',
                marginRight: 0,
              },
            ]}
            onPress={handleDeleteAudio}
          >
            <MaterialIcons name="close" size={Math.max(12, 16 * scale)} color="#e74c3c" />
          </TouchableOpacity>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  audioWrap: {
    position: 'absolute',
    minWidth: 0, // 交由动态minWidth控制
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a5d6a7',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  playBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 6,
  },
  audioText: {
    color: '#388e3c',
    fontSize: 14,
    marginRight: 8,
  },
  delBtn: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
});

export default CanvasAudioItem;


/*
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
*/