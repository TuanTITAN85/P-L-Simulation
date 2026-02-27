import { useState, useMemo, useRef } from "react";

// Type definitions
interface Location {
  code: string;
  name: { vi: string; en: string };
  active?: boolean;
}

interface CostRefItem {
  table: Record<string, Record<string, string>>;
  unit: string;
  lastUpdated: string;
}

interface CostRef {
  Primer: { salary: CostRefItem; insurance: CostRefItem };
  Supplier: { salary: CostRefItem; insurance: null };
}

interface AdminConfig {
  targetGrossMargin: number;
  targetDirectMargin: number;
  projectIncomePct: number;
  roles: string[];
  contractTypes: string[];
  locations: Location[];
  costRef: CostRef;
  otherCostCats: string[];
}

interface OtherCostItem {
  id: number;
  category: string;
  unitPrice: string;
  qty: string;
  months: string;
  note: string;
}

interface PhaseData {
  offshore: { billableMM: string; wipRevenue: string };
  onsite: { billableMM: string; wipRevenue: string };
  currency: string;
  prime: VNSection;
  supplier: VNSection;
  onsiteCeEMP: string;
  onsiteCeAPP: string;
  onsiteUnitSalEMP: string;
  onsiteUnitSalAPP: string;
  onsiteOtherExp: string;
  otherCosts: OtherCostItem[];
}

interface VNSection {
  ceEMP: Record<string, Record<string, string>>;
  ceAPP: Record<string, Record<string, string>>;
  otCampaignPct: number;
  xjob: string;
  otherExp: string;
}

interface SimData {
  planning: PhaseData;
  forecast: PhaseData;
}

interface Version {
  id: number;
  type: string;
  date: string;
  note: string;
  createdBy: string;
  data: SimData;
}

interface ActualEntry {
  id: number;
  month: string;
  importedAt: string;
  rows: Record<string, string>[];
  fileName: string;
  offshoreActualMM: number;
  onsiteActualMM: number;
}

interface Project {
  id: number;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  currency: string;
  status: string;
  versions: Version[];
  actualData: { prime: ActualEntry[]; supplier: ActualEntry[] };
}

interface PLResult {
  empCost: number;
  appCost: number;
  insCost: number;
  otCamp: number;
  xjob: number;
  other: number;
  personnel: number;
  total: number;
}

interface PhasePLResult {
  primePL: PLResult;
  supplierPL: PLResult;
  onsiteTotal: number;
  oEMP: number;
  oAPP: number;
  oOther: number;
  otherCostsTotal: number;
  offRev: number;
  onsRev: number;
  totalRev: number;
  totalCost: number;
  grossProfit: number;
  grossMargin: number;
  directMargin: number;
}

const PACKAGES = ["P1","P2","P3","P4","P5","P6","P7","P8","P9"];
const SIM_TYPES = [
  {key:"bidding",vi:"Bidding",en:"Bidding"},
  {key:"planning",vi:"Project Planning",en:"Project Planning"},
  {key:"monthly",vi:"Cập nhật tháng",en:"Monthly Update"},
  {key:"adhoc",vi:"Adhoc",en:"Adhoc"},
];
const DEFAULT_LOCS: Location[] = [
  {code:"HN",name:{vi:"Hà Nội",en:"Hanoi"}},
  {code:"HL",name:{vi:"Hoà Lạc",en:"Hoa Lac"}},
  {code:"DN",name:{vi:"Đà Nẵng",en:"Da Nang"}},
  {code:"HCM",name:{vi:"Hồ Chí Minh",en:"Ho Chi Minh"}},
  {code:"CT",name:{vi:"Cần Thơ",en:"Can Tho"}},
  {code:"QNH",name:{vi:"Quy Nhơn",en:"Quy Nhon"}},
  {code:"HUE",name:{vi:"Huế",en:"Hue"}},
  {code:"NT",name:{vi:"Nha Trang",en:"Nha Trang"}},
];
const DEFAULT_ROLES = ["Project Manager","Business Analyst","Tech Lead","Senior Developer","Developer","Junior Developer","QA Engineer","DevOps","Designer","Comtor","Scrum Master"];
const DEFAULT_CONTRACTS = ["EMP","APP","POI"];
const DEFAULT_OTHER_COST_CATS = ["AI License","VDI","Office Mini","Office 365","Cloud Infrastructure","Other"];

const PRIMER_SAL: Record<string, number[]> = {HN:[236,409,562,802,1187,1611,2094,2546,3340],HL:[236,409,562,802,1187,1611,2094,2546,3340],DN:[236,389,534,762,1128,1532,1988,2420,3340],HCM:[236,428,589,841,1246,1694,2200,2672,3340],CT:[236,428,589,841,1246,1694,2200,2672,3340],QNH:[236,389,534,762,1128,1532,1988,2420,3340],HUE:[236,389,534,762,1128,1532,1988,2420,3340],NT:[236,389,534,762,1128,1532,1988,2420,3340]};
const SUPPLIER_SAL: Record<string, number[]> = {HN:[236,409,562,802,1187,1611,2094,2546,3340],HL:[236,409,562,802,1187,1611,2094,2546,3340],DN:[236,389,534,762,1128,1532,1988,2420,3340],HCM:[236,428,589,841,1246,1694,2200,2672,3340],CT:[236,428,589,841,1246,1694,2200,2672,3340],QNH:[236,389,534,762,1128,1532,1988,2420,3340],HUE:[236,389,534,762,1128,1532,1988,2420,3340],NT:[236,389,534,762,1128,1532,1988,2420,3340]};
const SHARED_INS: Record<string, number[]> = {HN:[51,51,51,54,54,63,63,63,189],HL:[51,51,51,54,54,63,63,63,189],DN:[51,51,51,54,54,63,63,63,189],HCM:[51,51,51,54,54,63,63,63,189],CT:[51,51,51,54,54,63,63,63,189],QNH:[46,46,46,49,49,58,58,58,189],HUE:[51,51,51,54,54,63,63,63,189],NT:[51,51,51,54,54,63,63,63,189]};

const buildTable = (seed: Record<string, number[]>): Record<string, Record<string, string>> => { 
  const t: Record<string, Record<string, string>> = {}; 
  DEFAULT_LOCS.forEach(l => { 
    t[l.code] = {}; 
    PACKAGES.forEach((p, i) => { 
      t[l.code][p] = seed[l.code]?.[i]?.toString() || ""; 
    }); 
  }); 
  return t; 
};

