import { Picker } from '@react-native-picker/picker';
import React from "react";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const COLORS = ["blue", "red", "green", "black", "orange", "purple", "gray"];
const SIZES = [2, 4, 8, 12];

export default function DrawingToolbar({
    color,
    setColor,
    size,
    setSize,
    isEraser,
    setIsEraser,
    onUndo,
    onRedo,
    onSave,
    onLoad,
    mode,
    setMode,
    fontFamily,
    setFontFamily,
    fontOptions,
}: {
    color: string;
    setColor: (c: string) => void;
    size: number;
    setSize: (s: number) => void;
    isEraser: boolean;
    setIsEraser: (e: boolean) => void;
    onUndo: () => void;
    onRedo: () => void;
    onSave: () => void;
    onLoad: () => void;
    mode?: "draw" | "text";
    setMode?: (m: "draw" | "text") => void;
    fontFamily?: string;
    setFontFamily?: (f: string) => void;
    fontOptions?: { label: string; value: string }[];
}) {
    return (
        <View style={styles.toolbar}>
            <View style={styles.row}>
                {COLORS.map((c) => (
                    <TouchableOpacity
                        key={c}
                        style={[
                            styles.colorBtn,
                            { backgroundColor: c, borderWidth: color === c && !isEraser ? 2 : 0 },
                        ]}
                        onPress={() => {
                            setColor(c);
                            setIsEraser(false);
                            setMode && setMode("draw");
                        }}
                    />
                ))}
                <Button
                    title={isEraser ? "橡皮中" : "橡皮"}
                    onPress={() => {
                        setIsEraser(!isEraser);
                        setMode && setMode("draw");
                    }}
                />
                <Button
                    title={mode === "text" ? "文本中" : "文本"}
                    onPress={() => setMode && setMode(mode === "text" ? "draw" : "text")}
                />
            </View>
            <View style={styles.row}>
                {SIZES.map((s) => (
                    <TouchableOpacity
                        key={s}
                        style={[
                            styles.sizeBtn,
                            { borderWidth: size === s ? 2 : 0 },
                        ]}
                        onPress={() => setSize(s)}
                    >
                        <View style={{ backgroundColor: "black", width: s * 2, height: s * 2, borderRadius: s }} />
                    </TouchableOpacity>
                ))}
            </View>
            {/* 字体选择 */}
            {fontFamily && setFontFamily && fontOptions && (
                <View style={styles.row}>
                    <Text style={{ marginRight: 8 }}>字体:</Text>
                    <Picker
                        selectedValue={fontFamily}
                        style={{ width: 120, height: 32 }}
                        onValueChange={setFontFamily}
                        mode="dropdown"
                    >
                        {fontOptions.map(f => (
                            <Picker.Item key={f.value} label={f.label} value={f.value} />
                        ))}
                    </Picker>
                </View>
            )}
            <View style={styles.row}>
                <Button title="撤销" onPress={onUndo} />
                <Button title="恢复" onPress={onRedo} />
                <Button title="保存" onPress={onSave} />
                <Button title="读取" onPress={onLoad} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    toolbar: { padding: 8, backgroundColor: "#eee" },
    row: { flexDirection: "row", alignItems: "center", marginVertical: 4 },
    colorBtn: { width: 28, height: 28, borderRadius: 14, marginHorizontal: 4, borderColor: "#333" },
    sizeBtn: { width: 32, height: 32, marginHorizontal: 4, alignItems: "center", justifyContent: "center", borderColor: "#333", borderRadius: 16 },
});