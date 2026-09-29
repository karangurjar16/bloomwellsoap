"use client";

import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CategoryLogo } from "@/components/admin/CategoryLogo";
import { PageTitle } from "@/components/admin/PageTitle";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/admin/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
  type AdminCategory,
} from "@/services/admin/categories";

const labelClass =
  "text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [creating, setCreating] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    const result = await listCategories();
    if (!result.ok) {
      setError(result.error);
      setCategories([]);
      return;
    }
    setCategories(result.data);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onCreate() {
    setCreating(true);
    setNameError(null);

    const result = await createCategory({
      name,
      emoji: emoji.trim() || undefined,
      sortOrder: categories?.length ?? 0,
    });

    if (!result.ok) {
      setNameError(result.fields?.name ?? result.error);
      setCreating(false);
      return;
    }

    setName("");
    setEmoji("");
    setCreating(false);
    toast.success(`${result.data.name} added`);
    await refresh();
  }

  async function onRename(id: string) {
    setSavingId(id);
    const result = await updateCategory(id, { name: editName });
    setSavingId(null);

    if (!result.ok) {
      toast.error(result.fields?.name ?? result.error);
      return;
    }

    setEditingId(null);
    toast.success("Renamed");
    await refresh();
  }

  async function onToggle(category: AdminCategory) {
    setSavingId(category.id);
    const result = await updateCategory(category.id, {
      isActive: !category.isActive,
    });
    setSavingId(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(category.isActive ? "Hidden from store" : "Visible in store");
    await refresh();
  }

  async function onDelete(category: AdminCategory) {
    // The API refuses with 409 while products still reference it, so the
    // confirm text stays honest rather than promising a cascade.
    if (!window.confirm(`Delete "${category.name}"? This cannot be undone.`)) {
      return;
    }

    setSavingId(category.id);
    const result = await deleteCategory(category.id);
    setSavingId(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Category deleted");
    await refresh();
  }

  return (
    <>
      <PageTitle eyebrow="Manage" title="Categories" />

      {/* Create form sits at the top: adding is the most frequent action here. */}
      <div className="border border-border bg-card p-4">
        <div className="flex gap-2.5">
          <div className="flex-1 space-y-2">
            <Label htmlFor="cat-name" className={labelClass}>
              New category
            </Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Shampoos"
              aria-invalid={Boolean(nameError)}
              className="h-12 px-3.5 text-base"
            />
          </div>
          <div className="w-20 space-y-2">
            <Label htmlFor="cat-emoji" className={labelClass}>
              Icon
            </Label>
            <Input
              id="cat-emoji"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="💎"
              maxLength={4}
              className="h-12 px-3.5 text-center text-base"
            />
          </div>
        </div>

        {nameError && (
          <p className="mt-2 text-xs text-destructive">{nameError}</p>
        )}

        <p className="mt-2 text-xs text-muted-foreground">
          The icon is a fallback. Add a proper logo image from the list below
          once the category exists.
        </p>

        <Button
          type="button"
          onClick={() => void onCreate()}
          disabled={creating || name.trim().length < 2}
          className="mt-3 h-11 w-full text-[11px] tracking-[0.16em] uppercase"
        >
          <Plus data-icon="inline-start" />
          {creating ? "Adding" : "Add category"}
        </Button>
      </div>

      <Separator className="my-6" />

      {error && (
        <div className="mb-4">
          <ErrorState message={error} onRetry={() => void refresh()} />
        </div>
      )}

      {categories === null ? (
        <ListSkeleton rows={3} />
      ) : categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          hint="Add one above — products need a category before they can be created."
        />
      ) : (
        <ul className="space-y-2.5">
          {categories.map((category) => (
            <li
              key={category.id}
              className="border border-border bg-card px-3 py-3"
            >
              {editingId === category.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                    className="h-11 px-3 text-base"
                  />
                  <Button
                    type="button"
                    size="icon-lg"
                    onClick={() => void onRename(category.id)}
                    disabled={savingId === category.id}
                    aria-label="Save name"
                  >
                    <Check />
                  </Button>
                  <Button
                    type="button"
                    size="icon-lg"
                    variant="outline"
                    onClick={() => setEditingId(null)}
                    aria-label="Cancel"
                  >
                    <X />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <CategoryLogo category={category} onChanged={refresh} />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {category.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      /{category.slug}
                    </p>
                  </div>

                  {/* Visible in the storefront or not. */}
                  <Switch
                    checked={category.isActive}
                    disabled={savingId === category.id}
                    onCheckedChange={() => void onToggle(category)}
                    aria-label={`${category.isActive ? "Hide" : "Show"} ${category.name}`}
                  />

                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(category.id);
                      setEditName(category.name);
                    }}
                    aria-label={`Rename ${category.name}`}
                  >
                    <Pencil />
                  </Button>

                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => void onDelete(category)}
                    disabled={savingId === category.id}
                    aria-label={`Delete ${category.name}`}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 />
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
