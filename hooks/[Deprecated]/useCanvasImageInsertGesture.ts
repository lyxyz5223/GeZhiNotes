import { CanvasMode } from '@/types/CanvasTypes';
import * as ImagePicker from 'expo-image-picker';

/**
 * 用于图片模式下点击画布插入图片的手势hook
 * @param mode 当前画布模式
 * @param setImages 图片setter
 * @returns 手势对象（onStartShouldSetResponder, onResponderRelease）
 */
export function useCanvasImageInsertGesture(
  mode: CanvasMode,
  setImages?: (updater: any) => void,
  canvasLayout?: {
    x: number, y: number,
    width: number, height: number
  }) {
  return {
    onStartShouldSetResponder: () => true,
    onResponderMove: (evt: any) => {
      console.log('onResponderMove');
    },
    onResponderRelease: async (evt: any) => {
      if (mode !== CanvasMode.Image || !setImages) return;
      // 先拷贝事件属性，防止异步后访问被回收
      if (!evt || !evt.nativeEvent) return;
      const { pageX, pageY, locationX, locationY } = evt.nativeEvent;
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // 默认图片宽高与画布相关，最大不超过画布宽高的1/3，且保持原始宽高比
        let defaultW = 120, defaultH = 120;
        if (canvasLayout && asset.width && asset.height) {
          const maxW = canvasLayout.width * 0.33;
          const maxH = canvasLayout.height * 0.33;
          const ratio = asset.width / asset.height;
          if (maxW / ratio <= maxH) {
            defaultW = maxW;
            defaultH = maxW / ratio;
          } else {
            defaultH = maxH;
            defaultW = maxH * ratio;
          }
        }
        const width = defaultW, height = defaultH;
        const x = locationX,
          y = locationY;

        const newImg = {
          id: Date.now().toString(),
          uri: asset.uri,
          x,
          y,
          width,
          height,
        };
        setImages((prev: any[]) => [...(prev || []), newImg]);
      }
    },
  };
}
