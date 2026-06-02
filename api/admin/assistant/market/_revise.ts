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
  reviseAssistantMarketDraft,
  type AssistantMarketDraft,
} from "../../_marketAssistant.js";
import { requireAssistantSecret, verifyAssistantActor } from "../../_assistantSecurity.js";
import type { VisualReference } from "../../_visualReference.js";

type ReviseRequestBody = {
  draftId?: string;
  revisionInstruction?: string;
  requestedBy?: string;
  requestedByPhone?: string;
  requestedByRole?: "admin" | "staff";
  originalMessage?: string;
};

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
    const body = (req.body ?? {}) as ReviseRequestBody;
    const requestedByRole = body.requestedByRole === "staff" ? "staff" : "admin";
    const actor = await verifyAssistantActor({
      supabase,
      requestedByPhone: body.requestedByPhone || "",
      requestedByRole,
    });

    const draftId = String(body.draftId || "").trim();
    const revisionInstruction = String(body.revisionInstruction || "").trim();

    if (!draftId || !revisionInstruction) {
      return res.status(400).json({
        message: "Debes indicar draftId e instruccion de ajuste.",
      });
    }

    const { data: actionRow, error: actionError } = await supabase
      .from("assistant_admin_actions")
      .select("*")
      .eq("id", draftId)
      .eq("action_type", "market_item")
      .maybeSingle();

    if (actionError) {
      throw new Error(`No se pudo leer el borrador pendiente. ${actionError.message}`);
    }

    if (!actionRow) {
      return res.status(404).json({ message: "No existe ese borrador pendiente." });
    }

    if (String(actionRow.admin_phone || "") !== actor.phone) {
      return res.status(403).json({
        message: "Ese borrador no pertenece a este actor administrativo.",
      });
    }

    if (actionRow.status === "confirmed") {
      return res.status(409).json({
        message: "Ese borrador ya fue confirmado y no puede ajustarse.",
      });
    }

    if (actionRow.status === "cancelled") {
      return res.status(409).json({
        message: "Ese borrador ya fue cancelado.",
      });
    }

    const normalizedInstruction = revisionInstruction.toLowerCase().trim();
    if (["cancelar", "cancel", "descartar"].includes(normalizedInstruction)) {
      const { error: cancelError } = await supabase
        .from("assistant_admin_actions")
        .update({
          status: "cancelled",
          confirmation_message: body.originalMessage || revisionInstruction,
          result_message: "Borrador cancelado por el staff.",
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", draftId);

      if (cancelError) {
        throw new Error(`No se pudo cancelar el borrador. ${cancelError.message}`);
      }

      return res.status(200).json({
        draftId,
        status: "cancelled",
        draft: actionRow.proposed_payload ?? null,
        replyText: "🗑️ Borrador cancelado. Cuando quieras, forjamos otro item nuevo.",
      });
    }

    const currentDraft = actionRow.proposed_payload as AssistantMarketDraft;
    const reference = actionRow.reference_payload as VisualReference;
    const marketContext = await fetchMarketBalanceContext(supabase);
    const aiResult = await reviseAssistantMarketDraft({
      reference,
      currentDraft,
      revisionInstruction,
      marketContext,
    });

    const { error: updateError } = await supabase
      .from("assistant_admin_actions")
      .update({
        status: "revised",
        proposed_payload: aiResult.draft,
        model_used: extractModelUsed(aiResult.debug),
        result_message: "Borrador ajustado por instruccion conversacional.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", draftId);

    if (updateError) {
      throw new Error(`No se pudo guardar el ajuste del borrador. ${updateError.message}`);
    }

    const replyText = formatDraftReply({
      draftId,
      status: "revised",
      draft: aiResult.draft,
    });

    return res.status(200).json({
      draftId,
      status: "revised",
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
          : "No se pudo ajustar el borrador del item.",
    });
  }
}
