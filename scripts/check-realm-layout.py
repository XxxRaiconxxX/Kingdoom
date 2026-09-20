"""UI geometry audit with a browser-local player fixture; no credentials or remote writes."""
import argparse
import json
from pathlib import Path
import subprocess
import tempfile
import base64
import time
import urllib.request

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--browser', default='agent-browser')
parser.add_argument('--cdp-port', type=int, help='Attach directly to an existing QA Chrome when the CLI daemon is unavailable (requires websockets)')
parser.add_argument('--width', type=int, action='append')
parser.add_argument('--height', type=int)
parser.add_argument('--baseline', action='store_true')
parser.add_argument('--screenshots', action='store_true', help='Also save captures; optional on memory-constrained QA machines')
parser.add_argument('--local-grimoire', action='store_true', help='Use built-in magic and browser-only creature/plant fixtures for geometry checks')
args = parser.parse_args()
output = Path('artifacts/realm-ui/layout-audit')
output.mkdir(parents=True, exist_ok=True)

connection = None
sequence = 0
browser_errors = []

def request(method, params=None):
    global connection, sequence
    if connection is None:
        from websockets.sync.client import connect
        with urllib.request.urlopen(f'http://127.0.0.1:{args.cdp_port}/json/list') as response:
            pages = json.load(response)
        page = next(p for p in pages if p['type'] == 'page' and (p['url'].startswith('http://127.0.0.1:5173') or p['url'] == 'about:blank'))
        connection = connect(page['webSocketDebuggerUrl'], max_size=20_000_000)
        request('Runtime.enable')
    sequence += 1
    identifier = sequence
    connection.send(json.dumps({'id': identifier, 'method': method, 'params': params or {}}))
    while True:
        message = json.loads(connection.recv(timeout=45))
        if message.get('method') == 'Runtime.exceptionThrown':
            browser_errors.append(message['params']['exceptionDetails']['text'])
        if message.get('id') == identifier:
            assert 'error' not in message, message.get('error')
            return message.get('result', {})

def javascript(source):
    result = request('Runtime.evaluate', {'expression': source, 'returnByValue': True, 'awaitPromise': True})
    assert 'exceptionDetails' not in result, result.get('exceptionDetails')
    return result.get('result', {}).get('value')

