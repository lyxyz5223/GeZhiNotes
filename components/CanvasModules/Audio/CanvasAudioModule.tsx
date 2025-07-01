import { AudioBlockInfo, CustomCanvasProps, StateUpdater, StateWithSetter } from "@/types/CanvasTypes";
import { useTheme } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import React, { useMemo, useState } from "react";
import { Alert, Button, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ThemedTextInput from "../../ThemedTextInput";
import CanvasAudioItem from "./CanvasAudioItem";

const CanvasAudioModule: React.FC<{ props: CustomCanvasProps; extraParams: any }> = ({ props, extraParams }) => {
  const theme = useTheme();
  const audios: AudioBlockInfo[] = useMemo(() => props.globalData?.audios?.value || [], [props.globalData?.audios?.value]);
  const setAudios: StateUpdater<AudioBlockInfo[]> | undefined = props.globalData?.audios?.setValue;
  const cTransform = extraParams?.contentsTransform?.value ||
    { translateX: 0, translateY: 0, scale: 1 };

  const [playingId, setPlayingId] = useState<string | null>(null);
  const [soundObj, setSoundObj] = useState<Audio.Sound | null>(null);
  const [isLoading, setIsLoading] = useState(false);


  const memorizedAudios: StateWithSetter<AudioBlockInfo[]> = useMemo(() => {
    return {
      value: audios,
      setValue: setAudios,
    };
  }, [audios, setAudios]);
  const memorizedPlayingId: StateWithSetter<string | null> = useMemo(() => {
    return {
      value: playingId,
      setValue: setPlayingId,
    };
  }, [playingId, setPlayingId]);
  const memorizedSoundObj: StateWithSetter<Audio.Sound | null> = useMemo(() => {
    return {
      value: soundObj,
      setValue: setSoundObj,
    };
  }, [soundObj, setSoundObj]);
  const memorizedIsLoading: StateWithSetter<boolean> = useMemo(() => {
    return {
      value: isLoading,
      setValue: setIsLoading,
    };
  }, [isLoading, setIsLoading]);

  // 判断当前是否为音频添加模式
  const isAudioMode = props.mode?.value === 'audio';

  // 音频来源选择弹窗控制
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [pendingPos, setPendingPos] = useState<{x: number, y: number}>({x: 0, y: 0});

  // 网络音频输入弹窗控制
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [inputName, setInputName] = useState("");
  const [inputPos, setInputPos] = useState<{x: number, y: number}>({x: 0, y: 0});

  // 在点击处添加音频（仅音频模式下响应）
  const handlePress = async (e: any) => {
    if (!isAudioMode) return;
    const { pageX, pageY } = e.nativeEvent;
    const clickX = pageX / cTransform.scale - cTransform.translateX;
    const clickY = pageY / cTransform.scale - cTransform.translateY;
    setPendingPos({ x: clickX, y: clickY });
    setShowSourceModal(true);
  };

  // 获取音频元数据（如 title/artist），优先用于名称
  async function getAudioMetaName(uri: string): Promise<string> {
    // 仅支持部分平台和格式，web/安卓/ios兼容性有限
    try {
      // 尝试用 expo-av 获取元数据（部分平台支持）
      const { sound } = await Audio.Sound.createAsync({ uri }, {}, undefined, false);
      // @ts-ignore
      const meta = sound?._metadata || sound?._metadataRaw || {};
      await sound.unloadAsync();
      if (meta.title && typeof meta.title === 'string') return meta.title;
      if (meta.artist && typeof meta.artist === 'string') return meta.artist;
      if (meta.album && typeof meta.album === 'string') return meta.album;
    } catch {}
    return '';
  }

  // 选择网络链接
  const handlePickNetwork = () => {
    setShowSourceModal(false);
    setInputPos(pendingPos);
    setInputValue("");
    setInputName("");
    setShowInput(true);
  };

  // 网络音频/自定义名字插入逻辑
  const handleInsertNetworkAudio = async () => {
    if (!setAudios) return;
    const uri = inputValue.trim();
    let name = inputName.trim();
    if (!uri) return;
    // 优先尝试获取音频元数据
    if (!name) {
      name = await getAudioMetaName(uri);
    }
    // 自动解析uri
    if (!name) {
      try {
        let n = uri.split('/').pop() || uri;
        n = n.split('?')[0].split('#')[0];
        if (/^[0-9a-fA-F]{32,}\.[a-zA-Z0-9]+$/.test(n)) n = '';
        if (!/\.[a-zA-Z0-9]+$/.test(n) && n.length > 20) n = '';
        if (/^(document|audio|file|tmp)[\-_]?[0-9a-fA-F]{8,}/i.test(n)) n = '';
        try { n = decodeURIComponent(n); } catch { }
        if (/^%[0-9a-fA-F]{2,}/.test(n)) n = '';
        if (/^\d{10,}$/.test(n)) n = '';
        if (/^[0-9a-fA-F]{16,}\.[a-zA-Z0-9]+$/.test(n)) n = '';
        name = n;
      } catch { name = ''; }
    }
    const { x, y } = inputPos;
    const newAudio: AudioBlockInfo = {
      id: Date.now().toString(),
      uri,
      name,
      x,
      y,
      width: 180, // 新增，保持与CanvasAudioItem初始宽度一致
      height: 40, // 新增，保持与CanvasAudioItem初始高度一致
      duration: 0,
    };
    setAudios((prev: AudioBlockInfo[]) => [...(prev || []), newAudio]);
    setShowInput(false);
    setInputValue("");
    setInputName("");
  };

  // 选择本地文件
  const handlePickLocal = async () => {
    setShowSourceModal(false);
    if (!setAudios) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
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
      // 优先尝试获取音频元数据
      if (!name) {
        name = await getAudioMetaName(uri);
      }
      setInputPos(pendingPos);
      setInputValue(uri);
      setInputName(name);
      setShowInput(true);
    } catch (e) {
      Alert.alert('选择音频失败', String(e));
    }
  };

  return (
    <>
      {props.mode?.value === 'audio' &&
        <Pressable style={StyleSheet.absoluteFill}
          onPress={handlePress}
        >
        </Pressable>
      }
      {/* 音频控件渲染 */}
      {audios.map((audio: AudioBlockInfo, idx: number) => (
        <CanvasAudioItem
          key={audio.id || `audio-${idx}`}
          audio={audio}
          audiosInGlobal={[audios, setAudios!]}
          contentsTransform={cTransform}
        />
      ))}
      {/* 音频来源选择弹窗 */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Modal visible={showSourceModal} transparent animationType="fade" onRequestClose={()=>setShowSourceModal(false)}>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent:'center', alignItems:'center' }}>
            <View style={{ backgroundColor: theme.colors.card, borderRadius:12, padding:24, width:280, alignItems:'center', borderColor: theme.colors.border, borderWidth: 1 }}>
              <Text style={{ fontSize:18, fontWeight:'bold', marginBottom:18, color: theme.colors.text }}>添加音频</Text>
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
        {/* 网络音频/自定义名字输入弹窗 */}
        <Modal visible={showInput} transparent animationType="fade" onRequestClose={()=>setShowInput(false)}>
          <View style={{ flex:1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent:'center', alignItems:'center' }}>
            <View style={{ backgroundColor: theme.colors.card, borderRadius:8, padding:20, width:300, borderColor: theme.colors.border, borderWidth: 1 }}>
              <Text style={{ fontSize:16, marginBottom:8, color: theme.colors.text }}>请输入音频链接（mp3等）</Text>
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
                <Button title="插入" onPress={handleInsertNetworkAudio} color={theme.colors.primary} />
              </View>
            </View>
          </View>
        </Modal>
      </View>

    </>
  );
};


const styles = StyleSheet.create({
  addBtn: {
    position: 'absolute', left: 10, top: 320, width: 36, height: 36, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#bbb', alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
});

export default CanvasAudioModule;
