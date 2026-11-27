"""
Speaks each narration line with a Microsoft natural (neural) voice via edge-tts.
Writes <out>/<md5 of line>.wav (16 kHz mono) and <out>/durations.json ({line: ms}).

Usage: python narrate_edge.py lines.json out_folder [voice] [rate]
       e.g. python narrate_edge.py build/lines.json build/narration-edge en-US-AndrewNeural -4%
Needs: pip install edge-tts, and ffmpeg (path in FFMPEG env var or on PATH).
"""
import asyncio, hashlib, json, os, re, subprocess, sys, wave

import edge_tts

lines_file, out = sys.argv[1], sys.argv[2]
voice = sys.argv[3] if len(sys.argv) > 3 else "en-US-AndrewNeural"
rate = sys.argv[4] if len(sys.argv) > 4 else "-4%"
ffmpeg = os.environ.get("FFMPEG", "ffmpeg")

# How words are said (subtitles keep the original spelling)
PRONOUNCE = [
    (r"SAB-TECH HUB", "Sab Tech Hub"),
    (r"\bSAB\b", "Sab"),
    (r"\bUSSD\b", "U S S D"),            # each letter on its own (version B), not "you-sed"
    (r"\bSESSIONID\b", "session I D"),
    (r"\bSessionId\b", "session I D"),
    (r"\bMSISDN\b", "M S I S D N"),
    (r"\bUSERDATA\b", "user data"),
    (r"\bUSERID\b", "user I D"),
    (r"\bMSGTYPE\b", "message type"),
    (r"\bClientState\b", "client state"),
    (r"\bServiceCode\b", "service code"),
    (r"\bJSON\b", "Jason"),
]

def spoken(text):
    for pat, rep in PRONOUNCE:
        text = re.sub(pat, rep, text)
    return text

os.makedirs(out, exist_ok=True)
lines = json.load(open(lines_file, encoding="utf-8"))

async def make(line, sem):
    key = hashlib.md5(line.encode("utf-8")).hexdigest()
    wav = os.path.join(out, key + ".wav")
    if not os.path.exists(wav):
        mp3 = os.path.join(out, key + ".mp3")
        async with sem:
            for attempt in range(4):
                try:
                    await edge_tts.Communicate(spoken(line), voice, rate=rate).save(mp3)
                    break
                except Exception as e:  # network hiccups: try again
                    if attempt == 3:
                        raise
                    await asyncio.sleep(2 + attempt * 2)
        subprocess.run([ffmpeg, "-y", "-loglevel", "error", "-i", mp3, "-ac", "1", "-ar", "16000", wav], check=True)
        os.remove(mp3)
    with wave.open(wav) as w:
        return line, int(1000 * w.getnframes() / w.getframerate())

async def main():
    sem = asyncio.Semaphore(4)
    results = await asyncio.gather(*(make(l, sem) for l in lines))
    with open(os.path.join(out, "durations.json"), "w", encoding="utf-8") as f:
        json.dump(dict(results), f, ensure_ascii=False, indent=1)
    total = sum(ms for _, ms in results) / 60000
    print(f"narration: {len(results)} lines, voice {voice}, {total:.1f} minutes")

asyncio.run(main())
