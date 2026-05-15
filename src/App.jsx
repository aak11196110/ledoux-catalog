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

const URGENT_REGIONS = [
  { id:"taoyuan",  label:"桃園核心區",      fee:1500 },
  { id:"newTaipei",label:"新北地區",        fee:2500 },
  { id:"taipei",   label:"台北地區",        fee:3500 },
  { id:"regional", label:"宜蘭／新竹／苗栗", fee:5000 },
  { id:"taichung", label:"台中地區",        fee:8000 },
];
const INSTALL_REGIONS = [
  { id:"core",     label:"桃園核心區",         areas:"八德、桃園、中壢、大溪、鶯歌",           km:"0–10 km",     travel:600,  freeAt:15,  areaNote:"桃園市八德、桃園、中壢、大溪、鶯歌等核心鄉鎮市區"  },
  { id:"outer",    label:"桃園外環區",          areas:"大園、觀音、新屋、龜山、蘆竹",           km:"11–25 km",    travel:1000, freeAt:25,  areaNote:"桃園市大園、觀音、新屋、龜山、蘆竹等外圍行政區"    },
  { id:"north",    label:"北台近郊區",          areas:"雙北全區、新竹縣市",                     km:"26–55 km",    travel:1800, freeAt:45,  areaNote:"新北市全區、台北市全區、新竹縣市（含竹北）"         },
  { id:"yilan",    label:"宜蘭專區",            areas:"宜蘭縣全區（交通特殊性）",              km:"不論距離",    travel:2500, freeAt:60,  areaNote:"宜蘭縣全境（礁溪、羅東、宜蘭市、蘇澳等），翻越雪山隧道計費" },
  { id:"centralA", label:"中台灣 A 區",         areas:"苗栗、頭份、竹南、北台山區",             km:"56–90 km",    travel:2800, freeAt:80,  areaNote:"苗栗縣全區、頭份市、竹南、三義等中台灣北段"         },
  { id:"centralB", label:"中台灣 B 區",         areas:"台中、彰化、南投市區",                   km:"91–150 km",   travel:3800, freeAt:120, areaNote:"台中市全區、彰化縣全區、南投縣市區（不含山地）"      },
  { id:"southA",   label:"南台灣 A 區",         areas:"雲林、嘉義地區",                         km:"151–220 km",  travel:5000, freeAt:null, areaNote:"雲林縣全區、嘉義縣市全區"                          },
  { id:"southB",   label:"南台灣 B 區 ／ 花東",  areas:"台南、高雄、屏東、花蓮、台東",           km:"221 km 以上", travel:6500, freeAt:null, areaNote:"台南市、高雄市、屏東縣全區，花蓮縣、台東縣（含玉里、關山）" },
  { id:"remote",   label:"離島 ／ 偏遠山區",    areas:"金門、馬祖、澎湖、南投深山",             km:"專案評估",    travel:null, freeAt:null, areaNote:"金門縣、連江縣、澎湖縣，南投縣山地鄉（仁愛、信義）需另行評估" },
];

const CEILING_GROUPS = [
  { id:"std",   label:"3.0m 以下（標準）",       surcharge:0,    note:"含定位、安裝與功能測試" },
  { id:"high",  label:"3.1m – 4.5m（挑高）",    surcharge:80,   note:"視現場難度，需 A 型梯（+NT$80/盞）" },
  { id:"vhigh", label:"4.5m 以上（不含安裝費）", surcharge:null, note:"需鷹架或高空作業車，安裝費另案報價" },
];

const TRAVEL_STAY = { kmThreshold:150, lampThreshold:80, stayPerNight:2000, mealPerDay:500 };

// 商照燈系列（含中文名）
const COMMERCIAL_SERIES = [
  "DC48V 磁吸軌道","EOS 奧斯","SLOT 希洛特","COSY 寇斯","YODA 優打1代","YODA 優打2代",
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
  { id:28, model:"YODA 系列",   series:"YODA 優打1代",         category:"崁燈",    watt:"—",      lumen:"—",       cct:"—",                       beam:"—",               voltage:"—",      cri:"—",     color:"—",             cutout:"—",      size:"—",           install:"—",        cert:"—",     shipping:90,  stdPrice:0,    projPrice:0,    video:"", desc:"YODA 優打1代系列，DSU/DSB/DSH/DSS/DSA/DSB-X 多款崁燈，Ra≥95 高顯色。", images:[], note:"新系列開發中，敬請期待。" },
];

const INIT_INVENTORY = [];

// ─────────────────────────────────────────────
//  CSS
// ─────────────────────────────────────────────
const G = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Noto+Sans+TC:wght@200;300;400;500&display=swap');
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes shimmer{0%,100%{opacity:.3}50%{opacity:1}}
@keyframes dotPulse{0%,80%,100%{transform:scale(0.6);opacity:.4}40%{transform:scale(1);opacity:1}}
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
.catbtn{padding:10px 20px;background:transparent;border:none;border-bottom:1px solid transparent;color:var(--blk);font-family:'Noto Sans TC',sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;white-space:nowrap;margin-bottom:-0.5px;transition:all .2s}
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
@keyframes lightPulse{0%,100%{opacity:0.7;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.1)}}
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

