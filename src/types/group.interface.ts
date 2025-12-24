export interface IGroup {
    _id: string;
    name: string;
    description?: string;
    color?: string;
    isActive: boolean;
    createdBy: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    createdAt: string;
    updatedAt: string;
}
