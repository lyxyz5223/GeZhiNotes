import {
  CanvasMode,
  CustomCanvasProps,
  StateUpdater,
  WebLinkBlockInfo,
} from '@/types/CanvasTypes';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

interface WebLinkEditModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (link: WebLinkBlockInfo) => void;
  initialLink?: WebLinkBlockInfo;
  position?: { x: number; y: number };
}

const WebLinkEditModal: React.FC<WebLinkEditModalProps> = ({
  visible,
  onClose,
  onSave,
  initialLink,
  position,
}) => {
  const theme = useTheme();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      // 如果是编辑模式，初始化表单数据
      if (initialLink) {
        setUrl(initialLink.url);
        setTitle(initialLink.title || '');
      } else {
        // 新建链接，不预设URL值
        setUrl('');
        setTitle('');
      }
      setError('');
    }
  }, [visible, initialLink]);

  const handleSave = () => {
    // 验证URL
    if (!url) {
      setError('URL不能为空');
      return;
    } // 添加协议前缀如果没有
    let finalUrl = url;
    if (!finalUrl.match(/^(http|https):\/\//)) {
      finalUrl = 'https://' + finalUrl;
    }

    // 构造链接对象
    const linkData: WebLinkBlockInfo = {
      id: initialLink?.id || `weblink-${Date.now()}`,
      url: finalUrl,
      title: title || finalUrl,
      x: position?.x || initialLink?.x || 0,
      y: position?.y || initialLink?.y || 0,
      width: initialLink?.width || 100, // Default width or use existing
      height: initialLink?.height || 40, // Default height or use existing
    };

    onSave(linkData);
    onClose();
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalContent, { backgroundColor: theme.colors.card }]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            {initialLink ? '编辑网络链接' : '插入网络链接'}
          </Text>

          <Text
            style={[
              styles.inputLabel,
              { color: theme.colors.text },
              { textAlign: 'center' },
            ]}
          >
            URL:
          </Text>
          <TextInput
            style={[
              styles.input,
              { borderColor: theme.colors.border, color: theme.colors.text },
            ]}
            value={url}
            onChangeText={setUrl}
            placeholder="example.com"
            placeholderTextColor={theme.colors.text + '80'} // Adding 80 for 50% opacity
            autoCapitalize="none"
            keyboardType="url"
            autoFocus={true}
          />

          <Text
            style={[
              styles.inputLabel,
              { color: theme.colors.text },
              { textAlign: 'center' },
            ]}
          >
            标题(可选填)
          </Text>
          <TextInput
            style={[
              styles.input,
              { borderColor: theme.colors.border, color: theme.colors.text },
            ]}
            value={title}
            onChangeText={setTitle}
            placeholder="链接标题"
            placeholderTextColor={theme.colors.text + '80'} // Adding 80 for 50% opacity
          />

          {error ? <Text style={styles.modalErrorText}>{error}</Text> : null}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.border }]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const CanvasWebLink: React.FC<{
  props: CustomCanvasProps;
  extraParams: any;
}> = ({ props, extraParams }) => {
  // 获取当前主题
  const theme = useTheme();

  // 获取容器尺寸和位置（如果提供）
  const containerSize = extraParams?.containerSize || {
    width: 320,
    height: 400,
  };
  const containerPosition = extraParams?.containerPosition || { x: 50, y: 50 };

  // 状态
  const webLinksInGlobal: WebLinkBlockInfo[] =
    props.globalData?.webLinks?.value || [];
  const setWebLinksInGlobal: StateUpdater<WebLinkBlockInfo[]> | undefined =
    props.globalData?.webLinks?.setValue;
  const mode = props.mode?.value || CanvasMode.Draw;
  // 编辑相关状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentEditLink, setCurrentEditLink] =
    useState<WebLinkBlockInfo | null>(null);
  const [editPosition, setEditPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [previewLink, setPreviewLink] = useState<WebLinkBlockInfo | null>(null);
  const [longPressedLink, setLongPressedLink] = useState<string | null>(null);
  // 处理添加链接
  const handleAddLink = (position: { x: number; y: number }) => {
    // 计算相对于容器的位置
    const adjustedPosition = {
      x: position.x,
      y: position.y,
    };

    setEditPosition(adjustedPosition);
    setCurrentEditLink(null); // 新链接
    setEditModalVisible(true);
  };

  // 处理编辑链接
  const handleEditLink = (link: WebLinkBlockInfo) => {
    setCurrentEditLink(link);
    setEditPosition(null);
    setEditModalVisible(true);
    setLongPressedLink(null);
  };

  // 处理删除链接
  const handleDeleteLink = (linkId: string) => {
    Alert.alert('删除链接', '确定要删除此链接吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          if (setWebLinksInGlobal) {
            setWebLinksInGlobal(
              webLinksInGlobal.filter((link) => link.id !== linkId)
            );
          }
        },
      },
    ]);
    setLongPressedLink(null);
  };
  // 保存链接
  const handleSaveLink = (linkData: WebLinkBlockInfo) => {
    if (!setWebLinksInGlobal) {
      console.error('保存链接失败: setWebLinksInGlobal未定义');
      return;
    }

    console.log('保存链接前 webLinksInGlobal:', webLinksInGlobal);

    if (currentEditLink) {
      // 编辑现有链接
      setWebLinksInGlobal(
        webLinksInGlobal.map((link) =>
          link.id === currentEditLink.id ? linkData : link
        )
      );
      console.log('编辑链接后 - linkData:', linkData);
    } else {
      // 添加新链接
      setWebLinksInGlobal([...webLinksInGlobal, linkData]);
      console.log('添加新链接后 - linkData:', linkData);
    }
  };

  // 处理链接点击
  const handleLinkPress = (url: string) => {
    if (mode === CanvasMode.WebLink) {
      // 选择模式下不打开链接，而是进入编辑模式
      const link = webLinksInGlobal.find((l) => l.url === url);
      if (link) {
        handleEditLink(link);
      }
    } else {
      // 其他模式下正常打开链接
      Linking.openURL(url).catch((err) => {
        Alert.alert('打开链接失败', '无法打开此链接：' + url);
      });
    }
  };
  // 处理长按链接
  const handleLongPress = (link: WebLinkBlockInfo) => {
    // 如果点击的是同一个链接，则关闭预览
    if (previewLink && previewLink.id === link.id) {
      setPreviewLink(null);
    } else {
      // 否则显示此链接的预览
      setPreviewLink(link);
    }
  };

  // 添加单击事件处理器，可以监听画布点击事件添加链接
  const handleCanvasClick = (event: any) => {
    if (mode === CanvasMode.WebLink) {
      // 获取点击位置并添加链接
      const { locationX, locationY } = event.nativeEvent;

      // 将点击坐标限制在容器范围内
      const clampedX = Math.max(0, Math.min(locationX, containerSize.width));
      const clampedY = Math.max(0, Math.min(locationY, containerSize.height));

      handleAddLink({ x: clampedX, y: clampedY });
    }
  };

  return (
    <>
      {/* 用于监听画布点击的透明覆盖层，仅在WebLink模式下激活 */}
      {mode === CanvasMode.WebLink && (
        <TouchableOpacity
          style={styles.canvasOverlay}
          onPress={handleCanvasClick}
          activeOpacity={1}
        />
      )}
      {/* 渲染所有链接 */}
      {webLinksInGlobal.map((link: WebLinkBlockInfo, idx: number) => (
        <View
          key={link.id || `weblink-${idx}`}
          style={{ position: 'absolute', left: link.x, top: link.y }}
        >
          <TouchableOpacity
            style={[
              {
                ...styles.linkContainer,
                backgroundColor: theme.dark
                  ? theme.colors.card
                  : theme.colors.background,
                borderColor: theme.colors.border,
              },
              previewLink?.id === link.id && {
                ...styles.selectedLink,
                backgroundColor: theme.dark
                  ? `${theme.colors.primary}30`
                  : `${theme.colors.primary}15`,
                borderColor: theme.colors.primary,
              }, // 如果当前链接被预览，则添加选中样式
            ]}
            onPress={() => handleLinkPress(link.url)}
            onLongPress={() => handleLongPress(link)}
            delayLongPress={500}
          >
            <Text
              style={{
                ...styles.linkText,
                color: theme.colors.primary,
              }}
            >
              {link.title || link.url}
            </Text>
          </TouchableOpacity>
          {/* 长按后显示网页预览 */}
          {previewLink?.id === link.id && (
            <View
              style={{
                ...styles.previewContainer,
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                shadowColor: theme.dark ? '#000' : '#888',
              }}
            >
              {/* 预览标题栏 */}
              <View
                style={{
                  ...styles.previewHeader,
                  backgroundColor: theme.colors.background,
                  borderBottomColor: theme.colors.border,
                }}
              >
                <Text
                  style={{
                    ...styles.previewTitle,
                    color: theme.colors.text,
                  }}
                  numberOfLines={1}
                >
                  {link.title || link.url}
                </Text>
                <View style={styles.previewActions}>
                  {mode === CanvasMode.WebLink && (
                    <>
                      <TouchableOpacity
                        style={{
                          ...styles.previewActionButton,
                          backgroundColor: theme.dark
                            ? `${theme.colors.card}`
                            : theme.colors.background,
                        }}
                        onPress={() => handleEditLink(link)}
                      >
                        <Text
                          style={{
                            ...styles.previewActionText,
                            color: theme.colors.primary,
                          }}
                        >
                          编辑
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={{
                          ...styles.previewActionButton,
                          backgroundColor: theme.dark
                            ? `${theme.colors.card}`
                            : theme.colors.background,
                        }}
                        onPress={() => handleDeleteLink(link.id)}
                      >
                        <Text
                          style={{
                            ...styles.previewActionText,
                            color: theme.colors.primary,
                          }}
                        >
                          删除
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                  <TouchableOpacity
                    style={{
                      ...styles.previewActionButton,
                      backgroundColor: theme.dark
                        ? `${theme.colors.card}`
                        : theme.colors.background,
                    }}
                    onPress={() => setPreviewLink(null)}
                  >
                    <Text
                      style={{
                        ...styles.previewActionText,
                        color: theme.colors.primary,
                      }}
                    >
                      关闭
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* WebView预览 */}
              <WebView
                source={{ uri: link.url }}
                style={styles.webView}
                startInLoadingState={true}
                renderLoading={() => (
                  <View
                    style={{
                      ...styles.loadingContainer,
                      backgroundColor: theme.colors.background,
                    }}
                  >
                    <Text style={{ color: theme.colors.text }}>加载中...</Text>
                  </View>
                )}
                onError={() => (
                  <View
                    style={{
                      ...styles.errorContainer,
                      backgroundColor: theme.colors.background,
                    }}
                  >
                    <Text style={{ color: theme.colors.text }}>加载失败</Text>
                  </View>
                )}
              />
            </View>
          )}
        </View>
      ))}

      {/* 链接编辑对话框 */}
      <WebLinkEditModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSave={handleSaveLink}
        initialLink={currentEditLink || undefined}
        position={editPosition || undefined}
      />
    </>
  );
};

const styles = StyleSheet.create({
  // 模态框相关样式
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  modalErrorText: {
    color: '#ff0000',
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 0.48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  //WebLink编辑对话框相关样式
  linkContainer: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 300,
  },
  selectedLink: {
    // 选中状态的基础样式，颜色由内联样式提供
  },
  linkText: {
    textDecorationLine: 'underline',
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  editButton: {
    // 背景色由内联样式提供
  },
  deleteButton: {
    // 背景色由内联样式提供
  },
  actionButtonText: {
    fontWeight: '500',
    // 文字颜色由内联样式提供
  },
  canvasOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  // WebView预览相关样式
  previewContainer: {
    marginTop: 8,
    width: 320,
    height: 360,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  previewHeader: {
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  previewTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  previewActions: {
    flexDirection: 'row',
  },
  previewActionButton: {
    marginLeft: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  previewActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  webView: {
    flex: 1,
    height: 300,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default CanvasWebLink;
