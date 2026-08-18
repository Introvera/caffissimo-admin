"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScaleInput } from "@/components/ui/scale-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useDeleteProductProfileMutation,
  useGetProductProfileQuery,
  useUpsertProductProfileMutation,
} from "@/stores/api/productProfileApi";
import { UpsertProductProfileRequest } from "@/types";
import { Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/** Shape RTK Query uses for a failed request body. */
type ApiError = { data?: { message?: string } };

const MAX_NOTE_LENGTH = 1000;

const EMPTY: UpsertProductProfileRequest = {
  sensoryNote: null,
  occasionNote: null,
  sweetness: null,
  intensity: null,
  richness: null,
  acidity: null,
  caffeineLevel: null,
  isServedHot: null,
};

interface RecommendationProfileCardProps {
  productId: string;
  /** False for non-SuperAdmin or when the page is not in edit mode. */
  disabled: boolean;
}

/**
 * Editor for a product's AI recommendation profile.
 *
 * Saved independently of the product form: profiles live in their own table behind their own
 * endpoint, and the product form is a multipart submit with images and branch configs. Keeping
 * them separate means writing a profile cannot fail because of an unrelated image upload, and
 * vice versa.
 */
export function RecommendationProfileCard({
  productId,
  disabled,
}: RecommendationProfileCardProps) {
  // 204 (no profile yet) arrives as null — the normal case for most products.
  const { data: profile, isLoading } = useGetProductProfileQuery(productId);
  const [upsertProfile, { isLoading: isSaving }] = useUpsertProductProfileMutation();
  const [deleteProfile, { isLoading: isDeleting }] = useDeleteProductProfileMutation();

  const [form, setForm] = useState<UpsertProductProfileRequest>(EMPTY);

  // Hydrate from the server copy when it arrives, and again whenever it changes underneath
  // us (a save, a delete, another tab). Done as a render-phase adjustment rather than in an
  // effect — React supports this for "derive state from props" and it avoids the extra
  // render pass an effect would cause.
  //
  // Keyed on profile identity, not object reference, so ordinary re-renders never discard
  // what the user is part-way through typing.
  const identity = profile
    ? `${profile.productProfileId}:${profile.updatedAtUtc}`
    : "none";
  const [hydratedFrom, setHydratedFrom] = useState(identity);

  if (identity !== hydratedFrom) {
    setHydratedFrom(identity);
    setForm(
      profile
        ? {
            sensoryNote: profile.sensoryNote,
            occasionNote: profile.occasionNote,
            sweetness: profile.sweetness,
            intensity: profile.intensity,
            richness: profile.richness,
            acidity: profile.acidity,
            caffeineLevel: profile.caffeineLevel,
            isServedHot: profile.isServedHot,
          }
        : EMPTY,
    );
  }

  const set = <K extends keyof UpsertProductProfileRequest>(
    key: K,
    value: UpsertProductProfileRequest[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    try {
      await upsertProfile({
        productId,
        data: {
          ...form,
          // Blank strings become null so "never written" and "cleared" stay the same thing.
          sensoryNote: form.sensoryNote?.trim() || null,
          occasionNote: form.occasionNote?.trim() || null,
        },
      }).unwrap();
      toast.success("Recommendation profile saved");
    } catch (error) {
      console.error("Failed to save recommendation profile:", error);
      toast.error((error as ApiError)?.data?.message || "Failed to save recommendation profile.");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProfile(productId).unwrap();
      setForm(EMPTY);
      toast.success("Recommendation profile removed");
    } catch (error) {
      console.error("Failed to delete recommendation profile:", error);
      toast.error((error as ApiError)?.data?.message || "Failed to remove recommendation profile.");
    }
  };

  const servedValue =
    form.isServedHot === null ? "both" : form.isServedHot ? "hot" : "cold";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Recommendation Profile
            </CardTitle>
            <CardDescription>
              Reasoning input for the AI recommendation feature. Not shown to customers —
              they see the product description above.
            </CardDescription>
          </div>
          {!isLoading && (
            <Badge variant={profile ? "success" : "secondary"}>
              {profile ? "Profiled" : "No profile"}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <p className="rounded-md border border-input bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
          Every field is optional. Leave anything you are unsure about blank — the model omits
          missing fields entirely. Do not invent flavour detail to fill a box; an invented note
          is worse than no note, because it cannot be told apart from a real one later.
        </p>

        <div className="space-y-2">
          <Label htmlFor="occasionNote">Occasion note</Label>
          <Textarea
            id="occasionNote"
            value={form.occasionNote ?? ""}
            onChange={(e) => set("occasionNote", e.target.value)}
            disabled={disabled}
            maxLength={MAX_NOTE_LENGTH}
            placeholder="When and why people order it. E.g. 'Ordered before long work sessions and study blocks. Not a leisurely drink.'"
            className="min-h-[90px]"
          />
          <p className="text-xs text-muted-foreground">
            The highest-value field — it is what lets the model match a product to someone&rsquo;s
            situation. {form.occasionNote?.length ?? 0}/{MAX_NOTE_LENGTH}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sensoryNote">Sensory note</Label>
          <Textarea
            id="sensoryNote"
            value={form.sensoryNote ?? ""}
            onChange={(e) => set("sensoryNote", e.target.value)}
            disabled={disabled}
            maxLength={MAX_NOTE_LENGTH}
            placeholder="What it tastes and feels like. E.g. 'Concentrated and syrupy with a heavy chocolate finish. Two or three sips.'"
            className="min-h-[90px]"
          />
          <p className="text-xs text-muted-foreground">
            {form.sensoryNote?.length ?? 0}/{MAX_NOTE_LENGTH}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <ScaleInput
            label="Sweetness"
            value={form.sweetness}
            onChange={(v) => set("sweetness", v)}
            disabled={disabled}
            hint="1 dry · 5 sweet"
          />
          <ScaleInput
            label="Intensity"
            value={form.intensity}
            onChange={(v) => set("intensity", v)}
            disabled={disabled}
            hint="1 mild · 5 intense"
          />
          <ScaleInput
            label="Richness"
            value={form.richness}
            onChange={(v) => set("richness", v)}
            disabled={disabled}
            hint="1 light · 5 rich"
          />
          <ScaleInput
            label="Acidity"
            value={form.acidity}
            onChange={(v) => set("acidity", v)}
            disabled={disabled}
            hint="1 low · 5 bright"
          />
          <ScaleInput
            label="Caffeine level"
            value={form.caffeineLevel}
            onChange={(v) => set("caffeineLevel", v)}
            disabled={disabled}
            min={0}
            hint="0 none · 5 very high"
          />

          <div className="space-y-2">
            <Label htmlFor="servedTemperature">Served</Label>
            <Select
              value={servedValue}
              disabled={disabled}
              onValueChange={(v) =>
                set("isServedHot", v === "both" ? null : v === "hot")
              }
            >
              <SelectTrigger id="servedTemperature">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hot">Hot</SelectItem>
                <SelectItem value="cold">Cold</SelectItem>
                <SelectItem value="both">Both / not applicable</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose &ldquo;Both&rdquo; for anything served either way.
            </p>
          </div>
        </div>

        {/*
          This card saves on its own rather than with the product form. The two write to
          different endpoints, and a failed image upload must not lose a written profile.
        */}
        <div className="flex items-center justify-between gap-4 border-t pt-4">
          <div>
            {profile && !disabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? "Removing..." : "Remove profile"}
              </Button>
            )}
          </div>
          <Button type="button" onClick={handleSave} disabled={disabled || isSaving}>
            {isSaving ? "Saving..." : "Save profile"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
