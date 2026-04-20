import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import {
  getAccessToken,
  getSession,
  signInWithGoogle,
  signOutUser,
  validateUserAccess
} from "./auth";

// Added basic styling and updated toast/disabled state styling.
const styles = `
.page { font-family: sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; color: #333; }
.header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; border-bottom: 1px solid #eee; margin-bottom: 20px; }
.header h1 { margin: 0; font-size: 1.5rem; }
.actions { display: flex; gap: 10px; align-items: center; }
.user-email { font-size: 0.9rem; color: #666; }
.actions button { padding: 8px 15px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer; }
.actions button.logout { background: #f44336; color: white; border: none; }
.panel { border: 1px solid #eee; border-radius: 8px; padding: 20px; background: #fafafa; }
.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.panel-header h2 { margin: 0; }
.panel-tools input { padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
.team-list { display: flex; flex-direction: column; gap: 15px; }
.domain-section { margin-bottom: 20px; }
.domain-title { font-weight: bold; font-size: 1.1rem; color: #555; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; border-bottom: 2px solid #eee; padding-bottom: 5px;}
.team-card { border: 1px solid #eee; border-radius: 6px; padding: 15px; background: white; display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: start;}
.team-info { display: flex; flex-direction: column; gap: 5px; }
.team-name { margin: 0; font-size: 1.2rem; display: flex; align-items: center; gap: 10px; }
.team-round-status { display: flex; gap: 5px; }
.team-round-pill { font-size: 0.7rem; padding: 2px 6px; border-radius: 10px; background: #eee; color: #666; font-weight: normal;}
.team-round-pill-submitted { background: #4caf50; color: white; }
.team-actions { text-align: right; }
.link-button { background: none; border: none; color: #2196f3; cursor: pointer; text-decoration: underline; padding: 0; font-size: 0.9rem;}
.criteria-grid { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; border-top: 1px solid #eee; padding-top: 15px; margin-top: 5px;}
.criteria-rounds { grid-column: 1 / -1; display: flex; items-center: center; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; padding: 10px; background: #f0f0f0; border-radius: 4px;}
.criteria-rounds-label { font-size: 0.9rem; color: #666; font-weight: bold;}
.round-toggle { display: flex; gap: 5px; }
.round-toggle-button { padding: 5px 10px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer; font-size: 0.9rem;}
.round-toggle-button-active { background: #2196f3; color: white; border-color: #2196f3; }
.round-submitted-note { font-size: 0.8rem; color: #4caf50; font-weight: bold;}
.round-blocked-note { font-size: 0.8rem; color: #f44336; }

/* Disabled state styling for the inputs and label */
.criteria-item { display: flex; flex-direction: column; gap: 5px; font-size: 0.9rem; color: #555; position: relative; }
.criteria-item input, .criteria-item textarea { padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-family: inherit; transition: border-color 0.2s; }

/* Change cursor to blocked on hover */
.criteria-item.disabled { cursor: not-allowed; }
.criteria-item.disabled input, .criteria-item.disabled textarea { border-color: #ddd; background-color: #f9f9f9; color: #999; }

/* Show message on hover */
.criteria-item.disabled:hover::after {
  content: "Blocked: Round Submitted";
  position: absolute;
  top: -25px;
  right: 0;
  background: rgba(244, 67, 54, 0.9);
  color: white;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
  white-space: nowrap;
  pointer-events: none;
  z-index: 10;
}

.criteria-review { grid-column: 1 / -1; }
.criteria-actions { grid-column: 1 / -1; text-align: right; margin-top: 10px;}
.criteria-actions button { padding: 10px 20px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;}
.criteria-actions button:disabled { background: #ccc; cursor: not-allowed; }
.leaderboard-domain { margin-bottom: 25px; }
.leaderboard { display: flex; flex-direction: column; gap: 8px; }
.leaderboard-row { display: grid; grid-template-columns: 50px 1fr 80px; gap: 10px; padding: 10px; border: 1px solid #eee; border-radius: 4px; background: white; align-items: center;}
.leaderboard-row .rank { font-weight: bold; color: #888; text-align: center;}
.leaderboard-row .team-name { font-weight: bold; }
.leaderboard-row .score { text-align: right; font-weight: bold; color: #2196f3; font-size: 1.1rem;}

.toast-container { position: fixed; bottom: 20px; right: 20px; z-index: 1000; }
.toast { background: #333; color: white; padding: 10px 20px; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); animation: fadeInOut 5s forwards; }

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateY(20px); }
  10% { opacity: 1; transform: translateY(0); }
  90% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(20px); }
}

.teams-loading, .empty { text-align: center; color: #888; padding: 20px; }
.team-skeleton-group { margin-bottom: 15px; }
.team-skeleton-domain { height: 20px; width: 100px; background: #eee; margin-bottom: 10px; border-radius: 4px;}
.team-skeleton-card { border: 1px solid #eee; border-radius: 6px; padding: 15px; background: white; margin-bottom: 10px;}
.team-skeleton-line { height: 15px; background: #eee; border-radius: 4px; margin-bottom: 8px;}
.team-skeleton-line-title { width: 60%; }
.team-skeleton-line-action { width: 30%; margin-left: auto;}
`;

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

