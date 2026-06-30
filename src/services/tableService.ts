import api from '@/lib/api/axiosInstance';
import { Table, CreateTableRequest, UpdateTableRequest } from '../types/table';

export const tableService = {
    getTables: async (search?: string): Promise<Table[]> => {
        const params = search ? { search } : {};
        const response = await api.get<Table[]>('/tables', { params });
        return response.data;
    },

    createTable: async (data: CreateTableRequest): Promise<Table> => {
        const response = await api.post<Table>('/tables', data);
        return response.data;
    },

    updateTable: async (id: number, data: UpdateTableRequest): Promise<Table> => {
        const response = await api.put<Table>(`/tables/${id}`, data);
        return response.data;
    },

    deleteTable: async (id: number): Promise<void> => {
        await api.delete(`/tables/${id}`);
    }
};
