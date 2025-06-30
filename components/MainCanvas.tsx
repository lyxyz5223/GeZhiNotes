import { INIT_SIZE as CANVAS_INIT_SIZE } from '@/constants/CanvasConstants';
import { allThemes } from '@/constants/CanvasTheme';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import {
  AudioBlockInfo,
  CanvasMode,
  CanvasType,
  DrawPathInfo,
  EmbeddedCanvasData,
  ImageBlockInfo,
  LinkBlockInfo,
  TextBlockInfo,
  VideoBlockInfo,
  WebLinkBlockInfo,
} from '@/types/CanvasTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from '@react-navigation/native';
import { Skia } from '@shopify/react-native-skia';
import React, { useCallback, useId, useState } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import CanvasToolbar from './CanvasToolbar';
import CustomCanvas from './CustomCanvas';
import ThemeSelectorModal from './ThemeSelectorModal';
import ThemedText from './ThemedText';

type GlobalPathsType = { [id: string]: DrawPathInfo[] };
type GlobalTextsType = { [id: string]: TextBlockInfo[] };
type GlobalImagesType = { [id: string]: ImageBlockInfo[] };
type GlobalAudiosType = { [id: string]: AudioBlockInfo[] };
type GlobalCanvasLinksType = { [id: string]: LinkBlockInfo[] };
type GlobalVideosType = { [id: string]: VideoBlockInfo[] };
type GlobalWebLinksType = { [id: string]: WebLinkBlockInfo[] };

// 全局画布数据结构，包含所有类型
interface GlobalCanvasState {
  paths: GlobalPathsType;
  texts: GlobalTextsType;
  images: GlobalImagesType;
  audios: GlobalAudiosType;
  videos: GlobalVideosType;
  links: GlobalCanvasLinksType;
  webLinks: GlobalWebLinksType;
}

// 为画布的每个属性生成更新函数
// 用法: makePerCanvasStateSetter('paths', setGlobalState)(id)(paths);
function makePerCanvasStateSetter<K extends keyof GlobalCanvasState>(
  key: K,
  setGlobalState: React.Dispatch<React.SetStateAction<GlobalCanvasState>>
) {
  type ItemType = GlobalCanvasState[K][string];
  return (id: string) =>
    (updater: ItemType | ((previous: ItemType) => ItemType)) => {
      setGlobalState((prevState) => {
        const prevValue =
          (prevState[key][id] as ItemType) ?? ([] as unknown as ItemType);
        const newValue =
          typeof updater === 'function'
            ? (updater as (prev: ItemType) => ItemType)(prevValue)
            : updater;
        return {
          ...prevState,
          [key]: {
            ...prevState[key],
            [id]: newValue,
          },
        };
      });
    };
}
// 动态生成所有 setter
// 用法: createAllGlobalStateSetters(setGlobalState)(id).setPaths(paths);
// 返回一个包含所有 setter 方法(如 setPaths、setTexts 等)作为返回值的参数为id的函数对象
const createAllGlobalStateSetters =
  (
    setGlobalState: React.Dispatch<React.SetStateAction<GlobalCanvasState>>,
    callback: (
      id: string,
      setterFunctionName: string,
      newValue: any,
      newGlobalData: GlobalCanvasState
    ) => void = () => {} // 回调函数，当每个 setter 被调用时执行（可选，默认为空函数）
  ) =>
  (id: string) => {
    const keys = Object.keys(initialGlobalState) as (keyof GlobalCanvasState)[];
    const setters: any = {};
    keys.forEach((key) => {
      // setter 名如 setPaths、setTexts
      const setterName = 'set' + key.charAt(0).toUpperCase() + key.slice(1);
      setters[setterName] = (newValue: any) => {
        setGlobalState((prevState) => {
          const prevValue = (prevState[key][id] as any) ?? [];
          const updatedValue =
            typeof newValue === 'function' ? newValue(prevValue) : newValue;
          const newState = {
            ...prevState,
            [key]: {
              ...prevState[key],
              [id]: updatedValue,
            },
          };
          callback(id, setterName, updatedValue, newState); // 这里拿到 set 后的最新 globalState
          return newState;
        });
      };
    });
    return setters;
  };

