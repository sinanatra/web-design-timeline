const VIEW_H = 769.1;
const AXIS_Y = 688.2;
const AXIS_X0 = 11.8;
const YEAR_X0 = 1990;
const YEAR_X1 = 2022;
const TOP_MARGIN = 20;
const RIGHT_PAD = 40;
const BASE_PAD = 14;
const LINE_H = 16;
const CHAR_W = 6.6;
const GAP = 6;

const TREND_Y_BASE = AXIS_Y - 9;
const TREND_Y_TOP = 299;

const xScale = d3
  .scaleLinear()
  .domain([YEAR_X0, YEAR_X1])
  .range([11.7, 1451.1]);

function parseTables(md) {
  const tables = {};
  const lines = md.split("\n");
  let currentHeading = null;
  let buffer = [];
  function flush() {
    if (currentHeading && buffer.length)
      tables[currentHeading] = parseTable(buffer);
    buffer = [];
  }
  for (const line of lines) {
    const h = line.match(/^##\s+(.+)/);
    if (h) {
      flush();
      currentHeading = h[1].trim();
      continue;
    }
    if (line.trim().startsWith("|")) buffer.push(line);
  }
  flush();
  return tables;
}

function parseTable(lines) {
  if (lines.length < 2) return [];
  const split = (l) =>
    l
      .trim()
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((c) => c.trim());
  const headers = split(lines[0]).map((h) => h.toLowerCase());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (/^[-:\s|]+$/.test(lines[i])) continue;
    const cells = split(lines[i]);
    const row = {};
    headers.forEach((h, idx) => (row[h] = cells[idx] ?? ""));
    rows.push(row);
  }
  return rows;
}

