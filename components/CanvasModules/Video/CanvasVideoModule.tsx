import { CustomCanvasProps, StateUpdater, VideoBlockInfo } from "@/types/CanvasTypes";
import React from "react";
import { Text, View } from "react-native";

function CanvasVideoModule({ props, extraParams }: { props: CustomCanvasProps; extraParams: any }) {
  // 统一使用 globalData
  const videosInGlobal: VideoBlockInfo[] = props.globalData?.videos?.value || [];
  const setVideosInGlobal: StateUpdater<VideoBlockInfo[]> | undefined = props.globalData?.videos?.setValue;
  return (
    <>
      {videosInGlobal.map((video: VideoBlockInfo, idx: number) => (
        <View
          key={video.id || `video-${idx}`}
          style={{ position: 'absolute', left: video.x, top: video.y, width: video.width, height: video.height, backgroundColor: '#000' }}
        >
          {/* 可用 react-native-video 替换此处 */}
          <Text style={{ color: '#fff', textAlign: 'center', marginTop: 10 }}>视频占位: {video.uri}</Text>
        </View>
      ))}
    </>
  );
}

export default CanvasVideoModule;
