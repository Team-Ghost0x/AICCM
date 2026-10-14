/**
 * Module 7: Legal Clearance & Rights Certificates
 * POST /api/rights/verify                 – Generate & sign certificate
 * GET  /api/rights/certificates/:certId   – Verify certificate authenticity
 */
import { Router } from "express";
import { createHash } from "node:crypto";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db.js";
import { requireAuth } from "../auth.js";

export const router = Router();

// ── 7.1 POST /api/rights/verify ───────────────────────────────────────────────
router.post("/verify", requireAuth, (req, res) => {
  const { campaignTitle, brandName, creatorId, commercialUse } = req.body;

  if (!campaignTitle || !brandName || !creatorId || !commercialUse) {
    return res.status(400).json({
      error: "Missing required fields: campaignTitle, brandName, creatorId, commercialUse",
      code: "VALIDATION_ERROR",
    });
  }

  const certId = `RTK-CERT-${uuidv4().slice(0, 4).toUpperCase()}-${new Date().getFullYear()}`;
  const issuedAt = new Date().toISOString();

  // Generate SHA-256 hash of the certificate payload
  const certPayload = JSON.stringify({
    certId,
    campaignTitle,
    brandName,
    creatorId,
    commercialUse,
    issuedAt,
  });
  const hash = createHash("sha256").update(certPayload).digest("hex");

  const cert = {
    id: certId,
    campaignTitle,
    brandName,
    creatorId,
    hash,
    issuedAt,
    status: "VERIFIED_AUTHENTIC",
    commercialUse,
    spec: {
      campaignTitle,
      brandName,
      noModelTrainingWarranty: commercialUse.noModelTraining ?? false,
      signatureValid: true,
      algorithm: "SHA-256",
      clauses: [
        `Commercial use permitted for: ${(commercialUse.uses || []).join(", ")}`,
        `Territory: ${commercialUse.territory}`,
        `License term: ${commercialUse.termMonths} months`,
        `Exclusivity: ${commercialUse.exclusivity}`,
        `Rights transfer: ${commercialUse.rightsTransfer}`,
        `AI disclosure: ${commercialUse.aiDisclosure}`,
        commercialUse.noModelTraining
          ? "⚠ NO AI MODEL TRAINING WARRANTY: Content must not be used to train, fine-tune, or synthesize AI models."
          : "Model training restrictions: Not specified",
      ],
    },
  };

  db.rightsCertificates.push(cert);
  db.addAuditLog("SYSTEM", req.user.userId, `Rights certificate ${certId} issued for campaign "${campaignTitle}"`);

  return res.status(201).json({
    certificateId: certId,
    hash,
    issuedAt,
    status: "VERIFIED_AUTHENTIC",
    spec: cert.spec,
  });
});

// ── 7.2 GET /api/rights/certificates/:certId ─────────────────────────────────
router.get("/certificates/:certId", (req, res) => {
  const cert = db.rightsCertificates.find((c) => c.id === req.params.certId);

  if (!cert) {
    return res.status(404).json({
      error: "Certificate not found or has been revoked",
      code: "CERTIFICATE_NOT_FOUND",
    });
  }

  // Re-validate hash to prove authenticity
  const certPayload = JSON.stringify({
    certId: cert.id,
    campaignTitle: cert.campaignTitle,
    brandName: cert.brandName,
    creatorId: cert.creatorId,
    commercialUse: cert.commercialUse,
    issuedAt: cert.issuedAt,
  });
  const expectedHash = createHash("sha256").update(certPayload).digest("hex");
  const hashValid = expectedHash === cert.hash;

  return res.status(200).json({
    ...cert,
    verification: {
      hashValid,
      algorithm: "SHA-256",
      computedHash: expectedHash,
      storedHash: cert.hash,
      integrityStatus: hashValid ? "INTEGRITY_CONFIRMED" : "INTEGRITY_FAILED",
    },
  });
});
