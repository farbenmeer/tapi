import { defineHandler, TResponse } from "@farbenmeer/tapi/server";

export const GET = defineHandler({ authorize: () => true }, async () => {
  return TResponse.json({ message: "Hello, world!" });
});
