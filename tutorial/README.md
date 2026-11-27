# Tutorial video

The scripts in this folder make `SAB-TECH-HUB-USSD-Simulator-Tutorial.mp4`, a step-by-step guide (1920×1080, with chapters, click sounds and background music) recorded from the real simulator. The video itself is not stored in the repository; run the steps below to make it.

## Chapters

1. Meet the simulator
2. Set up your test
3. Dial your first USSD code
4. Read the conversation
5. Build your own menu
6. Ask a question and check the answer
7. Variables and simple maths
8. See your menu as a map
9. Test your menu on the phone
10. Get the PHP code
11. Start from a ready-made sample
12. Test your own server

## Re-recording it

Needs Windows with Microsoft Edge, PHP and ffmpeg, and the simulator running on `http://localhost:8090` (`php -S localhost:8090` in the project folder).

```powershell
powershell -ExecutionPolicy Bypass -File tutorial\record.ps1 -Url http://localhost:8090/ -Out tutorial\build
php -d memory_limit=1G tutorial\soundtrack.php tutorial\build\meta.json tutorial\build\soundtrack.wav
php tutorial\assemble.php tutorial\build C:\path\to\ffmpeg.exe tutorial\SAB-TECH-HUB-USSD-Simulator-Tutorial.mp4
```

| File | What it does |
| --- | --- |
| `tour-engine.js` | Pointer, click ripples, captions and title cards; steps the page frame by frame |
| `tour-script.js` | The tutorial: every chapter, caption, click and typed text |
| `record.ps1` | Runs Edge in the background and saves a frame after each step |
| `soundtrack.php` | Composes the background music and adds a click sound at every click |
| `assemble.php` | Joins frames, sound and chapter markers into the MP4 |

To change the music, replace `build/soundtrack.wav` with your own track (keep the click sounds by mixing them in, or skip them) before running `assemble.php`.
