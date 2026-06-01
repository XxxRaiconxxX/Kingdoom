import {
  setCorsHeaders,
  type ApiRequest,
  type ApiResponse,
} from "../../_serverAiProviders.js";
import { createSupabaseAdminClient } from "../../_supabaseAdmin.js";
import {
  extractModelUsed,
  fetchMarketBalanceContext,
  formatDraftReply,
  generateAssistantMarketDraft,
} from "../../_marketAssistant.js";
import { requireAssistantSecret, verifyAssistantActor } from "../../_assistantSecurity.js";
import { resolveRemoteVisualReference } from "../../_visualReference.js";

type DraftRequestBody = {
  ideaPrompt?: string;
  reference?: {
    url?: string;
    imageDataUrl?: string;
  };
  requestedBy?: string;
  requestedByPhone?: string;
  requestedByRole?: "admin" | "staff";
  originalMessage?: string;
  chatId?: string;
};

function buildInlineReference(imageDataUrl: string) {
  const trimmed = imageDataUrl.trim();
  if (!trimmed.startsWith("data:image/")) {
    throw new Error("La imagen adjunta no tiene un formato visual compatible.");
  }

  if (trimmed.length > 900_000) {
    throw new Error(
      "La imagen adjunta es demasiado grande para el MVP. Usa una referencia por URL o una imagen mas liviana."
    );
  }

  return {
    imageUrl: trimmed,
    title: "Referencia subida por WhatsApp",
    description: "",
    sourceUrl: "whatsapp-inline-image",
  };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Metodo no permitido." });
  }

  try {
    requireAssistantSecret(req);
    const supabase = createSupabaseAdminClient();
    const body = (req.body ?? {}) as DraftRequestBody;
    const requestedByRole = body.requestedByRole === "staff" ? "staff" : "admin";
    const actor = await verifyAssistantActor({
      supabase,
      requestedByPhone: body.requestedByPhone || "",
      requestedByRole,
    });

    const ideaPrompt = String(body.ideaPrompt || "").trim();
    if (!ideaPrompt) {
      return res.status(400).json({
        message: "Describe la idea del item antes de forjarlo.",
      });
    }

    const reference = body.reference?.imageDataUrl?.trim()
      ? buildInlineReference(body.reference.imageDataUrl)
      : await resolveRemoteVisualReference(String(body.reference?.url || ""));

    await supabase
      .from("assistant_admin_actions")
      .update({
        status: "cancelled",
        result_message: "Reemplazado por un borrador mas reciente.",
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("action_type", "market_item")
      .eq("admin_phone", actor.phone)
      .in("status", ["draft", "revised"]);

    const marketContext = await fetchMarketBalanceContext(supabase);
    const aiResult = await generateAssistantMarketDraft({
      reference,
      ideaPrompt,
      marketContext,
    });

    const { data, error } = await supabase
      .from("assistant_admin_actions")
      .insert({
        admin_phone: actor.phone,
        actor_role: actor.role,
        action_type: "market_item",
        status: "draft",
        original_message: String(body.originalMessage || ideaPrompt),
        proposed_payload: aiResult.draft,
        reference_payload: reference,
        model_used: extractModelUsed(aiResult.debug),
        result_message: "Borrador inicial generado por IA.",
        chat_id: String(body.chatId || ""),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      throw new Error(
        `No se pudo registrar el borrador administrativo. ${error?.message || "Sin ID devuelto."}`
      );
    }

    const replyText = formatDraftReply({
      draftId: data.id,
      status: "draft",
      draft: aiResult.draft,
    });

    return res.status(200).json({
      draftId: data.id,
      status: "draft",
      draft: aiResult.draft,
      replyText,
    });
  } catch (error) {
    const statusCode =
      error && typeof error === "object" && "statusCode" in error
        ? Number((error as { statusCode?: number }).statusCode) || 500
        : 500;

    return res.status(statusCode).json({
      message:
        error && typeof error === "object" && "message" in error && typeof error.message === "string"
          ? error.message
          : "No se pudo generar el borrador del item.",
    });
  }
}
