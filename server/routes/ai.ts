import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

const PACKAGES = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9"];

type CEData = Record<string, Record<string, string>>;
type LocInfo = { code: string; name: { vi: string; en: string } };

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY chưa được cấu hình trong file .env");
  return new Anthropic({ apiKey: key });
}

router.post("/analyze-pyramid", async (req, res) => {
  const { ceEMP, ceAPP, sk, locations } = req.body as {
    ceEMP: CEData | undefined;
    ceAPP: CEData | undefined;
    sk: "prime" | "supplier";
    locations: LocInfo[];
  };

  // Combine EMP + APP for each location/package
  const totByPkg = PACKAGES.map(p =>
    (locations || []).reduce((s, l) =>
      s +
      (parseFloat(ceEMP?.[l.code]?.[p] || "") || 0) +
      (parseFloat(ceAPP?.[l.code]?.[p] || "") || 0), 0)
  );
  const grand = totByPkg.reduce((s, v) => s + v, 0);

  if (grand === 0) {
    res.json({ analysis: "Chưa có dữ liệu effort để phân tích." });
    return;
  }

  const base  = totByPkg[0] + totByPkg[1] + totByPkg[2];
  const belly = totByPkg[3] + totByPkg[4] + totByPkg[5];
  const top   = totByPkg[6] + totByPkg[7] + totByPkg[8];

  const pkgSummary = PACKAGES.map((p, i) =>
    totByPkg[i] > 0 ? `${p}=${totByPkg[i].toFixed(1)}` : null
  ).filter(Boolean).join(", ");

  // Per-location breakdown showing EMP and APP separately
  const locationDetails = (locations || []).map(loc => {
    const empVals = PACKAGES.map(p => {
      const v = parseFloat(ceEMP?.[loc.code]?.[p] || "") || 0;
      return v > 0 ? `${p}=${v.toFixed(1)}` : null;
    }).filter(Boolean);
    const appVals = PACKAGES.map(p => {
      const v = parseFloat(ceAPP?.[loc.code]?.[p] || "") || 0;
      return v > 0 ? `${p}=${v.toFixed(1)}` : null;
    }).filter(Boolean);
    const parts: string[] = [];
    if (empVals.length > 0) parts.push(`EMP: ${empVals.join(", ")}`);
    if (appVals.length > 0) parts.push(`APP: ${appVals.join(", ")}`);
    return parts.length > 0 ? `  ${loc.code} (${loc.name.vi}): ${parts.join(" | ")}` : null;
  }).filter(Boolean).join("\n");

  const skLabel = sk === "prime" ? "Prime (nội bộ)" : "Supplier (đối tác)";

  const prompt = `Bạn là chuyên gia quản lý nguồn lực dự án phần mềm (FSU outsourcing model).

Dữ liệu Calendar Effort (MM) — nhóm ${skLabel}, tổng hợp cả EMP (nhân viên chính thức) và APP (hợp đồng dự án):

Tổng theo cấp (EMP+APP): ${pkgSummary}
Tổng toàn nhóm: ${grand.toFixed(1)} MM

Chi tiết theo địa điểm:
${locationDetails || "  (không có chi tiết theo địa điểm)"}

Phân tầng (EMP+APP): Chân (P1-P3): ${base.toFixed(1)} MM (${((base / grand) * 100).toFixed(0)}%) | Thân (P4-P6): ${belly.toFixed(1)} MM (${((belly / grand) * 100).toFixed(0)}%) | Đỉnh (P7-P9): ${top.toFixed(1)} MM (${((top / grand) * 100).toFixed(0)}%)

Trong đó: P1=thấp nhất (fresher/junior), P9=cao nhất (senior/lead/architect). Mô hình tháp chuẩn cho dự án outsourcing: chân (P1-P3) > thân (P4-P6) > đỉnh (P7-P9) để tối ưu chi phí và rủi ro.

Hãy phân tích ngắn gọn (3-4 câu, tiếng Việt thuần, không dùng markdown, không bullet point, không tiêu đề): nhận xét hình dạng tháp hiện tại, rủi ro về chi phí hoặc năng lực, và đề xuất điều chỉnh cụ thể nếu cần.`;

  try {
    const client = getClient();
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });
    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    res.json({ analysis: text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi không xác định";
    res.status(500).json({ error: message });
  }
});

export default router;
