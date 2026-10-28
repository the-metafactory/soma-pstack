const out = process.argv[2]!;
const font = `font-family="Helvetica, Arial, sans-serif"`;
const merges = [
  { x: 300, label: "8 members say when to load", pr: "#39" },
  { x: 570, label: "Plain bun test passes", pr: "#41" },
  { x: 840, label: "Playbook cards in the pack", pr: "#42" },
  { x: 1110, label: "Six new cards", pr: "#43" },
];
const ports = ["arena", "interrogate", "figure-it-out", "automate-me", "ketchup-video", "maintain-verification-skill"];
function svg(step: number): string {
  const parts: string[] = [];
  parts.push(`<rect width="1920" height="920" fill="#f8fafc"/>`);
  parts.push(`<text x="120" y="80" ${font} font-size="40" fill="#475569">soma-pstack main</text>`);
  parts.push(`<line x1="100" y1="360" x2="1260" y2="360" stroke="#334155" stroke-width="10" stroke-linecap="round"/>`);
  merges.forEach((m, i) => {
    const shown = step >= 2 || i < 2;
    if (!shown) return;
    const fresh = (step === 1 && i < 2) || (step === 2 && i >= 2);
    if (fresh) parts.push(`<circle cx="${m.x}" cy="360" r="46" fill="#fde047"/>`);
    parts.push(`<circle cx="${m.x}" cy="360" r="28" fill="#16a34a"/>`);
    const y = i % 2 === 0 ? 280 : 470;
    parts.push(`<text x="${m.x}" y="${y}" text-anchor="middle" ${font} font-size="40" fill="#0f172a">${m.label}</text>`);
    parts.push(`<text x="${m.x}" y="${y + (i % 2 === 0 ? -50 : 50)}" text-anchor="middle" ${font} font-size="34" fill="#64748b">${m.pr}</text>`);
  });
  if (step >= 3) {
    ports.forEach((name, i) => {
      const y = 130 + i * 112;
      const fresh = step === 3;
      parts.push(`<path d="M1260 360 C 1340 360, 1340 ${y}, 1410 ${y} L 1880 ${y}" fill="none" stroke="${fresh ? "#fde047" : "none"}" stroke-width="22"/>`);
      parts.push(`<path d="M1260 360 C 1340 360, 1340 ${y}, 1410 ${y} L 1880 ${y}" fill="none" stroke="#d97706" stroke-width="8" stroke-dasharray="18 12"/>`);
      parts.push(`<text x="1420" y="${y - 20}" ${font} font-size="36" fill="#0f172a">${name}</text>`);
    });
  }
  if (step >= 4) {
    parts.push(`<rect x="160" y="640" width="560" height="130" rx="16" fill="#e2e8f0" stroke="#fde047" stroke-width="10"/>`);
    parts.push(`<text x="440" y="700" text-anchor="middle" ${font} font-size="34" fill="#0f172a">Pack declares its nudges</text>`);
    parts.push(`<text x="440" y="750" text-anchor="middle" ${font} font-size="34" fill="#64748b">#40</text>`);
    parts.push(`<rect x="880" y="640" width="400" height="130" rx="16" fill="#e2e8f0" stroke="#fde047" stroke-width="10"/>`);
    parts.push(`<text x="1080" y="700" text-anchor="middle" ${font} font-size="34" fill="#0f172a">Soma change, open</text>`);
    parts.push(`<text x="1080" y="750" text-anchor="middle" ${font} font-size="34" fill="#64748b">soma #1105</text>`);
    parts.push(`<defs><marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto"><path d="M0,0 L12,6 L0,12 z" fill="#64748b"/></marker></defs>`);
    parts.push(`<line x1="725" y1="705" x2="868" y2="705" stroke="#64748b" stroke-width="6" stroke-dasharray="14 10" marker-end="url(#arrow)"/>`);
    parts.push(`<text x="800" y="620" text-anchor="middle" ${font} font-size="34" fill="#64748b">waits on</text>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="920" viewBox="0 0 1920 920">\n${parts.join("\n")}\n</svg>\n`;
}
for (const step of [1, 2, 3, 4]) await Bun.write(`${out}/0${step}.svg`, svg(step));
await Bun.write(`${out}/deck.json`, JSON.stringify({ slides: [
  { src: "01.svg", subtitle: "Two fixes landed: members say when to load, tests run clean" },
  { src: "02.svg", subtitle: "The playbook cards now ship in this pack, six of them new" },
  { src: "03.svg", subtitle: "Six more skills are being ported side by side right now" },
  { src: "04.svg", subtitle: "Pack nudges cannot start until a Soma change lands" },
] }, null, 2) + "\n");
