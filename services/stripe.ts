import Stripe from "stripe";
import { requireEnv } from "@/lib/env";

export function getStripeClient() {
  const secretKey = requireEnv("STRIPE_SECRET_KEY");
  return new Stripe(secretKey, {
    apiVersion: "2026-01-28.clover"
  });
}
