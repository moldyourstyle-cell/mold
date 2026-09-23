import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadMedia } from "@/lib/upload";

/** Image/video field with a pick-from-computer upload plus a URL fallback. */
export function ImageUploadField({
  label,
  value,
  onChange,
  folder = "content",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  folder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      onChange(await uploadMedia(file, folder));
    } catch (uploadFailure) {
      setError(uploadFailure instanceof Error ? uploadFailure.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="block">
      <span className="label-mono text-muted-ink">{label}</span>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Upload a photo or video, or paste a link"
          className="rounded-none"
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="shrink-0 rounded-none"
        >
          <ImagePlus /> {uploading ? "Uploading…" : "Upload"}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/mp4,video/webm,video/quicktime,.heic,.heif,.mp4,.webm,.mov"
        className="hidden"
        onChange={(event) => void handleFiles(event.target.files)}
      />
      <p className="label-mono mt-2 text-muted-ink">Photos up to 10 MB · videos up to 50 MB</p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
