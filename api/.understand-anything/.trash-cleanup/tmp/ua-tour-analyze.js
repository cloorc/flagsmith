#!/usr/bin/env node
'use strict';

const fs = require('fs');

function main() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];
  if (!inputPath || !outputPath) {
    process.stderr.write('Usage: node ua-tour-analyze.js <input.json> <output.json>\n');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const nodes = data.nodes || [];
  const edges = data.edges || [];
  const layers = data.layers || [];

  const nodeById = new Map();
  nodes.forEach((n) => nodeById.set(n.id, n));

  // --- Fan-in / Fan-out counts (all edge types) ---
  const fanIn = new Map();
  const fanOut = new Map();
  nodes.forEach((n) => {
    fanIn.set(n.id, 0);
    fanOut.set(n.id, 0);
  });
  edges.forEach((e) => {
    if (fanOut.has(e.source)) fanOut.set(e.source, fanOut.get(e.source) + 1);
    if (fanIn.has(e.target)) fanIn.set(e.target, fanIn.get(e.target) + 1);
  });

  const nameOf = (id) => (nodeById.get(id) ? nodeById.get(id).name : id);
  const summaryOf = (id) => (nodeById.get(id) ? nodeById.get(id).summary : '');
  const typeOf = (id) => (nodeById.get(id) ? nodeById.get(id).type : '');

  const fanInRanking = [...fanIn.entries()]
    .map(([id, v]) => ({ id, fanIn: v, name: nameOf(id) }))
    .sort((a, b) => b.fanIn - a.fanIn)
    .slice(0, 20);

  const fanOutRanking = [...fanOut.entries()]
    .map(([id, v]) => ({ id, fanOut: v, name: nameOf(id) }))
    .sort((a, b) => b.fanOut - a.fanOut)
    .slice(0, 20);

  // --- Percentile helpers for entry point scoring ---
  const fanOutValues = [...fanOut.values()].sort((a, b) => a - b);
  const fanInValues = [...fanIn.values()].sort((a, b) => a - b);
  const percentile = (sorted, p) => {
    if (sorted.length === 0) return 0;
    const idx = Math.floor((sorted.length - 1) * p);
    return sorted[idx];
  };
  const fanOutTop10 = percentile(fanOutValues, 0.9); // top 10% threshold
  const fanInBottom25 = percentile(fanInValues, 0.25); // bottom 25% threshold

  // --- Entry point candidates ---
  const codeEntryNames = new Set([
    'index.ts', 'index.js', 'main.ts', 'main.js', 'app.ts', 'app.js',
    'server.ts', 'server.js', 'mod.rs', 'main.go', 'main.py', 'main.rs',
    'manage.py', 'app.py', 'wsgi.py', 'asgi.py', 'run.py', '__main__.py',
    'Application.java', 'Main.java', 'Program.cs', 'config.ru', 'index.php',
    'App.swift', 'Application.kt', 'main.cpp', 'main.c',
  ]);

  const entryScores = [];
  nodes.forEach((n) => {
    let score = 0;
    const fp = n.filePath || '';
    const depth = fp.split('/').length; // 1 = root, 2 = one level deep
    if (n.type === 'document') {
      if (n.name === 'README.md' && depth === 1) score += 5;
      else if (/\.md$/i.test(n.name) && depth === 1) score += 2;
    } else if (n.type === 'file') {
      if (codeEntryNames.has(n.name)) score += 3;
      if (depth <= 2) score += 1;
      if (fanOut.get(n.id) >= fanOutTop10 && fanOutTop10 > 0) score += 1;
      if (fanIn.get(n.id) <= fanInBottom25) score += 1;
    }
    if (score > 0) entryScores.push({ id: n.id, score, name: n.name, summary: n.summary });
  });
  entryScores.sort((a, b) => b.score - a.score);
  const entryPointCandidates = entryScores.slice(0, 5);

  // --- BFS from top CODE entry point (following imports + calls) ---
  const forwardAdj = new Map();
  nodes.forEach((n) => forwardAdj.set(n.id, []));
  edges.forEach((e) => {
    if ((e.type === 'imports' || e.type === 'calls') && forwardAdj.has(e.source)) {
      forwardAdj.get(e.source).push(e.target);
    }
  });

  // Top code entry point = highest scoring non-document candidate
  const codeCandidates = entryScores.filter((c) => typeOf(c.id) !== 'document');
  const startNode = codeCandidates.length ? codeCandidates[0].id : (nodes[0] && nodes[0].id);

  const order = [];
  const depthMap = {};
  if (startNode) {
    const visited = new Set([startNode]);
    let queue = [startNode];
    depthMap[startNode] = 0;
    while (queue.length) {
      const next = [];
      for (const cur of queue) {
        order.push(cur);
        const neighbors = forwardAdj.get(cur) || [];
        for (const nb of neighbors) {
          if (!visited.has(nb)) {
            visited.add(nb);
            depthMap[nb] = depthMap[cur] + 1;
            next.push(nb);
          }
        }
      }
      queue = next;
    }
  }
  const byDepth = {};
  Object.entries(depthMap).forEach(([id, d]) => {
    if (!byDepth[d]) byDepth[d] = [];
    byDepth[d].push(id);
  });

  // --- Non-code file inventory ---
  const nonCodeFiles = { documentation: [], infrastructure: [], data: [], config: [] };
  nodes.forEach((n) => {
    const entry = { id: n.id, name: n.name, type: n.type, summary: n.summary };
    if (n.type === 'document') nonCodeFiles.documentation.push(entry);
    else if (n.type === 'service' || n.type === 'pipeline' || n.type === 'resource') nonCodeFiles.infrastructure.push(entry);
    else if (n.type === 'table' || n.type === 'schema' || n.type === 'endpoint') nonCodeFiles.data.push(entry);
    else if (n.type === 'config') nonCodeFiles.config.push(entry);
  });

  // --- Tightly coupled clusters via bidirectional imports/calls ---
  const relKey = (t) => t === 'imports' || t === 'calls';
  const directed = new Map(); // "src|tgt" -> true
  edges.forEach((e) => {
    if (relKey(e.type)) directed.set(e.source + '|' + e.target, true);
  });
  // adjacency over imports/calls (undirected) for cluster expansion
  const undirAdj = new Map();
  nodes.forEach((n) => undirAdj.set(n.id, new Set()));
  edges.forEach((e) => {
    if (relKey(e.type) && undirAdj.has(e.source) && undirAdj.has(e.target)) {
      undirAdj.get(e.source).add(e.target);
      undirAdj.get(e.target).add(e.source);
    }
  });

  const seedClusters = [];
  const seenPair = new Set();
  directed.forEach((_v, key) => {
    const [a, b] = key.split('|');
    if (directed.has(b + '|' + a)) {
      const pk = [a, b].sort().join('||');
      if (!seenPair.has(pk)) {
        seenPair.add(pk);
        seedClusters.push(new Set([a, b]));
      }
    }
  });

  // Expand each seed cluster: add nodes connected to >=2 current members, up to 5 total
  const clusters = [];
  for (const seed of seedClusters) {
    const members = new Set(seed);
    let changed = true;
    while (changed && members.size < 5) {
      changed = false;
      const candidates = new Map();
      for (const m of members) {
        for (const nb of undirAdj.get(m) || []) {
          if (!members.has(nb)) candidates.set(nb, (candidates.get(nb) || 0) + 1);
        }
      }
      // pick the best candidate connected to >=2 members
      let best = null;
      let bestCount = 1;
      for (const [c, cnt] of candidates) {
        if (cnt >= 2 && cnt > bestCount) { best = c; bestCount = cnt; }
      }
      if (best) { members.add(best); changed = true; }
    }
    // count edges among members
    let edgeCount = 0;
    const arr = [...members];
    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < arr.length; j++) {
        if (i !== j && directed.has(arr[i] + '|' + arr[j])) edgeCount++;
      }
    }
    clusters.push({ nodes: arr, edgeCount });
  }
  // dedupe identical clusters, sort by edgeCount, keep top 10
  const clusterSeen = new Set();
  const uniqueClusters = [];
  clusters.sort((a, b) => b.edgeCount - a.edgeCount);
  for (const c of clusters) {
    const key = [...c.nodes].sort().join('||');
    if (!clusterSeen.has(key)) {
      clusterSeen.add(key);
      uniqueClusters.push(c);
    }
  }
  const topClusters = uniqueClusters.slice(0, 10);

  // --- Layer list ---
  const layerOut = {
    count: layers.length,
    list: layers.map((l) => ({ id: l.id, name: l.name, description: l.description })),
  };

  // --- Node summary index ---
  const nodeSummaryIndex = {};
  nodes.forEach((n) => {
    nodeSummaryIndex[n.id] = { name: n.name, type: n.type, summary: n.summary };
  });

  const result = {
    scriptCompleted: true,
    entryPointCandidates,
    fanInRanking,
    fanOutRanking,
    bfsTraversal: { startNode, order, depthMap, byDepth },
    nonCodeFiles,
    clusters: topClusters,
    layers: layerOut,
    nodeSummaryIndex,
    totalNodes: nodes.length,
    totalEdges: edges.length,
  };

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  process.exit(0);
}

try {
  main();
} catch (err) {
  process.stderr.write('Fatal error: ' + (err && err.stack ? err.stack : String(err)) + '\n');
  process.exit(1);
}
