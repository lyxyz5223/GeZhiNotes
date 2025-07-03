import { CustomCanvasProps, StateUpdater, TextBlockInfo, TransformType } from "@/types/CanvasTypes";
import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import SimpleRichEditor, { Toolbar, ToolbarIcon } from './SimpleRichEditor';

// 富文本转纯文本工具
function htmlToPlainText(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

const MIN_WIDTH = 120;
const MIN_HEIGHT = 40;

function CanvasTextItem({
  textBlock,
  textsInGlobal,
  setTextsInGlobal,
  contentsTransform
}: {
  textBlock: TextBlockInfo;
  textsInGlobal: TextBlockInfo[];
  setTextsInGlobal?: StateUpdater<TextBlockInfo[]>;
  contentsTransform?: TransformType;
}) {
  // 拖动与缩放
  const translateX = useSharedValue(textBlock.x);
  const translateY = useSharedValue(textBlock.y);
  const width = useSharedValue(textBlock.width || MIN_WIDTH);
  const height = useSharedValue(textBlock.height || MIN_HEIGHT);
  const [editing, setEditing] = useState(false);
  const [html, setHtml] = useState(textBlock.text);
  const [toolbarVisible, setToolbarVisible] = useState(false);

  // 富文本样式本地状态
  const [fontSize, setFontSize] = useState(textBlock.fontSize ?? 17);
  const [fontFamily, setFontFamily] = useState<string|undefined>(textBlock.fontFamily);
  const [fontColor, setFontColor] = useState<string>(textBlock.fontColor ?? '#333');
  const [isBold, setIsBold] = useState(!!textBlock.isBold);
  const [isItalic, setIsItalic] = useState(!!textBlock.isItalic);
  const [isUnderline, setIsUnderline] = useState(!!textBlock.isUnderline);

  // ========== 缩放逻辑仿照 Audio 模块 ========== //
  // 支持四边缩放
  const [isResizing, setIsResizing] = useState(false);
  const widthRef = React.useRef(width.value);
  const heightRef = React.useRef(height.value);
  React.useEffect(() => { widthRef.current = width.value; }, [width.value]);
  React.useEffect(() => { heightRef.current = height.value; }, [height.value]);
  // 四边缩放起点
  const topResizeStart = React.useRef({ height: 0, y: 0 });
  const bottomResizeStart = React.useRef({ height: 0 });
  const leftResizeStart = React.useRef({ width: 0, x: 0 });
  const rightResizeStart = React.useRef({ width: 0 });
  // 拖动区宽度（随缩放自适应）
  const scale = contentsTransform?.scale ?? 1;
  const edgeHotWidth = 12 * scale;

  // 上边界拖拽
  const topResizeGesture = React.useMemo(() =>
    Gesture.Pan()
      .runOnJS(true)
      .onBegin(() => {
        setIsResizing(true);
        topResizeStart.current = { height: heightRef.current, y: translateY.value };
      })
      .onUpdate(e => {
        const scale = contentsTransform?.scale ?? 1;
        let newHeight = topResizeStart.current.height - e.translationY / scale;
        let newY = topResizeStart.current.y + e.translationY / scale;
        if (newHeight < MIN_HEIGHT) {
          newY -= (MIN_HEIGHT - newHeight);
          newHeight = MIN_HEIGHT;
        }
        height.value = newHeight;
        translateY.value = newY;
      })
      .onEnd(() => {
        setIsResizing(false);
        if (setTextsInGlobal) {
          setTextsInGlobal(prev => prev.map(item => item.id === textBlock.id ? {
            ...item,
            height: height.value,
            y: translateY.value
          } : item));
        }
      }),
    [contentsTransform, setTextsInGlobal, textBlock.id, height, translateY]
  );
  // 下边界拖拽
  const bottomResizeGesture = React.useMemo(() =>
    Gesture.Pan()
      .runOnJS(true)
      .onBegin(() => {
        setIsResizing(true);
        bottomResizeStart.current = { height: heightRef.current };
      })
      .onUpdate(e => {
        const scale = contentsTransform?.scale ?? 1;
        let newHeight = bottomResizeStart.current.height + e.translationY / scale;
        if (newHeight < MIN_HEIGHT) newHeight = MIN_HEIGHT;
        height.value = newHeight;
      })
      .onEnd(() => {
        setIsResizing(false);
        if (setTextsInGlobal) {
          setTextsInGlobal(prev => prev.map(item => item.id === textBlock.id ? {
            ...item,
            height: height.value
          } : item));
        }
      }),
    [contentsTransform, setTextsInGlobal, textBlock.id, height]
  );
  // 左边界拖拽
  const leftResizeGesture = React.useMemo(() =>
    Gesture.Pan()
      .runOnJS(true)
      .onBegin(() => {
        setIsResizing(true);
        leftResizeStart.current = { width: widthRef.current, x: translateX.value };
      })
      .onUpdate(e => {
        const scale = contentsTransform?.scale ?? 1;
        let newWidth = leftResizeStart.current.width - e.translationX / scale;
        let newX = leftResizeStart.current.x + e.translationX / scale;
        if (newWidth < MIN_WIDTH) {
          newX -= (MIN_WIDTH - newWidth);
          newWidth = MIN_WIDTH;
        }
        width.value = newWidth;
        translateX.value = newX;
      })
      .onEnd(() => {
        setIsResizing(false);
        if (setTextsInGlobal) {
          setTextsInGlobal(prev => prev.map(item => item.id === textBlock.id ? {
            ...item,
            width: width.value,
            x: translateX.value
          } : item));
        }
      }),
    [contentsTransform, setTextsInGlobal, textBlock.id, width, translateX]
  );
  // 右边界拖拽
  const rightResizeGesture = React.useMemo(() =>
    Gesture.Pan()
      .runOnJS(true)
      .onBegin(() => {
        setIsResizing(true);
        rightResizeStart.current = { width: widthRef.current };
      })
      .onUpdate(e => {
        const scale = contentsTransform?.scale ?? 1;
        let newWidth = rightResizeStart.current.width + e.translationX / scale;
        if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
        width.value = newWidth;
      })
      .onEnd(() => {
        setIsResizing(false);
        if (setTextsInGlobal) {
          setTextsInGlobal(prev => prev.map(item => item.id === textBlock.id ? {
            ...item,
            width: width.value
          } : item));
        }
      }),
    [contentsTransform, setTextsInGlobal, textBlock.id, width]
  );

  // 拖动手势（用Gesture.Pan替换panResponder）
  const dragStart = React.useRef({ x: textBlock.x, y: textBlock.y });
  const panGesture = React.useMemo(() =>
    Gesture.Pan()
      .minPointers(1)
      .maxPointers(1)
      .runOnJS(true)
      .onBegin(() => {
        if (isResizing) return;
        dragStart.current = { x: textBlock.x, y: textBlock.y };
      })
      .onUpdate(e => {
        if (isResizing) return;
        const scale = contentsTransform?.scale ?? 1;
        translateX.value = dragStart.current.x + e.translationX / scale;
        translateY.value = dragStart.current.y + e.translationY / scale;
      })
      .onEnd(e => {
        if (isResizing) return;
        const scale = contentsTransform?.scale ?? 1;
        const newX = dragStart.current.x + e.translationX / scale;
        const newY = dragStart.current.y + e.translationY / scale;
        if (setTextsInGlobal) {
          setTextsInGlobal(prev => prev.map(item => item.id === textBlock.id ? {
            ...item,
            x: newX,
            y: newY
          } : item));
        }
      })
  , [setTextsInGlobal, textBlock, contentsTransform, translateX, translateY, isResizing]);

  // 仿照Audio模块，动画样式需适配contentsTransform的scale/translate
  const animatedStyle = useAnimatedStyle(() => {
    const scale = contentsTransform?.scale ?? 1;
    const tx = contentsTransform?.translateX ?? 0;
    const ty = contentsTransform?.translateY ?? 0;
    return {
      position: 'absolute',
      left: translateX.value * scale + tx,
      top: translateY.value * scale + ty,
      width: width.value * scale,
      height: height.value * scale,
      minWidth: MIN_WIDTH * scale,
      minHeight: MIN_HEIGHT * scale,
      borderRadius: 8 * scale,
      zIndex: editing ? 100 : 1,
    };
  }, [contentsTransform, editing, translateX, translateY, width, height]);

  // 编辑完成保存
  const handleSave = (newHtml: string) => {
    setEditing(false);
    setHtml(newHtml);
    if (setTextsInGlobal) {
      setTextsInGlobal(prev => prev.map(item => item.id === textBlock.id ? {
        ...item,
        text: newHtml,
        plainText: htmlToPlainText(newHtml),
        fontSize,
        fontFamily,
        fontColor,
        isBold,
        isItalic,
        isUnderline,
      } : item));
    }
  };

  // 编辑器样式变化时同步本地状态
  const handleStyleChange = React.useCallback((style: {
    fontSize: number;
    fontFamily?: string;
    fontColor: string;
    isBold: boolean;
    isItalic: boolean;
    isUnderline: boolean;
  }) => {
    setFontSize(style.fontSize);
    setFontFamily(style.fontFamily);
    setFontColor(style.fontColor);
    setIsBold(style.isBold);
    setIsItalic(style.isItalic);
    setIsUnderline(style.isUnderline);
  }, [setFontSize, setFontFamily, setFontColor, setIsBold, setIsItalic, setIsUnderline]);

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[
        styles.textWrap,
        animatedStyle,
        {
          borderWidth: 2,
          borderColor: editing ? '#007aff' : '#e0e0e0',
          borderStyle: 'dashed',
          borderRadius: 8,
          backgroundColor: 'transparent',
        }
      ]}>
        {editing ? (
          <View style={{ flex: 1, minWidth: MIN_WIDTH, minHeight: MIN_HEIGHT }}>
            {/* 删除按钮，绝对定位在文本块外部左上角 */}
            <View style={{ position: 'absolute', left: -48, top: 0, zIndex: 20 }} pointerEvents="box-none">
              <TouchableOpacity
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#ff3b30', alignItems: 'center', justifyContent: 'center', elevation: 2, pointerEvents: 'auto' }}
                onPress={() => {
                  if (setTextsInGlobal) {
                    setTextsInGlobal(prev => prev.filter(item => item.id !== textBlock.id));
                  }
                }}
              >
                <Animated.Text style={{ color: '#fff', fontSize: 22 }}>🗑️</Animated.Text>
              </TouchableOpacity>
            </View>
            {/* 菜单按钮，绝对定位在文本块外部右上角，不遮挡输入区域 */}
            <View style={{ position: 'absolute', right: -48, top: 0, zIndex: 20 }} pointerEvents="box-none">
              <TouchableOpacity
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#007aff', alignItems: 'center', justifyContent: 'center', elevation: 2, pointerEvents: 'auto' }}
                onPress={() => setToolbarVisible(v => !v)}
              >
                <ToolbarIcon color="#fff" />
              </TouchableOpacity>
            </View>
            {/* 富文本菜单弹窗 */}
            {toolbarVisible && (
              <View style={{ position: 'absolute', right: 0, top: 48, backgroundColor: '#fff', borderRadius: 12, padding: 12, elevation: 8, maxWidth: 320, minWidth: 180, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, zIndex: 9999, width: 220 }} pointerEvents="box-none">
                <Toolbar
                  fontSize={fontSize}
                  fontFamily={fontFamily}
                  fontColor={fontColor}
                  isBold={isBold}
                  isItalic={isItalic}
                  isUnderline={isUnderline}
                  setFontSize={setFontSize}
                  setFontFamily={setFontFamily}
                  setFontColor={setFontColor}
                  onStyleChange={handleStyleChange}
                  onClose={() => setToolbarVisible(false)}
                  fontSizeInput // 新增：传递标记，Toolbar 内部用输入框替代下拉
                />
              </View>
            )}
            <SimpleRichEditor
              value={html}
              onChange={setHtml}
              fontSize={fontSize} // 用原始字号
              fontFamily={fontFamily}
              fontColor={fontColor}
              isBold={isBold}
              isItalic={isItalic}
              isUnderline={isUnderline}
              onStyleChange={handleStyleChange}
              showToolbar={false} // 不渲染内置菜单
            />
            <TouchableOpacity style={{ marginTop: 8, alignSelf: 'flex-end', backgroundColor: '#007aff', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 6 }} onPress={() => handleSave(html)}>
              <Animated.Text style={{ color: '#fff' }}>完成</Animated.Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.8} onPress={() => setEditing(true)}>
            <View style={{ flex: 1, minHeight: MIN_HEIGHT, minWidth: MIN_WIDTH, justifyContent: 'center' }}>
              {/* 只读模式下用 Text 展示内容，避免 TextInput 被 pointerEvents 拦截 */}
              <View style={{ padding: 10 }}>
                <Animated.Text
                  style={{
                    color: fontColor,
                    fontSize: fontSize, // 用原始字号
                    fontFamily: fontFamily,
                    fontWeight: isBold ? 'bold' : 'normal',
                    fontStyle: isItalic ? 'italic' : 'normal',
                    textDecorationLine: isUnderline ? 'underline' : 'none',
                    flexWrap: 'wrap',
                    flexShrink: 1,
                    flexGrow: 1,
                    width: '100%',
                    minWidth: 0,
                    minHeight: 0,
                    includeFontPadding: false,
                    textAlignVertical: 'top',
                    overflow: 'visible',
                    zIndex: 10,
                  }}
                  numberOfLines={0}
                  ellipsizeMode="tail"
                  selectable
                >
                  {htmlToPlainText(html) || '请输入文本'}
                </Animated.Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        {/* 移除右下角缩放手柄，新增四边透明拖拽区 */}
        <GestureDetector gesture={topResizeGesture}>
          <Animated.View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: edgeHotWidth,
              zIndex: 10,
              // backgroundColor: 'rgba(0,0,255,0.05)', // 调试可开
            }}
            pointerEvents="box-only"
          />
        </GestureDetector>
        <GestureDetector gesture={bottomResizeGesture}>
          <Animated.View
            style={{
              position: 'absolute',
              left: 0,
              bottom: 0,
              width: '100%',
              height: edgeHotWidth,
              zIndex: 10,
              // backgroundColor: 'rgba(255,0,0,0.05)',
            }}
            pointerEvents="box-only"
          />
        </GestureDetector>
        <GestureDetector gesture={leftResizeGesture}>
          <Animated.View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: edgeHotWidth,
              height: '100%',
              zIndex: 10,
              // backgroundColor: 'rgba(0,0,0,0.05)',
            }}
            pointerEvents="box-only"
          />
        </GestureDetector>
        <GestureDetector gesture={rightResizeGesture}>
          <Animated.View
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: edgeHotWidth,
              height: '100%',
              zIndex: 10,
              // backgroundColor: 'rgba(0,0,0,0.05)',
            }}
            pointerEvents="box-only"
          />
        </GestureDetector>
      </Animated.View>
    </GestureDetector>
  );
}

