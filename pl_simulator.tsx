import { useState, useMemo, useRef } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const PACKAGES = ["P1","P2","P3","P4","P5","P6","P7","P8","P9"];
const CURRENCIES = ["USD","VND","JPY","EUR","SGD"];
const SIMULATION_TYPES = [
  { key:"bidding", vi:"Bidding", en:"Bidding" },
  { key:"planning", vi:"Project Planning", en:"Project Planning" },
  { key:"monthly", vi:"Cập nhật tháng", en:"Monthly Update" },
  { key:"adhoc", vi:"Adhoc", en:"Adhoc" },
];
const SUPPLIER_TYPES = ["Primer","Supplier"];
const DEFAULT_LOCATIONS = [
  { code:"HN",  name:{ vi:"Hà Nội", en:"Hanoi" } },
  { code:"HL",  name:{ vi:"Hoà Lạc", en:"Hoa Lac" } },
  { code:"DN",  name:{ vi:"Đà Nẵng", en:"Da Nang" } },
  { code:"HCM", name:{ vi:"Hồ Chí Minh", en:"Ho Chi Minh" } },
  { code:"CT",  name:{ vi:"Cần Thơ", en:"Can Tho" } },
  { code:"QNH", name:{ vi:"Quy Nhơn", en:"Quy Nhon" } },
  { code:"HUE", name:{ vi:"Huế", en:"Hue" } },
  { code:"NT",  name:{ vi:"Nha Trang", en:"Nha Trang" } },
];
const DEFAULT_ROLES = ["Project Manager","Business Analyst","Tech Lead","Senior Developer","Developer","Junior Developer","QA Engineer","DevOps","Designer","Comtor","Scrum Master"];
const DEFAULT_CONTRACT_TYPES = ["EMP","APP","POI"];

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const PRIMER_SALARY = {
  HN: [236,409,562,802,1187,1611,2094,2546,3340],
  HL: [236,409,562,802,1187,1611,2094,2546,3340],
  DN: [236,389,534,762,1128,1532,1988,2420,3340],
  HCM:[236,428,589,841,1246,1694,2200,2672,3340],
  CT: [236,428,589,841,1246,1694,2200,2672,3340],
  QNH:[236,389,534,762,1128,1532,1988,2420,3340],
  HUE:[236,389,534,762,1128,1532,1988,2420,3340],
  NT: [236,389,534,762,1128,1532,1988,2420,3340],
};
const SUPPLIER_SALARY = {
  HN: [236,409,562,802,1187,1611,2094,2546,3340],
  HL: [236,409,562,802,1187,1611,2094,2546,3340],
  DN: [236,389,534,762,1128,1532,1988,2420,3340],
  HCM:[236,428,589,841,1246,1694,2200,2672,3340],
  CT: [236,428,589,841,1246,1694,2200,2672,3340],
  QNH:[236,389,534,762,1128,1532,1988,2420,3340],
  HUE:[236,389,534,762,1128,1532,1988,2420,3340],
  NT: [236,389,534,762,1128,1532,1988,2420,3340],
};
// Insurance shared between Primer & Supplier
const SHARED_INSURANCE = {
  HN: [51,51,51,54,54,63,63,63,189],
  HL: [51,51,51,54,54,63,63,63,189],
  DN: [51,51,51,54,54,63,63,63,189],
  HCM:[51,51,51,54,54,63,63,63,189],
  CT: [51,51,51,54,54,63,63,63,189],
  QNH:[46,46,46,49,49,58,58,58,189],
  HUE:[51,51,51,54,54,63,63,63,189],
  NT: [51,51,51,54,54,63,63,63,189],
};

const buildTableFromSeed = (seed) => {
  const t = {};
  DEFAULT_LOCATIONS.forEach(l => {
    t[l.code] = {};
    PACKAGES.forEach((p,i) => { t[l.code][p] = seed[l.code]?.[i]?.toString() || ""; });
  });
  return t;
};