function generatePDF({cart, projectName, customer, installCalc=null, isVip, discountRate=1, discountLabel="", orderType="", urgentData=null}) {
  const today = new Date();
  const ds = `${today.getFullYear()}/${String(today.getMonth()+1).padStart(2,"0")}/${String(today.getDate()).padStart(2,"0")}`;
  const dateStr = `${today.getFullYear()}${String(today.getMonth()+1).padStart(2,"0")}${String(today.getDate()).padStart(2,"0")}`;
  const discSuffix = discountRate < 1 ? String(Math.round(discountRate*10)).padStart(3,"0") : String(Math.floor(Math.random()*900)+100);
  const qn = `C${dateStr}-${discSuffix}`;
  const priceLabel = discountRate < 1 ? `專案折扣價` : isVip ? "專案價" : "建議牌價";

  const rows = cart.map((item, i) => {
    const p = item.product;
    const sp = item.spec||{};
    const baseP = Number(p.stdPrice) || 0;
    const unitPrice = Math.round(baseP * discountRate);
    const subtotal = unitPrice * item.qty;
    // 規格顯示：優先使用客戶選擇的自訂值
    const cctDisplay = sp.cct==="其他"?(sp.customCct||"特殊色溫（待確認）"):sp.cct||p.cct;
    const beamDisplay = sp.beam==="其他"?(sp.customBeam||"特殊角度"):sp.beam||p.beam;
    const outerDisplay = sp.outerColor==="其他"?(sp.customColor||"特殊外框色"):sp.outerColor;
    const innerDisplay = sp.innerColor&&sp.innerColor!=="其他"?`內框:${sp.innerColor}`:sp.innerColor==="其他"?`內框:${sp.customInnerColor||"特殊"}`:null;
    const colorDisplay = outerDisplay?[`外框:${outerDisplay}`,innerDisplay].filter(Boolean).join(" "):sp.color||p.color;
    const specNote = [sp.cct==="其他"?"⚠ 特殊色溫需確認":"",sp.beam==="其他"?"⚠ 特殊光束角需確認":"",sp.outerColor==="其他"?"⚠ 特殊顏色需確認":""].filter(Boolean).join(" ");
    const desc = [p.watt, beamDisplay, cctDisplay, p.voltage, p.cri, colorDisplay, p.cutout ? `開孔${p.cutout}` : ""].filter(Boolean).join(" / ");
    const imgHtml = p.images && p.images[0]
      ? `<img src="${p.images[0]}" style="max-width:70px;max-height:55px;object-fit:contain;" onerror="this.style.display='none'">`
      : `<div style="width:70px;height:55px;background:#f0ebe2;display:flex;align-items:center;justify-content:center;font-size:9px;color:#ccc;">NO IMG</div>`;
    return `<tr>
      <td style="text-align:center;padding:8px 5px;">${i+1}</td>
      <td style="text-align:center;padding:5px;">${imgHtml}</td>
      <td style="padding:8px 6px;font-weight:500;">${p.model}</td>
      <td style="padding:8px 6px;font-size:10px;color:#555;">${desc}${specNote?`<br><span style="color:#9b3a3a;font-size:9px;">${specNote}</span>`:""}</td>
      <td style="text-align:center;padding:8px 5px;">${item.qty}</td>
      <td style="text-align:center;padding:8px 5px;">盞</td>
      <td style="text-align:right;padding:8px 8px;">${unitPrice > 0 ? unitPrice.toLocaleString() : "洽業務"}</td>
      <td style="text-align:right;padding:8px 8px;font-weight:500;">${subtotal > 0 ? subtotal.toLocaleString() : "—"}</td>
      <td style="padding:8px 5px;font-size:10px;color:#555;">${p.note||""}</td>
    </tr>`;
  }).join("");

  const untaxed = cart.reduce((s, item) => {
    const p = item.product;
    const baseP = Number(p.stdPrice) || 0;
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
const urgentFee = urgentData ? urgentData.fee : 0;
const tax = Math.round(untaxed * 0.05);
const lampTotal = untaxed + tax;                              // 只有燈具含稅
const grandTotal = lampTotal + installTotal + urgentFee;     // 全部加總

  const discRow = discountRate < 1
    ? `<tr style="background:#fdf8ee;"><td colspan="3" style="text-align:right;padding:5px 12px;font-size:10px;color:#b8935a;">專案折扣已套用</td></tr>`
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

${discountRate < 1 ? `<div class="price-note">⚠ 本報價單已套用 專屬折扣，報價僅供本次專案使用，請勿對外流通。</div>` : ""}

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
    ${urgentData ? `<div class="tot-row" style="color:#b8935a;font-weight:700"><span>⚡ 閃電緊急支援（${urgentData.label}）</span><span>NT$ ${urgentData.fee.toLocaleString()}</span></div>` : ""}
    <div class="tot-row"><span>金額（未稅）</span><span>NT$ ${untaxed.toLocaleString()}</span></div>
    <div class="tot-row tax-row"><span>稅金（5%）</span><span>NT$ ${tax.toLocaleString()}</span></div>
    <div class="tot-row final"><span>總金額（含稅）</span><span>NT$ ${lampTotal.toLocaleString()}</span></div>
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


// ══════════════════════════════════════════
//  互動展示間元件
// ══════════════════════════════════════════

// ══════════════════════════════════════════
//  管理員產品管理頁面
// ══════════════════════════════════════════
function AdminProductEditor({ product, onSave, onClose, series_list }) {
  const FIELDS = [
    {key:"series",    label:"系列",    type:"select", options: series_list},
    {key:"model",     label:"型號 *",  type:"text"},
    {key:"category",  label:"燈具類型",type:"select", options:["崁燈","軌道燈","吸頂燈","磁吸系統","壁燈","地腳燈","戶外燈","鋁條燈","燈帶","洗牆燈","軟條燈","其他"]},
    {key:"status",    label:"狀態",    type:"select", options:["銷售中","停產","規格更新","即將上市"]},
    {key:"watt",      label:"瓦數",    type:"text"},
    {key:"lumen",     label:"流明",    type:"text"},
    {key:"cct",       label:"色溫",    type:"text"},
    {key:"beam",      label:"光束角",  type:"text"},
    {key:"voltage",   label:"電壓",    type:"text"},
    {key:"cri",       label:"演色性",  type:"text"},
    {key:"color",     label:"顏色",    type:"text"},
    {key:"cutout",    label:"開孔尺寸",type:"text"},
    {key:"size",      label:"產品尺寸",type:"text"},
    {key:"install",   label:"安裝方式",type:"text"},
    {key:"cert",      label:"認證",    type:"text"},
    {key:"stdPrice",  label:"標準牌價",type:"number"},
    {key:"projPrice", label:"專案價",  type:"number"},
    {key:"shipping",  label:"運費",    type:"number"},
    {key:"desc",      label:"產品描述",type:"textarea"},
    {key:"note",      label:"備註",    type:"textarea"},
    {key:"images",    label:"圖片網址",type:"text"},
    {key:"video",     label:"影片連結",type:"text"},
  ];

  const [form, setForm] = React.useState(() => {
    const base = {};
    FIELDS.forEach(f => { base[f.key] = product?.[f.key] ?? ""; });
    if (Array.isArray(base.images)) base.images = base.images[0] || "";
    return base;
  });

  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"var(--ivory)",border:"0.5px solid var(--bdr)",borderRadius:8,width:"100%",maxWidth:680,maxHeight:"90vh",overflow:"auto",padding:28}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h2 style={{fontSize:16,fontWeight:600,letterSpacing:"2px"}}>{product?.model ? `編輯：${product.model}` : "新增燈具"}</h2>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"var(--muted)"}}>✕</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          {FIELDS.map(f => (
            <div key={f.key} style={{gridColumn: f.type==="textarea"?"1/-1":"auto"}}>
              <label style={{fontSize:10,letterSpacing:"2px",color:"var(--muted)",display:"block",marginBottom:4}}>{f.label}</label>
              {f.type==="select" ? (
                <select value={form[f.key]} onChange={e=>set(f.key, e.target.value)}
                  style={{width:"100%",padding:"8px 10px",border:"0.5px solid var(--bdr)",background:"var(--ivory)",fontFamily:"'Noto Sans TC',sans-serif",fontSize:13,borderRadius:4}}>
                  <option value="">— 請選擇 —</option>
                  {f.options.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type==="textarea" ? (
                <textarea value={form[f.key]} onChange={e=>set(f.key, e.target.value)} rows={3}
                  style={{width:"100%",padding:"8px 10px",border:"0.5px solid var(--bdr)",background:"var(--ivory)",fontFamily:"'Noto Sans TC',sans-serif",fontSize:13,borderRadius:4,resize:"vertical"}}/>
              ) : (
                <input type={f.type} value={form[f.key]} onChange={e=>set(f.key, e.target.value)}
                  style={{width:"100%",padding:"8px 10px",border:"0.5px solid var(--bdr)",background:"var(--ivory)",fontFamily:"'Noto Sans TC',sans-serif",fontSize:13,borderRadius:4}}/>
              )}
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{padding:"10px 24px",background:"transparent",border:"0.5px solid var(--bdr)",cursor:"pointer",fontFamily:"'Noto Sans TC',sans-serif",fontSize:12,letterSpacing:"2px"}}>取消</button>
          <button onClick={()=>onSave(form)} style={{padding:"10px 32px",background:"var(--blk)",color:"var(--ivory)",border:"none",cursor:"pointer",fontFamily:"'Noto Sans TC',sans-serif",fontSize:12,letterSpacing:"2px"}}>儲存同步</button>
        </div>
      </div>
    </div>
  );
}

function ShowroomPage({ scene, setScene, hoveredLight, setHoveredLight, setPage, setSeriesF }) {

  // 室內燈具熱點
  const INDOOR_LIGHTS = [
  { id:"magnetic",   x:33,  y:18, name:"磁吸軌道燈",  series:"DC48V 磁吸軌道",         model:"DC.TS0110-C", glow:"rgba(255,220,120,0.8)" },
  { id:"linear",     x:22,  y:32, name:"鋁條燈",       series:"鋁條燈",                 model:"ALA0011-A",   glow:"rgba(255,200,80,0.6)"  },
  { id:"pendant",    x:10,  y:52, name:"吊燈",          series:"HEPBURN 赫本",           model:"HB.D130",     glow:"rgba(255,210,120,0.7)" },
  { id:"softstrip",  x:28,  y:68, name:"軟條燈",        series:"LED STRIP LIGHT 低壓燈帶",model:"ALA0011-P",  glow:"rgba(255,180,60,0.6)"  },
  { id:"track",      x:58,  y:25, name:"軌道燈",        series:"EOS 奧斯",               model:"TSU0515-C",   glow:"rgba(255,230,150,0.8)" },
  { id:"track2",     x:76,  y:22, name:"二線軌道燈",    series:"EOS 奧斯",               model:"TSU0823-C",   glow:"rgba(255,220,120,0.7)" },
  { id:"recessed",   x:60,  y:48, name:"崁入式射燈",    series:"HEPBURN 赫本",           model:"HB.D120",     glow:"rgba(255,240,180,0.9)" },
  { id:"wall",       x:88,  y:48, name:"壁燈",          series:"WALL LIGHT 壁燈",        model:"LX-WSH-1",    glow:"rgba(255,210,130,0.7)" },
  { id:"steplight",  x:83,  y:72, name:"地角燈",        series:"STEP LIGHT 地腳燈",      model:"LX-STP-1",    glow:"rgba(255,180,80,0.7)"  },
];

  // 戶外燈具熱點
  const OUTDOOR_LIGHTS = [
    { id:"o-wall",   x:18,  y:32, name:"陽台投射燈",    series:"OUTDOOR LIGHT 戶外燈具",model:"LX-101",    glow:"rgba(255,180,80,0.9)"  },
    { id:"o-wash",   x:30,  y:28, name:"洗牆燈",        series:"WALL LIGHT 壁燈", model:"LX-WSH-102",glow:"rgba(200,210,255,0.7)"  },
    { id:"o-mag",    x:48,  y:18, name:"磁吸軌道燈",    series:"DC48V 磁吸軌道", model:"LX-MAG-103",glow:"rgba(180,220,255,0.7)"  },
    { id:"o-cil",    x:65,  y:15, name:"吸頂燈",        series:"EOS 奧斯",        model:"LX-CIL-107",glow:"rgba(255,240,180,0.6)"  },
    { id:"o-trk",    x:80,  y:15, name:"二線軌道燈",    series:"EOS 奧斯",        model:"LX-TRK-104",glow:"rgba(255,220,120,0.7)"  },
    { id:"o-dwn",    x:48,  y:38, name:"崁燈",          series:"HEPBURN 赫本",   model:"LX-DWN-105",glow:"rgba(255,230,150,0.8)"  },
    { id:"o-pdn",    x:62,  y:35, name:"吊燈",          series:"HEPBURN 赫本",   model:"LX-PDN-106",glow:"rgba(255,200,100,0.6)"  },
    { id:"o-gnd",    x:55,  y:62, name:"落地投射燈",    series:"OUTDOOR LIGHT 戶外燈具",model:"LX-GND-108",glow:"rgba(255,140,40,0.9)"},
    { id:"o-wash2",  x:90,  y:25, name:"浴室洗牆燈",    series:"WALL LIGHT 壁燈", model:"LX-WSH-109",glow:"rgba(200,210,255,0.6)"  },
  ];

  const lights = scene === "indoor" ? INDOOR_LIGHTS : OUTDOOR_LIGHTS;
  const hLight = lights.find(l => l.id === hoveredLight);

  // 室內背景：高級商業空間
  // 真實渲染圖背景（base64 內嵌）
  const indoorBg = "data:image/webp;base64,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";
  const outdoorBg = "data:image/webp;base64,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";


const bgUrl = scene === "indoor"
  ? "https://raw.githubusercontent.com/aak11196110/ledoux-catalog/main/indoor.png"
  : outdoorBg;

  return (
    <div style={{position:"relative",width:"100%",height:"100vh",overflow:"hidden",background:"#0a0e18"}}>
      {/* 場景切換按鈕 */}
      <div style={{position:"absolute",top:16,left:"50%",transform:"translateX(-50%)",zIndex:10,display:"flex",gap:8,background:"rgba(0,0,0,0.5)",borderRadius:40,padding:"4px"}}>
        {[["indoor","🏠 室內展示"],["outdoor","🌙 戶外天台"]].map(([sc,lb])=>(
          <button key={sc} onClick={()=>setScene(sc)} style={{
            padding:"8px 20px",border:"none",borderRadius:36,cursor:"pointer",
            fontSize:13,fontFamily:"'Noto Sans TC',sans-serif",letterSpacing:"1px",
            transition:"all .3s",
            background: scene===sc ? "var(--gold)" : "transparent",
            color: scene===sc ? "#111" : "rgba(255,255,255,0.6)",
            fontWeight: scene===sc ? 700 : 400
          }}>{lb}</button>
        ))}
      </div>

      {/* 背景 SVG */}
      <div style={{position:"absolute",inset:0,backgroundImage:`url("${bgUrl}")`,backgroundSize:"contain",backgroundPosition:"center",backgroundRepeat:"no-repeat"}}/>

      {/* 燈具熱點 */}
      {lights.map(light=>{
        const isHov = hoveredLight === light.id;
        return (
          <div key={light.id}
            onMouseEnter={()=>setHoveredLight(light.id)}
            onMouseLeave={()=>setHoveredLight(null)}
            onClick={()=>{ setSeriesF(light.series); setPage("catalog"); }}
            style={{
              position:"absolute",
              left:`${light.x}%`, top:`${light.y}%`,
              transform:"translate(-50%,-50%)",
              cursor:"pointer",
              zIndex:5
            }}>
            {/* 外圈光暈（大，模擬照亮環境） */}
            {isHov&&<div style={{
              position:"absolute",
              width:200, height:200,
              borderRadius:"50%",
              background:`radial-gradient(circle, ${light.glow} 0%, transparent 70%)`,
              top:"50%", left:"50%",
              transform:"translate(-50%,-50%)",
              pointerEvents:"none",
              animation:"lightPulse 1.5s ease-in-out infinite"
            }}/>}
            {/* 中圈光暈 */}
            <div style={{
              position:"absolute",
              width: isHov ? 100 : 16,
              height: isHov ? 100 : 16,
              borderRadius:"50%",
              background: light.glow,
              top:"50%", left:"50%",
              transform:"translate(-50%,-50%)",
              transition:"all .5s ease",
              filter: isHov ? "blur(12px)" : "blur(4px)",
              opacity: isHov ? 0.9 : 0.25
            }}/>
            {/* 熱點圓點 */}
            <div style={{
              width: isHov ? 18 : 8,
              height: isHov ? 18 : 8,
              borderRadius:"50%",
              background: isHov ? "#ffffff" : "rgba(255,255,255,0.35)",
              border: `2px solid ${isHov ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)"}`,
              position:"relative", zIndex:1,
              transition:"all .3s",
              boxShadow: isHov ? `0 0 30px 8px ${light.glow}, 0 0 8px 2px rgba(255,255,255,0.6)` : "0 0 6px rgba(255,255,255,0.2)"
            }}/>
            {/* 地板投影（燈亮時） */}
            {isHov&&<div style={{
              position:"absolute",
              width:120, height:40,
              borderRadius:"50%",
              background:`radial-gradient(ellipse, ${light.glow} 0%, transparent 70%)`,
              top:"120%", left:"50%",
              transform:"translateX(-50%)",
              filter:"blur(8px)",
              opacity:0.5,
              pointerEvents:"none"
            }}/>}
            {/* 燈具名稱標籤 */}
            {isHov&&(
              <div style={{
                position:"absolute",
                bottom:"calc(100% + 10px)",
                left:"50%",
                transform:"translateX(-50%)",
                background:"rgba(10,12,20,0.92)",
                border:"0.5px solid rgba(184,147,90,0.5)",
                borderRadius:8,
                padding:"8px 14px",
                minWidth:140,
                whiteSpace:"nowrap",
                textAlign:"center"
              }}>
                <div style={{fontSize:14,fontWeight:600,color:"#fff",letterSpacing:"1px"}}>{light.name}</div>
                <div style={{fontSize:11,color:"var(--gold)",marginTop:2,letterSpacing:"2px"}}>{light.model}</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",marginTop:3}}>{light.series}</div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.4)",marginTop:4}}>點擊查看系列</div>
              </div>
            )}
          </div>
        );
      })}

      {/* 右下角品牌浮水印 */}
      <div style={{position:"absolute",bottom:20,right:24,zIndex:5,opacity:0.4}}>
        <div style={{fontSize:11,letterSpacing:"4px",color:"rgba(255,255,255,0.6)"}}>LEDOUX LIGHTING</div>
      </div>

      {/* 進入產品目錄按鈕 */}
      <div style={{position:"absolute",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:10,display:"flex",gap:12}}>
        <button onClick={()=>setPage("catalog")} style={{
          padding:"12px 32px",background:"var(--gold)",border:"none",borderRadius:4,
          color:"#111",fontSize:13,fontWeight:700,letterSpacing:"2px",cursor:"pointer",
          fontFamily:"'Noto Sans TC',sans-serif"
        }}>瀏覽產品目錄</button>
        <button onClick={()=>setPage("inventory")} style={{
          padding:"12px 24px",background:"transparent",border:"1px solid rgba(255,255,255,0.3)",
          borderRadius:4,color:"rgba(255,255,255,0.8)",fontSize:13,letterSpacing:"2px",cursor:"pointer",
          fontFamily:"'Noto Sans TC',sans-serif"
        }}>台灣現貨庫存</button>
      </div>

      {/* 左下角燈具索引 */}
      <div style={{
        position:"absolute",bottom:70,left:24,zIndex:5,
        background:"rgba(0,0,0,0.6)",border:"0.5px solid rgba(255,255,255,0.1)",
        borderRadius:8,padding:"12px 16px",maxWidth:220
      }}>
        <div style={{fontSize:9,letterSpacing:"3px",color:"rgba(255,255,255,0.4)",marginBottom:8}}>
          {scene==="indoor"?"INDOOR SHOWROOM":"OUTDOOR TERRACE"}
        </div>
        {lights.slice(0,5).map((l,i)=>(
          <div key={l.id} onClick={()=>{setSeriesF(l.series);setPage("catalog");}}
            style={{fontSize:11,color:"rgba(255,255,255,0.6)",padding:"3px 0",cursor:"pointer",
              borderBottom:"0.5px solid rgba(255,255,255,0.05)",display:"flex",gap:8,alignItems:"center"}}
            onMouseEnter={()=>setHoveredLight(l.id)} onMouseLeave={()=>setHoveredLight(null)}>
            <span style={{color:"var(--gold)",minWidth:14}}>{i+1}</span>
            <span>{l.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [appLoading, setAppLoading] = useState(!!SHEET_URL);
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
  const [page, setPage] = useState("catalog");
  const [showroomScene, setShowroomScene] = useState("indoor");
  const [adminTab,     setAdminTab]     = useState("products"); // products | inventory | install
  const [editProduct,  setEditProduct]  = useState(null);  // null=關閉, {}=新增, {...}=編輯
  const [editInv,      setEditInv]      = useState(null);
  const [productSaving,setProductSaving]= useState(false); // indoor | outdoor
  const [hoveredLight,  setHoveredLight]  = useState(null);
  const [cat,        setCat]        = useState("全部");
  const [seriesF,    setSeriesF]    = useState(null);
  const [invCat,     setInvCat]     = useState("全部");
  const [invCct, setInvCct] = useState("全部");
const [invColor, setInvColor] = useState("全部");
const [invBeam, setInvBeam] = useState("全部");
  const [searchQ,    setSearchQ]    = useState("");
  const [searchFocus,setSearchFocus]= useState(false);
  const [searchHist, setSearchHist] = useState([]);
  const [selProd,    setSelProd]    = useState(null);
  const [selSpec, setSelSpec] = useState({beam:"", color:"", cct:"", outerColor:"", innerColor:"", customCct:"", customColor:"", addon:[]});
  const [addons, setAddons] = useState([]);
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
const [linearExp,  setLinearExp]  = useState(true);
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
  const [orderType,       setOrderType]       = useState("");   // "stock" | "new"
const [urgentSupport,   setUrgentSupport]   = useState(false);
const [urgentRegion,    setUrgentRegion]    = useState("");
  const [inlineEdit, setInlineEdit] = useState(null);
  const [inlineData, setInlineData] = useState({});
  const [visitOpen,    setVisitOpen]    = useState(false);
const [visitStep,    setVisitStep]    = useState(1); // 1=填資料 2=選日期 3=完成
const [visitForm,    setVisitForm]    = useState({
  name:"", company:"", phone:"", address:"",
  interestedSeries:[], interestedModel:"", note:""
});
const [visitDate,    setVisitDate]    = useState("");
const [visitSlot,    setVisitSlot]    = useState("");
const [visitSlots,   setVisitSlots]   = useState({}); // {YYYY-MM-DD: ["10:00","14:00",...]}
const [visitLoading, setVisitLoading] = useState(false);
const [visitDone,    setVisitDone]    = useState(false);
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
    if (!sheetUrl) { setAppLoading(false); return; }
    (async () => {
      setSyncStatus("loading");
      try {
const [prods, invs, addonData] = await Promise.all([
  sheetGet("getProducts"),
  sheetGet("getInventory"),
  sheetGet("getAddons")
]);
        if (prods?.length > 0) setProducts(prods);
        if (invs?.length > 0)  setInventory(invs);
        if (addonData?.length > 0) setAddons(addonData);
        setSyncStatus("ok");
      } catch(e) {
        setSyncStatus("off");
      } finally {
        setAppLoading(false);
      }
    })();
  }, [sheetUrl]);
useEffect(()=>{
  if(selProd) setSelSpec({beam:"", color:"", cct:"", addon:[]});
}, [selProd]);
  const syncProducts  = async p  => { if(!sheetUrl)return; setSyncStatus("loading"); await sheetPost("saveProducts",p); setSyncStatus("ok"); };
  const syncInventory = async iv => { if(!sheetUrl)return; setSyncStatus("loading"); await sheetPost("saveInventory",iv); setSyncStatus("ok"); };
  const syncUpsertInv = async it => { if(!sheetUrl)return; setSyncStatus("loading"); await sheetPost("upsertInventory",it); setSyncStatus("ok"); };

  // 載入預約可用時段
const loadVisitSlots = async () => {
  setVisitLoading(true);
  try {
    const data = await sheetGet("getVisitSlots");
    if (data && typeof data === "object") setVisitSlots(data);
  } catch(e) { console.warn("無法載入時段"); }
  setVisitLoading(false);
};

// 判斷是否為平日
const isWeekday = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const day = d.getDay();
  return day !== 0 && day !== 6; // 排除週六日
};

// 產生未來 60 天的平日清單
const getWeekdays = () => {
  const days = [];
  const today = new Date();
  today.setHours(0,0,0,0);
  for (let i = 1; i <= 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      const str = d.toISOString().split("T")[0];
      days.push(str);
    }
  }
  return days;
};

const submitVisit = async () => {
  if (!visitForm.name || !visitForm.phone || !visitDate || !visitSlot) {
    toast$("請填寫完整資料並選擇日期時段");
    return;
  }
  const rec = {
    id: "VISIT"+Date.now(),
    date: new Date().toISOString().split("T")[0],
    visitDate, visitSlot,
    customerName: visitForm.name,
    company: visitForm.company,
    phone: visitForm.phone,
    address: visitForm.address,
    interestedSeries: visitForm.interestedSeries.join("、"),
    interestedModel: visitForm.interestedModel,
    note: visitForm.note,
    status: "待確認"
  };
  if (sheetUrl) await sheetPost("saveVisitRequest", rec);
  sendNotifyEmail(
    `【預約到府介紹】${visitForm.name}（${visitForm.company||"—"}）— ${visitDate} ${visitSlot}`,
    `預約到府產品介紹申請\n\n聯繫人：${visitForm.name}\n公司：${visitForm.company||"—"}\n電話：${visitForm.phone}\n地址：${visitForm.address||"—"}\n\n預約日期：${visitDate}\n預約時段：${visitSlot}\n\n感興趣系列：${visitForm.interestedSeries.join("、")||"—"}\n指定型號：${visitForm.interestedModel||"—"}\n備註：${visitForm.note||"—"}\n\nLEDOUX 諾科照明 報價系統自動通知`
  );
  setVisitDone(true);
};
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
   else if (cat!=="全部") ps = ps.filter(p=>p.category===cat||(cat==="鋁條燈"&&p.category==="軟條燈")||(cat==="軟條燈"&&p.category==="鋁條燈"));
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

const filteredInv = inventory.filter(i=>
  (invCat==="全部"||i.category===invCat)&&
  (invCct==="全部"||i.cct===invCct)&&
  (invColor==="全部"||i.color===invColor)&&
  (invBeam==="全部"||i.beam===invBeam)
);
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

 const addToCart = (p, spec={}) => { const key=p.id+JSON.stringify(spec); setCart(c=>{const ex=c.find(i=>i._key===key);return ex?c.map(i=>i._key===key?{...i,qty:i.qty+1}:i):[...c,{product:p,qty:1,spec,_key:key}];}); toast$(`${p.model} 已加入詢價單`); };
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
 generatePDF({cart,projectName:projName,customer:{...customer,phone:customer.phone||custPhone,address:customer.address||custAddress},installCalc:installData,isVip,discountRate,discountLabel,orderType,urgentData:urgentSupport&&urgentRegion?URGENT_REGIONS.find(r=>r.id===urgentRegion):null});
    const baseSubtotal=cart.reduce((s,i)=>s+(Number(i.product.stdPrice)||0)*i.qty,0);
    const lampSubtotal=Math.round(baseSubtotal*discountRate);
    if(sheetUrl){
      sheetPost("saveOrder",{id:"ORD"+Date.now(),date:new Date().toISOString().split("T")[0],customerName:customer.name,company:customer.company,projectName:projName,items:cart.map(i=>`${i.product.model}×${i.qty}`).join("、"),subtotal:lampSubtotal,tax:0,shipping:0,total:0,isVip:isVip?"是":"否",discount:discountLabel||"牌價"});
    }
    sendNotifyEmail(
      `【報價單】${customer.name}（${customer.company||"訪客"}）— ${projName}`,
      `━━━━━━━━━━━━━━━━━━━━\n報價單下載通知\n━━━━━━━━━━━━━━━━━━━━\n客　　戶：${customer.name}\n公　　司：${customer.company||"—"}\n聯絡電話：${customer.phone||"—"}\n案　　名：${projName||"—"}\n折　扣：${discountLabel||"牌價"}\n━━━━━━━━━━━━━━━━━━━━\n品項明細：\n${cart.map(i=>{const p=i.product;const price=Math.round(Number(p.stdPrice)*discountRate);return `  • ${p.model}（${p.series}）× ${i.qty} 盞  NT$${price.toLocaleString()}/盞  小計 NT$${(price*i.qty).toLocaleString()}`;}).join("\n")}\n━━━━━━━━━━━━━━━━━━━━\n燈具小計：NT$ ${lampSubtotal.toLocaleString()}\n稅金(5%)：NT$ ${Math.round(lampSubtotal*0.05).toLocaleString()}\n含稅總計：NT$ ${Math.round(lampSubtotal*1.05).toLocaleString()}\n━━━━━━━━━━━━━━━━━━━━\nLEDOUX 諾科照明 報價系統自動通知`
    );
if(urgentData){
  sendNotifyEmail(
    "【⚡ 急件訂單】"+customer.name+"（"+(customer.company||"訪客")+"）— "+projName,
    "━━━━━━━━━━━━━━━━━━━━\n⚡ 閃電緊急支援訂單通知\n━━━━━━━━━━━━━━━━━━━━\n客　　戶："+customer.name+"\n公　　司："+(customer.company||"—")+"\n聯絡電話："+(customer.phone||"—")+"\n案　　名："+(projName||"—")+"\n━━━━━━━━━━━━━━━━━━━━\n配送地區："+urgentData.label+"\n急件費用：NT$ "+urgentData.fee.toLocaleString()+"\n━━━━━━━━━━━━━━━━━━━━\n品項明細：\n"+cart.map(i=>"  • "+i.product.model+"（"+i.product.series+"）× "+i.qty+" 盞").join("\n")+"\n━━━━━━━━━━━━━━━━━━━━\n⚠ 請盡快與客戶確認出勤時間\nLEDOUX 諾科照明 報價系統自動通知"
  );
}
    toast$("報價單已下載");
  };

  // ✅ handleGenPDF：確認後先問安裝，再下載
  const handleGenPDF = () => {
    if(!projName.trim()){toast$("請先填寫案名");return;}
    if(!allChecked){toast$("請先勾選確認所有注意事項");return;}
    if(orderType==="stock" && urgentSupport && !urgentRegion){toast$("請選擇急件配送地區");return;}
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
    if(isGuest && (!company || !name || !phone)){
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

  // ── Admin Page ──
  if(page==="admin" && isAdmin) {
    const saveProduct = async (form) => {
      if(!form.model){toast$("請填寫型號");return;}
      setProductSaving(true);
      const rec = {
        ...form,
        id: editProduct?.id || ("P"+Date.now()),
        images: form.images ? [form.images] : [],
        stdPrice: Number(form.stdPrice)||0,
        projPrice: Number(form.projPrice)||0,
        shipping: Number(form.shipping)||90,
        catalog: COMMERCIAL_SERIES.includes(form.series) ? "商照燈" : "線型燈"
      };
      // 更新本地
      setProducts(ps => {
        const idx = ps.findIndex(p=>p.id===rec.id);
        if(idx>=0){const arr=[...ps];arr[idx]=rec;return arr;}
        return [...ps, rec];
      });
      // 同步到 Google Sheets
      if(sheetUrl) await sheetPost("upsertProduct", rec);
      setProductSaving(false);
      setEditProduct(null);
      toast$("✅ 已儲存並同步到 Google Sheets");
    };

    const deleteProduct = async (p) => {
      if(!confirm(`確定要刪除 ${p.model}？`)) return;
      setProducts(ps => ps.filter(x=>x.id!==p.id));
      toast$("已從網頁移除（請在 Google Sheets 同步刪除該行）");
    };

    const seriesList = [...COMMERCIAL_SERIES, ...LINEAR_SERIES_LIST];

    return (
      <><style>{G}</style>
      <div className="app">
        {menuOpen&&<div className="sidemenu-overlay" onClick={()=>setMenuOpen(false)}/>}
        <div className={`sidemenu ${menuOpen?"open":""}`}>
          <div className="sm-head"><div className="sm-logo">LEDOUX</div><button className="sm-close-btn" onClick={()=>setMenuOpen(false)}>✕</button></div>
          <div className="sm-nav">
            
            <div className="sm-item" onClick={()=>{setPage("catalog");setMenuOpen(false);}}><span>產品目錄</span></div>
            <div className="sm-item on"><span>產品管理</span></div>
          </div>
        </div>
        <nav className="topbar">
          <button className="menu-btn" onClick={()=>setMenuOpen(true)}>☰</button>
          <span className="topbar-logo">LEDOUX 管理後台</span>
        </nav>
        <div style={{padding:"80px 24px 24px",maxWidth:1200,margin:"0 auto"}}>
          {/* 頁籤 */}
          <div style={{display:"flex",gap:8,marginBottom:24,borderBottom:"0.5px solid var(--bdr)",paddingBottom:12}}>
            {[["products","燈具產品"],["inventory","庫存管理"]].map(([id,lb])=>(
              <button key={id} onClick={()=>setAdminTab(id)} style={{padding:"8px 20px",border:"none",background:adminTab===id?"var(--blk)":"transparent",color:adminTab===id?"var(--ivory)":"var(--muted)",cursor:"pointer",fontFamily:"'Noto Sans TC',sans-serif",fontSize:11,letterSpacing:"2px",borderRadius:4}}>{lb}</button>
            ))}
          </div>

          {/* 燈具產品管理 */}
          {adminTab==="products"&&<>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontSize:13,color:"var(--muted)"}}>共 {products.length} 筆產品</div>
              <button onClick={()=>setEditProduct({})} style={{padding:"10px 24px",background:"var(--gold)",border:"none",cursor:"pointer",fontFamily:"'Noto Sans TC',sans-serif",fontSize:11,letterSpacing:"2px",fontWeight:600}}>＋ 新增燈具</button>
            </div>
            {/* 系列分組 */}
            {seriesList.map(s=>{
              const sp = products.filter(p=>p.series===s);
              if(sp.length===0) return(
                <div key={s} style={{marginBottom:8,display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:10,letterSpacing:"2px",color:"var(--muted)",minWidth:200}}>{s}</span>
                  <span style={{fontSize:10,color:"var(--bdr2)"}}>— 尚無產品</span>
                  <button onClick={()=>setEditProduct({series:s})} style={{padding:"3px 12px",background:"transparent",border:"0.5px solid var(--bdr)",cursor:"pointer",fontSize:9,letterSpacing:"1px",color:"var(--muted)",fontFamily:"'Noto Sans TC',sans-serif"}}>＋ 新增</button>
                </div>
              );
              return(
                <div key={s} style={{marginBottom:20}}>
                  <div style={{fontSize:10,letterSpacing:"3px",color:"var(--gold)",marginBottom:8,borderBottom:"0.5px solid var(--bdr2)",paddingBottom:6,display:"flex",justifyContent:"space-between"}}>
                    <span>{s} ({sp.length})</span>
                    <button onClick={()=>setEditProduct({series:s})} style={{padding:"3px 12px",background:"transparent",border:"0.5px solid var(--bdr)",cursor:"pointer",fontSize:9,letterSpacing:"1px",color:"var(--muted)",fontFamily:"'Noto Sans TC',sans-serif"}}>＋ 新增</button>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:10}}>
                    {sp.map(p=>(
                      <div key={p.id} style={{border:"0.5px solid var(--bdr)",borderRadius:6,padding:"12px 14px",display:"flex",gap:12,alignItems:"flex-start"}}>
                        {p.images?.[0]&&<img src={p.images[0]} alt="" style={{width:50,height:50,objectFit:"contain",background:"#f0ebe2",flexShrink:0}}/>}
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:500,marginBottom:3}}>{p.model}</div>
                          <div style={{fontSize:10,color:"var(--muted)",marginBottom:3}}>{p.category} · {p.watt}</div>
                          <div style={{fontSize:11,color:"var(--gold)"}}>NT$ {Number(p.stdPrice||0).toLocaleString()}</div>
                          <span style={{fontSize:9,padding:"2px 8px",background:p.status==="停產"?"#fdf0f0":p.status==="銷售中"?"#f0fdf4":"#fdf9f0",color:p.status==="停產"?"var(--red)":p.status==="銷售中"?"#2d6a4f":"#a07020",borderRadius:10,marginTop:4,display:"inline-block"}}>{p.status||"銷售中"}</span>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
                          <button onClick={()=>setEditProduct(p)} style={{padding:"5px 12px",background:"var(--blk)",color:"var(--ivory)",border:"none",cursor:"pointer",fontSize:10,letterSpacing:"1px",fontFamily:"'Noto Sans TC',sans-serif"}}>編輯</button>
                          <button onClick={()=>deleteProduct(p)} style={{padding:"5px 12px",background:"transparent",color:"var(--muted)",border:"0.5px solid var(--bdr)",cursor:"pointer",fontSize:10,fontFamily:"'Noto Sans TC',sans-serif"}}>刪除</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>}

          {/* 庫存管理 */}
          {adminTab==="inventory"&&<>
            <div style={{marginBottom:16,fontSize:13,color:"var(--muted)"}}>共 {inventory.length} 筆庫存</div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr style={{background:"var(--blk)",color:"var(--gold)"}}>
                  {["型號","系列","總庫存","已保留","可調貨","儲位","備註"].map(h=><th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:10,letterSpacing:"2px"}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {inventory.map((inv,i)=>(
                    <tr key={inv.id} style={{borderBottom:"0.5px solid var(--bdr2)",background:i%2===0?"transparent":"rgba(0,0,0,0.02)"}}>
                      <td style={{padding:"8px 12px",fontWeight:500}}>{inv.model}</td>
                      <td style={{padding:"8px 12px",color:"var(--muted)",fontSize:11}}>{inv.series}</td>
                      <td style={{padding:"8px 12px"}}>{inv.totalQty}</td>
                      <td style={{padding:"8px 12px",color:"var(--red)"}}>{inv.reservedQty}</td>
                      <td style={{padding:"8px 12px",color:Number(inv.availableQty)>0?"#2d6a4f":"var(--red)",fontWeight:600}}>{inv.availableQty}</td>
                      <td style={{padding:"8px 12px",fontSize:11,color:"var(--muted)"}}>{inv.location}</td>
                      <td style={{padding:"8px 12px",fontSize:11,color:"var(--muted)"}}>{inv.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>}
        </div>

        {/* 新增/編輯 Modal */}
        {editProduct!==null&&(
          <AdminProductEditor
            product={editProduct?.model?editProduct:null}
            onSave={saveProduct}
            onClose={()=>setEditProduct(null)}
            series_list={seriesList}
          />
        )}
        {productSaving&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:16,letterSpacing:"2px"}}>同步中...</div>}
      </div>
      </>
    );
  }



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
      {appLoading && (
  <div style={{
    position:"fixed",inset:0,background:"#0e0d0c",zIndex:9999,
    display:"flex",flexDirection:"column",alignItems:"center",
    justifyContent:"center",gap:24
  }}>
    <div style={{
      fontFamily:"'Cormorant Garamond',serif",fontSize:38,
      letterSpacing:10,color:"#b8935a",textTransform:"uppercase"
    }}>LEDOUX</div>
    <div style={{width:220,height:1,background:"linear-gradient(90deg,transparent,#b8935a,transparent)",animation:"shimmer 1.8s ease-in-out infinite"}}/>
    <div style={{fontSize:11,letterSpacing:4,color:"#6a5a4a",textTransform:"uppercase",textAlign:"center",lineHeight:2}}>
      正在為您同步最新燈具資訊<br/>
      <span style={{fontSize:9,color:"#3a3028"}}>Syncing latest products...</span>
    </div>
    <div style={{display:"flex",gap:6,marginTop:8}}>
      {[0,1,2].map(i=>(
        <div key={i} style={{
          width:6,height:6,borderRadius:"50%",background:"#b8935a",
          animation:`dotPulse 1.2s ease-in-out ${i*0.2}s infinite`
        }}/>
      ))}
    </div>
  </div>
)}
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
{[{id:"catalog",label:"產品目錄"},{id:"inquiry",label:"詢價單",badge:cartCount},{id:"sample",label:"借樣品",badge:sampCart.length},{id:"install",label:"安裝服務"},{id:"design",label:"照明設計服務"},{id:"visit",label:"預約到府介紹"}].map(n=>(
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
            </div>
          ))}
         <div className="sm-group-hd" onClick={()=>setLinearExp(v=>!v)}>
            <span style={{fontSize:"7px",letterSpacing:"4px",textTransform:"uppercase"}}>線型燈系列</span>
            <span className={`sm-group-arrow ${linearExp?"open":""}`}>›</span>
          </div>
          {linearExp&&LINEAR_SERIES_LIST.map(s=>(
            <div key={s} className={`sm-sub ${seriesF===s?"on":""}`} onClick={()=>{setSeriesF(s);setCat("全部");setPage("catalog");setMenuOpen(false);}}>
              <span className="sm-dot"/>{s}
            </div>
          ))}
          <div className="sm-divider"/>
          <div className="sm-group-hd" onClick={()=>setCatExp(v=>!v)}>
            <span style={{fontSize:"7px",letterSpacing:"4px",textTransform:"uppercase"}}>依分類</span>
            <span className={`sm-group-arrow ${catExp?"open":""}`}>›</span>
          </div>
         {catExp&&allCats.filter(c=>c&&c.trim()).map(c=>(
            <div key={c} className={`sm-sub ${!seriesF&&cat===c&&page==="catalog"?"on":""}`} onClick={()=>{setCat(c);setSeriesF(null);setPage("catalog");setMenuOpen(false);}}>
              <span className="sm-dot"/>{c}
            </div>
          ))}
          {isAdmin&&<>
            <div className="sm-divider"/>
            <div className="sm-sec">管理</div>
            <div className={`sm-sub ${page==="admin"?"on":""}`} onClick={()=>{setPage("admin");setMenuOpen(false);}}>
              <span className="sm-dot"/>產品管理
            </div>
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
<button className="btn-signout" onClick={()=>{setVisitOpen(true);loadVisitSlots();}} style={{borderColor:"rgba(184,147,90,.3)",color:"var(--gold)",background:"rgba(184,147,90,.08)"}}>預約到府介紹</button>
<button className="btn-signout" onClick={()=>setContactModal(true)} style={{borderColor:"rgba(184,147,90,.3)",color:"var(--gold)"}}>聯繫業務</button>
          <button className="btn-signout" onClick={()=>{setUser(null);setPage("catalog");}}>登出</button>
        </div>
      </nav>

      {/* 業務聯絡資訊 Modal */}
      {visitOpen&&<div className="modal-wrap" onClick={()=>setVisitOpen(false)}>
  <div className="modal-box" onClick={e=>e.stopPropagation()} style={{maxWidth:520}}>
    <div className="modal-head">
      <div className="modal-title">預約到府產品介紹</div>
      <button className="close-btn" onClick={()=>setVisitOpen(false)}><CloseIcon/></button>
    </div>
    <div className="modal-body">
      <div style={{background:"#f4efe8",borderLeft:"2px solid var(--gold)",padding:"10px 14px",marginBottom:18,fontSize:11,color:"var(--muted)",lineHeight:1.8}}>
        業務攜帶實體樣品親赴您的現場，針對空間進行一對一照明建議。
      </div>
      <button className="btn-primary" onClick={()=>{setVisitOpen(false);setPage("visit");}}>前往預約頁面</button>
      <div style={{textAlign:"center",marginTop:12,fontSize:10,color:"var(--muted)"}}>或直接致電業務：{CONTACT_PHONE}</div>
    </div>
  </div>
</div>}
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
              <div className="psub">{searchQ?`${searchQ} — ${filtered.length} 件`:isVip?"顯示標準牌價":"顯示標準售價"}</div>
            </div>
            <div style={{display:"flex",gap:12,alignItems:"center"}}>
              {(seriesF||searchQ||activeTags.length>0)&&<button className="btn-cancel-sm" onClick={clearTags}>清除篩選</button>}
              <span style={{fontSize:10,color:"var(--muted)",letterSpacing:2}}>{filtered.length} 件</span>
            </div>
          </div>
          {/* ✅ 設計公司橫幅 */}
          <ProjBanner onContact={()=>setContactModal(true)}/>
          {!seriesF&&!searchQ&&(<div className="catbar">{["全部",...allCats.filter(c=>c&&c.trim()).filter((c,i,a)=>!(c==="軟條燈"&&a.includes("鋁條燈")))].map(c=>{const label=c==="磁吸系統"?"磁吸軌道":c==="鋁條燈"?"鋁條燈／軟條燈":c;return(<button key={c} className={"catbtn"+(cat===c?" on":"")} onClick={()=>{setCat(c);setActiveTags([]);}}>{label}</button>);})}</div>)}
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
              <div key={p.id} className="pcard" onClick={()=>{if(!isEditing){setSelProd(p);setSelSpec({beam:"",color:"",cct:"",outerColor:"",innerColor:"",customCct:"",customColor:"",addon:[]});}}}>
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
<div style={{display:"flex",gap:8,flexWrap:"wrap",margin:"10px 0 16px",alignItems:"center"}}>
  <span style={{fontSize:9,letterSpacing:2,color:"var(--muted)",textTransform:"uppercase"}}>篩選</span>
  <select value={invCct} onChange={e=>setInvCct(e.target.value)} style={{padding:"5px 10px",border:"0.5px solid var(--bdr)",background:"transparent",fontFamily:"'Noto Sans TC',sans-serif",fontSize:11,color:"var(--blk)",outline:"none"}}>
    <option value="全部">全部色溫</option>
    {[...new Set(inventory.map(i=>i.cct).filter(Boolean))].map(c=><option key={c} value={c}>{c}</option>)}
  </select>
  <select value={invColor} onChange={e=>setInvColor(e.target.value)} style={{padding:"5px 10px",border:"0.5px solid var(--bdr)",background:"transparent",fontFamily:"'Noto Sans TC',sans-serif",fontSize:11,color:"var(--blk)",outline:"none"}}>
    <option value="全部">全部顏色</option>
    {[...new Set(inventory.map(i=>i.color).filter(Boolean))].map(c=><option key={c} value={c}>{c}</option>)}
  </select>
  <select value={invBeam} onChange={e=>setInvBeam(e.target.value)} style={{padding:"5px 10px",border:"0.5px solid var(--bdr)",background:"transparent",fontFamily:"'Noto Sans TC',sans-serif",fontSize:11,color:"var(--blk)",outline:"none"}}>
    <option value="全部">全部光束角</option>
    {[...new Set(inventory.map(i=>i.beam).filter(Boolean))].map(c=><option key={c} value={c}>{c}</option>)}
  </select>
  {(invCct!=="全部"||invColor!=="全部"||invBeam!=="全部")&&<button onClick={()=>{setInvCct("全部");setInvColor("全部");setInvBeam("全部");}} style={{padding:"5px 12px",border:"0.5px solid var(--bdr)",background:"transparent",fontFamily:"'Noto Sans TC',sans-serif",fontSize:10,color:"var(--muted)",cursor:"pointer"}}>清除篩選</button>}
</div>
          <div className="inv-grid">
  {[...new Set(filteredInv.map(i=>i.model))].map(model=>{
    const items=filteredInv.filter(i=>i.model===model);
    const first=items[0];
    const ccts=[...new Set(items.map(i=>i.cct).filter(Boolean))];
    const colors=[...new Set(items.map(i=>i.outerColor||i.color).filter(Boolean))];
    const beams=[...new Set(items.map(i=>i.beam).filter(Boolean))];
    const totalAvail=items.reduce((s,i)=>s+Number(i.availableQty||0),0);
    const st=totalAvail<=0?"out":totalAvail<=5?"low":"in-stock";
    const stLabel=totalAvail<=0?"無庫存":totalAvail<=5?"庫存偏低":"現貨供應";
    return(
      <div key={model} className="inv-card">
        <div className="inv-card-top">
          <div><div className="inv-card-model">{model}</div><div className="inv-card-series">{first.series}</div></div>
          <span className={`inv-status ${st}`}>{stLabel}</span>
        </div>
        <div className="inv-specs">{first.watt&&<span className="inv-spec-tag">{first.watt}</span>}</div>
        {ccts.length>0&&<div style={{marginBottom:8}}>
          <div style={{fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:4}}>色溫</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {ccts.map(c=>{const qty=items.filter(i=>i.cct===c).reduce((s,i)=>s+Number(i.availableQty||0),0);return(<span key={c} style={{padding:"3px 9px",border:"0.5px solid",fontSize:11,borderColor:qty>0?"var(--gold)":"var(--bdr)",color:qty>0?"var(--blk)":"var(--muted)",background:"transparent"}}>{c} <span style={{fontSize:10,color:qty>0?"var(--green)":"var(--red)"}}>({qty})</span></span>);})}
          </div>
        </div>}
        {beams.length>0&&<div style={{marginBottom:8}}>
          <div style={{fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:4}}>光束角</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {beams.map(b=>{const qty=items.filter(i=>i.beam===b).reduce((s,i)=>s+Number(i.availableQty||0),0);return(<span key={b} style={{padding:"3px 9px",border:"0.5px solid",fontSize:11,borderColor:qty>0?"var(--gold)":"var(--bdr)",color:qty>0?"var(--blk)":"var(--muted)"}}>{b} <span style={{fontSize:10,color:qty>0?"var(--green)":"var(--red)"}}>({qty})</span></span>);})}
          </div>
        </div>}
        {colors.length>0&&<div style={{marginBottom:8}}>
          <div style={{fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:4}}>外框顏色</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {colors.map(c=>{const qty=items.filter(i=>(i.outerColor||i.color)===c).reduce((s,i)=>s+Number(i.availableQty||0),0);return(<span key={c} style={{padding:"3px 9px",border:"0.5px solid",fontSize:11,borderColor:qty>0?"var(--gold)":"var(--bdr)",color:qty>0?"var(--blk)":"var(--muted)"}}>{c} <span style={{fontSize:10,color:qty>0?"var(--green)":"var(--red)"}}>({qty})</span></span>);})}
          </div>
        </div>}
        <div className="inv-qty-row">
          <div className="inv-qty-cell"><div className="inv-qty-num">{items.reduce((s,i)=>s+Number(i.totalQty||0),0)}</div><div className="inv-qty-lbl">總庫存</div></div>
          <div className="inv-qty-cell"><div className="inv-qty-num">{items.reduce((s,i)=>s+Number(i.reservedQty||0),0)}</div><div className="inv-qty-lbl">已保留</div></div>
          <div className="inv-qty-cell"><div className={`inv-qty-num ${totalAvail>0?"avail":""}`}>{totalAvail}</div><div className="inv-qty-lbl">可調貨</div></div>
        </div>
        {first.note&&<div className="inv-note">{first.note}</div>}
        <div className="inv-card-footer">
          <div><div className="inv-location">儲位：{first.location||"—"}</div><div className="inv-updated">更新：{first.updatedAt}</div></div>
          <button className="btn-inv-cart" disabled={totalAvail<=0} onClick={()=>{const prod=products.find(p=>p.model===model);if(prod)addToCart(prod);else toast$(`${model} 已加入詢價單`);}}>加入詢價</button>
        </div>
      </div>
    );
  })}
  {filteredInv.length===0&&<div className="empty" style={{gridColumn:"1/-1"}}>此分類目前無現貨</div>}
</div>
          </>}

        {/* ══ 照明設計服務 ══ */}
{page==="visit"&&<>
  <div className="phead">
    <div>
      <div className="ptitle">預約到府產品介紹</div>
      <div className="psub">專人攜帶實體樣品親赴現場說明</div>
    </div>
  </div>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:1,background:"var(--bdr2)",border:"0.5px solid var(--bdr2)",marginBottom:28}}>
    {[
      ["🚗 到府服務","業務攜帶實體樣品親赴您的現場，針對您的空間一對一說明"],
      ["💡 專業選燈","根據您的空間條件、預算與風格，提供最適合的照明配置建議"],
      ["📐 現場評估","可同步進行安裝難度評估，提供更精準的工程報價"],
      ["⏱ 服務時間","每次約 60–90 分鐘，服務範圍：桃竹苗、雙北、宜蘭地區"]
    ].map(([t,d])=>(
      <div key={t} style={{background:"var(--ivory)",padding:"20px 22px"}}>
        <div style={{fontSize:14,fontWeight:500,marginBottom:6}}>{t}</div>
        <div style={{fontSize:11,color:"var(--muted)",lineHeight:1.8}}>{d}</div>
      </div>
    ))}
  </div>

  {visitDone ? (
    <div style={{textAlign:"center",padding:"60px 0",lineHeight:2.5}}>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,color:"var(--gold)"}}>✓</div>
      <div style={{fontSize:14,fontWeight:500,marginBottom:6}}>預約申請已送出</div>
      <div style={{fontSize:11,color:"var(--muted)"}}>業務將於 1 個工作日內電話確認，請保持電話暢通</div>
      <div style={{marginTop:8,fontSize:11,color:"var(--muted)"}}>預約日期：<strong>{visitDate}</strong> &nbsp;|&nbsp; 時段：<strong>{visitSlot}</strong></div>
      <button className="btn-outline" style={{marginTop:24}} onClick={()=>{setVisitDone(false);setVisitStep(1);setVisitDate("");setVisitSlot("");setVisitForm({name:"",company:"",phone:"",address:"",interestedSeries:[],interestedModel:"",note:""});}}>重新預約</button>
    </div>
  ) : (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:28,maxWidth:860}}>
      {/* 左：填寫資料 */}
      <div>
        <div style={{fontSize:"8px",letterSpacing:"4px",textTransform:"uppercase",color:"var(--muted)",marginBottom:16,paddingBottom:8,borderBottom:"0.5px solid var(--bdr2)"}}>Step 1 · 基本資料</div>
        {[["聯繫人","name","必填",false],["公司名稱","company","選填",false],["聯絡電話","phone","0912-345-678",false],["地址","address","施工或拜訪地址（選填）",false]].map(([l,k,ph])=>(
          <div key={k} className="lf">
            <label>{l}</label>
            <input value={visitForm[k]} onChange={e=>setVisitForm(p=>({...p,[k]:e.target.value}))} placeholder={ph}/>
          </div>
        ))}
        <div className="lf">
          <label>感興趣系列（可多選）</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:4}}>
            {["HEPBURN 赫本","DC48V 磁吸軌道","BLADE 帕雷德","EOS 奧斯","METIS 墨提斯","鋁條燈","戶外燈具","其他"].map(s=>{
              const on=visitForm.interestedSeries.includes(s);
              return(<button key={s} onClick={()=>setVisitForm(p=>({...p,interestedSeries:on?p.interestedSeries.filter(x=>x!==s):[...p.interestedSeries,s]}))}
                style={{padding:"4px 10px",border:`0.5px solid ${on?"var(--gold)":"var(--bdr)"}`,background:on?"#f4efe8":"transparent",color:on?"var(--gold)":"var(--muted)",fontFamily:"'Noto Sans TC',sans-serif",fontSize:9,letterSpacing:1,cursor:"pointer",transition:"all .15s"}}>{s}</button>);
            })}
          </div>
        </div>
        <div className="lf">
          <label>指定型號（選填）</label>
          <input value={visitForm.interestedModel} onChange={e=>setVisitForm(p=>({...p,interestedModel:e.target.value}))} placeholder="例：HB.D120、DC.TS0110-C"/>
        </div>
        <div className="lf">
          <label>備註</label>
          <input value={visitForm.note} onChange={e=>setVisitForm(p=>({...p,note:e.target.value}))} placeholder="空間類型、特殊需求等"/>
        </div>
      </div>

      {/* 右：選擇日期時段 */}
      <div>
        <div style={{fontSize:"8px",letterSpacing:"4px",textTransform:"uppercase",color:"var(--muted)",marginBottom:16,paddingBottom:8,borderBottom:"0.5px solid var(--bdr2)"}}>Step 2 · 選擇日期 ＆ 時段</div>
        <div className="lf">
          <label>偏好日期（僅限平日）</label>
          <input type="date" value={visitDate}
            min={new Date(Date.now()+86400000).toISOString().split("T")[0]}
            max={new Date(Date.now()+60*86400000).toISOString().split("T")[0]}
            onChange={e=>{
              if(!isWeekday(e.target.value)){toast$("請選擇平日（週一至週五）");return;}
              setVisitDate(e.target.value);setVisitSlot("");
            }}
            style={{width:"100%",padding:"9px 0",background:"transparent",border:"none",borderBottom:"0.5px solid var(--bdr)",fontFamily:"'Noto Sans TC',sans-serif",fontSize:13,outline:"none"}}
          />
          {visitDate && !isWeekday(visitDate) && <div style={{fontSize:10,color:"var(--red)",marginTop:4}}>請選擇平日（週一至週五）</div>}
        </div>
        {visitDate && isWeekday(visitDate) && (
          <div className="lf">
            <label>可用時段</label>
            {visitLoading ? (
              <div style={{fontSize:11,color:"var(--muted)",padding:"12px 0"}}>載入可用時段中...</div>
            ) : (
              <div>
                {(()=>{
                  const slots = visitSlots[visitDate] || ["10:00","14:00","16:00"];
                  if(slots.length===0) return <div style={{fontSize:11,color:"var(--red)",padding:"12px 0"}}>此日期暫無可用時段，請選擇其他日期</div>;
                  return(
                    <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:6}}>
                      {slots.map(s=>(
                        <button key={s} onClick={()=>setVisitSlot(s)}
                          style={{padding:"8px 16px",border:`0.5px solid ${visitSlot===s?"var(--gold)":"var(--bdr)"}`,background:visitSlot===s?"var(--gold)":"transparent",color:visitSlot===s?"var(--blk)":"var(--muted)",fontFamily:"'Noto Sans TC',sans-serif",fontSize:11,letterSpacing:1,cursor:"pointer",transition:"all .2s"}}>{s}</button>
                      ))}
                    </div>
                  );
                })()}
                <div style={{fontSize:10,color:"var(--muted)",marginTop:10,lineHeight:1.7}}>
                  ※ 實際時段以業務電話確認為準<br/>
                  ※ 服務範圍：桃竹苗、雙北、宜蘭
                </div>
              </div>
            )}
          </div>
        )}
        <div style={{marginTop:20,padding:"14px 16px",background:"#f4efe8",borderLeft:"2px solid var(--gold)",fontSize:11,color:"var(--muted)",lineHeight:1.8}}>
          <strong style={{color:"var(--blk)",display:"block",marginBottom:4}}>預約說明</strong>
          ・ 業務將於 1 個工作日內電話確認<br/>
          ・ 如需取消請提前 24 小時告知<br/>
          ・ 攜帶品項以申請系列之主力款式為主
        </div>
        <button className="btn-primary" style={{marginTop:16}} onClick={submitVisit}
          disabled={!visitForm.name||!visitForm.phone||!visitDate||!visitSlot||!isWeekday(visitDate)}>
          確認送出預約申請
        </button>
      </div>
    </div>
  )}
