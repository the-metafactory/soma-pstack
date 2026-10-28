# Node #48 verification

Verified on the host on 2026-10-28. The port is `ketchup-video`, after upstream `pstack/skills/ketchup-video/SKILL.md` at `cursor/plugins` `c742dd6` (full SHA in the member manifest).

## What was probed

A real ketchup-video for this repository's own window: PRs 39, 41, 42 and 43, merged on 2026-10-27, the six port issues (#44 to #49) being worked in parallel, and #40, which waits on soma#1105, still open. The four slides build on one picture of the main branch. [`deck/`](deck/) holds the SVG slides, `deck.json` and `make-slides.ts`, which wrote them. [`reply.md`](reply.md) is the reply the skill gives for this window.

```sh
bun deck/make-slides.ts <dir>
bun skills/ketchup-video/scripts/ketchup-video.ts render <dir>/deck.json $TMPDIR/ketchup-video-node48
bun skills/ketchup-video/scripts/ketchup-video.ts check <dir>/deck.json $TMPDIR/ketchup-video-node48
```

The video is `$TMPDIR/ketchup-video-node48/ketchup.mp4`: 1920 by 1080, 30 fps, 34.17 s, 953,011 bytes. It is not committed.

## Hold check

[`check.json`](check.json) is the `check` output. Each hold is measured by matching the video's frames to that slide's own frame, over the pixels where the slide differs from its neighbours.

| Slide | Words added | Needed (s) | Measured (s) |
| --- | --- | --- | --- |
| 1 | 26 | 8.67 | 9.20 |
| 2 | 22 | 7.33 | 7.90 |
| 3 | 23 | 7.67 | 8.23 |
| 4 | 21 | 7.00 | 7.50 |

The first render of a three-slide test deck showed what the measurement counts. Slide 1 was planned at 3.83 s; frames 0 to 115 sit 0.15 grey levels from it, and frame 116, the first fade frame, jumps to 1.30, so the measured 3.87 s is the planned hold rounded to whole frames, with no fade frame counted. `test/ketchup-video.test.ts` renders a deck whose middle slide is held 1 s for 15 words and expects `check` to fail that slide alone.

## Readability check

[`stills/`](stills/) holds one frame from the middle of each hold at 640 pixels wide; the subtitle is 17.3 pixels high there. The first render's PR numbers and branch names came out near 9 pixels and the "waits on" label touched a box, so the labels were enlarged and moved and the deck rendered again. In the second render every subtitle and label reads at that size, and no subtitle covers the slide.

## Gate

`bun test` and `bun scripts/check-pack.ts` pass on the host. The render test skips where `ffmpeg`, `ffprobe` or `rsvg-convert` is missing, which includes CI.
