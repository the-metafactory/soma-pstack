## 1. What a top professional would do that the brief does not ask for

A photo-library specialist would not treat "duplicate" as "byte-identical". Exports, messaging apps and re-saves change bytes while the picture stays the same, so a byte-hash misses most real duplicates. They would also separate the question "is this the same file" from "which copy is the keeper", and would record why each file landed in its group so the result can be audited.

## 2. The rawest material they would start from

The files on disk, read directly: the byte stream for exact matches, and the embedded EXIF block (capture time, camera model, dimensions) for near matches. Not a photo manager's catalogue or thumbnail cache, which is already digested and can be stale.

## 3. The methods and tools they would use

- Cheap-to-expensive filtering: group by file size first, hash only files that share a size. This conflicts with the stated "hash every file", so the rewrite does not apply it and asks instead.
- SHA-256 on the byte stream for exact duplicates.
- EXIF capture time plus dimensions to flag near-duplicates for review, kept as a separate group type from exact matches.
- A perceptual hash only if near-duplicates matter, because it brings false positives.
- A symlink and hard-link check, so one file reached by two paths is not reported as two copies.

## 4. What, other than you or me, would show the result is right

A fixture directory with known answers: exact copies, a re-saved JPEG, a symlink, a hard link, two different photos with the same size. The script's groups are compared to the expected groups by a test that fails on any difference. A second check: run an independent tool such as `fdupes` over the same fixture and compare its exact-match groups to the script's.

## Rewritten prompt

Write a Bun script `dedupe.ts` that finds duplicate photos under `~/Pictures`. Hash every file with SHA-256 and group files with the same hash. Print the groups as JSON. Don't delete or move anything. Keep the script under 100 lines.

Read the files themselves, not a photo manager's catalogue. Report one path once even when a symlink or hard link reaches it twice. For each group, include the reason the files were grouped.

Build a fixture directory that holds exact copies, a symlink, a hard link, a re-saved JPEG and two different photos of equal size, with the expected groups written down before the script runs. Add a test that compares the script's output to those expected groups. Compare the script's exact-match groups to the output of `fdupes` on the same fixture and report any difference.

Open questions for me, which I have not decided:
- Hashing every file is slow on a large library. Do I want to relax "hash every file" to hashing only files that share a size?
- Should near-duplicates (same EXIF capture time and dimensions, different bytes) be reported, and if so as a separate group type?
- Do I want a perceptual hash for near-duplicates, accepting false positives?
- How should RAW and sidecar files (`.xmp`, `.aae`) be treated?
