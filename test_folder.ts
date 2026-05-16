import { google } from "googleapis";
const GOOGLE_SERVICE_ACCOUNT_CREDENTIALS = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS || "";
const FOLDER_ID = "1x3FDcRrxGnMRJ_B1db6eaBUS8LrnXGsT";

async function run() {
  const credentials = JSON.parse(GOOGLE_SERVICE_ACCOUNT_CREDENTIALS);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  const drive = google.drive({ version: "v3", auth });
  try {
    const res = await drive.files.get({ fileId: FOLDER_ID });
    console.log("Folder found:", res.data.name);
  } catch (err: any) {
    console.error("Folder error:", err.message);
  }
}
run();
