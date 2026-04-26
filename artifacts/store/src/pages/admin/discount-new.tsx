import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateDiscount,
  getListDiscountsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";

export default function AdminDiscountNew() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const create = useCreateDiscount();

  const [form, setForm] = useState({
    code: "",
    type: "percentage" as "percentage" | "fixed",
    value: 10,
    minSubtotal: "" as string | "",
    usageLimit: "" as string | "",
    expiresAt: "" as string | "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      {
        data: {
          code: form.code.toUpperCase().trim(),
          type: form.type,
          value: Number(form.value),
          minSubtotal: form.minSubtotal === "" ? undefined : Number(form.minSubtotal),
          usageLimit: form.usageLimit === "" ? undefined : Number(form.usageLimit),
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
        },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListDiscountsQueryKey() });
          toast.success("Discount created");
          navigate("/admin/discounts");
        },
      },
    );
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href="/admin/discounts" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ChevronLeft className="h-3.5 w-3.5" /> Discounts
        </Link>
        <h1 className="font-serif text-3xl mt-3">New discount</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-background border border-border p-6">
        <div className="space-y-2">
          <Label>Code</Label>
          <Input
            required
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            placeholder="WELCOME10"
            className="rounded-none font-mono"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as "percentage" | "fixed" }))}>
              <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="fixed">Fixed amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{form.type === "percentage" ? "Percent off" : "Amount off"}</Label>
            <Input
              type="number"
              required
              step="0.01"
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))}
              className="rounded-none"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Minimum subtotal (optional)</Label>
          <Input
            type="number"
            step="0.01"
            value={form.minSubtotal}
            onChange={(e) => setForm((f) => ({ ...f, minSubtotal: e.target.value }))}
            className="rounded-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Usage limit (optional)</Label>
            <Input
              type="number"
              value={form.usageLimit}
              onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
              className="rounded-none"
            />
          </div>
          <div className="space-y-2">
            <Label>Expires (optional)</Label>
            <Input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
              className="rounded-none"
            />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={create.isPending}
            className="rounded-none uppercase tracking-widest text-xs h-11 px-6"
          >
            {create.isPending ? "Creating…" : "Create discount"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/admin/discounts")}
            className="rounded-none uppercase tracking-widest text-xs"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
