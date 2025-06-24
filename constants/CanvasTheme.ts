const defaultFonts = {
  regular: { fontFamily: 'System', fontWeight: 'normal' as const },
  medium: { fontFamily: 'System', fontWeight: '500' as const },
  bold: { fontFamily: 'System', fontWeight: 'bold' as const },
  heavy: { fontFamily: 'System', fontWeight: '900' as const },
};

// 主题类型定义，兼容 React Navigation Theme，可扩展自定义字段
// interface CanvasTheme {
//   dark: boolean; // 是否为暗色主题（true=暗色，false=亮色）
//   colors: {
//     primary: string;      // 主题主色，主要按钮/高亮色
//     background: string;   // 应用/画布背景色
//     card: string;         // 卡片、弹窗等容器背景色
//     text: string;         // 主要文本颜色
//     border: string;       // 边框颜色
//     notification: string; // 通知、警告等提示色
//     // 可扩展更多自定义颜色字段
//   };
//   fonts: typeof defaultFonts; // 字体配置
// }

// 自定义主题格式，兼容 React Navigation Theme
export const lightTheme = {
  dark: false,
  colors: {
    primary: '#ff6600', // 橙色主色
    background: '#fffbe6', // 明亮米黄色
    card: '#fff', // 纯白卡片
    text: '#222',
    border: '#ff6600', // 橙色边框
    notification: '#e74c3c', // 红色通知
  },
  fonts: defaultFonts,
};

export const darkTheme = {
  dark: true,
  colors: {
    primary: '#00e0ff', // 高亮青色
    background: '#181a20', // 深灰黑
    card: '#23242a', // 深色卡片
    text: '#f5f6fa',
    border: '#00e0ff', // 青色边框
    notification: '#ffeb3b', // 明亮黄通知
  },
  fonts: defaultFonts,
};

export const blueTheme = {
  dark: false,
  colors: {
    primary: '#1976d2',
    background: '#e3f2fd',
    card: '#bbdefb',
    text: '#0d47a1',
    border: '#1976d2',
    notification: '#1976d2',
  },
  fonts: defaultFonts,
};

export const greenTheme = {
  dark: false,
  colors: {
    primary: '#388e3c',
    background: '#e8f5e9',
    card: '#a5d6a7',
    text: '#1b5e20',
    border: '#388e3c',
    notification: '#388e3c',
  },
  fonts: defaultFonts,
};

export const allThemes = [
  { name: '浅色', value: lightTheme },
  { name: '深色', value: darkTheme },
  { name: '蓝色', value: blueTheme },
  { name: '绿色', value: greenTheme },
];