const T = {
  vi:{
    appTitle:"P&L Simulation Tool",admin:"Quản trị",projects:"Dự án",
    projectList:"Danh sách dự án",addProject:"Thêm dự án",editProject:"Sửa thông tin dự án",
    projectCode:"Mã dự án",projectName:"Tên dự án",startDate:"Ngày bắt đầu",
    endDate:"Ngày kết thúc",currency:"Đơn vị tiền tệ",status:"Trạng thái",
    actions:"Thao tác",view:"Xem",del:"Xóa",save:"Lưu",cancel:"Hủy",back:"Quay lại",
    simVersions:"Phiên bản Simulation",addVersion:"Thêm phiên bản",
    versionType:"Loại",versionDate:"Ngày tạo",versionNote:"Ghi chú",createdBy:"Người tạo",openSim:"Mở Simulation",
    projectInfo:"Thông tin dự án",offshoreTeam:"Offshore Team",onsiteTeam:"Onsite Team (Long-term)",
    billableMM:"Billable MM",wipRevenue:"WIP Revenue",
    planningPhase:"Planning Phase",forecastPhase:"Forecast Remaining Phase",
    costPrime:"Chi phí VN - Prime/Partner",costSupplier:"Chi phí VN - Supplier (F1/IVS)",
    costOnsite:"Chi phí Onsite (Other OBs)",otherCosts:"Chi phí khác",
    calEffortEMP:"Calendar Effort - EMP (bao gồm PM)",calEffortAPP:"Calendar Effort - APP/POI",
    empSalaryCost:"EMP Salary Cost (Hard + 13th + Soft)",appSalaryCost:"Hard Salary Cost - APP/POI",
    insurance:"Insurance & FPT Care (EMP)",otCampaignPct:"OT & Campaign (%)",otCampaignCost:"OT & Campaign costs",
    xjob:"Xjob",electricity:"Điện, nước, chỗ ngồi",otherExp:"Chi phí khác",
    softSalary:"Estimated soft salary (EMP)",travelAllow:"Điện, nước, chỗ ngồi, phụ cấp",
    unitSalEMP:"Unit salary EMP ($/MM)",unitSalAPP:"Unit salary APP/POI ($/MM)",
    plSummary:"Kết quả P&L",totalRevenue:"Tổng doanh thu",totalCost:"Tổng chi phí",
    grossProfit:"Lợi nhuận gộp",grossMargin:"Gross Margin",directMargin:"Direct Margin",
    targetGM:"Target Gross Margin (%)",targetDM:"Target Direct Margin (%)",
    primeTotalCost:"Prime - Total direct cost in Vietnam",
    supplierTotalCost:"Supplier - Total direct cost in Vietnam",
    onsiteTotalCost:"Total direct cost at OB",
    otherTotalCost:"Total other costs",
    adminTitle:"Cấu hình hệ thống",targetSettings:"Target Margin",
    rolesConfig:"Cấu hình Role",contractConfig:"Loại hợp đồng",locationConfig:"Cấu hình Location",
    costRefConfig:"Bảng chi phí tham chiếu",projectIncomeConfig:"Project Income",
    otherCostCatsConfig:"Danh mục Chi phí khác",
    addRole:"Thêm role",addContract:"Thêm loại HĐ",addLocation:"Thêm location",addCat:"Thêm danh mục",
    tbd:"Sẽ cập nhật sau",total:"Tổng",location:"Location",package:"Package",
    noData:"Chưa có dữ liệu",active:"Đang hoạt động",completed:"Hoàn thành",onHold:"Tạm dừng",
    primer:"Primer",supplier:"Supplier",salaryRef:"Salary",insuranceRef:"Insurance & FPT Care",
    importCSV:"Import CSV",downloadTemplate:"Tải template",
    importSuccess:"Import thành công!",importError:"Lỗi import.",
    importGuide:"CSV cần cột: Location, P1...P9",
    editMode:"Chỉnh sửa",lastUpdated:"Cập nhật lần cuối",
    unsaved:"Chưa lưu",savedOK:"Đã lưu!",
    projectIncomePct:"Project Income %",projectIncomeNote:"EMP Cost = (1 + 8% + Project Income%) × SUMPRODUCT",
    actualData:"Actual Data",actualPrime:"Actual - Prime/Partner",actualSupplier:"Actual - Supplier",
    importActual:"Import Actual Data",
    forecastNote:"Forecast Remaining Phase: chỉ chứa chi phí giai đoạn còn lại.",
    autoCalc:"Tự động tính từ Planning & Actual Data",
    sharedIns:"(Dùng chung với Primer)",
    category:"Danh mục",unitPrice:"Đơn giá",qty:"Số lượng",months:"Số tháng",amount:"Thành tiền",note:"Ghi chú",
    addItem:"Thêm dòng",summary:"Tổng hợp chi phí",
    aboveTarget:"Đạt target",belowTarget:"Chưa đạt target",
    compare:"So sánh",compareVersions:"So sánh phiên bản",selectVersion:"Chọn phiên bản",
    baseVersion:"Phiên bản gốc",compareWith:"So sánh với",difference:"Chênh lệch",
    metric:"Chỉ số",increase:"Tăng",decrease:"Giảm",noChange:"Không đổi",
    comparisonResult:"Kết quả so sánh",selectBothVersions:"Vui lòng chọn cả 2 phiên bản để so sánh",
    planning:"Planning",forecast:"Forecast",phase:"Giai đoạn",
  },
  en:{
    appTitle:"P&L Simulation Tool",admin:"Admin",projects:"Projects",
    projectList:"Project List",addProject:"Add Project",editProject:"Edit Project Info",
    projectCode:"Project Code",projectName:"Project Name",startDate:"Start Date",
    endDate:"End Date",currency:"Currency",status:"Status",
    actions:"Actions",view:"View",del:"Delete",save:"Save",cancel:"Cancel",back:"Back",
    simVersions:"Simulation Versions",addVersion:"Add Version",
    versionType:"Type",versionDate:"Date",versionNote:"Note",createdBy:"Created By",openSim:"Open Simulation",
    projectInfo:"Project Info",offshoreTeam:"Offshore Team",onsiteTeam:"Onsite Team (Long-term)",
    billableMM:"Billable MM",wipRevenue:"WIP Revenue",
    planningPhase:"Planning Phase",forecastPhase:"Forecast Remaining Phase",
    costPrime:"Cost VN - Prime/Partner",costSupplier:"Cost VN - Supplier (F1/IVS)",
    costOnsite:"Costs at other OBs (Onsite)",otherCosts:"Other Costs",
    calEffortEMP:"Calendar Effort - EMP (incl. PM)",calEffortAPP:"Calendar Effort - APP/POI",
    empSalaryCost:"EMP Salary Cost (Hard + 13th + Soft)",appSalaryCost:"Hard Salary Cost - APP/POI",
    insurance:"Insurance & FPT Care (EMP)",otCampaignPct:"OT & Campaign (%)",otCampaignCost:"OT & Campaign costs",
    xjob:"Xjob",electricity:"Electricity, water & seating",otherExp:"Other expenses",
    softSalary:"Estimated soft salary (EMP)",travelAllow:"Electricity, water, seating & travel",
    unitSalEMP:"Unit salary EMP ($/MM)",unitSalAPP:"Unit salary APP/POI ($/MM)",
    plSummary:"P&L Result",totalRevenue:"Total Revenue",totalCost:"Total Cost",
    grossProfit:"Gross Profit",grossMargin:"Gross Margin",directMargin:"Direct Margin",
    targetGM:"Target Gross Margin (%)",targetDM:"Target Direct Margin (%)",
    primeTotalCost:"Prime - Total direct cost in Vietnam",
    supplierTotalCost:"Supplier - Total direct cost in Vietnam",
    onsiteTotalCost:"Total direct cost at OB",
    otherTotalCost:"Total other costs",
    adminTitle:"System Configuration",targetSettings:"Target Margin",
    rolesConfig:"Role Configuration",contractConfig:"Contract Types",locationConfig:"Location Configuration",
    costRefConfig:"Personnel Cost Reference",projectIncomeConfig:"Project Income",
    otherCostCatsConfig:"Other Cost Categories",
    addRole:"Add Role",addContract:"Add Contract Type",addLocation:"Add Location",addCat:"Add Category",
    tbd:"To be updated",total:"Total",location:"Location",package:"Package",
    noData:"No data yet",active:"Active",completed:"Completed",onHold:"On Hold",
    primer:"Primer",supplier:"Supplier",salaryRef:"Salary",insuranceRef:"Insurance & FPT Care",
    importCSV:"Import CSV",downloadTemplate:"Download Template",
    importSuccess:"Import successful!",importError:"Import error.",
    importGuide:"CSV must have columns: Location, P1...P9",
    editMode:"Edit",lastUpdated:"Last updated",
    unsaved:"Unsaved",savedOK:"Saved!",
    projectIncomePct:"Project Income %",projectIncomeNote:"EMP Cost = (1 + 8% + Project Income%) × SUMPRODUCT",
    actualData:"Actual Data",actualPrime:"Actual - Prime/Partner",actualSupplier:"Actual - Supplier",
    importActual:"Import Actual Data",
    forecastNote:"Forecast Remaining Phase: contains only remaining costs to project end.",
    autoCalc:"Auto-calculated from Planning & Actual Data",
    sharedIns:"(Shared with Primer)",
    category:"Category",unitPrice:"Unit Price",qty:"Qty",months:"Months",amount:"Amount",note:"Note",
    addItem:"Add Item",summary:"Cost Summary",
    aboveTarget:"On target",belowTarget:"Below target",
    compare:"Compare",compareVersions:"Compare Versions",selectVersion:"Select Version",
    baseVersion:"Base Version",compareWith:"Compare With",difference:"Difference",
    metric:"Metric",increase:"Increase",decrease:"Decrease",noChange:"No Change",
    comparisonResult:"Comparison Result",selectBothVersions:"Please select both versions to compare",
    planning:"Planning",forecast:"Forecast",phase:"Phase",
  }
};

type TranslationType = typeof T.vi;

const fmt = (n: number | undefined | null): string => new Intl.NumberFormat("en-US").format(Math.round(n || 0));
const fmtN = (n: number | string | undefined | null): string => { 
  if (!n && n !== 0) return ""; 
  const v = Number(n); 
  if (v >= 1000000) return (v / 1000000).toFixed(1) + "M"; 
  if (v >= 1000) return (v / 1000).toFixed(0) + "K"; 
  return v.toString(); 
};
const pct = (n: number | undefined | null): string => (isNaN(n as number) || !isFinite(n as number) ? "0.0" : Number(n).toFixed(1));
const uid = (): number => Date.now() + Math.random();
const today = (): string => new Date().toISOString().split("T")[0];
const mColor = (m: number, tgt: number): string => m >= tgt ? "text-green-400" : m >= tgt * 0.8 ? "text-yellow-400" : "text-red-400";
const mBg = (m: number, tgt: number): string => m >= tgt ? "bg-green-500" : m >= tgt * 0.8 ? "bg-yellow-500" : "bg-red-500";

const defCE = (locs?: Location[]): Record<string, Record<string, string>> => { 
  const m: Record<string, Record<string, string>> = {}; 
  (locs || DEFAULT_LOCS).forEach(l => { 
    m[l.code] = {}; 
    PACKAGES.forEach(p => { m[l.code][p] = ""; }); 
  }); 
  return m; 
};

const defVN = (locs?: Location[]): VNSection => ({ ceEMP: defCE(locs), ceAPP: defCE(locs), otCampaignPct: 10, xjob: "", otherExp: "" });
const defOtherCosts = (): OtherCostItem[] => [];
const defPhase = (locs?: Location[]): PhaseData => ({
  offshore: { billableMM: "", wipRevenue: "" },
  onsite: { billableMM: "", wipRevenue: "" },
  currency: "USD",
  prime: defVN(locs), supplier: defVN(locs),
  onsiteCeEMP: "", onsiteCeAPP: "", onsiteUnitSalEMP: "", onsiteUnitSalAPP: "", onsiteOtherExp: "",
  otherCosts: defOtherCosts(),
});
const defSimData = (locs?: Location[]): SimData => ({ planning: defPhase(locs), forecast: defPhase(locs) });
const defProject = (): Project => ({ id: uid(), code: "", name: "", startDate: "", endDate: "", currency: "USD", status: "active", versions: [], actualData: { prime: [], supplier: [] } });
const defVersion = (type = "bidding"): Version => ({ id: uid(), type, date: today(), note: "", createdBy: "PM", data: defSimData() });
const defCostRef = (): CostRef => ({
  Primer: { salary: { table: buildTable(PRIMER_SAL), unit: "USD", lastUpdated: today() }, insurance: { table: buildTable(SHARED_INS), unit: "USD", lastUpdated: today() } },
  Supplier: { salary: { table: buildTable(SUPPLIER_SAL), unit: "USD", lastUpdated: today() }, insurance: null },
});
const defAdmin = (): AdminConfig => ({
  targetGrossMargin: 25, targetDirectMargin: 20, projectIncomePct: 30,
  roles: [...DEFAULT_ROLES], contractTypes: [...DEFAULT_CONTRACTS],
  locations: DEFAULT_LOCS.map(l => ({ ...l, active: true })),
  costRef: defCostRef(),
  otherCostCats: [...DEFAULT_OTHER_COST_CATS],
});

interface InpProps {
  value: string | number | undefined;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  disabled?: boolean;
}

const Inp = ({ value, onChange, placeholder, type = "text", className = "", disabled = false }: InpProps) => (
  <input type={type} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
    className={`bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white w-full disabled:opacity-40 ${className}`} />
);

interface SelOption {
  value: string;
  label: string;
}

interface SelProps {
  value: string;
  onChange: (val: string) => void;
  options: (SelOption | string)[];
  className?: string;
}

const Sel = ({ value, onChange, options, className = "" }: SelProps) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    className={`bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white w-full ${className}`}>
    {options.map(o => {
      const val = typeof o === 'string' ? o : o.value;
      const label = typeof o === 'string' ? o : o.label;
      return <option key={val} value={val}>{label}</option>;
    })}
  </select>
);

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

