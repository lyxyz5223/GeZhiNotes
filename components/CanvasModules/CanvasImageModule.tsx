import { CustomCanvasProps, ImageBlockInfo, StateUpdater } from "@/types/CanvasTypes";
import React, { useId, useState } from "react";
import { View } from "react-native";
import CanvasImageItem from "./CanvasImageItem";

function CanvasImageModule({ props, extraParams }: { props: CustomCanvasProps; extraParams: any }) {
  const imagesInGlobal: ImageBlockInfo[] = props.globalData?.images || [];
  const setImagesInGlobal: StateUpdater<ImageBlockInfo[]> | undefined = props.globalData?.setImages;
  // 当前操作的图片id和模式（drag/resize/null）
  const [active, setActive] = useState<{ id: string | null; mode: 'drag' | 'resize' | null; corner?: 'br'|'tr'|'bl'|'tl' }>({ id: null, mode: null });

  // 画布 transform 透传，默认值与 CustomCanvas 保持一致
  const { canvasContentsTransform } = extraParams.contentsTransform || { canvasContentsTransform: { scale: 1, translateX: 0, translateY: 0 } };

  const key = useId();
  
  return (
    <View style={{ flex: 1 }}>
      {imagesInGlobal.map((img: ImageBlockInfo) => (
        <CanvasImageItem
          key={img.id}
          img={img}
          imagesInGlobal={imagesInGlobal}
          setImagesInGlobal={setImagesInGlobal}
          active={active}
          setActive={setActive}
          contentsTransform={canvasContentsTransform}
        />
      ))}
    </View>
  );
}

export default CanvasImageModule;
