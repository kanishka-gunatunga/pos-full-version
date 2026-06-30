import axiosInstance from "@/lib/api/axiosInstance";

const API_URL = "/returns";

export const searchOrderForReturn = async (orderId: string): Promise<any> => {
  const res = await axiosInstance.get(`${API_URL}/search-order/${orderId}`);
  return res.data;
};

export const getReturnById = async (id: string | number): Promise<any> => {
  const res = await axiosInstance.get(`${API_URL}/${id}`);
  return res.data;
};

export const createReturn = async (data: any): Promise<any> => {
  const res = await axiosInstance.post(API_URL, data);
  return res.data;
};
