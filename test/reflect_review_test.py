from contextlib import redirect_stdout
import importlib.util
import io
import json
from pathlib import Path
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch


SCRIPT = Path(__file__).resolve().parents[1] / 'docs/verification/node-10/review.py'
SPEC = importlib.util.spec_from_file_location('reflect_review', SCRIPT)
review = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(review)


class ReviewRunnerTest(unittest.TestCase):
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

    def test_fresh_round_sends_current_files_and_saves_response(self):
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
            self.assertEqual((output / f'{round_name}.md').read_text(), response['result'] + '\n')
            self.assertEqual(json.loads((output / f'{round_name}-response.json').read_text()), response)


if __name__ == '__main__':
    unittest.main()
