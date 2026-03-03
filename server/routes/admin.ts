import { Router } from "express";
import { pool } from "../db";
import { requirePmoOrDcl } from "../middleware/auth";

const router = Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAdmin(row: any) {
  const g = (k: string) => typeof row[k] === "string" ? JSON.parse(row[k]) : row[k];
  return {
    targetGrossMargin:     Number(row.target_gross_margin),
    targetDirectMargin:    Number(row.target_direct_margin),
    projectIncomePct:      Number(row.project_income_pct),
    roles:                 g("roles")          ?? [],
    contractTypes:         g("contract_types") ?? [],
    locations:             g("locations")      ?? [],
    otherCostCats:         g("other_cost_cats") ?? [],
    costRef:               g("cost_ref")       ?? {},
    lastUpdatedRoles:      row.last_updated_roles      ?? undefined,
    lastUpdatedContracts:  row.last_updated_contracts  ?? undefined,
    lastUpdatedLocations:  row.last_updated_locations  ?? undefined,
    lastUpdatedOtherCats:  row.last_updated_other_cats ?? undefined,
  };
}

// Default salary/insurance tables — used if admin_config row is missing
function getDefaultCostRef() {
  const PKGS = ["P1","P2","P3","P4","P5","P6","P7","P8","P9"];
  const LOCS = ["HN","HL","DN","HCM","CT","QNH","HUE","NT"];
  const PRIMER: Record<string,number[]> = {
    HN:[236,409,562,802,1187,1611,2094,2546,3340], HL:[236,409,562,802,1187,1611,2094,2546,3340],
    DN:[236,389,534,762,1128,1532,1988,2420,3340], HCM:[236,428,589,841,1246,1694,2200,2672,3340],
    CT:[236,428,589,841,1246,1694,2200,2672,3340], QNH:[236,389,534,762,1128,1532,1988,2420,3340],
    HUE:[236,389,534,762,1128,1532,1988,2420,3340], NT:[236,389,534,762,1128,1532,1988,2420,3340],
  };
  const INS: Record<string,number[]> = {
    HN:[51,51,51,54,54,63,63,63,189], HL:[51,51,51,54,54,63,63,63,189],
    DN:[51,51,51,54,54,63,63,63,189], HCM:[51,51,51,54,54,63,63,63,189],
    CT:[51,51,51,54,54,63,63,63,189], QNH:[46,46,46,49,49,58,58,58,189],
    HUE:[51,51,51,54,54,63,63,63,189], NT:[51,51,51,54,54,63,63,63,189],
  };
  const bt = (seed: Record<string,number[]>) => {
    const t: Record<string,Record<string,string>> = {};
    LOCS.forEach(l => { t[l] = {}; PKGS.forEach((p,i) => { t[l][p] = seed[l]?.[i]?.toString() ?? ""; }); });
    return t;
  };
  const today = new Date().toISOString().split("T")[0];
  return {
    Primer: {
      salary:    { table: bt(PRIMER), unit: "USD", lastUpdated: today },
      insurance: { table: bt(INS),    unit: "USD", lastUpdated: today },
    },
    Supplier: {
      salary:    { table: bt(PRIMER), unit: "USD", lastUpdated: today },
      insurance: null,
    },
  };
}

function getDefaultAdmin() {
  return {
    targetGrossMargin: 40, targetDirectMargin: 54, projectIncomePct: 30,
    roles: ["Project Manager","Business Analyst","Tech Lead","Senior Developer","Developer",
            "Junior Developer","QA Engineer","DevOps","Designer","Comtor","Scrum Master"],
    contractTypes: ["EMP","APP","POI"],
    locations: [
      { code:"HN",  name:{vi:"Hà Nội",      en:"Hanoi"},       active:true },
      { code:"HL",  name:{vi:"Hoà Lạc",     en:"Hoa Lac"},     active:true },
      { code:"DN",  name:{vi:"Đà Nẵng",     en:"Da Nang"},     active:true },
      { code:"HCM", name:{vi:"Hồ Chí Minh", en:"Ho Chi Minh"}, active:true },
      { code:"CT",  name:{vi:"Cần Thơ",     en:"Can Tho"},     active:true },
      { code:"QNH", name:{vi:"Quy Nhơn",    en:"Quy Nhon"},    active:true },
      { code:"HUE", name:{vi:"Huế",          en:"Hue"},         active:true },
      { code:"NT",  name:{vi:"Nha Trang",   en:"Nha Trang"},   active:true },
    ],
    otherCostCats: ["AI License","VDI","Office Mini","Office 365","Cloud Infrastructure","Other"],
    costRef: getDefaultCostRef(),
  };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /api/admin
router.get("/admin", async (_req, res) => {
  const { rows } = await pool.query("SELECT * FROM admin_config WHERE id=1");
  if (rows.length === 0) {
    // Auto-insert defaults if the table is empty
    const d = getDefaultAdmin();
    await pool.query(
      `INSERT INTO admin_config (id, target_gross_margin, target_direct_margin, project_income_pct,
         roles, contract_types, locations, other_cost_cats, cost_ref)
       VALUES (1,$1,$2,$3,$4,$5,$6,$7,$8)`,
      [d.targetGrossMargin, d.targetDirectMargin, d.projectIncomePct,
       JSON.stringify(d.roles), JSON.stringify(d.contractTypes),
       JSON.stringify(d.locations), JSON.stringify(d.otherCostCats), JSON.stringify(d.costRef)]
    );
    res.json(d);
    return;
  }
  res.json(mapAdmin(rows[0]));
});

// PUT /api/admin  — full upsert (PMO/DCL only)
router.put("/admin", requirePmoOrDcl, async (req, res) => {
  const c = req.body;
  const { rows } = await pool.query(
    `INSERT INTO admin_config
       (id, target_gross_margin, target_direct_margin, project_income_pct,
        roles, contract_types, locations, other_cost_cats, cost_ref,
        last_updated_roles, last_updated_contracts, last_updated_locations,
        last_updated_other_cats, updated_at)
     VALUES (1,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
     ON CONFLICT (id) DO UPDATE SET
       target_gross_margin=$1, target_direct_margin=$2, project_income_pct=$3,
       roles=$4, contract_types=$5, locations=$6, other_cost_cats=$7, cost_ref=$8,
       last_updated_roles=$9, last_updated_contracts=$10,
       last_updated_locations=$11, last_updated_other_cats=$12,
       updated_at=NOW()
     RETURNING *`,
    [
      c.targetGrossMargin ?? 40, c.targetDirectMargin ?? 54, c.projectIncomePct ?? 0,
      JSON.stringify(c.roles ?? []), JSON.stringify(c.contractTypes ?? []),
      JSON.stringify(c.locations ?? []), JSON.stringify(c.otherCostCats ?? []),
      JSON.stringify(c.costRef ?? {}),
      c.lastUpdatedRoles ?? null, c.lastUpdatedContracts ?? null,
      c.lastUpdatedLocations ?? null, c.lastUpdatedOtherCats ?? null,
    ]
  );
  res.json(mapAdmin(rows[0]));
});

export default router;
