"""Verify section palettes, artwork, motion and access styling on local Vite.
Run: python scripts/check-realm-portals.py --browser <agent-browser executable>
Uses only public browsing; never submits authentication or game transactions.
"""
import argparse
import json
from pathlib import Path
import subprocess
import tempfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--browser", default="agent-browser")
parser.add_argument("--url", default="http://127.0.0.1:5173")
parser.add_argument("--reuse-page", action="store_true", help="Continue in the existing local test page")
args = parser.parse_args()
output = Path("artifacts/realm-ui")
output.mkdir(parents=True, exist_ok=True)

def browser(*command, source=None):
    with tempfile.TemporaryFile() as stdout, tempfile.TemporaryFile() as stderr:
        result = subprocess.run([args.browser, "--session", "realm-check", "--json", *command],
                                input=source, stdout=stdout, stderr=stderr, encoding="utf-8", timeout=90)
        stdout.seek(0)
        stderr.seek(0)
        response = stdout.read().decode("utf-8")
        assert result.returncode == 0, stderr.read().decode("utf-8") or response
    payload = json.loads(response)
    assert payload["success"], payload.get("error")
    return payload.get("data", {})

def evaluate(source):
    return browser("eval", "--stdin", source=source).get("result")

def wait_ready(*condition):
    for attempt in range(3):
        try:
            return browser("wait", *condition)
        except AssertionError as error:
            if "Wait timed out" not in str(error) or attempt == 2:
                raise
            print("Waiting for initial Vite module load...", flush=True)

if not args.reuse_page:
    try:
        browser("open", args.url)
    except AssertionError as error:
        if "Page.navigate" not in str(error):
            raise
wait_ready(".realm-app")
assert evaluate("location.origin") == args.url.rstrip("/")
browser("set", "media", "dark", "no-preference")
for width, height in [(1440, 1000), (390, 844)]:
    browser("set", "viewport", str(width), str(height))
    colors = []
    for index, theme in enumerate(["home", "grimoire", "library", "market", "archivist", "anime"]):
        if theme == "anime":
            browser("click", ".realm-nav-links button:first-child")
            browser("click", '[aria-label="Portal anime"]')
        else:
            browser("click", f".realm-nav-links button:nth-child({index + 1})")
        browser("wait", f'.realm-app[data-kd-theme="{theme}"]')
        wait_ready("--fn", "!document.querySelector('.realm-stage .realm-loading')")
        # Wait for the CSS palette transition, then inspect the rendered values.
        colors.append(evaluate("""(async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const app = document.querySelector('.realm-app');
          if (document.documentElement.scrollWidth > innerWidth + 1) throw Error('Horizontal overflow');
          return getComputedStyle(app).getPropertyValue('--realm-glow').trim();
        })()"""))
        if theme in ["market", "grimoire", "anime"]:
            wait_ready(".realm-portal-art")
            evaluate("document.querySelector('.realm-portal-art').decode()")
            evaluate("""(() => {
              const art = document.querySelector('.realm-portal-art');
              if (art.naturalWidth !== 1536) throw Error('Hero artwork failed');
              if (getComputedStyle(art).animationName === 'none') throw Error('Hero animation missing');
              if (document.querySelectorAll('.realm-portal-hero .realm-embers i').length !== 12) throw Error('Particles missing');
              const button = getComputedStyle(document.querySelector('.realm-profile-trigger'));
              if (button.backgroundColor !== 'rgb(0, 0, 0)' || button.borderTopColor !== 'rgb(245, 197, 66)') throw Error('Access palette changed');
              if (getComputedStyle(document.querySelector('.realm-navigation')).backgroundColor !== 'rgb(0, 0, 0)') throw Error('Navigation is not black');
              if (document.documentElement.scrollWidth > innerWidth + 1) throw Error('Portal overflow');
              return true;
            })()""")
            browser("screenshot", str(output / f"{width}-portal-{theme}.png"))
        print(f"PASS {width}px {theme}: {colors[-1]}", flush=True)
    assert len(set(colors)) == 6, colors

browser("click", ".realm-profile-trigger")
evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Entrar con usuario')).click()")
browser("wait", '[role="dialog"]')
evaluate("""(() => {
  const button = document.querySelector('.realm-auth-dialog form > button');
  const style = getComputedStyle(button);
  if (style.backgroundColor !== 'rgb(0, 0, 0)' || style.borderTopColor !== 'rgb(245, 197, 66)') throw Error('Login button palette');
  if (!document.activeElement.matches('[role=dialog] input')) throw Error('Login focus missing');
  return true;
})()""")
browser("screenshot", str(output / "390-portal-auth.png"))
browser("press", "Escape")
browser("wait", "--fn", "!document.querySelector('[role=dialog]')")
browser("set", "media", "dark", "reduced-motion")
evaluate("""(() => {
  if (getComputedStyle(document.querySelector('.realm-portal-art')).animationName !== 'none') throw Error('Reduced motion preference ignored');
  return true;
})()""")
browser("set", "media", "dark", "no-preference")
errors = browser("errors")
assert not errors.get("errors"), errors
print("PASS black/gold access, focus, Escape, motion preference and no browser errors", flush=True)
