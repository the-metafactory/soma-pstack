from contextlib import redirect_stdout
import importlib.util
import io
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch


SCRIPT = Path(__file__).resolve().with_name('review.py')
SPEC = importlib.util.spec_from_file_location('reflect_review', SCRIPT)
review = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(review)


class ReviewRunnerTest(unittest.TestCase):
    def test_existing_round_artifacts_are_preserved(self):
        for round_name in review.ROUNDS:
            for suffix in review.ARTIFACT_SUFFIXES:
                with self.subTest(round_name=round_name, suffix=suffix), tempfile.TemporaryDirectory() as scratch:
                    output = Path(scratch)
                    artifact = output / f'{round_name}{suffix}'
                    original = b'preserved historical evidence\n'
                    artifact.write_bytes(original)
                    result = SimpleNamespace(returncode=0, stdout='{"result": "new review"}', stderr='')
                    with patch.object(review, 'OUT', output), patch.object(
                        review.subprocess, 'run', return_value=result
                    ) as run, patch.dict(
                        review.os.environ, {'ANTHROPIC_BASE_URL': 'https://api.anthropic.com'}
                    ), redirect_stdout(io.StringIO()):
                        with self.assertRaises(FileExistsError):
                            review.run_review(round_name)
                    run.assert_not_called()
                    self.assertEqual(artifact.read_bytes(), original)
                    self.assertEqual(list(output.iterdir()), [artifact])

    def test_cli_requires_an_explicit_round(self):
        with tempfile.TemporaryDirectory() as scratch:
            root = Path(scratch)
            script = root / 'docs/verification/node-10/review.py'
            script.parent.mkdir(parents=True)
            shutil.copyfile(SCRIPT, script)
            for name in review.BASE_FILES:
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text('test evidence\n')
            result = subprocess.run(
                [sys.executable, str(script)], text=True, capture_output=True,
                env={**review.os.environ, 'PATH': '', 'ANTHROPIC_BASE_URL': 'https://api.anthropic.com'},
            )
            self.assertEqual(result.returncode, 2, result.stderr)
            self.assertIn('required: round', result.stderr)
            self.assertFalse((script.parent / 'review-inputs.json').exists())

    def test_failed_follow_up_points_to_existing_stderr_file(self):
        for stderr in ('review service unavailable', ''):
            with self.subTest(stderr=stderr), tempfile.TemporaryDirectory() as scratch:
                output = Path(scratch)
                result = SimpleNamespace(returncode=7, stdout='', stderr=stderr)
                with patch.object(review, 'OUT', output), patch.object(
                    review.subprocess, 'run', return_value=result
                ), patch.dict(review.os.environ, {'ANTHROPIC_BASE_URL': 'https://api.anthropic.com'}):
                    with self.assertRaises(RuntimeError) as failure:
                        review.run_review('review-round-3')
                stderr_path = output / 'review-round-3-stderr.txt'
                self.assertIn(str(stderr_path), str(failure.exception))
                self.assertEqual(stderr_path.read_text(), stderr)

    def test_fresh_output_sends_current_files_and_saves_response(self):
        for round_name in ('review-round-3', 'review-trail'):
            with self.subTest(round_name=round_name):
                self.check_fresh_round(round_name)

    def check_fresh_round(self, round_name):
        response = {'result': 'Verdict: concerns', 'is_error': False, 'modelUsage': {'test-model': {}}}
        result = SimpleNamespace(returncode=0, stdout=json.dumps(response), stderr='')
        with tempfile.TemporaryDirectory() as scratch:
            output = Path(scratch)
            with patch.object(review, 'OUT', output), patch.object(
                review.subprocess, 'run', return_value=result
            ) as run, patch.dict(
                review.os.environ, {'ANTHROPIC_BASE_URL': 'https://api.anthropic.com'}
            ), redirect_stdout(io.StringIO()):
                review.run_review(round_name)
            sent = run.call_args.kwargs['input']
            self.assertIn(SCRIPT.read_text(), sent)
            inputs = json.loads((output / f'{round_name}-inputs.json').read_text())
            self.assertNotIn('docs/verification/node-10/review-disposition.md', inputs['sha256'])
            self.assertNotIn('docs/verification/node-10/review-round-2.md', inputs['sha256'])
            self.assertIn('docs/verification/node-10/README.md', inputs['sha256'])
            self.assertIn('docs/verification/node-10/finish-pass.md', inputs['sha256'])
            self.assertEqual((output / f'{round_name}.md').read_text(), response['result'] + '\n')
            self.assertEqual(json.loads((output / f'{round_name}-response.json').read_text()), response)


if __name__ == '__main__':
    unittest.main()
