import { Router } from "express";
import { requireRole } from "../middleware/auth";
import { findUserByEmail } from "../graphClient";

const router = Router();

// GET /api/azure-user?email=...
// Look up a user's display name in Azure AD via Microsoft Graph.
// Requires App Registration to have User.Read.All (Application) + admin consent.
// Returns null (not an error) if user not found or Graph not configured.

router.get("/azure-user", requireRole(["PM", "SM", "PMO", "DCL"]), async (req, res) => {
  const { email } = req.query as { email?: string };

  if (!email?.trim()) {
    res.status(400).json({ success: false, error: "Email không được để trống." });
    return;
  }

  try {
    const user = await findUserByEmail(email.trim());
    if (user) {
      res.json({ success: true, data: { name: user.displayName, email: user.mail ?? email.trim() } });
    } else {
      res.json({ success: true, data: null });
    }
  } catch (err) {
    // Graceful fallback — Graph not configured or network issue
    console.warn("Graph API lookup failed:", (err as Error).message);
    res.json({ success: true, data: null });
  }
});

export default router;
