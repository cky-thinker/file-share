import { ElMessage } from "element-plus";

export const successMessage = (message) => {
  ElMessage.closeAll(); // 关闭历史消息
  ElMessage.success({ message: message, type: "success" });
};

export const errorMessage = (message) => {
  ElMessage.closeAll(); // 关闭历史消息
  ElMessage.error({ message: message, type: "error" });
};
