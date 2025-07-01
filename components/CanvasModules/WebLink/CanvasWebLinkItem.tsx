// import { WebLinkBlockInfo } from '@/types/CanvasTypes';
// import React, { useRef, useState } from 'react';
// import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// import { Gesture, GestureDetector } from 'react-native-gesture-handler';
// import Animated, {
//   useAnimatedStyle,
//   useSharedValue,
// } from 'react-native-reanimated';

// const HANDLE_SIZE = 16;

// interface CanvasWebLinkItemProps {
//   link: WebLinkBlockInfo;
//   linksInGlobal: WebLinkBlockInfo[];
//   setLinksInGlobal: (links: WebLinkBlockInfo[]) => void;
//   contentsTransform: { scale: number; translateX: number; translateY: number };
//   children: React.ReactNode;
//   active?: string | null;
//   setActive?: React.Dispatch<React.SetStateAction<string | null>>;
//   onPress?: (link: WebLinkBlockInfo) => void;
//   onLongPress?: (link: WebLinkBlockInfo) => void;
// }

// const CanvasWebLinkItem = ({
//   link,
//   linksInGlobal,
//   setLinksInGlobal,
//   contentsTransform,
//   children,
//   active,
//   setActive,
//   onPress,
//   onLongPress,
// }: CanvasWebLinkItemProps) => {
//   // 使用共享值来跟踪位置和大小
//   const x = useSharedValue(link.x);
//   const y = useSharedValue(link.y);
//   const width = useSharedValue(link.width || 200);
//   const height = useSharedValue(link.height || 40);

//   // 当前是否正在拖动或调整大小
//   const [isDragging, setIsDragging] = useState(false);
//   const [isResizing, setIsResizing] = useState(false);
//   const [resizeCorner, setResizeCorner] = useState<string | null>(null);

//   // 开始位置记录
//   const startX = useRef(0);
//   const startY = useRef(0);
//   const startWidth = useRef(0);
//   const startHeight = useRef(0);

//   // 创建拖动手势
//   const dragGesture = Gesture.Pan()
//     .onBegin(() => {
//       if (setActive) {
//         setActive(link.id);
//       }
//       setIsDragging(true);
//       startX.current = link.x;
//       startY.current = link.y;
//     })
//     .onUpdate((e) => {
//       // 计算缩放补偿后的偏移量
//       const scale = contentsTransform.scale || 1;
//       x.value = startX.current + e.translationX / scale;
//       y.value = startY.current + e.translationY / scale;
//     })
//     .onEnd(() => {
//       setIsDragging(false);
//       // 更新全局状态
//       if (setLinksInGlobal) {
//         const updatedLinks = linksInGlobal.map((item) =>
//           item.id === link.id ? { ...item, x: x.value, y: y.value } : item
//         );
//         setLinksInGlobal(updatedLinks);
//       }
//       console.log(`链接 ${link.id} 移动到:`, { x: x.value, y: y.value });
//     });

//   // 创建调整大小的手势
//   const createResizeGesture = (corner: string) => {
//     return Gesture.Pan()
//       .onBegin(() => {
//         if (setActive) {
//           setActive(link.id);
//         }
//         setIsResizing(true);
//         setResizeCorner(corner);
//         startX.current = link.x;
//         startY.current = link.y;
//         startWidth.current = link.width || 200;
//         startHeight.current = link.height || 40;
//       })
//       .onUpdate((e) => {
//         const scale = contentsTransform.scale || 1;
//         let newWidth = startWidth.current;
//         let newHeight = startHeight.current;
//         let newX = startX.current;
//         let newY = startY.current;

//         // 根据不同角落计算新的尺寸和位置
//         switch (corner) {
//           case 'topLeft':
//             newWidth = Math.max(
//               100,
//               startWidth.current - e.translationX / scale
//             );
//             newHeight = Math.max(
//               40,
//               startHeight.current - e.translationY / scale
//             );
//             newX = startX.current + startWidth.current - newWidth;
//             newY = startY.current + startHeight.current - newHeight;
//             break;
//           case 'topRight':
//             newWidth = Math.max(
//               100,
//               startWidth.current + e.translationX / scale
//             );
//             newHeight = Math.max(
//               40,
//               startHeight.current - e.translationY / scale
//             );
//             newY = startY.current + startHeight.current - newHeight;
//             break;
//           case 'bottomLeft':
//             newWidth = Math.max(
//               100,
//               startWidth.current - e.translationX / scale
//             );
//             newHeight = Math.max(
//               40,
//               startHeight.current + e.translationY / scale
//             );
//             newX = startX.current + startWidth.current - newWidth;
//             break;
//           case 'bottomRight':
//             newWidth = Math.max(
//               100,
//               startWidth.current + e.translationX / scale
//             );
//             newHeight = Math.max(
//               40,
//               startHeight.current + e.translationY / scale
//             );
//             break;
//         }

