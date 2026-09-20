"""Responsive layout check with a browser-local player fixture; no real account changes."""
import argparse
import json
from pathlib import Path
import subprocess
import tempfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--browser", default="agent-browser")
parser.add_argument("--width", type=int, action="append", choices=[1358, 1920, 768, 390, 360])
args = parser.parse_args()
output = Path("artifacts/realm-ui")
output.mkdir(parents=True, exist_ok=True)

def browser(*command, source=None):
    with tempfile.TemporaryFile() as stdout, tempfile.TemporaryFile() as stderr:
        result = subprocess.run([args.browser, "--session", "realm-density", "--pin-tab", "--json", *command],
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

def prepare_page():
    browser("open", "http://127.0.0.1:5173")
    browser("wait", ".realm-profile-trigger")
    # Only this isolated QA browser sees the fixture. All subsequent backend writes
    # are intercepted locally, including the profile activity timestamp.
    evaluate("""(() => {
      const originalFetch = window.fetch.bind(window);
      const player = {id:'00000000-0000-4000-8000-000000000000', username:'Vista de prueba',
        gold:1552895608, is_admin:true, auth_user_id:null, phone:null, avatar_gif_url:null, max_character_sheets:3};
      window.fetch = (input, init) => {
        const url = String(input instanceof Request ? input.url : input);
        const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
        const mock = value => Promise.resolve(new Response(JSON.stringify(value), {status:200, headers:{'Content-Type':'application/json'}}));
        if (/\\/rest\\/v1\\/(player_profiles_public|players)\\?/.test(url)) return mock([player]);
        if ((url.includes('/rest/v1/') || url.includes('/functions/v1/')) && !['GET','HEAD'].includes(method)) return mock([]);
        return originalFetch(input, init);
      };
      return true;
    })()""")
    browser("click", ".realm-profile-trigger")
    browser("fill", 'input[placeholder="Tu nombre exacto registrado en el reino"]', "Vista de prueba")
    browser("find", "role", "button", "click", "--name", "Conectar perfil", "--exact")
    browser("wait", "--fn", "document.querySelector('.realm-profile-body').textContent.includes('Vista de prueba')")
    browser("click", ".realm-nav-links button:nth-child(4)")
    browser("wait", ".realm-profile-summary")
    browser("wait", ".realm-portal-market")
    evaluate("document.querySelector('.realm-portal-art').decode()")

for width, height in [(1358, 639), (1920, 1080), (768, 1024), (390, 844), (360, 740)]:
    if args.width and width not in args.width:
        continue
    print(f"Checking {width}x{height}", flush=True)
    # Native browser settings can recreate the page; configure before loading it.
    browser("set", "viewport", str(width), str(height))
    browser("set", "media", "dark", "no-preference")
    prepare_page()
    sizes = evaluate("""(async () => {
      await document.fonts.ready;
      await new Promise(resolve => setTimeout(resolve, 800));
      window.scrollTo(0,0);
      const profile = document.querySelector('.realm-player-profile').getBoundingClientRect();
      const hero = document.querySelector('.realm-portal-hero').getBoundingClientRect();
      const nav = document.querySelector('.realm-navigation');
      const workspace = document.querySelector('.realm-workspace');
      const desktop = innerWidth >= 1100;
      if (Math.abs(Number(getComputedStyle(workspace).zoom) - (desktop ? .94 : 1)) > .001) throw Error('Incorrect content scale');
      if (Number(getComputedStyle(nav).zoom) !== 1) throw Error('Sidebar scale changed');
      if (desktop && Math.abs(workspace.getBoundingClientRect().left - nav.getBoundingClientRect().right) > 1) throw Error('Sidebar gutter shifted');
      if (document.documentElement.scrollWidth > innerWidth + 1) throw Error('Page overflow');
      if (innerWidth >= 1100 && profile.height > 195) throw Error('Desktop profile is too tall: '+profile.height);
      if (innerWidth >= 1100 && hero.bottom > innerHeight) throw Error('Hero does not fit in first viewport: '+hero.bottom);
      if (innerWidth >= 1100 && innerHeight <= 760 && nav.scrollHeight > nav.clientHeight + 1) throw Error('Sidebar unnecessarily scrolls');
      if (innerWidth < 700 && profile.height > 340) throw Error('Mobile profile is too tall');
      for (const el of document.querySelectorAll('.realm-profile-summary button, .realm-summary-rank-badge, .realm-summary-identity')) {
        const r = el.getBoundingClientRect();
        if (r.left < profile.left || r.right > profile.right + 1) throw Error('Profile control overflow');
        if (el.tagName === 'BUTTON' && r.height < (desktop ? 40 : 44)) throw Error('Control target too small');
      }
      if (getComputedStyle(document.querySelector('.realm-portal-art')).animationName === 'none') throw Error('Hero motion removed');
      return {viewport:innerWidth, profile:Math.round(profile.height), hero:Math.round(hero.height), heroBottom:Math.round(hero.bottom)};
    })()""")
    browser("screenshot", str(output / f"density-{width}.png"))
    print(json.dumps(sizes), flush=True)
browser("find", "role", "button", "click", "--name", "Panel", "--exact")
browser("wait", ".realm-profile-collapse")
browser("click", ".realm-profile-collapse")
browser("wait", ".realm-profile-summary")
print("PASS density, no overflow, touch targets, retained animation, expand/collapse", flush=True)
# Drop the fixture and interception by clearing this QA page's local selection.
evaluate("localStorage.removeItem('kingdoom.active-player')")
