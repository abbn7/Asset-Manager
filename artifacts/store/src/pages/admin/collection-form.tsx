import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListCollections,
  useCreateCollection,
  useUpdateCollection,
  getListCollectionsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";

interface Props { mode: "new" | "edit"; }

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

export default function AdminCollectionForm({ mode }: Props) {
  const params = useParams<{ id?: string }>();
  const id = params.id ?? "";
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { data: collections = [] } = useListCollections();
  const existing = collections.find((c) => c.id === id);

  const create = useCreateCollection();
  const update = useUpdateCollection();

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
  });

  useEffect(() => {
    if (mode === "edit" && existing) {
      setForm({
        name: existing.name,
        slug: existing.slug,
        description: existing.description,
        imageUrl: existing.imageUrl,
      });
    }
  }, [existing, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      description: form.description,
      imageUrl: form.imageUrl,
    };
    if (mode === "new") {
      create.mutate(
        { data: payload },
        {
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: getListCollectionsQueryKey() });
            toast.success("Collection created");
            navigate("/admin/collections");
          },
        },
      );
    } else {
      update.mutate(
        { id, data: payload },
        {
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: getListCollectionsQueryKey() });
            toast.success("Collection saved");
          },
        },
      );
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link
          href="/admin/collections"
          className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Collections
        </Link>
        <h1 className="font-serif text-3xl mt-3">
          {mode === "new" ? "New collection" : form.name || "Edit collection"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-background border border-border p-6">
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
          <p className="text-xs text-muted-foreground">/collections/{form.slug || "—"}</p>
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="rounded-none min-h-24"
          />
        </div>
        <div className="space-y-2">
          <Label>Cover image URL</Label>
          <Input
            value={form.imageUrl}
            onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            className="rounded-none"
          />
          {form.imageUrl && (
            <div className="aspect-[3/2] bg-muted overflow-hidden mt-2">
              <img src={form.imageUrl} alt="" className="h-full w-full object-cover" />
            </div>
          )}
        </div>
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={create.isPending || update.isPending}
            className="rounded-none uppercase tracking-widest text-xs h-11 px-6"
          >
            {mode === "new" ? "Create collection" : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/admin/collections")}
            className="rounded-none uppercase tracking-widest text-xs"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
