import { useTheme } from "@react-navigation/native";
import React from "react";
import { TextInput, TextInputProps } from "react-native";

/**
 * 主题输入框组件，自动使用当前主题的文本颜色
 * 用法：<ThemedTextInput style={...} ... />
 */
const ThemedTextInput: React.FC<TextInputProps> = ({ style, ...props }) => {
  const { colors } = useTheme();
  return <TextInput {...props} style={[{ color: colors.text }, style]} />;
};

export default ThemedTextInput;
