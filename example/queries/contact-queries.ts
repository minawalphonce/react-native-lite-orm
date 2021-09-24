import { QueryOptions, Op } from "../types";
import { Contact } from "../models";


export function contactById(id: number): QueryOptions<Contact> {
    return {
        columns: "*",
        where: [{
            id: {
                [Op.eq]: id
            }
        }],
        limit: 1
    };
}