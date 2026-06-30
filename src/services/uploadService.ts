import axiosInstance from "@/lib/api/axiosInstance";

export const uploadImage = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append("image", file);
  
  const res = await axiosInstance.post("/upload/image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};
