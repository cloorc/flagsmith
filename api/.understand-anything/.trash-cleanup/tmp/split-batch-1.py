import json, math, os

with open(".understand-anything/intermediate/batch-1.json") as f:
    graph = json.load(f)
nodes = graph["nodes"]
edges = graph["edges"]

with open(".understand-anything/tmp/ua-file-analyzer-input-1.json") as f:
    inp = json.load(f)
files = sorted(f["path"] for f in inp["batchFiles"])

parts = math.ceil(max(len(nodes) / 60, len(edges) / 120))
chunk = math.ceil(len(files) / parts)
groups = [set(files[i:i+chunk]) for i in range(0, len(files), chunk)]
# ensure exactly `parts` groups
while len(groups) < parts:
    groups.append(set())

def node_file(n):
    return n.get("filePath")

# map node id -> part index
node_part = {}
for n in nodes:
    fp = node_file(n)
    pidx = 0
    for i, g in enumerate(groups):
        if fp in g:
            pidx = i
            break
    node_part[n["id"]] = pidx

# remove the combined file
os.remove(".understand-anything/intermediate/batch-1.json")

for i in range(len(groups)):
    part_nodes = [n for n in nodes if node_part[n["id"]] == i]
    part_node_ids = set(n["id"] for n in part_nodes)
    # edges whose source is in this part's nodes
    part_edges = [e for e in edges if e["source"] in part_node_ids]
    out = {"nodes": part_nodes, "edges": part_edges}
    path = f".understand-anything/intermediate/batch-1-part-{i+1}.json"
    with open(path, "w") as f:
        json.dump(out, f, indent=2)
    print(f"part {i+1}: nodes={len(part_nodes)} edges={len(part_edges)}")

# total verification
total_n = sum(len([n for n in nodes if node_part[n['id']]==i]) for i in range(len(groups)))
print("total nodes across parts:", total_n)
# verify every edge source is assigned to some part (all edges retained)
all_part_edges = 0
for i in range(len(groups)):
    part_node_ids = set(n["id"] for n in nodes if node_part[n["id"]] == i)
    all_part_edges += len([e for e in edges if e["source"] in part_node_ids])
print("total edges across parts:", all_part_edges, "of", len(edges))
print("imports across parts:", sum(1 for e in edges if e["type"]=="imports"))
