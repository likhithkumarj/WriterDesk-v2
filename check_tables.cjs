const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://jijfygabtkkjcfwdzygz.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppamZ5Z2FidGtramNmd2R6eWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMTY5NDEsImV4cCI6MjA5NTc5Mjk0MX0.Qit8m2QYZeEPMPrunS3-5v-fHMNFhXMPQBSNd875xdc";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTable(tableName) {
  console.log(`Checking table '${tableName}'...`);
  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .limit(1);

  if (error) {
    console.log(`Table '${tableName}' check error:`, error.message);
  } else {
    console.log(`Table '${tableName}' check success:`, data);
  }
}

async function main() {
  await testTable("invitations");
  await testTable("notifications");
  await testTable("alerts");
  await testTable("invites");
}

main();