const Card = ({ title, children, className = "", action }: CardProps) => (
  <div className={`bg-gray-900 rounded-xl border border-gray-800 ${className}`}>
    {title && <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between"><h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{title}</h3>{action}</div>}
    <div className="p-5">{children}</div>
  </div>
);

const Badge = ({ label, color = "gray" }: { label: string; color?: string }) => {
  const c: Record<string, string> = { gray: "bg-gray-700 text-gray-300", green: "bg-green-900 text-green-300", yellow: "bg-yellow-900 text-yellow-300", red: "bg-red-900 text-red-300", indigo: "bg-indigo-900 text-indigo-300", purple: "bg-purple-900 text-purple-300", teal: "bg-teal-900 text-teal-300", blue: "bg-blue-900 text-blue-300" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c[color] || c.gray}`}>{label}</span>;
};

const Toast = ({ msg, type = "success" }: { msg: string; type?: string }) => (
  <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 ${type === "success" ? "bg-green-800 text-green-100" : "bg-red-800 text-red-100"}`}>
    {type === "success" ? "✓" : "✗"} {msg}
  </div>
);

const AutoField = ({ label, value, note, className = "" }: { label?: string; value: string; note?: string; className?: string }) => (
  <div className={className}>
    {label && <label className="text-xs text-gray-500 mb-1 block">{label}</label>}
    <div className="bg-gray-700/60 border border-gray-600 rounded-lg px-3 py-2 text-sm text-indigo-300 font-medium flex items-center justify-between">
      <span>{value}</span>
      {note && <span className="text-xs text-gray-500 ml-2">{note}</span>}
    </div>
  </div>
);

const SummaryRow = ({ label, value, bold = false, highlight = false }: { label: string; value: number | undefined; bold?: boolean; highlight?: boolean }) => (
  <div className={`flex justify-between items-center py-2 ${bold ? "border-t-2 border-gray-600 mt-1 pt-3" : ""}`}>
    <span className={`text-sm ${bold ? "font-bold text-white" : "text-gray-400"}`}>{label}</span>
    <span className={`font-bold ${bold ? (highlight ? "text-green-400 text-base" : "text-white text-base") : "text-gray-200"}`}>{fmt(value)}</span>
  </div>
);

