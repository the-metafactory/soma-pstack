---
name: ketchup-video
description: "Catch the principal up like ketchup, with a short subtitled video of slides for what happened and the waiting calls as text under it. Use for /ketchup-video."
disable-model-invocation: true
triggers:
  - pattern: "/ketchup-video"
    type: command
    priority: 100
---

# Ketchup video

Follow [`ketchup`](../ketchup/SKILL.md), but show what happened in a short subtitled video instead of its summary and visuals. Its window starts at the last message the principal wrote before `/ketchup-video`, not before any earlier `/ketchup` or `cup`. Writing and rendering the video is the one exception to its read-only rule: write it to a fresh directory under the temp dir, never inside the repository.

The reply is ketchup's opening sentence, the video's absolute path with the command that opens it (`open <path>` on macOS), one line naming any work left that you can do yourself, and the action items with their `D` codes. A terminal cannot play a video inline; where the surface can embed or attach one, do that and keep the path. When the video shows a call's options, call each option by the name the video gives it. If the render fails, say so in one line and give only the calls.

## Slides

Use the screenshots, recordings, diffs and data the work produced, not the chat's prose about them. Before you draw, write the one sentence the principal should leave with and one line per slide. Drop each slide that does not change what the principal knows. Use at most 10 slides, and fewer is better. Neither note goes in the reply.

Each slide makes one point. Build the slides on one picture and change it from slide to slide, rather than cut to an unrelated one. A color or shape means the same thing on every slide. Show the work in pictures, such as how a system works, a PR stack with each PR's state, a before and after of a fix, or options side by side. Point at what changed with arrows, highlights and motion. A slide is never a bullet list, a status list, a table, or boxes with nothing connecting them.

Keep text to the minimum. Put each label on the thing it names, in plain words a person would say, not tags like "Tests: pass". Never caption what a picture shows, and never give a fact twice, across slides or in the text under them.

Show what came of each thing the principal asked for, and whether it is done, still running, failed or not checked. Never show something done that still waits on the principal. Show any bug found and fixed on the way. If a visible change has no screenshot, say so on its slide and name what changed on screen. Draw only from facts you have. Never invent a number, and never draw a screen you did not capture.

## Subtitles

Give each slide one short subtitle line, about ten words, that says its point the way you would tell the principal, from only what that slide shows. Say what the picture means rather than read out its labels. Put the subtitle in a strip below the slide, the same height on every slide and empty except for the subtitle, so it never covers the slide. Set it small, but readable when the video plays at chat size.

## Render

Render one silent landscape mp4 with motion between slides. Every frame is the slide itself, edge to edge, above its subtitle strip. Make the frames from the slides, never by recording a screen, and burn each subtitle into its slide's frames so it stays on screen for the slide's whole hold. The hold is the time a slide is fully on screen, not counting the motion into or out of it. Hold each slide long enough to read the words it adds, at least one second for each three words. A slide adds its subtitle and each word that was not on the slide before it, including a label it changes. The first slide adds all its words. Words inside a screenshot do not count.

Draw each slide as an SVG at 1920 by 920, or use a screenshot as the whole slide. Make one fresh directory, `$TMPDIR/ketchup-video-<name>/`, write the slides and a `deck.json` into it, and pass that same directory as `out-dir` to both `render` and `check`:

```json
{ "slides": [{ "src": "01.svg", "subtitle": "Two pull requests wait on your review" }] }
```

Then render:

```sh
bun <skills>/ketchup-video/scripts/ketchup-video.ts render <deck.json> <out-dir>
```

The script draws each SVG with `rsvg-convert`, or ImageMagick's `magick` when that is missing, adds a 160-pixel subtitle strip below it, and crossfades the frames with ffmpeg's `xfade` into `ketchup.mp4`. It holds each slide one second per three added words plus half a second, and never shorter than two seconds; a slide's optional `hold` (seconds) overrides both. It keeps its intermediate frames under `out-dir/.render/`, so they never overwrite a slide. It refuses an output directory inside a git work tree, following symlinks. It needs `ffmpeg`.

## Check

Before you give the path, check the rendered file:

```sh
bun <skills>/ketchup-video/scripts/ketchup-video.ts check <deck.json> <out-dir>
```

It measures each hold by matching the file's frames to the slide, not with a still-frame detector, which counts the faint ends of a fade as still. It counts the words each slide adds against its measured hold, writes the table to `check.json`, saves one frame from each slide at chat size (640 pixels wide) under `stills/`, and exits 0 when every hold is long enough, 1 when a hold is too short, and 2 on a usage, deck or tool error, such as a missing slide file, an empty subtitle or no `ffmpeg`; `render` exits 2 on those too. On 2, fix what the message names, not the holds. Look at one frame from each slide at chat size, and check that its subtitle is readable and covers nothing. Fix any slide you cannot read in that time, render again, and check again.

Source: ported from pstack `pstack/skills/ketchup-video/SKILL.md` at commit c742dd61706fbacc1b95f1a20b7b988cf096ce6c (MIT, © 2026 Lauren Tan); changed: the principal replaces "the user", a `/ketchup-video` trigger is added, the window also restarts after `cup`, the reply gives the file path because a terminal cannot embed a video, the render goes to a fresh temp directory through the bundled script (rsvg-convert or magick, then ffmpeg), and the hold and chat-size checks run through its `check` subcommand.
