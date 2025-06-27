import { AudioBlockInfo, TextBlockInfo, VideoBlockInfo, WebLinkBlockInfo } from '@/types/CanvasTypes';
import { pickAndInsertImage } from './CanvasAddImageUtils';
// 插入行为实现函数
export function insertImage(globalData: any, x: number, y: number, options?: { width?: number; height?: number }) {
  if (globalData?.setImages) {
    return pickAndInsertImage(globalData.setImages, x, y, options);
  }
}
export function insertText(globalData: any, x: number, y: number, options?: { fontSize?: number }) {
  if (globalData?.setTexts) {
    const newText: TextBlockInfo = {
      id: Date.now().toString(),
      text: "新文本",
      x,
      y,
      color: "#333",
      fontSize: options?.fontSize ?? 18,
      fontFamily: undefined,
    };
    globalData.setTexts((prev: TextBlockInfo[] = []) => [...prev, newText]);
  }
}
export function insertVideo(globalData: any, x: number, y: number, options?: { width?: number; height?: number }) {
  if (globalData?.setVideos) {
    const newVideo: VideoBlockInfo = {
      id: Date.now().toString(),
      uri: '',
      x,
      y,
      width: options?.width ?? 160,
      height: options?.height ?? 90,
    };
    globalData.setVideos((prev: VideoBlockInfo[] = []) => [...prev, newVideo]);
  }
}
export function insertWebLink(globalData: any, x: number, y: number, options?: { title?: string }) {
  if (globalData?.setWebLinks) {
    const newLink: WebLinkBlockInfo = {
      id: Date.now().toString(),
      url: 'https://',
      x,
      y,
      title: options?.title ?? '新链接',
    };
    globalData.setWebLinks((prev: WebLinkBlockInfo[] = []) => [...prev, newLink]);
  }
}
export function insertAudio(globalData: any, x: number, y: number, options?: { duration?: number }) {
  if (globalData?.setAudios) {
    const newAudio: AudioBlockInfo = {
      id: Date.now().toString(),
      uri: '',
      x,
      y,
      duration: options?.duration,
    };
    globalData.setAudios((prev: AudioBlockInfo[] = []) => [...prev, newAudio]);
  }
}
