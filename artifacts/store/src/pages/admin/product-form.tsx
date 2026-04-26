import { useEffect, useState } from "react";
import { useLocation, useParams, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetProductById,
  useCreateProduct,
  useUpdateProduct,
  useListCollections,
  getListProductsQueryKey,
  getGetProductByIdQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  mode: "new" | "edit";
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

export default function AdminProductForm({ mode }: Props) {
  const params = useParams<{ id?: string }>();
  const id = params.id ?? "";
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  const { data: existing, isLoading } = useGetProductById(id, { query: { enabled: mode === "edit" && !!id } as never });
  const { data: collections = [] } = useListCollections();
  const create = useCreateProduct();
  const update = useUpdateProduct();

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    fullDescription: "",
    price: 0,
    compareAtPrice: "" as string | "",
    currency: "USD",
    inStock: true,
    featured: false,
    images: [] as string[],
    tags: [] as string[],
    collectionIds: [] as string[],
  });
  const [imageInput, setImageInput] = useState("");
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (mode === "edit" && existing) {
      setForm({
        name: existing.name,
        slug: existing.slug,
        description: existing.description,
        fullDescription: existing.fullDescription,
        price: existing.price,
        compareAtPrice: existing.compareAtPrice == null ? "" : String(existing.compareAtPrice),
        currency: existing.currency,
        inStock: existing.inStock,
        featured: existing.featured,
        images: existing.images ?? [],
        tags: existing.tags ?? [],
        collectionIds: (existing.collections ?? []).map((c) => c.id),
      });
    }
  }, [existing, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      description: form.description,
      fullDescription: form.fullDescription,
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice === "" ? undefined : Number(form.compareAtPrice),
      currency: form.currency,
      inStock: form.inStock,
      featured: form.featured,
      images: form.images,
      tags: form.tags,
      collectionIds: form.collectionIds,
    };
    if (mode === "new") {
      create.mutate(
        { data: payload },
        {
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
            toast.success("Product created");
            navigate("/admin/products");
          },
        },
      );
    } else {
      update.mutate(
        { id, data: payload },
        {
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
            qc.invalidateQueries({ queryKey: getGetProductByIdQueryKey(id) });
            toast.success("Product saved");
          },
        },
      );
    }
  };

  if (mode === "edit" && isLoading) {
    return <Skeleton className="h-96 rounded-none" />;
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Link
          href="/admin/products"
          className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Products
        </Link>
        <h1 className="font-serif text-3xl mt-3">
          {mode === "new" ? "New product" : form.name || "Edit product"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="bg-background border border-border p-6 space-y-4">
          <h2 className="text-xs uppercase tracking-widest font-medium">Basics</h2>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((f) => ({ ...f, name, slug: f.slug || slugify(name) }));
              }}
              className="rounded-none"
              data-testid="input-name"
            />
          </div>
          <div className="space-y-2">
            <Label>URL handle</Label>
            <Input
              required
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
              className="rounded-none font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">/products/{form.slug || "—"}</p>
          </div>
          <div className="space-y-2">
            <Label>Short description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="rounded-none min-h-20"
            />
          </div>
          <div className="space-y-2">
            <Label>Full description</Label>
            <Textarea
              value={form.fullDescription}
              onChange={(e) => setForm((f) => ({ ...f, fullDescription: e.target.value }))}
              className="rounded-none min-h-32"
            />
          </div>
        </section>

        <section className="bg-background border border-border p-6 space-y-4">
          <h2 className="text-xs uppercase tracking-widest font-medium">Pricing & inventory</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Price</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                className="rounded-none"
                data-testid="input-price"
              />
            </div>
            <div className="space-y-2">
              <Label>Compare at (optional)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.compareAtPrice}
                onChange={(e) => setForm((f) => ({ ...f, compareAtPrice: e.target.value }))}
                className="rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))}
                className="rounded-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <Label>In stock</Label>
            <Switch
              checked={form.inStock}
              onCheckedChange={(v) => setForm((f) => ({ ...f, inStock: v }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Featured on storefront</Label>
            <Switch
              checked={form.featured}
              onCheckedChange={(v) => setForm((f) => ({ ...f, featured: v }))}
            />
          </div>
        </section>

        <section className="bg-background border border-border p-6 space-y-4">
          <h2 className="text-xs uppercase tracking-widest font-medium">Images</h2>
          <div className="flex gap-2">
            <Input
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              placeholder="Paste image URL"
              className="rounded-none"
            />
            <Button
              type="button"
              variant="outline"
              className="rounded-none"
              onClick={() => {
                if (imageInput.trim()) {
                  setForm((f) => ({ ...f, images: [...f.images, imageInput.trim()] }));
                  setImageInput("");
                }
              }}
            >
              Add
            </Button>
          </div>
          {form.images.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {form.images.map((img, i) => (
                <div key={i} className="relative aspect-square bg-muted overflow-hidden group">
                  <img src={img} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                    className="absolute top-1 right-1 h-6 w-6 bg-background/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-background border border-border p-6 space-y-4">
          <h2 className="text-xs uppercase tracking-widest font-medium">Organization</h2>
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag"
                className="rounded-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (tagInput.trim()) {
                      setForm((f) => ({ ...f, tags: [...new Set([...f.tags, tagInput.trim()])] }));
                      setTagInput("");
                    }
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="rounded-none"
                onClick={() => {
                  if (tagInput.trim()) {
                    setForm((f) => ({ ...f, tags: [...new Set([...f.tags, tagInput.trim()])] }));
                    setTagInput("");
                  }
                }}
              >
                Add
              </Button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {form.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-muted"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }))}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Collections</Label>
            {collections.length === 0 ? (
              <p className="text-xs text-muted-foreground">No collections yet. <Link href="/admin/collections/new" className="underline">Create one</Link>.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {collections.map((c) => {
                  const sel = form.collectionIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          collectionIds: sel
                            ? f.collectionIds.filter((id) => id !== c.id)
                            : [...f.collectionIds, c.id],
                        }))
                      }
                      className={`text-xs px-3 py-1.5 border ${
                        sel
                          ? "bg-foreground text-background border-foreground"
                          : "border-border hover:border-foreground"
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={create.isPending || update.isPending}
            className="rounded-none uppercase tracking-widest text-xs h-11 px-6"
            data-testid="button-save"
          >
            {create.isPending || update.isPending ? "Saving…" : mode === "new" ? "Create product" : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/admin/products")}
            className="rounded-none uppercase tracking-widest text-xs"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
