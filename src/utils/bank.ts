import { supabase } from "./supabaseClient";
import type {
  BankCreateLoanResult,
  BankDepositResult,
  BankInstallment,
  BankInstallmentStatus,
  BankLoan,
  BankLoanStatus,
  BankPayLoanEarlyResult,
  BankPayLoanResult,
  BankSnapshot,
  BankTransaction,
  BankTransactionType,
  BankWithdrawResult,
} from "../types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const LOAN_STATUSES = new Set<BankLoanStatus>([
  "active",
  "in_mora",
  "paid",
  "cancelled",
]);
const INSTALLMENT_STATUSES = new Set<BankInstallmentStatus>([
  "scheduled",
  "paid",
  "in_mora",
  "cancelled",
]);
const TRANSACTION_TYPES = new Set<BankTransactionType>([
  "deposit",
  "withdrawal",
  "interest_credit",
  "loan_disbursement",
  "loan_payment",
  "loan_early_payment",
]);

type RecordValue = Record<string, unknown>;
type RpcArgs = Record<string, string | number>;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown, label: string): RecordValue {
  if (!isRecord(value)) {
    throw new Error(`La respuesta del Banco no contiene ${label} valido.`);
  }

  return value;
}

function asArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`La respuesta del Banco no contiene una lista de ${label} valida.`);
  }

  return value;
}

function asString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`La respuesta del Banco contiene ${label} invalido.`);
  }

  return value;
}

function asNullableString(value: unknown, label: string): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return asString(value, label);
}

function asInteger(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`La respuesta del Banco contiene ${label} invalido.`);
  }

  return value;
}

function asNullableInteger(value: unknown, label: string): number | null {
  if (value === null || value === undefined) return null;
  return asInteger(value, label);
}

function asNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`La respuesta del Banco contiene ${label} invalido.`);
  }

  return value;
}

function asBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`La respuesta del Banco contiene ${label} invalido.`);
  }

  return value;
}

function asUuid(value: unknown, label: string): string {
  const parsed = asString(value, label);
  if (!UUID_PATTERN.test(parsed)) {
    throw new Error(`La respuesta del Banco contiene ${label} invalido.`);
  }

  return parsed;
}

function asDateString(value: unknown, label: string): string {
  const parsed = asString(value, label);
  if (Number.isNaN(Date.parse(parsed))) {
    throw new Error(`La respuesta del Banco contiene ${label} invalido.`);
  }

  return parsed;
}

function asStatus<T extends string>(
  value: unknown,
  allowed: ReadonlySet<T>,
  label: string,
): T {
  const parsed = asString(value, label) as T;
  if (!allowed.has(parsed)) {
    throw new Error(`La respuesta del Banco contiene ${label} invalido.`);
  }

  return parsed;
}

function asRpcRow(value: unknown): RecordValue {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      throw new Error("El Banco no devolvio el resultado de la operacion.");
    }
    return asRecord(value[0], "resultado de operacion");
  }

  return asRecord(value, "resultado de operacion");
}

