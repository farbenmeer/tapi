import { defineHandler, TResponse } from "@farbenmeer/bunny/server";
import { z } from "zod";

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
}

let nextId = 1;
export const contactsMap = new Map<string, Contact>();

export const GET = defineHandler(
  {
    authorize: () => true,
  },
  async () => {
    const contacts = Array.from(contactsMap.values());
    return TResponse.json(contacts, {
      cache: { tags: ["contacts"], ttl: 60 },
    });
  },
);

export const POST = defineHandler(
  {
    authorize: () => true,
    body: z.object({
      name: z.string().min(1),
      email: z.string().min(1),
      phone: z.string().optional().default(""),
    }),
  },
  async (req) => {
    const data = await req.data();
    const id = String(nextId++);
    const contact: Contact = { id, ...data };
    contactsMap.set(id, contact);
    return TResponse.json(contact, {
      cache: { tags: ["contacts"] },
    });
  },
);

export const DELETE = defineHandler(
  {
    authorize: () => true,
  },
  async () => {
    const ids = Array.from(contactsMap.keys());
    contactsMap.clear();
    return TResponse.void({
      cache: { tags: ["contacts", ...ids.map((id) => `contact:${id}`)] },
    });
  },
);
