import { CanvasMode } from "@/types/CanvasTypes";
import { useTheme } from "@react-navigation/native";
import React, { useCallback } from "react";
import { View } from "react-native";
import IconButton from "./IconButton";

type ModeButtonProps = {
  mode: CanvasMode;
  icon: React.ReactNode; // 使用字符串表示图标
  accessibilityLabel: string; // 使用字符串表示标签，用于无障碍访问
};

const modeList: ModeButtonProps[] = [
  {
    mode: CanvasMode.Hand,
    icon: "🔲",
    accessibilityLabel: "切换为拖动模式"
  },
  {
    mode: CanvasMode.Draw,
    icon: "✏️",
    accessibilityLabel: "切换为绘图模式"
  },
  {
    mode: CanvasMode.Text,
    icon: "🔤",
    accessibilityLabel: "切换为文本模式"
  },
  {
    mode: CanvasMode.Image,
    icon: "🖼️",
    accessibilityLabel: "切换为图片模式"
  },
  {
    mode: CanvasMode.Video,
    icon: "🎬",
    accessibilityLabel: "切换为视频模式"
  },
  {
    mode: CanvasMode.WebLink,
    icon: "🔗",
    accessibilityLabel: "切换为网页链接模式"
  },
  {
    mode: CanvasMode.Audio,
    icon: "🎵",
    accessibilityLabel: "切换为音频模式"
  },
  {
    mode: CanvasMode.Link,
    icon: "🪢",
    accessibilityLabel: "切换为节点连接模式"
  },
  {
    mode: CanvasMode.Canvas,
    icon: "🎨",
    accessibilityLabel: "切换为嵌入式画布模式"
  }
];



interface ModeSelectorProps {
  mode: CanvasMode;
  setMode: (mode: CanvasMode) => void;
  style?: any;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, setMode, style }) => {
  const theme = useTheme();
  const activeBg = theme.colors.primary + '22' || '#e0eaff';
  const activeBorder = theme.colors.primary || '#007aff';

  const getActiveStyle = useCallback(
    (target: CanvasMode) =>
      mode === target ? { backgroundColor: activeBg, borderColor: activeBorder } : undefined
  , [activeBg, activeBorder, mode]);

  const getModeButtonProps = useCallback(
    (props: ModeButtonProps) => {
      return {
        onPress: () => setMode(props.mode),
        icon: props.icon,
        style: getActiveStyle(props.mode),
        textStyle: { fontSize: 18 },
        accessibilityLabel: props.accessibilityLabel,
      };
    },[setMode, getActiveStyle]);
  
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
      {modeList.map((props) => (
        <IconButton
          key={props.mode}
          {...getModeButtonProps(props)}
        />
      ))}
    </View>
  );
};

export default ModeSelector;