// === MOCK DATA DISABLED: Set to false ===
const ENABLE_LOADING_PREVIEW = false; 

// const MOCK_TEAM_DELAY_MS = 2200; // No longer used
const ROUNDS = [1, 2];

const CRITERIA = [
  { key: "problem_understanding", label: "Problem Understanding" },
  { key: "innovation_creativity", label: "Innovation / Creativity" },
  { key: "technical_implementation", label: "Technical Implementation" },
  { key: "functionality_demo", label: "Functionality / Demo" },
  { key: "impact_usefulness", label: "Impact & Usefulness" },
  { key: "ui_ux_design", label: "UI/UX Design" },
  { key: "feasibility", label: "Feasibility" },
  { key: "presentation_communication", label: "Presentation / Communication" },
  { key: "business_market_potential", label: "Business / Market Potential" },
  { key: "testing_robustness", label: "Testing & Robustness" }
];

// Removed sleep function and Mock Data constants

const getRouteFromPath = (path) => (path === "/leaderboard" ? "/leaderboard" : "/");
const createEmptyRoundMap = () =>
  ROUNDS.reduce((acc, roundNumber) => {
    acc[roundNumber] = {};
    return acc;
  }, {});
const normalizeScoreInput = (value) => {
  if (value === "") {
    return "";
  }

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return null;
  }

  return String(Math.min(10, Math.max(0, numericValue)));
};

const fetchJson = async (url, options = {}) => {
  const token = await getAccessToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
};