function getErrorMessage(error: unknown): string {
  if (isRecord(error) && typeof error.message === "string" && error.message.trim()) {
    return error.message.trim();
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return "El Banco no pudo completar la operacion.";
}

async function callBankRpc(functionName: string, args: RpcArgs): Promise<unknown> {
  const { data, error } = await supabase.rpc(functionName, args);
  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return data;
}

function assertPlayerId(playerId: string): string {
  const normalized = playerId.trim();
  if (!UUID_PATTERN.test(normalized)) {
    throw new Error("No se pudo validar el identificador del jugador.");
  }

  return normalized;
}

function assertPositiveInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} debe ser un numero entero positivo.`);
  }

  return value;
}

function assertIdempotencyKey(value: string): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > 200) {
    throw new Error("La clave de seguridad de la operacion no es valida.");
  }
  return normalized;
}

function parseLoan(value: unknown): BankLoan {
  const row = asRecord(value, "prestamo");
  return {
    id: asUuid(row.id, "el id del prestamo"),
    playerId: asUuid(row.player_id, "el jugador del prestamo"),
    principalGold: asInteger(row.principal_gold, "el principal del prestamo"),
    aprBps: asInteger(row.apr_bps, "el APR del prestamo"),
    termMonths: asNullableInteger(row.term_months, "el plazo mensual del prestamo"),
    termWeeks: asNullableInteger(row.term_weeks, "el plazo semanal del prestamo"),
    cadenceDays: asInteger(row.cadence_days ?? 30, "la cadencia del prestamo"),
    totalDueGold: asInteger(row.total_due_gold, "el total del prestamo"),
    outstandingDueGold: asInteger(row.outstanding_due_gold, "el saldo del prestamo"),
    paidInstallments: asInteger(row.paid_installments, "las cuotas pagadas"),
    status: asStatus(row.status, LOAN_STATUSES, "el estado del prestamo"),
    createdAt: asDateString(row.created_at, "la fecha del prestamo"),
    updatedAt: asDateString(row.updated_at, "la actualizacion del prestamo"),
    closedAt: row.closed_at === null ? null : asDateString(row.closed_at, "el cierre del prestamo"),
  };
}

function parseInstallment(value: unknown): BankInstallment {
  const row = asRecord(value, "cuota");
  return {
    id: asUuid(row.id, "el id de la cuota"),
    loanId: asUuid(row.loan_id, "el prestamo de la cuota"),
    installmentNumber: asInteger(row.installment_number, "el numero de cuota"),
    dueAt: asDateString(row.due_at, "el vencimiento de la cuota"),
    principalDueGold: asInteger(row.principal_due_gold, "el principal de la cuota"),
    interestDueGold: asInteger(row.interest_due_gold, "el interes de la cuota"),
    amountDueGold: asInteger(row.amount_due_gold, "el importe de la cuota"),
    status: asStatus(row.status, INSTALLMENT_STATUSES, "el estado de la cuota"),
    paidAt: row.paid_at === null ? null : asDateString(row.paid_at, "el pago de la cuota"),
    attemptCount: asInteger(row.attempt_count, "los intentos de la cuota"),
    createdAt: asDateString(row.created_at, "la fecha de la cuota"),
  };
}

function parseTransaction(value: unknown): BankTransaction {
  const row = asRecord(value, "movimiento");
  return {
    id: asUuid(row.id, "el id del movimiento"),
    playerId: asUuid(row.player_id, "el jugador del movimiento"),
    operationType: asStatus(row.operation_type, TRANSACTION_TYPES, "el tipo de movimiento"),
    amountGold: asInteger(row.amount_gold, "el importe del movimiento"),
    playerGoldAfter: asInteger(row.player_gold_after, "el saldo posterior"),
    referenceType: asNullableString(row.reference_type, "la referencia del movimiento"),
    referenceId: row.reference_id === null ? null : asUuid(row.reference_id, "el id de referencia"),
    idempotencyKey: asString(row.idempotency_key, "la clave de idempotencia"),
    metadata: isRecord(row.metadata) ? row.metadata : {},
    createdAt: asDateString(row.created_at, "la fecha del movimiento"),
  };
}

function parseSnapshot(value: unknown, playerId: string): BankSnapshot {
  const root = asRecord(value, "el resumen");
  const player = asRecord(root.player, "el jugador");
  const account = asRecord(root.account, "la cuenta");
  const credit = asRecord(root.credit, "el credito");
  const parsedPlayerId = asUuid(player.id, "el jugador");

  if (parsedPlayerId !== playerId || asUuid(account.playerId, "el jugador de la cuenta") !== playerId) {
    throw new Error("El Banco devolvio datos de otro jugador.");
  }

  const loans = asArray(root.loans, "prestamos").map(parseLoan);
  const loanIds = new Set(loans.map((loan) => loan.id));
  const installments = asArray(root.installments, "cuotas").map(parseInstallment);
  const transactions = asArray(root.transactions, "movimientos").map(parseTransaction);

  if (
    loans.some((loan) => loan.playerId !== playerId) ||
    installments.some((installment) => !loanIds.has(installment.loanId)) ||
    transactions.some((transaction) => transaction.playerId !== playerId)
  ) {
    throw new Error("El Banco devolvio relaciones que no pertenecen al jugador.");
  }

  return {
    player: {
      id: parsedPlayerId,
      gold: asInteger(player.gold, "el oro disponible"),
    },
    account: {
      playerId,
      depositPrincipalGold: asInteger(account.depositPrincipalGold, "el principal protegido"),
      depositInterestResidue: asNumber(account.depositInterestResidue, "el interes protegido"),
      depositBalanceGold: asInteger(account.depositBalanceGold, "el deposito protegido"),
      depositLastAccruedAt: asDateString(account.depositLastAccruedAt, "la fecha del deposito"),
      creditLimitGold: asInteger(account.creditLimitGold, "el limite de credito"),
      onTimeStreak: asInteger(account.onTimeStreak, "la racha de pagos"),
      creditTier: asInteger(account.creditTier, "el nivel de reputacion"),
      lastDelinquencyAt:
        account.lastDelinquencyAt === null
          ? null
          : asDateString(account.lastDelinquencyAt, "la ultima mora"),
    },
    credit: {
      exposureGold: asInteger(credit.exposureGold, "la exposicion crediticia"),
      availableLimitGold: asInteger(credit.availableLimitGold, "el limite disponible"),
      aprBps: asInteger(credit.aprBps, "el APR disponible"),
    },
    loans,
    installments,
    transactions,
  };
}

function parseSuccess(value: unknown, label: string): boolean {
  const success = asBoolean(value, `el estado de ${label}`);
  if (!success) {
    throw new Error(`El Banco rechazo ${label}.`);
  }

  return success;
}

export async function bankGetSnapshot(playerId: string): Promise<BankSnapshot> {
  const normalizedPlayerId = assertPlayerId(playerId);
  const data = await callBankRpc("bank_get_snapshot", {
    p_player_id: normalizedPlayerId,
  });
  return parseSnapshot(data, normalizedPlayerId);
}

export async function bankDeposit(
  playerId: string,
  amount: number,
  idempotencyKey: string,
): Promise<BankDepositResult> {
  const normalizedPlayerId = assertPlayerId(playerId);
  const normalizedAmount = assertPositiveInteger(amount, "El deposito");
  const normalizedKey = assertIdempotencyKey(idempotencyKey);
  if (normalizedAmount < 300) {
    throw new Error("El deposito minimo es de 300 de oro.");
  }
  const row = asRpcRow(
    await callBankRpc("bank_deposit", {
      p_player_id: normalizedPlayerId,
      p_amount: normalizedAmount,
      p_idempotency_key: normalizedKey,
    }),
  );
  return {
    success: parseSuccess(row.success, "el deposito"),
    transactionId: asUuid(row.transaction_id, "el movimiento del deposito"),
    playerGold: asInteger(row.player_gold, "el oro posterior al deposito"),
    depositPrincipalGold: asInteger(row.deposit_principal_gold, "el principal protegido"),
    depositInterestResidue: asNumber(row.deposit_interest_residue, "el interes protegido"),
    message: asString(row.message, "el mensaje del deposito"),
  };
}

export async function bankWithdrawDeposit(
  playerId: string,
  amount: number,
  idempotencyKey: string,
): Promise<BankWithdrawResult> {
  const normalizedPlayerId = assertPlayerId(playerId);
  const normalizedAmount = assertPositiveInteger(amount, "El retiro");
  const normalizedKey = assertIdempotencyKey(idempotencyKey);
  const row = asRpcRow(
    await callBankRpc("bank_withdraw_deposit", {
      p_player_id: normalizedPlayerId,
      p_amount: normalizedAmount,
      p_idempotency_key: normalizedKey,
    }),
  );
  return {
    success: parseSuccess(row.success, "el retiro"),
    transactionId: asUuid(row.transaction_id, "el movimiento del retiro"),
    playerGold: asInteger(row.player_gold, "el oro posterior al retiro"),
    depositPrincipalGold: asInteger(row.deposit_principal_gold, "el principal protegido"),
    depositInterestResidue: asNumber(row.deposit_interest_residue, "el interes protegido"),
    withdrawnInterestGold: asInteger(row.withdrawn_interest_gold, "el interes retirado"),
    message: asString(row.message, "el mensaje del retiro"),
  };
}

export type BankWeeklyLoanResult = {
  success: true;
  loanId: string;
  principalGold: number;
  termWeeks: number;
  totalDueGold: number;
  weeklyPayment: number;
  cadenceDays: number;
  message: string;
};

export type BankWeeklyEarlyPaymentResult = {
  success: true;
  loanId: string;
  settlementGold: number;
  commissionGold: number;
  newGold: number;
  message: string;
};

export async function bankCreateWeeklyLoan(
  playerId: string,
  amount: number,
  termWeeks: number,
  requestHash: string,
): Promise<BankWeeklyLoanResult> {
  assertPlayerId(playerId);
  const normalizedAmount = assertPositiveInteger(amount, "El prestamo semanal");
  if (![4, 8, 12].includes(termWeeks)) {
    throw new Error("El plazo semanal debe ser de 4, 8 o 12 semanas.");
  }
  const normalizedKey = assertIdempotencyKey(requestHash);
  const row = asRecord(
    await callBankRpc("bank_create_weekly_loan", {
      p_amount: normalizedAmount,
      p_term_weeks: termWeeks,
      p_request_hash: normalizedKey,
    }),
    "resultado del prestamo semanal",
  );
  return {
    success: true,
    loanId: asUuid(row.loanId, "el prestamo semanal creado"),
    principalGold: asInteger(row.principal, "el principal semanal"),
    termWeeks: asInteger(row.termWeeks, "el plazo semanal"),
    totalDueGold: asInteger(row.totalDue, "el total semanal"),
    weeklyPayment: asInteger(row.weeklyPayment, "la cuota semanal"),
    cadenceDays: asInteger(row.cadenceDays, "la cadencia semanal"),
    message: "Prestamo semanal aprobado.",
  };
}

export async function bankPayWeeklyLoanEarly(
  playerId: string,
  loanId: string,
  requestHash: string,
): Promise<BankWeeklyEarlyPaymentResult> {
  assertPlayerId(playerId);
  const normalizedLoanId = asUuid(loanId, "el prestamo semanal");
  const normalizedKey = assertIdempotencyKey(requestHash);
  const row = asRecord(
    await callBankRpc("bank_pay_weekly_loan_early", {
      p_loan_id: normalizedLoanId,
      p_request_hash: normalizedKey,
    }),
    "resultado de la liquidacion semanal",
  );
  return {
    success: true,
    loanId: asUuid(row.loanId, "el prestamo semanal liquidado"),
    settlementGold: asInteger(row.settlement, "la liquidacion semanal"),
    commissionGold: asInteger(row.commission, "la comision semanal"),
    newGold: asInteger(row.newGold, "el oro posterior a la liquidacion"),
    message: "Prestamo semanal liquidado. Solo se cobro la comision minima o el interes proporcional aplicable.",
  };
}

export async function bankCreateLoan(
  playerId: string,
  amount: number,
  termMonths: number,
  idempotencyKey: string,
): Promise<BankCreateLoanResult> {
  const normalizedPlayerId = assertPlayerId(playerId);
  const normalizedAmount = assertPositiveInteger(amount, "El prestamo");
  const normalizedKey = assertIdempotencyKey(idempotencyKey);
  if (normalizedAmount < 250) {
    throw new Error("El prestamo minimo es de 250 de oro.");
  }
  if (![3, 6, 12].includes(termMonths)) {
    throw new Error("El plazo debe ser de 3, 6 o 12 meses.");
  }
  const row = asRpcRow(
    await callBankRpc("bank_create_loan", {
      p_player_id: normalizedPlayerId,
      p_amount: normalizedAmount,
      p_term_months: termMonths,
      p_idempotency_key: normalizedKey,
    }),
  );
  return {
    success: parseSuccess(row.success, "el prestamo"),
    loanId: asUuid(row.loan_id, "el prestamo creado"),
    playerGold: asInteger(row.player_gold, "el oro posterior al prestamo"),
    totalDueGold: asInteger(row.total_due_gold, "el total del prestamo"),
    outstandingDueGold: asInteger(row.outstanding_due_gold, "el saldo del prestamo"),
    creditLimitGold: asInteger(row.credit_limit_gold, "el limite de credito"),
    aprBps: asInteger(row.apr_bps, "el APR del prestamo"),
    message: asString(row.message, "el mensaje del prestamo"),
  };
}

export async function bankPayLoan(
  playerId: string,
  loanId: string,
  installmentCount: number,
  idempotencyKey: string,
): Promise<BankPayLoanResult> {
  const normalizedPlayerId = assertPlayerId(playerId);
  const normalizedLoanId = asUuid(loanId, "el prestamo");
  const normalizedCount = assertPositiveInteger(installmentCount, "La cantidad de cuotas");
  const normalizedKey = assertIdempotencyKey(idempotencyKey);
  const row = asRpcRow(
    await callBankRpc("bank_pay_loan", {
      p_player_id: normalizedPlayerId,
      p_loan_id: normalizedLoanId,
      p_installment_count: normalizedCount,
      p_idempotency_key: normalizedKey,
    }),
  );
  return {
    success: parseSuccess(row.success, "el pago de cuota"),
    loanId: asUuid(row.loan_id, "el prestamo pagado"),
    paidGold: asInteger(row.paid_gold, "el pago de cuota"),
    playerGold: asInteger(row.player_gold, "el oro posterior al pago"),
    outstandingDueGold: asInteger(row.outstanding_due_gold, "el saldo restante"),
    creditLimitGold: asInteger(row.credit_limit_gold, "el limite de credito"),
    onTimeStreak: asInteger(row.on_time_streak, "la racha de pagos"),
    message: asString(row.message, "el mensaje del pago"),
  };
}

export async function bankPayLoanEarly(
  playerId: string,
  loanId: string,
  idempotencyKey: string,
): Promise<BankPayLoanEarlyResult> {
  const normalizedPlayerId = assertPlayerId(playerId);
  const normalizedLoanId = asUuid(loanId, "el prestamo");
  const normalizedKey = assertIdempotencyKey(idempotencyKey);
  const row = asRpcRow(
    await callBankRpc("bank_pay_loan_early", {
      p_player_id: normalizedPlayerId,
      p_loan_id: normalizedLoanId,
      p_idempotency_key: normalizedKey,
    }),
  );
  return {
    success: parseSuccess(row.success, "la liquidacion anticipada"),
    loanId: asUuid(row.loan_id, "el prestamo liquidado"),
    paidGold: asInteger(row.paid_gold, "la liquidacion anticipada"),
    playerGold: asInteger(row.player_gold, "el oro posterior a la liquidacion"),
    creditLimitGold: asInteger(row.credit_limit_gold, "el limite de credito"),
    onTimeStreak: asInteger(row.on_time_streak, "la racha de pagos"),
    message: asString(row.message, "el mensaje de liquidacion"),
  };
}

export function createBankIdempotencyKey(operation: string): string {
  const normalizedOperation = operation.trim().replace(/[^a-z0-9_-]/gi, "-");
  return `web-bank:${normalizedOperation}:${crypto.randomUUID()}`;
}
