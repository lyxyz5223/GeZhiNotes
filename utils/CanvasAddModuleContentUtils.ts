import { AudioBlockInfo, ModuleInsertOptionsType, TextBlockInfo, VideoBlockInfo, WebLinkBlockInfo } from '@/types/CanvasTypes';
import { pickAndInsertImage } from './CanvasAddImageUtils';
import { useId } from 'react';
import { INIT_SIZE as CANVAS_INIT_SIZE } from '@/constants/CanvasConstants';
// 插入行为实现函数
export function insertImage(globalData: any, x: number, y: number, options?: ModuleInsertOptionsType) {
  const setValue = globalData?.images.setValue;
  if (setValue) {
    return pickAndInsertImage(setValue, x, y, options);
  }
}
export function insertText(globalData: any, x: number, y: number, options?: ModuleInsertOptionsType) {
  const setValue = globalData?.texts.setValue;
  if (setValue) {
    const newText: TextBlockInfo = {
      id: Date.now().toString(),
      text: "新文本",
      x,
      y,
      color: "#333",
      fontSize: options?.fontSize ?? 18,
      fontFamily: undefined,
    };
    setValue((prev: TextBlockInfo[] = []) => [...prev, newText]);
  }
}
export function insertVideo(globalData: any, x: number, y: number, options?: ModuleInsertOptionsType) {
  const setValue = globalData?.videos.setValue;
  if (setValue) {
    const newVideo: VideoBlockInfo = {
      id: Date.now().toString(),
      uri: '',
      x,
      y,
      width: options?.width ?? 160,
      height: options?.height ?? 90,
    };
    setValue((prev: VideoBlockInfo[] = []) => [...prev, newVideo]);
  }
}
export function insertWebLink(globalData: any, x: number, y: number, options?: ModuleInsertOptionsType) {
  const setValue = globalData?.webLinks.setValue;
  if (setValue) {
    const newLink: WebLinkBlockInfo = {
      id: Date.now().toString(),
      url: 'https://',
      x,
      y,
      title: options?.title ?? '新链接',
    };
    setValue((prev: WebLinkBlockInfo[] = []) => [...prev, newLink]);
  }
}
export function insertAudio(globalData: any, x: number, y: number, options?: ModuleInsertOptionsType) {
  const setValue = globalData?.audios.setValue;
  if (setValue) {
    const newAudio: AudioBlockInfo = {
      id: Date.now().toString(),
      uri: '',
      x,
      y,
      duration: options?.duration,
    };
    setValue((prev: AudioBlockInfo[] = []) => [...prev, newAudio]);
  }
}

export function insertCanvas(globalData: any, x: number, y: number, options?: ModuleInsertOptionsType) {
  const setValue = globalData?.canvases.setValue;
  const i = Date.now().toString();
  if (setValue) {
    const newCanvas = {
      id: options?.id ? options.id + '-' + i : i, // 生成唯一id
      x,
      y,
      width: options?.width ?? CANVAS_INIT_SIZE,
      height: options?.height ?? CANVAS_INIT_SIZE,
      backgroundColor: options?.backgroundColor ?? '#ffffff',
    };
    setValue((prev: any[] = []) => [...prev, newCanvas]);
  }
}