const MarginCard = ({ label, value, target, t }: { label: string; value: number; target: number; t: TranslationType }) => {
  const diff = value - target;
  const isAbove = value >= target;
  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-black ${mColor(value, target)}`}>{pct(value)}%</p>
      <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden relative">
        <div className={`h-full rounded-full transition-all ${mBg(value, target)}`} style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
        <div className="absolute top-0 bottom-0 border-l-2 border-white opacity-50" style={{ left: `${Math.min(target, 100)}%` }} />
      </div>
      <p className={`text-xs mt-1.5 font-medium ${mColor(value, target)}`}>
        {isAbove ? "✓" : "✗"} {isAbove ? t.aboveTarget : t.belowTarget} {target}% ({isAbove ? "+" : ""}{pct(diff)}pp)
      </p>
    </div>
  );
};

interface CEMatrixProps {
  label: string;
  ceData: Record<string, Record<string, string>> | undefined;
  onChange: (loc: string, pkg: string, val: string) => void;
  locations: Location[];
  t: TranslationType;
}

const CEMatrix = ({ label, ceData, onChange, locations, t }: CEMatrixProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const locs = locations || DEFAULT_LOCS;
  const totByLoc = (loc: string): number => PACKAGES.reduce((s, p) => s + (parseFloat(ceData?.[loc]?.[p] || "") || 0), 0);
  const totByPkg = (pkg: string): number => locs.reduce((s, l) => s + (parseFloat(ceData?.[l.code]?.[pkg] || "") || 0), 0);
  const grand = locs.reduce((s, l) => s + totByLoc(l.code), 0);
  return (
    <div className="mb-3">
      <button onClick={() => setCollapsed(c => !c)} className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2 w-full text-left hover:text-white">
        <span className="text-xs">{collapsed ? "▶" : "▼"}</span>{label}
        <span className="ml-auto text-indigo-400 text-xs font-bold">{t.total}: {grand || 0} MM</span>
      </button>
      {!collapsed && (
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="text-xs w-full">
            <thead><tr className="bg-gray-800">
              <th className="text-left py-2 px-3 text-gray-500 sticky left-0 bg-gray-800 w-16">{t.location}</th>
              {PACKAGES.map(p => <th key={p} className="text-center py-2 px-1 text-gray-500 min-w-12">{p}</th>)}
              <th className="text-center py-2 px-2 text-gray-400">{t.total}</th>
            </tr></thead>
            <tbody>
              {locs.map(loc => (
                <tr key={loc.code} className="border-t border-gray-800/60">
                  <td className="py-1 px-3 text-gray-400 font-medium sticky left-0 bg-gray-900">{loc.code}</td>
                  {PACKAGES.map(p => (
                    <td key={p} className="py-0.5 px-0.5">
                      <input type="number" value={ceData?.[loc.code]?.[p] || ""} onChange={e => onChange(loc.code, p, e.target.value)} placeholder="0" min="0" step="0.1"
                        className="w-full bg-gray-800 border border-gray-700 rounded px-1 py-1 text-center text-xs focus:outline-none focus:border-indigo-500 text-white" />
                    </td>
                  ))}
                  <td className="py-1 px-2 text-center text-indigo-400 font-semibold">{totByLoc(loc.code) || "—"}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-700 bg-gray-800/40">
                <td className="py-2 px-3 text-gray-400 font-semibold sticky left-0 bg-gray-800/40">{t.total}</td>
                {PACKAGES.map(p => <td key={p} className="py-2 text-center text-gray-400">{totByPkg(p) || "—"}</td>)}
                <td className="py-2 px-2 text-center text-white font-bold">{grand || "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

interface OtherCostsTabProps {
  items: OtherCostItem[];
  onChange: (items: OtherCostItem[]) => void;
  cats: string[];
  t: TranslationType;
}

const OtherCostsTab = ({ items, onChange, cats, t }: OtherCostsTabProps) => {
  const addItem = () => onChange([...items, { id: uid(), category: cats[0] || "", unitPrice: "", qty: "", months: "", note: "" }]);
  const updItem = (id: number, field: keyof OtherCostItem, val: string) => onChange(items.map(it => it.id === id ? { ...it, [field]: val } : it));
  const delItem = (id: number) => onChange(items.filter(it => it.id !== id));
  const total = items.reduce((s, it) => s + (parseFloat(it.unitPrice) || 0) * (parseFloat(it.qty) || 0) * (parseFloat(it.months) || 0), 0);
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-xs">
          <thead><tr className="bg-gray-800 border-b border-gray-700">
            <th className="text-left py-3 px-3 text-gray-400 min-w-36">{t.category}</th>
            <th className="text-right py-3 px-3 text-gray-400 min-w-28">{t.unitPrice}</th>
            <th className="text-right py-3 px-3 text-gray-400 min-w-20">{t.qty}</th>
            <th className="text-right py-3 px-3 text-gray-400 min-w-20">{t.months}</th>
            <th className="text-right py-3 px-3 text-gray-400 min-w-28">{t.amount}</th>
            <th className="text-left py-3 px-3 text-gray-400 min-w-32">{t.note}</th>
            <th className="py-3 px-2 w-8"></th>
          </tr></thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-600 text-sm">{t.noData}</td></tr>}
            {items.map(it => {
              const amt = (parseFloat(it.unitPrice) || 0) * (parseFloat(it.qty) || 0) * (parseFloat(it.months) || 0);
              return (
                <tr key={it.id} className="border-t border-gray-800/60 hover:bg-gray-800/30">
                  <td className="py-1.5 px-2"><Sel value={it.category} onChange={v => updItem(it.id, "category", v)} options={cats.map(c => ({ value: c, label: c }))} /></td>
                  <td className="py-1.5 px-2"><Inp type="number" value={it.unitPrice} onChange={v => updItem(it.id, "unitPrice", v)} placeholder="0" /></td>
                  <td className="py-1.5 px-2"><Inp type="number" value={it.qty} onChange={v => updItem(it.id, "qty", v)} placeholder="1" /></td>
                  <td className="py-1.5 px-2"><Inp type="number" value={it.months} onChange={v => updItem(it.id, "months", v)} placeholder="1" /></td>
                  <td className="py-1.5 px-2"><div className="text-right font-semibold text-green-300 py-2 pr-1">{fmt(amt)}</div></td>
                  <td className="py-1.5 px-2"><Inp value={it.note} onChange={v => updItem(it.id, "note", v)} placeholder="..." /></td>
                  <td className="py-1.5 px-2 text-center"><button onClick={() => delItem(it.id)} className="text-gray-600 hover:text-red-400">✕</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <button onClick={addItem} className="px-3 py-2 bg-indigo-700 hover:bg-indigo-600 rounded-lg text-sm">+ {t.addItem}</button>
        <div className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-2">
          <span className="text-sm text-gray-400">{t.otherTotalCost}:</span>
          <span className="text-lg font-bold text-green-300">{fmt(total)}</span>
        </div>
      </div>
    </div>
  );
};

const calcSection = (sec: VNSection | undefined, salTable: Record<string, Record<string, string>> | undefined, insTable: Record<string, Record<string, string>> | undefined, ip: number, locs: Location[]): PLResult => {
  const l = locs || DEFAULT_LOCS;
  let sEMP = 0, sAPP = 0, sIns = 0;
  l.forEach(loc => {
    PACKAGES.forEach(p => {
      const cE = parseFloat(sec?.ceEMP?.[loc.code]?.[p] || "") || 0;
      const cA = parseFloat(sec?.ceAPP?.[loc.code]?.[p] || "") || 0;
      const sal = parseFloat(salTable?.[loc.code]?.[p] || "") || 0;
      const ins = parseFloat(insTable?.[loc.code]?.[p] || "") || 0;
      sEMP += cE * sal; sAPP += cA * sal; sIns += cE * ins;
    });
  });
  const empCost = (1 + 0.08 + (ip / 100)) * sEMP;
  const appCost = sAPP;
  const insCost = sIns;
  const personnel = empCost + appCost;
  const otCamp = personnel * (parseFloat(String(sec?.otCampaignPct)) || 0) / 100;
  const xjob = parseFloat(sec?.xjob || "") || 0;
  const other = parseFloat(sec?.otherExp || "") || 0;
  const total = empCost + appCost + insCost + otCamp + xjob + other;
  return { empCost, appCost, insCost, otCamp, xjob, other, personnel, total };
};

const calcOtherCosts = (items: OtherCostItem[]): number => items.reduce((s, it) => s + (parseFloat(it.unitPrice) || 0) * (parseFloat(it.qty) || 0) * (parseFloat(it.months) || 0), 0);

const calcPhase = (phase: PhaseData | undefined, admin: AdminConfig): PhasePLResult => {
  const locs = admin.locations || DEFAULT_LOCS;
  const ip = admin.projectIncomePct || 30;
  const pSal = admin.costRef?.Primer?.salary?.table || {};
  const sSal = admin.costRef?.Supplier?.salary?.table || {};
  const ins = admin.costRef?.Primer?.insurance?.table || {};
  const primePL = calcSection(phase?.prime, pSal, ins, ip, locs);
  const supplierPL = calcSection(phase?.supplier, sSal, ins, ip, locs);
  const oEMP = (parseFloat(phase?.onsiteCeEMP || "") || 0) * (parseFloat(phase?.onsiteUnitSalEMP || "") || 0);
  const oAPP = (parseFloat(phase?.onsiteCeAPP || "") || 0) * (parseFloat(phase?.onsiteUnitSalAPP || "") || 0);
  const oOther = parseFloat(phase?.onsiteOtherExp || "") || 0;
  const onsiteTotal = oEMP + oAPP + oOther;
  const otherCostsTotal = calcOtherCosts(phase?.otherCosts || []);
  const offRev = parseFloat(phase?.offshore?.wipRevenue || "") || 0;
  const onsRev = parseFloat(phase?.onsite?.wipRevenue || "") || 0;
  const totalRev = offRev + onsRev;
  const totalCost = primePL.total + supplierPL.total + onsiteTotal + otherCostsTotal;
  const grossProfit = totalRev - totalCost;
  const grossMargin = totalRev > 0 ? (grossProfit / totalRev) * 100 : 0;
  return { primePL, supplierPL, onsiteTotal, oEMP, oAPP, oOther, otherCostsTotal, offRev, onsRev, totalRev, totalCost, grossProfit, grossMargin, directMargin: grossMargin };
};

// Compare Component
interface CompareVersionsScreenProps {
  project: Project;
  admin: AdminConfig;
  onBack: () => void;
  t: TranslationType;
}

const CompareVersionsScreen = ({ project, admin, onBack, t }: CompareVersionsScreenProps) => {
  const [baseId, setBaseId] = useState("");
  const [compareId, setCompareId] = useState("");
  const [phaseType, setPhaseType] = useState<"planning" | "forecast">("planning");

  const versions = project.versions || [];
  const baseVer = versions.find(v => v.id.toString() === baseId);
  const compareVer = versions.find(v => v.id.toString() === compareId);

  const basePL = useMemo(() => baseVer ? calcPhase(baseVer.data?.[phaseType], admin) : null, [baseVer, phaseType, admin]);
  const comparePL = useMemo(() => compareVer ? calcPhase(compareVer.data?.[phaseType], admin) : null, [compareVer, phaseType, admin]);

  const stl = (key: string): string => SIM_TYPES.find(s => s.key === key)?.vi || key;

  const DiffCell = ({ base, compare, isPercent = false, inverse = false }: { base: number | undefined | null; compare: number | undefined | null; isPercent?: boolean; inverse?: boolean }) => {
    if (base === null || base === undefined || compare === null || compare === undefined) return <span className="text-gray-600">—</span>;
    const diff = compare - base;
    const pctChange = base !== 0 ? ((diff / Math.abs(base)) * 100) : (diff !== 0 ? 100 : 0);
    const isPositive = inverse ? diff < 0 : diff > 0;
    const color = diff === 0 ? "text-gray-400" : isPositive ? "text-green-400" : "text-red-400";
    const arrow = diff === 0 ? "" : isPositive ? "↑" : "↓";
    return (
      <div className={`${color} font-medium`}>
        <span>{arrow} {isPercent ? pct(Math.abs(diff)) + "pp" : fmt(Math.abs(diff))}</span>
        <span className="text-xs ml-1 opacity-70">({pct(Math.abs(pctChange))}%)</span>
      </div>
    );
  };

  const metrics = basePL && comparePL ? [
    { key: "totalRev", label: t.totalRevenue, base: basePL.totalRev, compare: comparePL.totalRev, isPercent: false, inverse: false },
    { key: "totalCost", label: t.totalCost, base: basePL.totalCost, compare: comparePL.totalCost, inverse: true, isPercent: false },
    { key: "primeCost", label: t.primeTotalCost, base: basePL.primePL?.total, compare: comparePL.primePL?.total, inverse: true, isPercent: false },
    { key: "supplierCost", label: t.supplierTotalCost, base: basePL.supplierPL?.total, compare: comparePL.supplierPL?.total, inverse: true, isPercent: false },
    { key: "onsiteCost", label: t.onsiteTotalCost, base: basePL.onsiteTotal, compare: comparePL.onsiteTotal, inverse: true, isPercent: false },
    { key: "otherCost", label: t.otherTotalCost, base: basePL.otherCostsTotal, compare: comparePL.otherCostsTotal, inverse: true, isPercent: false },
    { key: "grossProfit", label: t.grossProfit, base: basePL.grossProfit, compare: comparePL.grossProfit, isPercent: false, inverse: false },
    { key: "grossMargin", label: t.grossMargin, base: basePL.grossMargin, compare: comparePL.grossMargin, isPercent: true, inverse: false },
    { key: "directMargin", label: t.directMargin, base: basePL.directMargin, compare: comparePL.directMargin, isPercent: true, inverse: false },
  ] : [];

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-white mb-3 flex items-center gap-1">← {t.back}</button>
        <h2 className="text-xl font-bold text-white mb-1">📊 {t.compareVersions}</h2>
        <p className="text-sm text-gray-500">{project.code} — {project.name}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Version Selectors */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded-xl border border-indigo-800 p-4">
              <label className="text-xs text-indigo-400 font-semibold mb-2 block">🅰️ {t.baseVersion}</label>
              <Sel value={baseId} onChange={setBaseId} options={[{ value: "", label: `-- ${t.selectVersion} --` }, ...versions.map((v, i) => ({ value: v.id.toString(), label: `v${i + 1} - ${stl(v.type)} (${v.date})` }))]} />
            </div>
            <div className="bg-gray-900 rounded-xl border border-purple-800 p-4">
              <label className="text-xs text-purple-400 font-semibold mb-2 block">🅱️ {t.compareWith}</label>
              <Sel value={compareId} onChange={setCompareId} options={[{ value: "", label: `-- ${t.selectVersion} --` }, ...versions.filter(v => v.id.toString() !== baseId).map(v => ({ value: v.id.toString(), label: `v${versions.indexOf(v) + 1} - ${stl(v.type)} (${v.date})` }))]} />
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <label className="text-xs text-gray-400 font-semibold mb-2 block">📋 {t.phase}</label>
              <Sel value={phaseType} onChange={(v) => setPhaseType(v as "planning" | "forecast")} options={[{ value: "planning", label: t.planning }, { value: "forecast", label: t.forecast }]} />
            </div>
          </div>

          {/* Comparison Table */}
          {(!baseId || !compareId) ? (
            <div className="text-center py-16 text-gray-600">
              <div className="text-5xl mb-4">⚖️</div>
              <p>{t.selectBothVersions}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: t.totalRevenue, base: basePL?.totalRev, compare: comparePL?.totalRev, color: "blue", inverse: false },
                  { label: t.totalCost, base: basePL?.totalCost, compare: comparePL?.totalCost, color: "orange", inverse: true },
                  { label: t.grossProfit, base: basePL?.grossProfit, compare: comparePL?.grossProfit, color: "green", inverse: false },
                ].map(item => {
                  const diff = (item.compare || 0) - (item.base || 0);
                  const isPos = item.inverse ? diff < 0 : diff > 0;
                  return (
                    <div key={item.label} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                      <p className="text-xs text-gray-500 mb-2">{item.label}</p>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-xs text-gray-600">Base</p>
                          <p className={`text-lg font-bold text-${item.color}-400`}>{fmt(item.base)}</p>
                        </div>
                        <div className="text-2xl text-gray-700">→</div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600">Compare</p>
                          <p className={`text-lg font-bold text-${item.color}-400`}>{fmt(item.compare)}</p>
                        </div>
                      </div>
                      <div className={`mt-2 text-center text-sm font-semibold ${diff === 0 ? "text-gray-500" : isPos ? "text-green-400" : "text-red-400"}`}>
                        {diff === 0 ? t.noChange : isPos ? `↑ +${fmt(Math.abs(diff))}` : `↓ -${fmt(Math.abs(diff))}`}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Margin Comparison */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: t.grossMargin, base: basePL?.grossMargin || 0, compare: comparePL?.grossMargin || 0, target: admin.targetGrossMargin },
                  { label: t.directMargin, base: basePL?.directMargin || 0, compare: comparePL?.directMargin || 0, target: admin.targetDirectMargin },
                ].map(item => {
                  const diff = (item.compare || 0) - (item.base || 0);
                  return (
                    <div key={item.label} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                      <p className="text-xs text-gray-500 mb-3">{item.label}</p>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-center">
                          <p className="text-xs text-indigo-400 mb-1">Base</p>
                          <p className={`text-2xl font-black ${mColor(item.base, item.target)}`}>{pct(item.base)}%</p>
                        </div>
                        <div className={`text-xl font-bold ${diff === 0 ? "text-gray-600" : diff > 0 ? "text-green-400" : "text-red-400"}`}>
                          {diff === 0 ? "=" : `${diff > 0 ? "+" : ""}${pct(diff)}pp`}
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-purple-400 mb-1">Compare</p>
                          <p className={`text-2xl font-black ${mColor(item.compare, item.target)}`}>{pct(item.compare)}%</p>
                        </div>
                      </div>
                      <div className="h-3 bg-gray-700 rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 flex">
                          <div className="h-full bg-indigo-600/50" style={{ width: `${Math.min(item.base, 100)}%` }} />
                        </div>
                        <div className="absolute inset-0 flex">
                          <div className="h-full bg-purple-500/70 border-r-2 border-white" style={{ width: `${Math.min(item.compare, 100)}%` }} />
                        </div>
                        <div className="absolute top-0 bottom-0 border-l-2 border-yellow-400" style={{ left: `${item.target}%` }} />
                      </div>
                      <p className="text-xs text-gray-600 mt-1 text-center">Target: {item.target}%</p>
                    </div>
                  );
                })}
              </div>

              {/* Detailed Table */}
              <Card title={t.comparisonResult}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left py-3 px-4 text-gray-400">{t.metric}</th>
                        <th className="text-right py-3 px-4 text-indigo-400">🅰️ Base</th>
                        <th className="text-right py-3 px-4 text-purple-400">🅱️ Compare</th>
                        <th className="text-right py-3 px-4 text-gray-400">{t.difference}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map(m => (
                        <tr key={m.key} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                          <td className="py-3 px-4 text-gray-300 font-medium">{m.label}</td>
                          <td className="py-3 px-4 text-right text-indigo-300">{m.isPercent ? `${pct(m.base)}%` : fmt(m.base)}</td>
                          <td className="py-3 px-4 text-right text-purple-300">{m.isPercent ? `${pct(m.compare)}%` : fmt(m.compare)}</td>
                          <td className="py-3 px-4 text-right"><DiffCell base={m.base} compare={m.compare} isPercent={m.isPercent} inverse={m.inverse} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface VNCostSectionProps {
  label: string;
  color: string;
  sk: "prime" | "supplier";
  phaseKey: string;
  data: VNSection | undefined;
  pl: PLResult | undefined;
  updSec: (phaseKey: string, sk: string, field: string, val: unknown) => void;
  locations: Location[];
  t: TranslationType;
}

const VNCostSection = ({ label, color, sk, phaseKey, data, pl, updSec, locations, t }: VNCostSectionProps) => {
  const locs = locations || DEFAULT_LOCS;
  const upd = (type: string, loc: string, pkg: string, val: string) => {
    const f = type === "EMP" ? "ceEMP" : "ceAPP";
    updSec(phaseKey, sk, f, { ...data?.[f], [loc]: { ...data?.[f]?.[loc], [pkg]: val } });
  };
  const bdr = color === "indigo" ? "border-indigo-800" : "border-purple-800";
  const bg = color === "indigo" ? "bg-indigo-950/30" : "bg-purple-950/30";
  const tc = color === "indigo" ? "text-indigo-300" : "text-purple-300";
  return (
    <div className={`rounded-xl border ${bdr} overflow-hidden`}>
      <div className={`px-5 py-3 ${bg} flex items-center justify-between`}>
        <span className={`text-sm font-bold ${tc}`}>{label}</span>
        <span className="text-xs text-gray-400">Total: <span className="text-white font-bold">{fmt(pl?.total)}</span></span>
      </div>
      <div className="p-5 space-y-4">
        <CEMatrix label={`${t.calEffortEMP} (MM)`} ceData={data?.ceEMP} onChange={(l, p, v) => upd("EMP", l, p, v)} locations={locs} t={t} />
        <CEMatrix label={`${t.calEffortAPP} (MM)`} ceData={data?.ceAPP} onChange={(l, p, v) => upd("APP", l, p, v)} locations={locs} t={t} />
        <div className="grid grid-cols-3 gap-3 bg-gray-800/30 rounded-xl p-4">
          <AutoField label={t.empSalaryCost} value={fmt(pl?.empCost)} note="auto" />
          <AutoField label={t.appSalaryCost} value={fmt(pl?.appCost)} note="auto" />
          <AutoField label={t.insurance} value={fmt(pl?.insCost)} note="auto" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-gray-500 mb-1 block">{t.otCampaignPct}</label><Inp type="number" value={data?.otCampaignPct} onChange={v => updSec(phaseKey, sk, "otCampaignPct", v)} placeholder="10" /></div>
          <AutoField label={t.otCampaignCost} value={fmt(pl?.otCamp)} note="auto" />
          <div><label className="text-xs text-gray-500 mb-1 block">{t.xjob}</label><Inp type="number" value={data?.xjob} onChange={v => updSec(phaseKey, sk, "xjob", v)} placeholder="0" /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">{t.otherExp}</label><Inp type="number" value={data?.otherExp} onChange={v => updSec(phaseKey, sk, "otherExp", v)} placeholder="0" /></div>
        </div>
        <div className={`rounded-xl border ${bdr} p-4 mt-2`}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">📊 {t.summary}</p>
          <div className="space-y-1 divide-y divide-gray-800">
            <SummaryRow label={t.empSalaryCost} value={pl?.empCost} />
            <SummaryRow label={t.appSalaryCost} value={pl?.appCost} />
            <SummaryRow label={t.insurance} value={pl?.insCost} />
            <SummaryRow label={t.otCampaignCost} value={pl?.otCamp} />
            <SummaryRow label={t.xjob} value={pl?.xjob} />
            <SummaryRow label={t.otherExp} value={pl?.other} />
            <SummaryRow label={color === "indigo" ? t.primeTotalCost : t.supplierTotalCost} value={pl?.total} bold highlight />
          </div>
        </div>
      </div>
    </div>
  );
};

interface OnsiteSectionProps {
  phaseKey: string;
  phaseData: PhaseData | undefined;
  pl: PhasePLResult;
  updField: (phaseKey: string, field: string, val: unknown) => void;
  t: TranslationType;
}

const OnsiteSection = ({ phaseKey, phaseData, pl, updField, t }: OnsiteSectionProps) => (
  <div className="space-y-4">
    <p className="text-xs text-gray-500 bg-gray-800 rounded-lg px-3 py-2">💡 Costs at other OBs</p>
    <div className="grid grid-cols-2 gap-4">
      <div><label className="text-xs text-gray-500 mb-1 block">{t.calEffortEMP} (MM)</label><Inp type="number" value={phaseData?.onsiteCeEMP} onChange={v => updField(phaseKey, "onsiteCeEMP", v)} /></div>
      <div><label className="text-xs text-gray-500 mb-1 block">{t.calEffortAPP} (MM)</label><Inp type="number" value={phaseData?.onsiteCeAPP} onChange={v => updField(phaseKey, "onsiteCeAPP", v)} /></div>
      <div><label className="text-xs text-gray-500 mb-1 block">{t.unitSalEMP}</label><Inp type="number" value={phaseData?.onsiteUnitSalEMP} onChange={v => updField(phaseKey, "onsiteUnitSalEMP", v)} /></div>
      <div><label className="text-xs text-gray-500 mb-1 block">{t.unitSalAPP}</label><Inp type="number" value={phaseData?.onsiteUnitSalAPP} onChange={v => updField(phaseKey, "onsiteUnitSalAPP", v)} /></div>
      <div className="col-span-2"><label className="text-xs text-gray-500 mb-1 block">{t.otherExp}</label><Inp type="number" value={phaseData?.onsiteOtherExp} onChange={v => updField(phaseKey, "onsiteOtherExp", v)} /></div>
    </div>
    <div className="rounded-xl border border-teal-800 p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">📊 {t.summary}</p>
      <div className="space-y-1 divide-y divide-gray-800">
        <SummaryRow label={t.unitSalEMP + " cost"} value={pl?.oEMP} />
        <SummaryRow label={t.unitSalAPP + " cost"} value={pl?.oAPP} />
        <SummaryRow label={t.otherExp} value={pl?.oOther} />
        <SummaryRow label={t.onsiteTotalCost} value={pl?.onsiteTotal} bold highlight />
      </div>
    </div>
  </div>
);

interface PhasePanelProps {
  phaseKey: string;
  phaseData: PhaseData | undefined;
  pl: PhasePLResult;
  isForecast: boolean;
  planData: PhaseData | undefined;
  actualData: { prime: ActualEntry[]; supplier: ActualEntry[] };
  updSec: (phaseKey: string, sk: string, field: string, val: unknown) => void;
  updField: (phaseKey: string, field: string, val: unknown) => void;
  admin: AdminConfig;
  t: TranslationType;
}

const PhasePanel = ({ phaseKey, phaseData, pl, isForecast, planData, actualData, updSec, updField, admin, t }: PhasePanelProps) => {
  const [tab, setTab] = useState("info");
  const locs = admin.locations || DEFAULT_LOCS;
  const tgt_g = admin.targetGrossMargin || 25;
  const tgt_d = admin.targetDirectMargin || 20;
  const cats = admin.otherCostCats || DEFAULT_OTHER_COST_CATS;

  const fcInfo = useMemo(() => {
    if (!isForecast) return null;
    const planOff = parseFloat(planData?.offshore?.billableMM || "") || 0;
    const planOns = parseFloat(planData?.onsite?.billableMM || "") || 0;
    const planOffRev = parseFloat(planData?.offshore?.wipRevenue || "") || 0;
    const planOnsRev = parseFloat(planData?.onsite?.wipRevenue || "") || 0;
    const actOffMM = (actualData?.prime || []).reduce((s, e) => s + (e.offshoreActualMM || 0), 0);
    const actOnsMM = (actualData?.prime || []).reduce((s, e) => s + (e.onsiteActualMM || 0), 0);
    const fcOff = Math.max(0, planOff - actOffMM);
    const fcOns = Math.max(0, planOns - actOnsMM);
    const upOff = planOff > 0 ? planOffRev / planOff : 0;
    const upOns = planOns > 0 ? planOnsRev / planOns : 0;
    return { fcOff, fcOns, offRev: (fcOff * upOff).toFixed(0), onsRev: (fcOns * upOns).toFixed(0), actOffMM, actOnsMM, upOff, upOns };
  }, [isForecast, planData, actualData]);

  const tabs = [{ key: "info", label: t.projectInfo }, { key: "prime", label: "🏢 Prime" }, { key: "supplier", label: "🤝 Supplier" }, { key: "onsite", label: "🏙️ Onsite" }, { key: "other", label: `💡 ${t.otherCosts}` }, { key: "pl", label: `📊 P&L` }];

  return (
    <div>
      {isForecast && <div className="mb-4 px-4 py-3 bg-blue-900/20 border border-blue-800 rounded-xl text-xs text-blue-300">ℹ️ {t.forecastNote}</div>}
      <div className="flex gap-1 mb-4 overflow-x-auto bg-gray-800/50 rounded-xl p-1">
        {tabs.map(tb => <button key={tb.key} onClick={() => setTab(tb.key)} className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${tab === tb.key ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"}`}>{tb.label}</button>)}
      </div>
      {tab === "info" && (
        <div className="space-y-4">
          <div className="bg-gray-800/50 rounded-xl p-4">
            <p className="text-sm font-bold text-indigo-400 mb-3">🌐 {t.offshoreTeam}</p>
            <div className="grid grid-cols-2 gap-3">
              {isForecast ? (<><AutoField label={`${t.billableMM} (remaining)`} value={fcInfo?.fcOff?.toFixed(2) || "—"} note={t.autoCalc} /><AutoField label={t.wipRevenue} value={fmt(parseFloat(fcInfo?.offRev || "0"))} note={t.autoCalc} /></>) : (<><div><label className="text-xs text-gray-500 mb-1 block">{t.billableMM}</label><Inp type="number" value={phaseData?.offshore?.billableMM} onChange={v => updField(phaseKey, "offshore", { ...phaseData?.offshore, billableMM: v })} /></div><div><label className="text-xs text-gray-500 mb-1 block">{t.wipRevenue}</label><Inp type="number" value={phaseData?.offshore?.wipRevenue} onChange={v => updField(phaseKey, "offshore", { ...phaseData?.offshore, wipRevenue: v })} /></div></>)}
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4">
            <p className="text-sm font-bold text-purple-400 mb-3">🏢 {t.onsiteTeam}</p>
            <div className="grid grid-cols-2 gap-3">
              {isForecast ? (<><AutoField label={`${t.billableMM} (remaining)`} value={fcInfo?.fcOns?.toFixed(2) || "—"} note={t.autoCalc} /><AutoField label={t.wipRevenue} value={fmt(parseFloat(fcInfo?.onsRev || "0"))} note={t.autoCalc} /></>) : (<><div><label className="text-xs text-gray-500 mb-1 block">{t.billableMM}</label><Inp type="number" value={phaseData?.onsite?.billableMM} onChange={v => updField(phaseKey, "onsite", { ...phaseData?.onsite, billableMM: v })} /></div><div><label className="text-xs text-gray-500 mb-1 block">{t.wipRevenue}</label><Inp type="number" value={phaseData?.onsite?.wipRevenue} onChange={v => updField(phaseKey, "onsite", { ...phaseData?.onsite, wipRevenue: v })} /></div></>)}
            </div>
          </div>
        </div>
      )}
      {tab === "prime" && <VNCostSection label={`🏢 ${t.costPrime}`} color="indigo" sk="prime" phaseKey={phaseKey} data={phaseData?.prime} pl={pl?.primePL} updSec={updSec} locations={locs} t={t} />}
      {tab === "supplier" && <VNCostSection label={`🤝 ${t.costSupplier}`} color="purple" sk="supplier" phaseKey={phaseKey} data={phaseData?.supplier} pl={pl?.supplierPL} updSec={updSec} locations={locs} t={t} />}
      {tab === "onsite" && <OnsiteSection phaseKey={phaseKey} phaseData={phaseData} pl={pl} updField={updField} t={t} />}
      {tab === "other" && <OtherCostsTab items={phaseData?.otherCosts || []} onChange={items => updField(phaseKey, "otherCosts", items)} cats={cats} t={t} />}
      {tab === "pl" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {([[t.offshoreTeam, pl?.offRev, "blue"], [t.onsiteTeam, pl?.onsRev, "purple"], [t.totalRevenue, pl?.totalRev, "white"]] as const).map(([lb, v, c]) => (
              <div key={lb} className="bg-gray-800 rounded-xl p-4 text-center"><p className="text-xs text-gray-500 mb-1">{lb}</p><p className={`text-base font-bold text-${c}-400`}>{fmt(v)}</p></div>
            ))}
          </div>
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Cost Breakdown</p>
            <div className="space-y-1 divide-y divide-gray-700">
              <SummaryRow label={t.primeTotalCost} value={pl?.primePL?.total} />
              <SummaryRow label={t.supplierTotalCost} value={pl?.supplierPL?.total} />
              <SummaryRow label={t.onsiteTotalCost} value={pl?.onsiteTotal} />
              <SummaryRow label={t.otherTotalCost} value={pl?.otherCostsTotal} />
              <SummaryRow label={t.totalCost} value={pl?.totalCost} bold />
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 space-y-2">
            {([[t.totalRevenue, pl?.totalRev, "text-blue-400"], [t.totalCost, pl?.totalCost, "text-orange-400"], [t.grossProfit, pl?.grossProfit, (pl?.grossProfit || 0) >= 0 ? "text-green-400" : "text-red-400"]] as const).map(([lb, v, cls]) => (
              <div key={lb} className="flex justify-between border-b border-gray-700 pb-2"><span className="text-sm text-gray-400">{lb}</span><span className={`font-bold ${cls}`}>{fmt(v)}</span></div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <MarginCard label={t.grossMargin} value={pl?.grossMargin || 0} target={tgt_g} t={t} />
            <MarginCard label={t.directMargin} value={pl?.directMargin || 0} target={tgt_d} t={t} />
          </div>
        </div>
      )}
    </div>
  );
};

