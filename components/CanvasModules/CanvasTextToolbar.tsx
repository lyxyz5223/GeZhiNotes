import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface ToolbarProps {
  onFontChange: (font: string) => void;
  onColorChange: (color: string) => void;
  onSizeChange: (size: number) => void;
  activeId: string | null;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  onFontChange, 
  onColorChange, 
  onSizeChange,
  activeId
}) => {
  const [visible, setVisible] = useState(false);
  const [fontInput, setFontInput] = useState('');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedSize, setSelectedSize] = useState(16);

  const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00'];
  const sizes = [12, 14, 16, 18, 20, 24, 28, 32];

  // 字体选择
  const handleFontSubmit = () => {
    if (fontInput.trim()) {
      onFontChange(fontInput.trim());
      setFontInput('');
    }
  };

  if (!activeId) return null;

  return (
    <View style={styles.container}>
      {/* 工具栏触发按钮 */}
      <TouchableOpacity 
        style={styles.toggleButton}
        onPress={() => setVisible(!visible)}
      >
        <Text style={styles.toggleButtonText}>T</Text>
      </TouchableOpacity>

      {/* 工具栏内容 */}
      {visible && (
        <View style={styles.toolbar}>
          {/* 字体选择 */}
          <View style={styles.inputContainer}>
        <TextInput
          style={styles.fontInput}
          placeholder="输入字体名称"
          value={fontInput}
          onChangeText={setFontInput}
          onSubmitEditing={handleFontSubmit}
          editable={!!activeId}
        />
        <TouchableOpacity 
          style={styles.applyButton}
          onPress={handleFontSubmit}
          disabled={!activeId || !fontInput.trim()}
        >
          <Text>应用</Text>
        </TouchableOpacity>
      </View>

          {/* 颜色选择 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>颜色</Text>
            <View style={styles.options}>
              {colors.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.selectedOption
                  ]}
                  onPress={() => {
                    setSelectedColor(color);
                    onColorChange(color);
                  }}
                />
              ))}
            </View>
          </View>

          {/* 字号选择 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>字号</Text>
            <View style={styles.options}>
              {sizes.map(size => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.option,
                    selectedSize === size && styles.selectedOption
                  ]}
                  onPress={() => {
                    setSelectedSize(size);
                    onSizeChange(size);
                  }}
                >
                  <Text>{size}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    zIndex: 100,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  fontInput: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  applyButton: {
    marginLeft: 8,
    padding: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  toolbar: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    width: 200,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    elevation: 5,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  option: {
    padding: 5,
    margin: 2,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  colorOption: {
    width: 25,
    height: 25,
    margin: 2,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  selectedOption: {
    borderColor: '#3498db',
    borderWidth: 2,
  },
});

export default Toolbar;
