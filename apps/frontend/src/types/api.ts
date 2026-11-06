import type { Data } from "@cisco-disco/backend/data";
import type { Route } from "@tuyau/core/types";
import "@cisco-disco/backend/registry";

export type User = Data.User;
export type Channel = Data.Channel;
export type PublicProfile = Data.PublicProfile;

export type SignupRequest = Route.Body<"auth.new_account.store">;
export type LoginRequest = Route.Body<"auth.access_tokens.store">;