//         // 更新共享值
//         x.value = newX;
//         y.value = newY;
//         width.value = newWidth;
//         height.value = newHeight;
//       })
//       .onEnd(() => {
//         setIsResizing(false);
//         setResizeCorner(null);

//         // 更新全局状态
//         if (setLinksInGlobal) {
//           const updatedLinks = linksInGlobal.map((item) =>
//             item.id === link.id
//               ? {
//                   ...item,
//                   x: x.value,
//                   y: y.value,
//                   width: width.value,
//                   height: height.value,
//                 }
//               : item
//           );
//           setLinksInGlobal(updatedLinks);
//         }

//         console.log(`链接 ${link.id} 调整大小:`, {
//           x: x.value,
//           y: y.value,
//           width: width.value,
//           height: height.value,
//         });
//       });
//   };

//   // 创建四个角的调整大小手势
//   const topLeftGesture = createResizeGesture('topLeft');
//   const topRightGesture = createResizeGesture('topRight');
//   const bottomLeftGesture = createResizeGesture('bottomLeft');
//   const bottomRightGesture = createResizeGesture('bottomRight');

//   // 点击和长按处理
//   const handlePress = () => {
//     if (!isDragging && !isResizing && onPress) {
//       onPress(link);
//     }
//   };

//   const handleLongPress = () => {
//     if (onLongPress) {
//       onLongPress(link);
//     }
//   };

//   // 处理删除
//   const handleDelete = () => {
//     Alert.alert('删除链接', '确定要删除此链接吗？', [
//       { text: '取消', style: 'cancel' },
//       {
//         text: '删除',
//         style: 'destructive',
//         onPress: () => {
//           if (setLinksInGlobal) {
//             setLinksInGlobal(
//               linksInGlobal.filter((item) => item.id !== link.id)
//             );
//           }
//         },
//       },
//     ]);
//   };

//   // 动画样式
//   const animatedStyle = useAnimatedStyle(() => {
//     return {
//       position: 'absolute',
//       left: x.value,
//       top: y.value,
//       width: width.value,
//       height: height.value,
//     };
//   });

//   // 检查是否为活动状态
//   const isActive = active === link.id;

//   // 组合所有手势
//   const combinedGesture = Gesture.Exclusive(
//     dragGesture,
//     Gesture.Simultaneous(
//       topLeftGesture,
//       topRightGesture,
//       bottomLeftGesture,
//       bottomRightGesture
//     )
//   );

//   return (
//     <GestureDetector gesture={combinedGesture}>
//       <Animated.View
//         style={[
//           styles.container,
//           animatedStyle,
//           isActive ? styles.active : null,
//         ]}
//       >
//         <CAn>
//       </Animated.View>
//     </GestureDetector>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     position: 'absolute',
//     borderWidth: 1,
//     borderColor: 'rgba(0,122,255,0.3)',
//     borderRadius: 8,
//     overflow: 'visible',
//     zIndex: 10,
//   },
//   content: {
//     width: '100%',
//     height: '100%',
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   active: {
//     borderWidth: 2,
//     borderColor: '#007AFF',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   resizeHandle: {
//     position: 'absolute',
//     width: HANDLE_SIZE,
//     height: HANDLE_SIZE,
//     backgroundColor: '#fff',
//     borderWidth: 2,
//     borderColor: '#007AFF',
//     borderRadius: HANDLE_SIZE / 2,
//   },
//   topLeft: {
//     top: -HANDLE_SIZE / 2,
//     left: -HANDLE_SIZE / 2,
//   },
//   topRight: {
//     top: -HANDLE_SIZE / 2,
//     right: -HANDLE_SIZE / 2,
//   },
//   bottomLeft: {
//     bottom: -HANDLE_SIZE / 2,
//     left: -HANDLE_SIZE / 2,
//   },
//   bottomRight: {
//     bottom: -HANDLE_SIZE / 2,
//     right: -HANDLE_SIZE / 2,
//   },
//   deleteButton: {
//     position: 'absolute',
//     top: -20,
//     right: -20,
//     width: 24,
//     height: 24,
//     borderRadius: 12,
//     backgroundColor: '#ff3b30',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 20,
//   },
//   deleteButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//     lineHeight: 24,
//   },
// });

// export default CanvasWebLinkItem;
