import MainCanvas from "@/components/MainCanvas";
import { useLocalSearchParams } from "expo-router";

export default function Canvas() {
  const { fileId } = useLocalSearchParams();
  return <MainCanvas fileId={fileId as string} />;
}