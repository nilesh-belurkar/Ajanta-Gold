import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";

admin.initializeApp();

const corsHandler = cors({ origin: true });

export const uploadInvoicePdf = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      const { base64Pdf, invoiceNo } = req.body;

      if (!base64Pdf || !invoiceNo) {
        res.status(400).send("Missing base64Pdf or invoiceNo");
        return;
      }

      // 🔹 random file name (SECURE)
      const fileName = `invoices/${uuidv4()}.pdf`;

      const bucket = admin.storage().bucket();
      const file = bucket.file(fileName);

      const buffer = Buffer.from(base64Pdf, "base64");

      await file.save(buffer, {
        contentType: "application/pdf",
      });

      // 🔹 public access (no expiry)
      await file.makePublic();

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

      // 🔹 optional: save mapping
      await admin.firestore().collection("invoices").doc(invoiceNo).set({
        invoiceNo,
        filePath: fileName,
        fileUrl: publicUrl,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.status(200).json({ url: publicUrl });

    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      res.status(500).send("Internal Server Error");
    }
  });
});