</>}
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
                {discountLabel&&<span style={{fontSize:"9px",color:"var(--gold)",letterSpacing:"2px",whiteSpace:"nowrap",border:"0.5px solid var(--gold)",padding:"3px 9px"}}>✓ 專案價</span>}
              </div>
              {/* ── 下單類型 ── */}
<div style={{marginBottom:14}}>
  <div style={{fontSize:"7px",letterSpacing:"3px",textTransform:"uppercase",color:"var(--muted)",marginBottom:8}}>下單類型</div>
  <div style={{display:"flex",gap:6}}>
    {[["stock","庫存品（快速出貨）"],["new","新品生產（約1個月）"]].map(([v,l])=>(
      <button key={v} onClick={()=>{setOrderType(v);if(v==="new"){setUrgentSupport(false);setUrgentRegion("");}}}
        style={{flex:1,padding:"9px 6px",border:"0.5px solid",fontFamily:"'Noto Sans TC',sans-serif",fontSize:"8px",letterSpacing:"1.5px",cursor:"pointer",transition:"all .2s",
          background:orderType===v?"var(--blk)":"transparent",borderColor:orderType===v?"var(--blk)":"var(--bdr)",color:orderType===v?"var(--ivory)":"var(--muted)"}}>
        {l}
      </button>
    ))}
  </div>
