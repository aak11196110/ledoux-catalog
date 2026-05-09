// ═══════════════════════════════════════════
//  LEDOUX 諾科照明 報價系統 v3.2
//  修改紀錄：
//  1. 電子型錄：改為開新分頁（繞過 Google Drive iframe 限制）
//  2. 報價單白屏修復：訪客流程邏輯重構，不再崩潰
//  3. Email 通知：樣品申請、安裝申請、報價單下載、配燈服務申請
//  4. 設計公司專案提示橫幅：出現在產品目錄、詢價單、安裝服務、電子型錄、詢價側邊欄、安裝估價 Panel
// ═══════════════════════════════════════════
import { useState, useRef, useEffect, Component } from "react";

// ✅ ErrorBoundary：防止任何 JS 錯誤導致白屏，改為顯示錯誤訊息
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("LEDOUX App Error:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f7f4ef",flexDirection:"column",gap:16,padding:32}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:"#0e0d0c",letterSpacing:2}}>LEDOUX</div>
          <div style={{fontSize:12,color:"#9b3a3a",letterSpacing:2,textTransform:"uppercase"}}>頁面發生錯誤</div>
          <div style={{fontSize:11,color:"#8a8278",maxWidth:420,textAlign:"center",lineHeight:1.8}}>
            {String(this.state.error?.message||"未知錯誤")}
          </div>
          <button onClick={()=>this.setState({hasError:false,error:null})} style={{padding:"10px 24px",background:"#0e0d0c",border:"none",color:"#f7f4ef",fontFamily:"'Noto Sans TC',sans-serif",fontSize:"9px",letterSpacing:"4px",cursor:"pointer",textTransform:"uppercase",marginTop:8}}>
            重新整理
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const SHEET_URL = "https://script.google.com/macros/s/AKfycbylNuQW2ADr6behwvzj95GwTeGnFfkH-PQKe7M2jomgPMW1d1x7e2LkNHhDU7TvIKQyNg/exec";
const ADMIN_USERNAME = "xxx3903052";
const ADMIN_PASSWORD = "zzz3909086";
const NOTIFY_EMAIL   = "kim@ledouxlight.com.tw";
const CONTACT_PHONE  = "0965-502-319";
const CONTACT_EMAIL  = "kim@ledouxlight.com.tw";

// ══════════════════════════════════════════
//  【電子型錄設定】
//  ✅ 修復說明：Google Drive /preview 會被 X-Frame-Options 擋住無法嵌入。
//  已改為點擊後「開新分頁」顯示，previewUrl 填一般分享連結即可。
//  previewUrl 格式：https://drive.google.com/file/d/FILE_ID/view?usp=sharing
//  downloadUrl 格式：https://drive.google.com/uc?export=download&id=FILE_ID
// ══════════════════════════════════════════
const DEFAULT_CATALOGS = [
  {
    id: "cat001",
    title: "綜合照明型錄",
    subtitle: "COMPREHENSIVE LIGHTING",
    edition: "2025 Edition",
    coverColor: "#1a1410",
    accentColor: "#b8935a",
    description: "包含全系列崁燈、射燈、磁吸系統、軌道燈、吸頂燈等室內主力燈具，適合商業空間、精品零售、餐飲設計等專案選燈參考。",
    tags: ["崁燈", "射燈", "磁吸系統", "軌道燈", "吸頂燈", "HEPBURN", "BLADE", "METIS"],
    pageCount: "56",
    fileSize: "18 MB",
    previewUrl: "https://drive.google.com/file/d/1GOxgsC_mX_3H5jaq6JMID0L-3cJxgzZD/view?usp=drive_link",
    downloadUrl: "https://drive.google.com/uc?export=download&id=1GOxgsC_mX_3H5jaq6JMID0L-3cJxgzZD",
    updatedAt: "2025-04",
    available: true,
  },
  {
    id: "cat002",
    title: "線型燈具型錄",
    subtitle: "LINEAR LIGHTING",
    edition: "2025 Edition",
    coverColor: "#0a120d",
    accentColor: "#5a9b6a",
    description: "專注線型照明解決方案，涵蓋鋁條燈、鋁擠燈、矽膠軟條燈、戶外防水燈帶、偏光洗牆燈等，適合建築輪廓、天際線、景觀泳池等應用。",
    tags: ["鋁條燈", "鋁擠燈", "矽膠軟條燈", "戶外防水", "洗牆燈", "IP65/IP67"],
    pageCount: "32",
    fileSize: "12 MB",
    previewUrl: "https://drive.google.com/file/d/1N6Eh4U6uhCMALkCp1L_uM70d3CaPE6k4/view?usp=drive_link",
    downloadUrl: "https://drive.google.com/uc?export=download&id=1N6Eh4U6uhCMALkCp1L_uM70d3CaPE6k4",
    updatedAt: "2025-04",
    available: true,
  },
];

// ── 雲端 API ──
async function sheetGet(action) {
  if (!SHEET_URL) return null;
  try {
    const res = await fetch(`${SHEET_URL}?action=${action}`);
    const json = await res.json();
    return json.success ? json.data : null;
  } catch { return null; }
}
async function sheetPost(action, data) {
  if (!SHEET_URL) return null;
  try {
    const payload = encodeURIComponent(JSON.stringify(data));
    const res = await fetch(`${SHEET_URL}?action=${action}&payload=${payload}`);
    return await res.json();
  } catch { return null; }
}

// ══════════════════════════════════════════
//  【Email 通知】
//  需在 Apps Script 加入 sendEmail action：
//  if (action === 'sendEmail') {
//    const d = JSON.parse(decodeURIComponent(params.payload));
//    GmailApp.sendEmail(d.to, d.subject, d.body);
//    return ContentService.createTextOutput(JSON.stringify({success:true}))
//      .setMimeType(ContentService.MimeType.JSON);
//  }
// ══════════════════════════════════════════
async function sendNotifyEmail(subject, body) {
  try {
    await sheetPost("sendEmail", { to: NOTIFY_EMAIL, subject, body });
  } catch (e) { console.warn("Email 通知失敗：", e); }
}

function roundPrice(n) {
  const r = n % 10;
  if (r === 0) return n;
  if (r <= 5) return n - r + 5;
  return n - r + 10;
}

const INIT_MEMBERS = [
  { id:1, username:"xxx3903052", password:"zzz3909086", name:"管理員", position:"管理者", company:"Ledoux Taiwan", phone:"", email:"", taxId:"", role:"admin", status:"approved", approvedAt:"2026-04-18" },
];

const INSTALL_BASE     = 200; // 崁燈安裝 NT$200/盞
const INSTALL_MIN      = 2000;
const INSTALL_LINEAR_M = 500; // 線型燈安裝 NT$500/米

const INSTALL_REGIONS = [
  { id:"core",     label:"桃園核心區",         areas:"八德、桃園、中壢、大溪、鶯歌",           km:"0–10 km",     travel:600,  freeAt:15  },
  { id:"outer",    label:"桃園外環區",         areas:"大園、觀音、新屋、龜山、蘆竹",           km:"11–25 km",    travel:1000, freeAt:25  },
  { id:"north",    label:"北台近郊區",         areas:"雙北全區、新竹縣市",                     km:"26–55 km",    travel:1800, freeAt:45  },
  { id:"yilan",    label:"宜蘭專區",           areas:"宜蘭縣全區（交通特殊性）",              km:"不論距離",    travel:2500, freeAt:60  },
  { id:"centralA", label:"中台灣 A 區",        areas:"苗栗、頭份、竹南、北台山區",             km:"56–90 km",    travel:2800, freeAt:80  },
  { id:"centralB", label:"中台灣 B 區",        areas:"台中、彰化、南投市區",                   km:"91–150 km",   travel:3800, freeAt:120 },
  { id:"southA",   label:"南台灣 A 區",        areas:"雲林、嘉義地區",                         km:"151–220 km",  travel:5000, freeAt:null},
  { id:"southB",   label:"南台灣 B 區 ／ 花東",areas:"台南、高雄、屏東、花蓮、台東",           km:"221 km 以上", travel:6500, freeAt:null},
  { id:"remote",   label:"離島 ／ 偏遠山區",  areas:"金門、馬祖、澎湖、南投深山",             km:"專案評估",    travel:null, freeAt:null},
];

const CEILING_GROUPS = [
  { id:"std",   label:"3.0m 以下（標準）",       surcharge:0,    note:"含定位、安裝與功能測試" },
  { id:"high",  label:"3.1m – 4.5m（挑高）",    surcharge:80,   note:"視現場難度，需 A 型梯（+NT$80/盞）" },
  { id:"vhigh", label:"4.5m 以上（不含安裝費）", surcharge:null, note:"需鷹架或高空作業車，安裝費另案報價" },
];

const TRAVEL_STAY = { kmThreshold:150, lampThreshold:80, stayPerNight:2000, mealPerDay:500 };

// 商照燈系列（含中文名）
const COMMERCIAL_SERIES = [
  "DC48V 磁吸軌道","EOS 奧斯","SLOT 希洛特","COSY 寇斯","YODA 優打",
  "YOMAX 優麥斯","HEPBURN 赫本","METIS 墨提斯","MINI 珠寶","BLADE 帕雷德",
  "LINEAR 麗娜","POLA 泊拉","WALL LIGHT 壁燈","STEP LIGHT 地腳燈",
  "CABINET LINEAR LIGHT 高端線條燈","LED STRIP LIGHT 低壓燈帶",
  "OUTDOOR LIGHT 戶外燈具","VELA","商照燈－特殊款／其他"
];
// 線型燈系列
const LINEAR_SERIES_LIST = [
  "鋁擠洗牆燈","鋁條燈","燈帶","軟條燈","線型燈－特殊款／其他"
];
const ALL_SERIES_LIST = [...COMMERCIAL_SERIES, ...LINEAR_SERIES_LIST];

const SYNONYMS = {
  "坎灯":"崁燈","坎燈":"崁燈","崁灯":"崁燈","嵌灯":"崁燈","嵌燈":"崁燈",
  "轨道灯":"軌道燈","导轨灯":"軌道燈","磁吸灯":"磁吸系統","磁吸燈":"磁吸系統",
  "吸顶灯":"吸頂燈","户外灯":"戶外燈","软条灯":"鋁條燈","led strip":"鋁條燈",
  "铝条灯":"鋁條燈","硅胶灯":"矽膠燈帶","silicone":"矽膠燈帶","防水":"戶外燈",
  "outdoor":"戶外燈","ip65":"戶外燈","ip67":"戶外燈","插地":"戶外燈","户外":"戶外燈",
  "hepburn":"HEPBURN","blade":"BLADE","metis":"METIS","eos":"EOS","theia":"THEIA",
  "magnetic":"磁吸系統","villa":"VILLA","维拉":"VILLA","維拉":"VILLA",
  "ra98":"Ra≥98","ra95":"Ra≥95","rgbw":"矽膠燈帶",
};

const HOT_KEYWORDS = ["崁燈","軌道燈","磁吸系統","鋁條燈","戶外燈","HEPBURN","EOS","48V","Ra≥95","調光","珠寶燈"];
const COMPANY = { name:"台灣諾科照明有限公司", eng:"Ledoux Lighting Taiwan Co., Ltd.", email:"info@ledouxlight.com" };

const INIT_PRODUCTS = [
  { id:1,  model:"HB.D110",     series:"HEPBURN 赫本",      category:"崁燈",    watt:"10W",    lumen:"680lm",   cct:"2700K/3000K/3500K/4000K", beam:"15°/24°/36°",     voltage:"220V",   cri:"Ra≥90", color:"白色/黑色",     cutout:"Ø95mm",  size:"Ø102×H114mm", install:"崁入式",   cert:"CE/3C", shipping:90,  stdPrice:980,  projPrice:790,  video:"", desc:"HEPBURN 系列經典崁燈，LUMINUS 光源，680lm，可選蜂窩網、布紋玻璃配件。", images:["https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Light-HB.D110-White-300x300.png"], note:"可選配件：蜂窩網、布紋玻璃、條紋玻璃" },
  { id:2,  model:"HB.D115",     series:"HEPBURN 赫本",      category:"崁燈",    watt:"15W",    lumen:"1000lm",  cct:"2700K/3000K/3500K/4000K", beam:"15°/24°/36°",     voltage:"220V",   cri:"Ra≥90", color:"白色/黑色",     cutout:"Ø95mm",  size:"Ø102×H114mm", install:"崁入式",   cert:"CE/3C", shipping:90,  stdPrice:1180, projPrice:960,  video:"", desc:"HEPBURN 15W，1000lm，優雅比例與高效能光源完美結合。", images:[], note:"可選配件：蜂窩網" },
  { id:3,  model:"HB.D120",     series:"HEPBURN 赫本",      category:"崁燈",    watt:"20W",    lumen:"1732lm",  cct:"2700K/3000K/3500K/4000K", beam:"15°/24°/36°",     voltage:"220V",   cri:"Ra≥90", color:"白色/黑色",     cutout:"Ø95mm",  size:"Ø102×H132mm", install:"崁入式",   cert:"CE/3C", shipping:90,  stdPrice:1380, projPrice:1120, video:"", desc:"HEPBURN 20W，1732lm 高光通，適合精品店與藝廊重點照明。", images:["https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Light-HB.D120-White-300x300.png"], note:"可選配件：蜂窩網、布紋玻璃" },
  { id:4,  model:"HB.D130",     series:"HEPBURN 赫本",      category:"崁燈",    watt:"30W",    lumen:"2200lm",  cct:"2700K/3000K/3500K/4000K", beam:"15°/24°/36°",     voltage:"220V",   cri:"Ra≥90", color:"白色/黑色",     cutout:"Ø95mm",  size:"Ø102×H132mm", install:"崁入式",   cert:"CE/3C", shipping:100, stdPrice:1580, projPrice:1280, video:"", desc:"HEPBURN 旗艦 30W，2200lm，高挑空間與精品陳列首選。", images:["https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Light-HB.D130-240x300.jpg"], note:"" },
  { id:5,  model:"HB.D120-N",   series:"HEPBURN 赫本",      category:"崁燈",    watt:"20W",    lumen:"1732lm",  cct:"2700K/3000K/3500K/4000K", beam:"15°/24°/36°",     voltage:"220V",   cri:"Ra≥90", color:"白色/黑色",     cutout:"Ø98mm",  size:"Ø102×H132mm", install:"崁入式",   cert:"CE/3C", shipping:90,  stdPrice:1380, projPrice:1120, video:"", desc:"HEPBURN-N 20W，全系列最暢銷款，商業空間標準配置。", images:["https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Light-HB.D120-White-300x300.png"], note:"" },
  { id:6,  model:"HB.D130-N",   series:"HEPBURN 赫本",      category:"崁燈",    watt:"30W",    lumen:"2200lm",  cct:"2700K/3000K/3500K/4000K", beam:"15°/24°/36°",     voltage:"220V",   cri:"Ra≥90", color:"白色/黑色",     cutout:"Ø98mm",  size:"Ø102×H132mm", install:"崁入式",   cert:"CE/3C", shipping:100, stdPrice:1580, projPrice:1280, video:"", desc:"HEPBURN-N 30W，博物館與精品店最大功率款。", images:["https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Light-HB.D130-240x300.jpg"], note:"" },
  { id:7,  model:"HB.D430",     series:"HEPBURN 赫本",      category:"崁燈",    watt:"30W",    lumen:"2200lm",  cct:"2700K/3000K/3500K/4000K", beam:"15°/24°/36°",     voltage:"220V",   cri:"Ra≥90", color:"白色/黑色/金色", cutout:"Ø70mm",  size:"Ø75×H114mm",  install:"崁入式",   cert:"CE/3C", shipping:120, stdPrice:2880, projPrice:2350, video:"", desc:"HEPBURN 小口徑旗艦 30W，最小開孔最大輸出。", images:["https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Light-HB.D430-240x300.jpg"], note:"可選金色前框" },
  { id:8,  model:"HB.T130S",    series:"HEPBURN 赫本",      category:"軌道燈",  watt:"30W",    lumen:"2200lm",  cct:"2700K/3000K/3500K/4000K", beam:"15°/24°/36°",     voltage:"220V",   cri:"Ra≥90", color:"白色/黑色/金色", cutout:"—",      size:"Ø63×H160mm",  install:"三線軌道式",cert:"CE/3C", shipping:120, stdPrice:2480, projPrice:2020, video:"", desc:"HEPBURN 軌道旗艦，30W 2200lm，三線導軌，優雅外型強大性能。", images:["https://www.ledouxlight.com/wp-content/uploads/2023/01/Led-Track-Light-HB.T130S-300x300.png"], note:"可選蜂窩網、布紋玻璃" },
  { id:9,  model:"NDB0306-C",   series:"BLADE 帕雷德",        category:"崁燈",    watt:"6W",     lumen:"480lm",   cct:"3000K/4000K",             beam:"24°",             voltage:"220V",   cri:"Ra≥80", color:"白色/黑色",     cutout:"Ø75mm",  size:"Ø85×H30mm",   install:"崁入式",   cert:"CE",    shipping:75,  stdPrice:780,  projPrice:630,  video:"", desc:"BLADE 超薄系列 6W，燈身僅 30mm，天花板隱形光源首選。", images:["https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Light-NDB0306-C-240x300.jpg"], note:"" },
  { id:10, model:"NDB0309-C",   series:"BLADE 帕雷德",        category:"崁燈",    watt:"9W",     lumen:"720lm",   cct:"3000K/4000K",             beam:"24°",             voltage:"220V",   cri:"Ra≥80", color:"白色/黑色",     cutout:"Ø85mm",  size:"Ø95×H30mm",   install:"崁入式",   cert:"CE",    shipping:75,  stdPrice:920,  projPrice:750,  video:"", desc:"BLADE 9W，淨高受限空間的完美解決方案。", images:["https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Light-NDB0309-C-240x300.jpg"], note:"" },
  { id:11, model:"DFB0206-C",   series:"METIS 墨提斯",        category:"崁燈",    watt:"6W",     lumen:"540lm",   cct:"3000K/4000K",             beam:"40°",             voltage:"220V",   cri:"Ra≥90", color:"白色/黑色",     cutout:"Ø75mm",  size:"Ø85×H75mm",   install:"崁入式",   cert:"CE",    shipping:75,  stdPrice:1100, projPrice:890,  video:"", desc:"METIS 系列純鋁鍛造散熱，廣角 40° 均勻照明，長壽命商業設計。", images:["https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Ceiling-Light-DFB0206-C-300x300.png"], note:"" },
  { id:12, model:"DFB0225-C",   series:"METIS 墨提斯",        category:"崁燈",    watt:"25W",    lumen:"2250lm",  cct:"3000K/4000K",             beam:"40°",             voltage:"220V",   cri:"Ra≥90", color:"白色/黑色",     cutout:"Ø175mm", size:"Ø190×H120mm", install:"崁入式",   cert:"CE",    shipping:100, stdPrice:2680, projPrice:2180, video:"", desc:"METIS 25W 大功率，2250lm 廣角，展示空間最佳選擇。", images:["https://www.ledouxlight.com/wp-content/uploads/2023/01/Led-Recessed-Ceiling-Light-DFB0225-C-1.png"], note:"" },
  { id:13, model:"TSU0506-C",   series:"EOS 奧斯",          category:"軌道燈",  watt:"6W",     lumen:"480lm",   cct:"3000K/4000K",             beam:"24°",             voltage:"220V",   cri:"Ra≥80", color:"白色/黑色",     cutout:"—",      size:"Ø60×H140mm",  install:"軌道式",   cert:"CE",    shipping:75,  stdPrice:980,  projPrice:800,  video:"", desc:"EOS 系列入門款 6W，纖薄機身整合散熱模組，輕巧適用各場合。", images:["https://www.ledouxlight.com/wp-content/uploads/2022/05/LED-Track-Light-TSU0506-C-240x300.jpg"], note:"" },
  { id:14, model:"TSU0515-C",   series:"EOS 奧斯",          category:"軌道燈",  watt:"15W",    lumen:"1350lm",  cct:"3000K/4000K",             beam:"24°",             voltage:"220V",   cri:"Ra≥80", color:"白色/黑色",     cutout:"—",      size:"Ø70×H180mm",  install:"軌道式",   cert:"CE",    shipping:90,  stdPrice:1380, projPrice:1120, video:"", desc:"EOS 15W，1350lm，精準投射，服飾與珠寶陳列專用。", images:["https://www.ledouxlight.com/wp-content/uploads/2022/05/Led-Track-Light-TSU0515-White-240x300.jpg"], note:"" },
  { id:15, model:"TSU0823-C",   series:"EOS 奧斯",          category:"軌道燈",  watt:"23W",    lumen:"2070lm",  cct:"3000K/4000K",             beam:"36°",             voltage:"220V",   cri:"Ra≥80", color:"白色/黑色",     cutout:"—",      size:"Ø80×H200mm",  install:"軌道式",   cert:"CE",    shipping:90,  stdPrice:1880, projPrice:1530, video:"", desc:"EOS 23W 大角度版，2070lm，空間氛圍渲染首選。", images:["https://www.ledouxlight.com/wp-content/uploads/2023/01/EOS-LED-Track-Light-TSU0823-C-1.png"], note:"" },
  { id:16, model:"TSU0206-1",   series:"THEIA",        category:"軌道燈",  watt:"6W",     lumen:"480lm",   cct:"3000K/4000K",             beam:"24°",             voltage:"220V",   cri:"Ra≥80", color:"白色/黑色",     cutout:"—",      size:"Ø55×H130mm",  install:"軌道式",   cert:"CE",    shipping:75,  stdPrice:980,  projPrice:800,  video:"", desc:"THEIA 系列 6W，180° 可調仰角，靈活定向照明解決方案。", images:["https://www.ledouxlight.com/wp-content/uploads/2022/05/TSU0206-1-241x300.png"], note:"" },
  { id:17, model:"TSU0212-1",   series:"THEIA",        category:"軌道燈",  watt:"12W",    lumen:"1080lm",  cct:"3000K/4000K",             beam:"24°",             voltage:"220V",   cri:"Ra≥80", color:"白色/黑色",     cutout:"—",      size:"Ø65×H160mm",  install:"軌道式",   cert:"CE",    shipping:90,  stdPrice:1280, projPrice:1040, video:"", desc:"THEIA 12W，1080lm，精品零售空間標準配置。", images:["https://www.ledouxlight.com/wp-content/uploads/2022/05/TSU0212-1-241x300.png"], note:"" },
  { id:18, model:"CSU0515-C",   series:"EOS 奧斯",          category:"吸頂燈",  watt:"15W",    lumen:"1350lm",  cct:"3000K/4000K",             beam:"36°",             voltage:"220V",   cri:"Ra≥80", color:"白色/黑色",     cutout:"—",      size:"Ø120×H80mm",  install:"吸頂式",   cert:"CE",    shipping:90,  stdPrice:1580, projPrice:1290, video:"", desc:"EOS 吸頂款，無需開孔，1350lm 廣角照明。", images:["https://www.ledouxlight.com/wp-content/uploads/2022/05/Surface-Mount-CSU0510-C-240x300.jpg"], note:"" },
  { id:19, model:"CSA0206-1",   series:"THEIA",        category:"吸頂燈",  watt:"6W",     lumen:"480lm",   cct:"3000K/4000K",             beam:"24°",             voltage:"220V",   cri:"Ra≥80", color:"白色/黑色",     cutout:"—",      size:"Ø70×H90mm",   install:"吸頂式",   cert:"CE",    shipping:75,  stdPrice:1080, projPrice:880,  video:"", desc:"THEIA 吸頂 6W，住宅走廊首選。", images:["https://www.ledouxlight.com/wp-content/uploads/2022/05/CSA0206-1-241x300.png"], note:"" },
  { id:20, model:"DC.TS0110-C", series:"DC48V 磁吸軌道", category:"磁吸系統",watt:"10W",    lumen:"921lm",   cct:"2700K/3000K/3500K/4000K", beam:"15°/25°/36°",     voltage:"48V DC", cri:"Ra≥95", color:"砂白/砂黑/金色", cutout:"—",      size:"Ø40×H100mm",  install:"磁吸嵌入", cert:"CE",    shipping:100, stdPrice:2380, projPrice:1940, video:"", desc:"48V 磁吸旗艦 10W，Honourtek 921lm，Ra≥95，無工具快速安裝。", images:["https://www.ledouxlight.com/wp-content/uploads/2022/05/48V-Led-Track-Light-DC.TS0110-C-241x300.jpg"], note:"" },
  { id:21, model:"DC.TS0120-C", series:"DC48V 磁吸軌道", category:"磁吸系統",watt:"20W",    lumen:"1734lm",  cct:"2700K/3000K/3500K/4000K", beam:"15°/25°/36°",     voltage:"48V DC", cri:"Ra≥90", color:"砂白/砂黑/金色", cutout:"—",      size:"Ø63×H120mm",  install:"磁吸嵌入", cert:"CE",    shipping:100, stdPrice:2980, projPrice:2430, video:"", desc:"20W 高輸出磁吸，1734lm，藝廊與精品空間專用。", images:["https://www.ledouxlight.com/wp-content/uploads/2022/05/48V-Led-Track-Light-DC.TS0120-C-241x300.jpg"], note:"" },
  { id:22, model:"DC.TS0130-C", series:"DC48V 磁吸軌道", category:"磁吸系統",watt:"30W",    lumen:"2251lm",  cct:"2700K/3000K/3500K/4000K", beam:"15°/25°/36°",     voltage:"48V DC", cri:"Ra≥90", color:"砂白/砂黑/金色", cutout:"—",      size:"Ø63×H160mm",  install:"磁吸嵌入", cert:"CE",    shipping:120, stdPrice:3580, projPrice:2920, video:"", desc:"30W 旗艦磁吸，2251lm 極致輸出。", images:["https://www.ledouxlight.com/wp-content/uploads/2022/05/48V-Led-Track-Light-DC.TS0130-C-241x300.jpg"], note:"" },
  { id:23, model:"DC.TS0206-C", series:"DC48V 磁吸軌道", category:"磁吸系統",watt:"6W",     lumen:"420lm",   cct:"2700K/3000K/3500K/4000K", beam:"15°/25°/36°",     voltage:"48V DC", cri:"Ra≥95", color:"砂白/砂黑",     cutout:"—",      size:"Ø35×H55mm",   install:"磁吸嵌入", cert:"CE",    shipping:90,  stdPrice:1980, projPrice:1620, video:"", desc:"入門磁吸 6W，Ra≥95，420lm，系統彈性配置理想起點。", images:["https://www.ledouxlight.com/wp-content/uploads/2022/05/48V-Led-Track-Light-DC.TS0206-C--241x300.jpg"], note:"" },
  { id:24, model:"BSB0504-C",   series:"OUTDOOR LIGHT 戶外燈具",      category:"戶外燈",  watt:"4W",     lumen:"210lm",   cct:"2700K/3000K/3500K/4000K", beam:"12°/20°/30°/40°", voltage:"DC 24V", cri:"Ra≥90", color:"黑色",          cutout:"Ø45mm",  size:"Ø50×H92.7mm", install:"插地式",   cert:"IP67",  shipping:90,  stdPrice:1680, projPrice:1360, video:"", desc:"316L 不鏽鋼插地燈 4W，Bridgelux 210lm，景觀步道首選。", images:[], note:"DC24V 供電。" },
  { id:25, model:"BSB0508-C",   series:"OUTDOOR LIGHT 戶外燈具",      category:"戶外燈",  watt:"8W",     lumen:"508lm",   cct:"2700K/3000K/3500K/4000K", beam:"12°/20°/30°/40°", voltage:"DC 24V", cri:"Ra≥90", color:"黑色",          cutout:"Ø68mm",  size:"Ø75×H123mm",  install:"插地式",   cert:"IP67",  shipping:100, stdPrice:2180, projPrice:1780, video:"", desc:"316L 不鏽鋼大功率插地燈 8W，Bridgelux 508lm，適合商業廣場景觀。", images:[], note:"DC24V 供電。" },
  { id:26, model:"ALA0011-A",   series:"鋁條燈",    category:"鋁條燈",  watt:"4.8W/m", lumen:"110lm/W", cct:"2700K/3000K/4000K/6500K", beam:"120°",            voltage:"DC 24V", cri:"Ra≥98", color:"透明",          cutout:"—",      size:"W8×H2mm/m",   install:"卡槽嵌入", cert:"IP20",  shipping:75,  stdPrice:480,  projPrice:380,  video:"", desc:"高顯色 Ra≥98 鋁條燈，色容差 <3，精緻櫃體照明首選。", images:[], note:"⚠ 單條建議最長 2m；串聯最長 5.5m。需搭配 DC 24V 恒壓電源。" },
  { id:27, model:"ALA0011-P",   series:"鋁條燈",    category:"鋁條燈",  watt:"4.8W/m", lumen:"110lm/W", cct:"2700K/3000K/4000K/6500K", beam:"120°",            voltage:"DC 24V", cri:"Ra≥98", color:"透明",          cutout:"—",      size:"W10×H4.5mm/m",install:"卡槽嵌入", cert:"IP67",  shipping:75,  stdPrice:580,  projPrice:460,  video:"", desc:"防水 IP67 版，實心矽膠擠出不翻轉，耐久性極強，適合潮濕環境。", images:[], note:"⚠ 單條建議最長 2m；串聯最長 5.5m。" },
  { id:28, model:"YODA 系列",   series:"YODA 優打",         category:"崁燈",    watt:"—",      lumen:"—",       cct:"—",                       beam:"—",               voltage:"—",      cri:"—",     color:"—",             cutout:"—",      size:"—",           install:"—",        cert:"—",     shipping:90,  stdPrice:0,    projPrice:0,    video:"", desc:"YODA 系列即將上市。此為系列佔位產品，管理員請至「產品管理」新增正式品項。", images:[], note:"新系列開發中，敬請期待。" },
];

