import { betterAuth } from "better-auth";
import { Pool } from "@neondatabase/serverless";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
      signUpDevice: {
        type: "string",
        required: false,
        input: true,
      },
      signUpDate: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },
});
