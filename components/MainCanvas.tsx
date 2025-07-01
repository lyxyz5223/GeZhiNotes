import { allThemes } from "@/constants/CanvasTheme";
import { initialGlobalStates, useGlobalStatesWithSetters } from "@/hooks/useGlobalStatesWithSetters";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { CanvasMode, CanvasType, EmbeddedCanvasData } from "@/types/CanvasTypes";
import { GlobalCanvasStates } from "@/types/MainCanvasType";
import { createPathFromPoints } from '@/utils/CanvasUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from '@react-navigation/native';
import { Skia } from '@shopify/react-native-skia';
import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import CanvasToolbar from "./CanvasToolbar";
import CustomCanvas from "./CustomCanvas";
import ThemeSelectorModal from "./ThemeSelectorModal";


interface MainCanvasProps {
  fileId?: string;
}

export default function MainCanvas({ fileId }: MainCanvasProps) {
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
  const [canvases, setCanvases] = useState<EmbeddedCanvasData[]>(
    [
      {
        id: createCanvasId(), parentId: '', x: 0, y: 0, width: 0, height: 0
      },
    ]
  );

  // 根据 fileId 加载对应画布
  useEffect(() => {
    if (!fileId) return;
    (async () => {
      try {
        const str = await AsyncStorage.getItem('GeZhiNotes:canvasDataList');
        if (!str) return;
        const arr = JSON.parse(str);
        const file = arr.find((f: any) => f.id === fileId);
        console.log('[MainCanvas] 加载文件', file);
        if (file && file.data && file.data.globalState) {
          // 2. 路径反序列化：优先用 points 生成 Skia.Path
          const fixedGlobalState = { ...file.data.globalState };
          if (fixedGlobalState.paths) {
            Object.entries(fixedGlobalState.paths).forEach(([cid, arr]) => {
              fixedGlobalState.paths[cid] = Array.isArray(arr)
                ? (arr as any[]).map(item => {
                    if (item && Array.isArray(item.points) && item.points.length > 0) {
                      return { ...item, path: createPathFromPoints(item.points) };
                    }
                    if (item && typeof item.path === 'string' && item.path.startsWith('M')) {
                      return { ...item, path: Skia.Path.MakeFromSVGString(item.path) };
                    }
                    return item;
                  })
                : arr;
            });
          }
          setGlobalState(fixedGlobalState);
          console.log('[globalState] 加载', fixedGlobalState);
          // 如有需要同步 setCanvases
          if (fixedGlobalState.canvases) {
            const canvasArr = Object.values(fixedGlobalState.canvases).flat() as EmbeddedCanvasData[];
            if (Array.isArray(canvasArr) && canvasArr.length > 0) {
              setCanvases(canvasArr);
            }
          }
        }
      } catch {}
    })();
  }, [fileId]);

  // 工具栏状态
  const [color, setColor] = useState('#007aff');
  const [size, setSize] = useState(4);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState('#007aff');  const [mode, setMode] = useState(CanvasMode.Draw);
  // 跟踪是否有子画布处于全屏状态
  const [hasFullscreenCanvas, setHasFullscreenCanvas] = useState(false);

  // 用 useUndoRedo 管理全局画布数据（所有类型）撤销重做
  const undoRedo = useUndoRedo<GlobalCanvasStates>();
  const [globalState, setGlobalState] = useState<GlobalCanvasStates>(
    {
      ...initialGlobalStates,
      canvases: {
        [canvases[0].id]: [
          { ...canvases[0] }
        ]
      }
    });
  const memoizedGlobalState = React.useMemo(() => {
    return {
      value: globalState,
      setValue: setGlobalState
    }
  }, [globalState, setGlobalState]);
  const handleGlobalStateChange = useCallback((id: string, stateName: string, newValue: any, newGlobalData: GlobalCanvasStates) => {
      undoRedo.push(newGlobalData);// 将操作后的新全局记录进入撤销栈
  }, [undoRedo]);
  useEffect(() => {
    console.log('[undoRedo] 发生变化', undoRedo);
  }, [undoRedo]);
  // 用 useMemo 缓存 globalDataSetters，避免每次渲染都新建 setter 函数
  const globalDataSetters = useGlobalStatesWithSetters(
    globalState,
    setGlobalState,
    handleGlobalStateChange
  );
  useEffect(() => {
    console.log('[globalDataSetters] 发生变化');
  }, [globalDataSetters]);

  const firstCanvasId = canvases[0]?.id;
  // 用 useMemo 缓存 dataSetters，避免每次渲染都新建 setter 对象
  const dataSetters = React.useMemo(
    () => globalDataSetters(firstCanvasId),
    [globalDataSetters, firstCanvasId]
  );

  // 用 useMemo 缓存 globalData，避免每次渲染都新建对象
  const memoizedGlobalData = React.useMemo(() => ({ ...dataSetters }), [dataSetters]);
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
  // const addCanvas = () => {
  //     const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  //     setCanvases(cs => [
  //         ...cs,
  //         {
  //           id: createCanvasId(),
  //           parentId: firstCanvasId,
  //           x: (screenWidth - CANVAS_INIT_SIZE) / 2,
  //           y: (screenHeight - CANVAS_INIT_SIZE) / 2,
  //           width: CANVAS_INIT_SIZE,
  //           height: CANVAS_INIT_SIZE,
  //         },
  //     ]);
  // };

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
    setGlobalState(prev => last ? last : initialGlobalStates);
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

  // 启动时自动读取
  const username = 'user'; // 用户名
  const password = 'hust'; // 密码
  const apiUrl = 'http://192.168.202.88:8080/';
  const token = useRef<string | null>(null);
  // 持久化存储 key
  const STORAGE_KEY = 'GeZhiNotes:canvasData';
  const TOKEN_KEY = 'GeZhiNotes:token';
  // 读取本地所有画布和全局数据
  const handleLoad = async () => {
  };
  // 保存所有画布和全局数据到本地
  const handleSave = async () => {
    // 1. 路径序列化：将 Skia.Path 转为 SVG 字符串
    const serializableGlobalState = JSON.parse(JSON.stringify(globalState));
    if (serializableGlobalState.paths) {
      Object.entries(serializableGlobalState.paths).forEach(([cid, arr]) => {
        serializableGlobalState.paths[cid] = Array.isArray(arr)
          ? arr.map((item: any) => {
              if (item && item.path && typeof item.path.toSVGString === 'function') {
                return { ...item, path: item.path.toSVGString() };
              }
              return item;
            })
          : arr;
      });
    }
    const globalData = JSON.stringify(serializableGlobalState);
    console.log('[handleSave] 全局数据:', globalData);
    await AsyncStorage.setItem(STORAGE_KEY, globalData);
    // 新增：如果有 fileId，保存到 canvasDataList
    if (fileId) {
      try {
        const str = await AsyncStorage.getItem('GeZhiNotes:canvasDataList');
        if (str) {
          const arr = JSON.parse(str);
          const idx = arr.findIndex((f: any) => f.id === fileId);
          if (idx !== -1) {
            arr[idx].data = arr[idx].data || {};
            arr[idx].data.globalState = serializableGlobalState;
            await AsyncStorage.setItem('GeZhiNotes:canvasDataList', JSON.stringify(arr));
          }
        }
      } catch {}
    }
    // ...原有后端同步逻辑...
    fetch(apiUrl + 'user/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cookie': token.current || '',
      },
      body: JSON.stringify({globalData})
    }).then(response => {
      console.log('保存, 后端返回:', response);
      return response.json();
    }).then(data => {
      console.log('保存, 后端返回数据:', data);
    }).catch(error => {
      console.error('保存请求后端出错:', error);
    });
  };

  React.useEffect(() => {
    const registerData = {
      "name": username,
      "password": password,
    };
    let tokenPromise = null;
    try {
      tokenPromise = AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('读取 token 失败:', error);
    } finally {
    }
    tokenPromise?.then((tokenValue) => {
      console.log('读取到的 token:', tokenValue);
      token.current = tokenValue;
      if (!tokenValue) {
        // 如果没有 token，则先注册用户
        fetch(apiUrl + 'register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenValue}`
          },
          body: JSON.stringify(registerData)
        })
          .then(response => response.json())
          .then(data => {
            console.log('注册后端返回数据:', data);
          })
          .catch(error => {
            console.error('注册请求后端出错:', error);
          });
        // 向后端发起登录请求
        fetch(apiUrl + 'login', {
          method: 'POST', // 或 'GET'
          headers: {
            'Content-Type': 'application/json',
            // 其他需要的 headers
          },
          body: JSON.stringify(registerData) // 如果是 POST/PUT
        })
          .then(response => {
            // 假设后端用 'Authorization' 或 'token' 作为 header 字段
            const tk = response.headers.get('set-cookie') || response.headers.get('token');
            if (tk) {
              token.current = tk;
              AsyncStorage.setItem(TOKEN_KEY, tk);
              console.log('登录响应 header token:', tk);
            }
            // 如果还需要 body，可以继续解析
            return response.json();
          })
          .then(data => {
            console.log('登录后端返回数据:', data);
            // 可以在这里 setState 或处理数据
            
          })
          .catch(error => {
            console.error('登录请求后端出错:', error);
          });
      }

    });
  });

  // memo化 mode 和 fullscreen，避免对象引用频繁变化
  const modeObj = React.useMemo(() => ({ value: mode, setValue: setMode }), [mode, setMode]);
  const fullscreenObj = React.useMemo(() => ({ value: true, setValue: () => {} }), []);


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
              parentId={canvases[0].parentId} // 主画布没有父画布
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
              mode={modeObj}
              moveable={false}
              resizeable={false}
              fullscreen={fullscreenObj}
              globalData={memoizedGlobalData}
              globalState={memoizedGlobalState} // 传递全局状态
              globalUndoRedo={undoRedo} // 传递撤销重做对象
            />
          )}
          {/* 渲染其他画布 */}
          {/* {canvases.map((c, idx) => idx === 0 ? null : (
            <CustomCanvas
              id={c.id}
              key={c.id}
              x={c.x}
              y={c.y}
              width={c.width}
              height={c.height}
              canvasType={CanvasType.Child} // 子画布类型
              onMoveResize={updateCanvas}
              onRemove={removeCanvas}
              canvasBg={currentTheme.colors.background} // 用主题背景色
              color={color}
              size={size}
              mode={{
                value: mode,
                setValue: setMode
              }} // 子画布不需要 mode 状态
              globalData={
                {
                  ...globalDataSetters(c.id)
                }
              }
            />
          ))} */}
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
