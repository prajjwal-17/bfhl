import { useState } from "react";
import "./App.css";

const defaultPayload = {
  data: ["A->B", "A->C", "B->D"]
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function safeParseJson(value) {
  try {
    return {
      data: JSON.parse(value),
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Invalid JSON"
    };
  }
}

function formatJson(value) {
  return JSON.stringify(value, null, 2);
}

function TreeNode({ label, branch }) {
  const childEntries = Object.entries(branch || {});

  return (
    <div className="tree-node">
      <div className="tree-label">{label}</div>
      {childEntries.length > 0 ? (
        <div className="tree-children">
          {childEntries.map(([childLabel, childBranch]) => (
            <TreeNode key={childLabel} label={childLabel} branch={childBranch} />
          ))}
        </div>
      ) : (
        <div className="tree-leaf">leaf</div>
      )}
    </div>
  );
}

function HierarchyCard({ hierarchy }) {
  const treeEntries = Object.entries(hierarchy.tree || {});

  return (
    <article className="result-card">
      <div className="result-card-header">
        <div>
          <p className="eyebrow">Hierarchy</p>
          <h3>{hierarchy.root}</h3>
        </div>
        <span className={`badge ${hierarchy.has_cycle ? "badge-danger" : "badge-success"}`}>
          {hierarchy.has_cycle ? "Cycle" : `Depth ${hierarchy.depth}`}
        </span>
      </div>

      {hierarchy.has_cycle ? (
        <p className="result-copy">Cycle detected in this graph group. Tree output is intentionally empty.</p>
      ) : (
        <div className="tree-panel">
          {treeEntries.map(([label, branch]) => (
            <TreeNode key={label} label={label} branch={branch} />
          ))}
        </div>
      )}
    </article>
  );
}

function App() {
  const [payloadText, setPayloadText] = useState(formatJson(defaultPayload));
  const [responseData, setResponseData] = useState(null);
  const [responseTimeMs, setResponseTimeMs] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const parsed = safeParseJson(payloadText);
    if (parsed.error) {
      setErrorMessage(`Payload JSON error: ${parsed.error}`);
      setResponseData(null);
      return;
    }

    if (!apiBaseUrl) {
      setErrorMessage("Frontend is missing VITE_API_BASE_URL configuration.");
      setResponseData(null);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setResponseTimeMs(null);

    try {
      const requestStartedAt = performance.now();
      const response = await fetch(`${apiBaseUrl}/bfhl`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(parsed.data)
      });
      const requestEndedAt = performance.now();

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || `Request failed with status ${response.status}`);
      }

      setResponseData(json);
      setResponseTimeMs(Math.round(requestEndedAt - requestStartedAt));
    } catch (error) {
      setResponseData(null);
      setResponseTimeMs(null);
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to reach the BFHL API right now."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setPayloadText(formatJson(defaultPayload));
    setResponseData(null);
    setResponseTimeMs(null);
    setErrorMessage("");
  }

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">BFHL Challenge Frontend</p>
          <h1>Test your hierarchy API without leaving the browser.</h1>
          <p className="hero-text">
            Paste a payload, point to your deployed Express backend, and inspect trees, cycles,
            duplicates, and invalid inputs in one place.
          </p>
        </div>

        <div className="hero-stats">
          <div className="stat-card">
            <span className="stat-label">Endpoint</span>
            <strong>POST /bfhl</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Health Check</span>
            <strong>GET /health</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Frontend Target</span>
            <strong>Render / Railway ready</strong>
          </div>
        </div>
      </section>

      <section className="workspace-grid">
        <form className="panel input-panel" onSubmit={handleSubmit}>
          <div className="panel-header">
            <div>
              <p className="eyebrow">Request Builder</p>
              <h2>Send payload</h2>
            </div>
            <div className="panel-actions">
              <button type="button" className="secondary-button" onClick={handleReset}>
                Reset
              </button>
              <button type="submit" className="primary-button" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Run API"}
              </button>
            </div>
          </div>

          <label className="field">
            <span>JSON payload</span>
            <textarea
              value={payloadText}
              onChange={(event) => setPayloadText(event.target.value)}
              rows={18}
              spellCheck="false"
            />
          </label>

          <div className="hint-row">
            <span className="hint-chip">Example payload included</span>
            <span className="hint-chip">CORS compatible</span>
            <span className="hint-chip">Deploy-ready flow</span>
          </div>

          {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}
        </form>

        <section className="panel output-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Response Viewer</p>
              <h2>Inspect result</h2>
            </div>
          </div>

          {responseData ? (
            <div className="results-stack">
              <div className="identity-grid">
                <div className="metric-card">
                  <span className="metric-label">User ID</span>
                  <strong className="metric-value metric-value-break">{responseData.user_id}</strong>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Email</span>
                  <strong className="metric-value metric-value-break">{responseData.email_id}</strong>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Registration Number</span>
                  <strong className="metric-value metric-value-break">
                    {responseData.college_roll_number}
                  </strong>
                </div>
              </div>

              <div className="summary-grid">
                <div className="metric-card">
                  <span className="metric-label">Resolved In</span>
                  <strong className="metric-value">
                    {responseTimeMs !== null ? `${responseTimeMs} ms` : "N/A"}
                  </strong>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Trees</span>
                  <strong className="metric-value">{responseData.summary?.total_trees ?? 0}</strong>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Cycles</span>
                  <strong className="metric-value">{responseData.summary?.total_cycles ?? 0}</strong>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Largest Tree Root</span>
                  <strong className="metric-value">
                    {responseData.summary?.largest_tree_root || "N/A"}
                  </strong>
                </div>
              </div>

              <div className="result-section">
                <div className="result-section-header">
                  <h3>Hierarchies</h3>
                  <span>{responseData.hierarchies?.length ?? 0} groups</span>
                </div>
                <div className="hierarchy-grid">
                  {(responseData.hierarchies || []).map((hierarchy, index) => (
                    <HierarchyCard key={`${hierarchy.root}-${index}`} hierarchy={hierarchy} />
                  ))}
                </div>
              </div>

              <div className="two-column-grid">
                <article className="result-card">
                  <div className="result-card-header">
                    <div>
                      <p className="eyebrow">Validation</p>
                      <h3>Invalid entries</h3>
                    </div>
                    <span className="badge badge-neutral">
                      {responseData.invalid_entries?.length ?? 0}
                    </span>
                  </div>
                  <pre className="json-block">{formatJson(responseData.invalid_entries || [])}</pre>
                </article>

                <article className="result-card">
                  <div className="result-card-header">
                    <div>
                      <p className="eyebrow">Deduplication</p>
                      <h3>Duplicate edges</h3>
                    </div>
                    <span className="badge badge-neutral">
                      {responseData.duplicate_edges?.length ?? 0}
                    </span>
                  </div>
                  <pre className="json-block">
                    {formatJson(responseData.duplicate_edges || [])}
                  </pre>
                </article>
              </div>

              <article className="result-card">
                <div className="result-card-header">
                  <div>
                    <p className="eyebrow">Raw Output</p>
                    <h3>Full JSON response</h3>
                  </div>
                </div>
                <pre className="json-block">{formatJson(responseData)}</pre>
              </article>
            </div>
          ) : (
            <div className="empty-state">
              <h3>No response yet</h3>
              <p>
                Submit the sample payload or your own test case to preview the exact JSON returned
                by the backend.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default App;
