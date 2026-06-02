import {
  setCorsHeaders,
  type ApiRequest,
  type ApiResponse,
} from "../../_serverAiProviders.js";
import { createSupabaseAdminClient } from "../../_supabaseAdmin.js";
import { requireAssistantSecret, verifyAssistantActor } from "../../_assistantSecurity.js";
import type { AssistantMarketDraft } from "../../_marketAssistant.js";
import {
  slugifyMarketItem,
  buildMarketItemPayload,
} from "../../../../src/features/market/market.adapter";

type ConfirmRequestBody = {
  draftId?: string;
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
    const body = (req.body ?? {}) as ConfirmRequestBody;
    const requestedByRole = body.requestedByRole === "staff" ? "staff" : "admin";
    const actor = await verifyAssistantActor({
      supabase,
      requestedByPhone: body.requestedByPhone || "",
      requestedByRole,
    });

    const draftId = String(body.draftId || "").trim();
    if (!draftId) {
      return res.status(400).json({ message: "Falta draftId para confirmar." });
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
        message: "Ese borrador ya fue confirmado y no puede publicarse otra vez.",
      });
    }

    if (actionRow.status === "cancelled") {
      return res.status(409).json({
        message: "Ese borrador fue cancelado y no puede publicarse.",
      });
    }

    const draft = actionRow.proposed_payload as AssistantMarketDraft;
    const itemId = `${slugifyMarketItem(draft.name, draft.category)}-${Date.now().toString(36)}`;
    const payload = buildMarketItemPayload({
      id: itemId,
      name: draft.name,
      description: draft.description,
      ability: draft.ability,
      price: draft.price,
      rarity: draft.rarity,
      imageUrl: draft.imageUrl,
      imageFit: draft.imageFit,
      imagePosition: draft.imagePosition,
      category: draft.category,
      stockStatus: draft.stockStatus,
      stockLimit: draft.stockLimit,
      stockSold: draft.stockSold,
      featured: draft.featured,
    });

    let insertResult = await supabase
      .from("market_items")
      .upsert(payload, { onConflict: "id" });

    let insertError = insertResult.error;

    if (insertError?.message?.toLowerCase().includes("stock_")) {
      const { stock_limit: _stockLimit, stock_sold: _stockSold, ...legacyPayload } = payload;
      insertResult = await supabase
        .from("market_items")
        .upsert(legacyPayload, { onConflict: "id" });
      insertError = insertResult.error;
    }

    if (insertError) {
      await supabase
        .from("assistant_admin_actions")
        .update({
          status: "failed",
          result_message: `Fallo al publicar en market_items: ${insertError.message}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", draftId);

      throw new Error(`No se pudo publicar el item. ${insertError.message}`);
    }

    const { error: updateError } = await supabase
      .from("assistant_admin_actions")
      .update({
        status: "confirmed",
        confirmation_message: body.originalMessage || "confirmar",
        result_message: `Item publicado en market_items con id ${itemId}.`,
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", draftId);

    if (updateError) {
      throw new Error(
        `El item se guardo, pero no pude cerrar la auditoria del borrador. ${updateError.message}`
      );
    }

    return res.status(200).json({
      draftId,
      status: "confirmed",
      draft,
      itemId,
      replyText: [
        "✅ *Item publicado en el mercado*",
        `ID del borrador: \`${draftId}\``,
        `ID del item: \`${itemId}\``,
        `Nombre: *${draft.name}*`,
        `Precio final: ${draft.price.toLocaleString("es-PY")} oro`,
        `Categoria: ${draft.category}`,
        `Rareza: ${draft.rarity.toUpperCase()}`,
      ].join("\n"),
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
          : "No se pudo confirmar el item del mercado.",
    });
  }
}
