export interface IUserSummary {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
    image?: string;
}

export interface ILog {
    _id: string;
    user?: IUserSummary | null;
    action: string;
    entityType: 'lead' | 'task' | 'user' | 'system' | 'other';
    entityId?: string;
    description?: string;
    data?: Record<string, any>;
    ip?: string;
    userAgent?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ILogPagination {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
}

export interface ILogStatItem {
    _id: string | number | null;
    count: number;
}

export interface IUserStatItem extends ILogStatItem {
    firstName?: string;
    lastName?: string;
}

export interface ILogStats {
    actions: ILogStatItem[];
    entities: ILogStatItem[];
    users: IUserStatItem[];
    hourly: ILogStatItem[];
    daily: ILogStatItem[];
}

export interface ILogsResponse {
    items: ILog[];
    pagination: ILogPagination;
    stats: ILogStats;
}
