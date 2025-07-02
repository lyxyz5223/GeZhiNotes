import { CustomCanvasProps, StateUpdater, VideoBlockInfo } from "@/types/CanvasTypes";
import { useTheme } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import React, { useMemo, useState } from "react";
import { Alert, Button, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import ThemedTextInput from "../../ThemedTextInput";
import CanvasVideoItem from "./CanvasVideoItem";

function CanvasVideoModule({ props, extraParams }: { props: CustomCanvasProps; extraParams: any }) {
  // 统一使用 globalData
  const videosInGlobal: VideoBlockInfo[] = useMemo(() => props.globalData?.videos?.value || [], [props.globalData?.videos?.value]);
  const setVideosInGlobal: StateUpdater<VideoBlockInfo[]> | undefined = props.globalData?.videos?.setValue;
  const theme = useTheme();
  const cTransform = extraParams?.contentsTransform?.value || { translateX: 0, translateY: 0, scale: 1 };

  // 判断当前是否为视频添加模式
  const isVideoMode = props.mode?.value === 'video';

  // 视频来源选择弹窗控制
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [pendingPos, setPendingPos] = useState<{x: number, y: number}>({x: 0, y: 0});

  // 网络视频输入弹窗控制
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [inputName, setInputName] = useState("");
  const [inputPos, setInputPos] = useState<{x: number, y: number}>({x: 0, y: 0});

  // 在点击处添加视频（仅视频模式下响应）
  const handlePress = async (e: any) => {
    if (!isVideoMode) return;
    const { pageX, pageY } = e.nativeEvent;
    const clickX = pageX / cTransform.scale - cTransform.translateX;
    const clickY = pageY / cTransform.scale - cTransform.translateY;
    setPendingPos({ x: clickX, y: clickY });
    setShowSourceModal(true);
  };

  // 选择网络链接
  const handlePickNetwork = () => {
    setShowSourceModal(false);
    setInputPos(pendingPos);
    setInputValue("");
    setInputName("");
    setShowInput(true);
  };

  // 视频来源选择弹窗控制
  const handlePickLocal = async () => {
    setShowSourceModal(false);
    if (!setVideosInGlobal) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'video/*', copyToCacheDirectory: true });
      if (result.canceled) return;
      let uri = '';
      let name = '';
      if ('assets' in result && result.assets && result.assets.length > 0) {
        uri = result.assets[0].uri;
        name = result.assets[0].name || '';
      } else if ('uri' in result) {
        uri = (result as any).uri;
        name = (result as any).name || '';
      }
      setInputPos(pendingPos);
      setInputValue(uri);
      setInputName(name);
      setShowInput(true);
    } catch (e) {
      Alert.alert('选择视频失败', String(e));
    }
  };

  // 网络视频/自定义名字插入逻辑
  const getDisplayName = (uri: string) => {
    try {
      let name = uri.split('/').pop() || uri;
      name = name.split('?')[0].split('#')[0];
      if (/^[0-9a-fA-F]{32,}\.[a-zA-Z0-9]+$/.test(name)) return '视频文件';
      if (!/\.[a-zA-Z0-9]+$/.test(name) && name.length > 20) return '视频文件';
      if (/^(document|video|file|tmp)[\-_]?[0-9a-fA-F]{8,}/i.test(name)) return '视频文件';
      let decoded = name;
      try { decoded = decodeURIComponent(name); } catch {}
      if (/^%[0-9a-fA-F]{2,}/.test(decoded)) return '视频文件';
      if (/^\d{10,}$/.test(decoded)) return '视频文件';
      if (/^[0-9a-fA-F]{16,}\.[a-zA-Z0-9]+$/.test(decoded)) return '视频文件';
      return decoded;
    } catch { return '视频文件'; }
  };

  const handleInsertNetworkVideo = async () => {
    if (!setVideosInGlobal) return;
    const uri = inputValue.trim();
    let name = inputName.trim();
    if (!uri) return;
    // 自动解析uri
    if (!name) {
      name = getDisplayName(uri);
    }
    const { x, y } = inputPos;
    const newVideo: VideoBlockInfo = {
      id: Date.now().toString(),
      uri,
      x,
      y,
      width: 240, // 16:9 默认宽
      height: 135, // 16:9 默认高
      duration: 0,
      thumbUri: undefined,
    };
    setVideosInGlobal((prev: VideoBlockInfo[]) => [...(prev || []), newVideo]);
    setShowInput(false);
    setInputValue("");
    setInputName("");
  };

  return (
    <>
      {isVideoMode &&
        <Pressable style={StyleSheet.absoluteFill} onPress={handlePress} />
      }
      {/* 视频控件渲染 */}
      {videosInGlobal.map((video: VideoBlockInfo, idx: number) => (
        <CanvasVideoItem
          key={video.id || `video-${idx}`}
          video={video}
          videosInGlobal={[videosInGlobal, setVideosInGlobal!]}
          contentsTransform={cTransform}
        />
      ))}
      {/* 视频来源选择弹窗 */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Modal visible={showSourceModal} transparent animationType="fade" onRequestClose={()=>setShowSourceModal(false)}>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent:'center', alignItems:'center' }}>
            <View style={{ backgroundColor: theme.colors.card, borderRadius:12, padding:24, width:280, alignItems:'center', borderColor: theme.colors.border, borderWidth: 1 }}>
              <Text style={{ fontSize:18, fontWeight:'bold', marginBottom:18, color: theme.colors.text }}>添加视频</Text>
              <View style={{ width:'100%', flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Button title="本地文件" onPress={handlePickLocal} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button title="网络链接" onPress={handlePickNetwork} color={theme.colors.primary} />
                </View>
              </View>
              <View style={{ height: 16 }} />
              <View style={{ width:'100%' }}>
                <Button title="取消" onPress={()=>setShowSourceModal(false)} color={theme.colors.border} />
              </View>
            </View>
          </View>
        </Modal>
        {/* 网络视频/自定义名字输入弹窗 */}
        <Modal visible={showInput} transparent animationType="fade" onRequestClose={()=>setShowInput(false)}>
          <View style={{ flex:1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent:'center', alignItems:'center' }}>
            <View style={{ backgroundColor: theme.colors.card, borderRadius:8, padding:20, width:300, borderColor: theme.colors.border, borderWidth: 1 }}>
              <Text style={{ fontSize:16, marginBottom:8, color: theme.colors.text }}>请输入视频链接（mp4等）</Text>
              <ThemedTextInput
                value={inputValue}
                onChangeText={setInputValue}
                placeholder="https://..."
                style={{ borderWidth:1, borderColor:theme.colors.border, borderRadius:4, padding:8, marginBottom:12, backgroundColor: theme.colors.background, color: theme.colors.text }}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={theme.colors.text + '88'}
              />
              <Text style={{ fontSize:15, marginBottom:4, color: theme.colors.text }}>自定义名称（可选）</Text>
              <ThemedTextInput
                value={inputName}
                onChangeText={setInputName}
                placeholder="文件名（可不填自动识别）"
                style={{ borderWidth:1, borderColor:theme.colors.border, borderRadius:4, padding:8, marginBottom:12, backgroundColor: theme.colors.background, color: theme.colors.text }}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={theme.colors.text + '88'}
              />
              <View style={{ flexDirection:'row', justifyContent:'flex-end' }}>
                <Button title="取消" onPress={()=>{setShowInput(false);}} color={theme.colors.border} />
                <View style={{ width: 12 }} />
                <Button title="插入" onPress={handleInsertNetworkVideo} color={theme.colors.primary} />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

export default CanvasVideoModule;
