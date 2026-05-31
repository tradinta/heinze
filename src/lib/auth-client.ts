import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
  plugins: [
    inferAdditionalFields({
      user: {
        role: { type: "string", required: false },
        signUpDevice: { type: "string", required: false },
        signUpDate: { type: "string", required: false },
      },
    }),
  ],
});
