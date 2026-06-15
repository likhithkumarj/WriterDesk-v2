const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://jijfygabtkkjcfwdzygz.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppamZ5Z2FidGtramNmd2R6eWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMTY5NDEsImV4cCI6MjA5NTc5Mjk0MX0.Qit8m2QYZeEPMPrunS3-5v-fHMNFhXMPQBSNd875xdc";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testColumn(colName) {
  console.log(`Checking column '${colName}'...`);
  const { data, error } = await supabase
    .from("collaborators")
    .select(colName)
    .limit(1);

  if (error) {
    console.log(`Column '${colName}' check error:`, error.message);
  } else {
    console.log(`Column '${colName}' check success:`, data);
  }
}

async function main() {
  await testColumn("project_title");
  await testColumn("invited_by");
}

main();
