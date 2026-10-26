# End-of-run transcript audit

Run: node-5-scratch-sort. Transcript: transcript.jsonl. Row numbers include the TSV header.

Checked rows 2-5: start identifies this run; default sort really produced 1,10,2; row 4 supersedes row 3 using its timestamp and the verified numeric output 1,2,10. Every evidence pointer resolves to a recorded event. The previously unlogged locale fork at transcript line 4 was appended as row 5. Earlier bytes were checked after every append and remained unchanged. Row 6 records this audit.

This is a small scripted probe, not evidence that arbitrary agent transcripts are audited automatically.
