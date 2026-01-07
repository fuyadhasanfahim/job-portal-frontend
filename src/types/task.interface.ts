import { ILead } from './lead.interface';

export interface ITask {
    _id: string;
    title?: string;
    description?: string;
    type: 'lead_generation';
    quantity?: number;
    leads?: ILead[];

    createdBy: {
        firstName: string;
        lastName: string;
        image: string;
        email: string;
        role: string;
    };
    assignedTo?: {
        firstName: string;
        lastName: string;
        image: string;
        email: string;
        role: string;
    };
    assignedBy?: string;

    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    startedAt?: Date;
    finishedAt?: Date;

    progress?: number;
    metrics?: {
        done?: number;
        total?: number;
    };

    completedLeads?: string[];

    createdAt: Date;
    updatedAt: Date;
}
