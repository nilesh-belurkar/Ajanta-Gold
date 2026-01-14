import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";

admin.initializeApp();
const corsHandler = cors({ origin: true });

async function verifyUser(req: any): Promise<string> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw { status: 401, message: "Missing Authorization token" };
  }
  const token = authHeader.replace("Bearer ", "").trim();
  const decoded = await admin.auth().verifyIdToken(token);
  return decoded.uid;
}

export const uploadInvoicePdf = functions
  .runWith({ memory: "1GB", timeoutSeconds: 120 })
  .https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
      try {
        if (req.method === "OPTIONS") return res.status(204).send("");
        if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

        await verifyUser(req);

        const { base64Pdf, invoiceNo } = req.body;

        if (
          typeof invoiceNo !== "string" ||
          invoiceNo.trim().length < 3 ||
          typeof base64Pdf !== "string"
        ) {
          return res.status(400).send("Invalid input");
        }

        const cleanedBase64 = base64Pdf.replace(
          /^data:application\/pdf;base64,/,
          ""
        );

        const buffer = Buffer.from(cleanedBase64, "base64");

        if (
          buffer.length < 1000 ||
          !buffer.slice(0, 4).toString().startsWith("%PDF")
        ) {
          return res.status(400).send("Invalid PDF");
        }

        const bucket = admin.storage().bucket();
        const filePath = `invoices/${invoiceNo.trim()}-${uuidv4()}.pdf`;
        const file = bucket.file(filePath);

        // 1️⃣ Upload PDF
        await file.save(buffer, {
          contentType: "application/pdf",
          resumable: false,
        });

        // 2️⃣ Make file public (old working behavior)
        await file.makePublic();

        // 3️⃣ Short public URL
        const publicUrl =
          `https://storage.googleapis.com/${bucket.name}/${file.name}`;

        // 4️⃣ Return URL to frontend
        return res.status(200).json({
          filePath,
          url: publicUrl,
        });


      } catch (err: any) {
        console.error("UPLOAD ERROR:", err);
        return res.status(err.status || 500).send(err.message || "Internal Error");
      }
    });
  });
