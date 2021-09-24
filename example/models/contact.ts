import { Row } from '../types';

export interface Contact extends Row {
    id: number;
    firstName: string;
    lastName: string;
    picture: string;
    lastMessage: string;
    isConnected: boolean;
}