const CanvasTextModule: React.FC<{ props: CustomCanvasProps; extraParams: any }> = ({ props, extraParams }) => {
  const textsInGlobal: TextBlockInfo[] = (props.globalData?.texts?.value || []).map((item: any) => ({
    ...item,
    text: typeof item.text === 'string' ? item.text : '<p style="color:#333;font-size:18px;">请输入文本</p>',
    plainText: typeof item.plainText === 'string' ? item.plainText : '',
    width: item.width || MIN_WIDTH,
    height: item.height || MIN_HEIGHT,
  }));
  const setTextsInGlobal: StateUpdater<TextBlockInfo[]> | undefined = props.globalData?.texts?.setValue as unknown as StateUpdater<TextBlockInfo[]>;
  const canvasContentsTransform = useMemo(() =>
    extraParams.contentsTransform?.value || { translateX: 0, translateY: 0, scale: 1 }
    , [extraParams.contentsTransform]);

  // 点击空白处添加文本
  const handleAddText = useCallback((e: any) => {
    if (!setTextsInGlobal) return;
    const x = (e.nativeEvent?.locationX || 100) - (canvasContentsTransform?.translateX || 0);
    const y = (e.nativeEvent?.locationY || 100) - (canvasContentsTransform?.translateY || 0);
    const defaultHtml = '<p style="color:#333;font-size:18px;">请输入文本</p>';
    setTextsInGlobal(prev => [
      ...prev,
      {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        x,
        y,
        width: MIN_WIDTH,
        height: MIN_HEIGHT,
        text: defaultHtml,
        plainText: htmlToPlainText(defaultHtml),
        fontSize: 17,
        fontFamily: undefined,
        fontColor: '#333',
        isBold: false,
        isItalic: false,
        isUnderline: false,
      }
    ]);
  }, [setTextsInGlobal, canvasContentsTransform]);

  return (
    <View style={{ flex: 1 }}>
      {props.mode?.value === 'text' && (
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleAddText} activeOpacity={0.8}>
          <View style={{ flex: 1 }} />
        </TouchableOpacity>
      )}
      {textsInGlobal.map((textBlock) => (
        <CanvasTextItem
          key={textBlock.id}
          textBlock={textBlock}
          textsInGlobal={textsInGlobal}
          setTextsInGlobal={setTextsInGlobal}
          contentsTransform={canvasContentsTransform}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  textWrap: {
    position: 'absolute',
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    // 移除 padding/backgroundColor/border 相关视觉样式，全部交给内容组件控制
    // paddingHorizontal: 6,
    // paddingVertical: 2,
    // backgroundColor: '#fffbe6',
    // borderRadius: 6,
    // borderWidth: 1,
    // borderColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarBtn: {
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    padding: 6,
    marginRight: 4,
  },
});

export default CanvasTextModule;
