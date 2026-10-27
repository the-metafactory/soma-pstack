import re, sys
text = open(sys.argv[1]).read()
def words(s):
    s = re.sub(r"```mermaid.*?```", "", s, flags=re.S)
    s = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", s)
    return len(re.findall(r"[A-Za-z0-9][A-Za-z0-9'’/.\-]*", s))
print("total words (pictures excluded):", words(text))
for m in re.finditer(r"```mermaid(.*?)```", text, flags=re.S):
    labels = re.findall(r"\[\"?([^\]\"]+)\"?\]|\(\"?([^)\"]+)\"?\)", m.group(1))
    labels = [a or b for a, b in labels]
    print("mermaid boxes:", len(labels), "max words/box:", max((len(l.split()) for l in labels), default=0), labels)
for line in text.splitlines():
    if re.match(r"\s*[-*]?\s*\*{0,2}D\d", line):
        print(f"item words {words(line):3d}: {line[:70]}")
