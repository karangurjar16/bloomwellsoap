import { http } from "../http";

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
  /** Resolved logo URL for display. */
  image: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type CategoryLogo = {
  path: string;
  provider?: "local" | "cloudinary";
  width: number;
  height: number;
  alt?: string;
};

export const listCategories = () =>
  http.get<AdminCategory[]>("/api/admin/categories");

export const createCategory = (input: {
  name: string;
  emoji?: string;
  sortOrder?: number;
}) => http.post<AdminCategory>("/api/admin/categories", input);

export const updateCategory = (
  id: string,
  input: Partial<{
    name: string;
    emoji: string;
    sortOrder: number;
    isActive: boolean;
    /** null clears the logo. */
    image: CategoryLogo | null;
  }>,
) => http.patch<AdminCategory>(`/api/admin/categories/${id}`, input);

/** Refused with 409 while products still reference the category. */
export const deleteCategory = (id: string) =>
  http.del<{ deleted: boolean }>(`/api/admin/categories/${id}`);