interface SimScreenProps {
  project: Project;
  version: Version;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  admin: AdminConfig;
  onBack: () => void;
  t: TranslationType;
}

const SimScreen = ({ project, version, setProjects, admin, onBack, t }: SimScreenProps) => {
  const [phase, setPhase] = useState<"planning" | "forecast">("planning");
  const d = version.data;
  const isForecastOK = ["monthly", "adhoc"].includes(version.type);
  const updSec = (pk: string, sk: string, field: string, val: unknown) => {
    setProjects(ps => ps.map(p => {
      if (p.id !== project.id) return p;
      return {
        ...p,
        versions: p.versions.map(v => {
          if (v.id !== version.id) return v;
          const phaseData = v.data[pk as keyof SimData];
          const section = pk === "planning" || pk === "forecast" 
            ? (phaseData as PhaseData)[sk as keyof PhaseData]
            : {};
          return {
            ...v,
            data: {
              ...v.data,
              [pk]: {
                ...phaseData,
                [sk]: {
                  ...(typeof section === 'object' && section !== null ? section : {}),
                  [field]: val
                }
              }
            }
          };
        })
      };
    }));
  };
  const updField = (pk: string, field: string, val: unknown) => {
    setProjects(ps => ps.map(p => {
      if (p.id !== project.id) return p;
      return {
        ...p,
        versions: p.versions.map(v => {
          if (v.id !== version.id) return v;
          return {
            ...v,
            data: {
              ...v.data,
              [pk]: {
                ...v.data[pk as keyof SimData],
                [field]: val
              }
            }
          };
        })
      };
    }));
  };
  const planPL = useMemo(() => calcPhase(d?.planning, admin), [d?.planning, admin]);
  const fcPL = useMemo(() => calcPhase(d?.forecast, admin), [d?.forecast, admin]);
  const activePL = phase === "planning" ? planPL : fcPL;
  const tgt_g = admin.targetGrossMargin || 25;
  const tgt_d = admin.targetDirectMargin || 20;
  const stl = (key: string): string => SIM_TYPES.find(s => s.key === key)?.vi || key;
  return (
    <div className="flex flex-col h-full">
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-white">← {t.back}</button>
        <div className="flex-1 min-w-0"><span className="text-white font-semibold">{project.code} — {project.name}</span><span className="text-gray-500 text-sm ml-2">{stl(version.type)} · {version.date}</span></div>
        <div className="flex items-center gap-4">
          {([[t.grossMargin, activePL.grossMargin, tgt_g], [t.directMargin, activePL.directMargin, tgt_d]] as const).map(([lb, v, tgt]) => (
            <div key={lb} className="text-center"><div className="text-xs text-gray-500">{lb}</div><div className={`text-lg font-black ${mColor(v, tgt)}`}>{pct(v)}%</div></div>
          ))}
        </div>
      </div>
      <div className="bg-gray-950 px-6 pt-4 pb-0 flex gap-2">
        <button onClick={() => setPhase("planning")} className={`px-5 py-2.5 rounded-t-xl text-sm font-semibold border-t border-l border-r transition ${phase === "planning" ? "bg-gray-900 border-gray-800 text-white" : "bg-gray-800/50 border-transparent text-gray-500 hover:text-gray-300"}`}>📋 {t.planningPhase}</button>
        {isForecastOK ? <button onClick={() => setPhase("forecast")} className={`px-5 py-2.5 rounded-t-xl text-sm font-semibold border-t border-l border-r transition ${phase === "forecast" ? "bg-gray-900 border-gray-800 text-white" : "bg-gray-800/50 border-transparent text-gray-500 hover:text-gray-300"}`}>🔭 {t.forecastPhase}</button> : <button disabled className="px-5 py-2.5 rounded-t-xl text-sm font-semibold text-gray-700 cursor-not-allowed">🔭 {t.forecastPhase}</button>}
      </div>
      <div className="flex-1 overflow-y-auto bg-gray-900 border-t border-gray-800">
        <div className="p-5 max-w-5xl mx-auto">
          <PhasePanel phaseKey={phase} phaseData={d?.[phase]} pl={activePL} isForecast={phase === "forecast"} planData={d?.planning} actualData={project.actualData} updSec={updSec} updField={updField} admin={admin} t={t} />
        </div>
      </div>
    </div>
  );
};

