import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ScannedPlan } from "./floors";

const num = { type: "number" } as const;
const opening = { type: "object", additionalProperties: false, required: ["x", "y", "width"], properties: { x: num, y: num, width: num } } as const;
const SCHEMA = {
  type: "object", additionalProperties: false, required: ["walls", "doors", "windows"],
  properties: {
    walls: { type: "array", items: { type: "object", additionalProperties: false, required: ["x1", "y1", "x2", "y2", "thickness"], properties: { x1: num, y1: num, x2: num, y2: num, thickness: num } } },
    doors: { type: "array", items: opening },
    windows: { type: "array", items: opening },
  },
};

const PROMPT = `You read architectural floor plan images. Extract the wall centre-lines, doors and windows.
All coordinates and sizes are in METRES, x to the right and y downward, origin at the top-left of the building.
Use printed dimension labels to calibrate scale when present; otherwise assume a typical residential scale (interior doors ~0.9 m wide).
Snap nearly-horizontal/vertical walls to exact axis alignment and make connected walls share identical endpoints.
Wall thickness is in metres (typically 0.15–0.3). Door and window x/y are their centre points on a wall.
Ignore furniture, text, hatching and dimension lines. If the image is not a floor plan, return empty arrays.`;

export const scanBlueprint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { image: string }) => {
    if (typeof input?.image !== "string" || !/^data:image\/(png|jpe?g|webp);base64,/.test(input.image)) throw new Error("Only a house blueprint image works here — upload a PNG, JPG or WebP of a floor plan.");
    if (input.image.length > 5_500_000) throw new Error("Please use a blueprint image under 4 MB.");
    return input;
  })
  .handler(async ({ data }): Promise<{ plan: ScannedPlan | null; error: string | null }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { plan: null, error: "Blueprint reading is not configured." };
    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText, Output, jsonSchema } = await import("ai");
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1", apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });
    try {
      const result = streamText({
        model: provider.responses("openai/gpt-6-astra"),
        instructions: PROMPT,
        messages: [{ role: "user", content: [{ type: "text", text: "Extract this floor plan." }, { type: "image", image: new URL(data.image) }] }],
        output: Output.object({ schema: jsonSchema<ScannedPlan>(SCHEMA as never) }),
        providerOptions: { openai: { store: false, forceReasoning: true, reasoningEffort: "medium", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] } },
      } as never);
      const plan = (await (result as unknown as { output: Promise<ScannedPlan> }).output);
      if (!plan || !Array.isArray(plan.walls) || plan.walls.length === 0) return { plan: null, error: "This doesn't look like a house blueprint — please upload a clear floor plan image." };
      return { plan, error: null };
    } catch (e) {
      console.error("scanBlueprint", e);
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 429) return { plan: null, error: "Too many requests right now. Please try again in a minute." };
      if (status === 402) return { plan: null, error: "AI credits have run out. Add credits in Settings → Plans & credits." };
      return { plan: null, error: "Could not read this blueprint. Try a clearer, straight-on image." };
    }
  });
