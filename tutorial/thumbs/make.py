"""Bold YouTube thumbnails (1280x720) for the USSD course, drawn as HTML and captured with headless Edge.
Usage: python make.py   (writes out/<video>.jpg; needs the frames/ folder from the videos)"""
import html, os, subprocess, pathlib, time, tempfile

HERE = pathlib.Path(__file__).resolve().parent
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
(HERE / "out").mkdir(exist_ok=True)
(HERE / "html").mkdir(exist_ok=True)

# key: (badge, topic, phone screen lines, typed answer or None, accent)
V = {
    "01-getting-started": ("PART 1", "Getting Started", ["Welcome to Demo Shop", "1. Check balance", "2. Buy airtime", "3. Exit"], None, "#ffd23f"),
    "02-requests-and-responses": ("PART 2", "When You Dial a Code", ["*713#", "", "Calling the server...", "Menu received"], None, "#ffd23f"),
    "03-testing-your-server": ("PART 3", "Test Your Own Server", ["Buy GHS 10 airtime?", "1. Confirm", "2. Cancel"], "1", "#ffd23f"),
    "04-menu-builder-basics": ("PART 4", "Make Your First Menu", ["Welcome to My Shop", "1. Buy data", "2. Buy airtime", "3. Talk to us"], None, "#ffd23f"),
    "05-questions": ("PART 5", "Ask Questions", ["Enter your full name:"], "Ama Mensah", "#ffd23f"),
    "06-conditions": ("PART 6", "Make Decisions", ["Wrong PIN.", "Please try again:"], "****", "#ffd23f"),
    "07-variables-and-maths": ("PART 7", "Prices & Totals", ["Fees: GHS 1,500", "Charge: GHS 15", "Total: GHS 1,515", "1. Pay  2. Cancel"], None, "#ffd23f"),
    "08-the-map": ("PART 8", "More Map Tricks", ["Main menu", "1. Balance", "2. Airtime", "3. Data", "4. Contact us"], None, "#ffd23f"),
    "09-samples-and-files": ("PART 9", "30 Ready-made Menus", ["Quick Loans", "1. Borrow", "2. Repay", "3. My balance"], None, "#ffd23f"),
    "10-going-live": ("PART 10", "Put Your Menu Live", ["Welcome to My Shop", "1. Buy data", "2. Buy airtime", "3. Talk to us"], None, "#3ddc84"),
    "11-use-case-school-fees": ("PART 11", "School Fees Payment", ["Pay School Fees", "Enter student ID:"], "STU1024", "#ffd23f"),
    "12-use-case-food-order": ("PART 12", "Food Order + Delivery", ["Mama's Kitchen", "1. Jollof (70)", "2. Waakye (40)", "3. Banku (50)"], None, "#ffd23f"),
    "13-install-the-app": ("BONUS", "Install the Free App", ["USSD Simulator", "Free for", "Windows & Mac"], None, "#3ddc84"),
}

TPL = """<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@600;800&display=swap" rel="stylesheet">
<style>
*{margin:0;box-sizing:border-box}
html,body{width:1280px;height:720px;overflow:hidden}
body{background:#071056;font-family:Inter,Arial,sans-serif;position:relative}
.bg{position:absolute;right:-120px;top:40px;width:900px;transform:rotate(-7deg);border-radius:18px;opacity:.28;filter:saturate(.6)}
.glow{position:absolute;inset:0;background:radial-gradient(circle at 18% 30%,rgba(37,99,235,.55),transparent 55%),linear-gradient(90deg,#071056 38%,rgba(7,16,86,.55) 70%,rgba(7,16,86,.2))}
.brand{position:absolute;left:56px;top:44px;display:flex;align-items:center;gap:12px;color:#fff;font:800 26px Inter}
.brand b{background:#fff;color:#0a1180;border-radius:10px;padding:6px 10px;font-size:22px}
.badge{position:absolute;left:56px;top:118px;background:ACC;color:#0a1180;font:800 40px Inter;padding:8px 22px;border-radius:12px;letter-spacing:1px}
.big{position:absolute;left:52px;top:188px;font-family:Anton,Impact,sans-serif;color:#fff;font-size:150px;line-height:.98;text-transform:uppercase;text-shadow:0 6px 0 rgba(0,0,0,.35)}
.big span{color:ACC;display:block}
.topic{position:absolute;left:56px;bottom:56px;max-width:700px;color:#fff;font:800 50px/1.1 Inter;background:rgba(0,0,0,.35);padding:12px 22px;border-left:10px solid ACC;border-radius:6px}
.phone{position:absolute;right:92px;top:62px;width:330px;height:620px;background:#111;border-radius:48px;padding:18px;box-shadow:0 30px 70px rgba(0,0,0,.6),0 0 0 4px #2b2f45;transform:rotate(5deg)}
.screen{width:100%;height:100%;border-radius:34px;background:linear-gradient(#5b6b8c,#2c3550);display:flex;align-items:center;justify-content:center;padding:20px}
.ussd{background:#fff;border-radius:16px;width:100%;padding:22px 20px 16px;box-shadow:0 10px 30px rgba(0,0,0,.4)}
.ussd p{font:600 25px/1.35 Inter;color:#111}
.ussd p.h{font-weight:800}
.ans{margin-top:12px;border-bottom:3px solid #2563eb;font:600 25px Inter;color:#111;padding:4px 2px}
.btns{display:flex;justify-content:space-between;margin-top:16px;font:800 20px Inter;color:#2563eb;padding:0 10px}
.free{position:absolute;right:300px;top:40px;background:#e11d48;color:#fff;font:800 30px Inter;padding:10px 20px;border-radius:999px;transform:rotate(-8deg);box-shadow:0 8px 20px rgba(0,0,0,.4)}
</style></head><body>
<img class="bg" src="BG">
<div class="glow"></div>
<div class="brand"><b>SAB</b>SAB-TECH HUB</div>
<div class="badge">BADGE</div>
<div class="big">USSD App<span>No Coding</span></div>
<div class="topic">TOPIC</div>
<div class="phone"><div class="screen"><div class="ussd">LINES ANSWER<div class="btns"><span>CANCEL</span><span>SEND</span></div></div></div></div>
<div class="free">FREE</div>
</body></html>"""

for key, (badge, topic, lines, answer, acc) in V.items():
    bg = (HERE / "frames" / f"{key}-60.jpg").as_uri()
    ls = "".join(f'<p class="{"h" if i == 0 else ""}">{html.escape(l) or "&nbsp;"}</p>' for i, l in enumerate(lines))
    ans = f'<div class="ans">{html.escape(answer)}</div>' if answer else ""
    page = (TPL.replace("ACC", acc).replace("BG", bg).replace("BADGE", badge).replace("TOPIC", html.escape(topic))
            .replace("LINES", ls).replace("ANSWER", ans))
    hp = HERE / "html" / f"{key}.html"
    hp.write_text(page, encoding="utf-8")
    png = HERE / "out" / f"{key}.png"
    subprocess.run([EDGE, "--headless=new", "--disable-gpu", f"--user-data-dir={HERE / '.edge' / key}", "--no-first-run", "--hide-scrollbars", "--force-device-scale-factor=1",
                    "--window-size=1280,720", "--virtual-time-budget=4000", f"--screenshot={png}", hp.as_uri()],
                   check=True, capture_output=True)
    for _ in range(40):  # Edge can write the file a moment after it exits
        if png.exists() and png.stat().st_size > 0: break
        time.sleep(0.5)
    print(key, png.stat().st_size)
