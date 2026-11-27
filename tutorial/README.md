# Tutorial videos

A narrated, beginner-friendly video course for the SAB-TECH HUB USSD Simulator, recorded from the real app (1920×1080, natural voice-over with subtitles, click sounds, background music and chapter markers). Plain language, one step at a time, with real-life examples. The videos themselves are not stored in the repository; the scripts here make them.

| # | Video | What it covers | Real-life example |
| --- | --- | --- | --- |
| 1 | Getting started | What USSD is, the screen, three quick settings, your first dial | Buying airtime |
| 2 | What happens when you dial | The chat between phone and server, in simple words; Hubtel and Nalo | Checking a balance |
| 3 | Test your own server | My server, Check, what errors mean, good testing habits | A church donation line |
| 4 | Make your first menu | Screens, options, New screen, warnings, saving, testing | A small shop info line |
| 5 | Ask questions | Questions, checking answers, friendly error messages, showing answers | Joining a susu group |
| 6 | Make decisions with conditions | Rules, their order, Otherwise, useful kinds of checks | Airtime limits and a bonus |
| 7 | Prices, totals and maths | Saved values, calculating totals and fees, the Variables list | Event tickets |
| 8 | See your menu as a map | Boxes and arrows, typing in boxes, dragging, drawing arrows, right-click | A shop menu |
| 9 | Ready-made samples and saving | The 30 samples, loading, saving, Save to file, Start over | A loan calculator |
| 10 | Put your menu live | Get the code, put it online, test it, connect Hubtel or Nalo | Going live with a shop menu |
| 11 | Use case: school fees payment | A complete service built from an empty page | Bright Future School fees |
| 12 | Use case: food order with delivery | Turning a sample into your own service | Mama's Kitchen jollof and waakye |

## Making the videos

Needs Windows with Microsoft Edge, PHP (XAMPP is fine), ffmpeg, and the simulator running on `http://localhost:8090`:

```powershell
php -S localhost:8090                     # in the project folder, in its own window
powershell -ExecutionPolicy Bypass -File tutorial\make-videos.ps1
```

The MP4s appear in `tutorial\videos-out\`. Use `-Only 04 -Force` to remake one video, and `-Voice en-US-AvaNeural` (or any Microsoft natural voice) to change the narrator.

| File | What it does |
| --- | --- |
| `videos/01-…12-*.js` | One script per video: every spoken line (`T.say`), click and typed text |
| `videos/_lib.js` | Shared steps: title cards, dialing, replying, ready-made menus |
| `tour-engine.js` | Pointer, click ripples, subtitles, title cards; steps the page frame by frame |
| `lines.php` | Collects every spoken line from the scripts |
| `narrate_edge.py` | Speaks each line with a Microsoft natural voice (default Andrew) and measures how long it takes; also fixes pronunciation, e.g. "SAB" is said "Sab" |
| `narrate.ps1` | The same with a built-in Windows voice (offline) |
| `record.ps1` | Runs Edge in the background and saves a frame after each step |
| `soundtrack.php` | Original background music, the voice-over (music lowered while speaking) and click sounds |
| `assemble.php` | Joins frames, sound and chapter markers into the MP4 |
| `make-videos.ps1` | Runs all of the above for every video |

Narration lines are written in double quotes (the natural voice needs `pip install edge-tts`; pass e.g. `-Voice "Microsoft Mark"` for an offline Windows voice); `T.say("subtitle", "spoken words")` shows the first and speaks the second (for example `*713#` is spoken as "star seven one three hash").