const initialGlobalState: GlobalCanvasState = {
  paths: {},
  texts: {},
  images: {},
  audios: {},
  videos: {},
  links: {},
  webLinks: {},
};

export default function MainCanvas() {
  // 画布列表
  const canvasIdPrefix = 'canvas';
  const canvasIdConnector = '-';
  const defaultCanvasId = useId();
  const createCanvasId = useCallback(
    () =>
      canvasIdPrefix +
      canvasIdConnector +
      defaultCanvasId +
      canvasIdConnector +
      Date.now().toString(),
    [canvasIdPrefix, canvasIdConnector, defaultCanvasId]
  );
  const [canvases, setCanvases] = useState<EmbeddedCanvasData[]>([
    {
      id: createCanvasId(),
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    },
  ]);
  // 工具栏状态
  const [color, setColor] = useState('#007aff');
  const [size, setSize] = useState(4);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState('#007aff');  const [mode, setMode] = useState(CanvasMode.Draw);
  // 跟踪是否有子画布处于全屏状态
  const [hasFullscreenCanvas, setHasFullscreenCanvas] = useState(false);

  // 用 useUndoRedo 管理全局画布数据（所有类型）撤销重做
  const undoRedo = useUndoRedo<GlobalCanvasState>();
  const [globalState, setGlobalState] =
    useState<GlobalCanvasState>(initialGlobalState);

  const globalDataSetters = createAllGlobalStateSetters(
    setGlobalState,
    (id, setterName, newValue, newGlobalData) => {
      // 将操作记录到撤销重做栈
      undoRedo.push(newGlobalData);
    }
  );
  // 添加连线处理函数
  const handleAddLink = useCallback(
    (link: LinkBlockInfo) => {
      const mainCanvasId = canvases[0]?.id;
      if (mainCanvasId && link) {
        console.log(
          '添加连接线到主画布:',
          mainCanvasId,
          '连接:',
          link.fromId,
          '->',
          link.toId,
          '点位置:',
          JSON.stringify(link.points)
        );

        globalDataSetters(mainCanvasId).setLinks((prev = []) => {
          // 确保连接线有正确的points属性
          if (!link.points || link.points.length < 2) {
            console.error('连接线缺少有效的points数据');
            return prev;
          }
          const newLink = {
            ...link,
            // 确保points是正确格式的数组
            points: Array.isArray(link.points) ? link.points : []
          };
          const newLinks = [...prev, newLink];
          return newLinks;
        });
      }
    },
    [canvases, globalDataSetters]
  );  // 删除连接线处理函数
  const handleDeleteLink = useCallback(
    (linkId: string) => {
      console.log('***** MainCanvas.handleDeleteLink 被调用: linkId =', linkId);
      const mainCanvasId = canvases[0]?.id;
      
      if (!mainCanvasId) {
        console.error('删除连接线失败: 主画布ID不存在');
        return;
      }
      
      if (!linkId) {
        console.error('删除连接线失败: 连接线ID不存在');
        return;
      }
      
      // 先记录当前连接线数量以便于调试
      const currentLinks = globalState.links[mainCanvasId] || [];
      console.log('删除前连接线数量:', currentLinks.length);
      
      try {
        // 直接使用React状态更新
        setGlobalState(prevState => {
          const updatedLinks = (prevState.links[mainCanvasId] || []).filter(
            (link: LinkBlockInfo) => link.id !== linkId
          );
          
          console.log(`过滤前: ${currentLinks.length}, 过滤后: ${updatedLinks.length}`);
          
          // 创建一个全新的状态对象
          return {
            ...prevState,
            links: {
              ...prevState.links,
              [mainCanvasId]: updatedLinks
            }
          };
        });
        
        // 强制更新记录到撤销栈
        setTimeout(() => {
          // 获取最新状态
          const newLinks = globalState.links[mainCanvasId] || [];
          console.log('删除操作执行后连接线数量:', newLinks.length);
          // 将新状态推入撤销栈
          undoRedo.push({...globalState});
        }, 100);
        
      } catch (error) {
        console.error('删除连接线时发生错误:', error);
      }
    },
    [canvases, globalState, setGlobalState, undoRedo]
  );

  // 主题选择弹窗
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [themeIndex, setThemeIndex] = useState(0);
  const currentTheme = allThemes[themeIndex].value;

  // 主题切换方法（弹窗方式）
  const handleToggleTheme = () => setThemeModalVisible(true);

  // 处理根组件布局变化，获取屏幕尺寸
  const handleLayout = useCallback((event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setCanvases((cs) =>
      cs.map((canvas, index) =>
        index === 0 ? { ...canvas, width, height } : canvas
      )
    );
  }, []);

  // 添加新嵌入画布（居中）
  const addCanvas = () => {
    const { width: screenWidth, height: screenHeight } =
      Dimensions.get('window');
    setCanvases((cs) => [
      ...cs,
      {
        id: createCanvasId(),
        x: (screenWidth - CANVAS_INIT_SIZE) / 2,
        y: (screenHeight - CANVAS_INIT_SIZE) / 2,
        width: CANVAS_INIT_SIZE,
        height: CANVAS_INIT_SIZE,
      },
    ]);
  };
  // 拖动/缩放回调
  const updateCanvas = (
    id: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    // cs.map遍历，修改指定id的画布数据，然后重新设置canvases
    setCanvases((cs) =>
      cs.map((c) => (c.id === id ? { ...c, x, y, width, height } : c))
    );
  };

  // 删除画布
  const removeCanvas = (id: string) => {
    setCanvases((cs) => cs.filter((c) => c.id !== id));
  };

  // 撤销
  const handleUndo = () => {
    const last = undoRedo.undo();
    setGlobalState((prev) => (last ? last : initialGlobalState));
  };
  // 重做
  const handleRedo = () => {
    const next = undoRedo.redo();
    if (next) setGlobalState(next);
  };

  // 监听 globalState 变化，自动 push 到撤销重做栈
  // 这种逻辑有问题！故注释掉
  // useEffect(() => {
  //   undoRedo.push(globalState);
  //   console.log('Global state updated, current state:', globalState);
  // }, [undoRedo, globalState]);

  // 持久化存储 key
  const STORAGE_KEY = 'GeZhiNotes:canvasData';
  // 读取本地所有画布和全局数据
  const handleLoad = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.canvases && Array.isArray(parsed.canvases))
          setCanvases(parsed.canvases);
        if (parsed.globalState && typeof parsed.globalState === 'object') {
          // 路径反序列化
          const fixedPaths: GlobalPathsType = {};
          Object.entries(parsed.globalState.paths || {}).forEach(
            ([cid, arr]) => {
              fixedPaths[cid] = Array.isArray(arr)
                ? (arr.map((item: any) => {
                    if (
                      item &&
                      typeof item.path === 'string' &&
                      item.path.startsWith('M')
                    ) {
                      return {
                        ...item,
                        path: Skia.Path.MakeFromSVGString(item.path),
                      };
                    }
                    return item;
                  }) as DrawPathInfo[])
                : (arr as DrawPathInfo[]);
            }
          );
          setGlobalState({
            ...initialGlobalState,
            ...parsed.globalState,
            paths: fixedPaths,
          });
        }
      }
    } catch (e) {
      console.error('读取失败', e);
    }
  };
  // 保存所有画布和全局数据到本地
  const handleSave = async () => {
    try {
      // 路径序列化
      const serializablePaths: GlobalPathsType = {};
      Object.entries(globalState.paths).forEach(([canvasId, arr]) => {
        serializablePaths[canvasId] = Array.isArray(arr)
          ? arr.map((item: any) => {
              if (
                item &&
                item.path &&
                typeof item.path.toSVGString === 'function'
              ) {
                return { ...item, path: item.path.toSVGString() };
              }
              if (item && typeof item.path === 'string') {
                return { ...item };
              }
              return item;
            })
          : arr;
      });
      const data = JSON.stringify({
        canvases: canvases,
        globalState: { ...globalState, paths: serializablePaths },
      });
      await AsyncStorage.setItem(STORAGE_KEY, data);
    } catch (e) {
      console.error('保存失败', e);
    }
  };

  // 启动时自动读取
  // React.useEffect(() => {
  //   handleLoad();
  // }, []);

  return (
    <ThemeProvider value={currentTheme}>
      <View
        style={[
          styles.root,
          { backgroundColor: currentTheme.colors.background },
        ]}
        onLayout={handleLayout}
      >
        {/* 主题选择弹窗 */}
        <ThemeSelectorModal
          visible={themeModalVisible}
          currentIndex={themeIndex}
          onSelect={(idx) => {
            setThemeIndex(idx);
            setThemeModalVisible(false);
          }}
          onClose={() => setThemeModalVisible(false)}
        />
        {/* 浮动加号按钮 */}
        <TouchableOpacity
          style={styles.fab}
          onPress={addCanvas}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.fabIcon}>＋</ThemedText>
        </TouchableOpacity>
        {/* 全局工具栏 */}
        <CanvasToolbar
          color={color}
          setColor={(c) => {
            setColor(c);
            setCustomColor(c);
          }}
          size={size}
          setSize={setSize}
          mode={mode}
          setMode={setMode}
          fontFamily={''}
          setFontFamily={() => {}}
          showColorPicker={showColorPicker}
          setShowColorPicker={setShowColorPicker}
          customColor={customColor}
          setCustomColor={setCustomColor}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSave={handleSave}
          onLoad={handleLoad}
          toolbarPos={{ x: 16, y: 40 }}
          toolbarHorizontalMargin={16}
          toolbarMaxWidth={Dimensions.get('window').width - 32}
          toolbarDragging={false}
          toolbarPanHandlers={{}}
          onToggleTheme={handleToggleTheme}
        />
        <View style={styles.canvasArea}>            
          {/* {canvases.length > 0 &&
            canvases[0] &&
            !hasFullscreenCanvas && (
              <CanvasConnections
                links={globalState.links[canvases[0].id] || []}
                onDelete={handleDeleteLink}
              />
            )}{mode === CanvasMode.Link && !hasFullscreenCanvas && (
            <ConnectNode
              canvases={canvases}
              onConnect={handleAddLink}
              color={color}
            />
          )} */}
          {/* 渲染第一个画布 */}
          {canvases.length > 0 && canvases[0] && (
            <CustomCanvas
              id={canvases[0].id}
              key={canvases[0].id}
              x={canvases[0].x}
              y={canvases[0].y}
              width={canvases[0].width}
              height={canvases[0].height}
              canvasType={CanvasType.Main}
              onMoveResize={updateCanvas}
              onRemove={removeCanvas}
              canvasBg={currentTheme.colors.background} 
              color={color}
              size={size}
              mode={mode}
              moveable={false}
              resizeable={false}
              globalData={{
                paths: globalState.paths[canvases[0].id] || [],
                texts: globalState.texts[canvases[0].id] || [],
                images: globalState.images[canvases[0].id] || [],
                audios: globalState.audios[canvases[0].id] || [],
                videos: globalState.videos[canvases[0].id] || [],
                links: globalState.links[canvases[0].id] || [],
                webLinks: globalState.webLinks[canvases[0].id] || [],
                ...globalDataSetters(canvases[0].id),
              }}
            />
          )}
          {/* 渲染其他画布 */}
          {canvases.map((c, idx) =>
            idx === 0 ? null : (
              <CustomCanvas
                id={c.id}
                key={c.id}
                x={c.x}
                y={c.y}
                width={c.width}
                height={c.height}
                canvasType={CanvasType.Child}
                onMoveResize={updateCanvas}
                onRemove={removeCanvas}
                canvasBg={currentTheme.colors.background}
                color={color}
                size={size}
                mode={mode}                onEnterFullscreen={() => setHasFullscreenCanvas(true)}
                onExitFullscreen={() => setHasFullscreenCanvas(false)}
                globalData={{
                  paths: globalState.paths[c.id] || [],
                  texts: globalState.texts[c.id] || [],
                  images: globalState.images[c.id] || [],
                  audios: globalState.audios[c.id] || [],
                  videos: globalState.videos[c.id] || [],
                  links: globalState.links[c.id] || [],
                  webLinks: globalState.webLinks[c.id] || [],
                  ...globalDataSetters(c.id),
                }}
              />
            )
          )}
        </View>
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  canvasArea: { flex: 1, position: 'relative' },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32, // 由 top: 32 改为 bottom: 32
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007aff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 100,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 36,
  },
});
