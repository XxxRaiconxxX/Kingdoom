"""Read-only browser checks. Run with --browser <agent-browser executable>.

Requires the app running at --url (default: local Vite), no player credentials.
"""
import argparse
import json
from pathlib import Path
import subprocess
import tempfile


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--browser", default="agent-browser")
parser.add_argument("--url", default="http://127.0.0.1:5173")
args = parser.parse_args()
output = Path("artifacts/realm-ui")
output.mkdir(parents=True, exist_ok=True)


def browser(*command, source=None):
    # Files avoid a Windows browser daemon keeping subprocess pipes open.
    with tempfile.TemporaryFile() as stdout, tempfile.TemporaryFile() as stderr:
        result = subprocess.run(
            [args.browser, "--session", "realm-check", "--json", *command],
            input=source, stdout=stdout, stderr=stderr, encoding="utf-8", timeout=45,
        )
        stdout.seek(0)
        stderr.seek(0)
        response = stdout.read().decode("utf-8")
        assert result.returncode == 0, stderr.read().decode("utf-8") or response
    payload = json.loads(response)
    assert payload["success"], payload.get("error")
    return payload.get("data", {})


def evaluate(source):
    return browser("eval", "--stdin", source=source).get("result")


def check(source):
    return evaluate("(() => { " + source + " })()")


browser("open", args.url)
browser("set", "media", "dark", "no-preference")
browser("wait", ".realm-hero")
for width, height in [(390, 844), (1440, 1000)]:
    browser("set", "viewport", str(width), str(height))
    for index, destination in enumerate(["Inicio", "Grimorio", "Biblioteca", "Mercado", "Archivista"]):
        browser("click", f".realm-nav-links button:nth-child({index + 1})")
        browser("wait", f'.realm-stage[aria-label="{destination}"]')
        browser("wait", "--fn", "!document.querySelector('.realm-stage .realm-loading')")
        if destination == "Inicio":
            evaluate("document.querySelector('.realm-hero-art').decode()")
        if destination == "Grimorio":
            browser("wait", ".realm-grimoire-categories")
        if destination == "Archivista":
            browser("wait", "--fn", "!document.querySelector('.realm-stage').textContent.includes('Sincronizando')")
        evaluate("document.fonts.ready.then(() => true)")
        check("""
          const active = document.querySelector('.realm-nav-links [aria-current="page"]');
          if (!active) throw Error('Missing current destination');
          const bounds = active.getBoundingClientRect();
          if (bounds.height < 44 || bounds.width < 44) throw Error('Small navigation target');
          if (document.documentElement.scrollWidth > innerWidth + 1) throw Error('Horizontal overflow');
          const escaped = [...document.querySelectorAll('.realm-stage h1, .realm-stage h2, .realm-stage input, .realm-stage button')]
            .filter(e => e.getClientRects().length && getComputedStyle(e).position !== 'fixed')
            .filter(e => {
              for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
                if (['auto', 'scroll'].includes(getComputedStyle(p).overflowX) && p.scrollWidth > p.clientWidth) return false;
              }
              return true;
            })
            .filter(e => { const r = e.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth + 1; });
          if (escaped.length) throw Error('Content outside viewport: ' + escaped.map(e => e.textContent.slice(0, 70)).join(', '));
        """)
        browser("screenshot", str(output / f"{width}-{index}-{destination}.png"))
        print(f"PASS {width}px {destination}", flush=True)

    browser("click", ".realm-nav-links button:first-child")
    browser("find", "role", "button", "click", "--name", "Portal anime", "--exact")
    browser("wait", "#anime-search")
    check("if (document.documentElement.scrollWidth > innerWidth + 1) throw Error('Anime overflow');")
    browser("screenshot", str(output / f"{width}-5-Anime.png"))
    print(f"PASS {width}px Portal anime", flush=True)

# Heraldic identity and adventure disclosures use real public records.
browser("click", ".realm-nav-links button:first-child")
browser("wait", ".realm-mission-card")
evaluate("document.querySelector('.realm-hero-seal img').decode()")
check("""
  const logo = document.querySelector('.realm-hero-seal img');
  if (!logo.currentSrc.includes('kingdoom-emblem.png') || logo.naturalWidth !== 1600) throw Error('Supplied emblem missing');
  if (getComputedStyle(document.querySelector('.realm-hero-art')).animationName === 'none') throw Error('Landscape motion missing');
""")
for kind in ["mission", "event"]:
    button = f'.realm-{kind}-card .realm-disclosure'
    browser("find", "first", button, "click")
    check(f"""
      const button = document.querySelector({json.dumps(button)});
      const detail = document.getElementById(button.getAttribute('aria-controls'));
      if (button.getAttribute('aria-expanded') !== 'true' || !detail?.textContent.trim()) throw Error('Adventure detail did not open');
    """)
    browser("screenshot", str(output / f"1440-{kind}-expanded.png"))
    browser("find", "first", button, "click")
    browser("wait", "--fn", f"!document.querySelector('.realm-{kind}-card .realm-unfold')")
