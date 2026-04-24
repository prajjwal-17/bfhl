const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

const USER_ID = "prajjwalrawat_17112004";
const EMAIL_ID = "pr7553@srmist.edu.in";
const COLLEGE_ROLL_NUMBER = "RA2311026010224";

app.use(cors());
app.use(express.json());

function validateInput(data) {
  if (!Array.isArray(data)) {
    return {
      validEdges: [],
      invalidEntries: [],
      duplicateEdges: []
    };
  }

  const validEdges = [];
  const invalidEntries = [];
  const duplicateEdges = [];
  const seenEdges = new Set();
  const duplicateRecorded = new Set();
  const childToParent = new Map();
  const edgePattern = /^([A-Z])->([A-Z])$/;

  for (const rawEntry of data) {
    const normalizedEntry = typeof rawEntry === "string" ? rawEntry.trim() : rawEntry;

    if (typeof normalizedEntry !== "string") {
      invalidEntries.push(rawEntry);
      continue;
    }

    const match = normalizedEntry.match(edgePattern);
    if (!match) {
      invalidEntries.push(rawEntry);
      continue;
    }

    const parent = match[1];
    const child = match[2];

    if (parent === child) {
      invalidEntries.push(rawEntry);
      continue;
    }

    if (seenEdges.has(normalizedEntry)) {
      if (!duplicateRecorded.has(normalizedEntry)) {
        duplicateEdges.push(normalizedEntry);
        duplicateRecorded.add(normalizedEntry);
      }
      continue;
    }

    if (childToParent.has(child)) {
      continue;
    }

    seenEdges.add(normalizedEntry);
    childToParent.set(child, parent);
    validEdges.push([parent, child]);
  }

  return {
    validEdges,
    invalidEntries,
    duplicateEdges
  };
}

function buildGraph(edges) {
  const adjacency = new Map();
  const allNodes = new Set();
  const childrenSet = new Set();
  const parentMap = new Map();

  for (const [parent, child] of edges) {
    if (!adjacency.has(parent)) {
      adjacency.set(parent, []);
    }
    if (!adjacency.has(child)) {
      adjacency.set(child, []);
    }

    adjacency.get(parent).push(child);
    allNodes.add(parent);
    allNodes.add(child);
    childrenSet.add(child);
    parentMap.set(child, parent);
  }

  for (const children of adjacency.values()) {
    children.sort();
  }

  return {
    adjacency,
    allNodes,
    childrenSet,
    parentMap
  };
}

function getConnectedComponents(graph) {
  const undirected = new Map();

  for (const node of graph.allNodes) {
    undirected.set(node, new Set());
  }

  for (const [parent, children] of graph.adjacency.entries()) {
    for (const child of children) {
      undirected.get(parent).add(child);
      undirected.get(child).add(parent);
    }
  }

  const visited = new Set();
  const components = [];

  for (const node of Array.from(graph.allNodes).sort()) {
    if (visited.has(node)) {
      continue;
    }

    const stack = [node];
    const component = [];
    visited.add(node);

    while (stack.length > 0) {
      const current = stack.pop();
      component.push(current);

      for (const neighbor of undirected.get(current) || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          stack.push(neighbor);
        }
      }
    }

    component.sort();
    components.push(component);
  }

  return components;
}

function detectCycle(root, adjacency, componentNodes) {
  const componentSet = new Set(componentNodes);
  const visited = new Set();
  const recursionStack = new Set();

  function dfs(node) {
    visited.add(node);
    recursionStack.add(node);

    for (const neighbor of adjacency.get(node) || []) {
      if (!componentSet.has(neighbor)) {
        continue;
      }

      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(node);
    return false;
  }

  if (dfs(root)) {
    return true;
  }

  for (const node of componentNodes) {
    if (!visited.has(node) && dfs(node)) {
      return true;
    }
  }

  return false;
}

function buildTree(root, adjacency, componentNodes) {
  const componentSet = new Set(componentNodes);

  function buildNode(node) {
    const branch = {};
    const children = (adjacency.get(node) || []).filter((child) => componentSet.has(child));

    for (const child of children) {
      branch[child] = buildNode(child);
    }

    return branch;
  }

  return {
    [root]: buildNode(root)
  };
}

function calculateDepth(treeNode) {
  const entries = Object.entries(treeNode);

  if (entries.length === 0) {
    return 0;
  }

  const [, children] = entries[0];
  const childKeys = Object.keys(children);

  if (childKeys.length === 0) {
    return 1;
  }

  let maxDepth = 0;
  for (const child of childKeys) {
    const childDepth = calculateDepth({ [child]: children[child] });
    if (childDepth > maxDepth) {
      maxDepth = childDepth;
    }
  }

  return 1 + maxDepth;
}

function processHierarchies(data) {
  const { validEdges, invalidEntries, duplicateEdges } = validateInput(data);
  const graph = buildGraph(validEdges);
  const components = getConnectedComponents(graph);
  const hierarchies = [];

  let totalTrees = 0;
  let totalCycles = 0;
  let largestTreeRoot = "";
  let largestTreeDepth = 0;

  for (const componentNodes of components) {
    const roots = componentNodes.filter((node) => !graph.childrenSet.has(node)).sort();
    const root = roots.length > 0 ? roots[0] : componentNodes[0];
    const hasCycle = detectCycle(root, graph.adjacency, componentNodes);

    if (hasCycle) {
      totalCycles += 1;
      hierarchies.push({
        root,
        tree: {},
        has_cycle: true
      });
      continue;
    }

    const tree = buildTree(root, graph.adjacency, componentNodes);
    const depth = calculateDepth(tree);

    totalTrees += 1;
    if (
      depth > largestTreeDepth ||
      (depth === largestTreeDepth && (largestTreeRoot === "" || root < largestTreeRoot))
    ) {
      largestTreeDepth = depth;
      largestTreeRoot = root;
    }

    hierarchies.push({
      root,
      tree,
      has_cycle: false,
      depth
    });
  }

  return {
    user_id: USER_ID,
    email_id: EMAIL_ID,
    college_roll_number: COLLEGE_ROLL_NUMBER,
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary: {
      total_trees: totalTrees,
      total_cycles: totalCycles,
      largest_tree_root: largestTreeRoot
    }
  };
}

app.get("/", (req, res) => {
  res.send("API running");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API healthy"
  });
});

app.post("/bfhl", (req, res) => {
  const response = processHierarchies(req.body && req.body.data);
  res.status(200).json(response);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
