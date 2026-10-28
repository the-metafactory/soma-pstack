# Node #48 verification

Verified on the host on 2026-10-28. The port is `ketchup-video`, after upstream `pstack/skills/ketchup-video/SKILL.md` at `cursor/plugins` `c742dd6` (full SHA in the member manifest).

## What was probed

A real ketchup-video for this repository's own window: PRs 39, 41, 42 and 43, merged on 2026-10-27, the six port issues (#44 to #49) being worked in parallel, and #40, which waits on soma#1105, still open. The four slides build on one picture of the main branch. [`deck/`](deck/) holds the SVG slides, `deck.json` and `make-slides.ts`, which wrote them. [`reply.md`](reply.md) is the reply the skill gives for this window.

The deck, the video and the check output share one directory, as SKILL.md asks:

```sh
dir=$TMPDIR/ketchup-video-node48
mkdir "$dir"
bun docs/verification/node-48/deck/make-slides.ts "$dir"
bun skills/ketchup-video/scripts/ketchup-video.ts render "$dir/deck.json" "$dir"
bun skills/ketchup-video/scripts/ketchup-video.ts check "$dir/deck.json" "$dir"
```

The video is `$TMPDIR/ketchup-video-node48/ketchup.mp4`: 1920 by 1080, 30 fps, 34.17 s, 953,011 bytes. It is not committed.

## Hold check

[`check.json`](check.json) is the `check` output. Each hold is measured by matching the video's frames to that slide's own frame, over the pixels where the slide differs from its neighbours.

| Slide | Words added | Needed (s) | Measured (s) |
| --- | --- | --- | --- |
| 1 | 26 | 8.67 | 9.20 |
| 2 | 22 | 7.33 | 7.87 |
| 3 | 23 | 7.67 | 8.20 |
| 4 | 21 | 7.00 | 7.50 |

The planned holds are 9.17, 7.83, 8.17 and 7.50 s. Slides 1 to 3 measure one frame (0.033 s) over plan, and slide 4, which no fade leaves, measures exactly its plan. That frame is xfade's first frame of each fade, at progress 0: a per-frame fit of the 1-to-2 fade puts frame 275 (9.167 s) at progress 0.001, the same as the hold before it, and frame 276 at 0.066. It shows the slide unchanged, so `check` counts it as hold and does not subtract it. No frame that blends in a neighbour is counted.

An earlier version of `check` averaged a slide's distance over the pixels where it differs from either neighbour, so a large change on one side diluted a small one on the other, and slides 2 and 3 also counted the last fade frame coming in (progress 0.935). `check` now matches against each neighbour on its own. `test/ketchup-video.test.ts` renders a deck whose first two slides differ only in their words and whose third differs everywhere. The middle slide is held 1 s for 15 words, and the test expects `check` to fail that slide alone and measure it at 1.03 s; the averaged version passed it.

## Readability check

[`stills/`](stills/) holds one frame from the middle of each hold at 640 pixels wide; the subtitle is 17.3 pixels high there. The first render's PR numbers and branch names came out near 9 pixels and the "waits on" label touched a box, so the labels were enlarged and moved and the deck rendered again. In the second render every subtitle and label reads at that size, and no subtitle covers the slide.

## Gate

`bun test` and `bun scripts/check-pack.ts` pass on the host. The two render tests skip where `ffmpeg` or `rsvg-convert` is missing, which includes CI. The exit-code and git-guard tests need neither and run everywhere.

## Known limits

- CI has no `ffmpeg` or `rsvg-convert`, so the two render tests run only on a host that has them.
- Long subtitles overflow silently. The subtitle is one unwrapped `<text>` at 52 px, so a subtitle of about 70 characters or more runs off the frame, and `check` does not detect it.
- Words drawn as SVG paths, not `<text>`, are not counted as words a slide adds.
- Entity names count as words. The slide-text reader does not decode entities, so `&amp;` counts as the word "amp". This over-counts, which errs on the safe side.
- When no frame matches a slide (measured 0 s), its still is taken at 0 s and shows slide 1 under that slide's label. The row fails anyway.
- `check` holds the whole video in memory as 480 by 270 grayscale, about 130 KB per frame. A 10-slide deck of about 100 s needs roughly 390 MB.
