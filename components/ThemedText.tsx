import { useTheme } from "@react-navigation/native";
import React from "react";
import { StyleProp, Text, TextProps, TextStyle } from "react-native";

/**
 * 主题文本组件，自动使用当前主题的文本颜色
 * 用法：<ThemedText style={...}>内容</ThemedText>
 */
const ThemedText: React.FC<TextProps> = ({ style, ...props }) => {
  const { colors } = useTheme();
  // 合并外部 style，优先外部 color
  const themedStyle: StyleProp<TextStyle> = [
    { color: colors.text },
    style,
  ];
  return <Text {...props} style={themedStyle} />;
};

export default ThemedText;