const INIT_INVENTORY = [
  { id:"inv001", model:"HB.D110",     series:"HEPBURN 赫本",      category:"崁燈",    watt:"10W",    cct:"3000K",             color:"白色",      totalQty:24,  reservedQty:4,  availableQty:20,  location:"桃園倉 A-01", updatedAt:"2026-04-25", note:"" },
  { id:"inv002", model:"HB.D120",     series:"HEPBURN 赫本",      category:"崁燈",    watt:"20W",    cct:"3000K",             color:"白色",      totalQty:18,  reservedQty:2,  availableQty:16,  location:"桃園倉 A-02", updatedAt:"2026-04-25", note:"暢銷款" },
  { id:"inv003", model:"HB.D120",     series:"HEPBURN 赫本",      category:"崁燈",    watt:"20W",    cct:"3000K",             color:"黑色",      totalQty:12,  reservedQty:0,  availableQty:12,  location:"桃園倉 A-03", updatedAt:"2026-04-25", note:"" },
  { id:"inv004", model:"HB.D130",     series:"HEPBURN 赫本",      category:"崁燈",    watt:"30W",    cct:"3000K",             color:"白色",      totalQty:8,   reservedQty:3,  availableQty:5,   location:"桃園倉 A-04", updatedAt:"2026-04-25", note:"庫存偏低" },
  { id:"inv005", model:"HB.T130S",    series:"HEPBURN 赫本",      category:"軌道燈",  watt:"30W",    cct:"3000K",             color:"黑色",      totalQty:10,  reservedQty:0,  availableQty:10,  location:"桃園倉 B-01", updatedAt:"2026-04-25", note:"" },
  { id:"inv006", model:"NDB0306-C",   series:"BLADE 帕雷德",        category:"崁燈",    watt:"6W",     cct:"3000K/4000K",       color:"白色/黑色", totalQty:36,  reservedQty:6,  availableQty:30,  location:"桃園倉 A-05", updatedAt:"2026-04-26", note:"雙色皆有庫存" },
  { id:"inv007", model:"NDB0309-C",   series:"BLADE 帕雷德",        category:"崁燈",    watt:"9W",     cct:"3000K/4000K",       color:"白色/黑色", totalQty:24,  reservedQty:4,  availableQty:20,  location:"桃園倉 A-06", updatedAt:"2026-04-26", note:"" },
  { id:"inv008", model:"DFB0206-C",   series:"METIS 墨提斯",        category:"崁燈",    watt:"6W",     cct:"3000K",             color:"白色",      totalQty:20,  reservedQty:0,  availableQty:20,  location:"桃園倉 A-07", updatedAt:"2026-04-24", note:"" },
  { id:"inv009", model:"TSU0506-C",   series:"EOS 奧斯",          category:"軌道燈",  watt:"6W",     cct:"3000K",             color:"白色/黑色", totalQty:16,  reservedQty:0,  availableQty:16,  location:"桃園倉 B-02", updatedAt:"2026-04-24", note:"" },
  { id:"inv010", model:"TSU0515-C",   series:"EOS 奧斯",          category:"軌道燈",  watt:"15W",    cct:"3000K",             color:"白色",      totalQty:14,  reservedQty:2,  availableQty:12,  location:"桃園倉 B-03", updatedAt:"2026-04-26", note:"" },
  { id:"inv011", model:"DC.TS0110-C", series:"DC48V 磁吸軌道", category:"磁吸系統",watt:"10W",    cct:"3000K/4000K",       color:"砂白/砂黑", totalQty:20,  reservedQty:5,  availableQty:15,  location:"桃園倉 C-01", updatedAt:"2026-04-25", note:"高需求款" },
  { id:"inv012", model:"DC.TS0120-C", series:"DC48V 磁吸軌道", category:"磁吸系統",watt:"20W",    cct:"3000K",             color:"砂白",      totalQty:12,  reservedQty:2,  availableQty:10,  location:"桃園倉 C-02", updatedAt:"2026-04-25", note:"" },
  { id:"inv013", model:"DC.TS0206-C", series:"DC48V 磁吸軌道", category:"磁吸系統",watt:"6W",     cct:"2700K/3000K/4000K", color:"砂白/砂黑", totalQty:0,   reservedQty:0,  availableQty:0,   location:"—",           updatedAt:"2026-04-20", note:"補貨中，預計 5 月初到貨" },
  { id:"inv014", model:"ALA0011-A",   series:"鋁條燈",    category:"鋁條燈",  watt:"4.8W/m", cct:"3000K",             color:"透明",      totalQty:200, reservedQty:30, availableQty:170, location:"桃園倉 D-01", updatedAt:"2026-04-27", note:"計量單位：公尺" },
  { id:"inv015", model:"ALA0011-P",   series:"鋁條燈",    category:"鋁條燈",  watt:"4.8W/m", cct:"3000K",             color:"透明",      totalQty:120, reservedQty:10, availableQty:110, location:"桃園倉 D-02", updatedAt:"2026-04-27", note:"防水版，計量單位：公尺" },
  { id:"inv016", model:"HB.D120-N",   series:"HEPBURN 赫本",      category:"崁燈",    watt:"20W",    cct:"3000K/4000K",       color:"白色/黑色", totalQty:30,  reservedQty:8,  availableQty:22,  location:"桃園倉 A-08", updatedAt:"2026-04-27", note:"全系列暢銷款" },
];

