import { createFileRoute } from "@tanstack/react-router";
import { Camera, Check, Shirt, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { createDecartClient, models, type RealTimeClient } from "@decartai/sdk";
import { useCatalog } from "@/lib/catalog";
import { responsiveMediaSrc } from "@/lib/media";

export const Route = createFileRoute("/fitting-room")({
  validateSearch: z.object({ product: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "AI Fitting Room — MOLD" },
      { name: "description", content: "Try MOLD pieces in the AI fitting room." },
    ],
  }),
  component: FittingRoomPage,
});

function FittingRoomPage() {
  const { product: productSlug } = Route.useSearch();
  const products = useCatalog();
  const selectedProduct = products.find((product) => product.slug === productSlug);
  const input = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLVideoElement>(null);
  const resultVideo = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const fittingClient = useRef<RealTimeClient | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [fitting, setFitting] = useState(false);
  const [aiConnected, setAiConnected] = useState(false);
  const [status, setStatus] = useState("Choose a MOLD product to begin.");
  const [error, setError] = useState("");

  useEffect(() => () => {
    try { fittingClient.current?.disconnect(); } catch { /* Session may already be closed. */ }
    stream.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  async function startCamera() {
    setError("");
    try {
      if (!file && !selectedProduct) throw new Error("Choose a product from the shop before starting your fitting.");
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera access requires a secure HTTPS page.");
      setFitting(true);
      setStatus("Starting camera…");
      const model = models.realtime("lucy-vton-3.6");
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: { frameRate: model.fps, width: model.width, height: model.height },
        audio: false,
      });
      if (camera.current) camera.current.srcObject = stream.current;
      setCameraOn(true);
      if (camera.current) await camera.current.play();

      setStatus("Connecting to MOLD AI…");
      const tokenResponse = await fetch("/api/fitting-room-token", { method: "POST" });
      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) throw new Error(tokenData.error || "Could not connect to the AI fitting service.");

      const client = createDecartClient({ apiKey: tokenData.apiKey });
      const realtime = await client.realtime.connect(stream.current, {
        model,
        mirror: "auto",
        onRemoteStream: (remoteStream) => {
          if (!resultVideo.current) return;
          resultVideo.current.srcObject = remoteStream;
          void resultVideo.current.play();
          setAiConnected(true);
          setStatus("LIVE AI FITTING");
        },
      });
      fittingClient.current = realtime;
      let garment: Blob | File | undefined = file ?? undefined;
      if (!garment && selectedProduct?.images[0]) {
        const imageUrl = responsiveMediaSrc(selectedProduct.images[0]);
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) throw new Error("Could not load this product image for fitting.");
        const imageBlob = await imageResponse.blob();
        if (!imageBlob.type.startsWith("image/") || imageBlob.size === 0) {
          throw new Error("This product image could not be read. Choose another garment image.");
        }
        garment = imageBlob;
      }
      if (!garment) throw new Error("This product has no garment image available for fitting.");
      await realtime.set({
        prompt: "Replace the current top with the garment in the reference image, accurately matching its design, color, texture and fit.",
        image: garment,
      });
      setStatus("AI fitting is live. Move naturally in front of your camera.");
    } catch (cause) {
      stopCamera();
      setStatus("Fitting could not start.");
      setError(cause instanceof Error ? cause.message : "Could not start the AI fitting.");
    } finally {
      setFitting(false);
    }
  }

  function stopCamera() {
    try { fittingClient.current?.disconnect(); } catch { /* Session may already be closed. */ }
    fittingClient.current = null;
    setAiConnected(false);
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (camera.current) camera.current.srcObject = null;
    if (resultVideo.current) resultVideo.current.srcObject = null;
    setCameraOn(false);
    setStatus("Fitting session ended.");
    setError("");
  }

  function selectFile(selected: File | undefined) {
    if (!selected) return;
    if (!selected.type.startsWith("image/")) { setError("Choose a PNG, JPG, or WEBP image."); return; }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setError("Product image selected. Connect the Decart API to enable AI try-on.");
  }

  return (
    <div className="bg-paper text-ink">
      <section className="mx-auto max-w-[1500px] px-4 pb-10 pt-14 sm:px-6 sm:pt-20">
        <p className="label-mono text-muted-ink">MOLD LABS / EXPERIMENT 001</p>
        <h1 className="display mt-5 text-[clamp(4rem,12vw,10rem)] leading-[0.86]">YOUR FIT.<br/><span className="text-muted-ink">LIVE.</span></h1>
        <p className="mt-6 max-w-lg text-sm leading-relaxed text-muted-ink">Step into MOLD. Set up your camera and choose a garment to prepare your fitting room.</p>
      </section>

      <section className="mx-auto grid max-w-[1500px] gap-4 px-4 pb-16 sm:px-6 lg:grid-cols-[300px_1fr]">
        <aside className="border border-line bg-secondary/50 p-5">
          <p className="label-mono mb-4 text-muted-ink">01 / SELECT A PIECE</p>
          {selectedProduct && <div className="mb-4 flex items-center gap-3 border border-line bg-paper p-3">
            <img src={responsiveMediaSrc(selectedProduct.images[0]!)} alt={selectedProduct.name} className="h-16 w-14 object-cover"/>
            <div><p className="label-mono text-[10px] text-muted-ink">SELECTED PRODUCT</p><p className="mt-1 text-xs font-semibold">{selectedProduct.name}</p></div>
          </div>}
          <button onClick={() => input.current?.click()} className="flex w-full flex-col items-center gap-3 border border-dashed border-muted-ink/50 bg-paper px-5 py-10 text-center transition-colors hover:border-ink">
            {file && preview ? <img src={preview} alt="Selected garment" className="h-32 object-contain"/> : <Upload className="h-6 w-6"/>}
            <span className="text-xs font-semibold uppercase tracking-widest">{file ? file.name : "Upload product image"}</span>
            <span className="label-mono text-[10px] text-muted-ink">PNG / JPG / WEBP</span>
          </button>
          <input ref={input} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => selectFile(event.target.files?.[0])}/>
          {file && <p className="label-mono mt-4 flex items-center gap-2 text-xs"><Check className="h-4 w-4"/> Garment ready</p>}
          <div className="mt-5 flex gap-3 text-xs leading-relaxed text-muted-ink"><Shirt className="mt-0.5 h-4 w-4 shrink-0"/>Use a clean, well-lit image with the garment clearly visible.</div>
        </aside>

        <section className="border border-line bg-secondary/50 p-4 sm:p-5">
          <div className="label-mono flex justify-between text-muted-ink"><span>02 / LIVE MIRROR</span><span>{cameraOn ? "CAMERA READY" : "STANDBY"}</span></div>
          <div className="relative mt-4 grid aspect-[16/10] place-items-center overflow-hidden bg-ink text-paper">
            <video ref={camera} autoPlay muted playsInline className={cameraOn && !aiConnected ? "h-full w-full object-cover" : "hidden"}/>
            <video ref={resultVideo} autoPlay muted playsInline className={aiConnected ? "h-full w-full object-contain" : "hidden"}/>
            {!cameraOn && <div className="text-center"><Camera className="mx-auto mb-4 h-10 w-10 text-paper/60"/><h2 className="display text-2xl">THE MIRROR IS WAITING</h2><p className="mt-2 text-xs text-paper/60">Choose a product, then start your AI fitting.</p></div>}
            <span className="label-mono absolute bottom-3 right-4 text-[10px] text-paper/70">MOLD / FIT CHECK</span>
          </div>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="label-mono text-xs">{error || status}</p>
            {cameraOn || fitting ? (
              <button onClick={stopCamera} className="label-mono flex shrink-0 items-center justify-center gap-2 bg-ink px-5 py-4 text-paper transition-colors hover:bg-accent hover:text-ink">END FITTING</button>
            ) : (
              <button onClick={startCamera} disabled={fitting} className="label-mono flex shrink-0 items-center justify-center gap-2 bg-ink px-5 py-4 text-paper transition-colors hover:bg-accent hover:text-ink disabled:opacity-50"><Camera className="h-4 w-4"/> START AI FITTING</button>
            )}
          </div>
        </section>
      </section>
    </div>
  );
}
