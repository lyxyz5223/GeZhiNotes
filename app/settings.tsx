import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const STORAGE_KEY = 'GeZhiNotes:settings';

export default function SettingsScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [server, setServer] = useState('');
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const str = await AsyncStorage.getItem(STORAGE_KEY);
        if (str) {
          const obj = JSON.parse(str);
          setUsername(obj.username || '');
          setPassword(obj.password || '');
          setServer(obj.server || '');
        }
      } catch {}
    })();
  }, []);

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ username, password, server }));
      Alert.alert('保存成功');
      router.back();
    } catch {
      Alert.alert('保存失败');
    }
  };

  return (
    <View style={styles.root}>
      <Text style={styles.title}>设置</Text>
      <Text style={styles.label}>服务器地址</Text>
      <TextInput
        style={styles.input}
        value={server}
        onChangeText={setServer}
        placeholder="如 https://api.example.com"
        autoCapitalize="none"
      />
      <Text style={styles.label}>用户名</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="用户名"
        autoCapitalize="none"
      />
      <Text style={styles.label}>密码</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="密码"
        secureTextEntry
      />
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>保存</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8f8f8', padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 24, color: '#007aff', alignSelf: 'center' },
  label: { fontSize: 15, color: '#444', marginTop: 18, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 10, fontSize: 16, borderWidth: 1, borderColor: '#eee' },
  saveBtn: { marginTop: 36, backgroundColor: '#007aff', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
