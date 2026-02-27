// @ts-nocheck
import { useState, useMemo, useRef } from "react";

const PACKAGES = ["P1","P2","P3","P4","P5","P6","P7","P8","P9"];
const CURRENCIES = ["USD","VND","JPY","EUR","SGD"];
const SIM_TYPES = [
  {key:"bidding",vi:"Bidding",en:"Bidding"},
  {key:"planning",vi:"Project Planning",en:"Project Planning"},
  {key:"monthly",vi:"Cập nhật tháng",en:"Monthly Update"},
  {key:"adhoc",vi:"Adhoc",en:"Adhoc"},
];
const DEFAULT_LOCS = [
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

const PRIMER_SAL={HN:[236,409,562,802,1187,1611,2094,2546,3340],HL:[236,409,562,802,1187,1611,2094,2546,3340],DN:[236,389,534,762,1128,1532,1988,2420,3340],HCM:[236,428,589,841,1246,1694,2200,2672,3340],CT:[236,428,589,841,1246,1694,2200,2672,3340],QNH:[236,389,534,762,1128,1532,1988,2420,3340],HUE:[236,389,534,762,1128,1532,1988,2420,3340],NT:[236,389,534,762,1128,1532,1988,2420,3340]};
const SUPPLIER_SAL={HN:[236,409,562,802,1187,1611,2094,2546,3340],HL:[236,409,562,802,1187,1611,2094,2546,3340],DN:[236,389,534,762,1128,1532,1988,2420,3340],HCM:[236,428,589,841,1246,1694,2200,2672,3340],CT:[236,428,589,841,1246,1694,2200,2672,3340],QNH:[236,389,534,762,1128,1532,1988,2420,3340],HUE:[236,389,534,762,1128,1532,1988,2420,3340],NT:[236,389,534,762,1128,1532,1988,2420,3340]};
const SHARED_INS={HN:[51,51,51,54,54,63,63,63,189],HL:[51,51,51,54,54,63,63,63,189],DN:[51,51,51,54,54,63,63,63,189],HCM:[51,51,51,54,54,63,63,63,189],CT:[51,51,51,54,54,63,63,63,189],QNH:[46,46,46,49,49,58,58,58,189],HUE:[51,51,51,54,54,63,63,63,189],NT:[51,51,51,54,54,63,63,63,189]};

const buildTable=(seed)=>{const t={};DEFAULT_LOCS.forEach(l=>{t[l.code]={};PACKAGES.forEach((p,i)=>{t[l.code][p]=seed[l.code]?.[i]?.toString()||"";});});return t;};

// ── I18N ──
const T={
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
    actualCostLabel:"Chi phí Actual đã phát sinh",
    forecastCostLabel:"Chi phí Forecast remaining",
    totalProjectCost:"Tổng chi phí dự kiến (Actual + Forecast)",
    actualRevLabel:"Doanh thu Actual đã ghi nhận",
    forecastRevLabel:"Doanh thu Forecast remaining",
    totalProjectRev:"Tổng doanh thu dự kiến (Actual + Forecast)",
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
    actualCostLabel:"Actual cost incurred",
    forecastCostLabel:"Forecast remaining cost",
    totalProjectCost:"Total projected cost (Actual + Forecast)",
    actualRevLabel:"Actual revenue recognized",
    forecastRevLabel:"Forecast remaining revenue",
    totalProjectRev:"Total projected revenue (Actual + Forecast)",
  }
};

// ── HELPERS ──
const fmt=n=>new Intl.NumberFormat("en-US").format(Math.round(n||0));
const fmtN=n=>{if(!n&&n!==0)return"";const v=Number(n);if(v>=1000000)return(v/1000000).toFixed(1)+"M";if(v>=1000)return(v/1000).toFixed(0)+"K";return v.toString();};
const pct=n=>(isNaN(n)||!isFinite(n)?"0.0":Number(n).toFixed(1));
const uid=()=>Date.now()+Math.random();
const today=()=>new Date().toISOString().split("T")[0];
const mColor=(m,tgt)=>m>=tgt?"text-green-400":m>=tgt*0.8?"text-yellow-400":"text-red-400";
const mBg=(m,tgt)=>m>=tgt?"bg-green-500":m>=tgt*0.8?"bg-yellow-500":"bg-red-500";

const defAdmin=()=>({
  targetGrossMargin:25,targetDirectMargin:20,
  roles:[...DEFAULT_ROLES],contractTypes:[...DEFAULT_CONTRACTS],
  locations:DEFAULT_LOCS.map(l=>({...l,active:true})),
  costRef:{Primer:{salary:{table:buildTable(PRIMER_SAL),unit:"USD",lastUpdated:""},insurance:{table:buildTable(SHARED_INS),unit:"USD",lastUpdated:""}},Supplier:{salary:{table:buildTable(SUPPLIER_SAL),unit:"USD",lastUpdated:""}}},
  projectIncomePct:30,
  otherCostCats:[...DEFAULT_OTHER_COST_CATS],
});

// ── UI ATOMS ──
const Card=({title,children,className=""})=>(<div className={`bg-gray-900 border border-gray-800 rounded-2xl p-5 ${className}`}>{title&&<h3 className="text-sm font-bold text-gray-300 mb-4">{title}</h3>}{children}</div>);
const Badge=({label,color="gray"})=>{const c={indigo:"bg-indigo-900/50 text-indigo-300 border-indigo-700",green:"bg-green-900/50 text-green-300 border-green-700",yellow:"bg-yellow-900/50 text-yellow-300 border-yellow-700",red:"bg-red-900/50 text-red-300 border-red-700",gray:"bg-gray-800 text-gray-400 border-gray-700",blue:"bg-blue-900/50 text-blue-300 border-blue-700",purple:"bg-purple-900/50 text-purple-300 border-purple-700"};return<span className={`text-xs px-2 py-0.5 rounded-full border ${c[color]||c.gray}`}>{label}</span>;};
const Inp=({value,onChange,type="text",placeholder="",className="",...rest})=>(<input type={type} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white ${className}`} {...rest}/>);
const AutoField=({label,value,note})=>(<div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50"><p className="text-xs text-gray-500 mb-1">{label}</p><p className="text-sm font-semibold text-indigo-300">{value}</p>{note&&<p className="text-xs text-gray-600 mt-0.5">{note}</p>}</div>);
const SummaryRow=({label,value,bold,highlight})=>(<div className={`flex justify-between py-2 ${bold?"font-bold":""}`}><span className={`text-xs ${bold?"text-gray-200":"text-gray-500"}`}>{label}</span><span className={`text-xs ${highlight?"text-indigo-400":bold?"text-white":"text-gray-300"}`}>{fmt(value)}</span></div>);
const MarginCard=({label,value,target,t})=>{const g=value>=target;return(<div className={`rounded-xl p-4 border ${g?"border-green-800 bg-green-950/20":"border-red-800 bg-red-950/20"}`}><p className="text-xs text-gray-500 mb-1">{label}</p><p className={`text-2xl font-black ${mColor(value,target)}`}>{pct(value)}%</p><div className="mt-2 w-full bg-gray-800 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${mBg(value,target)}`} style={{width:`${Math.min(100,(value/target)*100)}%`}}/></div><p className={`text-xs mt-1 ${g?"text-green-400":"text-red-400"}`}>{g?`✓ ${t.aboveTarget}`:`✗ ${t.belowTarget}`} (target: {target}%)</p></div>);};

