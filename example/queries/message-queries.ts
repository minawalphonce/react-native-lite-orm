import { QueryOptions, Op } from "../types";
import { Message } from "../models";

export function roomMessages(currentChatParty: number, currentMemberId: number): QueryOptions<Message> {
    return {
        columns: '*',
        where: [
            {
                senderId: {
                    [Op.eq]: currentChatParty,
                },
                receiptId: {
                    [Op.eq]: currentMemberId,
                },
            },
            {
                senderId: {
                    [Op.eq]: currentMemberId,
                },
                receiptId: {
                    [Op.eq]: currentChatParty,
                },
            },
        ],
        order: ['updatedAt asc'],
        limit: 100
    }
}