// ─────────────────────────────────────────────
//  CSS
// ─────────────────────────────────────────────
const G = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Noto+Sans+TC:wght@200;300;400;500&display=swap');
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --ivory:#f7f4ef;--ivory2:#ece6dc;--blk:#0e0d0c;--blk2:#1c1a18;
  --gold:#b8935a;--gold2:#d4a96a;--muted:#8a8278;
  --bdr:#d8d0c4;--bdr2:#e8e2d8;--red:#9b3a3a;--green:#3a6b4a;
  --inv-green:#2d5a3d;--inv-green-light:#edf6f0;
}
body{background:var(--ivory);color:var(--blk);font-family:'Noto Sans TC',sans-serif;font-weight:400;-webkit-font-smoothing:antialiased;letter-spacing:.3px;font-size:14px;font-feature-settings:'tnum' 1}*{box-sizing:border-box}
.auth-page{min-height:100vh;display:grid;grid-template-columns:1fr 1fr;background:var(--blk)}
@media(max-width:768px){.auth-page{grid-template-columns:1fr}.auth-visual{display:none}}
.auth-visual{background:linear-gradient(160deg,#1a1612 0%,#0e0d0c 100%);display:flex;flex-direction:column;padding:64px;border-right:0.5px solid #2a2520;position:relative;overflow:hidden}
.auth-visual::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 30% 60%,rgba(184,147,90,.06) 0%,transparent 60%)}
.av-logo{font-family:'Cormorant Garamond',serif;font-size:12px;letter-spacing:8px;color:var(--gold);text-transform:uppercase}
.av-rule{width:32px;height:0.5px;background:var(--gold);opacity:.5;margin:auto 0 16px}
.av-title{font-family:'Cormorant Garamond',serif;font-size:34px;font-weight:300;color:#e8e0d4;letter-spacing:5px;text-transform:uppercase;line-height:1.2;margin-bottom:8px;position:relative;z-index:1}
.av-sub{font-size:8px;letter-spacing:5px;color:#3a3028;text-transform:uppercase;position:relative;z-index:1}
.auth-form-side{background:var(--ivory);display:flex;align-items:center;justify-content:center;padding:48px 32px}
.auth-inner{width:100%;max-width:380px}
.auth-logo-sm{font-family:'Cormorant Garamond',serif;font-size:21px;letter-spacing:5px;color:var(--blk);margin-bottom:3px}
.auth-tagline{font-size:8px;letter-spacing:4px;color:var(--muted);text-transform:uppercase;margin-bottom:40px}
.lf{margin-bottom:20px}
.lf label{display:block;font-size:8px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:8px}
.lf input{width:100%;padding:11px 0;background:transparent;border:none;border-bottom:0.5px solid var(--bdr);color:var(--blk);font-family:'Noto Sans TC',sans-serif;font-size:13px;outline:none;transition:border-color .2s;border-radius:0}
.lf input:focus{border-bottom-color:var(--gold)}
.lf input::placeholder{color:var(--bdr)}
.ferr{font-size:10px;color:var(--red);margin-top:4px}
.req{color:var(--gold);margin-left:2px}
.sec-lbl{font-size:8px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);text-align:center;margin:22px 0 18px;position:relative}
.sec-lbl::before,.sec-lbl::after{content:'';position:absolute;top:50%;width:28%;height:0.5px;background:var(--bdr2)}
.sec-lbl::before{left:0}.sec-lbl::after{right:0}
.btn-primary{width:100%;padding:13px;background:var(--blk);border:none;color:var(--ivory);font-family:'Noto Sans TC',sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;cursor:pointer;transition:background .2s;margin-top:6px}
.btn-primary:hover{background:var(--blk2)}
.btn-primary:disabled{opacity:.4;cursor:not-allowed}
.auth-err{font-size:10px;color:var(--red);text-align:center;margin-top:12px}
.btn-outline{padding:11px 28px;background:transparent;border:0.5px solid var(--blk);color:var(--blk);font-family:'Noto Sans TC',sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;cursor:pointer;margin-top:26px;transition:all .2s}
.btn-outline:hover{background:var(--blk);color:var(--ivory)}
.app{min-height:100vh;background:var(--ivory);display:flex;flex-direction:column}
.topnav{background:var(--blk);color:var(--ivory);display:flex;align-items:center;justify-content:space-between;padding:0 28px;height:52px;position:sticky;top:0;z-index:50;border-bottom:0.5px solid #1e1c18}
.tn-left{display:flex;align-items:center;gap:18px;flex:1}
.tn-burger{background:none;border:none;cursor:pointer;display:flex;flex-direction:column;gap:5px;padding:4px;color:#6a5a4a;transition:color .2s}
.tn-burger:hover{color:var(--gold)}
.tn-burger span{display:block;width:20px;height:0.5px;background:currentColor}
.tn-logo{font-family:'Cormorant Garamond',serif;font-size:14px;letter-spacing:7px;color:var(--gold);text-transform:uppercase;white-space:nowrap}
.tn-right{display:flex;align-items:center;gap:16px;flex-shrink:0}
.tn-user-info{text-align:right}
.tn-uname{font-size:10px;color:var(--ivory);letter-spacing:.5px}
.tn-ucomp{font-size:8px;color:#4a3a2a;letter-spacing:.5px;margin-top:1px}
.tn-badge{font-size:7px;padding:2px 8px;border:0.5px solid;letter-spacing:2px;text-transform:uppercase}
.tb-admin{color:#c45a5a;border-color:rgba(196,90,90,.4)}
.tb-vip{color:var(--gold);border-color:rgba(184,147,90,.4)}
.tb-std{color:#6a5a4a;border-color:#3a3530}
.btn-signout{padding:5px 12px;background:transparent;border:0.5px solid #2a2520;color:#5a4a3a;font-family:'Noto Sans TC',sans-serif;font-size:8px;letter-spacing:3px;cursor:pointer;transition:all .2s;text-transform:uppercase}
.btn-signout:hover{border-color:#9b3a3a;color:#9b3a3a}
.tn-icon{position:relative;background:none;border:none;color:#5a4a3a;cursor:pointer;padding:7px;display:flex;align-items:center;justify-content:center;transition:color .2s}
.tn-icon:hover{color:var(--gold)}
.tn-icon.inv-icon{color:#3a6b4a}
.tn-icon.inv-icon:hover{color:#5a9b6a}
.tn-ibadge{position:absolute;top:2px;right:2px;background:var(--gold);color:var(--blk);font-size:7px;border-radius:50%;width:13px;height:13px;display:flex;align-items:center;justify-content:center;font-weight:500;letter-spacing:0}
.tn-ibadge.red{background:var(--red);color:#fff}
.tn-ibadge.green{background:var(--inv-green);color:#fff}
.sync-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;transition:background .3s}
.sync-dot.off{background:#3a3028}
.sync-dot.loading{background:var(--gold);animation:pulse 1s infinite}
.sync-dot.ok{background:#3a6b4a}
.sync-label{font-size:8px;color:#4a4038;letter-spacing:1px}
.search-wrap{position:relative;flex:1;max-width:300px}
.search-inp{width:100%;padding:6px 12px 6px 28px;background:transparent;border:none;border-bottom:0.5px solid #2a2520;color:var(--ivory);font-family:'Noto Sans TC',sans-serif;font-size:10px;outline:none;transition:border-color .2s;letter-spacing:2px;text-transform:uppercase}
.search-inp:focus{border-bottom-color:var(--gold)}
.search-inp::placeholder{color:#3a3028;font-size:9px;letter-spacing:3px}
.s-icon{position:absolute;left:0;top:50%;transform:translateY(-50%);color:#4a4038;pointer-events:none}
.s-clear{position:absolute;right:0;top:50%;transform:translateY(-50%);background:none;border:none;color:#4a4038;cursor:pointer;display:flex;padding:3px}
.s-clear:hover{color:var(--ivory)}
.s-drop{position:absolute;top:calc(100% + 8px);left:0;right:0;background:#1a1814;border:0.5px solid #2a2520;z-index:200;max-height:280px;overflow-y:auto}
.sd-sec{padding:7px 12px 3px;font-size:7px;letter-spacing:4px;text-transform:uppercase;color:#3a3028}
.sd-item{padding:8px 12px;font-size:11px;color:#7a6a5a;cursor:pointer;transition:all .15s;letter-spacing:.3px}
.sd-item:hover{background:#221a14;color:var(--ivory)}
.sd-item.hot{color:var(--gold)}
.sidemenu-overlay{position:fixed;inset:0;background:rgba(14,13,12,.55);z-index:100}
.sidemenu{position:fixed;top:0;left:0;bottom:0;width:270px;background:var(--blk);z-index:101;display:flex;flex-direction:column;transform:translateX(-100%);transition:transform .3s cubic-bezier(.4,0,.2,1)}
.sidemenu.open{transform:translateX(0)}
.sm-head{padding:18px 22px;border-bottom:0.5px solid #1e1c18;display:flex;align-items:center;justify-content:space-between}
.sm-logo{font-family:'Cormorant Garamond',serif;font-size:12px;letter-spacing:7px;color:var(--gold)}
.sm-close-btn{background:none;border:none;cursor:pointer;color:#5a4a3a;display:flex;padding:3px;transition:color .2s}
.sm-close-btn:hover{color:var(--ivory)}
.sm-user{padding:16px 22px;border-bottom:0.5px solid #2a2820}
.sm-uname{font-size:12px;color:var(--ivory);font-weight:400}
.sm-ucomp{font-size:9px;color:#6a5a4a;margin-top:2px}
.sm-ubadge{font-size:7px;padding:2px 8px;border:0.5px solid;letter-spacing:2px;text-transform:uppercase;display:inline-block;margin-top:7px}
.sm-nav{flex:1;padding:10px 0;overflow-y:auto}
.sm-sec{padding:9px 22px 3px;font-size:7px;letter-spacing:5px;text-transform:uppercase;color:#4a3a2a}
.sm-item{display:flex;align-items:center;justify-content:space-between;padding:10px 22px;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#9a8a7a;cursor:pointer;transition:all .15s;border-left:1px solid transparent}
.sm-item:hover{color:var(--ivory);background:#181614}
.sm-item.on{color:var(--gold);border-left-color:var(--gold);background:rgba(184,147,90,.05)}
.sm-item.inv{color:#5a9b6a}
.sm-item.inv:hover{color:#8acc8a;background:#0a140d}
.sm-item.inv.on{color:#5a9b6a;border-left-color:#3a6b4a;background:rgba(58,107,74,.08)}
.sm-item.cat-item{color:#9a7a5a}
.sm-item.cat-item:hover{color:#c4a060;background:#160e06}
.sm-item.cat-item.on{color:var(--gold);border-left-color:var(--gold);background:rgba(184,147,90,.08)}
.sm-group-hd{display:flex;align-items:center;justify-content:space-between;padding:8px 22px;font-size:8px;letter-spacing:3px;text-transform:uppercase;color:#5a4a3a;cursor:pointer}
.sm-group-hd:hover{color:#9a8a7a}
.sm-group-arrow{font-size:9px;transition:transform .2s;display:inline-block}
.sm-group-arrow.open{transform:rotate(90deg)}
.sm-sub{display:flex;align-items:center;padding:7px 22px 7px 34px;font-size:9px;letter-spacing:1px;color:#6a5a4a;cursor:pointer;transition:all .15s}
.sm-sub:hover{color:#b8a890}
.sm-sub.on{color:var(--gold)}
.sm-dot{width:3px;height:3px;border-radius:50%;background:currentColor;margin-right:9px;opacity:.5;flex-shrink:0}
.sm-badge{min-width:15px;height:15px;background:#9b3a3a;color:#fff;font-size:8px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0 4px;letter-spacing:0}
.sm-badge.green{background:#2d5a3d}
.sm-badge.gold{background:var(--gold);color:var(--blk)}
.sm-divider{height:0.5px;background:#1e1c18;margin:7px 22px}
.sm-foot{padding:14px 22px;border-top:0.5px solid #1e1c18}
.btn-sm-out{width:100%;padding:9px;background:transparent;border:0.5px solid #2a2520;color:#5a4a3a;font-family:'Noto Sans TC',sans-serif;font-size:8px;letter-spacing:4px;text-transform:uppercase;cursor:pointer;transition:all .2s}
.btn-sm-out:hover{border-color:#9b3a3a;color:#9b3a3a}
.content{flex:1;padding:48px;max-width:1400px;margin:0 auto;width:100%}
@media(max-width:768px){.content{padding:24px 16px}}
.phead{margin-bottom:36px;display:flex;align-items:flex-end;justify-content:space-between;border-bottom:0.5px solid var(--bdr2);padding-bottom:22px;flex-wrap:wrap;gap:12px}
.ptitle{font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:300;color:var(--blk);line-height:1;letter-spacing:.5px}
.psub{font-size:8px;letter-spacing:3px;color:var(--muted);text-transform:uppercase;margin-top:7px}
.catbar{display:flex;margin-bottom:0;border-bottom:0.5px solid var(--bdr2);overflow-x:auto}
.catbtn{padding:10px 20px;background:transparent;border:none;border-bottom:1px solid transparent;color:var(--muted);font-family:'Noto Sans TC',sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;white-space:nowrap;margin-bottom:-0.5px;transition:all .2s}
.catbtn:hover{color:var(--blk)}
.catbtn.on{color:var(--blk);border-bottom-color:var(--gold)}
.filter-area{padding:14px 0 18px;margin-bottom:18px;border-bottom:0.5px solid var(--bdr2)}
.filter-row{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;align-items:center}
.filter-row-label{font-size:7px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);margin-right:4px;flex-shrink:0;min-width:40px}
.filter-tag{padding:4px 12px;border:0.5px solid var(--bdr);background:transparent;color:var(--muted);font-family:'Noto Sans TC',sans-serif;font-size:8px;letter-spacing:1px;cursor:pointer;transition:all .15s;white-space:nowrap}
.filter-tag:hover{border-color:var(--gold);color:var(--blk)}
.filter-tag.on{background:var(--blk);border-color:var(--blk);color:var(--ivory)}
.filter-active-bar{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px;align-items:center}
.filter-chip{display:inline-flex;align-items:center;gap:5px;background:#f4efe8;border:0.5px solid var(--gold);padding:3px 9px;font-size:8px;color:var(--gold);letter-spacing:1px}
.filter-chip-x{background:none;border:none;cursor:pointer;color:var(--gold);font-size:11px;line-height:1;padding:0;display:flex;align-items:center}
.filter-clear{font-size:8px;letter-spacing:1px;color:var(--muted);background:none;border:none;cursor:pointer;text-decoration:underline;padding:0}
.filter-clear:hover{color:var(--red)}
/* ── 設計公司專案提示橫幅 ── */
.proj-banner{background:#f9f5ee;border:0.5px solid var(--gold);border-left:2px solid var(--gold);padding:12px 16px;margin-bottom:20px;font-size:11px;color:var(--gold);line-height:1.8}
.proj-banner-link{color:var(--gold);text-decoration:underline;cursor:pointer;margin:0 3px}
.pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1px;background:var(--bdr2);border:0.5px solid var(--bdr2)}
.pcard{background:var(--ivory);cursor:pointer;transition:background .2s;display:flex;flex-direction:column;position:relative}
.pcard:hover{background:#f2ece3}
.pcard:hover .pcard-img img{transform:scale(1.03)}
.pcard-stock-badge{position:absolute;top:10px;left:10px;background:#2d5a3d;color:#fff;font-size:7px;letter-spacing:2px;padding:3px 8px;text-transform:uppercase;z-index:2;display:flex;align-items:center;gap:4px}
.pcard-stock-dot{width:5px;height:5px;border-radius:50%;background:#6acc8a;animation:pulse 2s infinite}
.pcard-img{height:175px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#f0ebe2}
.pcard-img img{max-height:150px;max-width:80%;object-fit:contain;transition:transform .5s ease}
.pcard-body{padding:17px 19px 21px;flex:1;display:flex;flex-direction:column}
.pcard-series{font-size:7px;letter-spacing:4px;text-transform:uppercase;color:var(--gold);margin-bottom:4px}
.pcard-model{font-size:16px;font-family:'Cormorant Garamond',serif;font-weight:400;color:var(--blk);margin-bottom:5px}
.pcard-desc{font-size:13px;color:var(--muted);line-height:1.7;margin-bottom:10px;flex:1}
.pcard-tags{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px}
.ptag{font-size:8px;padding:2px 7px;border:0.5px solid var(--bdr);color:var(--muted);letter-spacing:.5px}
.ptag.stag{color:#3a6b4a;border-color:rgba(58,107,74,.4)}
.pcard-price{border-top:0.5px solid var(--bdr2);padding-top:11px}
.price-val{font-family:'Cormorant Garamond',serif;font-size:18px;color:var(--blk)}
.price-val.gold{color:var(--gold)}
.price-nq{font-size:8px;color:var(--muted);letter-spacing:2px;text-transform:uppercase}
.drawer-overlay{position:fixed;inset:0;background:rgba(14,13,12,.5);z-index:200;display:flex;justify-content:flex-end}
.drawer{width:490px;max-width:95vw;background:var(--ivory);height:100vh;overflow-y:auto;display:flex;flex-direction:column;box-shadow:-16px 0 48px rgba(0,0,0,.1)}
.drawer-top{padding:22px 26px;border-bottom:0.5px solid var(--bdr2);display:flex;justify-content:space-between;align-items:center}
.drawer-series{font-size:8px;letter-spacing:4px;text-transform:uppercase;color:var(--gold)}
.close-btn{background:none;border:none;cursor:pointer;color:var(--muted);display:flex;padding:3px;transition:color .2s}
.close-btn:hover{color:var(--blk)}
.car{position:relative;height:255px;background:#f0ebe2;overflow:hidden;display:flex;align-items:center;justify-content:center}
.car img{max-height:225px;object-fit:contain}
.car-btn{position:absolute;top:50%;transform:translateY(-50%);background:rgba(14,13,12,.2);border:none;color:#fff;width:26px;height:26px;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;transition:background .2s}
.car-btn:hover{background:rgba(14,13,12,.6)}
.car-prev{left:7px}.car-next{right:7px}
.car-dots{position:absolute;bottom:7px;left:50%;transform:translateX(-50%);display:flex;gap:5px}
.cdot{width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,.4);cursor:pointer}
.cdot.on{background:#fff}
.drawer-body{padding:26px;flex:1}
.drawer-model{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:300;margin-bottom:5px;letter-spacing:.5px}
.drawer-desc{font-size:13px;color:var(--muted);line-height:1.8;margin-bottom:16px}
.inv-badge-drawer{display:inline-flex;align-items:center;gap:6px;background:#edf6f0;border:0.5px solid #3a6b4a;padding:5px 12px;margin-bottom:14px;font-size:9px;color:#2d5a3d;letter-spacing:2px;text-transform:uppercase}
.inv-badge-dot{width:6px;height:6px;border-radius:50%;background:#3a6b4a;animation:pulse 2s infinite}
.spec-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:18px}
.spec-item{border:0.5px solid var(--bdr2);padding:8px 11px}
.spec-label{font-size:7px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:3px}
.spec-val{font-size:13px;color:var(--blk)}
.drawer-note{background:#f4efe8;border-left:1px solid var(--gold);padding:9px 12px;font-size:13px;color:var(--muted);line-height:1.7;margin-bottom:16px}
.price-block{border-top:0.5px solid var(--bdr2);padding-top:16px;margin-bottom:16px}
.pb-label{font-size:8px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);margin-bottom:3px}
.pb-val{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:300}
.pb-val.gold{color:var(--gold)}
.pb-nq{font-size:11px;color:var(--muted)}
.drawer-actions{display:flex;gap:8px;flex-wrap:wrap}
.btn-cart{flex:1;padding:11px;background:var(--blk);border:none;color:var(--ivory);font-family:'Noto Sans TC',sans-serif;font-size:9px;letter-spacing:3px;cursor:pointer;transition:background .2s;text-transform:uppercase;min-width:100px}
.btn-cart:hover{background:var(--blk2)}
.btn-cart.vip{background:var(--gold);color:var(--blk)}
.btn-cart.vip:hover{background:var(--gold2)}
.btn-samp{flex:1;padding:11px;background:transparent;border:0.5px solid var(--gold);color:var(--gold);font-family:'Noto Sans TC',sans-serif;font-size:9px;letter-spacing:3px;cursor:pointer;transition:all .2s;text-transform:uppercase;min-width:100px}
.btn-samp:hover{background:var(--gold);color:var(--blk)}
.btn-samp.done{border-color:var(--green);color:var(--green);cursor:default}
.side-panel{position:fixed;top:0;right:0;bottom:0;width:450px;max-width:100vw;background:var(--ivory);z-index:250;box-shadow:-16px 0 48px rgba(0,0,0,.1);display:flex;flex-direction:column;transform:translateX(100%);transition:transform .3s cubic-bezier(.4,0,.2,1)}
.side-panel.open{transform:translateX(0)}
.sp-head{padding:20px 24px;border-bottom:0.5px solid var(--bdr2);display:flex;justify-content:space-between;align-items:center;flex-shrink:0}
.sp-title{font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:300;letter-spacing:.5px}
.sp-body{flex:1;overflow-y:auto;padding:18px 24px}
.sp-foot{padding:16px 24px;border-top:0.5px solid var(--bdr2);flex-shrink:0}
.ci-row{display:flex;gap:9px;padding:13px 0;border-bottom:0.5px solid var(--bdr2);align-items:flex-start}
.ci-img{width:48px;height:48px;background:#f0ebe2;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ci-img img{max-width:40px;max-height:40px;object-fit:contain}
.ci-info{flex:1;min-width:0}
.ci-model{font-family:'Cormorant Garamond',serif;font-size:15px;font-weight:400}
.ci-sub{font-size:11px;color:var(--muted);margin-top:1px}
.ci-qty{display:flex;align-items:center;gap:6px;margin-top:6px}
.qty-btn{width:20px;height:20px;border:0.5px solid var(--bdr);background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--blk)}
.qty-btn:hover{border-color:var(--gold)}
.ci-price{font-family:'Cormorant Garamond',serif;font-size:13px;white-space:nowrap}
.ci-del{background:none;border:none;cursor:pointer;color:var(--muted);display:flex;align-items:center;padding:3px;flex-shrink:0}
.ci-del:hover{color:var(--red)}
.cart-total{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px}
.cart-total-lbl{font-size:8px;letter-spacing:3px;text-transform:uppercase;color:var(--muted)}
.cart-total-val{font-family:'Cormorant Garamond',serif;font-size:20px}
.warn-ship{font-size:10px;color:var(--red);margin-bottom:9px}
.checklist{background:#f4efe8;border:0.5px solid var(--bdr2);padding:12px;margin-bottom:10px}
.cl-title{font-size:10px;font-weight:400;margin-bottom:7px}
.cl-item{display:flex;align-items:flex-start;gap:6px;margin-bottom:6px;font-size:10px;color:var(--muted);line-height:1.6;cursor:pointer}
.cl-item input[type=checkbox]{margin-top:2px;accent-color:var(--gold);flex-shrink:0}
.cp-project label{display:block;font-size:8px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);margin-bottom:5px}
.cp-project input{width:100%;padding:9px;border:0.5px solid var(--bdr);background:transparent;font-family:'Noto Sans TC',sans-serif;font-size:12px;outline:none;margin-bottom:9px}
.cp-project input:focus{border-color:var(--gold)}
.btn-pdf{width:100%;padding:12px;background:var(--blk);border:none;color:var(--ivory);font-family:'Noto Sans TC',sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;cursor:pointer;transition:background .2s}
.btn-pdf:hover{background:var(--blk2)}
.btn-pdf:disabled{opacity:.4;cursor:not-allowed}
.sp-notice{background:#f4efe8;border-left:1px solid var(--gold);padding:9px 12px;font-size:13px;color:var(--muted);line-height:1.7;margin-bottom:14px}
.samp-item{display:flex;align-items:center;gap:9px;padding:9px 0;border-bottom:0.5px solid var(--bdr2)}
.samp-item-img{width:38px;height:38px;background:#f0ebe2;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.samp-item-img img{max-width:32px;max-height:32px;object-fit:contain}
.samp-item-info{flex:1}
.samp-item-model{font-size:12px;font-weight:400}
.samp-item-sub{font-size:9px;color:var(--muted);margin-top:1px}
.samp-item-del{background:none;border:none;cursor:pointer;color:var(--muted);display:flex;padding:3px}
.samp-item-del:hover{color:var(--red)}
.sp-form label{display:block;font-size:8px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:5px;margin-top:12px}
.sp-form input,.sp-form textarea{width:100%;padding:9px;border:0.5px solid var(--bdr);background:transparent;font-family:'Noto Sans TC',sans-serif;font-size:12px;outline:none;transition:border-color .2s}
.sp-form input:focus,.sp-form textarea:focus{border-color:var(--gold)}
.btn-gold{width:100%;padding:12px;background:var(--gold);border:none;color:var(--blk);font-family:'Noto Sans TC',sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;cursor:pointer;transition:background .2s;margin-bottom:7px}
.btn-gold:hover{background:var(--gold2)}
.btn-gold:disabled{opacity:.4;cursor:not-allowed}
.btn-ghost{width:100%;padding:10px;background:transparent;border:0.5px solid var(--bdr);color:var(--muted);font-family:'Noto Sans TC',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;cursor:pointer}
.inst-hint{background:#f4efe8;border-left:1px solid var(--gold);padding:9px 12px;font-size:13px;color:var(--muted);line-height:1.7;margin-bottom:16px}
.ip-sec-title{font-size:8px;letter-spacing:4px;text-transform:uppercase;color:var(--muted);margin-bottom:9px;padding-bottom:7px;border-bottom:0.5px solid var(--bdr2)}
.region-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:4px}
.region-card{border:0.5px solid var(--bdr2);padding:9px;cursor:pointer;transition:all .2s;position:relative}
.region-card:hover{border-color:var(--gold);background:#f9f5ee}
.region-card.on{border-color:var(--gold);background:#f4efe8}
.region-card.on::after{content:'✓';position:absolute;top:5px;right:7px;color:var(--gold);font-size:10px}
.rc-label{font-size:10px;font-weight:400;margin-bottom:1px}
.rc-km{font-size:8px;color:var(--muted);letter-spacing:.5px;margin-bottom:2px}
.rc-fee{font-family:'Cormorant Garamond',serif;font-size:13px;color:var(--gold);margin-top:2px}
.rc-free{font-size:9px;color:var(--green);margin-top:1px}
.group-row{display:flex;align-items:center;gap:7px;margin-bottom:7px;padding:8px 9px;background:#f4efe8;border:0.5px solid var(--bdr2)}
.gr-sel{flex:1;padding:5px;border:0.5px solid var(--bdr);background:transparent;font-family:'Noto Sans TC',sans-serif;font-size:10px;outline:none}
.gr-qty{width:52px;padding:5px;border:0.5px solid var(--bdr);background:transparent;font-family:'Noto Sans TC',sans-serif;font-size:12px;text-align:center;outline:none}
.calc-box{background:var(--blk);color:var(--ivory);padding:16px;margin-top:14px}
.calc-row{display:flex;justify-content:space-between;font-size:11px;padding:5px 0;border-bottom:0.5px solid #2a2520;letter-spacing:.3px}
.calc-row.total{border-bottom:none;font-size:14px;color:var(--gold);margin-top:4px;padding-top:7px}
.calc-warn{font-size:10px;color:#c45a5a;margin-top:5px;line-height:1.6}
.stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--bdr2);border:0.5px solid var(--bdr2);margin-bottom:28px}
.stat-box{background:var(--ivory);padding:20px 22px}
.stat-num{font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:300}
.stat-lbl{font-size:8px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);margin-top:3px}
.tbl-wrap{border:0.5px solid var(--bdr2);overflow:auto;margin-bottom:18px}
table{width:100%;border-collapse:collapse;min-width:500px}
th{text-align:left;font-size:7px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);padding:9px 12px;border-bottom:0.5px solid var(--bdr2);background:#f4efe8;font-weight:400}
td{padding:10px 12px;border-bottom:0.5px solid var(--bdr2);font-size:13px;font-variant-numeric:tabular-nums}
tr:last-child td{border-bottom:none}
tr:hover td{background:#f7f2eb}
.rb{font-size:7px;padding:2px 7px;letter-spacing:2px;text-transform:uppercase;border:0.5px solid;display:inline-block}
.r-admin{color:#9b3a3a;border-color:rgba(155,58,58,.4)}
.r-vip{color:var(--gold);border-color:rgba(184,147,90,.4)}
.r-std{color:var(--muted);border-color:var(--bdr)}
.role-sel{background:transparent;border:0.5px solid var(--bdr);color:var(--blk);padding:3px 6px;font-size:10px;font-family:'Noto Sans TC',sans-serif;cursor:pointer}
.btn-ok{font-size:9px;padding:4px 9px;border:0.5px solid rgba(58,107,74,.5);background:transparent;color:var(--green);cursor:pointer;letter-spacing:1px;transition:all .2s}
.btn-del2{background:none;border:none;cursor:pointer;color:var(--muted);display:flex;align-items:center;padding:3px}
.btn-del2:hover{color:var(--red)}
.btn-edit2{background:none;border:none;color:var(--muted);cursor:pointer;font-size:10px;letter-spacing:1px;text-decoration:underline}
.btn-edit2:hover{color:var(--gold)}
.btn-add2{padding:8px 16px;background:var(--blk);border:none;color:var(--ivory);font-family:'Noto Sans TC',sans-serif;font-size:8px;letter-spacing:3px;cursor:pointer;text-transform:uppercase;transition:background .2s}
.btn-add2:hover{background:var(--blk2)}
.empty{text-align:center;padding:52px;color:var(--muted);font-size:10px;letter-spacing:3px;text-transform:uppercase}
.form-panel{border:0.5px solid var(--bdr2);padding:22px;margin-bottom:18px;background:#f9f5ef}
.fp-title{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:300;margin-bottom:14px}
.fgrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.ff{}.ff.full{grid-column:1/-1}
.ff label{display:block;font-size:7px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:5px}
.ff input,.ff select,.ff textarea{width:100%;padding:9px 0;background:transparent;border:none;border-bottom:0.5px solid var(--bdr);color:var(--blk);font-family:'Noto Sans TC',sans-serif;font-size:12px;outline:none;transition:border-color .2s;resize:vertical}
.ff input:focus,.ff select:focus,.ff textarea:focus{border-bottom-color:var(--gold)}
.ff select option{background:var(--ivory)}
.form-actions{margin-top:14px;display:flex;gap:9px}
.btn-confirm{padding:9px 22px;background:var(--blk);border:none;color:var(--ivory);font-family:'Noto Sans TC',sans-serif;font-size:8px;letter-spacing:3px;cursor:pointer;text-transform:uppercase}
.btn-confirm:hover{background:var(--blk2)}
.btn-cancel-sm{padding:9px 14px;background:transparent;border:0.5px solid var(--bdr);color:var(--muted);font-family:'Noto Sans TC',sans-serif;font-size:8px;letter-spacing:2px;cursor:pointer;text-transform:uppercase}
.modal-wrap{position:fixed;inset:0;background:rgba(14,13,12,.65);z-index:300;display:flex;align-items:center;justify-content:center;padding:20px}
.modal-box{background:var(--ivory);width:100%;max-width:500px;max-height:90vh;overflow-y:auto}
.modal-head{padding:20px 24px;border-bottom:0.5px solid var(--bdr2);display:flex;justify-content:space-between;align-items:center}
.modal-title{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:300}
.modal-body{padding:22px}
.hint-box{background:#f4efe8;border-left:1px solid var(--gold);padding:9px 12px;font-size:13px;color:var(--muted);line-height:1.7;margin-bottom:14px}
.install-tbl{width:100%;border-collapse:collapse;margin-bottom:14px;font-size:11px}
.install-tbl th{background:#f4efe8;padding:7px 10px;text-align:left;font-size:7px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);border-bottom:0.5px solid var(--bdr2);font-weight:400}
.install-tbl td{padding:9px 10px;border-bottom:0.5px solid var(--bdr2);vertical-align:top}
.install-tbl tr:last-child td{border-bottom:none}
.toast{position:fixed;bottom:26px;right:26px;background:var(--blk);color:var(--ivory);padding:11px 18px;font-size:10px;letter-spacing:2px;z-index:999;border-left:1px solid var(--gold);pointer-events:none}
/* 庫存 */
.inv-hero{background:linear-gradient(135deg,#0a120d 0%,#0e1a12 50%,#0a140e 100%);padding:40px 48px;margin:-48px -48px 36px;position:relative;overflow:hidden}
.inv-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 70% 50%,rgba(58,107,74,.15) 0%,transparent 60%)}
.inv-hero-badge{display:inline-flex;align-items:center;gap:7px;background:rgba(58,107,74,.2);border:0.5px solid rgba(58,107,74,.5);padding:5px 14px;margin-bottom:16px;font-size:7px;color:#6acc8a;letter-spacing:4px;text-transform:uppercase}
.inv-hero-bdot{width:6px;height:6px;border-radius:50%;background:#4acc6a;animation:pulse 1.5s infinite}
.inv-hero-title{font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:300;color:#e8f0ea;letter-spacing:2px;margin-bottom:6px;position:relative;z-index:1}
.inv-hero-sub{font-size:9px;color:#3a5a40;letter-spacing:4px;text-transform:uppercase;margin-bottom:24px}
.inv-hero-desc{font-size:13px;color:#6a8a70;line-height:1.9;max-width:520px;position:relative;z-index:1}
.inv-hero-desc strong{color:#8acc8a}
.inv-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(58,107,74,.2);border:0.5px solid rgba(58,107,74,.2);margin:28px 0}
.inv-stat{background:var(--ivory);padding:18px 20px}
.inv-stat-num{font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:300;color:var(--inv-green)}
.inv-stat-lbl{font-size:7px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);margin-top:2px}
.inv-catbar{display:flex;margin-bottom:24px;border-bottom:0.5px solid var(--bdr2);overflow-x:auto}
.inv-catbtn{padding:8px 18px;background:transparent;border:none;border-bottom:1px solid transparent;color:var(--muted);font-family:'Noto Sans TC',sans-serif;font-size:8px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;white-space:nowrap;margin-bottom:-0.5px;transition:all .2s}
.inv-catbtn:hover{color:var(--inv-green)}
.inv-catbtn.on{color:var(--inv-green);border-bottom-color:var(--inv-green)}
.inv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1px;background:var(--bdr2);border:0.5px solid var(--bdr2);margin-bottom:28px}
.inv-card{background:var(--ivory);padding:18px 20px;display:flex;flex-direction:column;gap:10px}
.inv-card:hover{background:#f2ece3}
.inv-card-top{display:flex;justify-content:space-between;align-items:flex-start}
.inv-card-model{font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:400}
.inv-card-series{font-size:7px;letter-spacing:3px;text-transform:uppercase;color:var(--gold);margin-top:2px}
.inv-status{font-size:7px;padding:2px 8px;letter-spacing:2px;text-transform:uppercase;border:0.5px solid}
.inv-status.in-stock{color:#3a6b4a;border-color:rgba(58,107,74,.4);background:#edf6f0}
.inv-status.low{color:#8a6a2a;border-color:rgba(138,106,42,.4);background:#fdf7ed}
.inv-status.out{color:var(--red);border-color:rgba(155,58,58,.4);background:#fdf0f0}
.inv-specs{display:flex;gap:5px;flex-wrap:wrap}
.inv-spec-tag{font-size:8px;padding:2px 7px;border:0.5px solid var(--bdr);color:var(--muted)}
.inv-qty-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;border:0.5px solid var(--bdr2);padding:10px}
.inv-qty-cell{text-align:center}
.inv-qty-num{font-family:'Cormorant Garamond',serif;font-size:20px;color:var(--blk)}
.inv-qty-num.avail{color:var(--inv-green)}
.inv-qty-lbl{font-size:7px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-top:2px}
.inv-card-footer{display:flex;justify-content:space-between;align-items:center;border-top:0.5px solid var(--bdr2);padding-top:10px}
.inv-location{font-size:11px;color:var(--muted);letter-spacing:.5px}
.inv-updated{font-size:9px;color:var(--muted)}
.btn-inv-cart{padding:6px 14px;background:var(--inv-green);border:none;color:#fff;font-family:'Noto Sans TC',sans-serif;font-size:8px;letter-spacing:2px;cursor:pointer;text-transform:uppercase;transition:background .2s}
.btn-inv-cart:hover{background:#2d5a3d}
.btn-inv-cart:disabled{opacity:.4;cursor:not-allowed;background:var(--muted)}
.inv-note{font-size:12px;color:var(--muted);background:#f4efe8;padding:6px 9px;border-left:2px solid var(--gold);line-height:1.6}
.inv-admin-tbl input[type=number]{width:70px;padding:4px 6px;border:0.5px solid var(--bdr);background:var(--ivory);font-family:'Noto Sans TC',sans-serif;font-size:12px;text-align:center;outline:none}
.inv-admin-tbl input[type=number]:focus{border-color:var(--gold)}
.btn-save-inv{font-size:8px;padding:4px 10px;border:0.5px solid rgba(58,107,74,.5);background:transparent;color:var(--green);cursor:pointer;letter-spacing:1px;white-space:nowrap}
.btn-save-inv:hover{background:#edf6f0}
.cloud-status{display:flex;align-items:center;gap:10px;padding:12px 16px;background:#f4efe8;border:0.5px solid var(--bdr2);margin-bottom:20px}
.cloud-url-inp{width:100%;padding:10px;border:0.5px solid var(--bdr);background:transparent;font-family:monospace;font-size:11px;outline:none;transition:border-color .2s;margin-bottom:10px}
.cloud-url-inp:focus{border-color:var(--gold)}
/* 電子型錄 */
.cat-hero{background:linear-gradient(150deg,#0e0b08 0%,#1a1410 40%,#0e0d0c 100%);padding:52px 48px;margin:-48px -48px 44px;position:relative;overflow:hidden}
.cat-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 80% 30%,rgba(184,147,90,.09) 0%,transparent 55%),radial-gradient(ellipse at 20% 70%,rgba(184,147,90,.05) 0%,transparent 45%)}
.cat-hero-eyebrow{display:inline-flex;align-items:center;gap:10px;margin-bottom:20px;position:relative;z-index:1}
.cat-hero-line{width:32px;height:0.5px;background:var(--gold);opacity:.6}
.cat-hero-eyebrow-txt{font-size:7px;letter-spacing:6px;text-transform:uppercase;color:var(--gold)}
.cat-hero-title{font-family:'Cormorant Garamond',serif;font-size:44px;font-weight:300;color:#e8e0d4;letter-spacing:3px;line-height:1.1;margin-bottom:10px;position:relative;z-index:1}
.cat-hero-title em{font-style:italic;color:var(--gold)}
.cat-hero-sub{font-size:9px;letter-spacing:5px;text-transform:uppercase;color:#4a3a28;margin-bottom:22px}
.cat-hero-desc{font-size:13px;color:#7a6a5a;line-height:1.9;max-width:500px;position:relative;z-index:1}
.cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:1px;background:var(--bdr2);border:0.5px solid var(--bdr2);margin-bottom:40px}
.cat-card{background:var(--ivory);display:flex;flex-direction:column;animation:fadeUp .4s ease both}
.cat-card:nth-child(2){animation-delay:.08s}
.cat-cover{height:200px;position:relative;overflow:hidden;display:flex;align-items:flex-end;padding:22px 24px;cursor:pointer}
.cat-cover-bg{position:absolute;inset:0;transition:transform .5s ease}
.cat-card:hover .cat-cover-bg{transform:scale(1.02)}
.cat-cover-deco{position:absolute;top:22px;right:22px;width:60px;height:60px;border:0.5px solid;border-radius:50%;opacity:.15}
.cat-cover-deco2{position:absolute;top:32px;right:32px;width:40px;height:40px;border:0.5px solid;border-radius:50%;opacity:.08}
.cat-cover-lines{position:absolute;inset:0;background:repeating-linear-gradient(-45deg,transparent,transparent 40px,rgba(255,255,255,.015) 40px,rgba(255,255,255,.015) 41px)}
.cat-cover-content{position:relative;z-index:1}
.cat-cover-edition{font-size:7px;letter-spacing:4px;text-transform:uppercase;margin-bottom:6px}
.cat-cover-title{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:300;letter-spacing:1px;color:#e8e0d4;line-height:1.2;margin-bottom:2px}
.cat-cover-sub{font-size:7px;letter-spacing:5px;text-transform:uppercase;color:rgba(232,224,212,.4)}
.cat-body{padding:22px 24px;flex:1;display:flex;flex-direction:column;gap:12px}
.cat-desc{font-size:12px;color:var(--muted);line-height:1.8}
.cat-tags{display:flex;gap:5px;flex-wrap:wrap}
.cat-tag{font-size:8px;padding:3px 9px;border:0.5px solid var(--bdr);color:var(--muted);letter-spacing:.5px}
.cat-meta{display:flex;gap:16px;border-top:0.5px solid var(--bdr2);padding-top:12px}
.cat-meta-item{display:flex;flex-direction:column;gap:2px}
.cat-meta-lbl{font-size:7px;letter-spacing:2px;text-transform:uppercase;color:var(--muted)}
.cat-meta-val{font-family:'Cormorant Garamond',serif;font-size:14px;color:var(--blk)}
.cat-actions{padding:16px 24px;border-top:0.5px solid var(--bdr2);display:flex;gap:8px}
.btn-cat-preview{flex:1;padding:10px;background:var(--blk);border:none;color:var(--ivory);font-family:'Noto Sans TC',sans-serif;font-size:8px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;transition:background .2s;display:flex;align-items:center;justify-content:center;gap:6px}
.btn-cat-preview:hover{background:var(--blk2)}
.btn-cat-preview:disabled{opacity:.35;cursor:not-allowed}
.btn-cat-dl{padding:10px 16px;background:transparent;border:0.5px solid var(--gold);color:var(--gold);font-family:'Noto Sans TC',sans-serif;font-size:8px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:5px;text-decoration:none}
.btn-cat-dl:hover{background:var(--gold);color:var(--blk)}
.btn-cat-dl:disabled{opacity:.35;cursor:not-allowed;border-color:var(--bdr);color:var(--muted)}
.cat-coming{display:flex;align-items:center;gap:7px;background:#f9f5ee;border:0.5px solid var(--bdr2);padding:7px 12px;font-size:9px;color:var(--muted);letter-spacing:1px}
.cat-setting-card{border:0.5px solid var(--bdr2);padding:22px;margin-bottom:14px;background:#f9f5ef}
.cat-setting-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.cat-setting-title{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:300}
.cat-url-row{margin-bottom:12px}
.cat-url-row label{display:block;font-size:7px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);margin-bottom:6px}
.cat-url-inp{width:100%;padding:9px 11px;border:0.5px solid var(--bdr);background:transparent;font-family:monospace;font-size:11px;color:var(--blk);outline:none;transition:border-color .2s}
.cat-url-inp:focus{border-color:var(--gold)}
.cat-url-hint{font-size:10px;color:var(--muted);line-height:1.7;margin-top:5px}
.cat-avail-toggle{display:flex;align-items:center;gap:9px;cursor:pointer;font-size:11px;color:var(--muted);margin-top:8px}
.cat-avail-toggle input{accent-color:var(--gold)}
`;

// ── SVG Icons ──
const BagIcon    = ({size=18}) => <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="6" width="13" height="10" rx="0.5"/><path d="M6 6V5a3 3 0 0 1 6 0v1"/></svg>;
const FlaskIcon  = ({size=18}) => <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 2h4M6.5 8.5 3.5 15.5h11l-3-7V2h-4v6.5z"/><circle cx="8" cy="12" r="0.7" fill="currentColor"/><circle cx="10.5" cy="13.5" r="0.5" fill="currentColor"/></svg>;
const ToolIcon   = ({size=18}) => <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3c.3 1.5-.7 3-2.2 3.5L6 13.5A1.4 1.4 0 0 1 4 11.5l7-7.5C12.5 3.5 13.8 2.7 15 3Z"/><circle cx="5" cy="13" r="1.2"/></svg>;
const SearchIcon = ({size=14}) => <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"><circle cx="6" cy="6" r="4.5"/><line x1="9.5" y1="9.5" x2="13" y2="13"/></svg>;
const CloseIcon  = ({size=12}) => <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"><line x1="1.5" y1="1.5" x2="10.5" y2="10.5"/><line x1="10.5" y1="1.5" x2="1.5" y2="10.5"/></svg>;
const BoxIcon    = ({size=18}) => <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2L2.5 5.5v7L9 16l6.5-3.5v-7L9 2z"/><line x1="9" y1="2" x2="9" y2="16"/><line x1="2.5" y1="5.5" x2="15.5" y2="5.5"/></svg>;
const BookIcon   = ({size=18}) => <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3.5A1.5 1.5 0 0 1 4.5 2h9A1.5 1.5 0 0 1 15 3.5v11A1.5 1.5 0 0 1 13.5 16H4.5A1.5 1.5 0 0 1 3 14.5V3.5z"/><line x1="6" y1="6" x2="12" y2="6"/><line x1="6" y1="9" x2="12" y2="9"/><line x1="6" y1="12" x2="10" y2="12"/></svg>;
const DownloadIcon=({size=13})=><svg width={size} height={size} viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 2v7M4 7l2.5 2.5L9 7"/><path d="M2 10.5h9"/></svg>;
const EyeIcon    = ({size=13}) => <svg width={size} height={size} viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"><ellipse cx="6.5" cy="6.5" rx="5.5" ry="3.5"/><circle cx="6.5" cy="6.5" r="1.5"/></svg>;
const PlaceholderIcon = () => <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="var(--bdr)" strokeWidth="0.5"><circle cx="22" cy="22" r="18"/><circle cx="22" cy="22" r="7"/><line x1="22" y1="4" x2="22" y2="15"/><line x1="22" y1="29" x2="22" y2="40"/><line x1="4" y1="22" x2="15" y2="22"/><line x1="29" y1="22" x2="40" y2="22"/></svg>;

const roleLabel = r => ({admin:"管理者",vip:"VIP 客戶",standard:"一般客戶",guest:"訪客"})[r]||r;

function searchProducts(products, q) {
  if (!q.trim()) return products;
  const lq = q.toLowerCase().trim();
  const mapped = (SYNONYMS[lq]||SYNONYMS[q]||q).toLowerCase();
  return products.filter(p => {
    const hay = [p.model,p.series,p.category,p.watt,p.cct,p.beam,p.voltage,p.cri,p.color,p.cutout,p.install,p.desc,p.note].join(" ").toLowerCase();
    return hay.includes(lq) || hay.includes(mapped);
  });
}
function getSuggestions(products, q) {
  if (!q||q.length<1) return [];
  const lq = q.toLowerCase();
  return [...new Set(products.flatMap(p=>[p.model,p.series,p.category,p.watt,p.cct,p.color].filter(v=>v&&v.toLowerCase().includes(lq))))].slice(0,6);
}
function calcInstall(regionId, groups, linearGroups=[]) {
  if (!regionId) return null;
  const reg = INSTALL_REGIONS.find(r=>r.id===regionId);
  if (!reg) return null;
  // 崁燈盞數
  const totalQty = groups.reduce((s,g)=>s+Number(g.qty||0),0);
  // 線型燈米數
  const totalMeters = linearGroups.reduce((s,g)=>s+Number(g.meters||0),0);
  // 單位合計（1盞=1單位，1米=1單位）用於免車馬費門檻
  const totalUnits = totalQty + totalMeters;
  let laborTotal=0, hasVHigh=false;
  // 崁燈工資
  for (const g of groups) {
    const cg=CEILING_GROUPS.find(c=>c.id===g.ceilingId), qty=Number(g.qty||0);
    if (!cg) continue;
    if (cg.surcharge===null){hasVHigh=true;continue;}
    laborTotal += (INSTALL_BASE+cg.surcharge)*qty;
  }
  // 線型燈工資（各段依高度計算）
  for (const g of linearGroups) {
    const cg=CEILING_GROUPS.find(c=>c.id===g.ceilingId), meters=Number(g.meters||0);
    if (!cg) continue;
    if (cg.surcharge===null){hasVHigh=true;continue;}
    // 線型燈基本費 INSTALL_LINEAR_M + 挑高加計（按比例）
    const linearSurchargeRate = cg.surcharge > 0 ? (cg.surcharge / INSTALL_BASE) : 0;
    const effectiveRate = INSTALL_LINEAR_M * (1 + linearSurchargeRate);
    laborTotal += effectiveRate * meters;
  }
  laborTotal = Math.max(Math.round(laborTotal), INSTALL_MIN);
  const travelFee = reg.travel===null ? null : (reg.freeAt&&totalUnits>=reg.freeAt) ? 0 : reg.travel;
  return {totalQty,totalMeters,totalUnits,laborTotal,travelFee,hasVHigh,reg};
}

function Carousel({images}) {
  const [idx,setIdx] = useState(0);
  const imgs = (images||[]).filter(Boolean);
  if (!imgs.length) return <div className="car"><PlaceholderIcon/></div>;
  return (
    <div className="car">
      <img src={imgs[idx]} alt="" onError={e=>{e.target.style.display="none"}}/>
      {imgs.length>1&&<>
        <button className="car-btn car-prev" onClick={()=>setIdx(i=>(i-1+imgs.length)%imgs.length)}>‹</button>
        <button className="car-btn car-next" onClick={()=>setIdx(i=>(i+1)%imgs.length)}>›</button>
        <div className="car-dots">{imgs.map((_,i)=><div key={i} className={`cdot ${i===idx?"on":""}`} onClick={()=>setIdx(i)}/>)}</div>
      </>}
    </div>
  );
}

// ── 設計公司專案提示橫幅（共用元件）──
function ProjBanner({onContact}) {
  return (
    <div className="proj-banner">
      ✦ 設計公司、建築師事務所、合作專案客戶享有<strong>專案折扣價</strong>，
      <span className="proj-banner-link" onClick={onContact} style={{cursor:"pointer",textDecoration:"underline",marginLeft:3}}>
        點此聯繫業務專員
      </span>
      另行報價。
    </div>
  );
}

function generatePDF({cart, projectName, customer, installCalc=null, isVip, discountRate=1, discountLabel=""}) {
  const today = new Date();
  const ds = `${today.getFullYear()}/${String(today.getMonth()+1).padStart(2,"0")}/${String(today.getDate()).padStart(2,"0")}`;
  const dateStr = `${today.getFullYear()}${String(today.getMonth()+1).padStart(2,"0")}${String(today.getDate()).padStart(2,"0")}`;
  const discSuffix = discountRate < 1 ? String(Math.round(discountRate*10)).padStart(3,"0") : String(Math.floor(Math.random()*900)+100);
  const qn = `C${dateStr}-${discSuffix}`;
  const priceLabel = discountRate < 1 ? `${discountLabel}折扣價` : isVip ? "專案價" : "建議牌價";

  const rows = cart.map((item, i) => {
    const p = item.product;
    const baseP = Number(isVip ? p.projPrice : p.stdPrice) || 0;
    const unitPrice = Math.round(baseP * discountRate);
    const subtotal = unitPrice * item.qty;
    const desc = [p.watt, p.beam, p.cct, p.voltage, p.cri, p.color, p.cutout ? `開孔${p.cutout}` : ""].filter(Boolean).join(" / ");
    const imgHtml = p.images && p.images[0]
      ? `<img src="${p.images[0]}" style="max-width:70px;max-height:55px;object-fit:contain;" onerror="this.style.display='none'">`
      : `<div style="width:70px;height:55px;background:#f0ebe2;display:flex;align-items:center;justify-content:center;font-size:9px;color:#ccc;">NO IMG</div>`;
    return `<tr>
      <td style="text-align:center;padding:8px 5px;">${i+1}</td>
      <td style="text-align:center;padding:5px;">${imgHtml}</td>
      <td style="padding:8px 6px;font-weight:500;">${p.model}</td>
      <td style="padding:8px 6px;font-size:10px;color:#555;">${desc}</td>
      <td style="text-align:center;padding:8px 5px;">${item.qty}</td>
      <td style="text-align:center;padding:8px 5px;">盞</td>
      <td style="text-align:right;padding:8px 8px;">${unitPrice > 0 ? unitPrice.toLocaleString() : "洽業務"}</td>
      <td style="text-align:right;padding:8px 8px;font-weight:500;">${subtotal > 0 ? subtotal.toLocaleString() : "—"}</td>
      <td style="padding:8px 5px;font-size:10px;color:#555;">${p.note||""}</td>
    </tr>`;
  }).join("");

  const untaxed = cart.reduce((s, item) => {
    const p = item.product;
    const baseP = Number(isVip ? p.projPrice : p.stdPrice) || 0;
    return s + Math.round(baseP * discountRate) * item.qty;
  }, 0);
  // 安裝費計算
  let installTotal = 0;
  let installRows = "";
  if (installCalc && installCalc.instCalc) {
    const ic = installCalc.instCalc;
    const iTypes = installCalc.installTypes || [];
    const iGroups = installCalc.instGroups || [];
    const lGroups = installCalc.linearGroups || [];
    let rowIdx = 1;
    // 崁燈工資
    if (iTypes.includes("recessed")) {
      iGroups.filter(g=>Number(g.qty)>0).forEach(g=>{
        const cg = CEILING_GROUPS.find(c=>c.id===g.ceilingId);
        if(!cg||cg.surcharge===null) return;
        const unit = INSTALL_BASE + cg.surcharge;
        const sub = unit * Number(g.qty);
        installTotal += sub;
        installRows += `<tr><td>${rowIdx++}</td><td><b>崁燈安裝（${cg.label}）</b></td><td style="text-align:center">${g.qty} 盞</td><td style="text-align:right">NT$ ${unit.toLocaleString()}</td><td style="text-align:right">NT$ ${sub.toLocaleString()}</td></tr>`;
      });
    }
    // 線型燈工資
    if (iTypes.includes("linear")) {
      lGroups.filter(g=>Number(g.meters)>0).forEach(g=>{
        const cg = CEILING_GROUPS.find(c=>c.id===g.ceilingId);
        if(!cg||cg.surcharge===null) return;
        const rate = Math.round(INSTALL_LINEAR_M*(1+cg.surcharge/INSTALL_BASE));
        const sub = rate * Number(g.meters);
        installTotal += sub;
        installRows += `<tr><td>${rowIdx++}</td><td><b>線型燈安裝（${cg.label}）</b><br><span style="font-size:10px;color:#666">${g.meters} 米 × NT$${rate}/米</span></td><td style="text-align:center">${g.meters} 米</td><td style="text-align:right">NT$ ${rate.toLocaleString()}</td><td style="text-align:right">NT$ ${sub.toLocaleString()}</td></tr>`;
      });
    }
    installTotal = Math.max(installTotal, INSTALL_MIN);
    // 車馬費
    const travelFee = ic.travelFee || 0;
    if (travelFee > 0) {
      installRows += `<tr><td>—</td><td><b>車馬費</b> (${ic.reg?.label||""})</td><td style="text-align:center">1</td><td style="text-align:right">NT$ ${travelFee.toLocaleString()}</td><td style="text-align:right">NT$ ${travelFee.toLocaleString()}</td></tr>`;
      installTotal += travelFee;
    } else if (ic.travelFee === 0) {
      installRows += `<tr><td>—</td><td><b>車馬費</b></td><td colspan="3" style="color:#3a6b4a;text-align:center">免收（已達門檻）</td></tr>`;
    }
  }
  const grandTotal = untaxed + Math.round(untaxed * 0.05) + installTotal;
  const tax = Math.round(untaxed * 0.05);
  const total = untaxed + tax;

  const discRow = discountRate < 1
    ? `<tr style="background:#fdf8ee;"><td colspan="3" style="text-align:right;padding:5px 12px;font-size:10px;color:#b8935a;">${discountLabel} 折扣已套用</td></tr>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<title>報價單 ${qn}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Noto Sans TC","Microsoft JhengHei",sans-serif;font-size:12px;color:#111;padding:24px 32px;background:#fff}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0e0d0c;padding-bottom:14px;margin-bottom:14px}
  .logo-area .logo-main{font-family:Georgia,serif;font-size:26px;font-weight:700;letter-spacing:3px;color:#0e0d0c}
  .logo-area .logo-sub{font-size:9px;letter-spacing:4px;color:#6a5a4a;margin-top:2px}
  .co-info{font-size:10px;color:#555;line-height:1.8;text-align:right}
  .co-info strong{color:#0e0d0c;font-size:12px;display:block;letter-spacing:1px}
  .doc-title{text-align:center;font-size:18px;font-weight:700;letter-spacing:6px;margin:10px 0 14px;color:#0e0d0c}
  .meta-grid{display:grid;grid-template-columns:1fr 1fr;border:1px solid #ccc;margin-bottom:14px}
  .meta-cell{padding:6px 10px;border-bottom:1px solid #ddd;font-size:11px}
  .meta-cell:nth-child(odd){border-right:1px solid #ddd}
  .meta-lbl{font-size:9px;color:#888;letter-spacing:1px;margin-bottom:1px}
  .meta-val{font-weight:500;color:#111}
  .price-note{background:#fdf8ee;border:1px solid #d4a96a;border-left:3px solid #b8935a;padding:8px 12px;margin-bottom:12px;font-size:10px;color:#7a5a2a;line-height:1.7}
  table{width:100%;border-collapse:collapse;margin-bottom:10px}
  thead th{background:#0e0d0c;color:#fff;padding:7px 6px;font-size:9px;letter-spacing:1px;font-weight:500;text-align:center}
  thead th.left{text-align:left}
  tbody td{border-bottom:1px solid #eee;vertical-align:middle}
  tbody tr:nth-child(even) td{background:#fafafa}
  .totals{display:flex;justify-content:flex-end;margin:10px 0}
  .totals-inner{border:1px solid #ccc;min-width:260px}
  .tot-row{display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid #eee;font-size:11px}
  .tot-row.final{background:#0e0d0c;color:#fff;font-size:14px;font-weight:700;padding:10px 14px;border-bottom:none}
  .tot-row.tax-row{color:#b8935a}
  .notes{border:1px solid #ccc;padding:10px 12px;margin-bottom:14px;font-size:10px;line-height:2;color:#555}
  .sign-area{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:16px}
  .sign-box{border-top:1px solid #ccc;padding-top:6px;font-size:10px;color:#888;min-height:40px}
  .footer{margin-top:14px;border-top:0.5px solid #ccc;padding-top:8px;font-size:9px;color:#aaa;text-align:center;letter-spacing:1px}
  .qr-hint{font-size:8px;color:#ccc;margin-top:4px}
</style>
</head>
<body>

<div class="header">
  <div class="logo-area">
    <div class="logo-main">Ledoux 諾科照明</div>
    <div class="logo-sub">LEDOUX LIGHTING CO;LTD</div>
  </div>
  <div class="co-info">
    <strong>${COMPANY.name}</strong>
    桃園市八德區建德路88號<br>
    TEL: (03)368-7525 &nbsp;|&nbsp; FAX: (03)368-7552<br>
    ${COMPANY.email}
  </div>
</div>

<div class="doc-title">報　價　單</div>

<div class="meta-grid">
  <div class="meta-cell"><div class="meta-lbl">客戶名稱</div><div class="meta-val">${customer.company || "—"}</div></div>
  <div class="meta-cell"><div class="meta-lbl">單據日期</div><div class="meta-val">${ds}</div></div>
  <div class="meta-cell"><div class="meta-lbl">案件名稱</div><div class="meta-val">${projectName}</div></div>
  <div class="meta-cell"><div class="meta-lbl">報價單號</div><div class="meta-val">${qn}</div></div>
  <div class="meta-cell"><div class="meta-lbl">聯繫人</div><div class="meta-val">${customer.name || "—"}</div></div>
  <div class="meta-cell"><div class="meta-lbl">幣別</div><div class="meta-val">NTD</div></div>
  <div class="meta-cell"><div class="meta-lbl">客戶電話</div><div class="meta-val">${customer.phone || "—"}</div></div>
  <div class="meta-cell"><div class="meta-lbl">負責業務</div><div class="meta-val">池宇山</div></div>
  <div class="meta-cell"><div class="meta-lbl">客戶地址</div><div class="meta-val">${customer.address || "—"}</div></div>
  <div class="meta-cell"><div class="meta-lbl">E-mail</div><div class="meta-val">${COMPANY.email}</div></div>
</div>

${discountRate < 1 ? `<div class="price-note">⚠ 本報價單已套用 <strong>${discountLabel}</strong> 專屬折扣，報價僅供本次專案使用，請勿對外流通。</div>` : ""}

<table>
  <thead>
    <tr>
      <th style="width:30px">No.</th>
      <th style="width:80px">產品圖片</th>
      <th style="width:90px" class="left">產品型號</th>
      <th class="left">產品描述</th>
      <th style="width:40px">數量</th>
      <th style="width:35px">單位</th>
      <th style="width:70px">單價</th>
      <th style="width:75px">金額</th>
      <th style="width:90px" class="left">備註</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
  </tbody>
</table>

<div class="totals">
  <div class="totals-inner">
    ${discRow}
    <div class="tot-row"><span>金額（未稅）</span><span>NT$ ${untaxed.toLocaleString()}</span></div>
    <div class="tot-row tax-row"><span>稅金（5%）</span><span>NT$ ${tax.toLocaleString()}</span></div>
    <div class="tot-row final"><span>總金額（含稅）</span><span>NT$ ${total.toLocaleString()}</span></div>
  </div>
</div>

${installRows ? `
<div style="margin-top:14px;">
  <div style="font-size:11px;font-weight:700;letter-spacing:2px;background:#f4efe8;border-left:3px solid #b8935a;padding:6px 12px;margin-bottom:6px;">二、專業安裝服務</div>
  <table>
    <thead><tr>
      <th style="width:30px">No.</th><th class="left">安裝項目</th><th style="width:50px">數量</th><th style="width:70px">單價</th><th style="width:75px">小計</th>
    </tr></thead>
    <tbody>${installRows}</tbody>
  </table>
  <div class="totals" style="margin-top:6px;">
    <div class="totals-inner">
      <div class="tot-row"><span>安裝費小計</span><span>NT$ ${installTotal.toLocaleString()}</span></div>
    </div>
  </div>
</div>
<div style="display:flex;justify-content:flex-end;margin:10px 0;">
  <div style="border:1px solid #ccc;min-width:260px;background:#0e0d0c;color:#fff;padding:12px 14px;font-size:15px;font-weight:700;display:flex;justify-content:space-between;">
    <span>燈具＋安裝 總計（含稅）</span><span>NT$ ${grandTotal.toLocaleString()}</span>
  </div>
</div>` : ""}
<div class="notes">
  <strong>備　註：</strong><br>
  A. 本報價單有效期限30天，請於期限內回簽訂單。<br>
  B. 謹請確認以上單價及數量，如無誤，煩將訂購報價單回傳【Fax:03-368 7552】。<br>
  C. 燈具保固期限：室內保固3年、戶外保固2年。<br>
  D. 交期如遇天災或事變等不可抗力，未能依時履約交貨，得展延交期。<br>
  E. 單筆未滿 NT$3,000，運費由買方自付；庫存不足時生產交期約1個月起。
</div>

<div class="sign-area">
  <div class="sign-box">經辦：</div>
  <div class="sign-box">客戶確認：</div>
  <div class="sign-box">日期：</div>
</div>

<div class="footer">
  ${COMPANY.name} &nbsp;·&nbsp; ${COMPANY.eng} &nbsp;·&nbsp; 報價單號：${qn}
  <div class="qr-hint">本報價單由系統自動產生，如有疑問請聯繫業務</div>
</div>

</body>
</html>`;

  const blob = new Blob([html], {type: "text/html;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `報價單_${projectName}_${qn}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

function generateInstallPDF({projectName, customer, instCalc, instRegion, instGroups, linearGroups=[], linearMeters, instNote}) {
  const today=new Date();
  const ds=`${today.getFullYear()}/${String(today.getMonth()+1).padStart(2,"0")}/${String(today.getDate()).padStart(2,"0")}`;
  const qn=`INST${today.getFullYear()}${String(today.getMonth()+1).padStart(2,"0")}${String(today.getDate()).padStart(2,"0")}-${String(Math.floor(Math.random()*999)+1).padStart(3,"0")}`;
  const isLinear = instGroups[0]?.type==="linear";
  const laborCost = instCalc?.laborTotal || 0;
  const travel = instCalc?.travelFee||0;
  const total = laborCost + travel;
  const regLabel = INSTALL_REGIONS.find(r=>r.id===instRegion)?.label||instRegion;
  const itemRows = isLinear
    ? (linearGroups.length>0 ? linearGroups : [{meters:linearMeters,ceilingId:"std"}]).map((g,i)=>{
        const cg=CEILING_GROUPS.find(c=>c.id===g.ceilingId);
        if(!cg||cg.surcharge===null) return `<tr><td>${i+1}</td><td><b>線型燈安裝（${cg?.label||""}）</b></td><td style="text-align:center">${g.meters} 米</td><td style="text-align:right">另案報價</td><td style="text-align:right">另案報價</td></tr>`;
        const rate=Math.round(INSTALL_LINEAR_M*(1+cg.surcharge/INSTALL_BASE));
        const sub=rate*g.meters;
        return `<tr><td>${i+1}</td><td><b>線型燈安裝（${cg.label}）</b><br><span style="font-size:10px;color:#666">${g.meters} 米 × NT$${rate}/米</span></td><td style="text-align:center">${g.meters} 米</td><td style="text-align:right">NT$ ${rate.toLocaleString()}</td><td style="text-align:right">NT$ ${sub.toLocaleString()}</td></tr>`;
      }).join("")
    : instGroups.map((g,i)=>{const cg=CEILING_GROUPS.find(c=>c.id===g.ceilingId);const surcharge=cg?.surcharge||0;const unit=INSTALL_BASE+surcharge;const sub=unit*Number(g.qty);return`<tr><td>${i+1}</td><td><b>崁燈安裝（${cg?.label||""}）</b></td><td style="text-align:center">${g.qty} 盞</td><td style="text-align:right">NT$ ${unit.toLocaleString()}</td><td style="text-align:right">NT$ ${sub.toLocaleString()}</td></tr>`;}).join("");
  const travelRow = travel>0 ? `<tr><td>—</td><td><b>車馬費</b><br><span style="font-size:10px;color:#666">${regLabel}</span></td><td style="text-align:center">1</td><td style="text-align:right">NT$ ${travel.toLocaleString()}</td><td style="text-align:right">NT$ ${travel.toLocaleString()}</td></tr>` : `<tr><td>—</td><td><b>車馬費</b></td><td colspan="3" style="color:#3a6b4a;text-align:center">免收（已達免收門檻）</td></tr>`;
  const html=`<!DOCTYPE html><html lang="zh-TW"><head><meta charset="UTF-8"><title>安裝報價單 ${qn}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Noto Sans TC","Microsoft JhengHei",sans-serif;font-size:12px;color:#111;padding:28px 36px}.hd{display:flex;justify-content:space-between;margin-bottom:18px;border-bottom:2px solid #111;padding-bottom:12px}.co-name{font-size:18px;font-weight:700;letter-spacing:2px}.co-sub{font-size:10px;color:#555;margin-top:2px}.doc-title{text-align:center;font-size:16px;font-weight:700;letter-spacing:4px;margin-bottom:14px}.meta{display:grid;grid-template-columns:1fr 1fr;border:1px solid #ccc;margin-bottom:14px}.mc{padding:7px 10px;border-bottom:1px solid #ccc;font-size:11px}.mc:nth-child(odd){border-right:1px solid #ccc}.ml{font-size:9px;color:#666;letter-spacing:1px}.mv{font-weight:500;margin-top:1px}table{width:100%;border-collapse:collapse;margin-bottom:8px;font-size:11px}th{background:#111;color:#fff;padding:5px 7px;text-align:left;font-size:9px}td{padding:5px 7px;border-bottom:1px solid #e8e8e8}.subtotal-row td{font-weight:600;color:#b8935a;background:#f9f5ee}.tot{display:flex;justify-content:flex-end;margin:12px 0}.tt{border:1px solid #ccc;min-width:240px}.tr{display:flex;justify-content:space-between;padding:6px 12px;border-bottom:1px solid #eee;font-size:11px}.tr.bold{font-weight:700;font-size:14px;background:#0e0d0c;color:#fff;padding:10px 12px}.notes{border:1px solid #ccc;padding:10px 12px;margin-bottom:12px;font-size:10px;line-height:2;color:#444}.footer{margin-top:14px;border-top:1px solid #ccc;padding-top:8px;font-size:9px;color:#999;text-align:center}</style></head><body>
<div class="hd"><div><div class="co-name">${COMPANY.name}</div><div class="co-sub">${COMPANY.eng}</div></div><div style="font-size:10px;color:#555;text-align:right">${COMPANY.email}</div></div>
<div class="doc-title">安裝服務報價單</div>
<div class="meta"><div class="mc"><div class="ml">報價單號</div><div class="mv">${qn}</div></div><div class="mc"><div class="ml">報價日期</div><div class="mv">${ds}</div></div><div class="mc"><div class="ml">客戶公司</div><div class="mv">${customer.company||"—"}</div></div><div class="mc"><div class="ml">聯絡人</div><div class="mv">${customer.name||"—"}</div></div><div class="mc"><div class="ml">案名</div><div class="mv">${projectName}</div></div><div class="mc"><div class="ml">施工區域</div><div class="mv">${regLabel}</div></div></div>
<table><thead><tr><th>#</th><th>安裝項目</th><th>數量</th><th>單價</th><th>小計</th></tr></thead><tbody>${itemRows}${travelRow}<tr class="subtotal-row"><td colspan="3" style="text-align:right">合計</td><td></td><td style="text-align:right">NT$ ${total.toLocaleString()}</td></tr></tbody></table>
<div class="tot"><div class="tt"><div class="tr bold"><span>安裝費用合計</span><span>NT$ ${total.toLocaleString()}</span></div></div></div>
<div class="notes"><b>安裝服務說明：</b><br>A. 請業主於安裝前完成開孔、拉好電線至預定位置。<br>B. 最低出勤費 NT$2,000，未達此標以最低費計收。<br>C. 4.5m 以上不含安裝費，需鷹架或高空作業車另案報價。<br>D. 本報價單有效期 30 天。<br>${instNote?`E. 備註：${instNote}<br>`:""}</div>
<div class="footer">${COMPANY.name} · 安裝服務報價單 · 出發地：桃園市八德區</div>
</body></html>`;
  const blob=new Blob([html],{type:"text/html;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url; a.download=`安裝報價單_${projectName}_${qn}.html`; a.click();
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════
//  主元件
// ═══════════════════════════════════════════

// 安裝費用試算 PDF（獨立版）
function _generateInstallOnlyPDF({projectName, customer, instCalc, instRegion, instGroups, linearGroups, installTypes, instNote}) {
  const today = new Date();
  const ds = `${today.getFullYear()}/${String(today.getMonth()+1).padStart(2,"0")}/${String(today.getDate()).padStart(2,"0")}`;
  const qn = `INST-EST-${today.getFullYear()}${String(today.getMonth()+1).padStart(2,"0")}${String(today.getDate()).padStart(2,"0")}-${String(Math.floor(Math.random()*999)+1).padStart(3,"0")}`;
  const regLabel = INSTALL_REGIONS.find(r=>r.id===instRegion)?.label || instRegion;
  const hasR = (installTypes||[]).includes("recessed");
  const hasL = (installTypes||[]).includes("linear");
  let rows = "", laborTotal = 0;
  if(hasR){
    (instGroups||[]).filter(g=>Number(g.qty)>0).forEach((g,i)=>{
      const cg=CEILING_GROUPS.find(c=>c.id===g.ceilingId);
      if(!cg||cg.surcharge===null)return;
      const unit=INSTALL_BASE+cg.surcharge, sub=unit*Number(g.qty);
      laborTotal+=sub;
      rows+=`<tr><td>${i+1}</td><td><b>崁燈安裝（${cg.label}）</b></td><td style="text-align:center">${g.qty} 盞</td><td style="text-align:right">NT$ ${unit.toLocaleString()}</td><td style="text-align:right">NT$ ${sub.toLocaleString()}</td></tr>`;
    });
  }
  if(hasL){
    (linearGroups||[]).filter(g=>Number(g.meters)>0).forEach((g,i)=>{
      const cg=CEILING_GROUPS.find(c=>c.id===g.ceilingId);
      if(!cg||cg.surcharge===null)return;
      const rate=Math.round(INSTALL_LINEAR_M*(1+cg.surcharge/INSTALL_BASE)),sub=rate*Number(g.meters);
      laborTotal+=sub;
      rows+=`<tr><td>L${i+1}</td><td><b>線型燈安裝（${cg.label}）</b><br><span style="font-size:10px;color:#666">${g.meters}米 × NT$${rate}/米</span></td><td style="text-align:center">${g.meters} 米</td><td style="text-align:right">NT$ ${rate.toLocaleString()}</td><td style="text-align:right">NT$ ${sub.toLocaleString()}</td></tr>`;
    });
  }
  laborTotal=Math.max(laborTotal,INSTALL_MIN);
  const travelFee=instCalc?.travelFee||0, grandTotal=laborTotal+travelFee;
  if(travelFee>0){rows+=`<tr><td>—</td><td><b>車馬費</b>（${regLabel}）</td><td style="text-align:center">1</td><td style="text-align:right">NT$ ${travelFee.toLocaleString()}</td><td style="text-align:right">NT$ ${travelFee.toLocaleString()}</td></tr>`;}
  else{rows+=`<tr><td>—</td><td><b>車馬費</b></td><td colspan="3" style="color:#3a6b4a;text-align:center">免收（已達門檻）</td></tr>`;}
  const html=`<!DOCTYPE html><html lang="zh-TW"><head><meta charset="UTF-8"><title>安裝費用試算 ${qn}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Noto Sans TC",sans-serif;font-size:12px;color:#111;padding:28px 36px}.hd{display:flex;justify-content:space-between;margin-bottom:18px;border-bottom:2px solid #111;padding-bottom:12px}.co-name{font-size:18px;font-weight:700;letter-spacing:2px}.doc-title{text-align:center;font-size:16px;font-weight:700;letter-spacing:4px;margin-bottom:6px}.doc-note{text-align:center;font-size:10px;color:#9b3a3a;margin-bottom:14px;padding:6px;border:1px solid #e8d0d0;background:#fdf0f0}.meta{display:grid;grid-template-columns:1fr 1fr;border:1px solid #ccc;margin-bottom:14px}.mc{padding:7px 10px;border-bottom:1px solid #ccc;font-size:11px}.mc:nth-child(odd){border-right:1px solid #ccc}.ml{font-size:9px;color:#666}.mv{font-weight:500;margin-top:1px}table{width:100%;border-collapse:collapse;margin-bottom:10px;font-size:11px}th{background:#111;color:#fff;padding:5px 7px;text-align:left;font-size:9px}td{padding:5px 7px;border-bottom:1px solid #eee}.totals{display:flex;justify-content:flex-end;margin:10px 0}.totals-inner{border:1px solid #ccc;min-width:240px}.tr{display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid #eee;font-size:11px}.tr.final{background:#0e0d0c;color:#fff;font-size:14px;font-weight:700;padding:10px 14px;border-bottom:none}.notes{border:1px solid #ccc;padding:10px;margin-bottom:10px;font-size:10px;line-height:2;color:#555}.footer{margin-top:10px;border-top:0.5px solid #ccc;padding-top:8px;font-size:9px;color:#aaa;text-align:center}</style></head><body>
<div class="hd"><div><div class="co-name">${COMPANY.name}</div><div style="font-size:9px;color:#555;margin-top:2px">${COMPANY.eng}</div></div><div style="font-size:10px;color:#555;text-align:right">${COMPANY.email}</div></div>
<div class="doc-title">安裝費用試算表</div>
<div class="doc-note">⚠ 本試算僅供費用參考，實際費用以現場評估為準，業務將與您確認詳情</div>
<div class="meta"><div class="mc"><div class="ml">試算編號</div><div class="mv">${qn}</div></div><div class="mc"><div class="ml">試算日期</div><div class="mv">${ds}</div></div><div class="mc"><div class="ml">服務區域</div><div class="mv">${regLabel}</div></div><div class="mc"><div class="ml">案名</div><div class="mv">${projectName||"—"}</div></div></div>
<table><thead><tr><th>#</th><th>安裝項目</th><th>數量</th><th>單價</th><th>小計</th></tr></thead><tbody>${rows}<tr style="background:#f9f5ee"><td colspan="3" style="text-align:right;font-weight:600">工資小計</td><td></td><td style="text-align:right;font-weight:600">NT$ ${laborTotal.toLocaleString()}</td></tr></tbody></table>
<div class="totals"><div class="totals-inner"><div class="tr final"><span>預估安裝費用合計</span><span>NT$ ${grandTotal.toLocaleString()}</span></div></div></div>
<div class="notes"><b>安裝服務說明：</b><br>A. 本試算為參考報價，實際以現場評估為準。<br>B. 請業主於安裝前完成開孔，並將電線拉至各燈具預定位置。<br>C. 最低出勤費 NT$2,000，未達此標以最低費計收。<br>D. 線型燈須預留燈槽退縮空間（建議 ≥ 10cm），若無法退縮將無法施工。<br>E. 不含多折角、弧形、戶外安裝，特殊需求請另行聯繫業務。${instNote?`<br>F. 備註：${instNote}`:""}</div>
<div class="footer">${COMPANY.name} · 安裝費用試算表 · ${qn}</div>
</body></html>`;
  const blob=new Blob([html],{type:"text/html;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url; a.download=`安裝試算_${qn}.html`; a.click();
  URL.revokeObjectURL(url);
}

function App() {
  const [syncStatus, setSyncStatus] = useState("off");
  const [sheetUrl,   setSheetUrl]   = useState(SHEET_URL);
  const [urlInput,   setUrlInput]   = useState(SHEET_URL);
  const [testResult, setTestResult] = useState("");
  const [members,    setMembers]    = useState(INIT_MEMBERS);
  const [pending,    setPending]    = useState([]);
  const [products,   setProducts]   = useState(INIT_PRODUCTS);
  const [inventory,  setInventory]  = useState(INIT_INVENTORY);
  const [sampleReqs, setSampleReqs] = useState([]);
  const [installOrd, setInstallOrd] = useState([]);
  const [catalogs,   setCatalogs]   = useState(DEFAULT_CATALOGS);
  const [user,       setUser]       = useState(null);
  const [page,       setPage]       = useState("catalog");
  const [cat,        setCat]        = useState("全部");
  const [seriesF,    setSeriesF]    = useState(null);
  const [invCat,     setInvCat]     = useState("全部");
  const [searchQ,    setSearchQ]    = useState("");
  const [searchFocus,setSearchFocus]= useState(false);
  const [searchHist, setSearchHist] = useState([]);
  const [selProd,    setSelProd]    = useState(null);
  const [editProd,   setEditProd]   = useState(null);
  const [showAdd,    setShowAdd]    = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [cartOpen,   setCartOpen]   = useState(false);
  const [sampOpen,   setSampOpen]   = useState(false);
  const [instOpen,   setInstOpen]   = useState(false);
  const [cart,       setCart]       = useState([]);
  const [sampCart,   setSampCart]   = useState([]);
  const [sampForm,   setSampForm]   = useState({name:"",company:"",phone:"",address:"",note:""});
  const [sampDone,   setSampDone]   = useState(false);
  const [projName,   setProjName]   = useState("");
  const [custName,   setCustName]   = useState("");
  const [custCompany,setCustCompany]= useState("");
  const [custPhone,  setCustPhone]  = useState("");
  const [custAddress,setCustAddress]= useState("");
  const [checks,     setChecks]     = useState({c1:false,c2:false,c3:false,c4:false});
  const [toast,      setToast]      = useState("");
  const [loginF,     setLoginF]     = useState({username:"",password:""});
  const [loginErr,   setLoginErr]   = useState("");
  const [seriesExp,  setSeriesExp]  = useState(true);
  const [catExp,     setCatExp]     = useState(true);
  const [instRegion, setInstRegion] = useState("");
  const [instGroups, setInstGroups] = useState([{ceilingId:"std",qty:0}]);
  const [instNote,   setInstNote]   = useState("");
  const [instDone,   setInstDone]   = useState(false);
  const [linearMeters,  setLinearMeters]  = useState(1);
  const [quickRecessed, setQuickRecessed] = useState(10);
  const [linearGroups,  setLinearGroups]  = useState([{meters:0,ceilingId:"std"}]);
  const [newProd,    setNewProd]    = useState({model:"",series:"",category:"崁燈",watt:"",cct:"3000K/4000K",beam:"24°",voltage:"220V",cri:"Ra≥80",color:"白色",cutout:"",size:"",install:"崁入式",cert:"",shipping:"90",stdPrice:"",projPrice:"",video:"",desc:"",images:"",note:""});
  const [editInvItem,setEditInvItem]= useState(null);
  const [newInv,     setNewInv]     = useState({model:"",series:"",category:"崁燈",watt:"",cct:"3000K",color:"白色",totalQty:0,reservedQty:0,availableQty:0,location:"",note:""});
  const [showAddInv, setShowAddInv] = useState(false);
  // ✅ 訪客 Modal 修復：獨立狀態，不與 PDF 邏輯混用
  const [guestModal, setGuestModal] = useState(false);
  const [guestInfo,  setGuestInfo]  = useState({company:"",contact:"",phone:""});
  const [guestErr,   setGuestErr]   = useState({});
  // 折扣碼
  const [discountCode, setDiscountCode] = useState("");
  const [discountRate, setDiscountRate] = useState(1); // 1=牌價, 0.6/0.7/0.8=折扣
  const [discountLabel, setDiscountLabel] = useState("");
  // 安裝詢問 Modal
  const [installAskModal, setInstallAskModal] = useState(false);
  const [installChoice,   setInstallChoice]   = useState(null); // null/true/false
  const [inlineEdit, setInlineEdit] = useState(null);
  const [inlineData, setInlineData] = useState({});
  const [designForm, setDesignForm] = useState({company:"",name:"",phone:"",project:""});
  const [designDone,    setDesignDone]    = useState(false);
  const [contactModal,  setContactModal]  = useState(false);
  const [activeTags, setActiveTags] = useState([]);
  const [installTypes, setInstallTypes] = useState([]);
  const blurRef = useRef(null);

  // ✅ 必須在 cartTotal 前宣告，否則 "Cannot access isVip before initialization"
  const isGuest = user?.role==="guest";
  const isAdmin = user?.role==="admin";
  const isVip   = user?.role==="vip"||isAdmin;

  const cartCount  = cart.reduce((s,i)=>s+i.qty,0);
  const cartLampQty = cart.reduce((s,i)=>s+i.qty,0); // 購物車燈具總盞數（安裝上限用）
  const cartLinearMeters = cart.reduce((s,i)=>{ // 線型燈總米數（從購物車的鋁條燈計算）
    if(i.product.category==="鋁條燈") return s + i.qty;
    return s;
  }, 0);
  const cartTotal  = cart.reduce((s,i)=>s+(Number(isVip?i.product.projPrice:i.product.stdPrice)||0)*i.qty,0);
  const allChecked = Object.values(checks).every(Boolean);
  const allSeries  = [...new Set(products.map(p=>p.series))];
  const allCats    = [...new Set(products.map(p=>p.category))];
  const allInvCats = ["全部",...new Set(inventory.map(i=>i.category))];
  const allWatts   = [...new Set(products.map(p=>p.watt).filter(Boolean).filter(w=>!w.includes("/")))].sort();
  const allCcts    = ["2700K","3000K","3500K","4000K","6500K"];

  useEffect(() => {
    if (!sheetUrl) return;
    (async () => {
      setSyncStatus("loading");
      const [prods, invs] = await Promise.all([sheetGet("getProducts"),sheetGet("getInventory")]);
      if (prods?.length>0) setProducts(prods);
      if (invs?.length>0)  setInventory(invs);
      setSyncStatus("ok");
    })();
  }, [sheetUrl]);

  const syncProducts  = async p  => { if(!sheetUrl)return; setSyncStatus("loading"); await sheetPost("saveProducts",p); setSyncStatus("ok"); };
  const syncInventory = async iv => { if(!sheetUrl)return; setSyncStatus("loading"); await sheetPost("saveInventory",iv); setSyncStatus("ok"); };
  const syncUpsertInv = async it => { if(!sheetUrl)return; setSyncStatus("loading"); await sheetPost("upsertInventory",it); setSyncStatus("ok"); };

  const toast$ = m => { setToast(m); setTimeout(()=>setToast(""),3000); };

  // 折扣碼驗證
  const DISCOUNT_CODES = { "LED006":0.6, "LED007":0.7, "LED008":0.8 };
  const applyDiscountCode = (code) => {
    const trimmed = code.trim().toUpperCase();
    const rate = DISCOUNT_CODES[trimmed];
    if (rate) {
      setDiscountRate(rate);
      setDiscountLabel(`${trimmed} · ${Math.round(rate*10)}折`);
      toast$(`✓ 專案折扣已套用：${Math.round(rate*10)}折`);
    } else if (trimmed === "") {
      setDiscountRate(1);
      setDiscountLabel("");
    } else {
      setDiscountRate(1);
      setDiscountLabel("");
      toast$("此代碼無效，已套用標準牌價");
    }
  };

  const filtered = (() => {
    let ps = searchQ.trim() ? searchProducts(products, searchQ) : products;
    if (seriesF) ps = ps.filter(p=>p.series===seriesF);
    else if (cat!=="全部") ps = ps.filter(p=>p.category===cat);
    for (const tag of activeTags) {
      if (tag.type==="watt") ps = ps.filter(p=>p.watt===tag.value);
      if (tag.type==="cct")  ps = ps.filter(p=>p.cct&&p.cct.includes(tag.value.replace("K","")));
      if (tag.type==="cri")  ps = ps.filter(p=>p.cri&&p.cri.includes(tag.value));
      if (tag.type==="cert") ps = ps.filter(p=>p.cert&&p.cert.includes(tag.value));
    }
    return ps;
  })();

  const toggleTag = (type, value) => {
    setActiveTags(ts=>{
      const exists=ts.find(t=>t.type===type&&t.value===value);
      return exists ? ts.filter(t=>!(t.type===type&&t.value===value)) : [...ts,{type,value}];
    });
    setSeriesF(null);
  };
  const hasTag   = (type, value) => activeTags.some(t=>t.type===type&&t.value===value);
  const clearTags = () => { setActiveTags([]); setSearchQ(""); setCat("全部"); setSeriesF(null); };

  const filteredInv = invCat==="全部" ? inventory : inventory.filter(i=>i.category===invCat);
  const suggs = getSuggestions(products, searchQ);
  const instCalc = calcInstall(instRegion, instGroups, linearGroups);
  const hasStock = model => inventory.some(i=>i.model===model&&Number(i.availableQty)>0);
  const doSearch = q => { setSearchQ(q); if(q.trim()&&!searchHist.includes(q)) setSearchHist(h=>[q,...h].slice(0,8)); setSearchFocus(false); setPage("catalog"); };

  const doLogin = () => {
    if (loginF.username===ADMIN_USERNAME && loginF.password===ADMIN_PASSWORD) {
      setUser({id:1,username:ADMIN_USERNAME,name:"管理員",position:"管理者",company:"Ledoux Taiwan",role:"admin"});
      setLoginErr("");
    } else { setLoginErr("帳號或密碼錯誤"); }
  };

  const addToCart = p => { setCart(c=>{const ex=c.find(i=>i.product.id===p.id);return ex?c.map(i=>i.product.id===p.id?{...i,qty:i.qty+1}:i):[...c,{product:p,qty:1}];}); toast$(`${p.model} 已加入詢價單`); };
  const updateQty = (id,d) => setCart(c=>c.map(i=>i.product.id===id?{...i,qty:Math.max(1,i.qty+d)}:i));
  const removeItem = id => setCart(c=>c.filter(i=>i.product.id!==id));
  const addToSamp  = p  => { setSampCart(c=>c.find(i=>i.id===p.id)?c:[...c,p]); toast$(`${p.model} 已加入樣品清單`); };
  const removeSamp = id => setSampCart(c=>c.filter(i=>i.id!==id));

  // ✅ 樣品申請：寫入 Google Sheets「樣品申請」工作表，Google 端自動寄信
  const submitSamp = async () => {
    if(!sampForm.name||!sampForm.phone){toast$("請填寫姓名和電話");return;}
    const req={
      id: "SAMP"+Date.now(),
      date: new Date().toISOString().split("T")[0],
      contactName: sampForm.name,
      company: sampForm.company||"",
      phone: sampForm.phone,
      address: sampForm.address||"",
      items: sampCart.map(p=>p.model),
      status: "待處理",
      note: sampForm.note||""
    };
    setSampleReqs(x=>[...x,{...req,products:sampCart.map(p=>p.model),form:sampForm}]);
    setSampDone(true);
    toast$("樣品申請已送出，業務將盡快聯繫");
    if(sheetUrl){ await sheetPost("saveSampleRequest", req); }
  };

  // ✅ 安裝申請：寫入 Google Sheets「安裝申請」工作表，Google 端自動寄信
  const submitInst = async () => {
    if(!instRegion){toast$("請選擇安裝區域");return;}
    const hasR = installTypes.includes("recessed");
    const hasL = installTypes.includes("linear");
    if(!hasR && !hasL){toast$("請選擇安裝類型");return;}
    const reg = INSTALL_REGIONS.find(r=>r.id===instRegion);
    const totalLinearM = linearGroups.reduce((s,g)=>s+Number(g.meters||0),0);
    const laborCost = instCalc?.laborTotal||0;
    const travelFee = instCalc?.travelFee||0;
    const grandTotal = laborCost + travelFee;
    const ord = {
      id: "INST"+Date.now(),
      date: new Date().toISOString().split("T")[0],
      customerName: isGuest ? (custName||guestInfo.contact||"訪客") : user.name,
      company: isGuest ? (custCompany||guestInfo.company||"") : (user.company||""),
      phone: isGuest ? (custPhone||guestInfo.phone||"") : "",
      projectName: projName||"",
      region: instRegion,
      regionLabel: reg?.label||instRegion,
      recessedGroups: hasR ? instGroups.filter(g=>Number(g.qty)>0).map(g=>{
        const cg=CEILING_GROUPS.find(c=>c.id===g.ceilingId);
        return {ceilingId:g.ceilingId, ceilingLabel:cg?.label||g.ceilingId, qty:Number(g.qty)};
      }) : [],
      linearGroups: hasL ? linearGroups.filter(g=>Number(g.meters)>0).map(g=>{
        const cg=CEILING_GROUPS.find(c=>c.id===g.ceilingId);
        return {ceilingId:g.ceilingId, ceilingLabel:cg?.label||g.ceilingId, meters:Number(g.meters)};
      }) : [],
      totalQty: hasR ? instGroups.reduce((s,g)=>s+Number(g.qty||0),0) : 0,
      totalMeters: hasL ? totalLinearM : 0,
      totalUnits: (hasR?instGroups.reduce((s,g)=>s+Number(g.qty||0),0):0) + (hasL?totalLinearM:0),
      laborTotal: laborCost,
      travelFee: travelFee,
      grandTotal: grandTotal,
      installNote: instNote||"",
      status: "待確認"
    };
    setInstallOrd(x=>[...x,ord]);
    setInstDone(true);
    toast$("安裝申請已送出，業務將盡快確認時間");
    if(sheetUrl){ await sheetPost("saveInstallOrder", ord); }
  };

  const resetInst = () => { setInstRegion("");setInstGroups([{ceilingId:"std",qty:0}]);setLinearGroups([{meters:0,ceilingId:"std"}]);setInstallTypes([]);setInstNote("");setInstDone(false);setInstOpen(false); };

  // 生成獨立安裝費用試算 PDF（不含燈具，只有安裝費）
  const generateInstallOnlyPDF = () => {
    if(!instRegion){toast$("請先選擇安裝區域");return;}
    const customer = {
      name: custName || (isGuest?"訪客":user.name),
      company: custCompany || (isGuest?"":user.company)||"",
      phone: custPhone || ""
    };
    _generateInstallOnlyPDF({
      projectName: projName||"安裝費用試算",
      customer,
      instCalc,
      instRegion,
      instGroups,
      linearGroups,
      linearMeters,
      installTypes,
      instNote,
      INSTALL_REGIONS,
      CEILING_GROUPS,
      INSTALL_BASE,
      INSTALL_LINEAR_M,
      INSTALL_MIN,
      COMPANY
    });
    // 通知業務
    if(sheetUrl){
      sheetPost("saveInstallOrder", {
        id: "INST-EST-"+Date.now(),
        date: new Date().toISOString().split("T")[0],
        customerName: customer.name,
        company: customer.company,
        phone: customer.phone,
        projectName: projName||"安裝費用試算",
        region: instRegion,
        regionLabel: instCalc?.reg?.label||instRegion,
        recessedGroups: installTypes.includes("recessed")?instGroups.filter(g=>Number(g.qty)>0).map(g=>{const cg=CEILING_GROUPS.find(c=>c.id===g.ceilingId);return{ceilingId:g.ceilingId,ceilingLabel:cg?.label||g.ceilingId,qty:Number(g.qty)};}): [],
        linearGroups: installTypes.includes("linear")?linearGroups.filter(g=>Number(g.meters)>0).map(g=>{const cg=CEILING_GROUPS.find(c=>c.id===g.ceilingId);return{ceilingId:g.ceilingId,ceilingLabel:cg?.label||g.ceilingId,meters:Number(g.meters)};}): [],
        totalQty: instCalc?.totalQty||0,
        totalMeters: instCalc?.totalMeters||0,
        totalUnits: instCalc?.totalUnits||0,
        laborTotal: instCalc?.laborTotal||0,
        travelFee: instCalc?.travelFee||0,
        grandTotal: (instCalc?.laborTotal||0)+(instCalc?.travelFee||0),
        installNote: instNote||"（安裝費用試算）",
        status: "試算"
      });
    }
    toast$("安裝費用試算 PDF 已生成，業務已收到通知");
  };

  // ✅ 修復：PDF 下載核心函式（訪客白屏問題根本修復）
  const doPdfDownload = (customer) => {
    // 整合報價單：燈具（含折扣）+ 安裝費（若有）合為一份 PDF
    const installData = (installChoice===true && instRegion && instCalc) ? {instCalc,instRegion,instGroups,linearGroups,linearMeters,instNote,installTypes} : null;
    generatePDF({cart,projectName:projName,customer:{...customer,phone:customer.phone||custPhone,address:customer.address||custAddress},installCalc:installData,isVip,discountRate,discountLabel});
    const baseSubtotal=cart.reduce((s,i)=>s+(Number(isVip?i.product.projPrice:i.product.stdPrice)||0)*i.qty,0);
    const lampSubtotal=Math.round(baseSubtotal*discountRate);
    if(sheetUrl){
      sheetPost("saveOrder",{id:"ORD"+Date.now(),date:new Date().toISOString().split("T")[0],customerName:customer.name,company:customer.company,projectName:projName,items:cart.map(i=>`${i.product.model}×${i.qty}`).join("、"),subtotal:lampSubtotal,tax:0,shipping:0,total:0,isVip:isVip?"是":"否",discount:discountLabel||"牌價"});
    }
    sendNotifyEmail(
      `【報價單】${customer.name}（${customer.company||"訪客"}）— ${projName}`,
      `━━━━━━━━━━━━━━━━━━━━\n報價單下載通知\n━━━━━━━━━━━━━━━━━━━━\n客　　戶：${customer.name}\n公　　司：${customer.company||"—"}\n聯絡電話：${customer.phone||"—"}\n案　　名：${projName||"—"}\n折　扣：${discountLabel||"牌價"}\n━━━━━━━━━━━━━━━━━━━━\n品項明細：\n${cart.map(i=>{const p=i.product;const price=Math.round((isVip?Number(p.projPrice):Number(p.stdPrice))*discountRate);return `  • ${p.model}（${p.series}）× ${i.qty} 盞  NT$${price.toLocaleString()}/盞  小計 NT$${(price*i.qty).toLocaleString()}`;}).join("\n")}\n━━━━━━━━━━━━━━━━━━━━\n燈具小計：NT$ ${lampSubtotal.toLocaleString()}\n稅金(5%)：NT$ ${Math.round(lampSubtotal*0.05).toLocaleString()}\n含稅總計：NT$ ${Math.round(lampSubtotal*1.05).toLocaleString()}\n━━━━━━━━━━━━━━━━━━━━\nLEDOUX 諾科照明 報價系統自動通知`
    );
    toast$("報價單已下載");
  };

  // ✅ handleGenPDF：確認後先問安裝，再下載
  const handleGenPDF = () => {
    if(!projName.trim()){toast$("請先填寫案名");return;}
    if(!allChecked){toast$("請先勾選確認所有注意事項");return;}
    // 先跳出安裝詢問 Modal
    setInstallChoice(null);
    setInstallAskModal(true);
  };

    const doActualDownload = () => {
    // 優先使用詢價單填寫的客戶資料，其次用登入資料
    const company = custCompany.trim() || (isGuest ? "" : user.company) || "";
    const name    = custName.trim()    || (isGuest ? "" : user.name)    || "";
    const phone   = custPhone.trim()   || "";
    const address = custAddress.trim() || "";
    if(isGuest && (!company || !name)){
      const errs={};
      if(!guestInfo.company.trim()&&!company)errs.company="必填";
      if(!guestInfo.contact.trim()&&!name)errs.contact="必填";
      if(!guestInfo.phone.trim()&&!phone)errs.phone="必填";
      if(Object.keys(errs).length>0){setGuestErr(errs);setGuestModal(true);return;}
    }
    doPdfDownload({
      company: company || guestInfo.company,
      name:    name    || guestInfo.contact,
      phone:   phone   || guestInfo.phone,
      address: address,
      position: isGuest ? "" : (user.position||"")
    });
  };

// 安裝 Modal 確認後：不需要安裝 → 直接下載；需要安裝 → 開安裝 Panel 再回來
  const handleInstallAnswer = (needInstall) => {
    setInstallAskModal(false);
    setInstallChoice(needInstall);
    if (needInstall) {
      setInstOpen(true); // 開安裝 Panel 讓客戶填
      toast$("請填寫安裝資訊，完成後再按「下載報價單」");
    } else {
      doActualDownload();
    }
  };
  const handleGuestConfirm = () => {
    const errs={};
    if(!guestInfo.company.trim())errs.company="必填";
    if(!guestInfo.contact.trim())errs.contact="必填";
    if(!guestInfo.phone.trim())errs.phone="必填";
    setGuestErr(errs);
    if(Object.keys(errs).length>0)return;
    setGuestModal(false);
    doPdfDownload({company:guestInfo.company,name:guestInfo.contact,position:"",phone:guestInfo.phone});
  };

  const invStatusLabel = item => {
    if(Number(item.availableQty)<=0) return {cls:"out",label:"已售完"};
    if(Number(item.availableQty)<=5) return {cls:"low",label:"庫存偏低"};
    return {cls:"in-stock",label:"現貨供應"};
  };

  // ✅ 配燈服務申請 + Email 通知
  const submitDesignForm = async () => {
    if(!designForm.company||!designForm.name||!designForm.phone){toast$("請填寫必填欄位");return;}
    if(sheetUrl){await sheetPost("saveOrder",{id:"DESIGN"+Date.now(),date:new Date().toISOString().split("T")[0],customerName:designForm.name,company:designForm.company,projectName:designForm.project||"配燈服務申請",items:"照明設計配燈服務",subtotal:0,tax:0,shipping:0,total:0,isVip:"設計服務",discount:"配燈服務"});}
    setDesignDone(true);
    toast$("申請已送出，專員將盡快聯繫");
    await sendNotifyEmail(
      `【配燈服務申請】${designForm.name}（${designForm.company}）`,
      `新照明設計配燈服務申請\n\n公司：${designForm.company}\n聯絡人：${designForm.name}\n電話：${designForm.phone}\n案名：${designForm.project||"—"}\n時間：${new Date().toLocaleString("zh-TW")}`
    );
  };

  // ✅ 電子型錄：改為開新分頁（修復 Google Drive iframe 被擋問題）
  const openCatalog = c => {
    if(!c.available){toast$("型錄準備中，請稍後");return;}
    window.open(c.previewUrl,"_blank","noopener,noreferrer");
  };

  const saveCatalog = (id,field,value) => setCatalogs(cs=>cs.map(c=>c.id===id?{...c,[field]:value}:c));

  const doAddProd = () => { if(!newProd.model)return; const imgs=newProd.images?newProd.images.split("\n").map(s=>s.trim()).filter(Boolean):[]; const nl=[...products,{...newProd,id:Date.now(),stdPrice:Number(newProd.stdPrice)||0,projPrice:Number(newProd.projPrice)||0,shipping:Number(newProd.shipping)||90,images:imgs}]; setProducts(nl); syncProducts(nl); setShowAdd(false); toast$("產品已新增"); };
  const startEdit  = p => setEditProd({...p,images:(p.images||[]).join("\n")});
  const saveEdit   = () => { const imgs=editProd.images?String(editProd.images).split("\n").map(s=>s.trim()).filter(Boolean):[]; const updated={...editProd,stdPrice:Number(editProd.stdPrice)||0,projPrice:Number(editProd.projPrice)||0,shipping:Number(editProd.shipping)||90,images:imgs}; const nl=products.map(p=>p.id===updated.id?updated:p); setProducts(nl); syncProducts(nl); if(selProd?.id===editProd.id)setSelProd(updated); setEditProd(null); toast$("產品已更新"); };
  const saveInvRow = async item => { const avail=Number(item.totalQty)-Number(item.reservedQty); const updated={...item,availableQty:avail,updatedAt:new Date().toISOString().split("T")[0]}; const nl=inventory.map(i=>i.id===updated.id?updated:i); setInventory(nl); setEditInvItem(null); await syncUpsertInv(updated); toast$(`${updated.model} 庫存已儲存`); };
  const deleteInvRow = async id => { const nl=inventory.filter(i=>i.id!==id); setInventory(nl); await syncInventory(nl); toast$("庫存項目已刪除"); };
  const doAddInv   = async () => { if(!newInv.model)return; const avail=Number(newInv.totalQty)-Number(newInv.reservedQty); const item={...newInv,id:"inv"+Date.now(),availableQty:avail,updatedAt:new Date().toISOString().split("T")[0]}; const nl=[...inventory,item]; setInventory(nl); await syncUpsertInv(item); setShowAddInv(false); setNewInv({model:"",series:"",category:"崁燈",watt:"",cct:"3000K",color:"白色",totalQty:0,reservedQty:0,availableQty:0,location:"",note:""}); toast$("庫存項目已新增"); };

  const invTotal = inventory.reduce((s,i)=>s+Number(i.totalQty),0);
  const invAvail = inventory.reduce((s,i)=>s+Number(i.availableQty),0);

  if(!user) return(
    <><style>{G}</style>
    <div className="auth-page">
      <div className="auth-visual">
        <div className="av-logo">LEDOUX</div>
        <div style={{marginTop:"auto",position:"relative",zIndex:1}}>
          <div className="av-rule"/>
          <div className="av-title">Quotation<br/>Platform</div>
          <div className="av-sub">諾科照明 · 專業報價系統</div>
        </div>
      </div>
      <div className="auth-form-side">
        <div className="auth-inner">
          <div className="auth-logo-sm">LEDOUX</div>
          <div className="auth-tagline">Taiwan · 諾科照明</div>
          <div style={{marginBottom:28}}>
            <div style={{fontSize:"8px",letterSpacing:"4px",textTransform:"uppercase",color:"var(--muted)",marginBottom:14,paddingBottom:10,borderBottom:"0.5px solid var(--bdr2)"}}>訪客瀏覽</div>
            <div style={{fontSize:12,color:"var(--muted)",lineHeight:1.8,marginBottom:14}}>免帳號直接瀏覽產品目錄、電子型錄、選燈、產生報價單。</div>
            <button className="btn-primary" onClick={()=>setUser({role:"guest",name:"訪客",company:"",position:"",username:"guest"})}>訪客瀏覽 · 免登入</button>
          </div>
          <div className="sec-lbl">管理員登入</div>
          <div className="lf"><label>帳號</label><input value={loginF.username} onChange={e=>setLoginF(p=>({...p,username:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="請輸入帳號"/></div>
          <div className="lf"><label>密碼</label><input type="password" value={loginF.password} onChange={e=>setLoginF(p=>({...p,password:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="請輸入密碼"/></div>
          <button className="btn-outline" style={{width:"100%",marginTop:6}} onClick={doLogin}>管理員登入</button>
          {loginErr&&<div className="auth-err">{loginErr}</div>}
        </div>
      </div>
    </div>
    </>
  );

  return (
    <><style>{G}</style>
    <div className="app">

      {/* SIDE MENU */}
      {menuOpen&&<div className="sidemenu-overlay" onClick={()=>setMenuOpen(false)}/>}
      <div className={`sidemenu ${menuOpen?"open":""}`}>
        <div className="sm-head"><div className="sm-logo">LEDOUX</div><button className="sm-close-btn" onClick={()=>setMenuOpen(false)}><CloseIcon/></button></div>
        <div className="sm-user">
          <div className="sm-uname">{user.name}</div>
          <div className="sm-ucomp">{user.company}</div>
          <span className={`sm-ubadge ${user.role==="admin"?"tb-admin":user.role==="vip"?"tb-vip":"tb-std"}`}>{roleLabel(user.role)}</span>
        </div>
        <div className="sm-nav">
          <div className="sm-sec">主選單</div>
          {[{id:"catalog",label:"產品目錄"},{id:"inquiry",label:"詢價單",badge:cartCount},{id:"sample",label:"借樣品",badge:sampCart.length},{id:"install",label:"安裝服務"},{id:"design",label:"照明設計服務"}].map(n=>(
            <div key={n.id} className={`sm-item ${page===n.id?"on":""}`} onClick={()=>{setPage(n.id);setMenuOpen(false);}}>
              <span>{n.label}</span>{n.badge>0&&<span className="sm-badge">{n.badge}</span>}
            </div>
          ))}
          <div className={`sm-item cat-item ${page==="ecatalog"?"on":""}`} onClick={()=>{setPage("ecatalog");setMenuOpen(false);}}>
            <span>電子型錄</span><span className="sm-badge gold">{catalogs.length}</span>
          </div>
          <div className={`sm-item inv ${page==="inventory"?"on":""}`} onClick={()=>{setPage("inventory");setMenuOpen(false);}}>
            <span>台灣現貨庫存</span>
            {inventory.filter(i=>Number(i.availableQty)>0).length>0&&<span className="sm-badge green">{inventory.filter(i=>Number(i.availableQty)>0).length}</span>}
          </div>
          <div className="sm-divider"/>
          <div className="sm-group-hd" onClick={()=>setSeriesExp(v=>!v)}>
            <span style={{fontSize:"7px",letterSpacing:"4px",textTransform:"uppercase"}}>商照燈系列</span>
            <span className={`sm-group-arrow ${seriesExp?"open":""}`}>›</span>
          </div>
          {seriesExp&&COMMERCIAL_SERIES.map(s=>(
            <div key={s} className={`sm-sub ${seriesF===s?"on":""}`} onClick={()=>{setSeriesF(s);setCat("全部");setPage("catalog");setMenuOpen(false);}}>
              <span className="sm-dot"/>{s}
              {!allSeries.includes(s)&&<span style={{fontSize:"8px",color:"var(--muted)",marginLeft:4}}>（即將上架）</span>}
            </div>
          ))}
          <div className="sm-group-hd" onClick={()=>setCatExp(v=>!v)}>
            <span style={{fontSize:"7px",letterSpacing:"4px",textTransform:"uppercase"}}>線型燈系列</span>
            <span className={`sm-group-arrow ${catExp?"open":""}`}>›</span>
          </div>
          {catExp&&LINEAR_SERIES_LIST.map(s=>(
            <div key={s} className={`sm-sub ${seriesF===s?"on":""}`} onClick={()=>{setSeriesF(s);setCat("全部");setPage("catalog");setMenuOpen(false);}}>
              <span className="sm-dot"/>{s}
              {!allSeries.includes(s)&&<span style={{fontSize:"8px",color:"var(--muted)",marginLeft:4}}>（即將上架）</span>}
            </div>
          ))}
          <div className="sm-divider"/>
          <div className="sm-group-hd" onClick={()=>setCatExp(v=>!v)}>
            <span style={{fontSize:"7px",letterSpacing:"4px",textTransform:"uppercase"}}>依分類</span>
            <span className={`sm-group-arrow ${catExp?"open":""}`}>›</span>
          </div>
          {catExp&&allCats.map(c=>(
            <div key={c} className={`sm-sub ${!seriesF&&cat===c&&page==="catalog"?"on":""}`} onClick={()=>{setCat(c);setSeriesF(null);setPage("catalog");setMenuOpen(false);}}>
              <span className="sm-dot"/>{c}
            </div>
          ))}
          {isAdmin&&<>
            <div className="sm-divider"/>
            <div className="sm-sec">管理</div>
            {[{id:"members",label:"帳號管理"},{id:"products",label:"產品管理"},{id:"inv_admin",label:"庫存管理"},{id:"cat_admin",label:"型錄管理"},{id:"cloud_settings",label:"雲端設定"},{id:"sample_admin",label:"樣品申請",badge:sampleReqs.filter(r=>r.status==="pending").length},{id:"install_admin",label:"安裝申請",badge:installOrd.filter(o=>o.status==="pending").length}].map(n=>(
              <div key={n.id} className={`sm-item ${page===n.id?"on":""}`} onClick={()=>{setPage(n.id);setMenuOpen(false);}}>
                <span>{n.label}</span>{n.badge>0&&<span className="sm-badge">{n.badge}</span>}
              </div>
            ))}
          </>}
        </div>
        <div className="sm-foot"><button className="btn-sm-out" onClick={()=>{setUser(null);setPage("catalog");setMenuOpen(false);}}>登出系統</button></div>
      </div>

      {/* TOPNAV */}
      <nav className="topnav">
        <div className="tn-left">
          <button className="tn-burger" onClick={()=>setMenuOpen(v=>!v)}><span/><span/><span/></button>
          <div className="tn-logo">LEDOUX</div>
          <div className="search-wrap">
            <span className="s-icon"><SearchIcon/></span>
            <input className="search-inp" placeholder="SEARCH" value={searchQ}
              onChange={e=>setSearchQ(e.target.value)}
              onFocus={()=>{clearTimeout(blurRef.current);setSearchFocus(true);}}
              onBlur={()=>{blurRef.current=setTimeout(()=>setSearchFocus(false),180);}}
              onKeyDown={e=>e.key==="Enter"&&doSearch(searchQ)}/>
            {searchQ&&<button className="s-clear" onClick={()=>setSearchQ("")}><CloseIcon/></button>}
            {searchFocus&&(<div className="s-drop">
              {searchQ&&suggs.length>0&&<><div className="sd-sec">建議</div>{suggs.map(s=><div key={s} className="sd-item" onClick={()=>doSearch(s)}>{s}</div>)}</>}
              {searchHist.length>0&&<><div className="sd-sec">搜索記錄</div>{searchHist.map(h=><div key={h} className="sd-item" onClick={()=>doSearch(h)}>{h}</div>)}</>}
              {!searchQ&&<><div className="sd-sec">熱門</div>{HOT_KEYWORDS.map(k=><div key={k} className="sd-item hot" onClick={()=>doSearch(k)}>{k}</div>)}</>}
            </div>)}
          </div>
          {sheetUrl&&<div style={{display:"flex",alignItems:"center",gap:5}}>
            <div className={`sync-dot ${syncStatus}`}/>
            <span className="sync-label">{syncStatus==="off"?"本地":syncStatus==="loading"?"同步中":"已同步"}</span>
          </div>}
        </div>
        <div className="tn-right">
          <button className="tn-icon" title="電子型錄" style={{color:"#8a7040"}} onClick={()=>{setPage("ecatalog");setCartOpen(false);setSampOpen(false);setInstOpen(false);}}>
            <BookIcon/>
          </button>
          <button className="tn-icon inv-icon" title="台灣現貨庫存" onClick={()=>{setPage("inventory");setCartOpen(false);setSampOpen(false);setInstOpen(false);}}>
            <BoxIcon/>{inventory.filter(i=>Number(i.availableQty)>0).length>0&&<span className="tn-ibadge green">{inventory.filter(i=>Number(i.availableQty)>0).length}</span>}
          </button>
          <button className="tn-icon" title="安裝服務" onClick={()=>{setInstOpen(v=>!v);setCartOpen(false);setSampOpen(false);}}>
            <ToolIcon/>
          </button>
          <button className="tn-icon" title="借樣品" onClick={()=>{setSampOpen(v=>!v);setCartOpen(false);setInstOpen(false);}}>
            <FlaskIcon/>{sampCart.length>0&&<span className="tn-ibadge red">{sampCart.length}</span>}
          </button>
          <button className="tn-icon" title="詢價單" onClick={()=>{setCartOpen(v=>!v);setSampOpen(false);setInstOpen(false);}}>
            <BagIcon/>{cartCount>0&&<span className="tn-ibadge">{cartCount}</span>}
          </button>
          <div className="tn-user-info"><div className="tn-uname">{user.name}</div><div className="tn-ucomp">{user.company}</div></div>
          <span className={`tn-badge ${user.role==="admin"?"tb-admin":user.role==="vip"?"tb-vip":"tb-std"}`}>{roleLabel(user.role)}</span>
          <button className="btn-signout" onClick={()=>setContactModal(true)} style={{borderColor:"rgba(184,147,90,.3)",color:"var(--gold)"}}>聯繫業務</button>
          <button className="btn-signout" onClick={()=>{setUser(null);setPage("catalog");}}>登出</button>
        </div>
      </nav>

      {/* 業務聯絡資訊 Modal */}
      {contactModal&&<div className="modal-wrap" onClick={()=>setContactModal(false)}>
        <div className="modal-box" onClick={e=>e.stopPropagation()} style={{maxWidth:380}}>
          <div className="modal-head">
            <div className="modal-title">聯繫業務專員</div>
            <button className="close-btn" onClick={()=>setContactModal(false)}><CloseIcon/></button>
          </div>
          <div className="modal-body">
            <div style={{marginBottom:18}}>
              <div style={{fontSize:"7px",letterSpacing:"4px",textTransform:"uppercase",color:"var(--muted)",marginBottom:14,paddingBottom:8,borderBottom:"0.5px solid var(--bdr2)"}}>直接聯繫</div>
              <a href={"tel:"+CONTACT_PHONE} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",border:"0.5px solid var(--bdr2)",background:"#f9f5ef",textDecoration:"none",color:"var(--blk)",marginBottom:10,borderLeft:"3px solid var(--gold)"}}>
                <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:"var(--gold)",minWidth:18}}>☎</span>
                <div>
                  <div style={{fontSize:"7px",letterSpacing:"3px",textTransform:"uppercase",color:"var(--muted)",marginBottom:3}}>電話 ／ LINE</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,letterSpacing:1}}>{CONTACT_PHONE}</div>
                </div>
              </a>
              <a href={"mailto:"+CONTACT_EMAIL} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",border:"0.5px solid var(--bdr2)",background:"#f9f5ef",textDecoration:"none",color:"var(--blk)",borderLeft:"3px solid var(--gold)"}}>
                <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"var(--gold)",minWidth:18}}>✉</span>
                <div>
                  <div style={{fontSize:"7px",letterSpacing:"3px",textTransform:"uppercase",color:"var(--muted)",marginBottom:3}}>Email</div>
                  <div style={{fontSize:13,letterSpacing:.5}}>{CONTACT_EMAIL}</div>
                </div>
              </a>
            </div>
            <div style={{background:"#f4efe8",borderLeft:"2px solid var(--gold)",padding:"10px 14px",fontSize:11,color:"var(--muted)",lineHeight:1.8}}>
              設計公司、建築師事務所、合作專案客戶，歡迎聯繫業務洽談<strong style={{color:"var(--gold)"}}>專屬折扣報價</strong>。
            </div>
          </div>
        </div>
      </div>}
      {/* 安裝詢問 Modal */}
      {installAskModal&&<div className="modal-wrap" onClick={()=>setInstallAskModal(false)}>
        <div className="modal-box" onClick={e=>e.stopPropagation()} style={{maxWidth:440}}>
          <div className="modal-head">
            <div className="modal-title">需要安裝服務嗎？</div>
            <button className="close-btn" onClick={()=>setInstallAskModal(false)}><CloseIcon/></button>
          </div>
          <div className="modal-body">
            <div className="hint-box" style={{marginBottom:20}}>
              <strong style={{display:"block",marginBottom:5,color:"var(--blk)"}}>LEDOUX 專業安裝服務</strong>
              崁燈 NT$200/盞 · 線型燈 NT$500/米 · 最低出勤費 NT$2,000<br/>
              請事先完成開孔、拉好電線至預定位置。
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <button onClick={()=>handleInstallAnswer(true)} style={{padding:"18px 12px",background:"var(--blk)",border:"none",color:"var(--ivory)",fontFamily:"'Noto Sans TC',sans-serif",fontSize:"9px",letterSpacing:"3px",cursor:"pointer",textTransform:"uppercase",lineHeight:1.8}}>
                需要安裝<br/><span style={{fontSize:"8px",color:"#9a8a7a",letterSpacing:"1px"}}>填寫安裝資訊</span>
              </button>
              <button onClick={()=>handleInstallAnswer(false)} style={{padding:"18px 12px",background:"transparent",border:"0.5px solid var(--bdr)",color:"var(--muted)",fontFamily:"'Noto Sans TC',sans-serif",fontSize:"9px",letterSpacing:"3px",cursor:"pointer",textTransform:"uppercase",lineHeight:1.8}}>
                不需要<br/><span style={{fontSize:"8px",letterSpacing:"1px"}}>直接下載報價單</span>
              </button>
            </div>
          </div>
        </div>
      </div>}

      {/* ✅ 訪客資料 Modal（修復版）*/}
      {guestModal&&<div className="modal-wrap" onClick={()=>setGuestModal(false)}>
        <div className="modal-box" onClick={e=>e.stopPropagation()}>
          <div className="modal-head"><div className="modal-title">填寫公司資料</div><button className="close-btn" onClick={()=>setGuestModal(false)}><CloseIcon/></button></div>
          <div className="modal-body">
            <div className="hint-box" style={{marginBottom:16}}>下載報價單前請填寫基本聯絡資料，資料僅用於報價單顯示。</div>
            {[["公司名稱","company","公司全名"],["聯絡人","contact","姓名"],["聯絡電話","phone","0912-345-678"]].map(([l,k,ph])=>(
              <div key={k} className="lf">
                <label>{l} <span className="req">*</span></label>
                <input value={guestInfo[k]} onChange={e=>setGuestInfo(p=>({...p,[k]:e.target.value}))} placeholder={ph}/>
                {guestErr[k]&&<div className="ferr">{guestErr[k]}</div>}
              </div>
            ))}
            <div className="form-actions" style={{marginTop:18}}>
              <button className="btn-confirm" onClick={handleGuestConfirm}>確認並下載</button>
              <button className="btn-cancel-sm" onClick={()=>setGuestModal(false)}>取消</button>
            </div>
          </div>
        </div>
      </div>}

      <div className="content">

        {/* ══ 電子型錄 ══ */}
        {page==="ecatalog"&&<>
          <div className="cat-hero">
            <div className="cat-hero-eyebrow">
              <div className="cat-hero-line"/>
              <span className="cat-hero-eyebrow-txt">Digital Catalogue · 電子型錄</span>
              <div className="cat-hero-line"/>
            </div>
            <div className="cat-hero-title">完整照明<em>解決方案</em></div>
            <div className="cat-hero-sub">Ledoux Lighting Taiwan · 2025</div>
            <div className="cat-hero-desc">下載或線上瀏覽完整產品手冊，涵蓋全系列燈具的技術規格、安裝說明與應用情境，是您選燈配燈的最佳參考資料。</div>
          </div>
          <ProjBanner onContact={()=>setContactModal(true)}/>
          <div className="cat-grid">
            {catalogs.map(c=>(
              <div key={c.id} className="cat-card">
                <div className="cat-cover" onClick={()=>openCatalog(c)}>
                  <div className="cat-cover-bg" style={{background:`linear-gradient(135deg,${c.coverColor} 0%,#0e0d0c 100%)`}}/>
                  <div className="cat-cover-lines"/>
                  <div className="cat-cover-deco" style={{borderColor:c.accentColor}}/>
                  <div className="cat-cover-deco2" style={{borderColor:c.accentColor}}/>
                  <div className="cat-cover-content">
                    <div className="cat-cover-edition" style={{color:c.accentColor}}>{c.edition}</div>
                    <div className="cat-cover-title">{c.title}</div>
                    <div className="cat-cover-sub">{c.subtitle}</div>
                  </div>
                  {!c.available&&<div style={{position:"absolute",top:0,right:0,background:"rgba(14,13,12,.7)",padding:"6px 12px",fontSize:"7px",letterSpacing:"3px",textTransform:"uppercase",color:"#5a4a3a"}}>準備中</div>}
                </div>
                <div className="cat-body">
                  <div className="cat-desc">{c.description}</div>
                  <div className="cat-tags">{c.tags.map(t=><span key={t} className="cat-tag">{t}</span>)}</div>
                  <div className="cat-meta">
                    <div className="cat-meta-item"><span className="cat-meta-lbl">頁數</span><span className="cat-meta-val">{c.pageCount} p.</span></div>
                    <div className="cat-meta-item"><span className="cat-meta-lbl">檔案大小</span><span className="cat-meta-val">{c.fileSize}</span></div>
                    <div className="cat-meta-item"><span className="cat-meta-lbl">更新</span><span className="cat-meta-val">{c.updatedAt}</span></div>
                  </div>
                  {!c.available&&<div className="cat-coming"><span style={{width:5,height:5,borderRadius:"50%",background:"var(--muted)",display:"inline-block",flexShrink:0}}/>型錄整備中，預計近期上架</div>}
                </div>
                <div className="cat-actions">
                  {/* ✅ 開新分頁預覽，不用 iframe */}
                  <button className="btn-cat-preview" disabled={!c.available} onClick={()=>openCatalog(c)}>
                    <EyeIcon/> 開新分頁預覽
                  </button>
                  <a href={c.available?c.downloadUrl:undefined} target="_blank" rel="noopener noreferrer" download style={{textDecoration:"none"}}>
                    <button className="btn-cat-dl" disabled={!c.available}><DownloadIcon/> 下載</button>
                  </a>
                </div>
              </div>
            ))}
          </div>
          <div style={{border:"0.5px solid var(--bdr2)",padding:"24px 28px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:14}}>
            <div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:300,marginBottom:4}}>需要實體型錄？</div>
              <div style={{fontSize:11,color:"var(--muted)",lineHeight:1.7}}>如需紙本型錄或有選燈配燈需求，歡迎聯繫業務專員。</div>
            </div>
            <button className="btn-primary" style={{width:"auto",padding:"11px 28px"}} onClick={()=>setContactModal(true)}>聯繫業務</button>
          </div>
        </>}

        {/* ══ 型錄管理 ══ */}
        {page==="cat_admin"&&isAdmin&&<>
          <div className="phead"><div><div className="ptitle">型錄管理</div><div className="psub">更新 Google Drive 分享連結後按「儲存」即生效</div></div></div>
          <div className="hint-box">
            <strong style={{color:"var(--blk)",display:"block",marginBottom:4}}>✅ 連結說明（已改為開新分頁，不用 iframe）</strong>
            預覽連結：直接填 Google Drive 分享連結（<code style={{fontSize:10,background:"#f0ebe2",padding:"1px 5px"}}>.../view?usp=sharing</code>）<br/>
            下載連結：<code style={{fontFamily:"monospace",fontSize:10,background:"#f0ebe2",padding:"1px 5px"}}>https://drive.google.com/uc?export=download&id=FILE_ID</code>
          </div>
          {catalogs.map(c=>(
            <div key={c.id} className="cat-setting-card">
              <div className="cat-setting-header">
                <div className="cat-setting-title">{c.title}</div>
                <span style={{fontSize:8,padding:"2px 9px",border:"0.5px solid",letterSpacing:2,textTransform:"uppercase",color:c.available?"var(--green)":"var(--muted)",borderColor:c.available?"rgba(58,107,74,.4)":"var(--bdr)"}}>{c.available?"已上架":"準備中"}</span>
              </div>
              <div className="cat-url-row">
                <label>預覽 URL（Google Drive 分享連結）</label>
                <input className="cat-url-inp" value={c.previewUrl} onChange={e=>saveCatalog(c.id,"previewUrl",e.target.value)} placeholder="https://drive.google.com/file/d/FILE_ID/view?usp=sharing"/>
                <div className="cat-url-hint">直接貼上 Google Drive 分享連結即可，點擊後會開啟新分頁。</div>
              </div>
              <div className="cat-url-row">
                <label>下載 URL</label>
                <input className="cat-url-inp" value={c.downloadUrl} onChange={e=>saveCatalog(c.id,"downloadUrl",e.target.value)} placeholder="https://drive.google.com/uc?export=download&id=FILE_ID"/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>
                {[["版次","edition"],["頁數","pageCount"],["更新日期","updatedAt"]].map(([l,k])=>(
                  <div key={k}><label style={{display:"block",fontSize:"7px",letterSpacing:"2px",textTransform:"uppercase",color:"var(--muted)",marginBottom:5}}>{l}</label>
                  <input style={{width:"100%",padding:"7px 0",background:"transparent",border:"none",borderBottom:"0.5px solid var(--bdr)",fontFamily:"'Noto Sans TC',sans-serif",fontSize:12,outline:"none"}} value={c[k]} onChange={e=>saveCatalog(c.id,k,e.target.value)}/></div>
                ))}
              </div>
              <label className="cat-avail-toggle">
                <input type="checkbox" checked={c.available} onChange={e=>saveCatalog(c.id,"available",e.target.checked)}/>
                <span>啟用此型錄（勾選後訪客可預覽與下載）</span>
              </label>
              <div className="form-actions" style={{marginTop:14}}>
                <button className="btn-confirm" onClick={()=>toast$(`${c.title} 設定已儲存`)}>儲存設定</button>
                <button className="btn-cancel-sm" onClick={()=>setPage("ecatalog")}>預覽效果</button>
              </div>
            </div>
          ))}
        </>}

        {/* ══ 產品目錄 ══ */}
        {page==="catalog"&&<>
          <div className="phead">
            <div>
              <div className="ptitle">{seriesF?seriesF:searchQ?"搜索結果":"產品目錄"}</div>
              <div className="psub">{searchQ?`${searchQ} — ${filtered.length} 件`:isVip?"顯示標準價與專案價":"顯示標準售價"}</div>
            </div>
            <div style={{display:"flex",gap:12,alignItems:"center"}}>
              {(seriesF||searchQ||activeTags.length>0)&&<button className="btn-cancel-sm" onClick={clearTags}>清除篩選</button>}
              <span style={{fontSize:10,color:"var(--muted)",letterSpacing:2}}>{filtered.length} 件</span>
            </div>
          </div>
          {/* ✅ 設計公司橫幅 */}
          <ProjBanner onContact={()=>setContactModal(true)}/>
          {!seriesF&&!searchQ&&<div className="catbar">{["全部",...allCats].map(c=><button key={c} className={`catbtn ${cat===c?"on":""}`} onClick={()=>{setCat(c);setActiveTags([]);}}>{c}</button>)}</div>}
          <div className="filter-area">
            <div className="filter-row"><span className="filter-row-label">瓦數</span>{allWatts.map(w=><button key={w} className={`filter-tag ${hasTag("watt",w)?"on":""}`} onClick={()=>toggleTag("watt",w)}>{w}</button>)}</div>
            <div className="filter-row"><span className="filter-row-label">色溫</span>{allCcts.map(c=><button key={c} className={`filter-tag ${hasTag("cct",c)?"on":""}`} onClick={()=>toggleTag("cct",c)}>{c}</button>)}</div>
            <div className="filter-row"><span className="filter-row-label">演色性</span>{["Ra≥80","Ra≥90","Ra≥95","Ra≥98"].map(r=><button key={r} className={`filter-tag ${hasTag("cri",r)?"on":""}`} onClick={()=>toggleTag("cri",r)}>{r}</button>)}</div>
            <div className="filter-row"><span className="filter-row-label">防水</span>{["IP20","IP67","3C"].map(c=><button key={c} className={`filter-tag ${hasTag("cert",c)?"on":""}`} onClick={()=>toggleTag("cert",c)}>{c}</button>)}</div>
            {activeTags.length>0&&<div className="filter-active-bar">
              <span style={{fontSize:"7px",letterSpacing:"2px",textTransform:"uppercase",color:"var(--muted)"}}>已選：</span>
              {activeTags.map(t=><span key={t.type+t.value} className="filter-chip">{t.value}<button className="filter-chip-x" onClick={()=>toggleTag(t.type,t.value)}>×</button></span>)}
              <button className="filter-clear" onClick={clearTags}>清除全部</button>
            </div>}
          </div>
          <div className="pgrid">
            {filtered.map(p=>{
              const isEditing=isAdmin&&inlineEdit===p.id;
              const d=isEditing?inlineData:p;
              return(
              <div key={p.id} className="pcard" onClick={()=>!isEditing&&setSelProd(p)}>
                {hasStock(p.model)&&<div className="pcard-stock-badge"><span className="pcard-stock-dot"/>台灣現貨</div>}
                <div className="pcard-img">{p.images?.[0]?<img src={p.images[0]} alt={p.model}/>:<PlaceholderIcon/>}</div>
                <div className="pcard-body">
                  <div className="pcard-series">{p.series}</div>
                  <div className="pcard-model">{p.model}</div>
                  {isEditing?(
                    <div onClick={e=>e.stopPropagation()} style={{marginBottom:8}}>
                      {[["瓦數","watt"],["色溫","cct"],["開孔","cutout"],["建議牌價","stdPrice"],["備註","note"]].map(([l,k])=>(
                        <div key={k} style={{marginBottom:6}}>
                          <div style={{fontSize:"7px",letterSpacing:"2px",textTransform:"uppercase",color:"var(--muted)",marginBottom:2}}>{l}</div>
                          <input type={k==="stdPrice"?"number":"text"} value={d[k]||""} onChange={e=>setInlineData(x=>({...x,[k]:e.target.value}))} style={{width:"100%",padding:"5px 7px",border:"0.5px solid var(--gold)",background:"#fffef9",fontFamily:"'Noto Sans TC',sans-serif",fontSize:11,outline:"none"}}/>
                        </div>
                      ))}
                      <div style={{display:"flex",gap:6,marginTop:8}}>
                        <button className="btn-save-inv" onClick={()=>{const updated={...p,...inlineData,stdPrice:Number(inlineData.stdPrice||p.stdPrice),projPrice:Number(inlineData.projPrice||p.projPrice)};const nl=products.map(x=>x.id===p.id?updated:x);setProducts(nl);syncProducts(nl);setInlineEdit(null);toast$(`${p.model} 已儲存`);}}>儲存</button>
                        <button className="btn-cancel-sm" style={{padding:"4px 9px",fontSize:9}} onClick={()=>setInlineEdit(null)}>取消</button>
                      </div>
                    </div>
                  ):<div className="pcard-desc">{p.desc}</div>}
                  <div className="pcard-tags">
                    {p.watt&&<span className="ptag">{p.watt}</span>}
                    {p.beam&&<span className="ptag">{p.beam}</span>}
                    {p.cct&&<span className="ptag">{p.cct}</span>}
                    {hasStock(p.model)&&<span className="ptag stag">當日出貨</span>}
                  </div>
                  <div className="pcard-price">
                    <div style={{fontSize:"7px",letterSpacing:"2px",color:"var(--muted)",textTransform:"uppercase",marginBottom:2}}>建議牌價</div>
                    {p.stdPrice>0?<div className="price-val">NT$ {p.stdPrice?.toLocaleString()}</div>:<div className="price-nq">請洽業務報價</div>}
                  </div>
                  {isAdmin&&!isEditing&&<button onClick={e=>{e.stopPropagation();setInlineEdit(p.id);setInlineData({watt:p.watt,cct:p.cct,cutout:p.cutout,stdPrice:p.stdPrice,projPrice:p.projPrice,note:p.note});}} style={{marginTop:8,width:"100%",padding:"5px",background:"transparent",border:"0.5px solid var(--bdr)",color:"var(--muted)",fontFamily:"'Noto Sans TC',sans-serif",fontSize:"8px",letterSpacing:"2px",cursor:"pointer",textTransform:"uppercase"}}>編輯規格</button>}
                </div>
              </div>
            );})}
            {filtered.length===0&&<div className="empty" style={{gridColumn:"1/-1"}}>找不到符合的產品</div>}
          </div>
        </>}

        {/* ══ 台灣現貨庫存 ══ */}
        {page==="inventory"&&<>
          <div className="inv-hero">
            <div className="inv-hero-badge"><span className="inv-hero-bdot"/>1–3 工作天出貨 · 快速到貨</div>
            <div className="inv-hero-title">桃園倉儲 · 即時供應</div>
            <div className="inv-hero-sub">Taiwan Stock · Ready to Ship</div>
            <div className="inv-hero-desc">台灣現貨直送，<strong>下單後預計 1–3 個工作天內出貨</strong>（不含國定假日及特殊假日），台灣本島全境<strong>快速安排到貨</strong>。</div>
          </div>
          <div className="inv-stats">
            <div className="inv-stat"><div className="inv-stat-num">{invTotal.toLocaleString()}</div><div className="inv-stat-lbl">總庫存</div></div>
            <div className="inv-stat"><div className="inv-stat-num">{invAvail.toLocaleString()}</div><div className="inv-stat-lbl">可調貨數量</div></div>
            <div className="inv-stat"><div className="inv-stat-num">{inventory.length}</div><div className="inv-stat-lbl">品項數 SKU</div></div>
          </div>
          <div className="inv-catbar">{allInvCats.map(c=><button key={c} className={`inv-catbtn ${invCat===c?"on":""}`} onClick={()=>setInvCat(c)}>{c}</button>)}</div>
          <div className="inv-grid">
            {filteredInv.map(item=>{
              const st=invStatusLabel(item);
              return(
                <div key={item.id} className="inv-card">
                  <div className="inv-card-top"><div><div className="inv-card-model">{item.model}</div><div className="inv-card-series">{item.series}</div></div><span className={`inv-status ${st.cls}`}>{st.label}</span></div>
                  <div className="inv-specs">{item.watt&&<span className="inv-spec-tag">{item.watt}</span>}{item.cct&&<span className="inv-spec-tag">{item.cct}</span>}{item.color&&<span className="inv-spec-tag">{item.color}</span>}</div>
                  <div className="inv-qty-row">
                    <div className="inv-qty-cell"><div className="inv-qty-num">{item.totalQty}</div><div className="inv-qty-lbl">總庫存</div></div>
                    <div className="inv-qty-cell"><div className="inv-qty-num">{item.reservedQty}</div><div className="inv-qty-lbl">已保留</div></div>
                    <div className="inv-qty-cell"><div className={`inv-qty-num ${Number(item.availableQty)>0?"avail":""}`}>{item.availableQty}</div><div className="inv-qty-lbl">可調貨</div></div>
                  </div>
                  {item.note&&<div className="inv-note">{item.note}</div>}
                  <div className="inv-card-footer">
                    <div><div className="inv-location">儲位：{item.location||"—"}</div><div className="inv-updated">更新：{item.updatedAt}</div></div>
                    <button className="btn-inv-cart" disabled={Number(item.availableQty)<=0} onClick={()=>{const prod=products.find(p=>p.model===item.model);if(prod)addToCart(prod);else toast$(`${item.model} 已加入詢價單`);}}>加入詢價</button>
                  </div>
                </div>
              );
            })}
            {filteredInv.length===0&&<div className="empty" style={{gridColumn:"1/-1"}}>此分類目前無現貨</div>}
          </div>
        </>}

        {/* ══ 照明設計服務 ══ */}
        {page==="design"&&<>
          <div className="phead"><div><div className="ptitle">照明設計配燈服務</div><div className="psub">專業規劃 · 預算最適化</div></div></div>
          <div style={{background:"linear-gradient(135deg,#0e0d0c,#1a1612)",padding:"32px 36px",marginBottom:28,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 70% 50%,rgba(184,147,90,.08),transparent 60%)"}}/>
            <div style={{fontSize:"7px",letterSpacing:"5px",textTransform:"uppercase",color:"var(--gold)",marginBottom:12,position:"relative",zIndex:1}}>服務說明</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:"#e8e0d4",lineHeight:1.5,marginBottom:14,position:"relative",zIndex:1}}>根據您的預算規劃最適燈具數量</div>
            <div style={{fontSize:13,color:"#8a7a6a",lineHeight:1.9,maxWidth:560,position:"relative",zIndex:1}}>
              預收專案總價之 <strong style={{color:"var(--gold)"}}>10%</strong> 作為設計服務費。<br/>
              若最終燈具採購金額達到預算之 <strong style={{color:"var(--gold)"}}>70% 以上</strong>，此費用將<strong style={{color:"var(--gold)"}}>全額折抵貨款</strong>。
            </div>
          </div>
          <div style={{maxWidth:460}}>
            <div style={{fontSize:"7px",letterSpacing:"4px",textTransform:"uppercase",color:"var(--muted)",marginBottom:16,paddingBottom:8,borderBottom:"0.5px solid var(--bdr2)"}}>申請配燈服務</div>
            {designDone?(
              <div style={{textAlign:"center",padding:"40px 0",color:"var(--green)",fontSize:14,lineHeight:2}}>
                申請已送出 ✓<br/><span style={{fontSize:11,color:"var(--muted)"}}>專員將於 1–2 個工作日聯繫您</span><br/>
                <button className="btn-outline" style={{marginTop:16}} onClick={()=>{setDesignDone(false);setDesignForm({company:"",name:"",phone:"",project:""});}}>重新申請</button>
              </div>
            ):(
              <>
                {[["公司名稱","company","必填"],["聯絡人","name","姓名"],["聯絡電話","phone","0912-345-678"],["案名","project","選填"]].map(([l,k,ph])=>(
                  <div key={k} className="lf">
                    <label>{l}{k!=="project"&&<span className="req"> *</span>}</label>
                    <input value={designForm[k]} onChange={e=>setDesignForm(p=>({...p,[k]:e.target.value}))} placeholder={ph}/>
                  </div>
                ))}
                <button className="btn-primary" style={{marginTop:8}} onClick={submitDesignForm}>我需要配燈服務</button>
              </>
            )}
          </div>
        </>}

        {/* ══ 詢價單 ══ */}
        {page==="inquiry"&&<>
          <div className="phead"><div><div className="ptitle">詢價單</div><div className="psub">填寫案名後下載報價單</div></div></div>
          {/* ✅ 設計公司橫幅 */}
          <ProjBanner onContact={()=>setContactModal(true)}/>
          {cart.length===0?<div className="empty">請至產品目錄加入品項</div>:<>
            <div className="tbl-wrap"><table>
              <thead><tr><th>型號</th><th>系列</th><th>瓦數</th><th>數量</th><th>{isVip?"專案價":"標準價"}</th><th>小計</th><th></th></tr></thead>
              <tbody>{cart.map(item=>{const price=Number(isVip?item.product.projPrice:item.product.stdPrice)||0;return(<tr key={item.product.id}><td style={{fontWeight:400}}>{item.product.model}</td><td>{item.product.series}</td><td>{item.product.watt}</td><td><div style={{display:"flex",alignItems:"center",gap:6}}><button className="qty-btn" onClick={()=>updateQty(item.product.id,-1)}>−</button><span>{item.qty}</span><button className="qty-btn" onClick={()=>updateQty(item.product.id,1)}>+</button></div></td><td style={{color:isVip?"var(--gold)":"inherit"}}>{price>0?`NT$ ${price.toLocaleString()}`:"洽業務"}</td><td>{price>0?`NT$ ${(price*item.qty).toLocaleString()}`:"—"}</td><td><button className="btn-del2" onClick={()=>removeItem(item.product.id)}><CloseIcon/></button></td></tr>);})}</tbody>
            </table></div>
            <div style={{maxWidth:460}}>
              <div style={{marginBottom:14,paddingBottom:12,borderBottom:"0.5px solid var(--bdr2)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                  <span style={{fontSize:"8px",letterSpacing:"3px",textTransform:"uppercase",color:"var(--muted)"}}>燈具小計</span>
                  <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,textDecoration:discountRate<1?"line-through":"none",color:discountRate<1?"var(--muted)":"var(--blk)"}}>NT$ {cartTotal.toLocaleString()}</span>
                </div>
                {discountRate<1&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginTop:4}}>
                  <span style={{fontSize:"8px",letterSpacing:"2px",color:"var(--gold)"}}>{discountLabel}</span>
                  <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:"var(--gold)"}}>NT$ {Math.round(cartTotal*discountRate).toLocaleString()}</span>
                </div>}
              </div>
              {cartTotal<3000&&<div className="warn-ship">未滿 NT$3,000，運費由買方支付</div>}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                <div style={{gridColumn:"1/-1"}}>
                  <label style={{display:"block",fontSize:"8px",letterSpacing:"3px",textTransform:"uppercase",color:"var(--muted)",marginBottom:6}}>案名 *</label>
                  <input style={{width:"100%",padding:"9px",border:"0.5px solid var(--bdr)",background:"transparent",fontFamily:"'Noto Sans TC',sans-serif",fontSize:12,outline:"none"}} value={projName} onChange={e=>setProjName(e.target.value)} placeholder="請輸入案名"/>
                </div>
                <div>
                  <label style={{display:"block",fontSize:"8px",letterSpacing:"3px",textTransform:"uppercase",color:"var(--muted)",marginBottom:6}}>公司名稱</label>
                  <input style={{width:"100%",padding:"9px",border:"0.5px solid var(--bdr)",background:"transparent",fontFamily:"'Noto Sans TC',sans-serif",fontSize:12,outline:"none"}} value={custCompany} onChange={e=>setCustCompany(e.target.value)} placeholder="客戶公司"/>
                </div>
                <div>
                  <label style={{display:"block",fontSize:"8px",letterSpacing:"3px",textTransform:"uppercase",color:"var(--muted)",marginBottom:6}}>聯繫人</label>
                  <input style={{width:"100%",padding:"9px",border:"0.5px solid var(--bdr)",background:"transparent",fontFamily:"'Noto Sans TC',sans-serif",fontSize:12,outline:"none"}} value={custName} onChange={e=>setCustName(e.target.value)} placeholder="姓名"/>
                </div>
                <div>
                  <label style={{display:"block",fontSize:"8px",letterSpacing:"3px",textTransform:"uppercase",color:"var(--muted)",marginBottom:6}}>電話</label>
                  <input style={{width:"100%",padding:"9px",border:"0.5px solid var(--bdr)",background:"transparent",fontFamily:"'Noto Sans TC',sans-serif",fontSize:12,outline:"none"}} value={custPhone} onChange={e=>setCustPhone(e.target.value)} placeholder="0912-345-678"/>
                </div>
                <div>
                  <label style={{display:"block",fontSize:"8px",letterSpacing:"3px",textTransform:"uppercase",color:"var(--muted)",marginBottom:6}}>地址</label>
                  <input style={{width:"100%",padding:"9px",border:"0.5px solid var(--bdr)",background:"transparent",fontFamily:"'Noto Sans TC',sans-serif",fontSize:12,outline:"none"}} value={custAddress} onChange={e=>setCustAddress(e.target.value)} placeholder="選填"/>
                </div>
              </div>
              {/* 折扣碼（低調設計，不影響一般客戶）*/}
              <div style={{marginBottom:14,display:"flex",gap:7,alignItems:"center"}}>
                <input
                  style={{flex:1,padding:"7px 10px",border:"0.5px solid #e0dbd2",background:"transparent",fontFamily:"'Noto Sans TC',sans-serif",fontSize:11,outline:"none",color:"var(--muted)",letterSpacing:1,transition:"border-color .2s"}}
                  placeholder="— — —"
                  value={discountCode}
                  onChange={e=>setDiscountCode(e.target.value)}
                  onBlur={()=>applyDiscountCode(discountCode)}
                  onKeyDown={e=>e.key==="Enter"&&applyDiscountCode(discountCode)}
                  maxLength={8}
                />
                {discountLabel&&<span style={{fontSize:"9px",color:"var(--gold)",letterSpacing:"2px",whiteSpace:"nowrap",border:"0.5px solid var(--gold)",padding:"3px 9px"}}>{discountLabel}</span>}
              </div>
              <div className="checklist">
                <div className="cl-title">下載前請確認</div>
                {[{k:"c1",t:"單筆未滿 NT$3,000 運費由買方自付"},{k:"c2",t:"庫存不足時生產交期約 1 個月起"},{k:"c3",t:"保固室內 3 年、戶外 2 年"},{k:"c4",t:"報價單有效期 30 天請回簽確認"}].map(({k,t})=>(<label key={k} className="cl-item"><input type="checkbox" checked={checks[k]} onChange={e=>setChecks(p=>({...p,[k]:e.target.checked}))}/>{t}</label>))}
              </div>
              <button className="btn-pdf" onClick={handleGenPDF} disabled={!projName.trim()||!allChecked}>{allChecked?"下載報價單":"請先勾選確認事項"}</button>
            </div>
          </>}
        </>}

        {/* ══ 借樣品 ══ */}
        {page==="sample"&&<>
          <div className="phead"><div><div className="ptitle">借樣品</div><div className="psub">申請試用 — 2 週內歸還可折抵購買</div></div><button className="btn-add2" onClick={()=>setSampOpen(true)}>申請清單 ({sampCart.length})</button></div>
          <div className="hint-box">從下方產品點選「申請樣品」加入清單後提交。</div>
          <div className="pgrid">{products.map(p=>(<div key={p.id} className="pcard"><div className="pcard-img" onClick={()=>setSelProd(p)} style={{cursor:"pointer"}}>{p.images?.[0]?<img src={p.images[0]} alt={p.model}/>:<PlaceholderIcon/>}</div><div className="pcard-body"><div className="pcard-series">{p.series}</div><div className="pcard-model">{p.model}</div><div className="pcard-tags">{p.watt&&<span className="ptag">{p.watt}</span>}{p.beam&&<span className="ptag">{p.beam}</span>}</div><button className={`btn-samp ${sampCart.find(i=>i.id===p.id)?"done":""}`} onClick={()=>sampCart.find(i=>i.id===p.id)?removeSamp(p.id):addToSamp(p)}>{sampCart.find(i=>i.id===p.id)?"已加入":"申請樣品"}</button></div></div>))}</div>
        </>}

        {/* ══ 安裝服務 ══ */}
        {page==="install"&&<>
          <div className="phead"><div><div className="ptitle">安裝服務</div><div className="psub">原廠技術安裝 · 崁燈 ＆ 線型間接照明</div></div><button className="btn-add2" onClick={()=>setInstOpen(true)}>立即估算費用</button></div>
          {/* ✅ 設計公司橫幅 */}
          <ProjBanner onContact={()=>setContactModal(true)}/>
          <div className="hint-box" style={{marginBottom:20}}>
            <strong style={{color:"var(--blk)",display:"block",marginBottom:5}}>重要服務前置條件</strong>
            請業主於安裝前<strong>完成開孔、拉好電線至天花板預定位置</strong>。本服務提供燈具精準定位、安裝固定與功能測試，不含開孔、線路抽換、木作修補或補漆作業。出發地：桃園市八德區。
          </div>
          {/* 重要前置條件 */}
          <div style={{background:"#fdf8ee",border:"0.5px solid var(--gold)",borderLeft:"3px solid var(--gold)",padding:"12px 16px",marginBottom:20,fontSize:12,lineHeight:1.9,color:"var(--blk)"}}>
            <strong style={{display:"block",marginBottom:5,letterSpacing:1}}>⚠ 安裝前必要條件（崁燈 ＆ 線型燈皆適用）</strong>
            <span style={{color:"var(--red)"}}>請業主務必於安裝前完成開孔，並將電線拉至天花板各燈具預定位置。</span><br/>
            本服務包含：燈具精準定位 · 安裝固定 · 功能測試。<br/>
            <strong>不含：</strong>開孔、線路抽換、木作修補、補漆、戶外燈安裝、特殊造型燈槽。<br/>
            特殊安裝需求（戶外、弧形、多層次造型等），請另與業務聯繫評估。
          </div>

          <div style={{fontSize:"8px",letterSpacing:"4px",textTransform:"uppercase",color:"var(--muted)",marginBottom:12,paddingBottom:7,borderBottom:"0.5px solid var(--bdr2)"}}>一、崁燈安裝服務</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:1,background:"var(--bdr2)",border:"0.5px solid var(--bdr2)",marginBottom:16}}>
            {[["最低出勤費","NT$ 2,000","單次出勤未達此標，以 NT$2,000 計收"],["標準安裝（3m 以下）","NT$ 200 / 盞","含定位、安裝固定與功能測試"],["挑高施工（3.1–4.5m）","+NT$ 80 / 盞","需 A 型梯輔助，視現場評估"],["4.5m 以上","不含安裝費","需鷹架或高空作業車，另案報價"]].map(([t,v,d])=>(
              <div key={t} style={{background:"var(--ivory)",padding:"16px 18px"}}>
                <div style={{fontSize:"7px",letterSpacing:"3px",textTransform:"uppercase",color:"var(--muted)",marginBottom:4}}>{t}</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:t.includes("4.5m")?"var(--red)":"var(--blk)",marginBottom:3}}>{v}</div>
                <div style={{fontSize:10,color:"var(--muted)"}}>{d}</div>
              </div>
            ))}
          </div>

          <div style={{fontSize:"8px",letterSpacing:"4px",textTransform:"uppercase",color:"var(--muted)",marginBottom:12,paddingBottom:7,borderBottom:"0.5px solid var(--bdr2)"}}>二、線型燈 ／ 間接照明安裝服務</div>
          <div style={{background:"#fdf5e8",border:"0.5px solid var(--gold)",borderLeft:"3px solid var(--gold)",padding:"10px 14px",marginBottom:12,fontSize:11,lineHeight:1.8,color:"#7a5a2a"}}>
            ⚠ <strong>線型燈特別注意：</strong>現場須預留燈槽退縮空間（建議 ≥ 10cm），若無法退縮，現場將記錄並無法施工。多折角、弧形、多層次造型<strong>不在本服務範圍</strong>，如有需求請另行聯繫業務評估報價。
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:1,background:"var(--bdr2)",border:"0.5px solid var(--bdr2)",marginBottom:24}}>
            {[["最低出勤費","NT$ 2,000","單次出勤未達此標，以 NT$2,000 計收"],["線型燈安裝","NT$ 500 / 米","鋁條燈、鋁擠燈、軟條燈卡接固定（直線）"],["複雜造型","不在服務範圍","多折角、弧形、多層次，請另行聯繫業務"]].map(([t,v,d])=>(
              <div key={t} style={{background:"var(--ivory)",padding:"16px 18px"}}>
                <div style={{fontSize:"7px",letterSpacing:"3px",textTransform:"uppercase",color:"var(--muted)",marginBottom:4}}>{t}</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:t.includes("複雜")?"var(--red)":"var(--blk)",marginBottom:3}}>{v}</div>
                <div style={{fontSize:10,color:"var(--muted)"}}>{d}</div>
              </div>
            ))}
          </div>
          {/* 快速估算：崁燈 + 線型燈 並排 */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}}>
            {/* 崁燈快速估算 */}
            <div style={{border:"0.5px solid var(--bdr2)",padding:"18px 20px",background:"#f9f5ef"}}>
              <div style={{fontSize:"8px",letterSpacing:"3px",textTransform:"uppercase",color:"var(--muted)",marginBottom:10}}>崁燈快速估算</div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <label style={{fontSize:11,color:"var(--muted)",whiteSpace:"nowrap"}}>盞數</label>
                <input type="number" min="1" max="999" value={quickRecessed} onChange={e=>setQuickRecessed(Math.max(1,Number(e.target.value)))} style={{width:70,padding:"6px 8px",border:"0.5px solid var(--bdr)",background:"transparent",fontFamily:"'Noto Sans TC',sans-serif",fontSize:14,textAlign:"center",outline:"none"}}/>
                <span style={{fontSize:11,color:"var(--muted)"}}>盞</span>
              </div>
              <div style={{background:"var(--blk)",color:"var(--ivory)",padding:"12px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:5,paddingBottom:5,borderBottom:"0.5px solid #2a2520"}}>
                  <span>{quickRecessed} 盞 × NT$200</span><span>NT$ {(quickRecessed*200).toLocaleString()}</span>
                </div>
                {quickRecessed*200<INSTALL_MIN&&<div style={{fontSize:9,color:"#c45a5a",marginBottom:4}}>未達最低出勤費，以 NT${INSTALL_MIN.toLocaleString()} 計收</div>}
                <div style={{display:"flex",justifyContent:"space-between",color:"var(--gold)",fontSize:13,paddingTop:3}}>
                  <span>預估費用</span><span>NT$ {Math.max(quickRecessed*200,INSTALL_MIN).toLocaleString()}</span>
                </div>
                <div style={{fontSize:8,color:"#5a4a3a",marginTop:6}}>※ 不含車馬費</div>
              </div>
            </div>
            {/* 線型燈快速估算 */}
            <div style={{border:"0.5px solid var(--bdr2)",padding:"18px 20px",background:"#f9f5ef"}}>
              <div style={{fontSize:"8px",letterSpacing:"3px",textTransform:"uppercase",color:"var(--muted)",marginBottom:10}}>線型燈快速估算</div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <label style={{fontSize:11,color:"var(--muted)",whiteSpace:"nowrap"}}>米數</label>
                <input type="number" min="1" max="500" value={linearMeters} onChange={e=>setLinearMeters(Math.max(1,Number(e.target.value)))} style={{width:70,padding:"6px 8px",border:"0.5px solid var(--bdr)",background:"transparent",fontFamily:"'Noto Sans TC',sans-serif",fontSize:14,textAlign:"center",outline:"none"}}/>
                <span style={{fontSize:11,color:"var(--muted)"}}>米</span>
              </div>
              <div style={{background:"var(--blk)",color:"var(--ivory)",padding:"12px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:5,paddingBottom:5,borderBottom:"0.5px solid #2a2520"}}>
                  <span>{linearMeters} 米 × NT$500</span><span>NT$ {(linearMeters*500).toLocaleString()}</span>
                </div>
                {linearMeters*500<INSTALL_MIN&&<div style={{fontSize:9,color:"#c45a5a",marginBottom:4}}>未達最低出勤費，以 NT${INSTALL_MIN.toLocaleString()} 計收</div>}
                <div style={{display:"flex",justifyContent:"space-between",color:"var(--gold)",fontSize:13,paddingTop:3}}>
                  <span>預估費用</span><span>NT$ {Math.max(linearMeters*500,INSTALL_MIN).toLocaleString()}</span>
                </div>
                <div style={{fontSize:8,color:"#5a4a3a",marginTop:6}}>※ 不含車馬費 · 直線安裝</div>
              </div>
            </div>
          </div>
          <div style={{fontSize:"7px",letterSpacing:"4px",textTransform:"uppercase",color:"var(--muted)",marginBottom:12,paddingBottom:7,borderBottom:"0.5px solid var(--bdr2)"}}>全台分區車馬費一覽</div>
          <div className="tbl-wrap" style={{marginBottom:24}}>
            <table className="install-tbl"><thead><tr><th>服務區域</th><th>代表縣市</th><th>里程參考</th><th>基礎車馬費</th><th>免收門檻</th></tr></thead>
            <tbody>{INSTALL_REGIONS.map(r=>(<tr key={r.id}><td style={{fontWeight:400}}>{r.label}</td><td style={{color:"var(--muted)",fontSize:10}}>{r.areas}</td><td style={{color:"var(--muted)",fontSize:10}}>{r.km}</td><td style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14}}>{r.travel===null?"專案另議":`NT$ ${r.travel.toLocaleString()}`}</td><td style={{fontSize:10,color:"var(--green)"}}>{r.freeAt?`${r.freeAt} 盞免收`:r.travel===null?"不設門檻":"—"}</td></tr>))}</tbody>
            </table>
          </div>
          <div style={{textAlign:"center",paddingTop:14,borderTop:"0.5px solid var(--bdr2)"}}>
            <button className="btn-primary" style={{maxWidth:260,margin:"0 auto",display:"block"}} onClick={()=>setInstOpen(true)}>立即估算完整費用</button>
          </div>
        </>}

        {/* ══ 帳號管理 ══ */}
        {page==="members"&&isAdmin&&<>
          <div className="phead"><div><div className="ptitle">帳號管理</div></div></div>
          <div className="stats-row">{[["總帳號",members.length,""],["管理者",members.filter(m=>m.role==="admin").length,""],["VIP",members.filter(m=>m.role==="vip").length,""],["待審核",pending.length,"var(--red)"]].map(([l,n,c])=>(<div key={l} className="stat-box"><div className="stat-num" style={c?{color:c}:{}}>{n}</div><div className="stat-lbl">{l}</div></div>))}</div>
          <div className="tbl-wrap"><table><thead><tr><th>姓名</th><th>公司</th><th>帳號</th><th>身份</th><th>調整</th><th>開通日</th><th></th></tr></thead><tbody>{members.map(m=>(<tr key={m.id}><td style={{fontWeight:400}}>{m.name}</td><td>{m.company}</td><td style={{fontFamily:"monospace"}}>{m.username}</td><td><span className={`rb r-${m.role==="admin"?"admin":m.role==="vip"?"vip":"std"}`}>{roleLabel(m.role)}</span></td><td><select className="role-sel" value={m.role} onChange={e=>{setMembers(x=>x.map(i=>i.id===m.id?{...i,role:e.target.value}:i));if(user.id===m.id)setUser(u=>({...u,role:e.target.value}));toast$("權限已更新");}}><option value="standard">一般</option><option value="vip">VIP</option><option value="admin">管理</option></select></td><td style={{color:"var(--muted)"}}>{m.approvedAt}</td><td>{m.id!==user.id&&<button className="btn-del2" onClick={()=>{setMembers(x=>x.filter(x=>x.id!==m.id));toast$("帳號已刪除");}}><CloseIcon/></button>}</td></tr>))}</tbody></table></div>
        </>}

        {/* ══ 產品管理 ══ */}
        {page==="products"&&isAdmin&&<>
          <div className="phead"><div><div className="ptitle">產品管理</div><div className="psub">{products.length} 件商品</div></div><button className="btn-add2" onClick={()=>setShowAdd(v=>!v)}>新增產品</button></div>
          {showAdd&&<div className="form-panel"><div className="fp-title">新增產品</div>
            <div className="fgrid">
              {[["型號","model"],["系列","series"],["瓦數","watt"],["色溫","cct"],["光束角","beam"],["電壓","voltage"],["演色性","cri"],["顏色","color"],["開孔尺寸","cutout"],["產品尺寸","size"],["認證","cert"],["標準價","stdPrice"],["專案價","projPrice"],["運費","shipping"]].map(([l,k])=>(<div key={k} className="ff"><label>{l}</label><input type={["stdPrice","projPrice","shipping"].includes(k)?"number":"text"} value={newProd[k]} onChange={e=>setNewProd(p=>({...p,[k]:e.target.value}))}/></div>))}
              <div className="ff"><label>分類</label><select value={newProd.category} onChange={e=>setNewProd(p=>({...p,category:e.target.value}))}><option>崁燈</option><option>軌道燈</option><option>磁吸系統</option><option>吸頂燈</option><option>壁燈</option><option>戶外燈</option><option>鋁條燈</option></select></div>
              <div className="ff full"><label>產品描述</label><input value={newProd.desc} onChange={e=>setNewProd(p=>({...p,desc:e.target.value}))}/></div>
              <div className="ff full"><label>圖片網址（每行一個）</label><textarea rows={2} value={newProd.images} onChange={e=>setNewProd(p=>({...p,images:e.target.value}))} placeholder="https://..."/></div>
              <div className="ff full"><label>備註</label><input value={newProd.note} onChange={e=>setNewProd(p=>({...p,note:e.target.value}))}/></div>
            </div>
            <div className="form-actions"><button className="btn-confirm" onClick={doAddProd}>確認新增</button><button className="btn-cancel-sm" onClick={()=>setShowAdd(false)}>取消</button></div>
          </div>}
          {editProd&&<div className="form-panel" style={{background:"#f0ebe2"}}><div className="fp-title">編輯：{editProd.model}</div>
            <div className="fgrid">
              {[["型號","model"],["系列","series"],["瓦數","watt"],["色溫","cct"],["光束角","beam"],["電壓","voltage"],["演色性","cri"],["顏色","color"],["開孔尺寸","cutout"],["產品尺寸","size"],["認證","cert"],["標準價","stdPrice"],["專案價","projPrice"],["運費","shipping"]].map(([l,k])=>(<div key={k} className="ff"><label>{l}</label><input type={["stdPrice","projPrice","shipping"].includes(k)?"number":"text"} value={editProd[k]||""} onChange={e=>setEditProd(p=>({...p,[k]:e.target.value}))}/></div>))}
              <div className="ff full"><label>產品描述</label><input value={editProd.desc||""} onChange={e=>setEditProd(p=>({...p,desc:e.target.value}))}/></div>
              <div className="ff full"><label>圖片網址（每行一個）</label><textarea rows={2} value={typeof editProd.images==="string"?editProd.images:(editProd.images||[]).join("\n")} onChange={e=>setEditProd(p=>({...p,images:e.target.value}))}/></div>
              <div className="ff full"><label>備註</label><input value={editProd.note||""} onChange={e=>setEditProd(p=>({...p,note:e.target.value}))}/></div>
            </div>
            <div className="form-actions"><button className="btn-confirm" onClick={saveEdit}>儲存修改</button><button className="btn-cancel-sm" onClick={()=>setEditProd(null)}>取消</button></div>
          </div>}
          <div className="tbl-wrap"><table><thead><tr><th>型號</th><th>系列</th><th>分類</th><th>瓦數</th><th>標準價</th><th>專案價</th><th>操作</th></tr></thead><tbody>{products.map(p=>(<tr key={p.id}><td style={{fontWeight:400}}>{p.model}</td><td>{p.series}</td><td>{p.category}</td><td>{p.watt}</td><td>NT$ {p.stdPrice?.toLocaleString()}</td><td style={{color:"var(--gold)"}}>NT$ {p.projPrice?.toLocaleString()}</td><td style={{display:"flex",gap:6}}><button className="btn-edit2" onClick={()=>startEdit(p)}>編輯</button><button className="btn-del2" onClick={()=>{const nl=products.filter(x=>x.id!==p.id);setProducts(nl);syncProducts(nl);toast$("已刪除");}}><CloseIcon/></button></td></tr>))}</tbody></table></div>
        </>}

        {/* ══ 庫存管理 ══ */}
        {page==="inv_admin"&&isAdmin&&<>
          <div className="phead"><div><div className="ptitle">庫存管理</div><div className="psub">{inventory.length} 筆 · 修改即時同步雲端</div></div><button className="btn-add2" onClick={()=>setShowAddInv(v=>!v)}>新增庫存</button></div>
          {showAddInv&&<div className="form-panel"><div className="fp-title">新增庫存項目</div>
            <div className="fgrid">
              {[["型號","model"],["系列","series"],["瓦數","watt"],["色溫","cct"],["顏色","color"],["儲位","location"]].map(([l,k])=>(<div key={k} className="ff"><label>{l}</label><input value={newInv[k]} onChange={e=>setNewInv(p=>({...p,[k]:e.target.value}))}/></div>))}
              <div className="ff"><label>分類</label><select value={newInv.category} onChange={e=>setNewInv(p=>({...p,category:e.target.value}))}><option>崁燈</option><option>軌道燈</option><option>磁吸系統</option><option>吸頂燈</option><option>戶外燈</option><option>鋁條燈</option></select></div>
              {[["總庫存","totalQty"],["已保留","reservedQty"]].map(([l,k])=>(<div key={k} className="ff"><label>{l}</label><input type="number" min="0" value={newInv[k]} onChange={e=>setNewInv(p=>({...p,[k]:e.target.value}))}/></div>))}
              <div className="ff full"><label>備註</label><input value={newInv.note} onChange={e=>setNewInv(p=>({...p,note:e.target.value}))}/></div>
            </div>
            <div className="form-actions"><button className="btn-confirm" onClick={doAddInv}>確認新增</button><button className="btn-cancel-sm" onClick={()=>setShowAddInv(false)}>取消</button></div>
          </div>}
          <div className="tbl-wrap inv-admin-tbl"><table>
            <thead><tr><th>型號</th><th>系列</th><th>分類</th><th>色溫</th><th>顏色</th><th>總庫存</th><th>已保留</th><th>可調貨</th><th>儲位</th><th>操作</th></tr></thead>
            <tbody>{inventory.map(item=>{
              const isE=editInvItem?.id===item.id;
              const cur=isE?editInvItem:item;
              return(<tr key={item.id}><td style={{fontWeight:400}}>{item.model}</td><td>{item.series}</td><td>{item.category}</td><td style={{fontSize:9,color:"var(--muted)"}}>{item.cct}</td><td style={{fontSize:9,color:"var(--muted)"}}>{item.color}</td>
                <td>{isE?<input type="number" min="0" value={cur.totalQty} onChange={e=>setEditInvItem(p=>({...p,totalQty:Number(e.target.value)}))}/>:item.totalQty}</td>
                <td>{isE?<input type="number" min="0" value={cur.reservedQty} onChange={e=>setEditInvItem(p=>({...p,reservedQty:Number(e.target.value)}))}/>:item.reservedQty}</td>
                <td style={{color:"var(--inv-green)",fontFamily:"'Cormorant Garamond',serif",fontSize:15}}>{isE?Number(cur.totalQty)-Number(cur.reservedQty):item.availableQty}</td>
                <td style={{fontSize:9,color:"var(--muted)"}}>{isE?<input value={cur.location} onChange={e=>setEditInvItem(p=>({...p,location:e.target.value}))} style={{width:90,padding:"4px 6px",border:"0.5px solid var(--bdr)",background:"transparent",fontFamily:"'Noto Sans TC',sans-serif",fontSize:11,outline:"none"}}/>:item.location}</td>
                <td style={{display:"flex",gap:5}}>{isE?<><button className="btn-save-inv" onClick={()=>saveInvRow(editInvItem)}>儲存</button><button className="btn-cancel-sm" style={{padding:"4px 9px",fontSize:9}} onClick={()=>setEditInvItem(null)}>取消</button></>:<><button className="btn-edit2" onClick={()=>setEditInvItem({...item})}>編輯</button><button className="btn-del2" onClick={()=>deleteInvRow(item.id)}><CloseIcon/></button></>}</td>
              </tr>);
            })}</tbody>
          </table></div>
        </>}

        {/* ══ 雲端設定 ══ */}
        {page==="cloud_settings"&&isAdmin&&<>
          <div className="phead"><div><div className="ptitle">雲端設定</div><div className="psub">Google Sheets 自動同步設定</div></div></div>
          <div className="cloud-status"><div className={`sync-dot ${syncStatus}`} style={{width:10,height:10}}/><span style={{fontSize:11}}>{syncStatus==="off"?"尚未連線":syncStatus==="loading"?"同步中...":"雲端已連線"}</span></div>
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:"8px",letterSpacing:"3px",textTransform:"uppercase",color:"var(--muted)",marginBottom:8}}>Google Apps Script 部署 URL</label>
            <input className="cloud-url-inp" value={urlInput} onChange={e=>setUrlInput(e.target.value)} placeholder="https://script.google.com/macros/s/xxxxx/exec"/>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button className="btn-confirm" onClick={()=>{setSheetUrl(urlInput);toast$("URL 已更新");}}>套用 URL</button>
              <button className="btn-ok" style={{padding:"9px 16px"}} onClick={async()=>{setTestResult("測試中...");try{const r=await fetch(`${urlInput}?action=ping`);const j=await r.json();setTestResult(j.success?"✓ 連線成功":"✗ 連線失敗");}catch(e){setTestResult("✗ "+e.message);}}}>測試連線</button>
            </div>
            {testResult&&<div style={{marginTop:10,fontSize:11,color:testResult.includes("✓")?"var(--green)":"var(--red)",padding:"8px 12px",background:"#f4efe8",borderLeft:"2px solid currentColor"}}>{testResult}</div>}
          </div>
          <div style={{border:"0.5px solid var(--bdr2)",padding:"16px 18px",background:"#f9f5ef"}}>
            <div style={{fontSize:"8px",letterSpacing:"3px",textTransform:"uppercase",color:"var(--muted)",marginBottom:8}}>Email 通知設定</div>
            <div style={{fontSize:11,color:"var(--muted)",lineHeight:1.9}}>
              目前通知信箱：<strong style={{color:"var(--blk)"}}>{NOTIFY_EMAIL}</strong><br/>
              通知事件：報價單下載、樣品申請、安裝申請、配燈服務申請<br/>
              需在 Apps Script 中加入 <code style={{fontSize:10,background:"#f0ebe2",padding:"1px 5px"}}>sendEmail</code> action 才能生效。
            </div>
          </div>
        </>}

        {/* ══ 樣品申請管理 ══ */}
        {page==="sample_admin"&&isAdmin&&<>
          <div className="phead"><div><div className="ptitle">樣品申請管理</div></div></div>
          {sampleReqs.length===0?<div className="empty">目前沒有樣品申請</div>:<div className="tbl-wrap"><table><thead><tr><th>日期</th><th>聯絡人</th><th>公司</th><th>電話</th><th>品項</th><th>狀態</th><th>操作</th></tr></thead><tbody>{sampleReqs.map(r=>(<tr key={r.id}><td style={{color:"var(--muted)"}}>{r.date}</td><td style={{fontWeight:400}}>{r.form.name}</td><td>{r.form.company}</td><td style={{color:"var(--muted)"}}>{r.form.phone}</td><td style={{fontSize:10}}>{r.products.join("、")}</td><td><span className={`rb ${r.status==="pending"?"r-std":"r-vip"}`}>{r.status==="pending"?"待處理":"已處理"}</span></td><td><button className="btn-ok" onClick={()=>setSampleReqs(x=>x.map(i=>i.id===r.id?{...i,status:"done"}:i))}>完成</button></td></tr>))}</tbody></table></div>}
        </>}

        {/* ══ 安裝申請管理 ══ */}
        {page==="install_admin"&&isAdmin&&<>
          <div className="phead"><div><div className="ptitle">安裝申請管理</div></div></div>
          {installOrd.length===0?<div className="empty">目前沒有安裝申請</div>:<div className="tbl-wrap"><table><thead><tr><th>日期</th><th>客戶</th><th>區域</th><th>盞數</th><th>預估費用</th><th>狀態</th><th>操作</th></tr></thead><tbody>{installOrd.map(o=>{const qty=o.groups.reduce((s,g)=>s+Number(g.qty||0),0);const est=o.calc&&!o.calc.hasVHigh&&o.calc.travelFee!==null?o.calc.laborTotal+(o.calc.travelFee||0):null;return(<tr key={o.id}><td style={{color:"var(--muted)"}}>{o.date}</td><td style={{fontWeight:400}}>{o.customer.name}</td><td>{INSTALL_REGIONS.find(r=>r.id===o.region)?.label}</td><td style={{textAlign:"center"}}>{qty}</td><td style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,color:"var(--gold)"}}>{est?`NT$ ${est.toLocaleString()}`:"另議"}</td><td><span className={`rb ${o.status==="pending"?"r-std":"r-vip"}`}>{o.status==="pending"?"待確認":"已處理"}</span></td><td><button className="btn-ok" onClick={()=>setInstallOrd(x=>x.map(i=>i.id===o.id?{...i,status:"done"}:i))}>完成</button></td></tr>);})}</tbody></table></div>}
        </>}

      </div>{/* end .content */}

      {/* ══ 產品 Drawer ══ */}
      {selProd&&<div className="drawer-overlay" onClick={()=>setSelProd(null)}>
        <div className="drawer" onClick={e=>e.stopPropagation()}>
          <div className="drawer-top"><div className="drawer-series">{selProd.series} — {selProd.category}</div><button className="close-btn" onClick={()=>setSelProd(null)}><CloseIcon/></button></div>
          <Carousel images={selProd.images}/>
          <div className="drawer-body">
            <div className="drawer-model">{selProd.model}</div>
            {hasStock(selProd.model)&&<div className="inv-badge-drawer"><span className="inv-badge-dot"/>台灣現貨 · 1–3 工作天出貨 · 快速到貨</div>}
            <div className="drawer-desc">{selProd.desc}</div>
            <div className="spec-grid">
              {[["瓦數",selProd.watt],["流明",selProd.lumen],["色溫",selProd.cct],["光束角",selProd.beam],["電壓",selProd.voltage],["演色性",selProd.cri],["顏色",selProd.color],["開孔尺寸",selProd.cutout],["產品尺寸",selProd.size],["安裝方式",selProd.install],["認證",selProd.cert]].filter(([,v])=>v&&v!=="—").map(([l,v])=>(<div key={l} className="spec-item"><div className="spec-label">{l}</div><div className="spec-val">{v}</div></div>))}
            </div>
            {selProd.note&&<div className="drawer-note">{selProd.note}</div>}
            <div className="price-block">
              <div className="pb-label">{isVip?"專案價":"售價"}</div>
              {isVip?<div className="pb-val gold">NT$ {selProd.projPrice?.toLocaleString()}</div>:(selProd.stdPrice>0?<div className="pb-val">NT$ {selProd.stdPrice?.toLocaleString()}</div>:<div className="pb-nq">請洽業務專員報價</div>)}
            </div>
            <div className="drawer-actions">
              <button className={`btn-cart ${isVip?"vip":""}`} onClick={()=>addToCart(selProd)}>加入詢價單</button>
              <button className={`btn-samp ${sampCart.find(i=>i.id===selProd.id)?"done":""}`} onClick={()=>sampCart.find(i=>i.id===selProd.id)?removeSamp(selProd.id):addToSamp(selProd)}>{sampCart.find(i=>i.id===selProd.id)?"已申請樣品":"申請樣品"}</button>
            </div>
          </div>
        </div>
      </div>}

      {/* ══ 詢價單 Panel ══ */}
      <div className={`side-panel ${cartOpen?"open":""}`}>
        <div className="sp-head"><div className="sp-title">詢價單</div><button className="close-btn" onClick={()=>setCartOpen(false)}><CloseIcon/></button></div>
        <div className="sp-body">
          <div style={{background:"#f9f5ee",border:"0.5px solid var(--gold)",borderLeft:"2px solid var(--gold)",padding:"9px 12px",marginBottom:14,fontSize:10,color:"var(--gold)",lineHeight:1.7}}>
            ✦ 設計公司享有專案折扣，<span style={{textDecoration:"underline",cursor:"pointer"}} onClick={()=>{setCartOpen(false);setContactModal(true);}}>點此聯繫業務</span>
          </div>
          {cart.length===0?<div className="empty" style={{paddingTop:48}}>尚未加入任何產品</div>:cart.map(item=>{const price=Number(isVip?item.product.projPrice:item.product.stdPrice)||0;return(<div key={item.product.id} className="ci-row"><div className="ci-img">{item.product.images?.[0]?<img src={item.product.images[0]} alt=""/>:<PlaceholderIcon/>}</div><div className="ci-info"><div className="ci-model">{item.product.model}</div><div className="ci-sub">{item.product.series} · {item.product.watt}</div><div className="ci-qty"><button className="qty-btn" onClick={()=>updateQty(item.product.id,-1)}>−</button><span style={{minWidth:20,textAlign:"center"}}>{item.qty}</span><button className="qty-btn" onClick={()=>updateQty(item.product.id,1)}>+</button><span className="ci-price" style={{marginLeft:7}}>{price>0?`NT$ ${(price*item.qty).toLocaleString()}`:"—"}</span></div></div><button className="ci-del" onClick={()=>removeItem(item.product.id)}><CloseIcon/></button></div>);})}
        </div>
        {cart.length>0&&<div className="sp-foot">
          <div className="cart-total"><span className="cart-total-lbl">小計</span><span className="cart-total-val">NT$ {cartTotal.toLocaleString()}</span></div>
          {cartTotal<3000&&<div className="warn-ship">未滿 NT$3,000，運費由買方支付</div>}
          <div className="cp-project"><label>案名 *</label><input value={projName} onChange={e=>setProjName(e.target.value)} placeholder="請輸入案名"/></div>
          <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:10}}>
            <input style={{flex:1,padding:"6px 9px",border:"0.5px solid #e0dbd2",background:"transparent",fontFamily:"'Noto Sans TC',sans-serif",fontSize:11,outline:"none",color:"var(--muted)"}} placeholder="— — —" value={discountCode} onChange={e=>setDiscountCode(e.target.value)} onBlur={()=>applyDiscountCode(discountCode)} onKeyDown={e=>e.key==="Enter"&&applyDiscountCode(discountCode)} maxLength={8}/>
            {discountLabel&&<span style={{fontSize:"8px",color:"var(--gold)",border:"0.5px solid var(--gold)",padding:"2px 7px",whiteSpace:"nowrap"}}>{discountLabel}</span>}
          </div>
          <div className="checklist"><div className="cl-title">下載前請確認</div>{[{k:"c1",t:"單筆未滿 NT$3,000 運費由買方自付"},{k:"c2",t:"庫存不足時生產交期約 1 個月起"},{k:"c3",t:"保固室內 3 年、戶外 2 年"},{k:"c4",t:"報價單有效期 30 天請回簽確認"}].map(({k,t})=>(<label key={k} className="cl-item"><input type="checkbox" checked={checks[k]} onChange={e=>setChecks(p=>({...p,[k]:e.target.checked}))}/>{t}</label>))}</div>
          <button className="btn-pdf" onClick={handleGenPDF} disabled={!projName.trim()||!allChecked}>{allChecked?"下載報價單":"請先勾選確認事項"}</button>
        </div>}
      </div>

      {/* ══ 樣品申請 Panel ══ */}
      <div className={`side-panel ${sampOpen?"open":""}`}>
        <div className="sp-head"><div className="sp-title">借樣品申請</div><button className="close-btn" onClick={()=>setSampOpen(false)}><CloseIcon/></button></div>
        <div className="sp-body">
          <div className="sp-notice">樣品借用後請於 2 週內歸還，如需購買可折抵費用。</div>
          {sampDone?<div style={{textAlign:"center",padding:"40px 0",color:"var(--green)",fontSize:14,lineHeight:2}}>申請已送出<br/><span style={{fontSize:11,color:"var(--muted)"}}>專員將於 1-2 個工作日聯繫</span></div>:<>
            <div style={{marginBottom:14}}>{sampCart.length===0?<div style={{textAlign:"center",padding:"20px 0",color:"var(--muted)",fontSize:10,letterSpacing:2,textTransform:"uppercase"}}>尚未選擇樣品</div>:sampCart.map(p=><div key={p.id} className="samp-item"><div className="samp-item-img">{p.images?.[0]?<img src={p.images[0]} alt=""/>:<PlaceholderIcon/>}</div><div className="samp-item-info"><div className="samp-item-model">{p.model}</div><div className="samp-item-sub">{p.series} · {p.watt}</div></div><button className="samp-item-del" onClick={()=>removeSamp(p.id)}><CloseIcon/></button></div>)}</div>
            <div className="sp-form">
              <label>聯絡人 *</label><input value={sampForm.name} onChange={e=>setSampForm(p=>({...p,name:e.target.value}))} placeholder="您的姓名"/>
              <label>公司名稱</label><input value={sampForm.company} onChange={e=>setSampForm(p=>({...p,company:e.target.value}))} placeholder="選填"/>
              <label>聯絡電話 *</label><input value={sampForm.phone} onChange={e=>setSampForm(p=>({...p,phone:e.target.value}))} placeholder="0912-345-678"/>
              <label>寄送地址</label><input value={sampForm.address} onChange={e=>setSampForm(p=>({...p,address:e.target.value}))} placeholder="含郵遞區號"/>
            </div>
          </>}
        </div>
        {!sampDone&&<div className="sp-foot"><button className="btn-gold" onClick={submitSamp} disabled={sampCart.length===0}>送出樣品申請</button><button className="btn-ghost" onClick={()=>setSampOpen(false)}>稍後再說</button></div>}
      </div>

      {/* ══ 安裝估價 Panel ══ */}
      <div className={`side-panel ${instOpen?"open":""}`}>
        <div className="sp-head"><div className="sp-title">安裝費用試算</div><button className="close-btn" onClick={()=>setInstOpen(false)}><CloseIcon/></button></div>
        <div className="sp-body">
          {instDone?(
            <div style={{textAlign:"center",padding:"48px 0",color:"var(--green)",lineHeight:2,fontSize:14}}>
              申請已送出<br/><span style={{fontSize:11,color:"var(--muted)"}}>專員將於 1-2 個工作日確認時間</span><br/>
              <button className="btn-outline" style={{marginTop:16}} onClick={resetInst}>重新試算</button>
            </div>
          ):(
            <>
              <div className="inst-hint">
        <strong style={{color:"var(--blk)",display:"block",marginBottom:4}}>📐 安裝費用試算工具</strong>
        此工具僅供費用試算參考，實際安裝請送出申請由業務確認。<br/>
        崁燈 <strong>NT$200/盞</strong>（3m以下）；線型燈 <strong>NT$500/米</strong>（直線）；最低出勤 NT$2,000。<br/>
        <span style={{color:"var(--red)"}}>⚠ 請事先完成開孔，並將電線拉至各燈具預定位置。</span><br/>
        線型燈須預留退縮空間（≥5cm），無法退縮將記錄並無法施工。
      </div>
              {/* ✅ 設計公司提示 — Panel 內也顯示 */}
              <div style={{background:"#f9f5ee",border:"0.5px solid var(--gold)",borderLeft:"2px solid var(--gold)",padding:"9px 12px",marginBottom:14,fontSize:10,color:"var(--gold)",lineHeight:1.7}}>
                ✦ 設計公司或合作專案享有專案折扣，<span style={{textDecoration:"underline",cursor:"pointer"}} onClick={()=>{setInstOpen(false);setContactModal(true);}}>點此聯繫業務</span>
              </div>
              <div style={{marginBottom:16}}>
                <div className="ip-sec-title">安裝類型（可同時選擇兩種）</div>
                <div style={{display:"flex",gap:6}}>
                  {[["recessed","崁燈安裝"],["linear","線型燈安裝"]].map(([t,l])=>{
                    const isOn=installTypes.includes(t);
                    return(<button key={t} style={{flex:1,padding:"9px",border:"0.5px solid",fontFamily:"'Noto Sans TC',sans-serif",fontSize:"8px",letterSpacing:"2px",cursor:"pointer",transition:"all .2s",background:isOn?"var(--blk)":"transparent",borderColor:isOn?"var(--blk)":"var(--bdr)",color:isOn?"var(--ivory)":"var(--muted)"}}
                      onClick={()=>setInstallTypes(ts=>ts.includes(t)?ts.filter(x=>x!==t):[...ts,t])}>{l}</button>);
                  })}
                </div>
                {installTypes.length===0&&<div style={{fontSize:10,color:"var(--muted)",marginTop:5}}>請選擇安裝類型</div>}
              </div>
              <div style={{marginBottom:18}}>
                <div className="ip-sec-title">選擇安裝地點區域</div>
                <div className="region-grid">{INSTALL_REGIONS.map(r=>(<div key={r.id} className={`region-card ${instRegion===r.id?"on":""}`} onClick={()=>setInstRegion(r.id)}><div className="rc-label">{r.label}</div><div className="rc-km">{r.km}</div><div className="rc-fee">{r.travel===null?"另議":`NT$ ${r.travel.toLocaleString()}`}</div>{r.freeAt&&<div className="rc-free">{r.freeAt} 盞以上免收</div>}</div>))}</div>
              </div>
              {installTypes.includes("recessed")&&(
                <div style={{marginBottom:18}}>
                  <div className="ip-sec-title">安裝數量 ＆ 天花高度</div>
                  {(()=>{const totalInstQty=instGroups.reduce((s,g)=>s+Number(g.qty||0),0);return cartLampQty>0&&totalInstQty>cartLampQty&&<div style={{fontSize:11,color:"var(--red)",marginBottom:6,padding:"5px 9px",background:"#fdf0f0",border:"0.5px solid var(--red)"}}>⚠ 安裝盞數（{totalInstQty}）超過購物車燈具數量（{cartLampQty}），請確認數量是否正確</div>;})()}
                  {instGroups.map((g,i)=>{
                    const totalSoFar=instGroups.slice(0,i).reduce((s,x)=>s+Number(x.qty||0),0);
                    const maxForThis=cartLampQty>0?Math.max(1,cartLampQty-totalSoFar):999;
                    return(
                    <div key={i} className="group-row">
                      <select className="gr-sel" value={g.ceilingId} onChange={e=>setInstGroups(gs=>gs.map((x,j)=>j===i?{...x,ceilingId:e.target.value}:x))}>
                        {CEILING_GROUPS.map(c=><option key={c.id} value={c.id}>{c.label}{c.surcharge===null?" — 另案報價":c.surcharge>0?` +NT$${c.surcharge}/盞`:""}</option>)}
                      </select>
                      <input className="gr-qty" type="number" min="1" max={cartLampQty>0?cartLampQty:999} value={g.qty}
                        onChange={e=>setInstGroups(gs=>gs.map((x,j)=>j===i?{...x,qty:e.target.value}:x))}/>
                      <span style={{fontSize:10,color:"var(--muted)"}}>盞</span>
                      {cartLampQty>0&&Number(g.qty)>maxForThis&&<span style={{fontSize:9,color:"var(--red)"}}>超出</span>}
                      {instGroups.length>1&&<button style={{background:"none",border:"none",cursor:"pointer",color:"var(--muted)",display:"flex"}} onClick={()=>setInstGroups(gs=>gs.filter((_,j)=>j!==i))}><CloseIcon/></button>}
                    </div>
                  );})}
                  {cartLampQty>0&&<div style={{fontSize:11,color:"var(--muted)",marginBottom:4}}>購物車燈具：{cartLampQty} 盞，已分配：{instGroups.reduce((s,g)=>s+Number(g.qty||0),0)} 盞</div>}
                  <button style={{padding:"6px 14px",background:"transparent",border:"0.5px solid var(--bdr)",color:"var(--muted)",fontFamily:"'Noto Sans TC',sans-serif",fontSize:"7px",letterSpacing:"2px",cursor:"pointer",textTransform:"uppercase"}} onClick={()=>setInstGroups(gs=>[...gs,{ceilingId:"std",qty:1,type:"recessed"}])}>＋ 新增不同高度</button>
                </div>
              )}
              {installTypes.includes("linear")&&(
                <div style={{marginBottom:18}}>
                  <div className="ip-sec-title">線型燈分段輸入（可新增不同高度）</div>
                  {linearGroups.map((g,i)=>{
                    const cg=CEILING_GROUPS.find(c=>c.id===g.ceilingId);
                    const unitRate=cg?.surcharge===null?null:Math.round(INSTALL_LINEAR_M*(1+(cg?.surcharge||0)/INSTALL_BASE));
                    return(
                    <div key={i} className="group-row" style={{flexWrap:"wrap",gap:6}}>
                      <select className="gr-sel" style={{minWidth:180}} value={g.ceilingId} onChange={e=>setLinearGroups(gs=>gs.map((x,j)=>j===i?{...x,ceilingId:e.target.value}:x))}>
                        {CEILING_GROUPS.map(c=><option key={c.id} value={c.id}>{c.label}{c.surcharge===null?" — 另案報價":c.surcharge>0?` (NT$${Math.round(INSTALL_LINEAR_M*(1+c.surcharge/INSTALL_BASE))}/米)`:` (NT$${INSTALL_LINEAR_M}/米)`}</option>)}
                      </select>
                      <input className="gr-qty" type="number" min="1" style={{width:70}} value={g.meters}
                        onChange={e=>setLinearGroups(gs=>gs.map((x,j)=>j===i?{...x,meters:Math.max(1,Number(e.target.value))}:x))}/>
                      <span style={{fontSize:11,color:"var(--muted)"}}>米</span>
                      {unitRate&&<span style={{fontSize:10,color:"var(--gold)"}}>= NT$ {(unitRate*g.meters).toLocaleString()}</span>}
                      {cg?.surcharge===null&&<span style={{fontSize:10,color:"var(--red)"}}>另案報價</span>}
                      {linearGroups.length>1&&<button style={{background:"none",border:"none",cursor:"pointer",color:"var(--muted)",display:"flex"}} onClick={()=>setLinearGroups(gs=>gs.filter((_,j)=>j!==i))}><CloseIcon/></button>}
                    </div>
                  );})}
                  <button style={{padding:"6px 14px",background:"transparent",border:"0.5px solid var(--bdr)",color:"var(--muted)",fontFamily:"'Noto Sans TC',sans-serif",fontSize:"7px",letterSpacing:"2px",cursor:"pointer",textTransform:"uppercase",marginTop:4}} onClick={()=>setLinearGroups(gs=>[...gs,{meters:1,ceilingId:"std"}])}>＋ 新增不同高度段</button>
                  {(()=>{const totalM=linearGroups.reduce((s,g)=>s+Number(g.meters||0),0);return totalM>0&&<div style={{fontSize:11,color:"var(--muted)",marginTop:8}}>線型燈合計：{totalM} 米</div>;})()}
                </div>
              )}
              {instRegion&&<div className="calc-box">
                {(()=>{
                  const reg=INSTALL_REGIONS.find(r=>r.id===instRegion);
                  const hasRecessed=installTypes.includes("recessed");
                  const hasLinear=installTypes.includes("linear");
                  const totalLinearM=linearGroups.reduce((s,g)=>s+Number(g.meters||0),0);
                  const laborCost=instCalc?instCalc.hasVHigh?null:instCalc.laborTotal:null;
                  const travel=reg?.travel===null?null:(instCalc?.travelFee??reg?.travel??0);
                  const total=laborCost!==null&&travel!==null?laborCost+(travel||0):null;
                  return(<>
                    {hasRecessed&&instCalc&&instCalc.totalQty>0&&<><div className="calc-row"><span>崁燈工資（{instCalc.totalQty} 盞 × NT$200）</span><span>NT$ {(()=>{const rLab=instGroups.reduce((s,g)=>{const cg=CEILING_GROUPS.find(c=>c.id===g.ceilingId);if(!cg||cg.surcharge===null)return s;return s+(INSTALL_BASE+cg.surcharge)*Number(g.qty||0);},0);return rLab.toLocaleString();})()}</span></div>{instCalc.hasVHigh&&<div className="calc-warn">4.5m 以上不含安裝費，需另案報價</div>}</>}
                    {hasLinear&&totalLinearM>0&&<>
                      {linearGroups.filter(g=>Number(g.meters)>0).map((g,i)=>{const cg=CEILING_GROUPS.find(c=>c.id===g.ceilingId);const rate=cg?.surcharge===null?null:Math.round(INSTALL_LINEAR_M*(1+(cg?.surcharge||0)/INSTALL_BASE));return rate?<div key={i} className="calc-row"><span>線型燈（{cg?.label}）{g.meters}m × NT${rate}</span><span>NT$ {(rate*Number(g.meters)).toLocaleString()}</span></div>:<div key={i} className="calc-row" style={{color:"var(--red)"}}><span>線型燈（{cg?.label}）{g.meters}m</span><span>另案報價</span></div>;})}
                    </>}
                    {instCalc&&instCalc.laborTotal<=INSTALL_MIN&&(instCalc.totalQty>0||totalLinearM>0)&&<div className="calc-warn">未達最低出勤費，以 NT$2,000 計收</div>}
                    <div className="calc-row"><span>車馬費</span><span>{reg?.travel===null?"另議":instCalc?.travelFee===0?<span style={{color:"var(--green)"}}>免收</span>:`NT$ ${(reg?.travel||0).toLocaleString()}`}</span></div>
                    {instCalc&&<div className="calc-row" style={{fontSize:10,color:"var(--muted)",borderBottom:"none"}}><span>合計單位（崁燈 {instCalc.totalQty||0} 盞 + 線型 {instCalc.totalMeters||0} 米 = {instCalc.totalUnits||0} 單位）</span><span>{instCalc.reg?.freeAt?`門檻：${instCalc.reg.freeAt} 單位`:""}</span></div>}
                    {total!==null&&<div className="calc-row total"><span>預估合計</span><span>NT$ {total.toLocaleString()}</span></div>}
                    <div style={{fontSize:9,color:"#5a4a3a",marginTop:8,cursor:"pointer",textDecoration:"underline"}} onClick={()=>setContactModal(true)}>設計公司或合作專案可洽業務獲取專案優惠報價 →</div>
                  </>);
                })()}
              </div>}
              <div style={{marginTop:14}}><div className="ip-sec-title">備註</div><textarea style={{width:"100%",padding:9,border:"0.5px solid var(--bdr)",background:"transparent",fontFamily:"'Noto Sans TC',sans-serif",fontSize:12,outline:"none",resize:"vertical",minHeight:56}} value={instNote} onChange={e=>setInstNote(e.target.value)} placeholder="安裝地址、偏好時段、現場說明等"/></div>
            </>
          )}
        </div>
        {!instDone&&<div className="sp-foot">
          <div style={{fontSize:10,color:"var(--muted)",marginBottom:10,padding:"8px 12px",background:"#f4efe8",borderLeft:"2px solid var(--gold)",lineHeight:1.7}}>
            📐 <strong style={{color:"var(--blk)"}}>安裝費用試算表</strong><br/>
            此為費用試算，僅供參考。實際費用以現場評估為準。<br/>
            生成 PDF 後業務將收到通知並與您確認詳情。
          </div>
          {instCalc&&instRegion&&<div style={{fontSize:11,color:"var(--muted)",marginBottom:8,padding:"7px 10px",background:"#f4efe8",borderLeft:"2px solid var(--gold)"}}>
            合計：{instCalc.totalQty||0} 盞 + {instCalc.totalMeters||0} 米 = {instCalc.totalUnits||0} 單位
            {instCalc.reg?.freeAt&&<span style={{color:instCalc.totalUnits>=instCalc.reg.freeAt?"var(--green)":"var(--red)",marginLeft:8}}>{instCalc.totalUnits>=instCalc.reg.freeAt?"✓ 達免車馬費門檻":`差 ${instCalc.reg.freeAt-instCalc.totalUnits} 單位可免車馬費`}</span>}
          </div>}
          {installChoice===true&&instRegion&&<button className="btn-pdf" style={{marginBottom:8}} onClick={()=>{setInstOpen(false);doActualDownload();}}>✓ 完成 · 下載燈具＋安裝整合報價單</button>}
          <button className="btn-gold" disabled={!instRegion} onClick={()=>{
            if(!instRegion){toast$("請先選擇安裝區域");return;}
            generateInstallOnlyPDF();
          }}>📄 生成安裝費用試算 PDF</button>
        </div>}
      </div>

      {toast&&<div className="toast">{toast}</div>}
    </div>
    </>
  );
}

// ✅ ErrorBoundary 包住整個 App，防止任何錯誤白屏
export default function SafeApp() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
