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
//     darkBackground: string; // 比background色深一点背景色
//     card: string;         // 卡片、弹窗等容器背景色
//     text: string;         // 主要文本颜色
//     border: string;       // 边框颜色
//     notification: string; // 通知、警告等提示色
//     // 可扩展更多自定义颜色字段
//   };
//   fonts: typeof defaultFonts; // 字体配置
// }

// 自定义主题格式，兼容 React Navigation Theme
// 白色+灰色阴影方案
export const whiteTheme = {
  dark: false,
  colors: {
    primary: '#2563eb', // 深蓝主色
    background: '#f8fafc', // 更柔和的白
    darkBackground: '#e5e9f2', // 比background深
    card: '#ffffff', // 纯白卡片
    cardShadow: '#e2e8f0', // 浅灰阴影
    text: '#1e293b', // 深灰蓝文本
    border: '#cbd5e1', // 浅灰边框
    notification: '#f43f5e', // 鲜明红
  },
  fonts: defaultFonts,
};

// 米黄色方案
export const yellowTheme = {
  dark: false,
  colors: {
    primary: '#f59e42', // 奶油橙
    background: '#fffbe6', // 米黄
    darkBackground: '#ffe8b2', // 比background深
    card: '#fff9db', // 更柔和的米黄
    cardShadow: '#ffe082', // 浅黄阴影
    text: '#7c4700', // 深棕
    border: '#ffd59e', // 奶油边框
    notification: '#f43f5e',
  },
  fonts: defaultFonts,
};

// 粉色少女风
export const pinkTheme = {
  dark: false,
  colors: {
    primary: '#f472b6', // 柔粉主色
    background: '#fff0f6', // 粉白
    darkBackground: '#fbcfe8', // 比background深
    card: '#fce7f3', // 浅粉卡片
    cardShadow: '#fbcfe8', // 粉色阴影
    text: '#be185d', // 深粉
    border: '#f472b6',
    notification: '#fb7185', // 鲜明粉
  },
  fonts: defaultFonts,
};

// 极简黑白
export const minimalTheme = {
  dark: false,
  colors: {
    primary: '#111827', // 极深灰
    background: '#f9fafb', // 极浅灰
    darkBackground: '#e5e7eb', // 比background深
    card: '#ffffff',
    cardShadow: '#d1d5db',
    text: '#111827',
    border: '#e5e7eb',
    notification: '#f43f5e',
  },
  fonts: defaultFonts,
};

export const darkTheme = {
  dark: true,
  colors: {
    primary: '#38bdf8', // 明亮蓝
    toolbarBackground: '#18181b',
    background: '#18181b', // 极深灰
    darkBackground: '#23232b', // 比background深
    card: '#23232b', // 深灰卡片
    cardShadow: '#111113', // 更深阴影
    text: '#f4f4f5', // 柔白
    border: '#38bdf8', // 明亮蓝
    notification: '#fbbf24', // 柔黄
  },
  fonts: defaultFonts,
};

export const blueTheme = {
  dark: false,
  colors: {
    primary: '#2563eb', // 深蓝
    background: '#e0f2fe', // 浅蓝
    darkBackground: '#bae6fd', // 比background深
    card: '#bae6fd', // 更浅蓝
    text: '#0c4a6e', // 深蓝文本
    border: '#2563eb',
    notification: '#38bdf8',
  },
  fonts: defaultFonts,
};

export const greenTheme = {
  dark: false,
  colors: {
    primary: '#22c55e', // 鲜绿
    background: '#f0fdf4', // 浅绿
    darkBackground: '#bbf7d0', // 比background深
    card: '#bbf7d0', // 更浅绿
    text: '#166534', // 深绿
    border: '#22c55e',
    notification: '#4ade80',
  },
  fonts: defaultFonts,
};

export const allThemes = [
  { name: '白色', value: whiteTheme },
  { name: '米黄色', value: yellowTheme },
  { name: '粉色', value: pinkTheme },
  { name: '极简黑白', value: minimalTheme },
  { name: '深色', value: darkTheme },
  { name: '蓝色', value: blueTheme },
  { name: '绿色', value: greenTheme },
];
