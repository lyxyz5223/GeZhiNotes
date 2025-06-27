import { ImageBlockInfo } from '@/types/CanvasTypes';
import * as ImagePicker from 'expo-image-picker';

/**
 * 选择图片并返回图片对象（带初始位置和尺寸）
 * @param x 画布插入点x
 * @param y 画布插入点y
 * @returns Promise<ImageBlockInfo|null>
 */
export async function pickAndCreateImageBlock(x: number = 60, y: number = 60, options?: { width?: number; height?: number }): Promise<ImageBlockInfo | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'], // 新版API推荐用法
    quality: 1,
  });
  if (!result.canceled && result.assets && result.assets.length > 0) {
    const asset = result.assets[0];
    const { width = 120, height = 120, uri } = asset;
    const finalWidth = options?.width ?? width ?? 120;
    const finalHeight = options?.height ?? height ?? 120;
    return {
      id: Date.now().toString(),
      uri,
      x: x - finalWidth / 2,
      y: y - finalHeight / 2,
      width: finalWidth,
      height: finalHeight,
    };
  }
  return null;
}

/**
 * 选择图片并插入到 setImages
 * @param setImages setter
 * @param x 画布插入点x
 * @param y 画布插入点y
 */
export async function pickAndInsertImage(setImages: (updater: (prev: ImageBlockInfo[]) => ImageBlockInfo[]) => void, x: number = 60, y: number = 60, options?: { width?: number; height?: number }) {
  const img = await pickAndCreateImageBlock(x, y, options);
  if (img) {
    setImages((prev: ImageBlockInfo[]) => [...(prev || []), img]);
  }
}
