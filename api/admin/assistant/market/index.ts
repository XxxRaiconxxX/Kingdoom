import {
  setCorsHeaders,
  type ApiRequest,
  type ApiResponse,
} from "../../_serverAiProviders.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Metodo no permitido." });
  }

  const body = req.body as any;
  const action = body?.action;

  if (action === "draft") {
    const { default: draftHandler } = await import("./_draft.js");
    return draftHandler(req, res);
  } else if (action === "revise") {
    const { default: reviseHandler } = await import("./_revise.js");
    return reviseHandler(req, res);
  } else if (action === "confirm") {
    const { default: confirmHandler } = await import("./_confirm.js");
    return confirmHandler(req, res);
  } else {
    return res.status(400).json({ message: "Accion no valida. Debes especificar action: draft, revise o confirm." });
  }
}