def cdp_batch(commands):
    results = []
    for command in commands:
        action, *values = command
        value = {}
        if action == 'set':
            if values[0] == 'viewport':
                request('Emulation.setDeviceMetricsOverride', {'width': int(values[1]), 'height': int(values[2]), 'deviceScaleFactor': 1, 'mobile': False})
            else:
                request('Emulation.setEmulatedMedia', {'features': [{'name': 'prefers-color-scheme', 'value': 'dark'}, {'name': 'prefers-reduced-motion', 'value': 'no-preference'}]})
        elif action == 'open':
            request('Page.navigate', {'url': values[0]})
            request('Page.bringToFront')
        elif action == 'wait':
            expression = values[1] if values[0] == '--fn' else f'document.querySelector({json.dumps(values[0])}) !== null'
            deadline = time.monotonic() + 30
            while True:
                try:
                    if javascript(expression): break
                except AssertionError:
                    pass  # A navigation can replace the execution context.
                assert time.monotonic() < deadline, f'Wait timed out: {values}'
                time.sleep(.1)
        elif action == 'eval':
            value = {'result': javascript(values[0])}
            if isinstance(value['result'], dict) and ('issues' in value['result'] or 'map' in value['result']):
                print(json.dumps(value['result'], ensure_ascii=False), flush=True)
        elif action in ['click', 'find']:
            selector = f'document.querySelector({json.dumps(values[0])})' if action == 'click' else f'[...document.querySelectorAll("button")].find(e=>e.textContent.trim()==={json.dumps(values[4])})'
            javascript(f'(() => {{ const el={selector}; el.focus({{preventScroll:true}}); el.click(); }})()')
        elif action == 'fill':
            javascript(f'(() => {{const el=document.querySelector({json.dumps(values[0])});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,{json.dumps(values[1])});el.dispatchEvent(new Event("input",{{bubbles:true}}));}})()')
        elif action == 'screenshot':
            # Let a painted frame settle before capture; animations remain enabled.
            javascript('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
            data = request('Page.captureScreenshot', {'format':'png', 'captureBeyondViewport':False})
            Path(values[0]).write_bytes(base64.b64decode(data['data']))
        elif action == 'press':
            key = 'Tab' if 'Tab' in values[0] else 'Escape'
            params = {'key':key, 'code':key, 'windowsVirtualKeyCode':9 if key=='Tab' else 27, 'modifiers':8 if values[0].startswith('Shift') else 0}
            for event in ['keyDown','keyUp']:
                request('Input.dispatchKeyEvent', {**params,'type':event})
        elif action == 'errors':
            value = {'errors': browser_errors}
        else:
            raise AssertionError(f'Unsupported audit command: {command}')
        results.append({'command':command, 'success':True, 'result':value})
    return results

def batch(commands):
    if not args.screenshots:
        commands = [command for command in commands if command[0] != 'screenshot']
    if args.cdp_port:
        return cdp_batch(commands)
    with tempfile.TemporaryFile() as stdout, tempfile.TemporaryFile() as stderr:
        result = subprocess.run([args.browser, '--session', 'realm-audit', '--pin-tab', '--json', 'batch', '--bail'],
                                input=json.dumps(commands), encoding='utf-8', stdout=stdout, stderr=stderr, timeout=180)
        stdout.seek(0)
        stderr.seek(0)
        response = stdout.read().decode('utf-8')
        if result.returncode:
            output.joinpath('batch-error.json').write_text(response, encoding='utf-8')
            raise AssertionError(stderr.read().decode('utf-8') or json.loads(response)[-1].get('error'))
    payload = json.loads(response)
    for item in payload:
        assert item['success'], item.get('error')
    return payload

measure = """(async () => {
  await document.fonts.ready;
  await new Promise(resolve => setTimeout(resolve, 1100));
  const visible = el => el.getClientRects().length && el.getBoundingClientRect().width > 0;
  const name = el => (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 70);
  const intersects = (a,b) => a.left < b.right-1 && a.right > b.left+1 && a.top < b.bottom-1 && a.bottom > b.top+1;
  const issues = [];
  if (document.documentElement.scrollWidth > innerWidth + 1) issues.push('document overflow');
  for (const el of document.querySelectorAll('.realm-stage :is(h1,h2,h3,input,button), .realm-segmented, .realm-topbar button')) {
    if (!visible(el)) continue;
    let scrollable = false;
    for (let parent = el.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
      if (['auto','scroll'].includes(getComputedStyle(parent).overflowX) && parent.scrollWidth > parent.clientWidth) scrollable = true;
    }
    if (scrollable) continue;
    const r = el.getBoundingClientRect();
    if (r.left < -1 || r.right > innerWidth + 1) issues.push('outside viewport: '+name(el));
    if (el.matches('h1,h2,h3,.realm-segmented') && el.scrollWidth > el.clientWidth + 2) issues.push('clipped content: '+name(el));
  }
  const seal = document.querySelector('.realm-hero-seal');
  if (seal) for (const el of document.querySelectorAll('.realm-hero-content :is(h1,p)')) {
    const range = document.createRange(); range.selectNodeContents(el);
    if ([...range.getClientRects()].some(r => intersects(r, seal.getBoundingClientRect()))) issues.push('hero seal overlaps '+name(el));
  }
  const caption = document.querySelector('.realm-portal-caption');
  const action = document.querySelector('.realm-portal-action');
  if (caption && action && intersects(caption.getBoundingClientRect(), action.getBoundingClientRect())) issues.push('hero caption overlaps action');
  const nav = document.querySelector('.realm-navigation');
  if (innerWidth >= 1100 && Math.abs(nav.getBoundingClientRect().right - document.querySelector('.realm-workspace').getBoundingClientRect().left) > 1) issues.push('sidebar gutter');
  const art = document.querySelector('.realm-hero-art,.realm-portal-art');
  if (art && getComputedStyle(art).animationName === 'none') issues.push('hero animation removed');
  return {width:innerWidth, section:document.querySelector('.realm-app').dataset.kdTheme, issues:[...new Set(issues)]};
})()"""

reports = []
for width in args.width or [360, 768, 1358, 1920]:
    height = args.height or (844 if width < 1100 else 900)
    print(f'Auditing {width}x{height}', flush=True)
    commands = [['set', 'viewport', str(width), str(height)], ['set', 'media', 'dark', 'no-preference'],
                ['eval', "try { localStorage.removeItem('kingdoom.active-player'); } catch {}"],
                ['open', 'http://127.0.0.1:5173'], ['wait', '.realm-hero']]
    if args.local_grimoire:
        commands.append(['eval', """(() => {
          const original=window.fetch.bind(window);
          window.fetch=(input,init)=>{
            const path=new URL(input instanceof Request?input.url:String(input),location.href).pathname;
            if (!/\\/rest\\/v1\\/grimoire_(magic_styles|bestiary_entries|flora_entries)$/.test(path)) return original(input,init);
            const rows=path.endsWith('magic_styles')?[]:['common','uncommon','rare','legendary','calamity'].map((rarity,i)=>({
              id:'qa-'+i,name:'Guardian ancestral de las cumbres del reino '+(i+1),rarity,
              category:'Criatura ancestral',type:'Elemental',general_data:'Ejemplar de auditoria visual local.',
              threat_level:'Alto',domestication:'No domesticable',usage:'Exploracion',origin_place:'Cumbres del norte',
              found_at:'Bosques y montanas',description:'Texto largo de prueba para comprobar el reparto del espacio y las lineas en las tarjetas del compendio.',
              ability:'Proteccion del bosque',properties:'Afinidad con la magia del reino',image_url:'/img/kingdoom-emblem.png'
            }));
            return Promise.resolve(new Response(JSON.stringify(rows),{status:200,headers:{'Content-Type':'application/json'}}));
          };
          return {fixture:'local grimoire; no remote changes'};
        })()"""])
    for index, section in enumerate(['home','grimoire','library','market','archivist','anime']):
        if section == 'anime':
            commands += [['click', '.realm-nav-links button:first-child'], ['wait', '[aria-label="Portal anime"]'],
                         ['click', '[aria-label="Portal anime"]']]
        else:
            commands.append(['click', f'.realm-nav-links button:nth-child({index + 1})'])
        commands += [['wait', f'.realm-app[data-kd-theme="{section}"]'],
                     ['wait', '--fn', "!document.querySelector('.realm-stage .realm-loading')"]]
        if section == 'grimoire':
            commands.append(['wait', '.realm-grimoire-categories'])
        commands += [['eval', measure], ['screenshot', str(output / f"{'before' if args.baseline else 'after'}-{width}-{section}.png")]]
        if section in ['home', 'grimoire', 'market', 'anime']:
            selector = {'home':'.realm-content-block', 'anime':'.realm-anime-search-panel'}.get(section, '.realm-section-intro')
            commands += [['eval', f"document.querySelector('{selector}')?.scrollIntoView({{block:'start'}})"],
                         ['screenshot', str(output / f"{'before' if args.baseline else 'after'}-{width}-{section}-content.png")]]
    if not args.baseline:
        commands += [['click', '.realm-nav-links button:nth-child(3)'], ['wait', '.realm-library-intro'],
                     ['click', '.realm-segmented button:last-child'],
                     ['wait', '--fn', "[...document.querySelectorAll('button')].some(e=>e.textContent.trim()==='Ver en grande')"],
                     ['eval', "[...document.querySelectorAll('button')].find(e=>e.textContent.trim()==='Ver en grande').click()"],
                     ['wait', '[role="dialog"]'], ['eval', "document.querySelector('.realm-map-scroll img').decode()"],
                     ['screenshot', str(output / f'map-{width}-{height}.png')],
                     ['eval', """(() => {
                       const d=document.querySelector('[role=dialog]'), r=d.getBoundingClientRect(), o=d.parentElement.getBoundingClientRect();
                       if (r.top < 0 || r.bottom > innerHeight+1 || r.left < 0 || r.right > innerWidth+1) throw Error('Map dialog outside viewport');
                       if (Math.abs(o.top)>1 || Math.abs(o.left)>1 || Math.abs(o.height-innerHeight)>1) throw Error('Map overlay inside transformed ancestor');
                       if (document.activeElement.getAttribute('aria-label')!=='Cerrar') throw Error('Map initial focus missing');
                       return {map:'PASS',width:innerWidth,height:innerHeight};
                     })()"""], ['press', 'Shift+Tab'],
                     ['eval', "if(document.activeElement.tagName!=='A') throw Error('Map reverse focus trap')"],
                     ['press', 'Tab'], ['eval', "if(document.activeElement.getAttribute('aria-label')!=='Cerrar') throw Error('Map forward focus trap')"],
                     ['press', 'Escape'], ['wait', '--fn', "!document.querySelector('[role=dialog]')"],
                     ['eval', "if(document.body.style.overflow==='hidden') throw Error('Map left page scroll locked')"]]
        if width in [360, 1358]:
            commands += [['click', '.realm-nav-links button:first-child'], ['wait', '.realm-hero'], ['eval', """(() => {
              const original=window.fetch.bind(window);
              window.fetch=(input,init)=>{
                const url=String(input instanceof Request?input.url:input);
                const method=(init?.method||(input instanceof Request?input.method:'GET')).toUpperCase();
                const mock=x=>Promise.resolve(new Response(JSON.stringify(x),{status:200,headers:{'Content-Type':'application/json'}}));
                if (/\\/rest\\/v1\\/(player_profiles_public|players)\\?/.test(url)) return mock([{id:'00000000-0000-4000-8000-000000000000',username:'Vista de prueba',gold:1552895608,is_admin:true,auth_user_id:null,phone:null,avatar_gif_url:null,max_character_sheets:3}]);
                if ((url.includes('/rest/v1/')||url.includes('/functions/v1/'))&&!['GET','HEAD'].includes(method)) return mock([]);
                return original(input,init);
              };
              return true;
            })()"""], ['click', '.realm-profile-trigger'],
              ['fill', 'input[placeholder="Tu nombre exacto registrado en el reino"]', 'Vista de prueba'],
              ['find', 'role', 'button', 'click', '--name', 'Conectar perfil', '--exact'],
              ['wait', '--fn', "document.querySelector('.realm-profile-body').textContent.includes('Vista de prueba')"],
              ['eval', "document.querySelector('.realm-profile-collapse')?.click()"], ['wait', '.realm-profile-summary'],
              ['screenshot', str(output / f'profile-{width}.png')], ['eval', """(() => {
                const tools=document.querySelector('.realm-anime-shortcut').parentElement.getBoundingClientRect();
                const panel=document.querySelector('.realm-summary-identity > button').getBoundingClientRect();
                const overlap=tools.left<panel.right && tools.right>panel.left && tools.top<panel.bottom && tools.bottom>panel.top;
                return {width:innerWidth,section:'connected-profile',issues:overlap?['Profile tools overlap Panel']:[]};
              })()"""], ['eval', "localStorage.removeItem('kingdoom.active-player')"]]
    commands.append(['errors'])
    for item in batch(commands):
        value = item.get('result', {}).get('result')
        if isinstance(value, dict) and ('issues' in value or 'map' in value):
            if not args.cdp_port:
                print(json.dumps(value, ensure_ascii=False), flush=True)
            reports.append(value)
        if item['command'][0] == 'errors':
            assert not item['result'].get('errors'), item['result']
    output.joinpath('baseline.json' if args.baseline else 'verification.json').write_text(json.dumps(reports, ensure_ascii=False, indent=2), encoding='utf-8')
output.joinpath('baseline.json' if args.baseline else 'verification.json').write_text(json.dumps(reports, ensure_ascii=False, indent=2), encoding='utf-8')
if not args.baseline:
    assert not any(report.get('issues') for report in reports), 'Layout issues remain; inspect verification.json'
