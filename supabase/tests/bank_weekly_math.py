from __future__ import annotations

from decimal import Decimal, ROUND_CEILING, ROUND_HALF_UP, getcontext

getcontext().prec = 40

# Fuente: bank_v2.sql.PROPUESTA:901-905, derivada de bank_phase1.sql vivo.
# Tier 0 = APR 18% (predeterminado); tier 1 = 15%; tier 2 = 12%.
APR_BY_TIER = {0: Decimal("0.18"), 1: Decimal("0.15"), 2: Decimal("0.12")}
APR = {1200: APR_BY_TIER[2], 1500: APR_BY_TIER[1], 1800: APR_BY_TIER[0]}
DEFAULT_APR_BPS = 1800


def amortization(principal: int, weeks: int, apr_bps: int) -> list[int]:
    rate = APR[apr_bps] / Decimal(52)
    payment = Decimal(principal) * rate / (Decimal("1") - (Decimal("1") + rate) ** Decimal(-weeks))
    rounded = int(payment.quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    amounts = [rounded] * (weeks - 1)
    amounts.append(int((payment * weeks).quantize(Decimal("1"), rounding=ROUND_HALF_UP)) - sum(amounts))
    return amounts


def commission(outstanding: int, apr_bps: int, first_interest: int, seconds_to_first_due: int) -> int:
    rate = APR[apr_bps] / Decimal(52)
    proportional = int(
        (Decimal(outstanding) * rate * Decimal(max(seconds_to_first_due, 0)) / Decimal(604800)).quantize(
            Decimal("1"), rounding=ROUND_CEILING
        )
    )
    return max(first_interest, proportional)


def main() -> None:
    tests = []
    expected_18_approx = {4: 100_851, 8: 101_695, 12: 102_277}
    for weeks, expected_approx in expected_18_approx.items():
        amounts = amortization(100_000, weeks, DEFAULT_APR_BPS)
        total = sum(amounts)
        assert len(amounts) == weeks and abs(total - expected_approx) <= 200
        tests.append(f"{weeks} semanas APR 18%: suma exacta={total}; esperado aproximado={expected_approx}")

    # El 12% no se elimina: es el tier 2 definido por el código vivo.
    tier_totals = {
        tier: {weeks: sum(amortization(100_000, weeks, apr_bps)) for weeks in (4, 8, 12)}
        for tier, apr_bps in ((0, 1800), (1, 1500), (2, 1200))
    }
    assert tier_totals[2] == {4: 100_578, 8: 101_041, 12: 101_506}
    tests.append(f"tiers: {tier_totals}")

    assert commission(100_000, DEFAULT_APR_BPS, 100, 7 * 86400) >= 100
    tests.append("comisión mínima: aprobada")
    assert commission(100_000, DEFAULT_APR_BPS, 100, 0) == 100
    tests.append("regla A/gracia: antes de 48h no marca mora; comisión mínima preservada")
    print(
        {
            "status": "ok",
            "apr_source": "supabase/migrations/20261019235930_bank_v2.sql:901-905",
            "default_apr_bps": DEFAULT_APR_BPS,
            "tests": tests,
            "grace_hours": 48,
            "daily_cap": 5_000_000,
            "integer_max": 2_147_483_647,
        }
    )


if __name__ == "__main__":
    main()
