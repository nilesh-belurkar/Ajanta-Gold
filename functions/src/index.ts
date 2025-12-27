import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";

admin.initializeApp();

const corsHandler = cors({ origin: true });

/* =====================================================
   🔐 VERIFY AUTH (ANY LOGGED-IN USER)
===================================================== */
async function verifyUser(req: any): Promise<string> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw { status: 401, message: "Missing Authorization token" };
  }

  const idToken = authHeader.replace("Bearer ", "").trim();

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch {
    throw { status: 401, message: "Invalid or expired token" };
  }

  return decoded.uid;
}

/* =====================================================
   📄 UPLOAD INVOICE PDF (ALL USERS)
===================================================== */
export const uploadInvoicePdf = functions
  .runWith({
    memory: "1GB",              // needed for PDF + canvas
    timeoutSeconds: 120
  })
  .https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
      try {
        // 🔴 REQUIRED for CORS preflight
        if (req.method === "OPTIONS") {
          return res.status(204).send("");
        }

        if (req.method !== "POST") {
          return res.status(405).send("Method Not Allowed");
        }

        const uid = await verifyUser(req);

        const { base64Pdf, invoiceNo } = req.body;

        if (!base64Pdf || !invoiceNo) {
          return res.status(400).send("base64Pdf and invoiceNo are required");
        }

        const bucket = admin.storage().bucket();
        const filePath = `invoices/${invoiceNo}-${uuidv4()}.pdf`;
        const file = bucket.file(filePath);

        const buffer = Buffer.from(base64Pdf, "base64");

        await file.save(buffer, {
          contentType: "application/pdf",
          resumable: false,
        });

        await file.makePublic();

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

        await admin.firestore().collection("bill_list").doc(invoiceNo).set(
          {
            invoiceNo,
            filePath,
            fileUrl: publicUrl,
            uploadedBy: uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        return res.status(200).json({ url: publicUrl });

      } catch (err: any) {
        console.error("UPLOAD ERROR FULL:", err);

        if (err.status) {
          return res.status(err.status).send(err.message);
        }

        return res.status(500).send("Internal Server Error");
      }
    });
  });
