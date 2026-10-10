"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { XIcon } from "lucide-react";
import { createDayEntry, requestUploadUrls, addPhotos } from "@/actions/day-entries";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { Circle } from "@/generated/prisma/client";

const MAX_PHOTOS = 10;

interface SelectedPhoto {
  file: File;
  previewUrl: string;
}

export function AddEntryForm({ dateIso }: { dateIso: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const photosRef = useRef(photos);
  photosRef.current = photos;

  function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    photosRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));

    if (files.length > MAX_PHOTOS) toast.error(`Max ${MAX_PHOTOS} photos per upload`);

    const next = files.slice(0, MAX_PHOTOS).map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setPhotos(next);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const note = String(formData.get("note") ?? "").trim();
    const circles = formData.getAll("circles") as Circle[];

    if (circles.length === 0) {
      toast.error("Pick at least one circle");
      return;
    }

    setIsSubmitting(true);
    try {
      const entry = await createDayEntry({ date: dateIso, note: note || null, circles });

      if (photos.length > 0) {
        const uploads = await requestUploadUrls(
          entry.id,
          photos.map((p) => ({ contentType: p.file.type }))
        );
        await Promise.all(
          uploads.map((upload, i) =>
            fetch(upload.uploadUrl, {
              method: "PUT",
              headers: { "Content-Type": photos[i].file.type },
              body: photos[i].file,
            })
          )
        );
        await addPhotos(
          entry.id,
          uploads.map((u, i) => ({ key: u.key, order: i }))
        );
      }

      toast.success("Added to this day");
      router.refresh();
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setFormKey((key) => key + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form key={formKey} onSubmit={handleSubmit} className="flex flex-col gap-4 border-t pt-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="note">Add to this day</Label>
        <Textarea id="note" name="note" placeholder="Add a note (optional)" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="photos">Photos</Label>
        <input
          id="photos"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFilesSelected}
          className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-2.5 file:py-1 file:text-sm file:font-medium"
        />
        {photos.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {photos.map((photo, i) => (
              <div key={photo.previewUrl} className="relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.previewUrl}
                  alt=""
                  className="size-full rounded-lg object-cover ring-1 ring-foreground/10"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-background"
                  aria-label="Remove photo"
                >
                  <XIcon className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Circles</Label>
        <div className="flex items-center gap-2">
          <Checkbox id="entry-circle-family" name="circles" value="FAMILY" defaultChecked />
          <Label htmlFor="entry-circle-family" className="font-normal">
            Family
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="entry-circle-friends" name="circles" value="FRIENDS" defaultChecked />
          <Label htmlFor="entry-circle-friends" className="font-normal">
            Friends
          </Label>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting ? "Posting…" : "Post"}
      </Button>
    </form>
  );
}
