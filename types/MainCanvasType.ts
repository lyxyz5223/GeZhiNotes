import { DrawPathInfo, TextBlockInfo, ImageBlockInfo, AudioBlockInfo, LinkBlockInfo, VideoBlockInfo, WebLinkBlockInfo, EmbeddedCanvasData } from "@/types/CanvasTypes";

export type GlobalPathsType = { [id: string]: DrawPathInfo[] };
export type GlobalTextsType = { [id: string]: TextBlockInfo[] };
export type GlobalImagesType = { [id: string]: ImageBlockInfo[] };
export type GlobalAudiosType = { [id: string]: AudioBlockInfo[] };
export type GlobalCanvasLinksType = { [id: string]: LinkBlockInfo[] };
export type GlobalVideosType = { [id: string]: VideoBlockInfo[] };
export type GlobalWebLinksType = { [id: string]: WebLinkBlockInfo[] };
export type GlobalCanvasesType = { [id: string]: EmbeddedCanvasData[] };

// 全局画布数据结构，包含所有类型
export interface GlobalCanvasStates {
  paths: GlobalPathsType;
  texts: GlobalTextsType;
  images: GlobalImagesType;
  audios: GlobalAudiosType;
  videos: GlobalVideosType;
  links: GlobalCanvasLinksType;
  webLinks: GlobalWebLinksType;
  canvases: GlobalCanvasesType;
}
