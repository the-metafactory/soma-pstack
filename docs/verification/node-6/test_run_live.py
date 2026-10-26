from contextlib import redirect_stdout
from io import StringIO
import json
import os
from pathlib import Path
import runpy
import subprocess
import tempfile
import unittest
from unittest.mock import patch

import run_live


class MetadataCaptureTest(unittest.TestCase):
    def setUp(self):
        self.scratch = tempfile.TemporaryDirectory()
        self.addCleanup(self.scratch.cleanup)
        self.root = Path(self.scratch.name)
        self.retained = self.root / 'pr-metadata.json'
        self.retained.write_text('{"previous": true}\n')
        self.log = self.root / 'metadata-checks.txt'
        self.output = StringIO()

    def capture(self, response):
        with patch.object(run_live, 'ROOT', self.root), patch.object(
            run_live, 'run', return_value=response
        ), redirect_stdout(self.output):
            run_live.capture_metadata(log_path=self.log)

    def test_valid_response_is_retained_and_pass_is_logged(self):
        response = '{"commits":[{"oid":"abc","messageHeadline":"Example"}]}\n'
        self.capture(response)
        self.assertEqual(json.loads(self.retained.read_text()), json.loads(response))
        self.assertEqual(self.output.getvalue(), self.log.read_text())
        self.assertIn('PASS: fresh query JSON parses, equals retained pr-metadata.json', self.output.getvalue())

    def test_malformed_json_cannot_replace_evidence_or_emit_pass(self):
        with self.assertRaises(json.JSONDecodeError):
            self.capture('{')
        self.assertEqual(self.retained.read_text(), '{"previous": true}\n')
        self.assertNotIn('PASS:', self.output.getvalue())

    def test_forbidden_commit_fields_cannot_replace_evidence_or_emit_pass(self):
        for field in ['authors', 'messageBody']:
            with self.subTest(field=field), self.assertRaisesRegex(ValueError, field):
                self.capture(json.dumps({'commits': [{'oid': 'abc'}, {field: []}]}))
            self.assertEqual(self.retained.read_text(), '{"previous": true}\n')
            self.assertNotIn('PASS:', self.output.getvalue())

    def test_different_retained_json_cannot_emit_pass(self):
        with patch.object(Path, 'write_text', return_value=0):
            with self.assertRaisesRegex(ValueError, 'differs'):
                self.capture('{"commits":[]}')
        self.assertNotIn('PASS:', self.output.getvalue())

    def test_runner_main_emits_metadata_pass(self):
        script = self.root / 'run_live.py'
        script.write_text(Path(run_live.__file__).read_text())
        for name in ['before', 'after']:
            (self.root / name).mkdir()
        response = '{"commits":[{"oid":"abc"}]}\n'
        result = subprocess.CompletedProcess([], 0, stdout=response)
        with patch.dict(os.environ, {'SOMA_REPO': str(self.root), 'PI_PACKAGE_DIR': str(self.root)}):
            with patch.object(subprocess, 'run', return_value=result), redirect_stdout(self.output):
                runpy.run_path(str(script), run_name='__main__')
        self.assertIn('PASS: fresh query JSON parses, equals retained pr-metadata.json', self.output.getvalue())
        self.assertIn('PASS: fresh query JSON parses, equals retained pr-metadata.json', (self.root / 'live-transcript.txt').read_text())


if __name__ == '__main__':
    unittest.main()