interface CostRefTableProps {
  config: AdminConfig;
  setConfig: React.Dispatch<React.SetStateAction<AdminConfig>>;
  t: TranslationType;
}

const CostRefTable = ({ config, setConfig, t }: CostRefTableProps) => {
  const [activeType, setActiveType] = useState<"Primer" | "Supplier">("Primer");
  const [activeSub, setActiveSub] = useState<"salary" | "insurance">("salary");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, Record<string, string>> | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const locs = config.locations || DEFAULT_LOCS;
  const isShared = activeType === "Supplier" && activeSub === "insurance";
  const showToast = (msg: string, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const getEff = (): CostRefItem => isShared ? config.costRef?.Primer?.insurance || { table: {}, unit: "USD", lastUpdated: "" } : (config.costRef?.[activeType]?.[activeSub] as CostRefItem) || { table: {}, unit: "USD", lastUpdated: "" };
  const startEdit = () => { if (isShared) return; const cur = getEff(); const s: Record<string, Record<string, string>> = {}; locs.forEach(l => { s[l.code] = {}; PACKAGES.forEach(p => { s[l.code][p] = cur.table?.[l.code]?.[p] || ""; }); }); setDraft(s); setEditing(true); };
  const cancelEdit = () => { setEditing(false); setDraft(null); };
  const saveEdit = () => {
    if (!draft) return;
    setConfig(c => ({
      ...c,
      costRef: {
        ...c.costRef,
        [activeType]: {
          ...c.costRef?.[activeType],
          [activeSub]: { table: draft, unit: "USD", lastUpdated: today() }
        }
      } as CostRef
    }));
    setEditing(false);
    setDraft(null);
    showToast(t.savedOK);
  };
  const cur = getEff();
  const activeTable = editing ? draft : cur.table;
  const allVals = useMemo(() => locs.flatMap(l => PACKAGES.map(p => Number(cur.table?.[l.code]?.[p]) || 0)).filter(v => v > 0), [cur.table, locs]);
  const getHeat = (val: string): string => { if (!val || isNaN(Number(val))) return ""; const v = Number(val); const mn = Math.min(...allVals), mx = Math.max(...allVals); const r = mx > mn ? (v - mn) / (mx - mn) : 0.5; if (r < 0.33) return "bg-blue-900/40 text-blue-300"; if (r < 0.66) return "bg-indigo-900/40 text-indigo-300"; return "bg-purple-900/40 text-purple-300"; };
  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div className="flex gap-3 mb-5">
        {(["Primer", "Supplier"] as const).map(tp => <button key={tp} onClick={() => { setActiveType(tp); setEditing(false); }} className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition ${activeType === tp ? (tp === "Primer" ? "border-indigo-500 bg-indigo-900/30 text-indigo-300" : "border-purple-500 bg-purple-900/30 text-purple-300") : "border-gray-700 text-gray-500"}`}>{tp === "Primer" ? "🏢 " : "🤝 "}{tp === "Primer" ? t.primer : t.supplier}</button>)}
      </div>
      <div className="flex gap-1 mb-4 bg-gray-800 rounded-lg p-1 w-fit">
        {([{ key: "salary" as const, label: `💰 ${t.salaryRef}` }, { key: "insurance" as const, label: `🏥 ${t.insuranceRef}` }]).map(tb => <button key={tb.key} onClick={() => { setActiveSub(tb.key); setEditing(false); }} className={`px-4 py-1.5 rounded text-sm font-medium transition ${activeSub === tb.key ? "bg-gray-700 text-white" : "text-gray-500"}`}>{tb.label}</button>)}
      </div>
      {!isShared && <div className="flex items-center justify-between mb-3">{!editing ? <button onClick={startEdit} className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 rounded-lg text-sm">✏️ {t.editMode}</button> : <><button onClick={saveEdit} className="px-4 py-2 bg-green-700 rounded-lg text-sm">💾 {t.save}</button><button onClick={cancelEdit} className="px-3 py-2 bg-gray-700 rounded-lg text-sm">{t.cancel}</button></>}</div>}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-xs">
          <thead><tr className="bg-gray-800 border-b border-gray-700"><th className="text-left py-3 px-4 text-gray-400 font-semibold sticky left-0 bg-gray-800">{t.location}</th>{PACKAGES.map(p => <th key={p} className="text-center py-3 px-2 text-gray-300 font-bold">{p}</th>)}</tr></thead>
          <tbody>{locs.map((loc, li) => <tr key={loc.code} className={`border-b border-gray-800/60 ${li % 2 === 0 ? "bg-gray-900" : "bg-gray-900/50"}`}><td className="py-2 px-4 sticky left-0 bg-inherit"><span className={`font-bold text-xs px-2 py-0.5 rounded ${activeType === "Primer" ? "bg-indigo-900/50 text-indigo-300" : "bg-purple-900/50 text-purple-300"}`}>{loc.code}</span></td>{PACKAGES.map(p => { const val = activeTable?.[loc.code]?.[p] || ""; return <td key={p} className="py-1.5 px-1 text-center">{editing ? <input type="number" value={draft?.[loc.code]?.[p] || ""} onChange={e => setDraft(prev => prev ? ({ ...prev, [loc.code]: { ...prev[loc.code], [p]: e.target.value } }) : null)} className="w-full bg-gray-800 border border-gray-700 rounded px-1 py-1.5 text-center text-xs text-white" /> : <div className={`px-2 py-1.5 rounded text-xs font-medium ${val ? getHeat(val) : "text-gray-700"}`}>{val ? fmtN(val) : "—"}</div>}</td>; })}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
};

interface ActualDataScreenProps {
  project: Project;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  t: TranslationType;
}

const ActualDataScreen = ({ project, setProjects, t }: ActualDataScreenProps) => {
  const [activeTab, setActiveTab] = useState<"prime" | "supplier">("prime");
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const showToast = (msg: string, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => {
      try {
        const lines = (ev.target?.result as string).trim().split(/\r?\n/).filter(l => l.trim());
        const hdrs = lines[0].split(",").map(h => h.trim());
        const rows: Record<string, string>[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map(c => c.trim());
          const row: Record<string, string> = {};
          hdrs.forEach((h, idx) => { row[h] = cols[idx] || ""; });
          rows.push(row);
        }
        const month = rows[0]?.["Month"] || today().substring(0, 7);
        const entry: ActualEntry = {
          id: uid(),
          month,
          importedAt: today(),
          rows,
          fileName: file.name,
          offshoreActualMM: parseFloat(rows[0]?.["OffshoreActualMM"] || "") || 0,
          onsiteActualMM: parseFloat(rows[0]?.["OnsiteActualMM"] || "") || 0
        };
        setProjects(ps => ps.map(p => p.id === project.id ? { ...p, actualData: { ...p.actualData, [activeTab]: [...(p.actualData?.[activeTab] || []), entry] } } : p));
        showToast(`${t.importSuccess}`);
      } catch {
        showToast(`${t.importError}`, "error");
      }
      e.target.value = "";
    };
    r.readAsText(file);
  };
  const entries = project.actualData?.[activeTab] || [];
  return (
    <div className="p-6">
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-white">{t.actualData}</h3><button onClick={() => fileRef.current?.click()} className="px-4 py-2 bg-teal-700 rounded-lg text-sm">📤 {t.importActual}</button><input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} /></div>
      <div className="flex gap-1 mb-5 bg-gray-800 rounded-lg p-1 w-fit">{([{ key: "prime" as const, label: `🏢 ${t.actualPrime}` }, { key: "supplier" as const, label: `🤝 ${t.actualSupplier}` }]).map(tb => <button key={tb.key} onClick={() => setActiveTab(tb.key)} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === tb.key ? "bg-gray-700 text-white" : "text-gray-500"}`}>{tb.label}</button>)}</div>
      {entries.length === 0 ? <div className="text-center py-12 text-gray-600"><div className="text-4xl mb-3">📊</div><p>{t.noData}</p></div> : <div className="space-y-3">{entries.map(entry => <div key={entry.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between"><div><Badge label={entry.month} color="teal" /><span className="text-xs text-gray-500 ml-2">{entry.importedAt}</span></div><button onClick={() => setProjects(ps => ps.map(p => p.id === project.id ? { ...p, actualData: { ...p.actualData, [activeTab]: p.actualData[activeTab].filter(e => e.id !== entry.id) } } : p))} className="text-xs px-3 py-1 bg-red-900 rounded-lg text-red-300">{t.del}</button></div>)}</div>}
    </div>
  );
};

interface ProjectDetailScreenProps {
  project: Project;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  onOpenSim: (projId: number, verId: number) => void;
  onOpenCompare: () => void;
  onBack: () => void;
  t: TranslationType;
  admin: AdminConfig;
}

const ProjectDetailScreen = ({ project, setProjects, onOpenSim, onOpenCompare, onBack, t, admin }: ProjectDetailScreenProps) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newVer, setNewVer] = useState(defVersion());
  const [section, setSection] = useState("simulations");
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<Partial<Project>>({});
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const showToast = (msg: string, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const stl = (key: string): string => SIM_TYPES.find(s => s.key === key)?.vi || key;
  const startEditProject = () => { setEditDraft({ code: project.code, name: project.name, startDate: project.startDate, endDate: project.endDate, currency: project.currency, status: project.status }); setIsEditing(true); };
  const saveEditProject = () => { setProjects(ps => ps.map(p => p.id === project.id ? { ...p, ...editDraft } : p)); setIsEditing(false); showToast(t.savedOK); };
  const addVersion = () => { const locs = admin.locations || DEFAULT_LOCS; setProjects(ps => ps.map(p => p.id === project.id ? { ...p, versions: [...p.versions, { ...newVer, id: uid(), data: defSimData(locs) }] } : p)); setShowAdd(false); setNewVer(defVersion()); };

  return (
    <div className="flex flex-col h-full">
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div className="px-6 py-4 bg-gray-900 border-b border-gray-800">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-white mb-2">← {t.back}</button>
        {!isEditing ? (
          <div className="flex items-start justify-between mb-3">
            <div><h2 className="text-xl font-bold text-white">{project.name || "—"}</h2><p className="text-sm text-gray-500">{project.code} · {project.startDate || "?"} → {project.endDate || "?"}</p><Badge label={({ active: t.active, completed: t.completed, onHold: t.onHold }[project.status] || project.status)} color={project.status === "active" ? "green" : "yellow"} /></div>
            <button onClick={startEditProject} className="px-3 py-1.5 bg-gray-700 rounded-lg text-sm">✏️ {t.editProject}</button>
          </div>
        ) : (
          <div className="mb-3 bg-gray-800 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-500 mb-1 block">{t.projectCode}</label><Inp value={editDraft.code} onChange={v => setEditDraft(d => ({ ...d, code: v }))} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">{t.projectName}</label><Inp value={editDraft.name} onChange={v => setEditDraft(d => ({ ...d, name: v }))} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">{t.startDate}</label><Inp type="date" value={editDraft.startDate} onChange={v => setEditDraft(d => ({ ...d, startDate: v }))} /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">{t.endDate}</label><Inp type="date" value={editDraft.endDate} onChange={v => setEditDraft(d => ({ ...d, endDate: v }))} /></div>
            </div>
            <div className="flex gap-2"><button onClick={saveEditProject} className="px-4 py-2 bg-green-700 rounded-lg text-sm">💾 {t.save}</button><button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-700 rounded-lg text-sm">{t.cancel}</button></div>
          </div>
        )}
        <div className="flex gap-1">{[{ key: "simulations", label: `📋 ${t.simVersions}` }, { key: "actual", label: `📊 ${t.actualData}` }, { key: "compare", label: `⚖️ ${t.compare}` }].map(s => <button key={s.key} onClick={() => s.key === "compare" ? onOpenCompare() : setSection(s.key)} className={`px-4 py-2 rounded-lg text-sm font-medium ${section === s.key ? "bg-gray-800 text-white" : "text-gray-500"}`}>{s.label}</button>)}</div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {section === "simulations" && (
          <div className="p-6">
            <div className="flex justify-end mb-4"><button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-indigo-700 rounded-lg text-sm">+ {t.addVersion}</button></div>
            {showAdd && (
              <Card title={t.addVersion} className="mb-5">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div><label className="text-xs text-gray-500 mb-1 block">{t.versionType}</label><Sel value={newVer.type} onChange={v => setNewVer(x => ({ ...x, type: v }))} options={SIM_TYPES.map(s => ({ value: s.key, label: stl(s.key) }))} /></div>
                  <div><label className="text-xs text-gray-500 mb-1 block">{t.versionDate}</label><Inp type="date" value={newVer.date} onChange={v => setNewVer(x => ({ ...x, date: v }))} /></div>
                  <div><label className="text-xs text-gray-500 mb-1 block">{t.createdBy}</label><Inp value={newVer.createdBy} onChange={v => setNewVer(x => ({ ...x, createdBy: v }))} /></div>
                </div>
                <div className="flex gap-2"><button onClick={addVersion} className="px-4 py-2 bg-green-700 rounded-lg text-sm">{t.save}</button><button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-700 rounded-lg text-sm">{t.cancel}</button></div>
              </Card>
            )}
            {project.versions.length === 0 && <div className="text-center py-12 text-gray-600"><div className="text-4xl mb-2">📋</div><p>{t.noData}</p></div>}
            <div className="space-y-3">{project.versions.map((ver, idx) => { const tc: Record<string, string> = { bidding: "yellow", planning: "indigo", monthly: "green", adhoc: "gray" }; return (<div key={ver.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between"><div className="flex items-center gap-4"><span className="text-xs text-gray-600 w-6">v{idx + 1}</span><div><div className="flex items-center gap-2 mb-1"><Badge label={stl(ver.type)} color={tc[ver.type] || "gray"} /><span className="text-sm text-gray-400">{ver.date}</span></div></div></div><button onClick={() => onOpenSim(project.id, ver.id)} className="px-4 py-2 bg-indigo-700 rounded-lg text-sm">{t.openSim}</button></div>); })}</div>
          </div>
        )}
        {section === "actual" && <ActualDataScreen project={project} setProjects={setProjects} t={t} />}
      </div>
    </div>
  );
};

interface ProjectListScreenProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  onOpenProject: (id: number) => void;
  t: TranslationType;
}

const ProjectListScreen = ({ projects, setProjects, onOpenProject, t }: ProjectListScreenProps) => {
  const [showAdd, setShowAdd] = useState(false);
  const [np, setNp] = useState(defProject());
  const sC = (s: string): string => s === "active" ? "green" : "yellow";
  const sL = (s: string): string => ({ active: t.active, completed: t.completed, onHold: t.onHold }[s] || s);
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold text-white">{t.projectList}</h2><button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-indigo-700 rounded-lg text-sm">+ {t.addProject}</button></div>
      {showAdd && (
        <Card title={t.addProject} className="mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className="text-xs text-gray-500 mb-1 block">{t.projectCode}</label><Inp value={np.code} onChange={v => setNp(p => ({ ...p, code: v }))} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">{t.projectName}</label><Inp value={np.name} onChange={v => setNp(p => ({ ...p, name: v }))} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">{t.startDate}</label><Inp type="date" value={np.startDate} onChange={v => setNp(p => ({ ...p, startDate: v }))} /></div>
            <div><label className="text-xs text-gray-500 mb-1 block">{t.endDate}</label><Inp type="date" value={np.endDate} onChange={v => setNp(p => ({ ...p, endDate: v }))} /></div>
          </div>
          <div className="flex gap-2"><button onClick={() => { setProjects(ps => [...ps, { ...np, id: uid() }]); setShowAdd(false); setNp(defProject()); }} className="px-4 py-2 bg-green-700 rounded-lg text-sm">{t.save}</button><button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-700 rounded-lg text-sm">{t.cancel}</button></div>
        </Card>
      )}
      {projects.length === 0 ? <div className="text-center py-16 text-gray-600"><div className="text-5xl mb-3">📂</div><p>{t.noData}</p></div> : (
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-gray-800">{[t.projectCode, t.projectName, t.startDate, t.simVersions, t.status, t.actions].map(h => <th key={h} className="text-left py-3 px-3 text-gray-500">{h}</th>)}</tr></thead><tbody>{projects.map(proj => <tr key={proj.id} className="border-b border-gray-800/50 hover:bg-gray-900/50 cursor-pointer" onClick={() => onOpenProject(proj.id)}><td className="py-3 px-3 text-indigo-400 font-medium">{proj.code || "—"}</td><td className="py-3 px-3 text-white">{proj.name || "—"}</td><td className="py-3 px-3 text-gray-400">{proj.startDate || "—"}</td><td className="py-3 px-3"><Badge label={`${proj.versions.length} v`} color="indigo" /></td><td className="py-3 px-3"><Badge label={sL(proj.status)} color={sC(proj.status)} /></td><td className="py-3 px-3 flex gap-1"><button onClick={e => { e.stopPropagation(); onOpenProject(proj.id); }} className="text-xs px-3 py-1 bg-indigo-700 rounded-lg">{t.view}</button><button onClick={e => { e.stopPropagation(); setProjects(ps => ps.filter(p => p.id !== proj.id)); }} className="text-xs px-2 py-1 bg-red-900 rounded-lg text-red-300">{t.del}</button></td></tr>)}</tbody></table></div>
      )}
    </div>
  );
};

interface AdminScreenProps {
  config: AdminConfig;
  setConfig: React.Dispatch<React.SetStateAction<AdminConfig>>;
  t: TranslationType;
}

const AdminScreen = ({ config, setConfig, t }: AdminScreenProps) => {
  const [tab, setTab] = useState("target");
  const tabs = [{ key: "target", icon: "🎯", label: t.targetSettings }, { key: "roles", icon: "👤", label: t.rolesConfig }, { key: "costref", icon: "💰", label: t.costRefConfig }, { key: "income", icon: "🎁", label: t.projectIncomeConfig }];
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-xl font-bold text-white mb-6">{t.adminTitle}</h2>
      <div className="flex gap-1 mb-6 bg-gray-900 rounded-xl p-1 border border-gray-800">{tabs.map(tb => <button key={tb.key} onClick={() => setTab(tb.key)} className={`px-3 py-2 rounded-lg text-sm font-medium ${tab === tb.key ? "bg-gray-700 text-white" : "text-gray-500"}`}>{tb.icon} {tb.label}</button>)}</div>
      {tab === "target" && <Card title={t.targetSettings}><div className="grid grid-cols-2 gap-6"><div className="bg-gray-800/50 rounded-xl p-4"><label className="text-xs text-gray-500 mb-1 block">{t.targetGM}</label><Inp type="number" value={config.targetGrossMargin} onChange={v => setConfig(c => ({ ...c, targetGrossMargin: parseFloat(v) || 0 }))} /></div><div className="bg-gray-800/50 rounded-xl p-4"><label className="text-xs text-gray-500 mb-1 block">{t.targetDM}</label><Inp type="number" value={config.targetDirectMargin} onChange={v => setConfig(c => ({ ...c, targetDirectMargin: parseFloat(v) || 0 }))} /></div></div></Card>}
      {tab === "roles" && <Card title={t.rolesConfig}><div className="space-y-2 mb-4">{config.roles.map((r, i) => <div key={i} className="flex gap-2"><Inp value={r} onChange={v => setConfig(c => ({ ...c, roles: c.roles.map((x, j) => j === i ? v : x) }))} /><button onClick={() => setConfig(c => ({ ...c, roles: c.roles.filter((_, j) => j !== i) }))} className="text-gray-600 hover:text-red-400 px-2">✕</button></div>)}</div><button onClick={() => setConfig(c => ({ ...c, roles: [...c.roles, ""] }))} className="text-sm px-3 py-1.5 bg-indigo-700 rounded-lg">+ {t.addRole}</button></Card>}
      {tab === "costref" && <Card title={t.costRefConfig}><CostRefTable config={config} setConfig={setConfig} t={t} /></Card>}
      {tab === "income" && <Card title={t.projectIncomeConfig}><div className="max-w-sm"><label className="text-xs text-gray-500 mb-1 block">{t.projectIncomePct}</label><div className="flex items-center gap-3"><Inp type="number" value={config.projectIncomePct} onChange={v => setConfig(c => ({ ...c, projectIncomePct: parseFloat(v) || 0 }))} className="w-32" /><span className="text-gray-400">%</span></div></div></Card>}
    </div>
  );
};

export default function App() {
  const [lang, setLang] = useState<"vi" | "en">("vi");
  const t = T[lang];
  const [screen, setScreen] = useState("projects");
  const [projects, setProjects] = useState<Project[]>([]);
  const [admin, setAdmin] = useState(defAdmin());
  const [activeProjId, setActiveProjId] = useState<number | null>(null);
  const [activeVerId, setActiveVerId] = useState<number | null>(null);
  const activeProject = projects.find(p => p.id === activeProjId);
  const activeVersion = activeProject?.versions.find(v => v.id === activeVerId);
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col" style={{ fontFamily: "system-ui,sans-serif" }}>
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-base font-bold text-white">📊 {t.appTitle}</h1>
          <div className="flex gap-1">{[{ key: "projects", icon: "📂", label: t.projects }, { key: "admin", icon: "⚙️", label: t.admin }].map(item => <button key={item.key} onClick={() => setScreen(item.key)} className={`px-3 py-1.5 rounded text-sm font-medium ${(screen === item.key || (item.key === "projects" && ["project-detail", "simulation", "compare"].includes(screen))) ? "bg-gray-800 text-white" : "text-gray-500"}`}>{item.icon} {item.label}</button>)}</div>
        </div>
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">{(["vi", "en"] as const).map(l => <button key={l} onClick={() => setLang(l)} className={`px-3 py-1 rounded text-sm font-medium ${lang === l ? "bg-indigo-600 text-white" : "text-gray-500"}`}>{l === "vi" ? "🇻🇳 VI" : "🇬🇧 EN"}</button>)}</div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {screen === "projects" && <ProjectListScreen projects={projects} setProjects={setProjects} onOpenProject={id => { setActiveProjId(id); setScreen("project-detail"); }} t={t} />}
        {screen === "project-detail" && activeProject && <ProjectDetailScreen project={activeProject} setProjects={setProjects} onOpenSim={(pid, vid) => { setActiveProjId(pid); setActiveVerId(vid); setScreen("simulation"); }} onOpenCompare={() => setScreen("compare")} onBack={() => setScreen("projects")} t={t} admin={admin} />}
        {screen === "simulation" && activeProject && activeVersion && <SimScreen project={activeProject} version={activeVersion} setProjects={setProjects} admin={admin} onBack={() => setScreen("project-detail")} t={t} />}
        {screen === "compare" && activeProject && <CompareVersionsScreen project={activeProject} admin={admin} onBack={() => setScreen("project-detail")} t={t} />}
        {screen === "admin" && <AdminScreen config={admin} setConfig={setAdmin} t={t} />}
      </div>
    </div>
  );
}
