import { CustomCanvasProps } from "@/types/CanvasTypes";
import CustomCanvas from "../../CustomCanvas";


const CustomCanvasModule = ({ props, extraParams }: {
  props: CustomCanvasProps;
  extraParams: any;
}) => {
  return <CustomCanvas {...props} />
};

export default CustomCanvasModule;