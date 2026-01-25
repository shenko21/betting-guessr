import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { ENV } from "./env";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

// Dev user for testing when OAuth is not configured
const DEV_USER: User = {
  id: 1,
  openId: "dev-user-123",
  name: "Demo User",
  email: "demo@betwise.local",
  loginMethod: "dev",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // In development mode, if no user is authenticated and OAuth is not configured,
  // use the dev user for testing
  if (!user && process.env.NODE_ENV === "development" && !ENV.oauthServerUrl) {
    user = DEV_USER;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
