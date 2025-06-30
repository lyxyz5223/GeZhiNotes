import { ImageBlockInfo, StateUpdater, TransformType } from "@/types/CanvasTypes";
import React from "react";
import { Alert, Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

const HANDLE_SIZE = 12;
const HANDLE_TOUCH_SIZE = 18;
const HANDLE_TOUCH_OFFSET = -HANDLE_TOUCH_SIZE / 2;
const HANDLE_INNER_OFFSET = (HANDLE_TOUCH_SIZE - HANDLE_SIZE) / 2;
const DEL_BTN_SIZE = 24;

type CanvasImageItemProps = {
  img: ImageBlockInfo;
  imagesInGlobal: ImageBlockInfo[];
  setImagesInGlobal?: StateUpdater<ImageBlockInfo[]>;
  active: { id: string | null; mode: 'drag' | 'resize' | null; corner?: 'br'|'tr'|'bl'|'tl' };
  setActive: React.Dispatch<React.SetStateAction<{ id: string | null; mode: 'drag' | 'resize' | null; corner?: 'br'|'tr'|'bl'|'tl' }>>;
  contentsTransform?: TransformType;
};

const CanvasImageItem = ({ img, imagesInGlobal, setImagesInGlobal, active, setActive, contentsTransform }: CanvasImageItemProps) => {
  const translateX = useSharedValue(img.x);
  const translateY = useSharedValue(img.y);
  const width = useSharedValue(img.width);
  const height = useSharedValue(img.height);

  // 动画样式
  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: translateX.value,
    top: translateY.value,
    width: width.value,
    height: height.value,
  }), []);

  const tapGesture = Gesture.Tap()
  
  // 拖动手势
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      runOnJS(setActive)({ id: img.id, mode: 'drag' });
    })
    .onUpdate(e => {
      const scale = contentsTransform?.scale ?? 1;
      translateX.value = img.x + e.translationX / scale;
      translateY.value = img.y + e.translationY / scale;
    })
    .onEnd(() => {
      runOnJS(setActive)({ id: null, mode: null });
      if (setImagesInGlobal) {
        let newArr: ImageBlockInfo[] = imagesInGlobal.map((item: ImageBlockInfo) =>
            item.id === img.id
              ? { ...item, x: Number(translateX.value), y: Number(translateY.value) }
              : item
          );
        runOnJS(setImagesInGlobal)(newArr);
      }
    });

  // 四角缩放手势生成器
  const makeResizeGesture = (corner: 'br'|'tr'|'bl'|'tl') =>
    Gesture.Pan()
      .onBegin(() => {
        runOnJS(setActive)({ id: img.id, mode: 'resize', corner });
      })
      .onUpdate(e => {
        const scale = contentsTransform?.scale ?? 1;
        let newW = img.width, newH = img.height, newX = img.x, newY = img.y;
        if (corner === 'br') {
          newW = Math.max(40, img.width + e.translationX / scale);
          newH = Math.max(40, img.height + e.translationY / scale);
        } else if (corner === 'tr') {
          newY = img.y + e.translationY / scale;
          newH = Math.max(40, img.height - e.translationY / scale);
          newW = Math.max(40, img.width + e.translationX / scale);
        } else if (corner === 'bl') {
          newX = img.x + e.translationX / scale;
          newW = Math.max(40, img.width - e.translationX / scale);
          newH = Math.max(40, img.height + e.translationY / scale);
        } else if (corner === 'tl') {
          newX = img.x + e.translationX / scale;
          newY = img.y + e.translationY / scale;
          newW = Math.max(40, img.width - e.translationX / scale);
          newH = Math.max(40, img.height - e.translationY / scale);
        }
        translateX.value = newX;
        translateY.value = newY;
        width.value = newW;
        height.value = newH;
      })
      .onEnd(() => {
        runOnJS(setActive)({ id: null, mode: null });
        if (setImagesInGlobal && imagesInGlobal) {
          const newArr: ImageBlockInfo[] = imagesInGlobal.map((item: ImageBlockInfo) =>
            item.id === img.id
              ? { ...item, x: Number(translateX.value), y: Number(translateY.value), width: Number(width.value), height: Number(height.value) }
              : item
          );
          runOnJS(setImagesInGlobal)(newArr);
        }
      });

  const gesture = Gesture.Simultaneous(
    tapGesture,
    panGesture
  );
  // 删除图片
  const handleDeleteImage = () => {
    if (!setImagesInGlobal) return;
    Alert.alert('删除图片', '确定要删除这张图片吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => setImagesInGlobal((prev: ImageBlockInfo[]) => (prev || []).filter(i => i.id !== img.id)) }
    ]);
  };

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.imgWrap, animatedStyle, active.id === img.id && (active.mode === 'drag' || active.mode === 'resize') ? styles.active : null]}>
        <Image
          source={{ uri: img.uri }}
          style={{ width: '100%', height: '100%', borderRadius: 8, resizeMode: 'contain' }}
        />
        {/* 四角缩放手柄，包裹大触摸区域 */}
        {(['tl','tr','bl','br'] as const).map(corner => {
          const resizeGesture = makeResizeGesture(corner);
          const isActiveResize = active.id === img.id && active.mode === 'resize' && active.corner === corner;
          return (
            <GestureDetector gesture={resizeGesture} key={corner}>
              <View
                style={[
                  styles.handleTouchArea,
                  styles[corner],
                  isActiveResize ? styles.handleActive : null
                ]}
                pointerEvents={active.mode === 'drag' ? 'none' : 'auto'}
              >
                <View style={styles.handle}/>
              </View>
            </GestureDetector>
          );
        })}
        {/* 删除按钮 */}
        <TouchableOpacity style={styles.delBtn} onPress={handleDeleteImage}>
          <View style={styles.delBtnInner} />
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  imgWrap: {
    position: 'absolute', borderWidth: 2, borderColor: '#1976d2', borderRadius: 8, overflow: 'visible',
  },
  active: {
    borderColor: '#ff9800',
    shadowColor: '#ff9800', shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  delBtn: {
    position: 'absolute',
    right: HANDLE_TOUCH_SIZE - HANDLE_SIZE / 2,
    top: HANDLE_TOUCH_SIZE - HANDLE_SIZE / 2,
    width: DEL_BTN_SIZE, height: DEL_BTN_SIZE,
    backgroundColor: '#fff', borderRadius: DEL_BTN_SIZE / 2,
    alignItems: 'center', justifyContent: 'center', zIndex: 20,
  },
  delBtnInner: {
    width: 12, height: 2, backgroundColor: '#e74c3c', borderRadius: 1,
  },
  handleTouchArea: {
    position: 'absolute', width: HANDLE_TOUCH_SIZE, height: HANDLE_TOUCH_SIZE, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'transparent', zIndex: 30,
  },
  handle: {
    width: HANDLE_SIZE, height: HANDLE_SIZE, backgroundColor: '#fff', borderRadius: 9, borderWidth: 2, borderColor: '#1976d2',
    position: 'absolute', left: HANDLE_INNER_OFFSET, top: HANDLE_INNER_OFFSET,
    zIndex: 31,
  },
  handleActive: {
    backgroundColor: 'rgba(255,152,0,0.12)',
  },
  tl: { left: HANDLE_TOUCH_OFFSET, top: HANDLE_TOUCH_OFFSET },
  tr: { right: HANDLE_TOUCH_OFFSET, top: HANDLE_TOUCH_OFFSET },
  bl: { left: HANDLE_TOUCH_OFFSET, bottom: HANDLE_TOUCH_OFFSET },
  br: { right: HANDLE_TOUCH_OFFSET, bottom: HANDLE_TOUCH_OFFSET },
});

export default CanvasImageItem;
