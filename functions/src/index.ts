import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";

admin.initializeApp();

const corsHandler = cors({ origin: true });

/**
 * =====================================================
 * 🔐 Helper: verify token + check admin role
 * =====================================================
 */
async function verifyActiveAdmin(req: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED");
  }

  const idToken = authHeader.split("Bearer ")[1];
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  const uid = decodedToken.uid;

  const userSnap = await admin.firestore()
    .collection("users")
    .doc(uid)
    .get();

  if (!userSnap.exists) {
    throw new Error("USER_NOT_FOUND");
  }

  const user = userSnap.data();

  if (user?.role !== "admin" || user?.active !== true) {
    throw new Error("FORBIDDEN");
  }

  return uid;
}

/**
 * =====================================================
 * 🔑 ROLE MANAGEMENT FUNCTION
 * =====================================================
 */
export const updateUserRole = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }

      await verifyActiveAdmin(req);

      const { targetUid, role } = req.body;

      if (!targetUid || !role) {
        return res.status(400).send("targetUid and role are required");
      }

      if (!["admin", "staff"].includes(role)) {
        return res.status(400).send("Invalid role");
      }

      await admin.firestore().collection("users").doc(targetUid).set(
        {
          role,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return res.status(200).json({ success: true });

    } catch (err: any) {
      console.error("ROLE UPDATE ERROR:", err);

      if (err.message === "UNAUTHORIZED") {
        return res.status(401).send("Unauthorized");
      }
      if (err.message === "FORBIDDEN") {
        return res.status(403).send("Only active admin allowed");
      }

      return res.status(500).send("Internal Server Error");
    }
  });
});

/**
 * =====================================================
 * 📄 INVOICE PDF UPLOAD (ADMIN ONLY)
 * =====================================================
 */
export const uploadInvoicePdf = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }

      const adminUid = await verifyActiveAdmin(req);

      const { base64Pdf, invoiceNo } = req.body;

      if (!base64Pdf || !invoiceNo) {
        return res.status(400).send("Missing base64Pdf or invoiceNo");
      }

      const fileName = `invoices/${uuidv4()}.pdf`;
      const bucket = admin.storage().bucket();
      const file = bucket.file(fileName);

      const buffer = Buffer.from(base64Pdf, "base64");

      await file.save(buffer, {
        contentType: "application/pdf",
      });

      // ⚠️ Public forever – acceptable for WhatsApp invoices
      await file.makePublic();

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

      await admin.firestore().collection("bill_list").doc(invoiceNo).set({
        invoiceNo,
        filePath: fileName,
        fileUrl: publicUrl,
        uploadedBy: adminUid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(200).json({ url: publicUrl });

    } catch (err: any) {
      console.error("UPLOAD ERROR:", err);

      if (err.message === "UNAUTHORIZED") {
        return res.status(401).send("Unauthorized");
      }
      if (err.message === "FORBIDDEN") {
        return res.status(403).send("Only active admin allowed");
      }

      return res.status(500).send("Internal Server Error");
    }
  });
});
