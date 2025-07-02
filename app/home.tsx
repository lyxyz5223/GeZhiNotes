import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Image, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface CanvasFile {
  id: string;
  name: string;
  preview?: string; // base64 or uri
  data: any;
}

const STORAGE_KEY = 'GeZhiNotes:canvasDataList';

export default function HomeScreen() {
  const [search, setSearch] = useState("");
  const [files, setFiles] = useState<CanvasFile[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFile, setEditFile] = useState<CanvasFile | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteFile, setDeleteFile] = useState<CanvasFile | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const str = await AsyncStorage.getItem(STORAGE_KEY);
      if (!str) return;
      const arr = JSON.parse(str) as CanvasFile[];
      setFiles(arr);
    } catch (e) {
      setFiles([]);
    }
  };

  const filtered = files.filter(f => f.name.includes(search));

  const handleOpen = (file: CanvasFile) => {
    // 跳转到 MainCanvas 并传递 id 或数据
    router.push({ pathname: "/canvas", params: { fileId: file.id } });
  };

  // 悬浮加号按钮的点击事件
  const handleAdd = async () => {
    // 生成唯一 id，可用时间戳+随机数
    const id = Date.now().toString() + Math.floor(Math.random() * 10000);
    const name = `新画布${files.length + 1}`;
    const newFile: CanvasFile = { id, name, data: {} };
    const newFiles = [...files, newFile];
    setFiles(newFiles);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newFiles));
    router.push({ pathname: "/canvas", params: { fileId: id } });
  };

  // 删除画布（弹出自定义Modal）
  const handleDelete = (file: CanvasFile) => {
    setDeleteFile(file);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteFile) return;
    const newFiles = files.filter(f => f.id !== deleteFile.id);
    setFiles(newFiles);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newFiles));
    setDeleteModalVisible(false);
    setDeleteFile(null);
  };

  const handleDeleteCancel = () => {
    setDeleteModalVisible(false);
    setDeleteFile(null);
  };

  // 编辑画布名
  const handleEdit = (file: CanvasFile) => {
    setEditFile(file);
    setEditName(file.name);
    setEditModalVisible(true);
  };

  const handleEditSave = async () => {
    if (!editFile) return;
    const newFiles = files.map(f => f.id === editFile.id ? { ...f, name: editName } : f);
    setFiles(newFiles);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newFiles));
    setEditModalVisible(false);
    setEditFile(null);
  };

  return (
    <View style={styles.root}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={styles.title}>GeZhiNotes 画布首页</Text>
        <TouchableOpacity onPress={() => router.push('/settings')} style={{ padding: 4 }}>
          <Ionicons name="settings-outline" size={26} color="#007aff" />
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.search}
        placeholder="搜索文件名..."
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => handleOpen(item)}>
            {/* 预览图/无预览 */}
            {item.preview ? (
              <Image source={{ uri: item.preview }} style={styles.preview} />
            ) : (
              <View style={[styles.preview, { backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' }]}> 
                <Text style={{ color: '#bbb' }}>无预览</Text>
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.filename}>{item.name}</Text>
              <Text style={styles.fileid}>{item.id}</Text>
            </View>
            {/* 编辑/删除按钮（水平图标） */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => handleEdit(item)}>
                <Text style={styles.iconText}>⚙️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item)}>
                <Text style={styles.iconText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ color: '#aaa', textAlign: 'center', marginTop: 40 }}>暂无保存的画布</Text>}
      />
      {/* 悬浮加号按钮 */}
      <TouchableOpacity style={styles.fab} onPress={handleAdd} activeOpacity={0.8}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* 编辑弹窗 */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalMask}>
          <View style={styles.modalBox}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>重命名画布</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="请输入新名称"
              autoFocus
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 18 }}>
              <Pressable onPress={() => setEditModalVisible(false)} style={styles.modalBtn}><Text style={{ color: '#888' }}>取消</Text></Pressable>
              <Pressable onPress={handleEditSave} style={[styles.modalBtn, { marginLeft: 16 }]}><Text style={{ color: '#007aff', fontWeight: 'bold' }}>保存</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 删除确认弹窗 */}
      {deleteModalVisible && (
        <View style={styles.absModalMask} pointerEvents="box-none">
          <Modal
            visible={deleteModalVisible}
            transparent
            animationType="fade"
            onRequestClose={handleDeleteCancel}
          >
            <View style={styles.modalMask}>
              <View style={styles.modalBox}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>删除画布</Text>
                <Text style={{ fontSize: 16, color: '#444', marginBottom: 18 }}>
                  确定要删除“{deleteFile?.name}”吗？
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                  <Pressable onPress={handleDeleteCancel} style={styles.modalBtn}><Text style={{ color: '#888' }}>取消</Text></Pressable>
                  <Pressable onPress={handleDeleteConfirm} style={[styles.modalBtn, { marginLeft: 16 }]}><Text style={{ color: '#ff3b30', fontWeight: 'bold' }}>删除</Text></Pressable>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8f8f8', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#007aff' },
  search: { backgroundColor: '#fff', borderRadius: 8, padding: 8, marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: '#eee' },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, marginBottom: 12, padding: 10, elevation: 2 },
  preview: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#eee' },
  filename: { fontSize: 17, fontWeight: 'bold', color: '#333' },
  fileid: { fontSize: 12, color: '#aaa', marginTop: 2 },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 36,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007aff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: -2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    alignSelf: 'stretch',
  },
  iconBtn: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 6,
    marginLeft: 2,
    marginRight: 2,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 22,
    color: '#888',
  },
  modalMask: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  absModalMask: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99,
  },
});
