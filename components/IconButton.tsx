import { useTheme } from "@react-navigation/native";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import ThemedText from "./ThemedText";


/**
 * 通用图标按钮组件
 * @param onPress 点击事件
 * @param icon 图标内容（可为字符串或 ReactNode）
 * @param style 外部按钮样式
 * @param textStyle 图标样式
 * @param accessibilityLabel 无障碍标签
 */
const IconButton: React.FC<{
  onPress: () => void;
  icon: React.ReactNode;
  style?: any;
  textStyle?: any;
  accessibilityLabel?: string;
}> = ({ onPress, icon, style, textStyle, accessibilityLabel }) => {
  const theme = useTheme();
  const iconBtnBg = theme.colors.background || '#fff';
  const iconBtnBorder = theme.colors.border || '#bbb';
  return (
    <TouchableOpacity
      style={[styles.iconBtn, { backgroundColor: iconBtnBg, borderColor: iconBtnBorder }, style]}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
    >
      <ThemedText style={[styles.iconBtnText, textStyle]}>{icon}</ThemedText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#bbb',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  iconBtnText: {
    fontSize: 20,
  },
});

export default IconButton;
