import "dotenv/config";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  ALLOWED_EMAILS,
  PORT = 4000
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const app = express();
import cors from "cors";
app.use(cors({
  origin: ["http://localhost:5201", "https://your-frontend-domain.com"], // add all allowed origins here
  credentials: true,
}));

const allowedEmailSet = new Set(
  (ALLOWED_EMAILS || "katkarvinayak2006@gmail.com,vinayak.katkar1233@gmail.com")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

const CRITERIA_FIELDS = [
  "problem_understanding",
  "innovation_creativity",
  "technical_implementation",
  "functionality_demo",
  "impact_usefulness",
  "ui_ux_design",
  "feasibility",
  "presentation_communication",
  "business_market_potential",
  "testing_robustness"
];


const isEmailAllowed = async (email) => {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  if (allowedEmailSet.has(normalized)) {
    return true;
  }

  const { data, error } = await supabase
    .from("allowed_users")
    .select("id")
    .eq("email", normalized)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
};

const requireJuryAccess = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: "Missing auth token." });
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ error: "Invalid auth token." });
  }

  const email = data.user.email || "";
  try {
    const allowed = await isEmailAllowed(email);
    if (!allowed) {
      return res.status(403).json({ error: "You are not authorized as a jury member." });
    }

    req.user = { id: data.user.id, email };
    return next();
  } catch (err) {
    return res.status(500).json({ error: err.message || "Access check failed." });
  }
};

app.get("/api/teams", requireJuryAccess, async (req, res) => {
  const search = String(req.query.search || "").trim();

  let query = supabase.from("teams").select("id,name,domain").order("name");
  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query;
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json({ teams: data || [] });
});


app.post("/api/leaderboard", requireJuryAccess, async (req, res) => {
  console.log("/api/leaderboard POST payload:", req.body);
  const { teamId, roundNumber, leaderboard, review } = req.body;

  if (!teamId || !leaderboard || !Number.isInteger(roundNumber) || (roundNumber !== 1 && roundNumber !== 2)) {
    console.error("Validation failed: missing teamId, leaderboard, or roundNumber", req.body);
    return res.status(400).json({
      error: "TeamId, roundNumber (1 or 2), and leaderboard are required."
    });
  }

  // Select table based on roundNumber
  const tableName = roundNumber === 1 ? "scores_round1" : "scores_round2";

  // Check if score already exists for this team in this round
  const { data: existing, error: existingError } = await supabase
    .from(tableName)
    .select("team_id")
    .eq("team_id", teamId)
    .maybeSingle();

  if (existingError) {
    console.error("DB error checking existing score:", existingError);
    return res.status(500).json({ error: existingError.message });
  }

  if (existing) {
    console.warn("Score already exists for team/round", { teamId, roundNumber });
    return res.status(409).json({ error: "Score exists. Admin key required to edit." });
  }

  // For round 2, check that round 1 exists
  if (roundNumber === 2) {
    const { data: previousRound, error: previousRoundError } = await supabase
      .from("scores_round1")
      .select("team_id")
      .eq("team_id", teamId)
      .maybeSingle();

    if (previousRoundError) {
      console.error("DB error checking previous round:", previousRoundError);
      return res.status(500).json({ error: previousRoundError.message });
    }

    if (!previousRound) {
      console.warn(`Round 1 must be evaluated before Round 2.`, { teamId });
      return res.status(400).json({
        error: `Round 1 must be evaluated before Round 2.`
      });
    }
  }

  const payload = {
    team_id: teamId,
    created_by_key: req.user.email,
    review: String(review || "").trim(),
    updated_at: null
  };

  for (const field of CRITERIA_FIELDS) {
    const value = Number(leaderboard[field]);
    if (Number.isNaN(value) || value < 0 || value > 10) {
      console.error(`Invalid score for ${field}:`, value);
      return res.status(400).json({ error: `Invalid score for ${field}.` });
    }
    payload[field] = value;
  }

  const { error: insertError } = await supabase.from(tableName).insert(payload);

  if (insertError) {
    console.error("DB error inserting score:", insertError);
    return res.status(500).json({ error: insertError.message });
  }

  console.log("Score inserted successfully for team/round", { teamId, roundNumber });
  return res.json({ ok: true });
});

app.get("/api/leaderboard/teams", requireJuryAccess, async (req, res) => {
  const roundNumber = Number.parseInt(req.query.roundNumber || "1", 10);

  if (roundNumber !== 1 && roundNumber !== 2) {
    return res.status(400).json({ error: "Valid roundNumber (1 or 2) is required." });
  }

  const tableName = roundNumber === 1 ? "scores_round1" : "scores_round2";
  const { data, error } = await supabase
    .from(tableName)
    .select("team_id");

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json({ teamIds: (data || []).map((row) => row.team_id) });
});

app.get("/api/leaderboard", requireJuryAccess, async (_req, res) => {
  const [{ data: teams, error: teamsError }, { data: leaderboard, error: lbError }] =
    await Promise.all([
      supabase.from("teams").select("id,domain"),
      supabase.from("leaderboard").select("team_id,team_name,total_score")
    ]);

  if (teamsError || lbError) {
    return res.status(500).json({
      error: teamsError?.message || lbError?.message || "Leaderboard fetch failed."
    });
  }

  const domainById = (teams || []).reduce((acc, team) => {
    acc[team.id] = team.domain || "Unassigned";
    return acc;
  }, {});

  const leaderboardRows = (leaderboard || []).map((row) => ({
    team_id: row.team_id,
    team_name: row.team_name,
    domain: domainById[row.team_id] || "Unassigned",
    total_score: Number(row.total_score || 0)
  }));

  const leaderboardByDomain = leaderboardRows.reduce((acc, row) => {
    const domain = row.domain || "Unassigned";
    if (!acc[domain]) {
      acc[domain] = [];
    }
    acc[domain].push(row);
    return acc;
  }, {});

  Object.values(leaderboardByDomain).forEach((rows) => {
    rows.sort((a, b) => {
      if (b.total_score !== a.total_score) {
        return b.total_score - a.total_score;
      }
      return a.team_name.localeCompare(b.team_name);
    });
  });

  return res.json({ leaderboardByDomain });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
