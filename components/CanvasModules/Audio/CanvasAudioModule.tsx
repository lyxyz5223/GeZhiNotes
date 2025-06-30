import { AudioBlockInfo, CustomCanvasProps, StateUpdater } from "@/types/CanvasTypes";
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import React, { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const CanvasAudioModule: React.FC<{ props: CustomCanvasProps; extraParams: any }> = ({ props, extraParams }) => {
  const audiosInGlobal: AudioBlockInfo[] = props.globalData?.audios?.value || [];
  const setAudiosInGlobal: StateUpdater<AudioBlockInfo[]> | undefined = props.globalData?.audios?.setValue;
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [soundObj, setSoundObj] = useState<Audio.Sound | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 选择本地音频文件
  const pickAudioFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
      if (result.canceled) return;
      // expo-document-picker v14+ 返回 result.assets，旧版 result.uri
      let uri = '';
      if ('assets' in result && result.assets && result.assets.length > 0) {
        uri = result.assets[0].uri;
      } else if ('uri' in result) {
        uri = (result as any).uri;
      }
      if (uri && setAudiosInGlobal) {
        const newAudio: AudioBlockInfo = {
          id: Date.now().toString(),
          uri,
          x: 80,
          y: 80,
          duration: 0,
        };
        setAudiosInGlobal((prev: AudioBlockInfo[]) => [...(prev || []), newAudio]);
      }
    } catch (e) {
      Alert.alert('选择音频失败', String(e));
    }
  }, [setAudiosInGlobal]);

  // 插入网络音频
  const addNetworkAudio = useCallback(() => {
    if (!setAudiosInGlobal) return;
    Alert.prompt(
      '插入网络音频',
      '请输入音频链接（mp3等）',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '插入',
          onPress: (uri) => {
            if (uri) {
              const newAudio: AudioBlockInfo = {
                id: Date.now().toString(),
                uri,
                x: 80,
                y: 80,
                duration: 0,
              };
              setAudiosInGlobal((prev: AudioBlockInfo[]) => [...(prev || []), newAudio]);
            }
          },
        },
      ],
      'plain-text',
      ''
    );
  }, [setAudiosInGlobal]);

  // 添加音频弹窗
  const handleAddAudio = useCallback(() => {
    Alert.alert('添加音频', '请选择音频来源', [
      { text: '本地文件', onPress: pickAudioFile },
      { text: '网络链接', onPress: addNetworkAudio },
      { text: '取消', style: 'cancel' },
    ]);
  }, [pickAudioFile, addNetworkAudio]);

  // 删除音频
  const handleDeleteAudio = (id: string) => {
    if (!setAudiosInGlobal) return;
    Alert.alert('删除音频', '确定要删除该音频吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => setAudiosInGlobal((prev: AudioBlockInfo[]) => (prev || []).filter(a => a.id !== id)) }
    ]);
  };

  // 播放/暂停音频
  const handlePlayAudio = async (id: string, uri: string) => {
    if (playingId === id && soundObj) {
      // 已在播放，暂停
      await soundObj.pauseAsync();
      setPlayingId(null);
      return;
    }
    setIsLoading(true);
    try {
      if (soundObj) {
        await soundObj.unloadAsync();
        setSoundObj(null);
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlayingId(null);
            setIsLoading(false);
            sound.unloadAsync();
          }
        }
      );
      setSoundObj(sound);
      setPlayingId(id);
    } catch (e) {
      Alert.alert('播放失败', String(e));
      setPlayingId(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 组件卸载时释放音频
  React.useEffect(() => {
    return () => {
      if (soundObj) {
        soundObj.unloadAsync();
      }
    };
  }, [soundObj]);

  return (
    <>
      <TouchableOpacity style={styles.addBtn} onPress={handleAddAudio}>
        <MaterialIcons name="library-music" size={22} color="#388e3c" />
      </TouchableOpacity>
      {audiosInGlobal.map((audio: AudioBlockInfo, idx: number) => (
        <View
          key={audio.id || `audio-${idx}`}
          style={[styles.audioWrap, { left: audio.x, top: audio.y }]}
        >
          <TouchableOpacity style={styles.playBtn} onPress={() => handlePlayAudio(audio.id, audio.uri)}>
            {isLoading && playingId === audio.id ? (
              <MaterialIcons name="hourglass-empty" size={20} color="#388e3c" />
            ) : (
              <MaterialIcons name={playingId === audio.id ? "pause" : "play-arrow"} size={20} color="#388e3c" />
            )}
          </TouchableOpacity>
          <Text style={styles.audioText}>{audio.uri.split('/').pop()}</Text>
          <TouchableOpacity style={styles.delBtn} onPress={() => handleDeleteAudio(audio.id)}>
            <MaterialIcons name="close" size={16} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  addBtn: {
    position: 'absolute', left: 10, top: 320, width: 36, height: 36, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#bbb', alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  audioWrap: {
    position: 'absolute', minWidth: 120, minHeight: 36, flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', borderRadius: 8, borderWidth: 1, borderColor: '#a5d6a7', paddingHorizontal: 8, paddingVertical: 4,
  },
  playBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 6,
  },
  audioText: {
    flex: 1, color: '#388e3c', fontSize: 14, marginRight: 8,
  },
  delBtn: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
});

export default CanvasAudioModule;
