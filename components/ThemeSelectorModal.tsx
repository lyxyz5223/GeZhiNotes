import { allThemes } from "@/constants/CanvasTheme";
import React from "react";
import { FlatList, Modal, Pressable, Text, TouchableOpacity, View } from "react-native";

interface ThemeSelectorModalProps {
  visible: boolean;
  currentIndex: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}

const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({ visible, currentIndex, onSelect, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' }} onPress={onClose}>
        <View style={{ position: 'absolute', top: 120, left: 40, right: 40, backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>选择主题</Text>
          <FlatList
            data={allThemes}
            keyExtractor={item => item.name}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={{ paddingVertical: 12, paddingHorizontal: 8, backgroundColor: index === currentIndex ? '#eee' : 'transparent', borderRadius: 8, marginBottom: 4 }}
                onPress={() => {
                  onSelect(index);
                  onClose();
                }}
              >
                <Text style={{ color: '#222', fontSize: 16 }}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Pressable>
    </Modal>
  );
};

export default ThemeSelectorModal;
