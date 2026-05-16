import { google } from "googleapis";

const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || "";
const GOOGLE_SERVICE_ACCOUNT_CREDENTIALS = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS || "";

async function run() {
  if (!GOOGLE_SERVICE_ACCOUNT_CREDENTIALS) {
    console.log(" Variável GOOGLE_SERVICE_ACCOUNT_CREDENTIALS não encontrada no ambiente (process.env).");
    return;
  }
  
  try {
    const credentials = JSON.parse(GOOGLE_SERVICE_ACCOUNT_CREDENTIALS);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive.readonly", "https://www.googleapis.com/auth/drive.file"],
    });
    
    const drive = google.drive({ version: "v3", auth });
    
    const res = await drive.files.list({
      pageSize: 10,
      fields: "files(id, name)",
    });
    
    console.log("✅ Autenticação bem-sucedida! Drive conectado.");
    console.log("ID da Pasta configurado:", GOOGLE_DRIVE_FOLDER_ID);
    
  } catch (err: any) {
    console.error("❌ Erro na autenticação:", err.message);
  }
}

run();