function typeColor(type, typeColors) {
  if (typeColors[type]) return typeColors[type];
  if (/^#/.test(type)) return type;
  return "#333333";
}

function estimateWidth(label) {
  return Math.ceil(label.length * CHAR_W);
}

function layoutBranch(items, branch, endYear) {
  const riseFrac = branch.rise / 100;
  const maxRise = AXIS_Y - BASE_PAD - TOP_MARGIN;
  const startYear = d3.min(items, (it) => it.date);
  const placed = [];
  const sorted = [...items].sort((a, b) => a.date - b.date);
  for (const it of sorted) {
    const x = xScale(it.date);
    const frac = Math.max(
      0,
      Math.min(1, (it.date - startYear) / (endYear - startYear)),
    );
    let y = AXIS_Y - BASE_PAD - riseFrac * maxRise * frac;
    const w = estimateWidth(it.label);
    const x1 = x - GAP,
      x2 = x + w + GAP;
    let moved = true;
    while (moved) {
      moved = false;
      for (const p of placed) {
        if (x1 < p.x2 && x2 > p.x1 && Math.abs(y - p.y) < LINE_H) {
          y -= LINE_H;
          moved = true;
        }
      }
    }
    placed.push({ x1, x2, y });
    it.x = x;
    it.y = y;
  }
  return sorted;
}

async function render() {
  const wrap = d3.select("#chart-wrap");
  const errorBox = document.getElementById("error");
  let md, ngrams;
  try {
    const [mdRes, ngramsRes] = await Promise.all([
      fetch("data/timeline.md"),
      fetch("data/ngrams.json"),
    ]);
    if (!mdRes.ok) throw new Error(`HTTP ${mdRes.status}`);
    if (!ngramsRes.ok) throw new Error(`HTTP ${ngramsRes.status}`);
    md = await mdRes.text();
    ngrams = await ngramsRes.json();
  } catch (e) {
    errorBox.textContent =
      "Couldn't load chart data (" +
      e.message +
      ").\n" +
      "Browsers block fetch() of local files opened directly — serve this folder instead, e.g.:\n" +
      "  cd " +
      location.pathname.replace(/\/index\.html$/, "") +
      "\n  python3 -m http.server 8000\nthen open http://localhost:8000/";
    return;
  }

  const tables = parseTables(md);
  const branchRows = tables["Branches"] || [];
  const typeRows = tables["Types"] || [];
  const phaseRows = tables["Phases"] || [];
  const itemRows = tables["Items"] || [];

  const branches = {};
  for (const r of branchRows) {
    branches[r.id] = {
      id: r.id,
      label: r.label,
      rise: parseFloat(r.rise),
      color: r.color || "#9B9B9B",
    };
  }

  const typeColors = {};
  for (const r of typeRows) typeColors[r.type] = r.color;

  const items = itemRows
    .filter((r) => r.date && r.label)
    .map((r) => ({
      date: parseFloat(r.date),
      label: r.label,
      branch: r.branch,
      type: r.type,
      link: r.link,
      color: typeColor(r.type, typeColors),
    }));

  const maxDate = Math.max(YEAR_X1, ...items.map((it) => it.date));

  const laidOutByBranch = {};
  let maxX2 = xScale(maxDate);
  for (const id of Object.keys(branches)) {
    const branchItems = items.filter((it) => it.branch === id);
    if (!branchItems.length) continue;
    const laidOut = layoutBranch(branchItems, branches[id], maxDate);
    laidOutByBranch[id] = laidOut;
    maxX2 = Math.max(
      maxX2,
      ...laidOut.map((it) => it.x + estimateWidth(it.label)),
    );
  }

  const AXIS_X1 = Math.max(xScale(YEAR_X1), maxX2) + RIGHT_PAD;
  const VIEW_W = AXIS_X1 + 20;

  wrap.selectAll("*").remove();
  const svg = wrap
    .append("svg")
    .attr("viewBox", `0 0 ${VIEW_W} ${VIEW_H}`)
    .attr("width", VIEW_W)
    .attr("height", VIEW_H)
    .attr("xmlns", "http://www.w3.org/2000/svg");

  const axisG = svg.append("g");
  axisG
    .append("path")
    .attr("d", `M${AXIS_X1},${AXIS_Y}H${AXIS_X0}`)
    .attr("fill", "none")
    .attr("stroke", "#000")
    .attr("stroke-width", 0.5)
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round");
  axisG
    .selectAll("text")
    .data(d3.range(1990, Math.ceil(maxDate) + 3, 2))
    .join("text")
    .attr("x", (d) => xScale(d))
    .attr("y", AXIS_Y + 18)
    .attr("font-size", 14)
    .text((d) => d);

  const lineG = svg.append("g");
  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(ngrams.values))
    .range([TREND_Y_BASE, TREND_Y_TOP]);
  const trendLine = d3
    .line()
    .x((_, i) => xScale(ngrams.startYear + i))
    .y((d) => yScale(d))
    .curve(d3.curveCatmullRom.alpha(0.5));
  lineG
    .append("path")
    .attr("d", trendLine(ngrams.values))
    .attr("fill", "none")
    .attr("stroke", "#0000FF")
    .attr("stroke-width", 0.5);

  const lastX = xScale(ngrams.startYear + ngrams.values.length - 1);
  const lastY = yScale(ngrams.values[ngrams.values.length - 1]);
  if (AXIS_X1 - RIGHT_PAD > lastX) {
    lineG
      .append("path")
      .attr("d", `M${lastX},${lastY}L${AXIS_X1 - RIGHT_PAD},${lastY}`)
      .attr("fill", "none")
      .attr("stroke", "#0000FF")
      .attr("stroke-width", 0.5)
      .attr("stroke-dasharray", "2,4");
  }
  lineG
    .append("text")
    .attr("x", lastX + 10)
    .attr("y", lastY - 6)
    .attr("fill", "#0000FF")
    .attr("font-size", 14.91)
    .text("Web Design");

  const phaseG = svg.append("g");
  for (const p of phaseRows) {
    if (!p.date) continue;
    const x = xScale(parseFloat(p.date));
    const dashed = (p.style || "").toLowerCase() === "dashed";
    const line = phaseG
      .append("line")
      .attr("x1", x)
      .attr("y1", dashed ? 348 : TOP_MARGIN)
      .attr("x2", x)
      .attr("y2", 733)
      .attr("stroke", "#000")
      .attr("stroke-width", 0.5)
      .attr("stroke-linecap", "round");
    if (dashed) line.attr("stroke-dasharray", "0,0,3,10");
    phaseG
      .append("text")
      .attr("x", x + 8)
      .attr("y", 733.6)
      .attr("font-size", 14)
      .text(p.label);
  }

  const branchG = svg.append("g");
  for (const id of Object.keys(branches)) {
    const branch = branches[id];
    const laidOut = laidOutByBranch[id];
    if (!laidOut || !laidOut.length) continue;
    const dividerX = xScale(d3.min(laidOut, (it) => it.date));
    branchG
      .append("line")
      .attr("x1", dividerX)
      .attr("y1", AXIS_Y)
      .attr("x2", dividerX)
      .attr("y2", 733)
      .attr("stroke", branch.color)
      .attr("stroke-width", 0.5)
      .attr("stroke-linejoin", "round");
    branchG
      .append("text")
      .attr("x", dividerX + 8)
      .attr("y", 733.6)
      .attr("fill", branch.color)
      .attr("font-size", 14)
      .text(branch.label);

    for (const it of laidOut) {
      const target = it.link
        ? branchG
            .append("a")
            .attr("href", it.link)
            .attr("target", "_blank")
            .attr("class", "item-link")
        : branchG;
      target
        .append("text")
        .attr("x", it.x)
        .attr("y", it.y)
        .attr("fill", it.color)
        .attr("font-size", 14)
        .text(it.label);
    }
  }
}

render();
