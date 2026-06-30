import axiosInstance from "@/lib/api/axiosInstance";

const API_URL = "/chatbot";

export const sendMessage = async (message: string): Promise<{ response: string }> => {
  const res = await axiosInstance.post(API_URL, { message });
  return res.data;
};
