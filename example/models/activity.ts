import { Row } from '../types';

export interface Activity extends Row {
    id: string;
    profileId: number;
    title: string;
    text: string;
    category: string
    subCategory: string
    payload: string,
    createdAt: Date;
    updatedAt: Date;
}