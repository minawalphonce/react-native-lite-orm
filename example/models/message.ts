import { Row } from '../types';

export interface Message extends Row {
  id: string;
  text: string;
  senderId: number;
  receiptId: number;

  status: number;
  createdAt?: number | null;
  updatedAt?: Date | number;

  deletedAt?: Date | number;
  audio?: string;
  image?: string;

  type: number;
  video?: string;
}