// ─── I18N ─────────────────────────────────────────────────────────────────────
const T = {
  vi:{
    appTitle:"P&L Simulation Tool", admin:"Quản trị", projects:"Dự án",
    projectList:"Danh sách dự án", addProject:"Thêm dự án",
    projectCode:"Mã dự án", projectName:"Tên dự án", startDate:"Ngày bắt đầu",
    endDate:"Ngày kết thúc", currency:"Đơn vị tiền tệ", status:"Trạng thái",
    actions:"Thao tác", view:"Xem", del:"Xóa",
    simVersions:"Phiên bản Simulation", addVersion:"Thêm phiên bản",
    versionType:"Loại", versionDate:"Ngày tạo", versionNote:"Ghi chú", createdBy:"Người tạo",
    openSim:"Mở Simulation",
    projectInfo:"Thông tin dự án", offshoreTeam:"Offshore Team", onsiteTeam:"Onsite Team (Long-term)",
    billableMM:"Billable MM", wipRevenue:"WIP Revenue",
    planningPhase:"Planning Phase", forecastPhase:"Forecast Remaining Phase",
    costPrime:"Chi phí VN - Prime/Partner", costSupplier:"Chi phí VN - Supplier (F1/IVS)",
    costOnsite:"Chi phí Onsite (Other OBs)",
    calEffortEMP:"Calendar Effort - EMP (bao gồm PM)", calEffortAPP:"Calendar Effort - APP/POI",
    hardSalaryEMP:"EMP Salary Cost (Hard + 13th + Soft)", hardSalaryAPP:"Hard Salary Cost - APP/POI",
    insurance:"Insurance & FPT Care (EMP)", otPct:"OT (%)", campaignPct:"Campaign (%)",
    otCost:"OT & Campaign costs", xjob:"Xjob", electricity:"Điện, nước, chỗ ngồi", otherExp:"Chi phí khác",
    softSalary:"Estimated soft salary (EMP)", travelAllowance:"Điện, nước, chỗ ngồi, phụ cấp",
    unitSalaryEMP:"Unit salary EMP ($/MM)", unitSalaryAPP:"Unit salary APP/POI ($/MM)",
    plSummary:"Kết quả P&L", totalRevenue:"Tổng doanh thu", totalCost:"Tổng chi phí",
    grossProfit:"Lợi nhuận gộp", grossMargin:"Gross Margin", directMargin:"Direct Margin",
    targetGrossMargin:"Target Gross Margin (%)", targetDirectMargin:"Target Direct Margin (%)",
    aboveTarget:"✓ Đạt target", belowTarget:"✗ Chưa đạt",
    needMore:"Cần tăng thêm", profit:"lợi nhuận",
    adminTitle:"Cấu hình hệ thống", targetSettings:"Target Margin",
    rolesConfig:"Cấu hình Role", contractConfig:"Loại hợp đồng", locationConfig:"Cấu hình Location",
    costRefConfig:"Bảng chi phí tham chiếu", projectIncomeConfig:"Project Income",
    addRole:"Thêm role", addContract:"Thêm loại HĐ", addLocation:"Thêm location",
    save:"Lưu", cancel:"Hủy", back:"Quay lại",
    tbd:"Sẽ cập nhật sau", total:"Tổng", location:"Location", package:"Package",
    noData:"Chưa có dữ liệu", active:"Đang hoạt động", completed:"Hoàn thành", onHold:"Tạm dừng",
    primer:"Primer", supplier:"Supplier",
    salaryRef:"Salary", insuranceRef:"Insurance & FPT Care",
    importCSV:"Import CSV", downloadTemplate:"Tải template",
    importSuccess:"Import thành công!", importError:"Lỗi import.",
    importGuide:"CSV cần cột: Location, P1, P2, ..., P9",
    editMode:"Chỉnh sửa", lastUpdated:"Cập nhật lần cuối",
    unsavedChanges:"Chưa lưu", savedSuccess:"Đã lưu!",
    projectIncomePct:"Project Income %", projectIncomeNote:"Dùng trong công thức EMP salary: (1 + 8% + Project Income%) × SUMPRODUCT",
    actualData:"Actual Data", actualPrime:"Actual - Prime/Partner", actualSupplier:"Actual - Supplier",
    importActual:"Import Actual Data", month:"Tháng",
    forecastNote:"Forecast Remaining Phase: chỉ chứa chi phí giai đoạn còn lại (sau khi đã có actual data các tháng trước).",
    autoCalc:"Tự động tính từ Planning Phase & Actual Data",
    sharedInsurance:"(Dùng chung với Primer)",
  },
  en:{
    appTitle:"P&L Simulation Tool", admin:"Admin", projects:"Projects",
    projectList:"Project List", addProject:"Add Project",
    projectCode:"Project Code", projectName:"Project Name", startDate:"Start Date",
    endDate:"End Date", currency:"Currency", status:"Status",
    actions:"Actions", view:"View", del:"Delete",
    simVersions:"Simulation Versions", addVersion:"Add Version",
    versionType:"Type", versionDate:"Date", versionNote:"Note", createdBy:"Created By",
    openSim:"Open Simulation",
    projectInfo:"Project Info", offshoreTeam:"Offshore Team", onsiteTeam:"Onsite Team (Long-term)",
    billableMM:"Billable MM", wipRevenue:"WIP Revenue",
    planningPhase:"Planning Phase", forecastPhase:"Forecast Remaining Phase",
    costPrime:"Cost VN - Prime/Partner", costSupplier:"Cost VN - Supplier (F1/IVS)",
    costOnsite:"Costs at other OBs (Onsite)",
    calEffortEMP:"Calendar Effort - EMP (incl. PM)", calEffortAPP:"Calendar Effort - APP/POI",
    hardSalaryEMP:"EMP Salary Cost (Hard + 13th + Soft)", hardSalaryAPP:"Hard Salary Cost - APP/POI",
    insurance:"Insurance & FPT Care (EMP)", otPct:"OT (%)", campaignPct:"Campaign (%)",
    otCost:"OT & Campaign costs", xjob:"Xjob", electricity:"Electricity, water & seating", otherExp:"Other expenses",
    softSalary:"Estimated soft salary (EMP)", travelAllowance:"Electricity, water, seating & travel",
    unitSalaryEMP:"Unit salary EMP ($/MM)", unitSalaryAPP:"Unit salary APP/POI ($/MM)",
    plSummary:"P&L Result", totalRevenue:"Total Revenue", totalCost:"Total Cost",
    grossProfit:"Gross Profit", grossMargin:"Gross Margin", directMargin:"Direct Margin",
    targetGrossMargin:"Target Gross Margin (%)", targetDirectMargin:"Target Direct Margin (%)",
    aboveTarget:"✓ On target", belowTarget:"✗ Below target",
    needMore:"Need additional", profit:"profit",
    adminTitle:"System Configuration", targetSettings:"Target Margin",
    rolesConfig:"Role Configuration", contractConfig:"Contract Types", locationConfig:"Location Configuration",
    costRefConfig:"Personnel Cost Reference", projectIncomeConfig:"Project Income",
    addRole:"Add Role", addContract:"Add Contract Type", addLocation:"Add Location",
    save:"Save", cancel:"Cancel", back:"Back",
    tbd:"To be updated", total:"Total", location:"Location", package:"Package",
    noData:"No data yet", active:"Active", completed:"Completed", onHold:"On Hold",
    primer:"Primer", supplier:"Supplier",
    salaryRef:"Salary", insuranceRef:"Insurance & FPT Care",
    importCSV:"Import CSV", downloadTemplate:"Download Template",
    importSuccess:"Import successful!", importError:"Import error.",
    importGuide:"CSV must have columns: Location, P1, P2, ..., P9",
    editMode:"Edit", lastUpdated:"Last updated",
    unsavedChanges:"Unsaved", savedSuccess:"Saved!",
    projectIncomePct:"Project Income %", projectIncomeNote:"Used in EMP salary formula: (1 + 8% + Project Income%) × SUMPRODUCT",
    actualData:"Actual Data", actualPrime:"Actual - Prime/Partner", actualSupplier:"Actual - Supplier",
    importActual:"Import Actual Data", month:"Month",
    forecastNote:"Forecast Remaining Phase: contains only remaining costs from current month to project end (after actual data from past months).",
    autoCalc:"Auto-calculated from Planning Phase & Actual Data",
    sharedInsurance:"(Shared with Primer)",
  }
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = n => new Intl.NumberFormat("en-US").format(Math.round(n||0));
const fmtN = n => { if(!n&&n!==0)return""; const v=Number(n); if(v>=1000000)return(v/1000000).toFixed(1)+"M"; if(v>=1000)return(v/1000).toFixed(0)+"K"; return v.toString(); };
const pct = n => (isNaN(n)||!isFinite(n)?"0.0":Number(n).toFixed(1));
const uid = () => Date.now()+Math.random();
const today = () => new Date().toISOString().split("T")[0];
const mColor = (m,tgt) => m>=tgt?"text-green-400":m>=tgt*0.8?"text-yellow-400":"text-red-400";
const mBg = (m,tgt) => m>=tgt?"bg-green-500":m>=tgt*0.8?"bg-yellow-500":"bg-red-500";

// ─── DEFAULT DATA ─────────────────────────────────────────────────────────────
const defaultCEMatrix = (locs) => {
  const m={};
  (locs||DEFAULT_LOCATIONS).forEach(l=>{ m[l.code]={}; PACKAGES.forEach(p=>{ m[l.code][p]=""; }); });
  return m;
};

const defaultVNCost = (locs) => ({
  ceEMP: defaultCEMatrix(locs), ceAPP: defaultCEMatrix(locs),
  otPct:10, campaignPct:0, xjob:"", otherExp:"",
});

const defaultPhase = (locs) => ({
  offshore:{ billableMM:"", wipRevenue:"" },
  onsite:{ billableMM:"", wipRevenue:"" },
  currency:"USD",
  prime: defaultVNCost(locs),
  supplier: defaultVNCost(locs),
  onsiteCeEMP:"", onsiteCeAPP:"", onsiteUnitSalaryEMP:"", onsiteUnitSalaryAPP:"", onsiteOtherExp:"",
});

const defaultSimData = (locs) => ({ planning: defaultPhase(locs), forecast: defaultPhase(locs) });
const defaultProject = () => ({ id:uid(), code:"", name:"", startDate:"", endDate:"", currency:"USD", status:"active", versions:[], actualData:{ prime:[], supplier:[] } });
const defaultVersion = (type="bidding") => ({ id:uid(), type, date:today(), note:"", createdBy:"PM", data:defaultSimData() });

const defaultCostRef = (locs) => ({
  Primer:{
    salary:{ table:buildTableFromSeed(PRIMER_SALARY), unit:"USD", lastUpdated:today() },
    insurance:{ table:buildTableFromSeed(SHARED_INSURANCE), unit:"USD", lastUpdated:today() },
  },
  Supplier:{
    salary:{ table:buildTableFromSeed(SUPPLIER_SALARY), unit:"USD", lastUpdated:today() },
    insurance:null, // shared with Primer
  },
});

const defaultAdmin = () => ({
  targetGrossMargin:25, targetDirectMargin:20, projectIncomePct:30,
  roles:[...DEFAULT_ROLES], contractTypes:[...DEFAULT_CONTRACT_TYPES],
  locations: DEFAULT_LOCATIONS.map(l=>({...l,active:true})),
  costRef: defaultCostRef(DEFAULT_LOCATIONS),
});

// ─── UI ───────────────────────────────────────────────────────────────────────
const Inp = ({value,onChange,placeholder,type="text",className="",disabled=false}) => (
  <input type={type} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
    className={`bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white w-full disabled:opacity-40 disabled:cursor-not-allowed ${className}`}/>
);
const Sel = ({value,onChange,options,className=""}) => (
  <select value={value} onChange={e=>onChange(e.target.value)}
    className={`bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white w-full ${className}`}>
    {options.map(o=><option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}
  </select>
);
const Card = ({title,children,className="",action}) => (
  <div className={`bg-gray-900 rounded-xl border border-gray-800 ${className}`}>
    {title&&<div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between"><h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{title}</h3>{action}</div>}
    <div className="p-5">{children}</div>
  </div>
);
const Badge = ({label,color="gray"}) => {
  const c={gray:"bg-gray-700 text-gray-300",green:"bg-green-900 text-green-300",yellow:"bg-yellow-900 text-yellow-300",red:"bg-red-900 text-red-300",indigo:"bg-indigo-900 text-indigo-300",purple:"bg-purple-900 text-purple-300",teal:"bg-teal-900 text-teal-300",blue:"bg-blue-900 text-blue-300"};
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c[color]||c.gray}`}>{label}</span>;
};
const Toast = ({msg,type="success"}) => (
  <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 ${type==="success"?"bg-green-800 text-green-100":"bg-red-800 text-red-100"}`}>
    {type==="success"?"✓":"✗"} {msg}
  </div>
);
const AutoField = ({label,value,note}) => (
  <div>
    <label className="text-xs text-gray-500 mb-1 block">{label}</label>
    <div className="bg-gray-700/60 border border-gray-600 rounded-lg px-3 py-2 text-sm text-indigo-300 font-medium flex items-center justify-between">
      <span>{value}</span>
      {note&&<span className="text-xs text-gray-500 ml-2">{note}</span>}
    </div>
  </div>
);

// ─── CE MATRIX (Location=row, Package=col) ───────────────────────────────────
const CEMatrix = ({label,ceData,onChange,locations,t}) => {
  const [collapsed,setCollapsed] = useState(false);
  const locs = locations||DEFAULT_LOCATIONS;
  const totalByLoc = loc => PACKAGES.reduce((s,p)=>s+(parseFloat(ceData?.[loc]?.[p])||0),0);
  const totalByPkg = pkg => locs.reduce((s,l)=>s+(parseFloat(ceData?.[l.code]?.[pkg])||0),0);
  const grand = locs.reduce((s,l)=>s+totalByLoc(l.code),0);
  return (
    <div className="mb-3">
      <button onClick={()=>setCollapsed(c=>!c)} className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2 w-full text-left hover:text-white">
        <span className="text-xs">{collapsed?"▶":"▼"}</span>{label}
        <span className="ml-auto text-indigo-400 text-xs font-bold">{t.total}: {grand||0} MM</span>
      </button>
      {!collapsed&&(
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="text-xs w-full">
            <thead><tr className="bg-gray-800">
              <th className="text-left py-2 px-3 text-gray-500 sticky left-0 bg-gray-800 w-16">{t.location}</th>
              {PACKAGES.map(p=><th key={p} className="text-center py-2 px-1 text-gray-500 min-w-12">{p}</th>)}
              <th className="text-center py-2 px-2 text-gray-400">{t.total}</th>
            </tr></thead>
            <tbody>
              {locs.map(loc=>(
                <tr key={loc.code} className="border-t border-gray-800/60">
                  <td className="py-1 px-3 text-gray-400 font-medium sticky left-0 bg-gray-900">{loc.code}</td>
                  {PACKAGES.map(p=>(
                    <td key={p} className="py-0.5 px-0.5">
                      <input type="number" value={ceData?.[loc.code]?.[p]||""} onChange={e=>onChange(loc.code,p,e.target.value)} placeholder="0" min="0" step="0.1"
                        className="w-full bg-gray-800 border border-gray-700 rounded px-1 py-1 text-center text-xs focus:outline-none focus:border-indigo-500 text-white"/>
                    </td>
                  ))}
                  <td className="py-1 px-2 text-center text-indigo-400 font-semibold">{totalByLoc(loc.code)||"—"}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-700 bg-gray-800/40">
                <td className="py-2 px-3 text-gray-400 font-semibold sticky left-0 bg-gray-800/40">{t.total}</td>
                {PACKAGES.map(p=><td key={p} className="py-2 text-center text-gray-400">{totalByPkg(p)||"—"}</td>)}
                <td className="py-2 px-2 text-center text-white font-bold">{grand||"—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── COST REF TABLE (Location=row, Package=col) ───────────────────────────────
const CostRefTable = ({config,setConfig,t,lang}) => {
  const [activeType,setActiveType] = useState("Primer");
  const [activeSubTab,setActiveSubTab] = useState("salary");
  const [isEditing,setIsEditing] = useState(false);
  const [draft,setDraft] = useState(null);
  const [draftUnit,setDraftUnit] = useState("USD");
  const [toast,setToast] = useState(null);
  const [importErr,setImportErr] = useState("");
  const fileRef = useRef();

  const locations = config.locations||DEFAULT_LOCATIONS;
  const isSharedInsurance = activeType==="Supplier" && activeSubTab==="insurance";
  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const getEffectiveData = () => {
    if(isSharedInsurance) return config.costRef?.Primer?.insurance || { table:{}, unit:"USD", lastUpdated:"" };
    return config.costRef?.[activeType]?.[activeSubTab] || { table:{}, unit:"USD", lastUpdated:"" };
  };

  const startEdit = () => {
    if(isSharedInsurance) return; // can't edit shared table here
    const cur = getEffectiveData();
    const synced = {};
    locations.forEach(l=>{ synced[l.code]={}; PACKAGES.forEach(p=>{ synced[l.code][p]=cur.table?.[l.code]?.[p]||""; }); });
    setDraft(synced); setDraftUnit(cur.unit||"USD"); setIsEditing(true); setImportErr("");
  };
  const cancelEdit = () => { setIsEditing(false); setDraft(null); setImportErr(""); };
  const saveEdit = () => {
    setConfig(c=>({ ...c, costRef:{ ...c.costRef, [activeType]:{ ...c.costRef?.[activeType], [activeSubTab]:{ table:draft, unit:draftUnit, lastUpdated:today() } } } }));
    setIsEditing(false); setDraft(null); showToast(t.savedSuccess);
  };

  const downloadTemplate = () => {
    const header = ["Location",...PACKAGES].join(",");
    const rows = locations.map(l=>[l.code,...PACKAGES.map(()=>"")].join(","));
    const csv = [header,...rows].join("\n");
    const blob = new Blob([csv],{type:"text/csv"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`cost_ref_${activeType}_${activeSubTab}_template.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file=e.target.files?.[0]; if(!file)return; setImportErr("");
    const reader=new FileReader();
    reader.onload=(ev)=>{
      try {
        const lines=ev.target.result.trim().split(/\r?\n/).filter(l=>l.trim());
        if(lines.length<2)throw new Error("No data rows");
        const headers=lines[0].split(",").map(h=>h.trim().replace(/"/g,"").toUpperCase());
        const locCodes=locations.map(l=>l.code);
        const newTable={};
        locations.forEach(l=>{ newTable[l.code]={}; PACKAGES.forEach(p=>{ newTable[l.code][p]=""; }); });
        let imported=0;
        for(let i=1;i<lines.length;i++){
          const cols=lines[i].split(",").map(c=>c.trim().replace(/"/g,"").replace(/,/g,""));
          const loc=cols[0]?.toUpperCase();
          if(!locCodes.includes(loc))continue;
          PACKAGES.forEach((p,pi)=>{
            const colIdx=headers.indexOf(p);
            if(colIdx>-1){ newTable[loc][p]=cols[colIdx]||""; if(cols[colIdx])imported++; }
            else if(pi+1<cols.length){ newTable[loc][p]=cols[pi+1]||""; if(cols[pi+1])imported++; }
          });
        }
        if(imported===0)throw new Error("No valid data found");
        setDraft(newTable); showToast(`${t.importSuccess} (${imported} cells)`);
      } catch(err){ setImportErr(`${t.importError} ${err.message}`); }
      e.target.value="";
    };
    reader.readAsText(file);
  };

  const cur = getEffectiveData();
  const activeTable = isEditing ? draft : cur.table;

  const allVals = useMemo(()=>locations.flatMap(l=>PACKAGES.map(p=>Number(cur.table?.[l.code]?.[p])||0)).filter(v=>v>0),[cur.table,locations]);
  const getHeat = (val) => {
    if(!val||isNaN(Number(val)))return"";
    const v=Number(val); const min=Math.min(...allVals), max=Math.max(...allVals);
    const ratio=max>min?(v-min)/(max-min):0.5;
    if(ratio<0.33)return"bg-blue-900/40 text-blue-300"; if(ratio<0.66)return"bg-indigo-900/40 text-indigo-300"; return"bg-purple-900/40 text-purple-300";
  };

  return (
    <div>
      {toast&&<Toast msg={toast.msg} type={toast.type}/>}
      {/* Type selector */}
      <div className="flex gap-3 mb-5">
        {SUPPLIER_TYPES.map(type=>(
          <button key={type} onClick={()=>{setActiveType(type);setIsEditing(false);setDraft(null);}}
            className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition ${activeType===type?(type==="Primer"?"border-indigo-500 bg-indigo-900/30 text-indigo-300":"border-purple-500 bg-purple-900/30 text-purple-300"):"border-gray-700 text-gray-500 hover:border-gray-600"}`}>
            {type==="Primer"?"🏢 ":"🤝 "}{type==="Primer"?t.primer:t.supplier}
          </button>
        ))}
      </div>
      {/* Sub-tab */}
      <div className="flex gap-1 mb-4 bg-gray-800 rounded-lg p-1 w-fit">
        {[{key:"salary",label:`💰 ${t.salaryRef}`},{key:"insurance",label:`🏥 ${t.insuranceRef}`}].map(tab=>(
          <button key={tab.key} onClick={()=>{setActiveSubTab(tab.key);setIsEditing(false);setDraft(null);}}
            className={`px-4 py-1.5 rounded text-sm font-medium transition flex items-center gap-1 ${activeSubTab===tab.key?"bg-gray-700 text-white":"text-gray-500 hover:text-gray-300"}`}>
            {tab.label}
            {tab.key==="insurance"&&activeType==="Supplier"&&<span className="text-xs text-gray-500">{t.sharedInsurance}</span>}
          </button>
        ))}
      </div>
      {/* Shared notice */}
      {isSharedInsurance&&(
        <div className="mb-4 px-4 py-3 bg-blue-900/20 border border-blue-800 rounded-xl text-xs text-blue-300 flex items-center gap-2">
          ℹ️ Insurance & FPT Care table is shared with Primer. Edit from the Primer tab.
        </div>
      )}
      {/* Toolbar */}
      {!isSharedInsurance&&(
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {!isEditing
              ?<button onClick={startEdit} className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 rounded-lg text-sm font-medium">✏️ {t.editMode}</button>
              :<><button onClick={saveEdit} className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-sm">💾 {t.save}</button>
                 <button onClick={cancelEdit} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">{t.cancel}</button>
                 <span className="text-xs text-yellow-400">⚠ {t.unsavedChanges}</span></>}
          </div>
          {isEditing&&(
            <div className="flex gap-2">
              <Sel value={draftUnit} onChange={setDraftUnit} options={[{value:"USD",label:"USD/month"},{value:"VND",label:"VND/month"}]} className="w-36 text-xs"/>
              <button onClick={downloadTemplate} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">📥 {t.downloadTemplate}</button>
              <button onClick={()=>fileRef.current?.click()} className="px-3 py-2 bg-teal-700 hover:bg-teal-600 rounded-lg text-sm">📤 {t.importCSV}</button>
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleImport}/>
            </div>
          )}
          {!isEditing&&cur.unit&&<span className="text-xs text-gray-500 bg-gray-800 px-3 py-1.5 rounded-lg">Unit: <span className="text-gray-300">{cur.unit}/month</span></span>}
        </div>
      )}
      {importErr&&<div className="mb-3 px-3 py-2 bg-red-900/30 border border-red-700 rounded-lg text-xs text-red-400">⚠ {importErr}</div>}
      {isEditing&&<div className="mb-3 px-3 py-2 bg-gray-800 rounded-lg text-xs text-gray-400">💡 {t.importGuide}</div>}
      {/* Table: Location=row, Package=col */}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-800 border-b border-gray-700">
              <th className="text-left py-3 px-4 text-gray-400 font-semibold sticky left-0 bg-gray-800 min-w-20">
                {t.location} | {t.package}
              </th>
              {PACKAGES.map(p=><th key={p} className="text-center py-3 px-2 text-gray-300 font-bold min-w-20">{p}</th>)}
            </tr>
          </thead>
          <tbody>
            {locations.map((loc,li)=>(
              <tr key={loc.code} className={`border-b border-gray-800/60 ${li%2===0?"bg-gray-900":"bg-gray-900/50"}`}>
                <td className="py-2 px-4 sticky left-0 bg-inherit">
                  <div>
                    <span className={`font-bold text-xs px-2 py-0.5 rounded ${activeType==="Primer"?"bg-indigo-900/50 text-indigo-300":"bg-purple-900/50 text-purple-300"}`}>{loc.code}</span>
                    <div className="text-gray-600 text-xs mt-0.5">{loc.name[lang]||loc.name.vi}</div>
                  </div>
                </td>
                {PACKAGES.map(p=>{
                  const val=activeTable?.[loc.code]?.[p]||"";
                  return (
                    <td key={p} className="py-1.5 px-1 text-center">
                      {isEditing
                        ?<input type="number" value={draft?.[loc.code]?.[p]||""} onChange={e=>setDraft(prev=>({...prev,[loc.code]:{...prev[loc.code],[p]:e.target.value}}))} placeholder="0"
                            className="w-full bg-gray-800 border border-gray-700 rounded px-1 py-1.5 text-center text-xs focus:outline-none focus:border-indigo-500 text-white"/>
                        :<div className={`px-2 py-1.5 rounded text-xs font-medium ${val?getHeat(val):"text-gray-700"}`}>{val?fmtN(val):"—"}</div>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex justify-between items-center">
        <div className="flex gap-3 text-xs text-gray-600">
          {!isEditing&&allVals.length>0&&<>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-900/40 inline-block"/>Low</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-900/40 inline-block"/>Mid</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-900/40 inline-block"/>High</span>
          </>}
        </div>
        {cur.lastUpdated&&<span className="text-xs text-gray-600">{t.lastUpdated}: {cur.lastUpdated}</span>}
      </div>
    </div>
  );
};

// ─── CALC ─────────────────────────────────────────────────────────────────────
const calcSection = (section, salaryTable, insuranceTable, projectIncomePct, locations) => {
  const locs=locations||DEFAULT_LOCATIONS;
  let sumEMP=0, sumAPP=0, sumIns=0;
  locs.forEach(l=>{ PACKAGES.forEach(p=>{
    const ceE=parseFloat(section?.ceEMP?.[l.code]?.[p])||0;
    const ceA=parseFloat(section?.ceAPP?.[l.code]?.[p])||0;
    const sal=parseFloat(salaryTable?.[l.code]?.[p])||0;
    const ins=parseFloat(insuranceTable?.[l.code]?.[p])||0;
    sumEMP+=ceE*sal; sumAPP+=ceA*sal; sumIns+=ceE*ins;
  }); });
  const empCost=(1+0.08+(projectIncomePct/100))*sumEMP;
  const appCost=sumAPP;
  const insCost=sumIns;
  const personnel=empCost+appCost;
  const otCamp=personnel*((parseFloat(section?.otPct)||0)+(parseFloat(section?.campaignPct)||0))/100;
  const xjob=parseFloat(section?.xjob)||0;
  const other=parseFloat(section?.otherExp)||0;
  return { empCost, appCost, insCost, otCamp, xjob, other, personnel, total:empCost+appCost+insCost+otCamp+xjob+other };
};

const calcPhase = (phase, adminConfig) => {
  const locs=adminConfig.locations||DEFAULT_LOCATIONS;
  const ip=adminConfig.projectIncomePct||30;
  const primerSal=adminConfig.costRef?.Primer?.salary?.table||{};
  const supplierSal=adminConfig.costRef?.Supplier?.salary?.table||{};
  const sharedIns=adminConfig.costRef?.Primer?.insurance?.table||{};
  const primePL=calcSection(phase?.prime, primerSal, sharedIns, ip, locs);
  const supplierPL=calcSection(phase?.supplier, supplierSal, sharedIns, ip, locs);
  const onsiteEMP=(parseFloat(phase?.onsiteCeEMP)||0)*(parseFloat(phase?.onsiteUnitSalaryEMP)||0);
  const onsiteAPP=(parseFloat(phase?.onsiteCeAPP)||0)*(parseFloat(phase?.onsiteUnitSalaryAPP)||0);
  const onsiteOther=parseFloat(phase?.onsiteOtherExp)||0;
  const onsiteTotal=onsiteEMP+onsiteAPP+onsiteOther;
  const offRev=parseFloat(phase?.offshore?.wipRevenue)||0;
  const onsRev=parseFloat(phase?.onsite?.wipRevenue)||0;
  const totalRev=offRev+onsRev;
  const totalCost=primePL.total+supplierPL.total+onsiteTotal;
  const grossProfit=totalRev-totalCost;
  const grossMargin=totalRev>0?(grossProfit/totalRev)*100:0;
  return { primePL, supplierPL, onsiteTotal, onsiteEMP, onsiteAPP, onsiteOther, offRev, onsRev, totalRev, totalCost, grossProfit, grossMargin, directMargin:grossMargin };
};

// ─── VN COST SECTION ─────────────────────────────────────────────────────────
const VNCostSection = ({label,color,sectionKey,phaseKey,data,pl,updateSection,locations,t}) => {
  const [collapsed,setCollapsed] = useState(false);
  const locs=locations||DEFAULT_LOCATIONS;
  const upd=(type,loc,pkg,val)=>{
    const field=type==="EMP"?"ceEMP":"ceAPP";
    updateSection(phaseKey,sectionKey,field,{...data[field],[loc]:{...data[field]?.[loc],[pkg]:val}});
  };
  const borderCls=color==="indigo"?"border-indigo-800":"border-purple-800";
  const bgCls=color==="indigo"?"bg-indigo-950/30":"bg-purple-950/30";
  return (
    <div className={`mb-4 rounded-xl border ${borderCls} overflow-hidden`}>
      <button onClick={()=>setCollapsed(c=>!c)} className={`w-full flex items-center justify-between px-5 py-3 text-left ${bgCls}`}>
        <span className={`text-sm font-bold ${color==="indigo"?"text-indigo-300":"text-purple-300"}`}>{label}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-medium">Total: <span className="text-white font-bold">{fmt(pl?.total)}</span></span>
          <span className="text-xs text-gray-500">{collapsed?"▼":"▲"}</span>
        </div>
      </button>
      {!collapsed&&(
        <div className="p-5 space-y-4">
          <CEMatrix label={`${t.calEffortEMP} (MM)`} ceData={data?.ceEMP} onChange={(loc,pkg,val)=>upd("EMP",loc,pkg,val)} locations={locs} t={t}/>
          <CEMatrix label={`${t.calEffortAPP} (MM)`} ceData={data?.ceAPP} onChange={(loc,pkg,val)=>upd("APP",loc,pkg,val)} locations={locs} t={t}/>
          <div className="grid grid-cols-3 gap-3 bg-gray-800/30 rounded-xl p-4">
            <AutoField label={t.hardSalaryEMP} value={fmt(pl?.empCost)} note="auto"/>
            <AutoField label={t.hardSalaryAPP} value={fmt(pl?.appCost)} note="auto"/>
            <AutoField label={t.insurance} value={fmt(pl?.insCost)} note="auto"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 mb-1 block">{t.otPct}</label><Inp type="number" value={data?.otPct} onChange={v=>updateSection(phaseKey,sectionKey,"otPct",v)} placeholder="10"/></div>
            <div><label className="text-xs text-gray-500 mb-1 block">{t.campaignPct}</label><Inp type="number" value={data?.campaignPct} onChange={v=>updateSection(phaseKey,sectionKey,"campaignPct",v)} placeholder="0"/></div>
            <AutoField label={t.otCost} value={fmt(pl?.otCamp)} note="auto"/>
            <div><label className="text-xs text-gray-500 mb-1 block">{t.xjob}</label><Inp type="number" value={data?.xjob} onChange={v=>updateSection(phaseKey,sectionKey,"xjob",v)} placeholder="0"/></div>
            <div className="col-span-2"><label className="text-xs text-gray-500 mb-1 block">{t.otherExp}</label><Inp type="number" value={data?.otherExp} onChange={v=>updateSection(phaseKey,sectionKey,"otherExp",v)} placeholder="0"/></div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── PHASE PANEL ─────────────────────────────────────────────────────────────
const PhasePanel = ({phaseKey,phaseData,pl,isForecast,planningPhaseData,actualData,updateSection,updateField,adminConfig,t}) => {
  const [tab,setTab] = useState("info");
  const locs=adminConfig.locations||DEFAULT_LOCATIONS;
  const tgt_g=adminConfig.targetGrossMargin||25;
  const tgt_d=adminConfig.targetDirectMargin||20;

  // Auto-calc forecast info fields
  const getForecastInfo = () => {
    if(!isForecast) return null;
    const planOff=parseFloat(planningPhaseData?.offshore?.billableMM)||0;
    const planOns=parseFloat(planningPhaseData?.onsite?.billableMM)||0;
    const planOffRev=parseFloat(planningPhaseData?.offshore?.wipRevenue)||0;
    const planOnsRev=parseFloat(planningPhaseData?.onsite?.wipRevenue)||0;
    // Sum actual MM from imported actual data (look for offshoreActualMM / onsiteActualMM fields)
    const actualOffMM=(actualData?.prime||[]).reduce((s,e)=>s+(parseFloat(e.rows?.find?.(r=>r["Type"]==="Offshore MM")?.[" MM"]||e.rows?.find?.(r=>r["Type"]==="OffshoreActualMM")?.["Value"])||0),0);
    const actualOnsMM=(actualData?.prime||[]).reduce((s,e)=>s+(parseFloat(e.rows?.find?.(r=>r["Type"]==="Onsite MM")?.[" MM"]||e.rows?.find?.(r=>r["Type"]==="OnsiteActualMM")?.["Value"])||0),0);
    const fcOffMM=Math.max(0,planOff-actualOffMM);
    const fcOnsMM=Math.max(0,planOns-actualOnsMM);
    const unitPriceOff=planOff>0?planOffRev/planOff:0;
    const unitPriceOns=planOns>0?planOnsRev/planOns:0;
    return {
      offBillableMM: fcOffMM.toFixed(2),
      onsBillableMM: fcOnsMM.toFixed(2),
      offRevenue: (fcOffMM*unitPriceOff).toFixed(0),
      onsRevenue: (fcOnsMM*unitPriceOns).toFixed(0),
      actualOffMM, actualOnsMM, unitPriceOff, unitPriceOns
    };
  };
  const fcInfo = isForecast ? getForecastInfo() : null;

  const tabs=[{key:"info",label:t.projectInfo},{key:"prime",label:t.costPrime},{key:"supplier",label:t.costSupplier},{key:"onsite",label:t.costOnsite},{key:"pl",label:t.plSummary}];

  return (
    <div>
      {isForecast&&(
        <div className="mb-4 px-4 py-3 bg-blue-900/20 border border-blue-800 rounded-xl text-xs text-blue-300 flex items-start gap-2">
          <span>ℹ️</span><span>{t.forecastNote}</span>
        </div>
      )}
      <div className="flex gap-1 mb-4 overflow-x-auto bg-gray-800/50 rounded-xl p-1">
        {tabs.map(tb=>(
          <button key={tb.key} onClick={()=>setTab(tb.key)}
            className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${tab===tb.key?"bg-gray-700 text-white":"text-gray-500 hover:text-gray-300"}`}>
            {tb.label}
          </button>
        ))}
      </div>

      {tab==="info"&&(
        <div className="space-y-4">
          {/* Offshore */}
          <div className="bg-gray-800/50 rounded-xl p-4">
            <p className="text-sm font-bold text-indigo-400 mb-3">🌐 {t.offshoreTeam}</p>
            <div className="grid grid-cols-2 gap-3">
              {isForecast?(
                <>
                  <AutoField label={`${t.billableMM} (remaining)`} value={fcInfo?.offBillableMM||"—"} note={t.autoCalc}/>
                  <AutoField label={t.wipRevenue} value={fmt(fcInfo?.offRevenue||0)} note={t.autoCalc}/>
                  <div className="col-span-2 text-xs text-gray-600 bg-gray-800 rounded-lg px-3 py-2">
                    Planning: {planningPhaseData?.offshore?.billableMM||0} MM · Unit price: {fmt(fcInfo?.unitPriceOff||0)} · Actual used: {fcInfo?.actualOffMM||0} MM
                  </div>
                </>
              ):(
                <>
                  <div><label className="text-xs text-gray-500 mb-1 block">{t.billableMM}</label><Inp type="number" value={phaseData?.offshore?.billableMM} onChange={v=>updateField(phaseKey,"offshore",{...phaseData?.offshore,billableMM:v})}/></div>
                  <div><label className="text-xs text-gray-500 mb-1 block">{t.wipRevenue}</label><Inp type="number" value={phaseData?.offshore?.wipRevenue} onChange={v=>updateField(phaseKey,"offshore",{...phaseData?.offshore,wipRevenue:v})}/></div>
                </>
              )}
            </div>
          </div>
          {/* Onsite */}
          <div className="bg-gray-800/50 rounded-xl p-4">
            <p className="text-sm font-bold text-purple-400 mb-3">🏢 {t.onsiteTeam}</p>
            <div className="grid grid-cols-2 gap-3">
              {isForecast?(
                <>
                  <AutoField label={`${t.billableMM} (remaining)`} value={fcInfo?.onsBillableMM||"—"} note={t.autoCalc}/>
                  <AutoField label={t.wipRevenue} value={fmt(fcInfo?.onsRevenue||0)} note={t.autoCalc}/>
                  <div className="col-span-2 text-xs text-gray-600 bg-gray-800 rounded-lg px-3 py-2">
                    Planning: {planningPhaseData?.onsite?.billableMM||0} MM · Unit price: {fmt(fcInfo?.unitPriceOns||0)} · Actual used: {fcInfo?.actualOnsMM||0} MM
                  </div>
                </>
              ):(
                <>
                  <div><label className="text-xs text-gray-500 mb-1 block">{t.billableMM}</label><Inp type="number" value={phaseData?.onsite?.billableMM} onChange={v=>updateField(phaseKey,"onsite",{...phaseData?.onsite,billableMM:v})}/></div>
                  <div><label className="text-xs text-gray-500 mb-1 block">{t.wipRevenue}</label><Inp type="number" value={phaseData?.onsite?.wipRevenue} onChange={v=>updateField(phaseKey,"onsite",{...phaseData?.onsite,wipRevenue:v})}/></div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {tab==="prime"&&(
        <VNCostSection label={`🏢 ${t.costPrime}`} color="indigo" sectionKey="prime" phaseKey={phaseKey}
          data={phaseData?.prime} pl={pl?.primePL} updateSection={updateSection} locations={locs} t={t}/>
      )}
      {tab==="supplier"&&(
        <VNCostSection label={`🤝 ${t.costSupplier}`} color="purple" sectionKey="supplier" phaseKey={phaseKey}
          data={phaseData?.supplier} pl={pl?.supplierPL} updateSection={updateSection} locations={locs} t={t}/>
      )}
      {tab==="onsite"&&(
        <div className="space-y-4">
          <p className="text-xs text-gray-500 bg-gray-800 rounded-lg px-3 py-2">💡 Costs at other OBs — unit salary from P3 report or DM estimate</p>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs text-gray-500 mb-1 block">{t.calEffortEMP} (MM)</label><Inp type="number" value={phaseData?.onsiteCeEMP} onChange={v=>updateField(phaseKey,"onsiteCeEMP",v)}/></div>
            <div><label className="text-xs text-gray-500 mb-1 block">{t.calEffortAPP} (MM)</label><Inp type="number" value={phaseData?.onsiteCeAPP} onChange={v=>updateField(phaseKey,"onsiteCeAPP",v)}/></div>
            <div><label className="text-xs text-gray-500 mb-1 block">{t.unitSalaryEMP}</label><Inp type="number" value={phaseData?.onsiteUnitSalaryEMP} onChange={v=>updateField(phaseKey,"onsiteUnitSalaryEMP",v)} placeholder="from P3 / DM"/></div>
            <div><label className="text-xs text-gray-500 mb-1 block">{t.unitSalaryAPP}</label><Inp type="number" value={phaseData?.onsiteUnitSalaryAPP} onChange={v=>updateField(phaseKey,"onsiteUnitSalaryAPP",v)} placeholder="from P3 / DM"/></div>
            <div><label className="text-xs text-gray-500 mb-1 block">{t.softSalary}</label><AutoField label="" value="—" note="TBD"/></div>
            <div><label className="text-xs text-gray-500 mb-1 block">{t.travelAllowance}</label><AutoField label="" value="—" note="TBD"/></div>
            <div className="col-span-2"><label className="text-xs text-gray-500 mb-1 block">{t.otherExp}</label><Inp type="number" value={phaseData?.onsiteOtherExp} onChange={v=>updateField(phaseKey,"onsiteOtherExp",v)} placeholder="0"/></div>
          </div>
        </div>
      )}

      {tab==="pl"&&(
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[[t.offshoreTeam,pl?.offRev,"blue"],[t.onsiteTeam,pl?.onsRev,"purple"],[t.totalRevenue,pl?.totalRev,"white"]].map(([lb,v,c])=>(
              <div key={lb} className="bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">{lb}</p>
                <p className={`text-base font-bold text-${c}-400`}>{fmt(v)}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[[t.costPrime,pl?.primePL?.total,"indigo"],[t.costSupplier,pl?.supplierPL?.total,"purple"],["Onsite",pl?.onsiteTotal,"teal"]].map(([lb,v,c])=>(
              <div key={lb} className="bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">{lb}</p>
                <p className={`text-base font-bold text-${c}-400`}>{fmt(v)}</p>
              </div>
            ))}
          </div>
          <div className="bg-gray-800 rounded-xl p-4 space-y-3">
            {[[t.totalRevenue,pl?.totalRev,"text-blue-400"],[t.totalCost,pl?.totalCost,"text-orange-400"],[t.grossProfit,pl?.grossProfit,pl?.grossProfit>=0?"text-green-400":"text-red-400"]].map(([lb,v,cls])=>(
              <div key={lb} className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-sm text-gray-400">{lb}</span>
                <span className={`font-bold ${cls}`}>{fmt(v)}</span>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {[[t.grossMargin,pl?.grossMargin,tgt_g],[t.directMargin,pl?.directMargin,tgt_d]].map(([lb,v,tgt])=>(
                <div key={lb} className="bg-gray-900 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">{lb}</p>
                  <p className={`text-2xl font-black ${mColor(v,tgt)}`}>{pct(v)}%</p>
                  <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden relative">
                    <div className={`h-full rounded-full ${mBg(v,tgt)}`} style={{width:`${Math.min(Math.max(v,0),100)}%`}}/>
                    <div className="absolute top-0 bottom-0 border-l border-white opacity-40" style={{left:`${tgt}%`}}/>
                  </div>
                  <p className={`text-xs mt-1 ${mColor(v,tgt)}`}>{v>=tgt?t.aboveTarget:`${t.belowTarget} (target ${tgt}%)`}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── SIMULATION SCREEN ────────────────────────────────────────────────────────
const SimulationScreen = ({project,version,setProjects,adminConfig,onBack,t}) => {
  const [activePhase,setActivePhase] = useState("planning");
  const d = version.data;
  const isForecastApplicable = ["monthly","adhoc"].includes(version.type);

  const updateSection = (phaseKey,sectionKey,field,val) => {
    setProjects(ps=>ps.map(p=>p.id===project.id?{...p,versions:p.versions.map(v=>v.id===version.id?
      {...v,data:{...v.data,[phaseKey]:{...v.data[phaseKey],[sectionKey]:{...v.data[phaseKey]?.[sectionKey],[field]:val}}}}:v)}:p));
  };
  const updateField = (phaseKey,field,val) => {
    setProjects(ps=>ps.map(p=>p.id===project.id?{...p,versions:p.versions.map(v=>v.id===version.id?
      {...v,data:{...v.data,[phaseKey]:{...v.data[phaseKey],[field]:val}}}:v)}:p));
  };

  const planningPL = useMemo(()=>calcPhase(d?.planning,adminConfig),[d?.planning,adminConfig]);
  const forecastPL = useMemo(()=>calcPhase(d?.forecast,adminConfig),[d?.forecast,adminConfig]);
  const activePL = activePhase==="planning"?planningPL:forecastPL;
  const tgt_g=adminConfig.targetGrossMargin||25;
  const tgt_d=adminConfig.targetDirectMargin||20;
  const simTypeLabel=key=>SIMULATION_TYPES.find(s=>s.key===key)?.[t===T.vi?"vi":"en"]||key;

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-white">← {t.back}</button>
        <div className="flex-1 min-w-0">
          <span className="text-white font-semibold">{project.code} — {project.name}</span>
          <span className="text-gray-500 text-sm ml-2">{simTypeLabel(version.type)} · {version.date}</span>
        </div>
        <div className="flex items-center gap-4">
          {[[t.grossMargin,activePL.grossMargin,tgt_g],[t.directMargin,activePL.directMargin,tgt_d]].map(([lb,v,tgt])=>(
            <div key={lb} className="text-center">
              <div className="text-xs text-gray-500">{lb}</div>
              <div className={`text-lg font-black ${mColor(v,tgt)}`}>{pct(v)}%</div>
            </div>
          ))}
        </div>
      </div>
      {/* Phase switcher */}
      <div className="bg-gray-950 px-6 pt-4 pb-0 flex gap-2">
        <button onClick={()=>setActivePhase("planning")}
          className={`px-5 py-2.5 rounded-t-xl text-sm font-semibold border-t border-l border-r transition ${activePhase==="planning"?"bg-gray-900 border-gray-800 text-white":"bg-gray-800/50 border-transparent text-gray-500 hover:text-gray-300"}`}>
          📋 {t.planningPhase}
        </button>
        {isForecastApplicable?(
          <button onClick={()=>setActivePhase("forecast")}
            className={`px-5 py-2.5 rounded-t-xl text-sm font-semibold border-t border-l border-r transition ${activePhase==="forecast"?"bg-gray-900 border-gray-800 text-white":"bg-gray-800/50 border-transparent text-gray-500 hover:text-gray-300"}`}>
            🔭 {t.forecastPhase}
          </button>
        ):(
          <button disabled className="px-5 py-2.5 rounded-t-xl text-sm font-semibold border-t border-l border-r border-transparent text-gray-700 cursor-not-allowed">
            🔭 {t.forecastPhase} <span className="text-xs">(Monthly/Adhoc only)</span>
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto bg-gray-900 border-t border-gray-800">
        <div className="p-5 max-w-5xl mx-auto">
          <PhasePanel
            phaseKey={activePhase}
            phaseData={d?.[activePhase]}
            pl={activePL}
            isForecast={activePhase==="forecast"}
            planningPhaseData={d?.planning}
            actualData={project.actualData}
            updateSection={updateSection}
            updateField={updateField}
            adminConfig={adminConfig}
            t={t}
          />
        </div>
      </div>
    </div>
  );
};

// ─── ACTUAL DATA ──────────────────────────────────────────────────────────────
const ActualDataScreen = ({project,setProjects,t}) => {
  const [activeTab,setActiveTab] = useState("prime");
  const [toast,setToast] = useState(null);
  const fileRef = useRef();
  const showToast=(msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),3000); };
  const handleImport=(e)=>{
    const file=e.target.files?.[0]; if(!file)return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      try {
        const lines=ev.target.result.trim().split(/\r?\n/).filter(l=>l.trim());
        if(lines.length<2)throw new Error("No data rows");
        const headers=lines[0].split(",").map(h=>h.trim());
        const rows=[];
        for(let i=1;i<lines.length;i++){
          const cols=lines[i].split(",").map(c=>c.trim());
          const row={}; headers.forEach((h,idx)=>{ row[h]=cols[idx]||""; }); rows.push(row);
        }
        const month=rows[0]?.["Month"]||today().substring(0,7);
        const entry={ id:uid(), month, importedAt:today(), rows, fileName:file.name };
        setProjects(ps=>ps.map(p=>p.id===project.id?{...p,actualData:{...p.actualData,[activeTab]:[...(p.actualData?.[activeTab]||[]),entry]}}:p));
        showToast(`${t.importSuccess} ${rows.length} rows`);
      } catch(err){ showToast(`${t.importError} ${err.message}`,"error"); }
      e.target.value="";
    };
    reader.readAsText(file);
  };
  const entries=project.actualData?.[activeTab]||[];
  return (
    <div className="p-6">
      {toast&&<Toast msg={toast.msg} type={toast.type}/>}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-white">{t.actualData}</h3>
        <button onClick={()=>fileRef.current?.click()} className="px-4 py-2 bg-teal-700 hover:bg-teal-600 rounded-lg text-sm font-medium">📤 {t.importActual}</button>
        <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleImport}/>
      </div>
      <div className="flex gap-1 mb-5 bg-gray-800 rounded-lg p-1 w-fit">
        {[{key:"prime",label:`🏢 ${t.actualPrime}`},{key:"supplier",label:`🤝 ${t.actualSupplier}`}].map(tb=>(
          <button key={tb.key} onClick={()=>setActiveTab(tb.key)}
            className={`px-4 py-2 rounded text-sm font-medium transition ${activeTab===tb.key?"bg-gray-700 text-white":"text-gray-500 hover:text-gray-300"}`}>
            {tb.label}{(project.actualData?.[tb.key]?.length||0)>0&&<span className="ml-1 text-xs text-green-400">✓ {project.actualData[tb.key].length}</span>}
          </button>
        ))}
      </div>
      {entries.length===0?(<div className="text-center py-12 text-gray-600"><div className="text-4xl mb-3">📊</div><p>{t.noData}</p><p className="text-xs mt-2 text-gray-700">Import CSV from your source system</p></div>):(
        <div className="space-y-3">
          {entries.map(entry=>(
            <div key={entry.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1"><Badge label={entry.month} color="teal"/><span className="text-xs text-gray-500">{entry.importedAt}</span><span className="text-xs text-gray-600">{entry.fileName}</span></div>
                <p className="text-xs text-gray-500">{entry.rows?.length||0} rows</p>
              </div>
              <button onClick={()=>setProjects(ps=>ps.map(p=>p.id===project.id?{...p,actualData:{...p.actualData,[activeTab]:p.actualData[activeTab].filter(e=>e.id!==entry.id)}}:p))}
                className="text-xs px-3 py-1 bg-red-900 hover:bg-red-800 rounded-lg text-red-300">{t.del}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── PROJECT DETAIL ───────────────────────────────────────────────────────────
const ProjectDetailScreen = ({project,setProjects,onOpenSim,onBack,t,adminConfig}) => {
  const [showAdd,setShowAdd] = useState(false);
  const [newVer,setNewVer] = useState(defaultVersion());
  const [section,setSection] = useState("simulations");
  const simTypeLabel=key=>SIMULATION_TYPES.find(s=>s.key===key)?.[t===T.vi?"vi":"en"]||key;
  const addVersion=()=>{
    const locs=adminConfig.locations||DEFAULT_LOCATIONS;
    setProjects(ps=>ps.map(p=>p.id===project.id?{...p,versions:[...p.versions,{...newVer,id:uid(),data:defaultSimData(locs)}]}:p));
    setShowAdd(false); setNewVer(defaultVersion());
  };
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 bg-gray-900 border-b border-gray-800">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-white mb-2 flex items-center gap-1">← {t.back}</button>
        <div className="flex items-center justify-between mb-3">
          <div><h2 className="text-xl font-bold text-white">{project.name}</h2><p className="text-sm text-gray-500">{project.code} · {project.startDate} → {project.endDate} · {project.currency}</p></div>
        </div>
        <div className="flex gap-1">
          {[{key:"simulations",label:`📋 ${t.simVersions}`},{key:"actual",label:`📊 ${t.actualData}`}].map(s=>(
            <button key={s.key} onClick={()=>setSection(s.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${section===s.key?"bg-gray-800 text-white":"text-gray-500 hover:text-gray-300"}`}>{s.label}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {section==="simulations"&&(
          <div className="p-6">
            <div className="flex justify-end mb-4"><button onClick={()=>setShowAdd(true)} className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 rounded-lg text-sm font-medium">+ {t.addVersion}</button></div>
            {showAdd&&(
              <Card title={t.addVersion} className="mb-5">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div><label className="text-xs text-gray-500 mb-1 block">{t.versionType}</label><Sel value={newVer.type} onChange={v=>setNewVer(x=>({...x,type:v}))} options={SIMULATION_TYPES.map(s=>({value:s.key,label:simTypeLabel(s.key)}))}/></div>
                  <div><label className="text-xs text-gray-500 mb-1 block">{t.versionDate}</label><Inp type="date" value={newVer.date} onChange={v=>setNewVer(x=>({...x,date:v}))}/></div>
                  <div><label className="text-xs text-gray-500 mb-1 block">{t.createdBy}</label><Inp value={newVer.createdBy} onChange={v=>setNewVer(x=>({...x,createdBy:v}))}/></div>
                  <div className="col-span-3"><label className="text-xs text-gray-500 mb-1 block">{t.versionNote}</label><Inp value={newVer.note} onChange={v=>setNewVer(x=>({...x,note:v}))}/></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={addVersion} className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-sm">{t.save}</button>
                  <button onClick={()=>setShowAdd(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">{t.cancel}</button>
                </div>
              </Card>
            )}
            {project.versions.length===0&&<div className="text-center py-12 text-gray-600"><div className="text-4xl mb-2">📋</div><p>{t.noData}</p></div>}
            <div className="space-y-3">
              {project.versions.map((ver,idx)=>{
                const tc={bidding:"yellow",planning:"indigo",monthly:"green",adhoc:"gray"};
                return (
                  <div key={ver.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between hover:border-indigo-700 transition">
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-600 w-6">v{idx+1}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge label={simTypeLabel(ver.type)} color={tc[ver.type]||"gray"}/>
                          {["monthly","adhoc"].includes(ver.type)&&<Badge label="+ Forecast" color="teal"/>}
                          <span className="text-sm text-gray-400">{ver.date}</span>
                          <span className="text-xs text-gray-600">by {ver.createdBy}</span>
                        </div>
                        {ver.note&&<p className="text-xs text-gray-500">{ver.note}</p>}
                      </div>
                    </div>
                    <button onClick={()=>onOpenSim(project.id,ver.id)} className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 rounded-lg text-sm">{t.openSim}</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {section==="actual"&&<ActualDataScreen project={project} setProjects={setProjects} t={t}/>}
      </div>
    </div>
  );
};

// ─── PROJECT LIST ─────────────────────────────────────────────────────────────
const ProjectListScreen = ({projects,setProjects,onOpenProject,t}) => {
  const [showAdd,setShowAdd] = useState(false);
  const [np,setNp] = useState(defaultProject());
  const sC=s=>s==="active"?"green":s==="completed"?"indigo":"yellow";
  const sL=s=>({active:t.active,completed:t.completed,onHold:t.onHold}[s]||s);
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">{t.projectList}</h2>
        <button onClick={()=>setShowAdd(true)} className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 rounded-lg text-sm font-medium">+ {t.addProject}</button>
      </div>
      {showAdd&&(
        <Card title={t.addProject} className="mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className="text-xs text-gray-500 mb-1 block">{t.projectCode}</label><Inp value={np.code} onChange={v=>setNp(p=>({...p,code:v}))}/></div>
            <div><label className="text-xs text-gray-500 mb-1 block">{t.projectName}</label><Inp value={np.name} onChange={v=>setNp(p=>({...p,name:v}))}/></div>
            <div><label className="text-xs text-gray-500 mb-1 block">{t.startDate}</label><Inp type="date" value={np.startDate} onChange={v=>setNp(p=>({...p,startDate:v}))}/></div>
            <div><label className="text-xs text-gray-500 mb-1 block">{t.endDate}</label><Inp type="date" value={np.endDate} onChange={v=>setNp(p=>({...p,endDate:v}))}/></div>
            <div><label className="text-xs text-gray-500 mb-1 block">{t.currency}</label><Sel value={np.currency} onChange={v=>setNp(p=>({...p,currency:v}))} options={CURRENCIES}/></div>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>{setProjects(ps=>[...ps,{...np,id:uid()}]);setShowAdd(false);setNp(defaultProject());}} className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-sm">{t.save}</button>
            <button onClick={()=>setShowAdd(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">{t.cancel}</button>
          </div>
        </Card>
      )}
      {projects.length===0?(<div className="text-center py-16 text-gray-600"><div className="text-5xl mb-3">📂</div><p>{t.noData}</p></div>):(
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-800">
              {[t.projectCode,t.projectName,t.startDate,t.endDate,t.currency,t.simVersions,t.status,t.actions].map(h=>(
                <th key={h} className="text-left py-3 px-3 text-gray-500 font-medium">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {projects.map(proj=>(
                <tr key={proj.id} className="border-b border-gray-800/50 hover:bg-gray-900/50 cursor-pointer" onClick={()=>onOpenProject(proj.id)}>
                  <td className="py-3 px-3 text-indigo-400 font-medium">{proj.code||"—"}</td>
                  <td className="py-3 px-3 text-white">{proj.name||"—"}</td>
                  <td className="py-3 px-3 text-gray-400">{proj.startDate||"—"}</td>
                  <td className="py-3 px-3 text-gray-400">{proj.endDate||"—"}</td>
                  <td className="py-3 px-3 text-gray-400">{proj.currency}</td>
                  <td className="py-3 px-3"><Badge label={`${proj.versions.length} v`} color="indigo"/></td>
                  <td className="py-3 px-3"><Badge label={sL(proj.status)} color={sC(proj.status)}/></td>
                  <td className="py-3 px-3 flex gap-1">
                    <button onClick={e=>{e.stopPropagation();onOpenProject(proj.id);}} className="text-xs px-3 py-1 bg-indigo-700 hover:bg-indigo-600 rounded-lg">{t.view}</button>
                    <button onClick={e=>{e.stopPropagation();setProjects(ps=>ps.filter(p=>p.id!==proj.id));}} className="text-xs px-2 py-1 bg-red-900 hover:bg-red-800 rounded-lg text-red-300">{t.del}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── ADMIN ────────────────────────────────────────────────────────────────────
const AdminScreen = ({config,setConfig,t,lang}) => {
  const [tab,setTab] = useState("target");
  const tabs=[{key:"target",icon:"🎯",label:t.targetSettings},{key:"roles",icon:"👤",label:t.rolesConfig},{key:"contracts",icon:"📄",label:t.contractConfig},{key:"locations",icon:"📍",label:t.locationConfig},{key:"costref",icon:"💰",label:t.costRefConfig},{key:"income",icon:"🎁",label:t.projectIncomeConfig}];
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-xl font-bold text-white mb-6">{t.adminTitle}</h2>
      <div className="flex gap-1 mb-6 bg-gray-900 rounded-xl p-1 overflow-x-auto border border-gray-800">
        {tabs.map(tb=>(
          <button key={tb.key} onClick={()=>setTab(tb.key)}
            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition flex items-center gap-1.5 ${tab===tb.key?"bg-gray-700 text-white":"text-gray-500 hover:text-gray-300"}`}>
            {tb.icon} {tb.label}
          </button>
        ))}
      </div>
      {tab==="target"&&(
        <Card title={t.targetSettings}>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-800/50 rounded-xl p-4">
              <label className="text-xs text-gray-500 mb-1 block">{t.targetGrossMargin}</label>
              <Inp type="number" value={config.targetGrossMargin} onChange={v=>setConfig(c=>({...c,targetGrossMargin:parseFloat(v)||0}))}/>
              <p className="text-xs text-gray-600 mt-2">Revenue – Total Cost / Revenue</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4">
              <label className="text-xs text-gray-500 mb-1 block">{t.targetDirectMargin}</label>
              <Inp type="number" value={config.targetDirectMargin} onChange={v=>setConfig(c=>({...c,targetDirectMargin:parseFloat(v)||0}))}/>
              <p className="text-xs text-gray-600 mt-2">Gross Profit – Direct Costs / Revenue</p>
            </div>
          </div>
        </Card>
      )}
      {tab==="roles"&&(
        <Card title={t.rolesConfig}>
          <div className="space-y-2 mb-4">{config.roles.map((r,i)=>(
            <div key={i} className="flex gap-2"><Inp value={r} onChange={v=>setConfig(c=>({...c,roles:c.roles.map((x,j)=>j===i?v:x)}))}/><button onClick={()=>setConfig(c=>({...c,roles:c.roles.filter((_,j)=>j!==i)}))} className="text-gray-600 hover:text-red-400 px-2">✕</button></div>
          ))}</div>
          <button onClick={()=>setConfig(c=>({...c,roles:[...c.roles,""]}))} className="text-sm px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 rounded-lg">+ {t.addRole}</button>
        </Card>
      )}
      {tab==="contracts"&&(
        <Card title={t.contractConfig}>
          <div className="space-y-2 mb-4">{config.contractTypes.map((ct,i)=>(
            <div key={i} className="flex gap-2"><Inp value={ct} onChange={v=>setConfig(c=>({...c,contractTypes:c.contractTypes.map((x,j)=>j===i?v:x)}))}/><button onClick={()=>setConfig(c=>({...c,contractTypes:c.contractTypes.filter((_,j)=>j!==i)}))} className="text-gray-600 hover:text-red-400 px-2">✕</button></div>
          ))}</div>
          <button onClick={()=>setConfig(c=>({...c,contractTypes:[...c.contractTypes,""]}))} className="text-sm px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 rounded-lg">+ {t.addContract}</button>
        </Card>
      )}
      {tab==="locations"&&(
        <Card title={t.locationConfig}>
          <p className="text-xs text-yellow-400 bg-yellow-900/20 rounded-lg px-3 py-2 mb-4">⚠️ Thay đổi location sẽ ảnh hưởng đến bảng chi phí tham chiếu và CE Matrix.</p>
          <div className="space-y-2 mb-4">{config.locations.map((loc,i)=>(
            <div key={i} className="grid grid-cols-3 gap-2 items-center">
              <Inp value={loc.code} onChange={v=>setConfig(c=>({...c,locations:c.locations.map((l,j)=>j===i?{...l,code:v}:l)}))} placeholder="Code"/>
              <Inp value={loc.name[lang]||loc.name.vi} onChange={v=>setConfig(c=>({...c,locations:c.locations.map((l,j)=>j===i?{...l,name:{...l.name,[lang]:v}}:l)}))} placeholder="Name"/>
              <button onClick={()=>setConfig(c=>({...c,locations:c.locations.filter((_,j)=>j!==i)}))} className="text-gray-600 hover:text-red-400 text-sm">✕ Remove</button>
            </div>
          ))}</div>
          <button onClick={()=>setConfig(c=>({...c,locations:[...c.locations,{code:"",name:{vi:"",en:""},active:true}]}))} className="text-sm px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 rounded-lg">+ {t.addLocation}</button>
        </Card>
      )}
      {tab==="costref"&&<Card title={t.costRefConfig}><CostRefTable config={config} setConfig={setConfig} t={t} lang={lang}/></Card>}
      {tab==="income"&&(
        <Card title={t.projectIncomeConfig}>
          <div className="max-w-sm">
            <label className="text-xs text-gray-500 mb-1 block">{t.projectIncomePct}</label>
            <div className="flex items-center gap-3"><Inp type="number" value={config.projectIncomePct} onChange={v=>setConfig(c=>({...c,projectIncomePct:parseFloat(v)||0}))} className="w-32"/><span className="text-gray-400 text-sm">%</span></div>
            <div className="mt-4 p-4 bg-gray-800 rounded-xl text-xs text-gray-400 space-y-2">
              <p className="font-medium text-gray-300">📐 {t.projectIncomeNote}</p>
              <p className="font-mono bg-gray-900 rounded p-2 text-green-300">EMP Cost = (1 + 8% + {config.projectIncomePct||30}%) × SUMPRODUCT<br/>= {(1+0.08+(config.projectIncomePct||30)/100).toFixed(2)} × SUMPRODUCT</p>
              <p className="text-gray-600">APP/POI Cost = 1.0 × SUMPRODUCT (no multiplier)</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [lang,setLang] = useState("vi");
  const t = T[lang];
  const [screen,setScreen] = useState("projects");
  const [projects,setProjects] = useState([]);
  const [adminConfig,setAdminConfig] = useState(defaultAdmin());
  const [activeProjId,setActiveProjId] = useState(null);
  const [activeVerId,setActiveVerId] = useState(null);
  const activeProject = projects.find(p=>p.id===activeProjId);
  const activeVersion = activeProject?.versions.find(v=>v.id===activeVerId);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col" style={{fontFamily:"system-ui,sans-serif"}}>
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-base font-bold text-white">📊 {t.appTitle}</h1>
          <div className="flex gap-1">
            {[{key:"projects",icon:"📂",label:t.projects},{key:"admin",icon:"⚙️",label:t.admin}].map(item=>(
              <button key={item.key} onClick={()=>setScreen(item.key)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition ${(screen===item.key||(item.key==="projects"&&["project-detail","simulation"].includes(screen)))?"bg-gray-800 text-white":"text-gray-500 hover:text-gray-300"}`}>
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
          {["vi","en"].map(l=>(
            <button key={l} onClick={()=>setLang(l)}
              className={`px-3 py-1 rounded text-sm font-medium transition ${lang===l?"bg-indigo-600 text-white":"text-gray-500 hover:text-gray-300"}`}>
              {l==="vi"?"🇻🇳 VI":"🇬🇧 EN"}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {screen==="projects"&&<ProjectListScreen projects={projects} setProjects={setProjects} onOpenProject={id=>{setActiveProjId(id);setScreen("project-detail");}} t={t}/>}
        {screen==="project-detail"&&activeProject&&<ProjectDetailScreen project={activeProject} setProjects={setProjects} onOpenSim={(pid,vid)=>{setActiveProjId(pid);setActiveVerId(vid);setScreen("simulation");}} onBack={()=>setScreen("projects")} t={t} adminConfig={adminConfig}/>}
        {screen==="simulation"&&activeProject&&activeVersion&&<SimulationScreen project={activeProject} version={activeVersion} setProjects={setProjects} adminConfig={adminConfig} onBack={()=>setScreen("project-detail")} t={t}/>}
        {screen==="admin"&&<AdminScreen config={adminConfig} setConfig={setAdminConfig} t={t} lang={lang}/>}
      </div>
    </div>
  );
}