check("""
  const colors = new Set();
  for (const rarity of ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'calamity']) {
    const card = document.createElement('article');
    card.className = 'realm-rarity-card'; card.dataset.rarity = rarity;
    document.querySelector('.realm-stage').append(card);
    const color = getComputedStyle(card).borderTopColor;
    if (color === 'rgba(0, 0, 0, 0)') throw Error('Missing rarity color');
    colors.add(color); card.remove();
  }
  if (colors.size !== 6) throw Error('Expected six distinct rarity colors (mythic and calamity share crimson)');
""")
browser("click", ".realm-show-missions")
check("if (document.querySelectorAll('.realm-mission-card').length <= 3) throw Error('More missions did not unfold');")
browser("click", ".realm-show-missions")
browser("wait", "--fn", "document.querySelectorAll('.realm-mission-card').length === 3")
print("PASS supplied emblem, mission/event expansion, colored rarities and mission list", flush=True)

# Exercise changed filters and accordion controls without a player account.
browser("click", ".realm-nav-links button:nth-child(2)")
browser("wait", ".realm-grimoire-entry")
browser("find", "first", ".realm-grimoire-entry > button", "click")
check("if (document.querySelector('.realm-grimoire-entry > button').getAttribute('aria-expanded') !== 'true') throw Error('Accordion did not expand');")
browser("fill", '[aria-label="Buscar en el grimorio"]', "zz-ui-no-match-987")
browser("wait", "--fn", "!document.querySelector('.realm-grimoire-entry')")
browser("find", "role", "button", "click", "--name", "LIMPIAR FILTROS", "--exact")
browser("wait", ".realm-grimoire-entry")
for mode in ["Bestiario", "Flora", "Magias"]:
    browser("find", "role", "button", "click", "--name", mode, "--exact")
    check(f"if (document.querySelector('.realm-segmented [aria-pressed=true]').textContent.trim() !== {json.dumps(mode)}) throw Error('Mode did not change');")
browser("click", ".realm-nav-links button:nth-child(3)")
browser("find", "role", "button", "click", "--name", "Mapa y Mundo", "--exact")
browser("wait", 'img[alt="Mapa del continente de Vyralis"]')
browser("find", "role", "button", "click", "--name", "Geopolitica", "--exact")
browser("wait", 'img[alt="Mapa geopolitico del continente"]')
print("PASS grimoire accordion, search, modes and library maps", flush=True)

# Focus must follow navigation, including keyboard activation.
browser("focus", ".realm-nav-links button:nth-child(2)")
browser("press", "Enter")
browser("wait", '.realm-stage[aria-label="Grimorio"]')
check("if (!document.activeElement.matches('.realm-stage')) throw Error('Navigation focus lost');")
browser("click", ".realm-profile-trigger")
browser("find", "role", "button", "click", "--name", "Entrar con usuario y contraseña", "--exact")
browser("wait", '[role="dialog"]')
check("if (!document.activeElement.matches('[role=dialog] input')) throw Error('Dialog initial focus');")
browser("fill", '[role="dialog"] input[autocomplete="username"]', "ui-check")
check("if (document.activeElement.value !== 'ui-check') throw Error('Form focus reset');")
evaluate("document.querySelector('[role=dialog] button').focus()")
browser("press", "Shift+Tab")
check("""
  const buttons = document.querySelectorAll('[role=dialog] button');
  if (document.activeElement !== buttons[buttons.length - 1]) throw Error('Reverse focus trap');
""")
browser("press", "Tab")
check("if (document.activeElement !== document.querySelector('[role=dialog] button')) throw Error('Forward focus trap');")
browser("set", "viewport", "390", "844")
browser("screenshot", str(output / "390-auth.png"))
browser("press", "Escape")
browser("wait", "--fn", "!document.querySelector('[role=dialog]')")
check("""
  if (document.body.style.overflow === 'hidden') throw Error('Scroll remained locked');
  if (!document.activeElement.textContent.includes('Entrar con usuario')) throw Error('Dialog focus not restored');
""")
print("PASS keyboard navigation, auth focus trap, Escape, focus restoration", flush=True)

browser("set", "media", "dark", "reduced-motion")
browser("click", ".realm-nav-links button:first-child")
browser("wait", ".realm-hero")
check("""
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) throw Error('Reduced motion not emulated');
  if (getComputedStyle(document.querySelector('.realm-stage')).animationName !== 'none') throw Error('Section motion not reduced');
  if (getComputedStyle(document.querySelector('.realm-hero-art')).animationName !== 'none') throw Error('Landscape motion not reduced');
  if (getComputedStyle(document.querySelector('.realm-embers')).display !== 'none') throw Error('Embers not reduced');
""")
for width in [375, 768, 1024, 1920]:
    browser("set", "viewport", str(width), "1000")
    check("if (document.documentElement.scrollWidth > innerWidth + 1) throw Error('Home overflow');")
print("PASS reduced motion and home at 375/768/1024/1920px", flush=True)
errors = browser("errors")
assert not errors.get("errors"), errors
print("PASS no uncaught browser errors", flush=True)
