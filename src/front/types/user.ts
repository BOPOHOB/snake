import type { Vendor } from './vendor';

export type AppUser = {
  id: number;
  name: string;
  authVendor: Vendor;
};

export type AuthLoginResponse = {
  authorizeUrl: string;
  state: string;
  vendor: Vendor;
  redirectUri: string;
};
