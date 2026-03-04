/**
 * Microsoft Graph API client — client credentials flow.
 * Requires: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET
 * Azure AD App Registration needs: User.Read.All (Application permission) + admin consent
 */

const GRAPH_BASE   = "https://graph.microsoft.com/v1.0";
const TENANT_ID    = process.env.AZURE_TENANT_ID    || "";
const CLIENT_ID    = process.env.AZURE_CLIENT_ID    || "";
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET || "";

// ─── Token cache ───────────────────────────────────────────────────────────────

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAppToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("Azure AD client credentials not configured (missing AZURE_CLIENT_SECRET)");
  }

  const body = new URLSearchParams({
    grant_type:    "client_credentials",
    client_id:     CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope:         "https://graph.microsoft.com/.default",
  });

  const res = await fetch(
    `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
    { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body }
  );

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to acquire Graph token: ${res.status} ${txt}`);
  }

  const data = await res.json() as { access_token: string; expires_in: number };
  cachedToken    = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000; // 60-second buffer
  return cachedToken;
}

// ─── User lookup ───────────────────────────────────────────────────────────────

export interface GraphUser {
  displayName: string;
  mail:             string | null;
  userPrincipalName: string;
}

/**
 * Find a user in Azure AD by their email address.
 * Works for both internal org users and external guests (via mail property).
 * Returns null if not found or if Graph is not configured.
 */
export async function findUserByEmail(email: string): Promise<GraphUser | null> {
  const token = await getAppToken();
  const e = email.toLowerCase().trim();

  async function query(filter: string): Promise<GraphUser | null> {
    const params = new URLSearchParams({
      "$filter": filter,
      "$select": "displayName,mail,userPrincipalName",
      "$top":    "1",
    });
    const res = await fetch(`${GRAPH_BASE}/users?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Graph query failed (${res.status}): ${body}`);
    }
    const data = await res.json() as { value: GraphUser[] };
    return data.value[0] ?? null;
  }

  // 1. Try by mail (works for both internal and external/guest users)
  const byMail = await query(`mail eq '${e}'`);
  if (byMail) return byMail;

  // 2. Try by userPrincipalName (internal users whose UPN == email)
  const byUpn = await query(`userPrincipalName eq '${e}'`);
  return byUpn;
}
