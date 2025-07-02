import { CustomCanvasProps, ImageBlockInfo, StateUpdater } from "@/types/CanvasTypes";
import React, { useCallback, useId, useMemo, useState } from "react";
import { Pressable, View, StyleSheet, GestureResponderEvent } from "react-native";
import CanvasImageItem from "./CanvasImageItem";
import { pickAndCreateImageBlock, pickAndInsertImage } from "@/utils/CanvasAddImageUtils";

function CanvasImageModule({ props, extraParams }: { props: CustomCanvasProps; extraParams: any }) {
  const imagesInGlobal: ImageBlockInfo[] = props.globalData?.images?.value || [];
  const setImagesInGlobal: StateUpdater<ImageBlockInfo[]> | undefined = props.globalData?.images?.setValue;
  // 当前操作的图片id和模式（drag/resize/null）
  const [active, setActive] = useState<{ id: string | null; mode: 'drag' | 'resize' | null; corner?: 'br'|'tr'|'bl'|'tl' }>({ id: null, mode: null });

  // 画布 transform 透传，默认值与 CustomCanvas 保持一致
  const canvasContentsTransform = useMemo(() => extraParams.contentsTransform.value
    || { translateX: 0, translateY: 0, scale: 1 }, [extraParams.contentsTransform.value]);

  // const key = useId();

  const handlePress = useCallback(async (e: GestureResponderEvent) => {
    const { pageX, pageY } = e.nativeEvent;
    const clickX = pageX / canvasContentsTransform.scale - canvasContentsTransform.translateX;
    const clickY = pageY / canvasContentsTransform.scale - canvasContentsTransform.translateY;
    // 点击画布时添加一个图片
    // 弹出文件选择器
    if (setImagesInGlobal) {
      const newImage = await pickAndCreateImageBlock(
        clickX,
        clickY,
        {
          width: props.width / 3,
          height: props.height / 3,
        });
      // 如果选择了图片，则添加
      if (newImage) {
        setImagesInGlobal(prev => [...prev, newImage]);
      }
    }
  }, [setImagesInGlobal, props.width, props.height, canvasContentsTransform]);

  return (
    <>
      {props.mode?.value === 'image' &&
        <Pressable style={StyleSheet.absoluteFill} onPress={handlePress}>
        </Pressable>
      }
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
    </>
  );
}

export default CanvasImageModule;
