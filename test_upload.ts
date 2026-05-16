import { google } from "googleapis";
import { Readable } from "stream";

let GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || "";
const GOOGLE_SERVICE_ACCOUNT_CREDENTIALS = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS || "";

async function run() {
  try {
    const credentials = JSON.parse(GOOGLE_SERVICE_ACCOUNT_CREDENTIALS);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });
    
    const drive = google.drive({ version: "v3", auth });
    
    if (GOOGLE_DRIVE_FOLDER_ID.startsWith("https:")) {
       GOOGLE_DRIVE_FOLDER_ID = GOOGLE_DRIVE_FOLDER_ID.split("https:")[1];
       if (GOOGLE_DRIVE_FOLDER_ID.startsWith("//")) GOOGLE_DRIVE_FOLDER_ID = GOOGLE_DRIVE_FOLDER_ID.substring(2);
    }

    console.log("Using Folder ID:", GOOGLE_DRIVE_FOLDER_ID);
    
    const bufferStream = new Readable();
    bufferStream.push("Test file content");
    bufferStream.push(null);

    const media = {
      mimeType: "text/plain",
      body: bufferStream,
    };

    const res = await drive.files.create({
      requestBody: {
        name: "test_upload.txt",
        parents: [GOOGLE_DRIVE_FOLDER_ID],
      },
      media: media,
      fields: "id",
    });
    
    console.log("✅ Arquivo teste criado com sucesso! ID:", res.data.id);
    
  } catch (err: any) {
    console.error("❌ Erro no upload de teste:", err.message);
  }
}

run();
