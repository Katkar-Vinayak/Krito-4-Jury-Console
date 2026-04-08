import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const makeKey = () => `JURY-${randomBytes(6).toString("hex").toUpperCase()}`;

const main = async () => {
  const keys = Array.from({ length: 20 }, makeKey).map((key) => ({ key }));

  const { error } = await supabase.from("jury_keys").insert(keys);
  if (error) {
    console.error("Failed to insert keys:", error.message);
    process.exit(1);
  }

  console.log("Inserted 20 jury keys.");
};

main();
