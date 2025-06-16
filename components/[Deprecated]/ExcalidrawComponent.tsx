// "use client";
import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import { ExcalidrawProps } from "@excalidraw/excalidraw/types";
import { useEffect, useState } from "react";
// import "@excalidraw/excalidraw/dist/prod/index.css";

// 定义 Excalidraw 组件的类型
type ExcalidrawType = React.MemoExoticComponent<(props: ExcalidrawProps) => import("react/jsx-runtime").JSX.Element> | null;

const ExcalidrawWrapper: React.FC = () => {
    const [Excalidraw, setExcalidraw] = useState<ExcalidrawType>(null);

    useEffect(() => {
        // 动态导入只在客户端执行
        import('@excalidraw/excalidraw').then((module) => {
            setExcalidraw(() => module.Excalidraw);
        });
    }, []);

    if (!Excalidraw)
        return <div>Loading Excalidraw...</div>;

    const initElems = convertToExcalidrawElements([
        {
            type: "rectangle",
            x: 50,
            y: 250,
            width: 200,
            height: 100,
            backgroundColor: "#c0eb75",
            strokeWidth: 2,
        },
        {
            type: "ellipse",
            x: 300,
            y: 250,
            width: 200,
            height: 100,
            backgroundColor: "#ffc9c9",
            strokeStyle: "dotted",
            fillStyle: "solid",
            strokeWidth: 2,
        },
        {
            type: "diamond",
            x: 550,
            y: 250,
            width: 200,
            height: 100,
            backgroundColor: "#a5d8ff",
            strokeColor: "#1971c2",
            strokeStyle: "dashed",
            fillStyle: "cross-hatch",
            strokeWidth: 2,
        },
    ]);
    return (
        <Excalidraw initialData={{
            elements: initElems,
            appState: { viewBackgroundColor: "#000000" },
            scrollToContent: true
        }}></Excalidraw>
    );
};
export default ExcalidrawWrapper;