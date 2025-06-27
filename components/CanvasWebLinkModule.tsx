import { CustomCanvasProps, StateUpdater, WebLinkBlockInfo } from "@/types/CanvasTypes";
import React from "react";
import { Linking, Text, TouchableOpacity } from "react-native";

function CanvasWebLinkModule({ props, extraParams }: { props: CustomCanvasProps; extraParams: any }) {
  // 统一使用 globalData
  const webLinksInGlobal: WebLinkBlockInfo[] = props.globalData?.webLinks || [];
  const setWebLinksInGlobal: StateUpdater<WebLinkBlockInfo[]> | undefined = props.globalData?.setWebLinks;
  return (
    <>
      {webLinksInGlobal.map((link: WebLinkBlockInfo, idx: number) => (
        <TouchableOpacity
          key={link.id || `weblink-${idx}`}
          style={{ position: 'absolute', left: link.x, top: link.y, padding: 6, backgroundColor: '#e0e0e0', borderRadius: 6 }}
          onPress={() => Linking.openURL(link.url)}
        >
          <Text style={{ color: '#007aff', textDecorationLine: 'underline' }}>{link.title || link.url}</Text>
        </TouchableOpacity>
      ))}
    </>
  );
}

export default CanvasWebLinkModule;