</div>
{orderType==="stock"&&(
  <div style={{border:"0.5px solid var(--gold)",padding:"12px 14px",marginBottom:14,background:"#fdf9f0"}}>
    <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",marginBottom:urgentSupport?10:0}}>
      <input type="checkbox" checked={urgentSupport} onChange={e=>{setUrgentSupport(e.target.checked);if(!e.target.checked)setUrgentRegion("");}}/>
      <span style={{fontSize:"9px",letterSpacing:"2px",color:"var(--gold)",fontWeight:700}}>⚡ 閃電緊急支援服務</span>
    </label>
    {urgentSupport&&<>
      <div style={{fontSize:10,color:"var(--muted)",lineHeight:1.7,marginBottom:10}}>
        台中以北 <strong>24 小時</strong>到貨 · 業務親送到場 · 現場技術諮詢<br/>
        <span style={{color:"var(--red)",fontSize:9}}>⚠ 安裝高度超過 4.5m 僅提供地面交貨，不提供登高施作。</span><br/>
        <span style={{fontSize:9}}>下單後請立即與業務聯繫，將有專員為您接洽。</span>
      </div>
      <div style={{fontSize:"7px",letterSpacing:"2px",color:"var(--muted)",marginBottom:6,textTransform:"uppercase"}}>選擇配送地區</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
        {URGENT_REGIONS.map(r=>(
          <button key={r.id} onClick={()=>setUrgentRegion(r.id)}
            style={{padding:"8px 6px",border:"0.5px solid",fontFamily:"'Noto Sans TC',sans-serif",fontSize:"8px",letterSpacing:"1px",cursor:"pointer",textAlign:"left",
              background:urgentRegion===r.id?"var(--blk)":"transparent",borderColor:urgentRegion===r.id?"var(--blk)":"var(--bdr)",color:urgentRegion===r.id?"var(--ivory)":"var(--muted)"}}>
            {r.label}<br/>
            <span style={{fontSize:9,opacity:.8}}>NT$ {r.fee.toLocaleString()}</span>
          </button>
        ))}
      </div>
    </>}
  </div>
)}
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
            <div style={{margin:"14px 0",display:"flex",flexDirection:"column",gap:10}}>
  {/* 光束角選擇 + 其他 */}
  {selProd.beam&&selProd.beam.includes("/")?(<div>
    <div style={{fontSize:10,letterSpacing:2,color:"var(--muted)",marginBottom:6}}>光束角</div>
    <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
      {selProd.beam.split("/").map(b=>b.trim()).map(b=>(<button key={b} onClick={()=>setSelSpec(s=>({...s,beam:b}))} style={{padding:"5px 12px",border:"0.5px solid",fontSize:12,cursor:"pointer",background:selSpec.beam===b?"var(--blk)":"transparent",color:selSpec.beam===b?"var(--ivory)":"var(--blk)",borderColor:selSpec.beam===b?"var(--blk)":"var(--bdr)"}}>{b}</button>))}
      <button onClick={()=>setSelSpec(s=>({...s,beam:"其他"}))} style={{padding:"5px 12px",border:"0.5px solid",fontSize:12,cursor:"pointer",background:selSpec.beam==="其他"?"var(--gold)":"transparent",color:selSpec.beam==="其他"?"var(--blk)":"var(--muted)",borderColor:selSpec.beam==="其他"?"var(--gold)":"var(--bdr)"}}>其他</button>
    </div>
    {selSpec.beam==="其他"&&<input placeholder="請輸入光束角，例：45°" value={selSpec.customBeam||""} onChange={e=>setSelSpec(s=>({...s,customBeam:e.target.value}))} style={{marginTop:6,width:"100%",padding:"7px 10px",border:"0.5px solid var(--gold)",background:"transparent",fontFamily:"'Noto Sans TC',sans-serif",fontSize:12,outline:"none",color:"var(--blk)"}}/>}
  </div>):null}

  {/* 顏色選擇：外框色 + 內框色（若產品有色選項） */}
  {selProd.color&&selProd.color.includes("/")?(<div>
    <div style={{fontSize:10,letterSpacing:2,color:"var(--muted)",marginBottom:6}}>燈體顏色</div>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {/* 外框顏色 */}
      <div>
        <div style={{fontSize:9,letterSpacing:1,color:"var(--muted)",marginBottom:4}}>外框色</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          {selProd.color.split("/").map(c=>c.trim()).map(c=>(<button key={c} onClick={()=>setSelSpec(s=>({...s,outerColor:c,color:c}))} style={{padding:"5px 12px",border:"0.5px solid",fontSize:12,cursor:"pointer",background:selSpec.outerColor===c?"var(--blk)":"transparent",color:selSpec.outerColor===c?"var(--ivory)":"var(--blk)",borderColor:selSpec.outerColor===c?"var(--blk)":"var(--bdr)"}}>{c}</button>))}
          <button onClick={()=>setSelSpec(s=>({...s,outerColor:"其他"}))} style={{padding:"5px 12px",border:"0.5px solid",fontSize:12,cursor:"pointer",background:selSpec.outerColor==="其他"?"var(--gold)":"transparent",color:selSpec.outerColor==="其他"?"var(--blk)":"var(--muted)",borderColor:selSpec.outerColor==="其他"?"var(--gold)":"var(--bdr)"}}>其他</button>
        </div>
        {selSpec.outerColor==="其他"&&<input placeholder="請輸入外框顏色，例：香檳金" value={selSpec.customColor||""} onChange={e=>setSelSpec(s=>({...s,customColor:e.target.value}))} style={{marginTop:6,width:"100%",padding:"7px 10px",border:"0.5px solid var(--gold)",background:"transparent",fontFamily:"'Noto Sans TC',sans-serif",fontSize:12,outline:"none",color:"var(--blk)"}}/>}
      </div>
      {/* 內框顏色（選填） */}
      <div>
        <div style={{fontSize:9,letterSpacing:1,color:"var(--muted)",marginBottom:4}}>內框色 <span style={{fontSize:8,color:"var(--muted)"}}>(選填)</span></div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          {selProd.color.split("/").map(c=>c.trim()).map(c=>(<button key={c} onClick={()=>setSelSpec(s=>({...s,innerColor:selSpec.innerColor===c?"":c}))} style={{padding:"5px 12px",border:"0.5px solid",fontSize:12,cursor:"pointer",background:selSpec.innerColor===c?"var(--blk)":"transparent",color:selSpec.innerColor===c?"var(--ivory)":"var(--blk)",borderColor:selSpec.innerColor===c?"var(--blk)":"var(--bdr)"}}>{c}</button>))}
          <button onClick={()=>setSelSpec(s=>({...s,innerColor:"其他"}))} style={{padding:"5px 12px",border:"0.5px solid",fontSize:12,cursor:"pointer",background:selSpec.innerColor==="其他"?"var(--gold)":"transparent",color:selSpec.innerColor==="其他"?"var(--blk)":"var(--muted)",borderColor:selSpec.innerColor==="其他"?"var(--gold)":"var(--bdr)"}}>其他</button>
          <button onClick={()=>setSelSpec(s=>({...s,innerColor:""}))} style={{padding:"5px 12px",border:"0.5px solid var(--bdr2)",fontSize:11,cursor:"pointer",background:"transparent",color:"var(--muted)"}}>不指定</button>
        </div>
        {selSpec.innerColor==="其他"&&<input placeholder="請輸入內框顏色，例：香檳金" value={selSpec.customInnerColor||""} onChange={e=>setSelSpec(s=>({...s,customInnerColor:e.target.value}))} style={{marginTop:6,width:"100%",padding:"7px 10px",border:"0.5px solid var(--gold)",background:"transparent",fontFamily:"'Noto Sans TC',sans-serif",fontSize:12,outline:"none",color:"var(--blk)"}}/>}
      </div>
    </div>
  </div>):null}

  {/* 色溫選擇 + 其他 */}
  {selProd.cct&&(selProd.cct.includes("/")||selProd.cct==="色溫可生產")?(<div>
    <div style={{fontSize:10,letterSpacing:2,color:"var(--muted)",marginBottom:6}}>色溫</div>
    <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
      {selProd.cct==="色溫可生產"
        ?["2700K","3000K","3500K","4000K","5000K","6500K"].map(c=>(<button key={c} onClick={()=>setSelSpec(s=>({...s,cct:c}))} style={{padding:"5px 12px",border:"0.5px solid",fontSize:12,cursor:"pointer",background:selSpec.cct===c?"var(--blk)":"transparent",color:selSpec.cct===c?"var(--ivory)":"var(--blk)",borderColor:selSpec.cct===c?"var(--blk)":"var(--bdr)"}}>{c}</button>))
        :selProd.cct.split("/").map(c=>c.trim()).map(c=>(<button key={c} onClick={()=>setSelSpec(s=>({...s,cct:c}))} style={{padding:"5px 12px",border:"0.5px solid",fontSize:12,cursor:"pointer",background:selSpec.cct===c?"var(--blk)":"transparent",color:selSpec.cct===c?"var(--ivory)":"var(--blk)",borderColor:selSpec.cct===c?"var(--blk)":"var(--bdr)"}}>{c}</button>))
      }
      <button onClick={()=>setSelSpec(s=>({...s,cct:"其他"}))} style={{padding:"5px 12px",border:"0.5px solid",fontSize:12,cursor:"pointer",background:selSpec.cct==="其他"?"var(--gold)":"transparent",color:selSpec.cct==="其他"?"var(--blk)":"var(--muted)",borderColor:selSpec.cct==="其他"?"var(--gold)":"var(--bdr)"}}>其他色溫</button>
    </div>
    {selSpec.cct==="其他"&&<input placeholder="請輸入色溫，例：3500K、Ra≥95" value={selSpec.customCct||""} onChange={e=>setSelSpec(s=>({...s,customCct:e.target.value}))} style={{marginTop:6,width:"100%",padding:"7px 10px",border:"0.5px solid var(--gold)",background:"transparent",fontFamily:"'Noto Sans TC',sans-serif",fontSize:12,outline:"none",color:"var(--blk)"}} maxLength={40}/>}
    <div style={{fontSize:9,color:"var(--muted)",marginTop:4,lineHeight:1.6}}>若需特殊色溫請選「其他色溫」填入，業務確認後回覆可行性</div>
  </div>):null}
