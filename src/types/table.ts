export type TableStatus = 'available' | 'unavailable' | 'reserved';

export interface Table {
    id: number;
    table_name: string;
    status: TableStatus;
    created_at?: string;
    updated_at?: string;
}

export interface CreateTableRequest {
    table_name: string;
    status?: TableStatus;
}

export interface UpdateTableRequest {
    table_name?: string;
    status?: TableStatus;
}
