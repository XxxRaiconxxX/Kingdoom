import {
  setCorsHeaders,
  type ApiRequest,
  type ApiResponse,
} from "../../_serverAiProviders.js";

import draftHandler from "./_draft.js";
import reviseHandler from "./_revise.js";
import confirmHandler from "./_confirm.js";

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
    return draftHandler(req, res);
  } else if (action === "revise") {
    return reviseHandler(req, res);
  } else if (action === "confirm") {
    return confirmHandler(req, res);
  } else {
    return res.status(400).json({ message: "Accion no valida. Debes especificar action: draft, revise o confirm." });
  }
}
