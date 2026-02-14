import { defineHandler, TResponse, HttpError } from "@farbenmeer/bunny/server";
import { z } from "zod";
import { contactsMap } from "./contacts";

const params = {
  id: z.string(),
};

export const GET = defineHandler(
  {
    params,
    authorize: () => true,
  },
  async (req) => {
    const { id } = req.params();
    const contact = contactsMap.get(id);
    if (!contact) throw new HttpError(404, "Contact not found");
    return TResponse.json(contact, {
      cache: { tags: ["contacts", `contact:${id}`], ttl: 60 },
    });
  }
);

export const PATCH = defineHandler(
  {
    params,
    authorize: () => true,
    body: z.object({
      name: z.string().min(1).optional(),
      email: z.string().min(1).optional(),
      phone: z.string().optional(),
    }),
  },
  async (req) => {
    const { id } = req.params();
    const contact = contactsMap.get(id);
    if (!contact) throw new HttpError(404, "Contact not found");
    const data = await req.data();
    const updated = { ...contact, ...data };
    contactsMap.set(id, updated);
    return TResponse.json(updated, {
      cache: { tags: ["contacts", `contact:${id}`] },
    });
  }
);

export const DELETE = defineHandler(
  {
    params,
    authorize: () => true,
  },
  async (req) => {
    const { id } = req.params();
    const contact = contactsMap.get(id);
    if (!contact) throw new HttpError(404, "Contact not found");
    contactsMap.delete(id);
    return TResponse.void({
      cache: { tags: ["contacts", `contact:${id}`] },
    });
  }
);
