import type { Logger } from "@farbenmeer/tapi/server";

export const bunnyLogger: Logger = {
  error: (error) => {
    console.error(error);
  },
};
