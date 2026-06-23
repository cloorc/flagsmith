#!/usr/bin/env node
const fs = require('fs');
const INTER = '/Users/wadii/flagsmith-projects/flagsmith/api/.understand-anything/intermediate';
const COMMIT = '57338f5f08571d23b32688e25b684ed4171dd018';

const graph = JSON.parse(fs.readFileSync(`${INTER}/assembled-graph.json`, 'utf8'));
const scan = JSON.parse(fs.readFileSync(`${INTER}/scan-result.json`, 'utf8'));
const nodeIds = new Set(graph.nodes.map(n => n.id));

// --- Layers: normalize ---
let layersRaw = JSON.parse(fs.readFileSync(`${INTER}/layers.json`, 'utf8'));
let layers = Array.isArray(layersRaw) ? layersRaw : (layersRaw.layers || []);
layers = layers.map(L => {
  let nodeIdsArr = L.nodeIds || L.nodes || [];
  nodeIdsArr = nodeIdsArr.map(x => (typeof x === 'object' && x.id) ? x.id : x);
  nodeIdsArr = nodeIdsArr.filter(id => nodeIds.has(id));
  return {
    id: L.id || ('layer:' + String(L.name || 'unnamed').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')),
    name: L.name,
    description: L.description,
    nodeIds: nodeIdsArr,
  };
});

// --- Tour: normalize ---
let tourRaw = JSON.parse(fs.readFileSync(`${INTER}/tour.json`, 'utf8'));
let tour = Array.isArray(tourRaw) ? tourRaw : (tourRaw.steps || tourRaw.tour || []);
tour = tour.map(s => {
  let ids = s.nodeIds || s.nodesToInspect || [];
  ids = ids.map(x => (typeof x === 'object' && x.id) ? x.id : x).filter(id => nodeIds.has(id));
  const out = {
    order: s.order,
    title: s.title,
    description: s.description || s.whyItMatters,
    nodeIds: ids,
  };
  if (s.languageLesson) out.languageLesson = s.languageLesson;
  return out;
}).sort((a, b) => a.order - b.order);

const kg = {
  version: '1.0.0',
  project: {
    name: scan.projectName || 'flagsmith-api',
    languages: scan.languages || ['Python'],
    frameworks: scan.frameworks || ['Django'],
    description: (scan.projectDescription || 'The Django + Django REST Framework backend for the Flagsmith feature-flag and remote-config platform.') + ' (Scoped to the 12 core domain apps: features, environments, projects, organisations, segments, segment_membership, users, permissions, api_keys, audit, metadata, experimentation.)',
    analyzedAt: new Date().toISOString(),
    gitCommitHash: COMMIT,
  },
  nodes: graph.nodes,
  edges: graph.edges,
  layers,
  tour,
};

fs.writeFileSync(`${INTER}/assembled-graph.json`, JSON.stringify(kg, null, 2));
console.log('Assembled KnowledgeGraph:');
console.log('  project:', kg.project.name);
console.log('  languages:', JSON.stringify(kg.project.languages));
console.log('  frameworks:', JSON.stringify(kg.project.frameworks));
console.log('  nodes:', kg.nodes.length, 'edges:', kg.edges.length);
console.log('  layers:', kg.layers.length, 'tour steps:', kg.tour.length);
