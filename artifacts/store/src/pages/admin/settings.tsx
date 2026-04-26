import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetStoreSettings,
  useUpdateStoreSettings,
  getGetStoreSettingsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function AdminSettings() {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useGetStoreSettings();
  const update = useUpdateStoreSettings();

  const [form, setForm] = useState({
    name: "",
    tagline: "",
    currency: "USD",
    primaryColor: "",
    accentColor: "",
    logoUrl: "",
    heroTitle: "",
    heroSubtitle: "",
    heroImageUrl: "",
    contactEmail: "",
    instagramUrl: "",
    twitterUrl: "",
    footerText: "",
  });

  useEffect(() => {
    if (settings) setForm({ ...form, ...settings });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate(
      { data: form },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetStoreSettingsQueryKey() });
          toast.success("Settings saved");
        },
      },
    );
  };

  if (isLoading) return <Skeleton className="h-96 rounded-none max-w-3xl" />;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl">Store settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Brand-level details shown across your storefront.
        </p>
      </div>

      <form onSubmit={save} className="space-y-8">
        <section className="bg-background border border-border p-6 space-y-4">
          <h2 className="text-xs uppercase tracking-widest font-medium">Identity</h2>
          <div className="space-y-2">
            <Label>Store name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-none"
            />
          </div>
          <div className="space-y-2">
            <Label>Tagline</Label>
            <Input
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="rounded-none"
              placeholder="Spring Edition"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
                className="rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Primary color</Label>
              <Input
                value={form.primaryColor}
                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                className="rounded-none"
                placeholder="#1a1a1a"
              />
            </div>
            <div className="space-y-2">
              <Label>Accent color</Label>
              <Input
                value={form.accentColor}
                onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                className="rounded-none"
                placeholder="#c8a97e"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Logo URL</Label>
            <Input
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              className="rounded-none"
            />
          </div>
        </section>

        <section className="bg-background border border-border p-6 space-y-4">
          <h2 className="text-xs uppercase tracking-widest font-medium">Hero</h2>
          <div className="space-y-2">
            <Label>Hero title</Label>
            <Input
              value={form.heroTitle}
              onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
              className="rounded-none"
            />
          </div>
          <div className="space-y-2">
            <Label>Hero subtitle</Label>
            <Input
              value={form.heroSubtitle}
              onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
              className="rounded-none"
            />
          </div>
          <div className="space-y-2">
            <Label>Hero image URL</Label>
            <Input
              value={form.heroImageUrl}
              onChange={(e) => setForm({ ...form, heroImageUrl: e.target.value })}
              className="rounded-none"
            />
            {form.heroImageUrl && (
              <div className="aspect-[16/9] bg-muted overflow-hidden mt-2">
                <img src={form.heroImageUrl} alt="" className="h-full w-full object-cover" />
              </div>
            )}
          </div>
        </section>

        <section className="bg-background border border-border p-6 space-y-4">
          <h2 className="text-xs uppercase tracking-widest font-medium">Contact & social</h2>
          <div className="space-y-2">
            <Label>Contact email</Label>
            <Input
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              className="rounded-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Instagram URL</Label>
              <Input
                value={form.instagramUrl}
                onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
                className="rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Twitter / X URL</Label>
              <Input
                value={form.twitterUrl}
                onChange={(e) => setForm({ ...form, twitterUrl: e.target.value })}
                className="rounded-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Footer text</Label>
            <Textarea
              value={form.footerText}
              onChange={(e) => setForm({ ...form, footerText: e.target.value })}
              className="rounded-none min-h-20"
            />
          </div>
        </section>

        <Button
          type="submit"
          disabled={update.isPending}
          className="rounded-none uppercase tracking-widest text-xs h-11 px-6"
        >
          {update.isPending ? "Saving…" : "Save settings"}
        </Button>
      </form>
    </div>
  );
}