// ── CE MATRIX ──
const CEMatrix=({label,ceData,onChange,locations,t})=>{
  const locs=locations||DEFAULT_LOCS;
  const [collapsed,setCollapsed]=useState(true);
  const totByLoc=lc=>PACKAGES.reduce((s,p)=>s+(parseFloat(ceData?.[lc]?.[p])||0),0).toFixed(1);
  const totByPkg=p=>locs.reduce((s,l)=>s+(parseFloat(ceData?.[l.code]?.[p])||0),0).toFixed(1);
  const grand=locs.reduce((s,l)=>s+PACKAGES.reduce((ss,p)=>ss+(parseFloat(ceData?.[l.code]?.[p])||0),0),0).toFixed(1);
  return(
    <div className="space-y-2">
      <button onClick={()=>setCollapsed(!collapsed)} className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white w-full">
        <span>{collapsed?"▶":"▼"}</span><span>{label}</span><span className="ml-auto text-indigo-400">Total: {grand} MM</span>
      </button>
      {!collapsed&&(
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-xs">
            <thead><tr className="bg-gray-800 border-b border-gray-700">
              <th className="text-left py-2 px-3 text-gray-500 sticky left-0 bg-gray-800 min-w-20">{t.location}</th>
              {PACKAGES.map(p=><th key={p} className="py-2 px-1 text-center text-gray-500 min-w-16">{p}</th>)}
              <th className="py-2 px-2 text-center text-gray-400">{t.total}</th>
            </tr></thead>
            <tbody>
              {locs.map(loc=>(
                <tr key={loc.code} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="py-1 px-3 text-gray-300 sticky left-0 bg-gray-900 font-medium">{loc.code}</td>
                  {PACKAGES.map(p=>(
                    <td key={p} className="py-1 px-1">
                      <input type="number" value={ceData?.[loc.code]?.[p]||""} onChange={e=>onChange(loc.code,p,e.target.value)} placeholder="0" min="0" step="0.1"
                        className="w-full bg-gray-800 border border-gray-700 rounded px-1 py-1 text-center text-xs focus:outline-none focus:border-indigo-500 text-white"/>
                    </td>
                  ))}
                  <td className="py-1 px-2 text-center text-indigo-400 font-semibold">{totByLoc(loc.code)||"—"}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-700 bg-gray-800/40">
                <td className="py-2 px-3 text-gray-400 font-semibold sticky left-0 bg-gray-800/40">{t.total}</td>
                {PACKAGES.map(p=><td key={p} className="py-2 text-center text-gray-400">{totByPkg(p)||"—"}</td>)}
                <td className="py-2 px-2 text-center text-white font-bold">{grand||"—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── OTHER COSTS TABLE ──
const OtherCostsTab=({items,onChange,cats,t})=>{
  const addItem=()=>onChange([...items,{id:uid(),category:cats[0]||"",unitPrice:"",qty:"",months:"",note:""}]);
  const updItem=(id,field,val)=>onChange(items.map(it=>it.id===id?{...it,[field]:val}:it));
  const delItem=(id)=>onChange(items.filter(it=>it.id!==id));
  const total=items.reduce((s,it)=>s+(parseFloat(it.unitPrice)||0)*(parseFloat(it.qty)||0)*(parseFloat(it.months)||0),0);
  return(
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
            {items.length===0&&(<tr><td colSpan={7} className="text-center py-6 text-gray-600">{t.noData}</td></tr>)}
            {items.map(it=>{const amt=(parseFloat(it.unitPrice)||0)*(parseFloat(it.qty)||0)*(parseFloat(it.months)||0);return(
              <tr key={it.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="py-2 px-3"><select value={it.category} onChange={e=>updItem(it.id,"category",e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white">{cats.map(c=><option key={c} value={c}>{c}</option>)}</select></td>
                <td className="py-2 px-3"><input type="number" value={it.unitPrice} onChange={e=>updItem(it.id,"unitPrice",e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-right text-white" placeholder="0"/></td>
                <td className="py-2 px-3"><input type="number" value={it.qty} onChange={e=>updItem(it.id,"qty",e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-right text-white" placeholder="0"/></td>
                <td className="py-2 px-3"><input type="number" value={it.months} onChange={e=>updItem(it.id,"months",e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-right text-white" placeholder="0"/></td>
                <td className="py-2 px-3 text-right text-indigo-300 font-medium">{fmt(amt)}</td>
                <td className="py-2 px-3"><input value={it.note||""} onChange={e=>updItem(it.id,"note",e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white" placeholder="..."/></td>
                <td className="py-2 px-2"><button onClick={()=>delItem(it.id)} className="text-gray-600 hover:text-red-400">✕</button></td>
              </tr>
            );})}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center">
        <button onClick={addItem} className="text-sm px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 rounded-lg">+ {t.addItem}</button>
        <div className="text-sm text-gray-400">{t.total}: <span className="text-white font-bold">{fmt(total)}</span></div>
      </div>
    </div>
  );
};

// ── CALCULATIONS ──
const calcSection=(sec,salTable,insTable,ip,locs)=>{
  let sEMP=0,sAPP=0,sIns=0;
  (locs||DEFAULT_LOCS).forEach(loc=>{PACKAGES.forEach(p=>{
    const cE=parseFloat(sec?.ceEMP?.[loc.code]?.[p])||0;
    const cA=parseFloat(sec?.ceAPP?.[loc.code]?.[p])||0;
    const sal=parseFloat(salTable?.[loc.code]?.[p])||0;
    const ins=parseFloat(insTable?.[loc.code]?.[p])||0;
    sEMP+=cE*sal;sAPP+=cA*sal;sIns+=cE*ins;
  });});
  const empCost=(1+0.08+(ip/100))*sEMP;
  const appCost=sAPP;const insCost=sIns;
  const personnel=empCost+appCost;
  const otCamp=personnel*(parseFloat(sec?.otCampaignPct)||0)/100;
  const xjob=parseFloat(sec?.xjob)||0;
  const other=parseFloat(sec?.otherExp)||0;
  const total=empCost+appCost+insCost+otCamp+xjob+other;
  return{empCost,appCost,insCost,otCamp,xjob,other,personnel,total};
};

const calcOtherCosts=(items)=>items.reduce((s,it)=>s+(parseFloat(it.unitPrice)||0)*(parseFloat(it.qty)||0)*(parseFloat(it.months)||0),0);

const calcPhase=(phase,admin)=>{
  const locs=admin.locations||DEFAULT_LOCS;const ip=admin.projectIncomePct||30;
  const pSal=admin.costRef?.Primer?.salary?.table||{};
  const sSal=admin.costRef?.Supplier?.salary?.table||{};
  const ins=admin.costRef?.Primer?.insurance?.table||{};
  const primePL=calcSection(phase?.prime,pSal,ins,ip,locs);
  const supplierPL=calcSection(phase?.supplier,sSal,ins,ip,locs);
  const oEMP=(parseFloat(phase?.onsiteCeEMP)||0)*(parseFloat(phase?.onsiteUnitSalEMP)||0);
  const oAPP=(parseFloat(phase?.onsiteCeAPP)||0)*(parseFloat(phase?.onsiteUnitSalAPP)||0);
  const oOther=parseFloat(phase?.onsiteOtherExp)||0;
  const onsiteTotal=oEMP+oAPP+oOther;
  const otherCostsTotal=calcOtherCosts(phase?.otherCosts||[]);
  const offRev=parseFloat(phase?.offshore?.wipRevenue)||0;
  const onsRev=parseFloat(phase?.onsite?.wipRevenue)||0;
  const totalRev=offRev+onsRev;
  const totalCost=primePL.total+supplierPL.total+onsiteTotal+otherCostsTotal;
  const grossProfit=totalRev-totalCost;
  const grossMargin=totalRev>0?(grossProfit/totalRev)*100:0;
  return{primePL,supplierPL,onsiteTotal,oEMP,oAPP,oOther,otherCostsTotal,offRev,onsRev,totalRev,totalCost,grossProfit,grossMargin,directMargin:grossMargin};
};

// ── ACTUAL COST CALC ──
const calcActualCosts=(actualData)=>{
  if(!actualData)return{totalActualCost:0,totalActualRevenue:0,actualPrimeCost:0,actualSupplierCost:0,actualOnsiteCost:0,actualOtherCost:0};
  let actualPrimeCost=0,actualSupplierCost=0,actualOnsiteCost=0,actualOtherCost=0;
  let actualOffRev=0,actualOnsRev=0;
  (actualData.prime||[]).forEach(e=>{
    actualPrimeCost+=parseFloat(e.actualCost)||0;
    actualOffRev+=parseFloat(e.actualOffshoreRevenue)||0;
    actualOnsRev+=parseFloat(e.actualOnsiteRevenue)||0;
    actualOnsiteCost+=parseFloat(e.actualOnsiteCost)||0;
  });
  (actualData.supplier||[]).forEach(e=>{
    actualSupplierCost+=parseFloat(e.actualCost)||0;
  });
  actualOtherCost=parseFloat(actualData.otherActualCost)||0;
  const totalActualCost=actualPrimeCost+actualSupplierCost+actualOnsiteCost+actualOtherCost;
  const totalActualRevenue=actualOffRev+actualOnsRev;
  return{totalActualCost,totalActualRevenue,actualPrimeCost,actualSupplierCost,actualOnsiteCost,actualOtherCost,actualOffRev,actualOnsRev};
};

// ── VN COST SECTION ──
const VNCostSection=({label,color,sk,phaseKey,data,pl,updSec,locations,t})=>{
  const locs=locations||DEFAULT_LOCS;
  const upd=(type,loc,pkg,val)=>{const f=type==="EMP"?"ceEMP":"ceAPP";updSec(phaseKey,sk,f,{...data[f],[loc]:{...data[f]?.[loc],[pkg]:val}});};
  const bdr=color==="indigo"?"border-indigo-800":"border-purple-800";
  const bg=color==="indigo"?"bg-indigo-950/30":"bg-purple-950/30";
  const tc=color==="indigo"?"text-indigo-300":"text-purple-300";
  return(
    <div className={`rounded-xl border ${bdr} overflow-hidden`}>
      <div className={`px-5 py-3 ${bg} flex items-center justify-between`}>
        <span className={`text-sm font-bold ${tc}`}>{label}</span>
        <span className="text-xs text-gray-400">Total: <span className="text-white font-bold">{fmt(pl?.total)}</span></span>
      </div>
      <div className="p-5 space-y-4">
        <CEMatrix label={`${t.calEffortEMP} (MM)`} ceData={data?.ceEMP} onChange={(l,p,v)=>upd("EMP",l,p,v)} locations={locs} t={t}/>
        <CEMatrix label={`${t.calEffortAPP} (MM)`} ceData={data?.ceAPP} onChange={(l,p,v)=>upd("APP",l,p,v)} locations={locs} t={t}/>
        <div className="grid grid-cols-3 gap-3 bg-gray-800/30 rounded-xl p-4">
          <AutoField label={t.empSalaryCost} value={fmt(pl?.empCost)} note="auto"/>
          <AutoField label={t.appSalaryCost} value={fmt(pl?.appCost)} note="auto"/>
          <AutoField label={t.insurance} value={fmt(pl?.insCost)} note="auto"/>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-gray-500 mb-1 block">{t.otCampaignPct}</label><Inp type="number" value={data?.otCampaignPct} onChange={v=>updSec(phaseKey,sk,"otCampaignPct",v)} placeholder="10"/></div>
          <AutoField label={t.otCampaignCost} value={fmt(pl?.otCamp)} note="auto"/>
          <div><label className="text-xs text-gray-500 mb-1 block">{t.xjob}</label><Inp type="number" value={data?.xjob} onChange={v=>updSec(phaseKey,sk,"xjob",v)} placeholder="0"/></div>
          <div><label className="text-xs text-gray-500 mb-1 block">{t.otherExp}</label><Inp type="number" value={data?.otherExp} onChange={v=>updSec(phaseKey,sk,"otherExp",v)} placeholder="0"/></div>
        </div>
        <div className="rounded-xl border border-gray-700 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">📊 {t.summary}</p>
          <div className="space-y-1 divide-y divide-gray-800">
            <SummaryRow label={t.empSalaryCost} value={pl?.empCost}/>
            <SummaryRow label={t.appSalaryCost} value={pl?.appCost}/>
            <SummaryRow label={t.insurance} value={pl?.insCost}/>
            <SummaryRow label={t.otCampaignCost} value={pl?.otCamp}/>
            <SummaryRow label={t.xjob} value={pl?.xjob}/>
            <SummaryRow label={t.otherExp} value={pl?.other}/>
            <SummaryRow label={t.total} value={pl?.total} bold highlight/>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── ONSITE SECTION ──
const OnsiteSection=({phaseKey,phaseData,pl,updField,t})=>(
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3">
      <div><label className="text-xs text-gray-500 mb-1 block">{t.calEffortEMP} (MM)</label><Inp type="number" value={phaseData?.onsiteCeEMP} onChange={v=>updField(phaseKey,"onsiteCeEMP",v)}/></div>
      <div><label className="text-xs text-gray-500 mb-1 block">{t.calEffortAPP} (MM)</label><Inp type="number" value={phaseData?.onsiteCeAPP} onChange={v=>updField(phaseKey,"onsiteCeAPP",v)}/></div>
      <div><label className="text-xs text-gray-500 mb-1 block">{t.unitSalEMP}</label><Inp type="number" value={phaseData?.onsiteUnitSalEMP} onChange={v=>updField(phaseKey,"onsiteUnitSalEMP",v)}/></div>
      <div><label className="text-xs text-gray-500 mb-1 block">{t.unitSalAPP}</label><Inp type="number" value={phaseData?.onsiteUnitSalAPP} onChange={v=>updField(phaseKey,"onsiteUnitSalAPP",v)}/></div>
      <div className="col-span-2"><label className="text-xs text-gray-500 mb-1 block">{t.otherExp}</label><Inp type="number" value={phaseData?.onsiteOtherExp} onChange={v=>updField(phaseKey,"onsiteOtherExp",v)}/></div>
    </div>
    <div className="rounded-xl border border-teal-800 p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">📊 {t.summary}</p>
      <div className="space-y-1 divide-y divide-gray-800">
        <SummaryRow label={t.unitSalEMP+" cost"} value={pl?.oEMP}/>
        <SummaryRow label={t.unitSalAPP+" cost"} value={pl?.oAPP}/>
        <SummaryRow label={t.otherExp} value={pl?.oOther}/>
        <SummaryRow label={t.onsiteTotalCost} value={pl?.onsiteTotal} bold highlight/>
      </div>
    </div>
  </div>
);

// ── PHASE PANEL ──
const PhasePanel=({phaseKey,phaseData,pl,isForecast,planData,actualData,updSec,updField,admin,t})=>{
  const [tab,setTab]=useState("info");
  const locs=admin.locations||DEFAULT_LOCS;
  const tgt_g=admin.targetGrossMargin||25;const tgt_d=admin.targetDirectMargin||20;
  const cats=admin.otherCostCats||DEFAULT_OTHER_COST_CATS;

  const fcInfo=useMemo(()=>{
    if(!isForecast)return null;
    const planOff=parseFloat(planData?.offshore?.billableMM)||0;
    const planOns=parseFloat(planData?.onsite?.billableMM)||0;
    const planOffRev=parseFloat(planData?.offshore?.wipRevenue)||0;
    const planOnsRev=parseFloat(planData?.onsite?.wipRevenue)||0;
    const actOffMM=(actualData?.prime||[]).reduce((s,e)=>s+(parseFloat(e.offshoreActualMM)||0),0);
    const actOnsMM=(actualData?.prime||[]).reduce((s,e)=>s+(parseFloat(e.onsiteActualMM)||0),0);
    const fcOff=Math.max(0,planOff-actOffMM);
    const fcOns=Math.max(0,planOns-actOnsMM);
    const upOff=planOff>0?planOffRev/planOff:0;
    const upOns=planOns>0?planOnsRev/planOns:0;
    return{fcOff,fcOns,offRev:(fcOff*upOff).toFixed(0),onsRev:(fcOns*upOns).toFixed(0),actOffMM,actOnsMM,upOff,upOns};
  },[isForecast,planData,actualData]);

  // Calculate actual costs for P&L summary in forecast mode
  const actualCosts=useMemo(()=>calcActualCosts(actualData),[actualData]);

  const tabs=[{key:"info",label:t.projectInfo},{key:"prime",label:"🏢 Prime"},{key:"supplier",label:"🤝 Supplier"},{key:"onsite",label:"🏙️ Onsite"},{key:"other",label:`💡 ${t.otherCosts}`},{key:"pl",label:`📊 P&L`}];

  // Combined P&L for forecast: actual + forecast remaining
  const combinedPL=useMemo(()=>{
    if(!isForecast||!pl)return null;
    const actRev=actualCosts.totalActualRevenue;
    const fcRev=pl.totalRev;
    const totalRev=actRev+fcRev;
    const actCost=actualCosts.totalActualCost;
    const fcCost=pl.totalCost;
    const totalCost=actCost+fcCost;
    const grossProfit=totalRev-totalCost;
    const grossMargin=totalRev>0?(grossProfit/totalRev)*100:0;
    return{actRev,fcRev,totalRev,actCost,fcCost,totalCost,grossProfit,grossMargin,directMargin:grossMargin};
  },[isForecast,pl,actualCosts]);

  return(
    <div>
      {isForecast&&<div className="mb-4 px-4 py-3 bg-blue-900/20 border border-blue-800 rounded-xl text-xs text-blue-300">ℹ️ {t.forecastNote}</div>}
      <div className="flex gap-1 mb-4 overflow-x-auto bg-gray-800/50 rounded-xl p-1">
        {tabs.map(tb=><button key={tb.key} onClick={()=>setTab(tb.key)} className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${tab===tb.key?"bg-gray-700 text-white":"text-gray-500 hover:text-gray-300"}`}>{tb.label}</button>)}
      </div>
      {tab==="info"&&(
        <div className="space-y-4">
          <div className="bg-gray-800/50 rounded-xl p-4">
            <p className="text-sm font-bold text-indigo-400 mb-3">🌐 {t.offshoreTeam}</p>
            <div className="grid grid-cols-2 gap-3">
              {isForecast?(<><AutoField label={`${t.billableMM} (remaining)`} value={fcInfo?.fcOff?.toFixed(2)||"—"} note={t.autoCalc}/><AutoField label={t.wipRevenue} value={fmt(fcInfo?.offRev||0)} note={t.autoCalc}/><div className="col-span-2 text-xs text-gray-600 bg-gray-800 rounded-lg px-3 py-2">Planning: {planData?.offshore?.billableMM||0} MM · Unit: {fmt(fcInfo?.upOff||0)} · Actual used: {fcInfo?.actOffMM||0} MM</div></>):(<><div><label className="text-xs text-gray-500 mb-1 block">{t.billableMM}</label><Inp type="number" value={phaseData?.offshore?.billableMM} onChange={v=>updField(phaseKey,"offshore",{...phaseData?.offshore,billableMM:v})}/></div><div><label className="text-xs text-gray-500 mb-1 block">{t.wipRevenue}</label><Inp type="number" value={phaseData?.offshore?.wipRevenue} onChange={v=>updField(phaseKey,"offshore",{...phaseData?.offshore,wipRevenue:v})}/></div></>)}
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4">
            <p className="text-sm font-bold text-purple-400 mb-3">🏢 {t.onsiteTeam}</p>
            <div className="grid grid-cols-2 gap-3">
              {isForecast?(<><AutoField label={`${t.billableMM} (remaining)`} value={fcInfo?.fcOns?.toFixed(2)||"—"} note={t.autoCalc}/><AutoField label={t.wipRevenue} value={fmt(fcInfo?.onsRev||0)} note={t.autoCalc}/></>):(<><div><label className="text-xs text-gray-500 mb-1 block">{t.billableMM}</label><Inp type="number" value={phaseData?.onsite?.billableMM} onChange={v=>updField(phaseKey,"onsite",{...phaseData?.onsite,billableMM:v})}/></div><div><label className="text-xs text-gray-500 mb-1 block">{t.wipRevenue}</label><Inp type="number" value={phaseData?.onsite?.wipRevenue} onChange={v=>updField(phaseKey,"onsite",{...phaseData?.onsite,wipRevenue:v})}/></div></>)}
            </div>
          </div>
        </div>
      )}
      {tab==="prime"&&<VNCostSection label={`🏢 ${t.costPrime}`} color="indigo" sk="prime" phaseKey={phaseKey} data={phaseData?.prime} pl={pl?.primePL} updSec={updSec} locations={locs} t={t}/>}
      {tab==="supplier"&&<VNCostSection label={`🤝 ${t.costSupplier}`} color="purple" sk="supplier" phaseKey={phaseKey} data={phaseData?.supplier} pl={pl?.supplierPL} updSec={updSec} locations={locs} t={t}/>}
      {tab==="onsite"&&<OnsiteSection phaseKey={phaseKey} phaseData={phaseData} pl={pl} updField={updField} t={t}/>}
      {tab==="other"&&<OtherCostsTab items={phaseData?.otherCosts||[]} onChange={items=>updField(phaseKey,"otherCosts",items)} cats={cats} t={t}/>}
      {tab==="pl"&&(
        <div className="space-y-4">
          {/* Revenue */}
          <div className="grid grid-cols-3 gap-3">
            {[[t.offshoreTeam,pl?.offRev,"blue"],[t.onsiteTeam,pl?.onsRev,"purple"],[isForecast?t.forecastRevLabel:t.totalRevenue,pl?.totalRev,"white"]].map(([lb,v,c])=>(
              <div key={lb} className="bg-gray-800 rounded-xl p-4 text-center"><p className="text-xs text-gray-500 mb-1">{lb}</p><p className={`text-base font-bold text-${c}-400`}>{fmt(v)}</p></div>
            ))}
          </div>

          {/* Cost breakdown (forecast remaining only) */}
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{isForecast?t.forecastCostLabel:"Cost Breakdown"}</p>
            <div className="space-y-1 divide-y divide-gray-700">
              <SummaryRow label={t.primeTotalCost} value={pl?.primePL?.total}/>
              <SummaryRow label={t.supplierTotalCost} value={pl?.supplierPL?.total}/>
              <SummaryRow label={t.onsiteTotalCost} value={pl?.onsiteTotal}/>
              <SummaryRow label={t.otherTotalCost} value={pl?.otherCostsTotal}/>
              <SummaryRow label={isForecast?t.forecastCostLabel:t.totalCost} value={pl?.totalCost} bold/>
            </div>
          </div>

          {/* ── FORECAST: show Actual + Forecast combined P&L ── */}
          {isForecast&&combinedPL&&(
            <div className="bg-indigo-950/30 border border-indigo-800 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">📊 {t.totalProjectRev} / {t.totalProjectCost}</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-800/60 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">{t.actualRevLabel}</p>
                  <p className="text-sm font-bold text-cyan-400">{fmt(combinedPL.actRev)}</p>
                </div>
                <div className="bg-gray-800/60 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">{t.forecastRevLabel}</p>
                  <p className="text-sm font-bold text-blue-400">{fmt(combinedPL.fcRev)}</p>
                </div>
                <div className="bg-gray-800/60 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">{t.totalProjectRev}</p>
                  <p className="text-sm font-bold text-white">{fmt(combinedPL.totalRev)}</p>
                </div>
              </div>
              <div className="space-y-1 divide-y divide-indigo-900/50">
                <SummaryRow label={t.actualCostLabel} value={combinedPL.actCost}/>
                <SummaryRow label={t.forecastCostLabel} value={combinedPL.fcCost}/>
                <SummaryRow label={t.totalProjectCost} value={combinedPL.totalCost} bold highlight/>
              </div>
              <div className="space-y-2 pt-2 border-t border-indigo-900/50">
                {[[t.totalProjectRev,combinedPL.totalRev,"text-blue-400"],[t.totalProjectCost,combinedPL.totalCost,"text-orange-400"],[t.grossProfit,combinedPL.grossProfit,combinedPL.grossProfit>=0?"text-green-400":"text-red-400"]].map(([lb,v,cls])=>(
                  <div key={lb} className="flex justify-between border-b border-indigo-900/30 pb-2"><span className="text-sm text-gray-400">{lb}</span><span className={`font-bold ${cls}`}>{fmt(v)}</span></div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <MarginCard label={`${t.grossMargin} (${t.forecast})`} value={combinedPL.grossMargin} target={tgt_g} t={t}/>
                <MarginCard label={`${t.directMargin} (${t.forecast})`} value={combinedPL.directMargin} target={tgt_d} t={t}/>
              </div>
            </div>
          )}

          {/* Standard P&L (forecast remaining only OR planning) */}
          <div className="bg-gray-800 rounded-xl p-4 space-y-2">
            {[[isForecast?t.forecastRevLabel:t.totalRevenue,pl?.totalRev,"text-blue-400"],[isForecast?t.forecastCostLabel:t.totalCost,pl?.totalCost,"text-orange-400"],[t.grossProfit,pl?.grossProfit,pl?.grossProfit>=0?"text-green-400":"text-red-400"]].map(([lb,v,cls])=>(
              <div key={lb} className="flex justify-between border-b border-gray-700 pb-2"><span className="text-sm text-gray-400">{lb}</span><span className={`font-bold ${cls}`}>{fmt(v)}</span></div>
            ))}
          </div>
          {!isForecast&&(
            <div className="grid grid-cols-2 gap-4">
              <MarginCard label={t.grossMargin} value={pl?.grossMargin||0} target={tgt_g} t={t}/>
              <MarginCard label={t.directMargin} value={pl?.directMargin||0} target={tgt_d} t={t}/>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── SIM SCREEN ──
const SimScreen=({project,version,setProjects,admin,onBack,t})=>{
  const [phase,setPhase]=useState("planning");
  const d=version.data;
  const isForecastOK=["monthly","adhoc"].includes(version.type);
  const updSec=(pk,sk,field,val)=>setProjects(ps=>ps.map(p=>p.id===project.id?{...p,versions:p.versions.map(v=>v.id===version.id?{...v,data:{...v.data,[pk]:{...v.data[pk],[sk]:{...v.data[pk]?.[sk],[field]:val}}}}:v)}:p));
  const updField=(pk,field,val)=>setProjects(ps=>ps.map(p=>p.id===project.id?{...p,versions:p.versions.map(v=>v.id===version.id?{...v,data:{...v.data,[pk]:{...v.data[pk],[field]:val}}}:v)}:p));
  const planPL=useMemo(()=>calcPhase(d?.planning,admin),[d?.planning,admin]);
  const fcPL=useMemo(()=>calcPhase(d?.forecast,admin),[d?.forecast,admin]);
  const activePL=phase==="planning"?planPL:fcPL;
  const tgt_g=admin.targetGrossMargin||25;const tgt_d=admin.targetDirectMargin||20;
  const stl=key=>SIM_TYPES.find(s=>s.key===key)?.[t===T.vi?"vi":"en"]||key;

  // For header: if forecast, show combined margin
  const actualCosts=useMemo(()=>calcActualCosts(project.actualData),[project.actualData]);
  const headerMargin=useMemo(()=>{
    if(phase==="forecast"&&isForecastOK){
      const totalRev=actualCosts.totalActualRevenue+fcPL.totalRev;
      const totalCost=actualCosts.totalActualCost+fcPL.totalCost;
      const gp=totalRev-totalCost;
      const gm=totalRev>0?(gp/totalRev)*100:0;
      return{grossMargin:gm,directMargin:gm};
    }
    return{grossMargin:activePL.grossMargin,directMargin:activePL.directMargin};
  },[phase,isForecastOK,activePL,fcPL,actualCosts]);

  return(
    <div className="flex flex-col h-full">
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-white">← {t.back}</button>
        <div className="flex-1 min-w-0"><span className="text-white font-semibold">{project.code} — {project.name}</span><span className="text-gray-500 text-sm ml-2">{stl(version.type)} · {version.date}</span></div>
        <div className="flex items-center gap-4">
          {[[t.grossMargin,headerMargin.grossMargin,tgt_g],[t.directMargin,headerMargin.directMargin,tgt_d]].map(([lb,v,tgt])=>(
            <div key={lb} className="text-center"><div className="text-xs text-gray-500">{lb}</div><div className={`text-lg font-black ${mColor(v,tgt)}`}>{pct(v)}%</div></div>
          ))}
        </div>
      </div>
      <div className="bg-gray-950 px-6 pt-4 pb-0 flex gap-2">
        <button onClick={()=>setPhase("planning")} className={`px-5 py-2.5 rounded-t-xl text-sm font-semibold border-t border-l border-r transition ${phase==="planning"?"bg-gray-900 border-gray-800 text-white":"bg-gray-800/50 border-transparent text-gray-500 hover:text-gray-300"}`}>📋 {t.planningPhase}</button>
        {isForecastOK?<button onClick={()=>setPhase("forecast")} className={`px-5 py-2.5 rounded-t-xl text-sm font-semibold border-t border-l border-r transition ${phase==="forecast"?"bg-gray-900 border-gray-800 text-white":"bg-gray-800/50 border-transparent text-gray-500 hover:text-gray-300"}`}>🔭 {t.forecastPhase}</button>:<button disabled className="px-5 py-2.5 rounded-t-xl text-sm font-semibold text-gray-700 cursor-not-allowed">🔭 {t.forecastPhase}</button>}
      </div>
      <div className="flex-1 overflow-y-auto bg-gray-900 border-t border-gray-800">
        <div className="p-5 max-w-5xl mx-auto">
          <PhasePanel phaseKey={phase} phaseData={d?.[phase]} pl={activePL} isForecast={phase==="forecast"} planData={d?.planning} actualData={project.actualData} updSec={updSec} updField={updField} admin={admin} t={t}/>
        </div>
      </div>
    </div>
  );
};

// ── COST REF TABLE ──
const CostRefTable=({config,setConfig,t,lang})=>{
  const [activeType,setActiveType]=useState("Primer");
  const [activeSub,setActiveSub]=useState("salary");
  const [editing,setEditing]=useState(false);
  const [draft,setDraft]=useState(null);
  const [draftUnit,setDraftUnit]=useState("USD");
  const [toast,setToast]=useState(null);
  const fileRef=useRef();
  const locs=config.locations||DEFAULT_LOCS;
  const isShared=activeType==="Supplier"&&activeSub==="insurance";
  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),3000);};
  const getEff=()=>isShared?config.costRef?.Primer?.insurance||{table:{},unit:"USD",lastUpdated:""}:config.costRef?.[activeType]?.[activeSub]||{table:{},unit:"USD",lastUpdated:""};
  const startEdit=()=>{if(isShared)return;const cur=getEff();const s={};locs.forEach(l=>{s[l.code]={};PACKAGES.forEach(p=>{s[l.code][p]=cur.table?.[l.code]?.[p]||"";});});setDraft(s);setDraftUnit(cur.unit||"USD");setEditing(true);};
  const cancelEdit=()=>{setEditing(false);setDraft(null);};
  const saveEdit=()=>{setConfig(c=>({...c,costRef:{...c.costRef,[activeType]:{...c.costRef?.[activeType],[activeSub]:{table:draft,unit:draftUnit,lastUpdated:today()}}}}));setEditing(false);setDraft(null);showToast(t.savedOK);};
  const cur=getEff();const activeTable=editing?draft:cur.table;
  const allVals=useMemo(()=>locs.flatMap(l=>PACKAGES.map(p=>Number(cur.table?.[l.code]?.[p])||0)).filter(v=>v>0),[cur.table,locs]);
  const getHeat=(val)=>{if(!val||isNaN(Number(val)))return"";const v=Number(val);const mn=Math.min(...allVals),mx=Math.max(...allVals);const r=mx>mn?(v-mn)/(mx-mn):0;const h=Math.round(200-r*200);return`hsl(${h},60%,25%)`;};

  const handleCSV=(e)=>{
    const file=e.target.files?.[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      try{
        const text=ev.target.result;const rows=text.split("\n").map(r=>r.split(",").map(c=>c.trim()));
        const hdr=rows[0];if(!hdr||hdr.length<10)throw new Error("bad");
        const newT={};
        rows.slice(1).forEach(r=>{if(r.length<10||!r[0])return;const lc=r[0];newT[lc]={};PACKAGES.forEach((p,i)=>{newT[lc][p]=r[i+1]||"";});});
        setDraft(newT);showToast(t.importSuccess);
      }catch{showToast(t.importError,"error");}
    };reader.readAsText(file);if(fileRef.current)fileRef.current.value="";
  };
  const dlTemplate=()=>{const hdr=["Location",...PACKAGES].join(",");const rows=locs.map(l=>[l.code,...PACKAGES.map(()=>"")].join(","));const csv=[hdr,...rows].join("\n");const b=new Blob([csv],{type:"text/csv"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=`${activeType}_${activeSub}_template.csv`;a.click();URL.revokeObjectURL(u);};

  return(
    <div className="space-y-4">
      {toast&&<div className={`px-4 py-2 rounded-lg text-sm ${toast.type==="error"?"bg-red-900 text-red-300":"bg-green-900 text-green-300"}`}>{toast.msg}</div>}
      <div className="flex gap-2 flex-wrap">
        {["Primer","Supplier"].map(tp=><button key={tp} onClick={()=>{setActiveType(tp);setActiveSub("salary");setEditing(false);setDraft(null);}} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeType===tp?"bg-indigo-700 text-white":"bg-gray-800 text-gray-400"}`}>{tp}</button>)}
      </div>
      <div className="flex gap-2">
        {["salary","insurance"].map(sub=><button key={sub} onClick={()=>{setActiveSub(sub);setEditing(false);setDraft(null);}} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${activeSub===sub?"bg-gray-700 text-white":"text-gray-500"}`}>{sub==="salary"?t.salaryRef:t.insuranceRef}{activeType==="Supplier"&&sub==="insurance"?` ${t.sharedIns}`:""}</button>)}
      </div>
      {isShared&&<div className="text-xs text-yellow-400 bg-yellow-900/20 rounded-lg px-3 py-2">⚠️ {t.sharedIns}</div>}
      <div className="flex gap-2 items-center">
        {!editing&&!isShared&&<button onClick={startEdit} className="text-xs px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 rounded-lg">✏️ {t.editMode}</button>}
        {editing&&(<><button onClick={saveEdit} className="text-xs px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded-lg">💾 {t.save}</button><button onClick={cancelEdit} className="text-xs px-3 py-1.5 bg-gray-700 rounded-lg">{t.cancel}</button><button onClick={dlTemplate} className="text-xs px-3 py-1.5 bg-gray-700 rounded-lg">📥 {t.downloadTemplate}</button><label className="text-xs px-3 py-1.5 bg-gray-700 rounded-lg cursor-pointer">📤 {t.importCSV}<input ref={fileRef} type="file" accept=".csv" onChange={handleCSV} className="hidden"/></label></>)}
        {cur.lastUpdated&&<span className="text-xs text-gray-600 ml-auto">{t.lastUpdated}: {cur.lastUpdated}</span>}
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-xs">
          <thead><tr className="bg-gray-800 border-b border-gray-700">
            <th className="text-left py-2 px-3 text-gray-500 sticky left-0 bg-gray-800">{t.location}</th>
            {PACKAGES.map(p=><th key={p} className="py-2 px-1 text-center text-gray-500">{p}</th>)}
          </tr></thead>
          <tbody>
            {locs.map(loc=>(
              <tr key={loc.code} className="border-b border-gray-800/50">
                <td className="py-1 px-3 text-gray-300 sticky left-0 bg-gray-900 font-medium">{loc.code} - {loc.name[lang]||loc.name.vi}</td>
                {PACKAGES.map(p=>(
                  <td key={p} className="py-1 px-1" style={!editing?{backgroundColor:getHeat(activeTable?.[loc.code]?.[p])}:{}}>
                    {editing?<input type="number" value={draft?.[loc.code]?.[p]||""} onChange={e=>{const nd={...draft};nd[loc.code]={...nd[loc.code],[p]:e.target.value};setDraft(nd);}} className="w-full bg-gray-800 border border-gray-700 rounded px-1 py-1 text-center text-xs text-white"/>:<span className="block text-center py-1 text-gray-300">{activeTable?.[loc.code]?.[p]||"—"}</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-600">{t.importGuide}</p>
    </div>
  );
};

// ── PROJECT SCREENS ──
const ProjectListScreen=({projects,setProjects,onOpenProject,t})=>{
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({code:"",name:"",startDate:"",endDate:"",currency:"USD",status:"active"});
  const sL=s=>({active:t.active,completed:t.completed,onHold:t.onHold}[s]||s);
  const sC=s=>({active:"green",completed:"blue",onHold:"yellow"}[s]||"gray");
  const addProject=()=>{if(!form.code||!form.name)return;setProjects(ps=>[...ps,{id:uid(),code:form.code,name:form.name,startDate:form.startDate,endDate:form.endDate,currency:form.currency,status:form.status,versions:[],actualData:{prime:[],supplier:[]}}]);setForm({code:"",name:"",startDate:"",endDate:"",currency:"USD",status:"active"});setShowForm(false);};
  return(
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-white">{t.projectList}</h2><button onClick={()=>setShowForm(!showForm)} className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 rounded-xl text-sm font-medium">+ {t.addProject}</button></div>
      {showForm&&(<Card className="mb-6"><h3 className="text-sm font-bold text-gray-300 mb-4">{t.addProject}</h3><div className="grid grid-cols-3 gap-3"><div><label className="text-xs text-gray-500 mb-1 block">{t.projectCode}</label><Inp value={form.code} onChange={v=>setForm(f=>({...f,code:v}))}/></div><div><label className="text-xs text-gray-500 mb-1 block">{t.projectName}</label><Inp value={form.name} onChange={v=>setForm(f=>({...f,name:v}))}/></div><div><label className="text-xs text-gray-500 mb-1 block">{t.startDate}</label><Inp type="date" value={form.startDate} onChange={v=>setForm(f=>({...f,startDate:v}))}/></div><div><label className="text-xs text-gray-500 mb-1 block">{t.endDate}</label><Inp type="date" value={form.endDate} onChange={v=>setForm(f=>({...f,endDate:v}))}/></div><div><label className="text-xs text-gray-500 mb-1 block">{t.currency}</label><select value={form.currency} onChange={e=>setForm(f=>({...f,currency:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">{CURRENCIES.map(c=><option key={c}>{c}</option>)}</select></div></div><div className="mt-4 flex gap-2"><button onClick={addProject} className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-sm">{t.save}</button><button onClick={()=>setShowForm(false)} className="px-4 py-2 bg-gray-700 rounded-lg text-sm">{t.cancel}</button></div></Card>)}
      {projects.length===0?(<div className="text-center py-16 text-gray-600"><div className="text-5xl mb-3">📂</div><p>{t.noData}</p></div>):(
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-gray-800">{[t.projectCode,t.projectName,t.startDate,t.endDate,t.currency,t.simVersions,t.status,t.actions].map(h=><th key={h} className="text-left py-3 px-3 text-gray-500 font-medium">{h}</th>)}</tr></thead><tbody>{projects.map(proj=>(<tr key={proj.id} className="border-b border-gray-800/50 hover:bg-gray-900/50 cursor-pointer" onClick={()=>onOpenProject(proj.id)}><td className="py-3 px-3 text-indigo-400 font-medium">{proj.code||"—"}</td><td className="py-3 px-3 text-white">{proj.name||"—"}</td><td className="py-3 px-3 text-gray-400">{proj.startDate||"—"}</td><td className="py-3 px-3 text-gray-400">{proj.endDate||"—"}</td><td className="py-3 px-3 text-gray-400">{proj.currency}</td><td className="py-3 px-3"><Badge label={`${proj.versions.length} v`} color="indigo"/></td><td className="py-3 px-3"><Badge label={sL(proj.status)} color={sC(proj.status)}/></td><td className="py-3 px-3 flex gap-1"><button onClick={e=>{e.stopPropagation();onOpenProject(proj.id);}} className="text-xs px-3 py-1 bg-indigo-700 rounded-lg">{t.view}</button><button onClick={e=>{e.stopPropagation();setProjects(ps=>ps.filter(p=>p.id!==proj.id));}} className="text-xs px-2 py-1 bg-red-900 rounded-lg text-red-300">{t.del}</button></td></tr>))}</tbody></table></div>
      )}
    </div>
  );
};

// ── PROJECT DETAIL ──
const ProjectDetailScreen=({project,setProjects,onOpenSim,onOpenCompare,onBack,t,admin})=>{
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({type:"planning",note:"",createdBy:""});
  const [editing,setEditing]=useState(false);
  const [editForm,setEditForm]=useState({});
  const [showActual,setShowActual]=useState(false);
  const stl=key=>SIM_TYPES.find(s=>s.key===key)?.[t===T.vi?"vi":"en"]||key;
  const addVersion=()=>{const v={id:uid(),type:form.type,date:today(),note:form.note,createdBy:form.createdBy,data:{planning:{},forecast:{}}};setProjects(ps=>ps.map(p=>p.id===project.id?{...p,versions:[...p.versions,v]}:p));setForm({type:"planning",note:"",createdBy:""});setShowForm(false);};
  const delVer=vid=>setProjects(ps=>ps.map(p=>p.id===project.id?{...p,versions:p.versions.filter(v=>v.id!==vid)}:p));
  const startEdit=()=>{setEditForm({code:project.code,name:project.name,startDate:project.startDate,endDate:project.endDate,currency:project.currency,status:project.status});setEditing(true);};
  const saveEdit=()=>{setProjects(ps=>ps.map(p=>p.id===project.id?{...p,...editForm}:p));setEditing(false);};

  const addActualRow=(type)=>setProjects(ps=>ps.map(p=>p.id===project.id?{...p,actualData:{...p.actualData,[type]:[...(p.actualData?.[type]||[]),{id:uid(),month:"",offshoreActualMM:"",onsiteActualMM:"",actualCost:"",actualOffshoreRevenue:"",actualOnsiteRevenue:"",actualOnsiteCost:""}]}}:p));
  const updActual=(type,id,field,val)=>setProjects(ps=>ps.map(p=>p.id===project.id?{...p,actualData:{...p.actualData,[type]:(p.actualData?.[type]||[]).map(e=>e.id===id?{...e,[field]:val}:e)}}:p));
  const delActual=(type,id)=>setProjects(ps=>ps.map(p=>p.id===project.id?{...p,actualData:{...p.actualData,[type]:(p.actualData?.[type]||[]).filter(e=>e.id!==id)}}:p));

  return(
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-white mb-4">← {t.back}</button>
      <Card className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>{editing?(<div className="grid grid-cols-3 gap-3"><div><label className="text-xs text-gray-500 mb-1 block">{t.projectCode}</label><Inp value={editForm.code} onChange={v=>setEditForm(f=>({...f,code:v}))}/></div><div><label className="text-xs text-gray-500 mb-1 block">{t.projectName}</label><Inp value={editForm.name} onChange={v=>setEditForm(f=>({...f,name:v}))}/></div><div><label className="text-xs text-gray-500 mb-1 block">{t.startDate}</label><Inp type="date" value={editForm.startDate} onChange={v=>setEditForm(f=>({...f,startDate:v}))}/></div><div><label className="text-xs text-gray-500 mb-1 block">{t.endDate}</label><Inp type="date" value={editForm.endDate} onChange={v=>setEditForm(f=>({...f,endDate:v}))}/></div><div><label className="text-xs text-gray-500 mb-1 block">{t.currency}</label><select value={editForm.currency} onChange={e=>setEditForm(f=>({...f,currency:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">{CURRENCIES.map(c=><option key={c}>{c}</option>)}</select></div><div><label className="text-xs text-gray-500 mb-1 block">{t.status}</label><select value={editForm.status} onChange={e=>setEditForm(f=>({...f,status:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"><option value="active">{t.active}</option><option value="completed">{t.completed}</option><option value="onHold">{t.onHold}</option></select></div></div>):(<><h2 className="text-lg font-bold text-white">{project.code} — {project.name}</h2><p className="text-sm text-gray-500 mt-1">{project.startDate} → {project.endDate} · {project.currency}</p></>)}
          </div>
          <div className="flex gap-2">{editing?(<><button onClick={saveEdit} className="text-xs px-3 py-1.5 bg-green-700 rounded-lg">{t.save}</button><button onClick={()=>setEditing(false)} className="text-xs px-3 py-1.5 bg-gray-700 rounded-lg">{t.cancel}</button></>):(<button onClick={startEdit} className="text-xs px-3 py-1.5 bg-gray-700 rounded-lg">✏️ {t.editProject}</button>)}</div>
        </div>
      </Card>

      {/* Actual Data Section */}
      <Card className="mb-6">
        <div className="flex justify-between items-center mb-4"><h3 className="text-sm font-bold text-gray-300">{t.actualData}</h3><button onClick={()=>setShowActual(!showActual)} className="text-xs px-3 py-1.5 bg-gray-700 rounded-lg">{showActual?"▲":"▼"} {t.actualData}</button></div>
        {showActual&&(
          <div className="space-y-4">
            {["prime","supplier"].map(type=>(
              <div key={type}>
                <div className="flex justify-between items-center mb-2"><p className="text-xs font-semibold text-gray-400">{type==="prime"?t.actualPrime:t.actualSupplier}</p><button onClick={()=>addActualRow(type)} className="text-xs px-2 py-1 bg-indigo-700 rounded-lg">+ {t.addItem}</button></div>
                <div className="overflow-x-auto rounded-lg border border-gray-800">
                  <table className="w-full text-xs"><thead><tr className="bg-gray-800"><th className="py-2 px-2 text-left text-gray-500">Month</th><th className="py-2 px-2 text-right text-gray-500">Offshore MM</th><th className="py-2 px-2 text-right text-gray-500">Onsite MM</th><th className="py-2 px-2 text-right text-gray-500">Cost</th><th className="py-2 px-2 text-right text-gray-500">Off Revenue</th><th className="py-2 px-2 text-right text-gray-500">Ons Revenue</th><th className="py-2 px-2 text-right text-gray-500">Ons Cost</th><th className="py-2 px-2 w-8"></th></tr></thead>
                    <tbody>{(project.actualData?.[type]||[]).map(e=>(<tr key={e.id} className="border-b border-gray-800/50"><td className="py-1 px-2"><input type="month" value={e.month||""} onChange={ev=>updActual(type,e.id,"month",ev.target.value)} className="bg-gray-800 border border-gray-700 rounded px-1 py-1 text-xs text-white"/></td><td className="py-1 px-2"><input type="number" value={e.offshoreActualMM||""} onChange={ev=>updActual(type,e.id,"offshoreActualMM",ev.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-1 py-1 text-right text-xs text-white"/></td><td className="py-1 px-2"><input type="number" value={e.onsiteActualMM||""} onChange={ev=>updActual(type,e.id,"onsiteActualMM",ev.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-1 py-1 text-right text-xs text-white"/></td><td className="py-1 px-2"><input type="number" value={e.actualCost||""} onChange={ev=>updActual(type,e.id,"actualCost",ev.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-1 py-1 text-right text-xs text-white"/></td><td className="py-1 px-2"><input type="number" value={e.actualOffshoreRevenue||""} onChange={ev=>updActual(type,e.id,"actualOffshoreRevenue",ev.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-1 py-1 text-right text-xs text-white"/></td><td className="py-1 px-2"><input type="number" value={e.actualOnsiteRevenue||""} onChange={ev=>updActual(type,e.id,"actualOnsiteRevenue",ev.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-1 py-1 text-right text-xs text-white"/></td><td className="py-1 px-2"><input type="number" value={e.actualOnsiteCost||""} onChange={ev=>updActual(type,e.id,"actualOnsiteCost",ev.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-1 py-1 text-right text-xs text-white"/></td><td className="py-1 px-2"><button onClick={()=>delActual(type,e.id)} className="text-gray-600 hover:text-red-400">✕</button></td></tr>))}</tbody></table>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Versions */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-gray-300">{t.simVersions}</h3>
          <div className="flex gap-2">
            {project.versions.length>=2&&<button onClick={onOpenCompare} className="text-xs px-3 py-1.5 bg-purple-700 hover:bg-purple-600 rounded-lg">⚖️ {t.compare}</button>}
            <button onClick={()=>setShowForm(!showForm)} className="text-xs px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 rounded-lg">+ {t.addVersion}</button>
          </div>
        </div>
        {showForm&&(<div className="bg-gray-800/50 rounded-xl p-4 mb-4"><div className="grid grid-cols-3 gap-3"><div><label className="text-xs text-gray-500 mb-1 block">{t.versionType}</label><select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">{SIM_TYPES.map(s=><option key={s.key} value={s.key}>{t===T.vi?s.vi:s.en}</option>)}</select></div><div><label className="text-xs text-gray-500 mb-1 block">{t.versionNote}</label><Inp value={form.note} onChange={v=>setForm(f=>({...f,note:v}))}/></div><div><label className="text-xs text-gray-500 mb-1 block">{t.createdBy}</label><Inp value={form.createdBy} onChange={v=>setForm(f=>({...f,createdBy:v}))}/></div></div><div className="mt-3 flex gap-2"><button onClick={addVersion} className="px-3 py-1.5 bg-green-700 rounded-lg text-sm">{t.save}</button><button onClick={()=>setShowForm(false)} className="px-3 py-1.5 bg-gray-700 rounded-lg text-sm">{t.cancel}</button></div></div>)}
        {project.versions.length===0?<p className="text-gray-600 text-sm">{t.noData}</p>:(
          <div className="space-y-2">{project.versions.map(v=>(<div key={v.id} className="flex items-center gap-3 bg-gray-800/50 rounded-xl px-4 py-3 hover:bg-gray-800"><Badge label={stl(v.type)} color="indigo"/><span className="text-sm text-white flex-1">{v.note||"—"}</span><span className="text-xs text-gray-500">{v.date}</span><span className="text-xs text-gray-600">{v.createdBy}</span><button onClick={()=>onOpenSim(project.id,v.id)} className="text-xs px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 rounded-lg">{t.openSim}</button><button onClick={()=>delVer(v.id)} className="text-xs px-2 py-1 text-gray-600 hover:text-red-400">✕</button></div>))}</div>
        )}
      </Card>
    </div>
  );
};

// ── COMPARE VERSIONS ──
const DiffCell=({base,compare,isPercent,inverse})=>{const d=compare-base;if(Math.abs(d)<0.01)return<span className="text-gray-500">—</span>;const pos=inverse?d<0:d>0;return<span className={pos?"text-green-400":"text-red-400"}>{d>0?"+":""}{isPercent?pct(d)+"%":fmt(d)}</span>;};

const CompareVersionsScreen=({project,admin,onBack,t})=>{
  const [baseId,setBaseId]=useState(project.versions[0]?.id||null);
  const [compId,setCompId]=useState(project.versions[1]?.id||null);
  const [phaseKey,setPhaseKey]=useState("planning");
  const baseV=project.versions.find(v=>v.id===baseId);
  const compV=project.versions.find(v=>v.id===compId);
  const basePL=useMemo(()=>baseV?calcPhase(baseV.data?.[phaseKey],admin):null,[baseV,phaseKey,admin]);
  const compPL=useMemo(()=>compV?calcPhase(compV.data?.[phaseKey],admin):null,[compV,phaseKey,admin]);
  const stl=key=>SIM_TYPES.find(s=>s.key===key)?.[t===T.vi?"vi":"en"]||key;

  const metrics=basePL&&compPL?[
    {key:"rev",label:t.totalRevenue,base:basePL.totalRev,compare:compPL.totalRev},
    {key:"cost",label:t.totalCost,base:basePL.totalCost,compare:compPL.totalCost,inverse:true},
    {key:"prime",label:t.primeTotalCost,base:basePL.primePL?.total,compare:compPL.primePL?.total,inverse:true},
    {key:"supplier",label:t.supplierTotalCost,base:basePL.supplierPL?.total,compare:compPL.supplierPL?.total,inverse:true},
    {key:"onsite",label:t.onsiteTotalCost,base:basePL.onsiteTotal,compare:compPL.onsiteTotal,inverse:true},
    {key:"other",label:t.otherTotalCost,base:basePL.otherCostsTotal,compare:compPL.otherCostsTotal,inverse:true},
    {key:"gp",label:t.grossProfit,base:basePL.grossProfit,compare:compPL.grossProfit},
    {key:"gm",label:t.grossMargin,base:basePL.grossMargin,compare:compPL.grossMargin,isPercent:true},
    {key:"dm",label:t.directMargin,base:basePL.directMargin,compare:compPL.directMargin,isPercent:true},
  ]:[];

  return(
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-white mb-4">← {t.back}</button>
      <h2 className="text-xl font-bold text-white mb-6">⚖️ {t.compareVersions}</h2>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card><p className="text-xs text-gray-500 mb-2">{t.baseVersion}</p><select value={baseId||""} onChange={e=>setBaseId(Number(e.target.value)||e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">{project.versions.map(v=><option key={v.id} value={v.id}>{stl(v.type)} — {v.date} {v.note?`(${v.note})`:""}</option>)}</select></Card>
        <Card><p className="text-xs text-gray-500 mb-2">{t.compareWith}</p><select value={compId||""} onChange={e=>setCompId(Number(e.target.value)||e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">{project.versions.map(v=><option key={v.id} value={v.id}>{stl(v.type)} — {v.date} {v.note?`(${v.note})`:""}</option>)}</select></Card>
        <Card><p className="text-xs text-gray-500 mb-2">{t.phase}</p><div className="flex gap-2">{["planning","forecast"].map(pk=><button key={pk} onClick={()=>setPhaseKey(pk)} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${phaseKey===pk?"bg-indigo-700 text-white":"bg-gray-800 text-gray-400"}`}>{pk==="planning"?t.planning:t.forecast}</button>)}</div></Card>
      </div>
      {(!basePL||!compPL)?<div className="text-center py-16 text-gray-600">{t.selectBothVersions}</div>:(
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-3">
            {[
              {lb:t.totalRevenue,bv:basePL.totalRev,cv:compPL.totalRev,c:"blue"},
              {lb:t.totalCost,bv:basePL.totalCost,cv:compPL.totalCost,c:"orange",inv:true},
              {lb:t.grossProfit,bv:basePL.grossProfit,cv:compPL.grossProfit,c:"green"},
              {lb:t.grossMargin,bv:basePL.grossMargin,cv:compPL.grossMargin,c:"indigo",isPct:true},
            ].map(m=>(
              <div key={m.lb} className="bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">{m.lb}</p>
                <div className="flex justify-center gap-3 items-baseline">
                  <span className="text-sm text-gray-400">{m.isPct?pct(m.bv)+"%":fmt(m.bv)}</span>
                  <span className="text-lg font-bold text-white">→</span>
                  <span className={`text-sm font-bold text-${m.c}-400`}>{m.isPct?pct(m.cv)+"%":fmt(m.cv)}</span>
                </div>
                <div className="mt-1"><DiffCell base={m.bv} compare={m.cv} isPercent={m.isPct} inverse={m.inv}/></div>
              </div>
            ))}
          </div>
          {/* Detail Table */}
          <Card title={t.comparisonResult}>
            <div className="overflow-x-auto rounded-xl border border-gray-800">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-800 border-b border-gray-700"><th className="text-left py-3 px-4 text-gray-500">{t.metric}</th><th className="text-right py-3 px-4 text-gray-500">{t.baseVersion}</th><th className="text-right py-3 px-4 text-gray-500">{t.compareWith}</th><th className="text-right py-3 px-4 text-gray-500">{t.difference}</th></tr></thead>
                <tbody>{metrics.map(m=>(
                  <tr key={m.key} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-3 px-4 text-gray-300 font-medium">{m.label}</td>
                    <td className="py-3 px-4 text-right text-indigo-300">{m.isPercent?`${pct(m.base)}%`:fmt(m.base)}</td>
                    <td className="py-3 px-4 text-right text-purple-300">{m.isPercent?`${pct(m.compare)}%`:fmt(m.compare)}</td>
                    <td className="py-3 px-4 text-right"><DiffCell base={m.base} compare={m.compare} isPercent={m.isPercent} inverse={m.inverse}/></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// ── ADMIN SCREEN (RESTORED WITH ALL 7 TABS) ──
const AdminScreen=({config,setConfig,t,lang})=>{
  const [tab,setTab]=useState("target");
  const tabs=[
    {key:"target",icon:"🎯",label:t.targetSettings},
    {key:"roles",icon:"👤",label:t.rolesConfig},
    {key:"contracts",icon:"📄",label:t.contractConfig},
    {key:"locations",icon:"📍",label:t.locationConfig},
    {key:"costref",icon:"💰",label:t.costRefConfig},
    {key:"income",icon:"🎁",label:t.projectIncomeConfig},
    {key:"othercats",icon:"📦",label:t.otherCostCatsConfig},
  ];
  return(
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-xl font-bold text-white mb-6">{t.adminTitle}</h2>
      <div className="flex gap-1 mb-6 bg-gray-900 rounded-xl p-1 overflow-x-auto border border-gray-800">
        {tabs.map(tb=><button key={tb.key} onClick={()=>setTab(tb.key)} className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition flex items-center gap-1.5 ${tab===tb.key?"bg-gray-700 text-white":"text-gray-500 hover:text-gray-300"}`}>{tb.icon} {tb.label}</button>)}
      </div>

      {tab==="target"&&<Card title={t.targetSettings}><div className="grid grid-cols-2 gap-6"><div className="bg-gray-800/50 rounded-xl p-4"><label className="text-xs text-gray-500 mb-1 block">{t.targetGM}</label><Inp type="number" value={config.targetGrossMargin} onChange={v=>setConfig(c=>({...c,targetGrossMargin:parseFloat(v)||0}))}/><p className="text-xs text-gray-600 mt-2">Revenue – Total Cost / Revenue</p></div><div className="bg-gray-800/50 rounded-xl p-4"><label className="text-xs text-gray-500 mb-1 block">{t.targetDM}</label><Inp type="number" value={config.targetDirectMargin} onChange={v=>setConfig(c=>({...c,targetDirectMargin:parseFloat(v)||0}))}/><p className="text-xs text-gray-600 mt-2">Gross Profit – Direct Costs / Revenue</p></div></div></Card>}

      {tab==="roles"&&<Card title={t.rolesConfig}><div className="space-y-2 mb-4">{config.roles.map((r,i)=><div key={i} className="flex gap-2"><Inp value={r} onChange={v=>setConfig(c=>({...c,roles:c.roles.map((x,j)=>j===i?v:x)}))}/><button onClick={()=>setConfig(c=>({...c,roles:c.roles.filter((_,j)=>j!==i)}))} className="text-gray-600 hover:text-red-400 px-2">✕</button></div>)}</div><button onClick={()=>setConfig(c=>({...c,roles:[...c.roles,""]}))} className="text-sm px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 rounded-lg">+ {t.addRole}</button></Card>}

      {tab==="contracts"&&<Card title={t.contractConfig}><div className="space-y-2 mb-4">{config.contractTypes.map((ct,i)=><div key={i} className="flex gap-2"><Inp value={ct} onChange={v=>setConfig(c=>({...c,contractTypes:c.contractTypes.map((x,j)=>j===i?v:x)}))}/><button onClick={()=>setConfig(c=>({...c,contractTypes:c.contractTypes.filter((_,j)=>j!==i)}))} className="text-gray-600 hover:text-red-400 px-2">✕</button></div>)}</div><button onClick={()=>setConfig(c=>({...c,contractTypes:[...c.contractTypes,""]}))} className="text-sm px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 rounded-lg">+ {t.addContract}</button></Card>}

      {tab==="locations"&&<Card title={t.locationConfig}><p className="text-xs text-yellow-400 bg-yellow-900/20 rounded-lg px-3 py-2 mb-4">⚠️ Thay đổi location sẽ ảnh hưởng đến bảng chi phí tham chiếu và CE Matrix.</p><div className="space-y-2 mb-4">{config.locations.map((loc,i)=><div key={i} className="grid grid-cols-3 gap-2 items-center"><Inp value={loc.code} onChange={v=>setConfig(c=>({...c,locations:c.locations.map((l,j)=>j===i?{...l,code:v}:l)}))} placeholder="Code"/><Inp value={loc.name[lang]||loc.name.vi} onChange={v=>setConfig(c=>({...c,locations:c.locations.map((l,j)=>j===i?{...l,name:{...l.name,[lang]:v}}:l)}))} placeholder="Name"/><button onClick={()=>setConfig(c=>({...c,locations:c.locations.filter((_,j)=>j!==i)}))} className="text-gray-600 hover:text-red-400 text-sm">✕</button></div>)}</div><button onClick={()=>setConfig(c=>({...c,locations:[...c.locations,{code:"",name:{vi:"",en:""},active:true}]}))} className="text-sm px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 rounded-lg">+ {t.addLocation}</button></Card>}

      {tab==="costref"&&<Card title={t.costRefConfig}><CostRefTable config={config} setConfig={setConfig} t={t} lang={lang}/></Card>}

      {tab==="income"&&<Card title={t.projectIncomeConfig}><div className="max-w-sm"><label className="text-xs text-gray-500 mb-1 block">{t.projectIncomePct}</label><div className="flex items-center gap-3"><Inp type="number" value={config.projectIncomePct} onChange={v=>setConfig(c=>({...c,projectIncomePct:parseFloat(v)||0}))} className="w-32"/><span className="text-gray-400 text-sm">%</span></div><div className="mt-4 p-4 bg-gray-800 rounded-xl text-xs text-gray-400 space-y-2"><p className="font-medium text-gray-300">📐 {t.projectIncomeNote}</p><p className="font-mono bg-gray-900 rounded p-2 text-green-300">EMP Cost = (1 + 8% + {config.projectIncomePct||30}%) × SUMPRODUCT<br/>= {(1+0.08+(config.projectIncomePct||30)/100).toFixed(2)} × SUMPRODUCT</p><p className="text-gray-600">APP/POI = 1.0 × SUMPRODUCT</p></div></div></Card>}

      {tab==="othercats"&&<Card title={t.otherCostCatsConfig}><p className="text-xs text-gray-500 mb-4">Danh mục hiển thị trong tab Chi phí khác của Simulation.</p><div className="space-y-2 mb-4">{(config.otherCostCats||DEFAULT_OTHER_COST_CATS).map((cat,i)=><div key={i} className="flex gap-2"><Inp value={cat} onChange={v=>setConfig(c=>({...c,otherCostCats:c.otherCostCats.map((x,j)=>j===i?v:x)}))}/><button onClick={()=>setConfig(c=>({...c,otherCostCats:c.otherCostCats.filter((_,j)=>j!==i)}))} className="text-gray-600 hover:text-red-400 px-2">✕</button></div>)}</div><button onClick={()=>setConfig(c=>({...c,otherCostCats:[...(c.otherCostCats||[]),""]}))} className="text-sm px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 rounded-lg">+ {t.addCat}</button></Card>}
    </div>
  );
};

// ── MAIN ──
export default function App(){
  const [lang,setLang]=useState("vi");
  const t=T[lang];
  const [screen,setScreen]=useState("projects");
  const [projects,setProjects]=useState([]);
  const [admin,setAdmin]=useState(defAdmin());
  const [activeProjId,setActiveProjId]=useState(null);
  const [activeVerId,setActiveVerId]=useState(null);
  const activeProject=projects.find(p=>p.id===activeProjId);
  const activeVersion=activeProject?.versions.find(v=>v.id===activeVerId);
  return(
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col" style={{fontFamily:"system-ui,sans-serif"}}>
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-base font-bold text-white">📊 {t.appTitle}</h1>
          <div className="flex gap-1">{[{key:"projects",icon:"📂",label:t.projects},{key:"admin",icon:"⚙️",label:t.admin}].map(item=><button key={item.key} onClick={()=>setScreen(item.key)} className={`px-3 py-1.5 rounded text-sm font-medium ${(screen===item.key||(item.key==="projects"&&["project-detail","simulation","compare"].includes(screen)))?"bg-gray-800 text-white":"text-gray-500"}`}>{item.icon} {item.label}</button>)}</div>
        </div>
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">{["vi","en"].map(l=><button key={l} onClick={()=>setLang(l)} className={`px-3 py-1 rounded text-sm font-medium ${lang===l?"bg-indigo-600 text-white":"text-gray-500"}`}>{l==="vi"?"🇻🇳 VI":"🇬🇧 EN"}</button>)}</div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {screen==="projects"&&<ProjectListScreen projects={projects} setProjects={setProjects} onOpenProject={id=>{setActiveProjId(id);setScreen("project-detail");}} t={t}/>}
        {screen==="project-detail"&&activeProject&&<ProjectDetailScreen project={activeProject} setProjects={setProjects} onOpenSim={(pid,vid)=>{setActiveProjId(pid);setActiveVerId(vid);setScreen("simulation");}} onOpenCompare={()=>setScreen("compare")} onBack={()=>setScreen("projects")} t={t} admin={admin}/>}
        {screen==="simulation"&&activeProject&&activeVersion&&<SimScreen project={activeProject} version={activeVersion} setProjects={setProjects} admin={admin} onBack={()=>setScreen("project-detail")} t={t}/>}
        {screen==="compare"&&activeProject&&<CompareVersionsScreen project={activeProject} admin={admin} onBack={()=>setScreen("project-detail")} t={t}/>}
        {screen==="admin"&&<AdminScreen config={admin} setConfig={setAdmin} t={t} lang={lang}/>}
      </div>
    </div>
  );
}