</div>
            {addons.filter(a=>a.category==="全部"||a.category===selProd.category).length>0&&(
  <div style={{marginBottom:10}}>
    <div style={{fontSize:10,letterSpacing:2,color:"var(--muted)",marginBottom:6}}>配件加購</div>
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      {addons.filter(a=>a.category==="全部"||a.category===selProd.category).map(a=>{
        const isOn=selSpec.addon?.find(x=>x.id===a.id);
        return(
          <button key={a.id} onClick={()=>setSelSpec(s=>({...s,addon:isOn?s.addon.filter(x=>x.id!==a.id):[...(s.addon||[]),a]}))}
            style={{padding:"7px 12px",border:"0.5px solid",fontSize:11,cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",
              background:isOn?"var(--blk)":"transparent",borderColor:isOn?"var(--blk)":"var(--bdr)",color:isOn?"var(--ivory)":"var(--blk)"}}>
            <span>{a.name}{a.desc&&<span style={{fontSize:9,opacity:.7,marginLeft:6}}>{a.desc}</span>}</span>
            <span style={{fontSize:11,color:isOn?"var(--ivory)":"var(--gold)"}}>+NT$ {a.price.toLocaleString()}</span>
          </button>
        );
      })}
    </div>
  </div>
)}
<div className="price-block">

  {selSpec.addon?.length>0&&<div style={{fontSize:10,color:"var(--gold)",marginBottom:4}}>
  配件：{selSpec.addon.map(a=>a.name).join("、")} ＋NT$ {selSpec.addon.reduce((s,a)=>s+a.price,0).toLocaleString()}
</div>}
              <div className="pb-label">{isVip?"專案價":"售價"}</div>
              {isVip?<div className="pb-val gold">NT$ {selProd.projPrice?.toLocaleString()}</div>:(selProd.stdPrice>0?<div className="pb-val">NT$ {selProd.stdPrice?.toLocaleString()}</div>:<div className="pb-nq">請洽業務專員報價</div>)}
            </div>
            <div className="drawer-actions">
              <button className={`btn-cart ${isVip?"vip":""}`} onClick={()=>addToCart(selProd, selSpec)}>加入詢價單</button>
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
          {cart.length===0?<div className="empty" style={{paddingTop:48}}>尚未加入任何產品</div>:cart.map(item=>{const price=Number(isVip?item.product.projPrice:item.product.stdPrice)||0;
            const sp=item.spec||{};
            const cctDisplay=sp.cct==="其他"?(sp.customCct||"特殊色溫"):sp.cct;
            const beamDisplay=sp.beam==="其他"?(sp.customBeam||"特殊角度"):sp.beam;
            const outerDisplay=sp.outerColor==="其他"?(sp.customColor||"特殊顏色"):sp.outerColor;
            const innerDisplay=sp.innerColor&&sp.innerColor!=="其他"?sp.innerColor:sp.innerColor==="其他"?(sp.customInnerColor||"特殊內框"):"";
            const colorDisplay=[outerDisplay&&`外框:${outerDisplay}`,innerDisplay&&`內框:${innerDisplay}`].filter(Boolean).join(" / ")||sp.color;
            const specLine=[cctDisplay,beamDisplay,colorDisplay].filter(Boolean).join(" · ");
            return(<div key={item.product.id} className="ci-row"><div className="ci-img">{item.product.images?.[0]?<img src={item.product.images[0]} alt=""/>:<PlaceholderIcon/>}</div><div className="ci-info"><div className="ci-model">{item.product.model}</div><div className="ci-sub">{item.product.series} · {item.product.watt}</div>{specLine&&<div style={{fontSize:10,color:"var(--muted)",marginTop:2,lineHeight:1.5}}>{specLine}</div>}<div className="ci-qty"><button className="qty-btn" onClick={()=>updateQty(item.product.id,-1)}>−</button><span style={{minWidth:20,textAlign:"center"}}>{item.qty}</span><button className="qty-btn" onClick={()=>updateQty(item.product.id,1)}>+</button><span className="ci-price" style={{marginLeft:7}}>{price>0?`NT$ ${(price*item.qty).toLocaleString()}`:"—"}</span></div></div><button className="ci-del" onClick={()=>removeItem(item.product.id)}><CloseIcon/></button></div>);})}
        </div>
        {cart.length>0&&<div className="sp-foot">
          <div className="cart-total"><span className="cart-total-lbl">小計</span><span className="cart-total-val">NT$ {cartTotal.toLocaleString()}</span></div>
          {cartTotal<3000&&<div className="warn-ship">未滿 NT$3,000，運費由買方支付</div>}
          <div className="cp-project"><label>案名 *</label><input value={projName} onChange={e=>setProjName(e.target.value)} placeholder="請輸入案名"/></div>
          <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:10}}>
            <input style={{flex:1,padding:"6px 9px",border:"0.5px solid #e0dbd2",background:"transparent",fontFamily:"'Noto Sans TC',sans-serif",fontSize:11,outline:"none",color:"var(--muted)"}} placeholder="— — —" value={discountCode} onChange={e=>setDiscountCode(e.target.value)} onBlur={()=>applyDiscountCode(discountCode)} onKeyDown={e=>e.key==="Enter"&&applyDiscountCode(discountCode)} maxLength={8}/>
            {discountLabel&&<span style={{fontSize:"8px",color:"var(--gold)",border:"0.5px solid var(--gold)",padding:"2px 7px",whiteSpace:"nowrap"}}>✓ 專案價</span>}
            {discountLabel&&<div style={{fontSize:10,color:"#7a5a2a",background:"#fdf5e8",border:"0.5px solid var(--gold)",borderLeft:"2px solid var(--gold)",padding:"8px 10px",marginTop:6,lineHeight:1.8}}>⚠ 專案報價僅提供設計公司、建築師事務所自行接案使用。本報價不適用於標案、統包轉包或代購用途，如有上述需求請洽業務另行報價。</div>}
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
                <div className="region-grid">{INSTALL_REGIONS.map(r=>(<div key={r.id} className={`region-card ${instRegion===r.id?"on":""}`} onClick={()=>setInstRegion(r.id)}><div className="rc-label">{r.label}</div><div className="rc-km">{r.km}</div>
{r.areaNote && <div style={{fontSize:"10px",color:"#9a8a7a",marginTop:2,lineHeight:1.5}}>{r.areaNote}</div>}<div className="rc-fee">{r.travel===null?"另議":`NT$ ${r.travel.toLocaleString()}`}</div>{r.freeAt&&<div className="rc-free">{r.freeAt} 盞以上免收</div>}</div>))}</div>
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
          {(installChoice===true||installChoice===null)&&instRegion&&<button className="btn-pdf" style={{marginBottom:8}} onClick={()=>{setInstOpen(false);doActualDownload();}}>✓ 完成 · 下載燈具＋安裝整合報價單</button>}
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
