import { http } from "../http";

/** Saved delivery addresses. One is always the default. */

export type Address = {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  landmark: string | null;
  isDefault: boolean;
};

export type AddressInput = {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault?: boolean;
};

export const listAddresses = () => http.get<Address[]>("/api/addresses");

export const createAddress = (input: AddressInput) =>
  http.post<{ id: string; isDefault: boolean }>("/api/addresses", input);

export const updateAddress = (id: string, input: Partial<AddressInput>) =>
  http.patch<{ id: string; isDefault: boolean }>(
    `/api/addresses/${id}`,
    input,
  );

export const deleteAddress = (id: string) =>
  http.del<{ deleted: boolean }>(`/api/addresses/${id}`);
