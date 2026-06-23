#!/usr/bin/env node
"use strict";

const fs = require("fs");

function main() {
  const inPath = process.argv[2];
  const outPath = process.argv[3];
  if (!inPath || !outPath) {
    console.error("usage: node ua-arch-analyze.js <input.json> <output.json>");
    process.exit(1);
  }

  const input = JSON.parse(fs.readFileSync(inPath, "utf8"));
  const fileNodes = input.fileNodes || [];
  const importEdges = input.importEdges || [];
  const allEdges = input.allEdges || [];

  const byId = new Map();
  for (const n of fileNodes) byId.set(n.id, n);

  const pathOf = (n) => n.filePath || n.name || n.id.split(":").slice(1).join(":");

  // ---- Common prefix across all file paths ----
  const paths = fileNodes.map(pathOf);
  function commonPrefixDir(paths) {
    if (paths.length === 0) return "";
    const split = paths.map((p) => p.split("/"));
    let prefix = [];
    const first = split[0];
    for (let i = 0; i < first.length - 1; i++) {
      const seg = first[i];
      if (split.every((parts) => parts.length > i + 1 && parts[i] === seg)) {
        prefix.push(seg);
      } else break;
    }
    return prefix.length ? prefix.join("/") + "/" : "";
  }
  const prefix = commonPrefixDir(paths);

  // ---- A. Directory grouping ----
  const directoryGroups = {};
  const groupOfFile = new Map();
  for (const n of fileNodes) {
    let p = pathOf(n);
    if (prefix && p.startsWith(prefix)) p = p.slice(prefix.length);
    const parts = p.split("/");
    const group = parts.length > 1 ? parts[0] : "(root)";
    if (!directoryGroups[group]) directoryGroups[group] = [];
    directoryGroups[group].push(n.id);
    groupOfFile.set(n.id, group);
  }

  // ---- B. Node type grouping ----
  const nodeTypeGroups = {};
  for (const n of fileNodes) {
    if (!nodeTypeGroups[n.type]) nodeTypeGroups[n.type] = [];
    nodeTypeGroups[n.type].push(n.id);
  }

  // ---- C. Import adjacency / fan-in / fan-out ----
  const fanOut = {};
  const fanIn = {};
  for (const n of fileNodes) {
    fanOut[n.id] = 0;
    fanIn[n.id] = 0;
  }
  for (const e of importEdges) {
    if (fanOut[e.source] !== undefined) fanOut[e.source]++;
    if (fanIn[e.target] !== undefined) fanIn[e.target]++;
  }
  const fileFanOut = {};
  const fileFanIn = {};
  for (const id of Object.keys(fanOut)) if (fanOut[id] > 0) fileFanOut[id] = fanOut[id];
  for (const id of Object.keys(fanIn)) if (fanIn[id] > 0) fileFanIn[id] = fanIn[id];

  // ---- D. Cross-category dependency analysis (allEdges by node type) ----
  const crossMap = {};
  for (const e of allEdges) {
    const s = byId.get(e.source);
    const t = byId.get(e.target);
    if (!s || !t) continue;
    if (s.type === t.type && s.type === "file") continue; // skip pure file->file (counted in interGroup)
    const key = `${s.type}|${t.type}|${e.type}`;
    crossMap[key] = (crossMap[key] || 0) + 1;
  }
  const crossCategoryEdges = Object.entries(crossMap).map(([k, count]) => {
    const [fromType, toType, edgeType] = k.split("|");
    return { fromType, toType, edgeType, count };
  }).sort((a, b) => b.count - a.count);

  // ---- E. Inter-group import frequency ----
  const interMap = {};
  for (const e of importEdges) {
    const gs = groupOfFile.get(e.source);
    const gt = groupOfFile.get(e.target);
    if (gs === undefined || gt === undefined || gs === gt) continue;
    const key = `${gs}|${gt}`;
    interMap[key] = (interMap[key] || 0) + 1;
  }
  const interGroupImports = Object.entries(interMap).map(([k, count]) => {
    const [from, to] = k.split("|");
    return { from, to, count };
  }).sort((a, b) => b.count - a.count);

  // ---- F. Intra-group density ----
  const intraGroupDensity = {};
  const groupTotal = {};
  const groupInternal = {};
  for (const grp of Object.keys(directoryGroups)) { groupTotal[grp] = 0; groupInternal[grp] = 0; }
  for (const e of importEdges) {
    const gs = groupOfFile.get(e.source);
    const gt = groupOfFile.get(e.target);
    if (gs !== undefined) { groupTotal[gs]++; if (gs === gt) groupInternal[gs]++; }
    if (gt !== undefined && gt !== gs) groupTotal[gt]++;
  }
  for (const grp of Object.keys(directoryGroups)) {
    const total = groupTotal[grp];
    const internal = groupInternal[grp];
    intraGroupDensity[grp] = {
      internalEdges: internal,
      totalEdges: total,
      density: total > 0 ? +(internal / total).toFixed(3) : 0,
    };
  }

  // ---- G. Directory & file pattern matching ----
  const dirPatterns = [
    [["routes", "api", "controllers", "endpoints", "handlers"], "api"],
    [["services", "core", "lib", "domain", "logic"], "service"],
    [["models", "db", "data", "persistence", "repository", "entities"], "data"],
    [["components", "views", "pages", "ui", "layouts", "screens"], "ui"],
    [["middleware", "plugins", "interceptors", "guards"], "middleware"],
    [["utils", "helpers", "common", "shared", "tools"], "utility"],
    [["config", "constants", "env", "settings"], "config"],
    [["__tests__", "test", "tests", "spec", "specs"], "test"],
    [["types", "interfaces", "schemas", "contracts", "dtos"], "types"],
    [["hooks"], "hooks"],
    [["store", "state", "reducers", "actions", "slices"], "state"],
    [["assets", "static", "public"], "assets"],
    [["migrations"], "data"],
    [["management", "commands"], "config"],
    [["templatetags"], "utility"],
    [["signals"], "service"],
    [["serializers"], "api"],
    [["docs", "documentation", "wiki"], "documentation"],
    [["deploy", "deployment", "infra", "infrastructure"], "infrastructure"],
    [[".github", ".gitlab", ".circleci"], "ci-cd"],
    [["k8s", "kubernetes", "helm", "charts"], "infrastructure"],
    [["terraform", "tf"], "infrastructure"],
    [["docker"], "infrastructure"],
    [["sql", "database"], "data"],
    [["dynamodb"], "data"],
    [["permissions"], "middleware"],
  ];
  const dirLabel = (name) => {
    for (const [keys, label] of dirPatterns) if (keys.includes(name)) return label;
    return null;
  };
  const patternMatches = {};
  for (const grp of Object.keys(directoryGroups)) {
    const lbl = dirLabel(grp);
    if (lbl) patternMatches[grp] = lbl;
  }

  // file-level pattern classification (per-file role hints)
  function fileRole(n) {
    const p = pathOf(n);
    const base = p.split("/").pop();
    if (/(\.test\.|\.spec\.)/.test(base) || /^test_.*\.py$/.test(base) || /_test\.go$/.test(base) || /Test\.java$/.test(base) || /_spec\.rb$/.test(base) || /Tests\.cs$/.test(base)) return "test";
    if (/\.d\.ts$/.test(base)) return "types";
    if (/\/tests?\//.test("/" + p + "/") || /(^|\/)conftest\.py$/.test(p)) return "test";
    if (base === "manage.py" && !p.includes("/")) return "entry";
    if (base === "wsgi.py" || base === "asgi.py") return "config";
    if (base === "Dockerfile" || /^docker-compose\./.test(base)) return "infrastructure";
    if (/\.(tf|tfvars)$/.test(base)) return "infrastructure";
    if (base === "Makefile" || base === "Procfile") return "infrastructure";
    if (/\.sql$/.test(base)) return "data";
    if (/\.(graphql|gql|proto)$/.test(base)) return "types";
    if (/\.(md|rst)$/.test(base)) return "documentation";
    // Django per-app role conventions
    if (base === "models.py" || base === "managers.py") return "data";
    if (base === "serializers.py" || base === "serializers_mixins.py") return "api";
    if (base === "views.py" || base === "urls.py" || base === "admin.py") return "api";
    if (base === "services.py" || base === "tasks.py" || base === "signals.py" || base === "receivers.py") return "service";
    if (base === "permissions.py" || base === "authentication.py" || base === "middleware.py") return "middleware";
    if (base === "apps.py") return "config";
    if (base === "constants.py" || base === "enums.py" || base === "exceptions.py") return "config";
    if (base === "types.py" || base === "dataclasses.py" || base === "fields.py" || base === "schemas.py") return "types";
    return null;
  }
  const fileRoles = {};
  const roleCounts = {};
  for (const n of fileNodes) {
    const r = fileRole(n);
    if (r) {
      fileRoles[n.id] = r;
      roleCounts[r] = (roleCounts[r] || 0) + 1;
    }
  }

  // ---- H. Deployment topology ----
  const infraFiles = [];
  let hasDockerfile = false, hasCompose = false, hasK8s = false, hasTerraform = false, hasCI = false;
  for (const n of fileNodes) {
    const p = pathOf(n);
    const base = p.split("/").pop();
    if (base === "Dockerfile") { hasDockerfile = true; infraFiles.push(p); }
    if (/^docker-compose\./.test(base)) { hasCompose = true; infraFiles.push(p); }
    if (/\.(tf|tfvars)$/.test(base)) { hasTerraform = true; infraFiles.push(p); }
    if (p.includes("k8s") || p.includes("kubernetes") || p.includes("helm")) { hasK8s = true; infraFiles.push(p); }
    if (/\.github\/workflows\//.test(p) || base === ".gitlab-ci.yml" || base === "Jenkinsfile") { hasCI = true; infraFiles.push(p); }
    if (p.startsWith(".ebextensions")) { infraFiles.push(p); }
    if (base === "Makefile" || base === "Procfile") { infraFiles.push(p); }
  }
  const deploymentTopology = { hasDockerfile, hasCompose, hasK8s, hasTerraform, hasCI, infraFiles: [...new Set(infraFiles)] };

  // ---- I. Data pipeline ----
  const schemaFiles = [], migrationFiles = [], dataModelFiles = [], apiHandlerFiles = [];
  for (const n of fileNodes) {
    const p = pathOf(n);
    const base = p.split("/").pop();
    if (/\.(sql|graphql|gql|proto)$/.test(base)) schemaFiles.push(p);
    if (/migrations?\//.test(p)) migrationFiles.push(p);
    if (base === "models.py") dataModelFiles.push(p);
    if (base === "views.py" || base === "urls.py") apiHandlerFiles.push(p);
  }
  const dataPipeline = { schemaFiles, migrationFiles, dataModelFiles, apiHandlerFiles };

  // ---- J. Documentation coverage ----
  const docGroups = new Set();
  for (const n of fileNodes) {
    const p = pathOf(n);
    if (/\.(md|rst)$/.test(p)) {
      const g = groupOfFile.get(n.id);
      docGroups.add(g);
    }
  }
  const totalGroups = Object.keys(directoryGroups).length;
  const undocumentedGroups = Object.keys(directoryGroups).filter((g) => !docGroups.has(g));
  const docCoverage = {
    groupsWithDocs: docGroups.size,
    totalGroups,
    coverageRatio: totalGroups > 0 ? +(docGroups.size / totalGroups).toFixed(2) : 0,
    undocumentedGroups,
  };

  // ---- K. Dependency direction ----
  const pairNet = {};
  for (const { from, to, count } of interGroupImports) {
    const key = [from, to].sort().join("||");
    if (!pairNet[key]) pairNet[key] = {};
    pairNet[key][`${from}->${to}`] = count;
  }
  const dependencyDirection = [];
  for (const key of Object.keys(pairNet)) {
    const [a, b] = key.split("||");
    const ab = pairNet[key][`${a}->${b}`] || 0;
    const ba = pairNet[key][`${b}->${a}`] || 0;
    if (ab === ba) continue;
    if (ab > ba) dependencyDirection.push({ dependent: a, dependsOn: b });
    else dependencyDirection.push({ dependent: b, dependsOn: a });
  }

  // ---- fileStats ----
  const filesPerGroup = {};
  for (const g of Object.keys(directoryGroups)) filesPerGroup[g] = directoryGroups[g].length;
  const nodeTypeCounts = {};
  for (const t of Object.keys(nodeTypeGroups)) nodeTypeCounts[t] = nodeTypeGroups[t].length;

  const result = {
    scriptCompleted: true,
    commonPrefix: prefix,
    directoryGroups,
    nodeTypeGroups,
    crossCategoryEdges,
    interGroupImports,
    intraGroupDensity,
    patternMatches,
    fileRoles,
    roleCounts,
    deploymentTopology,
    dataPipeline,
    docCoverage,
    dependencyDirection,
    fileStats: {
      totalFileNodes: fileNodes.length,
      filesPerGroup,
      nodeTypeCounts,
    },
    fileFanIn,
    fileFanOut,
  };

  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log("OK: wrote", outPath);
  process.exit(0);
}

try {
  main();
} catch (err) {
  console.error("FATAL:", err && err.stack ? err.stack : String(err));
  process.exit(1);
}