const App = () => {
  const [isAuthed, setIsAuthed] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [teams, setTeams] = useState([]);
  const [leaderboardByDomain, setLeaderboardByDomain] = useState({});
  const [search, setSearch] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [isTeamsLoading, setIsTeamsLoading] = useState(false);
  const [scores, setScores] = useState({});
  const [submittedTeams, setSubmittedTeams] = useState(createEmptyRoundMap);
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  const [selectedRounds, setSelectedRounds] = useState({});
  const [route, setRoute] = useState(() => getRouteFromPath(window.location.pathname));
  const toastTimerRef = useRef(null);
  const latestTeamsRequestRef = useRef(0);

  const showToast = (text) => {
    if (!text) {
      return;
    }

    setToastMessage(text);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToastMessage("");
    }, 5000);
  };

  const loadTeams = async (query = "") => {
    const requestId = latestTeamsRequestRef.current + 1;
    latestTeamsRequestRef.current = requestId;
    setIsTeamsLoading(true);

    try {
      // Fetching from Backend API
      const data = await fetchJson(`${API_BASE}/teams?search=${encodeURIComponent(query)}`);
      if (latestTeamsRequestRef.current === requestId) {
        setTeams(data.teams || []);
      }
    } finally {
      if (latestTeamsRequestRef.current === requestId) {
        setIsTeamsLoading(false);
      }
    }
  };

  const loadLeaderboard = async () => {
    // Fetching from Backend API
    const data = await fetchJson(`${API_BASE}/leaderboard`);
    setLeaderboardByDomain(data.leaderboardByDomain || {});
  };

  const loadSubmittedTeams = async () => {
    // Fetching submission status for each round from Backend API
    const roundEntries = await Promise.all(
      ROUNDS.map(async (roundNumber) => {
        const data = await fetchJson(`${API_BASE}/scores/teams?roundNumber=${roundNumber}`);
        const submittedMap = (data.teamIds || []).reduce((acc, teamId) => {
          acc[teamId] = true;
          return acc;
        }, {});
        return [roundNumber, submittedMap];
      })
    );

    setSubmittedTeams(
      roundEntries.reduce((acc, [roundNumber, submittedMap]) => {
        acc[roundNumber] = submittedMap;
        return acc;
      }, createEmptyRoundMap())
    );
  };

  const handleLogin = async () => {
    setAuthMessage("");
    try {
      await signInWithGoogle();
    } catch (error) {
      setAuthMessage(error.message || "Failed to start Google sign-in.");
    }
  };

  const handleScoreChange = (teamId, roundNumber, field, value) => {
    const normalizedValue =
      field === "review" ? value : normalizeScoreInput(value);

    if (normalizedValue === null) {
      return;
    }

    setScores((prev) => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        [roundNumber]: {
          ...(prev[teamId]?.[roundNumber] || {}),
          [field]: normalizedValue
        }
      }
    }));
  };

  const submitScore = async (teamId, roundNumber) => {
    if (submittedTeams[roundNumber]?.[teamId]) {
      showToast(`Round ${roundNumber} cannot be re-submitted.`);
      return;
    }

    if (roundNumber > 1 && !submittedTeams[roundNumber - 1]?.[teamId]) {
      showToast(`Complete Round ${roundNumber - 1} before submitting Round ${roundNumber}.`);
      return;
    }

    setToastMessage("");
    const teamScores = scores[teamId]?.[roundNumber] || {};
    const review = String(teamScores.review || "").trim();
    const payloadScores = {};

    for (const item of CRITERIA) {
      const rawValue = teamScores[item.key] ?? 0;
      const numericValue = Number(rawValue);

      if (Number.isNaN(numericValue) || numericValue < 0 || numericValue > 10) {
        showToast(`${item.label} must be between 0 and 10.`);
        return;
      }

      payloadScores[item.key] = numericValue;
    }

    try {
      // Submitting to Backend API
      await fetchJson(`${API_BASE}/scores`, {
        method: "POST",
        body: JSON.stringify({ teamId, roundNumber, scores: payloadScores, review })
      });

      await loadLeaderboard();
      showToast("Score saved.");
      setSubmittedTeams((prev) => ({
        ...prev,
        [roundNumber]: {
          ...prev[roundNumber],
          [teamId]: true
        }
      }));
    } catch (error) {
      if (error.message && error.message.includes("Score exists")) {
        setSubmittedTeams((prev) => ({
          ...prev,
          [roundNumber]: {
            ...prev[roundNumber],
            [teamId]: true
          }
        }));
        return;
      }
      showToast(error.message);
    }
  };


  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (error) {
      setAuthMessage(error.message || "Failed to sign out.");
    }
    setIsAuthed(false);
    setUserEmail("");
    setTeams([]);
    setLeaderboardByDomain({});
    setSearch("");
    setScores({});
    setSubmittedTeams(createEmptyRoundMap());
    setToastMessage("");
    setExpandedTeamId(null);
    setSelectedRounds({});
  };

  const navigateTo = async (nextPath) => {
    const normalizedPath = getRouteFromPath(nextPath);
    if (normalizedPath === route) {
      return;
    }

    if (normalizedPath === "/leaderboard" && !Object.keys(leaderboardByDomain).length) {
      await loadLeaderboard();
    }

    window.history.pushState({}, "", normalizedPath);
    setRoute(normalizedPath);
  };

  const handleSession = async (session) => {
    if (!session?.user) {
      setIsAuthed(false);
      setUserEmail("");
      return;
    }

    const email = session.user.email || "";
    try {
      const allowed = await validateUserAccess(email);
      if (!allowed) {
        await signOutUser();
        setAuthMessage("You are not authorized as a jury member.");
        setIsAuthed(false);
        setUserEmail("");
        return;
      }

      setAuthMessage("");
      setIsAuthed(true);
      setUserEmail(email);
      // Real data loads
      await loadTeams();
      await loadLeaderboard();
      await loadSubmittedTeams();
    } catch (error) {
      setAuthMessage(error.message || "Failed to validate access.");
      setIsAuthed(false);
      setUserEmail("");
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      // Mock Auth logic removed

      setIsAuthLoading(true);
      try {
        const session = await getSession();
        if (isMounted) {
          await handleSession(session);
        }
      } catch (error) {
        if (isMounted) {
          setAuthMessage(error.message || "Authentication error.");
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    initAuth();

    const handlePopState = () => {
      setRoute(getRouteFromPath(window.location.pathname));
    };

    window.addEventListener("popstate", handlePopState);

    // Mock Auth Cleanup logic removed

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session).catch(() => {});
    });

    return () => {
      isMounted = false;
      window.removeEventListener("popstate", handlePopState);
      data.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isAuthed) {
      return;
    }
    loadTeams(search).catch(() => {});
  }, [isAuthed, search]);

  useEffect(() => () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (route !== "/leaderboard") {
      return;
    }

    if (!isAuthed) {
      return;
    }

    if (Object.keys(leaderboardByDomain).length) {
      return;
    }

    loadLeaderboard().catch(() => {});
  }, [route, isAuthed, leaderboardByDomain]);

  const getSelectedRound = (teamId) => selectedRounds[teamId] || 1;
  const canSubmitRound = (teamId, roundNumber) =>
    roundNumber === 1 || Boolean(submittedTeams[roundNumber - 1]?.[teamId]);

  if (!isAuthed) {
    return (
      <div className="page page-auth" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column'}}>
        <style>{styles}</style>
        <div className="panel" style={{textAlign: 'center', maxWidth: '400px'}}>
          <h1 style={{marginBottom: '15px'}}>Krithoathon - Jury Console</h1>
          <p style={{color: '#666', marginBottom: '25px'}}>Sign in with Google to continue.</p>
          <button
            type="button"
            className="criteria-actions button"
            style={{background: '#4caf50', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}
            onClick={handleLogin}
          >
            Continue with Google
          </button>
          {authMessage && <div className="toast" style={{position: 'static', marginTop: '15px', background: '#f44336'}}>{authMessage}</div>}
        </div>
        <a
          className="back-home"
          href="https://krithoathon-4-0.netlify.app/"
          style={{marginTop: '20px', color: '#2196f3', textDecoration: 'none'}}
        >
          &larr; Back to Home
        </a>
      </div>
    );
  }

  return (
    <div className="page">
      <style>{styles}</style>
      <header className="header">
        <h1>Krithoathon - Jury Console</h1>
        <div className="actions">
          <span className="user-email">{userEmail}</span>
          <button
            type="button"
            onClick={() => navigateTo(route === "/" ? "/leaderboard" : "/")}
          >
            {route === "/" ? "Leaderboard" : "Teams"}
          </button>
          <button type="button" className="logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {toastMessage && (
        <div className="toast-container">
          <div className="toast">{toastMessage}</div>
        </div>
      )}

      {route === "/" && (
        <section className="panel">
          <div className="panel-header">
            <h2>Teams</h2>
            <div className="panel-tools">
              <input
                type="search"
                placeholder="Search teams"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
          <div className="team-list">
            {isTeamsLoading && (
              <div className="teams-loading" aria-live="polite" aria-busy="true">
                <div className="team-skeleton-groups" aria-hidden="true">
                  {["HEALTH", "AGRICULTURE", "AI"].map((domain) => (
                    <div key={domain} className="team-skeleton-group">
                      <div className="team-skeleton-domain">{domain}</div>
                      {[0, 1].map((item) => (
                        <div key={`${domain}-${item}`} className="team-skeleton-card">
                          <div className="team-skeleton-line team-skeleton-line-title" />
                          <div className="team-skeleton-line team-skeleton-line-action" />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!isTeamsLoading && teams.length === 0 && <div className="empty">No teams found.</div>}
            {!isTeamsLoading &&
              (() => {
                const grouped = teams.reduce((acc, team) => {
                  const domain = team.domain;
                  if (!domain) {
                    return acc;
                  }
                  if (!acc[domain]) {
                    acc[domain] = [];
                  }
                  acc[domain].push(team);
                  return acc;
                }, {});
                const domainOrder = ["Health", "Agriculture", "AI"];
                const orderedDomains = [
                  ...domainOrder,
                  ...Object.keys(grouped).filter((key) => !domainOrder.includes(key))
                ];

                return orderedDomains
                  .filter((domain) => grouped[domain]?.length)
                  .map((domain) => (
                    <div key={domain} className="domain-section">
                      <div className="domain-title">{domain}</div>
                      {grouped[domain].map((team) => {
                        const currentRound = getSelectedRound(team.id);
                        // Identify if the currently selected round is already submitted
                        const isRoundSubmitted = Boolean(submittedTeams[currentRound]?.[team.id]);

                        return (
                          <div key={team.id} className="team-card">
                            <div className="team-info">
                              <h3 className="team-name">
                                <span>{team.name}</span>
                                <span className="team-round-status">
                                  {ROUNDS.map((roundNumber) => (
                                    <span
                                      key={roundNumber}
                                      className={`team-round-pill ${
                                        submittedTeams[roundNumber]?.[team.id]
                                          ? "team-round-pill-submitted"
                                          : ""
                                      }`}
                                    >
                                      R{roundNumber}
                                    </span>
                                  ))}
                                </span>
                              </h3>
                            </div>
                            <div className="team-actions">
                              <button
                                type="button"
                                className="link-button"
                                onClick={() =>
                                  setExpandedTeamId((prev) =>
                                    prev === team.id ? null : team.id
                                  )
                                }
                              >
                                {expandedTeamId === team.id ? "Hide criteria" : "Score team"}
                              </button>
                            </div>
                            {expandedTeamId === team.id && (
                              <div className="criteria-grid">
                                <div className="criteria-rounds">
                                  <span className="criteria-rounds-label">Evaluation round</span>
                                  <div className="round-toggle" role="tablist" aria-label="Evaluation round">
                                    {ROUNDS.map((roundNumber) => (
                                      <button
                                        key={roundNumber}
                                        type="button"
                                        className={`round-toggle-button ${
                                          currentRound === roundNumber
                                            ? "round-toggle-button-active"
                                            : ""
                                        }`}
                                        onClick={() =>
                                          setSelectedRounds((prev) => ({
                                            ...prev,
                                            [team.id]: roundNumber
                                          }))
                                        }
                                      >
                                        Round {roundNumber}
                                      </button>
                                    ))}
                                  </div>
                                  {isRoundSubmitted && (
                                    <span className="round-submitted-note">
                                      Round {currentRound} submitted (View Only)
                                    </span>
                                  )}
                                  {!isRoundSubmitted && !canSubmitRound(team.id, currentRound) && (
                                    <span className="round-blocked-note">
                                      Submit Round {currentRound - 1} first
                                    </span>
                                  )}
                                </div>
                                {CRITERIA.map((item) => (
                                  // Add 'disabled' class to label if submitted
                                  <label key={item.key} className={`criteria-item ${isRoundSubmitted ? "disabled" : ""}`}>
                                    {item.label}
                                    <input
                                      type="number"
                                      min="0"
                                      max="10"
                                      step="1"
                                      value={
                                        scores[team.id]?.[currentRound]?.[item.key] ?? ""
                                      }
                                      onChange={(event) =>
                                        handleScoreChange(
                                          team.id,
                                          currentRound,
                                          item.key,
                                          event.target.value
                                        )
                                      }
                                      placeholder="0-10"
                                      // Dynamically disable the input
                                      disabled={isRoundSubmitted}
                                    />
                                  </label>
                                ))}
                                <label className={`criteria-item criteria-review ${isRoundSubmitted ? "disabled" : ""}`}>
                                  Jury review
                                  <textarea
                                    rows="4"
                                    value={scores[team.id]?.[currentRound]?.review ?? ""}
                                    onChange={(event) =>
                                      handleScoreChange(
                                        team.id,
                                        currentRound,
                                        "review",
                                        event.target.value
                                      )
                                    }
                                    placeholder="Add feedback on the team's presentation, execution, strengths, and areas to improve"
                                    // Dynamically disable the textarea
                                    disabled={isRoundSubmitted}
                                  />
                                </label>
                                <div className="criteria-actions">
                                  <button
                                    type="button"
                                    disabled={isRoundSubmitted || !canSubmitRound(team.id, currentRound)}
                                    onClick={() => submitScore(team.id, currentRound)}
                                  >
                                    {isRoundSubmitted
                                      ? `Round ${currentRound} Submitted`
                                      : `Submit Round ${currentRound}`}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ));
              })()}
          </div>
        </section>
      )}

      {route === "/leaderboard" && (
        <section className="panel">
          <h2>Leaderboard</h2>
          {(() => {
            const domainOrder = ["Health", "Agriculture", "AI"];
            const domains = [
              ...domainOrder,
              ...Object.keys(leaderboardByDomain).filter(
                (key) => !domainOrder.includes(key)
              )
            ];
            const hasRows = domains.some((domain) => leaderboardByDomain[domain]?.length);

            if (!hasRows) {
              return <div className="empty">No scores yet.</div>;
            }

            return domains
              .filter((domain) => leaderboardByDomain[domain]?.length)
              .map((domain) => (
                <div key={domain} className="leaderboard-domain">
                  <div className="domain-title">{domain}</div>
                  <div className="leaderboard">
                    {leaderboardByDomain[domain].map((row, index) => (
                      <div key={row.team_id} className="leaderboard-row">
                        <span className="rank">#{index + 1}</span>
                        <span className="team-name">{row.team_name}</span>
                        <span className="score">{row.total_score ?? 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ));
          })()}
        </section>
      )}

    </div>
  );
};

export default App;