import { TransformType, VideoBlockInfo } from "@/types/CanvasTypes";
import { MaterialIcons } from "@expo/vector-icons";
import { Video } from 'expo-av';
import React, { useCallback, useRef, useState } from "react";
import { Alert, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from "react-native-reanimated";

const HANDLE_SIZE = 12;
const HANDLE_TOUCH_SIZE = 18;
const DEL_BTN_SIZE = 24;

const CanvasVideoItem: React.FC<{
  video: VideoBlockInfo;
  videosInGlobal: [VideoBlockInfo[], React.Dispatch<React.SetStateAction<VideoBlockInfo[]>>];
  contentsTransform: TransformType;
}> = ({ video, videosInGlobal, contentsTransform }) => {
  // 拖动与缩放
  const translateX = useSharedValue(video.x);
  const translateY = useSharedValue(video.y);
  const blockWidth = useSharedValue(video.width);
  const blockHeight = useSharedValue(video.height);

  // 拖动、缩放、删除
  const [isResizing, setIsResizing] = useState(false);
  // 控件区是否正在拖动进度条
  const [isSeeking, setIsSeeking] = useState(false);

  // 拖动手势和resize手势都需要同步写回全局
  const syncToGlobal = useCallback(() => {
    videosInGlobal[1]((prev: VideoBlockInfo[]) =>
      (prev || []).map(v => v.id === video.id ? { ...v, x: translateX.value, y: translateY.value, width: blockWidth.value, height: blockHeight.value } : v)
    );
  }, [videosInGlobal, video.id, translateX, translateY, blockWidth, blockHeight]);

  // 拖动手势
  const panGesture = React.useMemo(() =>
    Gesture.Pan()
      .onUpdate(e => {
        if (isResizing || isSeeking) return;
        const scale = contentsTransform?.scale ?? 1;
        translateX.value = video.x + e.translationX / scale;
        translateY.value = video.y + e.translationY / scale;
      })
      .onEnd(() => {
        if (isResizing || isSeeking) return;
        videosInGlobal[1]((prev: VideoBlockInfo[]) =>
          (prev || []).map(v => v.id === video.id ? { ...v, x: translateX.value, y: translateY.value, width: blockWidth.value, height: blockHeight.value } : v)
        );
      })
      .runOnJS(true),
    [isResizing, isSeeking, contentsTransform, video.x, video.y, translateX, translateY, blockWidth, blockHeight, videosInGlobal, video.id]
  );

  // 各边/角resize拖拽起点
  const leftResizeStart = useRef({ width: 0, x: 0 });
  const rightResizeStart = useRef({ width: 0 });
  const topResizeStart = useRef({ height: 0, y: 0 });
  const bottomResizeStart = useRef({ height: 0 });
  const tlResizeStart = useRef({ width: 0, height: 0, x: 0, y: 0 });
  const trResizeStart = useRef({ width: 0, height: 0, y: 0 });
  const blResizeStart = useRef({ width: 0, height: 0, x: 0 });
  const brResizeStart = useRef({ width: 0, height: 0 });

  // 左边界
  const leftResizeGesture = React.useMemo(() =>
    Gesture.Pan()
      .onBegin(() => {
        runOnJS(setIsResizing)(true);
        leftResizeStart.current = { width: blockWidth.value, x: translateX.value };
      })
      .onUpdate(e => {
        const scale = contentsTransform?.scale ?? 1;
        const startWidth = leftResizeStart.current.width;
        const startX = leftResizeStart.current.x;
        let newWidth = startWidth - e.translationX / scale;
        let newX = startX + e.translationX / scale;
        if (newWidth < 80) {
          newX -= (80 - newWidth);
          newWidth = 80;
        }
        blockWidth.value = newWidth;
        translateX.value = newX;
      })
      .onEnd(() => {
        runOnJS(setIsResizing)(false);
        runOnJS(syncToGlobal)();
      })
      .runOnJS(true),
    [contentsTransform, translateX, blockWidth, syncToGlobal]
  );
  // 右边界
  const rightResizeGesture = React.useMemo(() =>
    Gesture.Pan()
      .onBegin(() => {
        runOnJS(setIsResizing)(true);
        rightResizeStart.current = { width: blockWidth.value };
      })
      .onUpdate(e => {
        const scale = contentsTransform?.scale ?? 1;
        const startWidth = rightResizeStart.current.width;
        let newWidth = startWidth + e.translationX / scale;
        if (newWidth < 80) newWidth = 80;
        blockWidth.value = newWidth;
      })
      .onEnd(() => {
        runOnJS(setIsResizing)(false);
        runOnJS(syncToGlobal)();
      })
      .runOnJS(true),
    [contentsTransform, blockWidth, syncToGlobal]
  );
  // 上边界
  const topResizeGesture = React.useMemo(() =>
    Gesture.Pan()
      .onBegin(() => {
        runOnJS(setIsResizing)(true);
        topResizeStart.current = { height: blockHeight.value, y: translateY.value };
      })
      .onUpdate(e => {
        const scale = contentsTransform?.scale ?? 1;
        const startHeight = topResizeStart.current.height;
        const startY = topResizeStart.current.y;
        let newHeight = startHeight - e.translationY / scale;
        let newY = startY + e.translationY / scale;
        if (newHeight < 45) {
          newY -= (45 - newHeight);
          newHeight = 45;
        }
        blockHeight.value = newHeight;
        translateY.value = newY;
      })
      .onEnd(() => {
        runOnJS(setIsResizing)(false);
        runOnJS(syncToGlobal)();
      })
      .runOnJS(true),
    [contentsTransform, translateY, blockHeight, syncToGlobal]
  );
  // 下边界
  const bottomResizeGesture = React.useMemo(() =>
    Gesture.Pan()
      .onBegin(() => {
        runOnJS(setIsResizing)(true);
        bottomResizeStart.current = { height: blockHeight.value };
      })
      .onUpdate(e => {
        const scale = contentsTransform?.scale ?? 1;
        const startHeight = bottomResizeStart.current.height;
        let newHeight = startHeight + e.translationY / scale;
        if (newHeight < 45) newHeight = 45;
        blockHeight.value = newHeight;
      })
      .onEnd(() => {
        runOnJS(setIsResizing)(false);
        runOnJS(syncToGlobal)();
      })
      .runOnJS(true),
    [contentsTransform, blockHeight, syncToGlobal]
  );
  // 左上角
  const tlResizeGesture = React.useMemo(() =>
    Gesture.Pan()
      .onBegin(() => {
        runOnJS(setIsResizing)(true);
        tlResizeStart.current = { width: blockWidth.value, height: blockHeight.value, x: translateX.value, y: translateY.value };
      })
      .onUpdate(e => {
        const scale = contentsTransform?.scale ?? 1;
        const s = tlResizeStart.current;
        let newWidth = s.width - e.translationX / scale;
        let newHeight = s.height - e.translationY / scale;
        let newX = s.x + e.translationX / scale;
        let newY = s.y + e.translationY / scale;
        if (newWidth < 80) {
          newX -= (80 - newWidth);
          newWidth = 80;
        }
        if (newHeight < 45) {
          newY -= (45 - newHeight);
          newHeight = 45;
        }
        blockWidth.value = newWidth;
        blockHeight.value = newHeight;
        translateX.value = newX;
        translateY.value = newY;
      })
      .onEnd(() => {
        runOnJS(setIsResizing)(false);
        runOnJS(syncToGlobal)();
      })
      .runOnJS(true),
    [contentsTransform, translateX, translateY, blockWidth, blockHeight, syncToGlobal]
  );
  // 右上角
  const trResizeGesture = React.useMemo(() =>
    Gesture.Pan()
      .onBegin(() => {
        runOnJS(setIsResizing)(true);
        trResizeStart.current = { width: blockWidth.value, height: blockHeight.value, y: translateY.value };
      })
      .onUpdate(e => {
        const scale = contentsTransform?.scale ?? 1;
        const s = trResizeStart.current;
        let newWidth = s.width + e.translationX / scale;
        let newHeight = s.height - e.translationY / scale;
        let newY = s.y + e.translationY / scale;
        if (newWidth < 80) newWidth = 80;
        if (newHeight < 45) {
          newY -= (45 - newHeight);
          newHeight = 45;
        }
        blockWidth.value = newWidth;
        blockHeight.value = newHeight;
        translateY.value = newY;
      })
      .onEnd(() => {
        runOnJS(setIsResizing)(false);
        runOnJS(syncToGlobal)();
      })
      .runOnJS(true),
    [contentsTransform, translateY, blockWidth, blockHeight, syncToGlobal]
  );
  // 左下角
  const blResizeGesture = React.useMemo(() =>
    Gesture.Pan()
      .onBegin(() => {
        runOnJS(setIsResizing)(true);
        blResizeStart.current = { width: blockWidth.value, height: blockHeight.value, x: translateX.value };
      })
      .onUpdate(e => {
        const scale = contentsTransform?.scale ?? 1;
        const s = blResizeStart.current;
        let newWidth = s.width - e.translationX / scale;
        let newHeight = s.height + e.translationY / scale;
        let newX = s.x + e.translationX / scale;
        if (newWidth < 80) {
          newX -= (80 - newWidth);
          newWidth = 80;
        }
        if (newHeight < 45) newHeight = 45;
        blockWidth.value = newWidth;
        blockHeight.value = newHeight;
        translateX.value = newX;
      })
      .onEnd(() => {
        runOnJS(setIsResizing)(false);
        runOnJS(syncToGlobal)();
      })
      .runOnJS(true),
    [contentsTransform, translateX, blockWidth, blockHeight, syncToGlobal]
  );
  // 右下角
  const brResizeGesture = React.useMemo(() =>
    Gesture.Pan()
      .onBegin(() => {
        runOnJS(setIsResizing)(true);
        brResizeStart.current = { width: blockWidth.value, height: blockHeight.value };
      })
      .onUpdate(e => {
        const scale = contentsTransform?.scale ?? 1;
        const s = brResizeStart.current;
        let newWidth = s.width + e.translationX / scale;
        let newHeight = s.height + e.translationY / scale;
        if (newWidth < 80) newWidth = 80;
        if (newHeight < 45) newHeight = 45;
        blockWidth.value = newWidth;
        blockHeight.value = newHeight;
      })
      .onEnd(() => {
        runOnJS(setIsResizing)(false);
        runOnJS(syncToGlobal)();
      })
      .runOnJS(true),
    [contentsTransform, blockWidth, blockHeight, syncToGlobal]
  );

  // 删除
  const handleDelete = useCallback(() => {
    Alert.alert('删除视频', '确定要删除该视频吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => videosInGlobal[1]((prev: VideoBlockInfo[]) => (prev || []).filter(v => v.id !== video.id)) }
    ]);
  }, [video.id, videosInGlobal]);

  // 播放控制
  const videoRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const handlePlayPause = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await videoRef.current.playAsync();
      setIsPlaying(true);
    }
  };
  const handleStop = async () => {
    if (!videoRef.current) return;
    await videoRef.current.stopAsync();
    setIsPlaying(false);
    setProgress(0);
  };
  const onPlaybackStatusUpdate = (status: any) => {
    if (!status.isLoaded) return;
    setProgress(status.positionMillis || 0);
    setDuration(status.durationMillis || 0);
    if (status.didJustFinish) setIsPlaying(false);
  };

  // 拖动进度条
  const progressBarRef = useRef<View>(null);
  // 拖动进度条时的回调
  const handleSeek = async (e: any) => {
    if (!videoRef.current || !duration) return;
    const bar = progressBarRef.current;
    if (!bar) return;
    // 只在控件区内处理拖动
    if (!e.nativeEvent || typeof e.nativeEvent.locationX !== 'number') return;
    const { locationX } = e.nativeEvent;
    bar.measure((x, y, width, height, pageX, pageY) => {
      let percent = locationX / width;
      if (percent < 0) percent = 0;
      if (percent > 1) percent = 1;
      const seekMillis = percent * duration;
      videoRef.current.setPositionAsync(seekMillis);
      setProgress(seekMillis);
    });
  };
  const handleSeekEnd = () => setIsSeeking(false);

  // 动画样式
  const scale = contentsTransform?.scale ?? 1;
  const animatedStyle = useAnimatedStyle(() => {
    const tx = contentsTransform?.translateX ?? 0;
    const ty = contentsTransform?.translateY ?? 0;
    return {
      position: 'absolute',
      left: translateX.value * scale + tx,
      top: translateY.value * scale + ty,
      width: blockWidth.value * scale,
      height: blockHeight.value * scale,
      borderRadius: 8 * scale,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: '#333',
      backgroundColor: '#000',
    };
  }, [contentsTransform, translateX, translateY, blockWidth, blockHeight]);

  // 进度条百分比
  const percent = duration > 0 ? progress / duration : 0;

  // 拉伸边界热区宽度
  const edgeHotWidth = 12 * scale;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle}>
        {/* 视频内容 */}
        <Video
          ref={videoRef}
          source={{ uri: video.uri }}
          style={{ width: '100%', height: '100%' }}
          resizeMode={"contain" as any}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        />
        {/* 控件区 */}
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row', alignItems: 'center', padding: 4, zIndex: 20 }}>
          <TouchableOpacity onPress={handlePlayPause} style={{ marginRight: 8 }}>
            <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleStop} style={{ marginRight: 8 }}>
            <MaterialIcons name="stop" size={24} color="#fff" />
          </TouchableOpacity>
          <View
            ref={progressBarRef}
            style={{ flex: 1, height: 16, justifyContent: 'center', marginRight: 8 }}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={handleSeek}
            onResponderMove={handleSeek}
            onResponderRelease={handleSeekEnd}
            onResponderTerminate={handleSeekEnd}
          >
            <View style={{ height: 4, backgroundColor: '#888', borderRadius: 2, overflow: 'hidden' }}>
              <View style={{ width: `${percent * 100}%`, height: 4, backgroundColor: '#fff' }} />
            </View>
          </View>
          <TouchableOpacity onPress={handleDelete}>
            <MaterialIcons name="close" size={24} color="#e74c3c" />
          </TouchableOpacity>
        </View>
        {/* 四角透明拖拽区 */}
        <GestureDetector gesture={tlResizeGesture}>
          <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: edgeHotWidth, height: edgeHotWidth, zIndex: 10 }} pointerEvents="box-only" />
        </GestureDetector>
        <GestureDetector gesture={trResizeGesture}>
          <Animated.View style={{ position: 'absolute', right: 0, top: 0, width: edgeHotWidth, height: edgeHotWidth, zIndex: 10 }} pointerEvents="box-only" />
        </GestureDetector>
        <GestureDetector gesture={blResizeGesture}>
          <Animated.View style={{ position: 'absolute', left: 0, bottom: 0, width: edgeHotWidth, height: edgeHotWidth, zIndex: 10 }} pointerEvents="box-only" />
        </GestureDetector>
        <GestureDetector gesture={brResizeGesture}>
          <Animated.View style={{ position: 'absolute', right: 0, bottom: 0, width: edgeHotWidth, height: edgeHotWidth, zIndex: 10 }} pointerEvents="box-only" />
        </GestureDetector>
        {/* 上下左右边界透明拖拽区 */}
        <GestureDetector gesture={topResizeGesture}>
          <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: edgeHotWidth, zIndex: 5 }} pointerEvents="box-only" />
        </GestureDetector>
        <GestureDetector gesture={bottomResizeGesture}>
          <Animated.View style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', height: edgeHotWidth, zIndex: 5 }} pointerEvents="box-only" />
        </GestureDetector>
        <GestureDetector gesture={leftResizeGesture}>
          <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: edgeHotWidth, height: '100%', zIndex: 5 }} pointerEvents="box-only" />
        </GestureDetector>
        <GestureDetector gesture={rightResizeGesture}>
          <Animated.View style={{ position: 'absolute', right: 0, top: 0, width: edgeHotWidth, height: '100%', zIndex: 5 }} pointerEvents="box-only" />
        </GestureDetector>
      </Animated.View>
    </GestureDetector>
  );
};

export default CanvasVideoItem;
