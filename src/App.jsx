// ═══════════════════════════════════════════
//  LEDOUX 諾科照明 報價系統 v3.0
//  訪客/管理員雙入口 + 照明設計服務 + 牌價化
// ═══════════════════════════════════════════
import { useState, useRef, useEffect } from "react";

// ╔══════════════════════════════════════════╗
// ║  【重要】填入你的 Apps Script 部署 URL   ║
// ║  空白 = 本地模式（不連雲端）             ║
// ╚══════════════════════════════════════════╝
const SHEET_URL = "https://script.google.com/macros/s/AKfycbzUt6rAkwrPbf0FsToBrkgq6Vq8hh70-QPQ_11yu9uVteFBYec7MZNzEuV6DfFvs_CezA/exec";

// ── 管理員帳號密碼 ──
const ADMIN_USERNAME = "xxx3903052";
const ADMIN_PASSWORD = "zzz3909086";

// ── 雲端 API 輔助函式 ──
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
    const res = await fetch(SHEET_URL, {
      method: "POST",
      body: JSON.stringify({ action, data }),
      headers: { "Content-Type": "application/json" }
    });
    return await res.json();
  } catch { return null; }
}

// ── 取整函式（進位到最近的5或10）──
function roundPrice(n) {
  const r = n % 10;
  if (r === 0) return n;
  if (r <= 5) return n - r + 5;
  return n - r + 10;
}

// ── 預設帳號（保留供參考，登入改用單一密碼）──
const INIT_MEMBERS = [
  { id:1, username:"xxx3903052", password:"zzz3909086", name:"管理員", position:"管理者", company:"Ledoux Taiwan", phone:"", email:"", taxId:"", role:"admin", status:"approved", approvedAt:"2026-04-18" },
];

// ── 安裝費率（牌價化）──
const INSTALL_BASE     = 350;  // 牌價 NT$350/盞
const INSTALL_MIN      = 2000; // 最低出勤費

// ── 全台分區車馬費 ──
const INSTALL_REGIONS = [
  { id:"core",     label:"桃園核心區",          areas:"八德、桃園、中壢、大溪、鶯歌",             km:"0–10 km",     travel:600,  freeAt:15  },
  { id:"outer",    label:"桃園外環區",          areas:"大園、觀音、新屋、龜山、蘆竹",             km:"11–25 km",    travel:1000, freeAt:25  },
  { id:"north",    label:"北台近郊區",          areas:"雙北全區、新竹縣市",                       km:"26–55 km",    travel:1800, freeAt:45  },
  { id:"yilan",    label:"宜蘭專區",            areas:"宜蘭縣全區（交通特殊性）",                km:"不論距離",     travel:2500, freeAt:60  },
  { id:"centralA", label:"中台灣 A 區",         areas:"苗栗、頭份、竹南、北台山區",               km:"56–90 km",    travel:2800, freeAt:80  },
  { id:"centralB", label:"中台灣 B 區",         areas:"台中、彰化、南投市區",                     km:"91–150 km",   travel:3800, freeAt:120 },
  { id:"southA",   label:"南台灣 A 區",         areas:"雲林、嘉義地區",                           km:"151–220 km",  travel:5000, freeAt:null },
  { id:"southB",   label:"南台灣 B 區 ／ 花東", areas:"台南、高雄、屏東、花蓮、台東",             km:"221 km 以上", travel:6500, freeAt:null },
  { id:"remote",   label:"離島 ／ 偏遠山區",   areas:"金門、馬祖、澎湖、南投深山",               km:"專案評估",     travel:null, freeAt:null },
];

// ── 天花板高度 ──
const CEILING_GROUPS = [
  { id:"std",   label:"3.0m 以下（標準）",     surcharge:0    },
  { id:"high",  label:"3.1m – 4.5m（挑高）",  surcharge:150  },
  { id:"vhigh", label:"4.5m 以上（安全紅線）", surcharge:null },
];

// ── 差旅條款 ──
const TRAVEL_STAY = {
  kmThreshold:150, lampThreshold:80, stayPerNight:2000, mealPerDay:500,
};

// ── 搜尋同義詞 ──
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

// ── 產品資料 ──
const INIT_PRODUCTS = [
  { id:1,  model:"HB.D110",     series:"HEPBURN",      category:"崁燈",    watt:"10W",    lumen:"680lm",   cct:"2700K/3000K/3500K/4000K", beam:"15°/24°/36°",     voltage:"220V",   cri:"Ra≥90", color:"白色/黑色",     cutout:"Ø95mm",  size:"Ø102×H114mm", install:"崁入式",    cert:"CE/3C", shipping:90,  stdPrice:980,  projPrice:790,  video:"", desc:"HEPBURN 系列經典崁燈，LUMINUS 光源，680lm，可選蜂窩網、布紋玻璃配件。",         images:["https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Light-HB.D110-White-300x300.png"], note:"可選配件：蜂窩網、布紋玻璃、條紋玻璃" },
  { id:2,  model:"HB.D115",     series:"HEPBURN",      category:"崁燈",    watt:"15W",    lumen:"1000lm",  cct:"2700K/3000K/3500K/4000K", beam:"15°/24°/36°",     voltage:"220V",   cri:"Ra≥90", color:"白色/黑色",     cutout:"Ø95mm",  size:"Ø102×H114mm", install:"崁入式",    cert:"CE/3C", shipping:90,  stdPrice:1180, projPrice:960,  video:"", desc:"HEPBURN 15W，1000lm，優雅比例與高效能光源完美結合。",                           images:[], note:"可選配件：蜂窩網" },
  { id:3,  model:"HB.D120",     series:"HEPBURN",      category:"崁燈",    watt:"20W",    lumen:"1732lm",  cct:"2700K/3000K/3500K/4000K", beam:"15°/24°/36°",     voltage:"220V",   cri:"Ra≥90", color:"白色/黑色",     cutout:"Ø95mm",  size:"Ø102×H132mm", install:"崁入式",    cert:"CE/3C", shipping:90,  stdPrice:1380, projPrice:1120, video:"", desc:"HEPBURN 20W，1732lm 高光通，適合精品店與藝廊重點照明。",                         images:["https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Light-HB.D120-White-300x300.png"], note:"可選配件：蜂窩網、布紋玻璃" },
  { id:4,  model:"HB.D130",     series:"HEPBURN",      category:"崁燈",    watt:"30W",    lumen:"2200lm",  cct:"2700K/3000K/3500K/4000K", beam:"15°/24°/36°",     voltage:"220V",   cri:"Ra≥90", color:"白色/黑色",     cutout:"Ø95mm",  size:"Ø102×H132mm", install:"崁入式",    cert:"CE/3C", shipping:100, stdPrice:1580, projPrice:1280, video:"", desc:"HEPBURN 旗艦 30W，2200lm，高挑空間與精品陳列首選。",                             images:["https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Light-HB.D130-240x300.jpg"], note:"" },
  { id:5,  model:"HB.D120-N",   series:"HEPBURN",      category:"崁燈",    watt:"20W",    lumen:"1732lm",  cct:"2700K/3000K/3500K/4000K", beam:"15°/24°/36°",     voltage:"220V",   cri:"Ra≥90", color:"白色/黑色",     cutout:"Ø98mm",  size:"Ø102×H132mm", install:"崁入式",    cert:"CE/3C", shipping:90,  stdPrice:1380, projPrice:1120, video:"", desc:"HEPBURN-N 20W，全系列最暢銷款，商業空間標準配置。",                               images:["https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Light-HB.D120-White-300x300.png"], note:"" },
  { id:6,  model:"HB.D130-N",   series:"HEPBURN",      category:"崁燈",    watt:"30W",    lumen:"2200lm",  cct:"2700K/3000K/3500K/4000K", beam:"15°/24°/36°",     voltage:"220V",   cri:"Ra≥90", color:"白色/黑色",     cutout:"Ø98mm",  size:"Ø102×H132mm", install:"崁入式",    cert:"CE/3C", shipping:100, stdPrice:1580, projPrice:1280, video:"", desc:"HEPBURN-N 30W，博物館與精品店最大功率款。",                                         images:["https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Light-HB.D130-240x300.jpg"], note:"" },
  { id:7,  model:"HB.D430",     series:"HEPBURN",      category:"崁燈",    watt:"30W",    lumen:"2200lm",  cct:"2700K/3000K/3500K/4000K", beam:"15°/24°/36°",     voltage:"220V",   cri:"Ra≥90", color:"白色/黑色/金色", cutout:"Ø70mm",  size:"Ø75×H114mm",  install:"崁入式",    cert:"CE/3C", shipping:120, stdPrice:2880, projPrice:2350, video:"", desc:"HEPBURN 小口徑旗艦 30W，最小開孔最大輸出。",                                       images:["https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Light-HB.D430-240x300.jpg"], note:"可選金色前框" },
  { id:8,  model:"HB.T130S",    series:"HEPBURN",      category:"軌道燈",  watt:"30W",    lumen:"2200lm",  cct:"2700K/3000K/3500K/4000K", beam:"15°/24°/36°",     voltage:"220V",   cri:"Ra≥90", color:"白色/黑色/金色", cutout:"—",      size:"Ø63×H160mm",  install:"三線軌道式",cert:"CE/3C", shipping:120, stdPrice:2480, projPrice:2020, video:"", desc:"HEPBURN 軌道旗艦，30W 2200lm，三線導軌，優雅外型強大性能。",                     images:["https://www.ledouxlight.com/wp-content/uploads/2023/01/Led-Track-Light-HB.T130S-300x300.png"], note:"可選蜂窩網、布紋玻璃" },
  { id:9,  model:"NDB0306-C",   series:"BLADE",        category:"崁燈",    watt:"6W",     lumen:"480lm",   cct:"3000K/4000K",             beam:"24°",             voltage:"220V",   cri:"Ra≥80", color:"白色/黑色",     cutout:"Ø75mm",  size:"Ø85×H30mm",   install:"崁入式",    cert:"CE",    shipping:75,  stdPrice:780,  projPrice:630,  video:"", desc:"BLADE 超薄系列 6W，燈身僅 30mm，天花板隱形光源首選。",                           images:["https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Light-NDB0306-C-240x300.jpg"], note:"" },
  { id:10, model:"NDB0309-C",   series:"BLADE",        category:"崁燈",    watt:"9W",     lumen:"720lm",   cct:"3000K/4000K",             beam:"24°",             voltage:"220V",   cri:"Ra≥80", color:"白色/黑色",     cutout:"Ø85mm",  size:"Ø95×H30mm",   install:"崁入式",    cert:"CE",    shipping:75,  stdPrice:920,  projPrice:750,  video:"", desc:"BLADE 9W，淨高受限空間的完美解決方案。",                                           images:["https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Light-NDB0309-C-240x300.jpg"], note:"" },
  { id:11, model:"DFB0206-C",   series:"METIS",        category:"崁燈",    watt:"6W",     lumen:"540lm",   cct:"3000K/4000K",             beam:"40°",             voltage:"220V",   cri:"Ra≥90", color:"白色/黑色",     cutout:"Ø75mm",  size:"Ø85×H75mm",   install:"崁入式",    cert:"CE",    shipping:75,  stdPrice:1100, projPrice:890,  video:"", desc:"METIS 系列純鋁鍛造散熱，廣角 40° 均勻照明，長壽命商業設計。",                   images:["https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Ceiling-Light-DFB0206-C-300x300.png"], note:"" },
  { id:12, model:"DFB0225-C",   series:"METIS",        category:"崁燈",    watt:"25W",    lumen:"2250lm",  cct:"3000K/4000K",             beam:"40°",             voltage:"220V",   cri:"Ra≥90", color:"白色/黑色",     cutout:"Ø175mm", size:"Ø190×H120mm", install:"崁入式",    cert:"CE",    shipping:100, stdPrice:2680, projPrice:2180, video:"", desc:"METIS 25W 大功率，2250lm 廣角，展示空間最佳選擇。",                               images:["https://www.ledouxlight.com/wp-content/uploads/2023/01/Led-Recessed-Ceiling-Light-DFB0225-C-1.png"], note:"" },
  { id:13, model:"TSU0506-C",   series:"EOS",          category:"軌道燈",  watt:"6W",     lumen:"480lm",   cct:"3000K/4000K",             beam:"24°",             voltage:"220V",   cri:"Ra≥80", color:"白色/黑色",     cutout:"—",      size:"Ø60×H140mm",  install:"軌道式",    cert:"CE",    shipping:75,  stdPrice:980,  projPrice:800,  video:"", desc:"EOS 系列入門款 6W，纖薄機身整合散熱模組，輕巧適用各場合。",                     images:["https://www.ledouxlight.com/wp-content/uploads/2022/05/LED-Track-Light-TSU0506-C-240x300.jpg"], note:"" },
  { id:14, model:"TSU0515-C",   series:"EOS",          category:"軌道燈",  watt:"15W",    lumen:"1350lm",  cct:"3000K/4000K",             beam:"24°",             voltage:"220V",   cri:"Ra≥80", color:"白色/黑色",     cutout:"—",      size:"Ø70×H180mm",  install:"軌道式",    cert:"CE",    shipping:90,  stdPrice:1380, projPrice:1120, video:"", desc:"EOS 15W，1350lm，精準投射，服飾與珠寶陳列專用。",                                 images:["https://www.ledouxlight.com/wp-content/uploads/2022/05/Led-Track-Light-TSU0515-White-240x300.jpg"], note:"" },
  { id:15, model:"TSU0823-C",   series:"EOS",          category:"軌道燈",  watt:"23W",    lumen:"2070lm",  cct:"3000K/4000K",             beam:"36°",             voltage:"220V",   cri:"Ra≥80", color:"白色/黑色",     cutout:"—",      size:"Ø80×H200mm",  install:"軌道式",    cert:"CE",    shipping:90,  stdPrice:1880, projPrice:1530, video:"", desc:"EOS 23W 大角度版，2070lm，空間氛圍渲染首選。",                                     images:["https://www.ledouxlight.com/wp-content/uploads/2023/01/EOS-LED-Track-Light-TSU0823-C-1.png"], note:"" },
  { id:16, model:"TSU0206-1",   series:"THEIA",        category:"軌道燈",  watt:"6W",     lumen:"480lm",   cct:"3000K/4000K",             beam:"24°",             voltage:"220V",   cri:"Ra≥80", color:"白色/黑色",     cutout:"—",      size:"Ø55×H130mm",  install:"軌道式",    cert:"CE",    shipping:75,  stdPrice:980,  projPrice:800,  video:"", desc:"THEIA 系列 6W，180° 可調仰角，靈活定向照明解決方案。",                           images:["https://www.ledouxlight.com/wp-content/uploads/2022/05/TSU0206-1-241x300.png"], note:"" },
  { id:17, model:"TSU0212-1",   series:"THEIA",        category:"軌道燈",  watt:"12W",    lumen:"1080lm",  cct:"3000K/4000K",             beam:"24°",             voltage:"220V",   cri:"Ra≥80", color:"白色/黑色",     cutout:"—",      size:"Ø65×H160mm",  install:"軌道式",    cert:"CE",    shipping:90,  stdPrice:1280, projPrice:1040, video:"", desc:"THEIA 12W，1080lm，精品零售空間標準配置。",                                       images:["https://www.ledouxlight.com/wp-content/uploads/2022/05/TSU0212-1-241x300.png"], note:"" },
  { id:18, model:"CSU0515-C",   series:"EOS",          category:"吸頂燈",  watt:"15W",    lumen:"1350lm",  cct:"3000K/4000K",             beam:"36°",             voltage:"220V",   cri:"Ra≥80", color:"白色/黑色",     cutout:"—",      size:"Ø120×H80mm",  install:"吸頂式",    cert:"CE",    shipping:90,  stdPrice:1580, projPrice:1290, video:"", desc:"EOS 吸頂款，無需開孔，1350lm 廣角照明。",                                         images:["https://www.ledouxlight.com/wp-content/uploads/2022/05/Surface-Mount-CSU0510-C-240x300.jpg"], note:"" },
  { id:19, model:"CSA0206-1",   series:"THEIA",        category:"吸頂燈",  watt:"6W",     lumen:"480lm",   cct:"3000K/4000K",             beam:"24°",             voltage:"220V",   cri:"Ra≥80", color:"白色/黑色",     cutout:"—",      size:"Ø70×H90mm",   install:"吸頂式",    cert:"CE",    shipping:75,  stdPrice:1080, projPrice:880,  video:"", desc:"THEIA 吸頂 6W，住宅走廊首選。",                                                   images:["https://www.ledouxlight.com/wp-content/uploads/2022/05/CSA0206-1-241x300.png"], note:"" },
  { id:20, model:"DC.TS0110-C", series:"48V MAGNETIC", category:"磁吸系統",watt:"10W",    lumen:"921lm",   cct:"2700K/3000K/3500K/4000K", beam:"15°/25°/36°",     voltage:"48V DC", cri:"Ra≥95", color:"砂白/砂黑/金色", cutout:"—",      size:"Ø40×H100mm",  install:"磁吸嵌入",  cert:"CE",    shipping:100, stdPrice:2380, projPrice:1940, video:"", desc:"48V 磁吸旗艦 10W，Honourtek 921lm，Ra≥95，無工具快速安裝。",                   images:["https://www.ledouxlight.com/wp-content/uploads/2022/05/48V-Led-Track-Light-DC.TS0110-C-241x300.jpg"], note:"" },
  { id:21, model:"DC.TS0120-C", series:"48V MAGNETIC", category:"磁吸系統",watt:"20W",    lumen:"1734lm",  cct:"2700K/3000K/3500K/4000K", beam:"15°/25°/36°",     voltage:"48V DC", cri:"Ra≥90", color:"砂白/砂黑/金色", cutout:"—",      size:"Ø63×H120mm",  install:"磁吸嵌入",  cert:"CE",    shipping:100, stdPrice:2980, projPrice:2430, video:"", desc:"20W 高輸出磁吸，1734lm，藝廊與精品空間專用。",                                   images:["https://www.ledouxlight.com/wp-content/uploads/2022/05/48V-Led-Track-Light-DC.TS0120-C-241x300.jpg"], note:"" },
  { id:22, model:"DC.TS0130-C", series:"48V MAGNETIC", category:"磁吸系統",watt:"30W",    lumen:"2251lm",  cct:"2700K/3000K/3500K/4000K", beam:"15°/25°/36°",     voltage:"48V DC", cri:"Ra≥90", color:"砂白/砂黑/金色", cutout:"—",      size:"Ø63×H160mm",  install:"磁吸嵌入",  cert:"CE",    shipping:120, stdPrice:3580, projPrice:2920, video:"", desc:"30W 旗艦磁吸，2251lm 極致輸出。",                                                 images:["https://www.ledouxlight.com/wp-content/uploads/2022/05/48V-Led-Track-Light-DC.TS0130-C-241x300.jpg"], note:"" },
  { id:23, model:"DC.TS0206-C", series:"48V MAGNETIC", category:"磁吸系統",watt:"6W",     lumen:"420lm",   cct:"2700K/3000K/3500K/4000K", beam:"15°/25°/36°",     voltage:"48V DC", cri:"Ra≥95", color:"砂白/砂黑",     cutout:"—",      size:"Ø35×H55mm",   install:"磁吸嵌入",  cert:"CE",    shipping:90,  stdPrice:1980, projPrice:1620, video:"", desc:"入門磁吸 6W，Ra≥95，420lm，系統彈性配置理想起點。",                             images:["https://www.ledouxlight.com/wp-content/uploads/2022/05/48V-Led-Track-Light-DC.TS0206-C--241x300.jpg"], note:"" },
  { id:24, model:"BSB0504-C",   series:"OUTDOOR",      category:"戶外燈",  watt:"4W",     lumen:"210lm",   cct:"2700K/3000K/3500K/4000K", beam:"12°/20°/30°/40°", voltage:"DC 24V", cri:"Ra≥90", color:"黑色",          cutout:"Ø45mm",  size:"Ø50×H92.7mm", install:"插地式",    cert:"IP67",  shipping:90,  stdPrice:1680, projPrice:1360, video:"", desc:"316L 不鏽鋼插地燈 4W，Bridgelux 210lm，景觀步道首選。",                         images:[], note:"DC24V 供電。" },
  { id:25, model:"BSB0508-C",   series:"OUTDOOR",      category:"戶外燈",  watt:"8W",     lumen:"508lm",   cct:"2700K/3000K/3500K/4000K", beam:"12°/20°/30°/40°", voltage:"DC 24V", cri:"Ra≥90", color:"黑色",          cutout:"Ø68mm",  size:"Ø75×H123mm",  install:"插地式",    cert:"IP67",  shipping:100, stdPrice:2180, projPrice:1780, video:"", desc:"316L 不鏽鋼大功率插地燈 8W，Bridgelux 508lm，適合商業廣場景觀。",               images:[], note:"DC24V 供電。" },
  { id:26, model:"ALA0011-A",   series:"LED STRIP",    category:"鋁條燈",  watt:"4.8W/m", lumen:"110lm/W", cct:"2700K/3000K/4000K/6500K", beam:"120°",            voltage:"DC 24V", cri:"Ra≥98", color:"透明",          cutout:"—",      size:"W8×H2mm/m",   install:"卡槽嵌入",  cert:"IP20",  shipping:75,  stdPrice:480,  projPrice:380,  video:"", desc:"高顯色 Ra≥98 鋁條燈，色容差 <3，精緻櫃體照明首選。",                           images:[], note:"⚠ 單條建議最長 2m；串聯最長 5.5m。需搭配 DC 24V 恒壓電源。" },
  { id:27, model:"ALA0011-P",   series:"LED STRIP",    category:"鋁條燈",  watt:"4.8W/m", lumen:"110lm/W", cct:"2700K/3000K/4000K/6500K", beam:"120°",            voltage:"DC 24V", cri:"Ra≥98", color:"透明",          cutout:"—",      size:"W10×H4.5mm/m",install:"卡槽嵌入",  cert:"IP67",  shipping:75,  stdPrice:580,  projPrice:460,  video:"", desc:"防水 IP67 版，實心矽膠擠出不翻轉，耐久性極強，適合潮濕環境。",               images:[], note:"⚠ 單條建議最長 2m；串聯最長 5.5m。" },
];

// ── 預設台灣現貨庫存 ──
const INIT_INVENTORY = [
  { id:"inv001", model:"HB.D110",     series:"HEPBURN",      category:"崁燈",    watt:"10W",    cct:"3000K",             color:"白色",     totalQty:24, reservedQty:4,  availableQty:20, location:"桃園倉 A-01", updatedAt:"2026-04-25", note:"" },
  { id:"inv002", model:"HB.D120",     series:"HEPBURN",      category:"崁燈",    watt:"20W",    cct:"3000K",             color:"白色",     totalQty:18, reservedQty:2,  availableQty:16, location:"桃園倉 A-02", updatedAt:"2026-04-25", note:"暢銷款" },
  { id:"inv003", model:"HB.D120",     series:"HEPBURN",      category:"崁燈",    watt:"20W",    cct:"3000K",             color:"黑色",     totalQty:12, reservedQty:0,  availableQty:12, location:"桃園倉 A-03", updatedAt:"2026-04-25", note:"" },
  { id:"inv004", model:"HB.D130",     series:"HEPBURN",      category:"崁燈",    watt:"30W",    cct:"3000K",             color:"白色",     totalQty:8,  reservedQty:3,  availableQty:5,  location:"桃園倉 A-04", updatedAt:"2026-04-25", note:"庫存偏低" },
  { id:"inv005", model:"HB.T130S",    series:"HEPBURN",      category:"軌道燈",  watt:"30W",    cct:"3000K",             color:"黑色",     totalQty:10, reservedQty:0,  availableQty:10, location:"桃園倉 B-01", updatedAt:"2026-04-25", note:"" },
  { id:"inv006", model:"NDB0306-C",   series:"BLADE",        category:"崁燈",    watt:"6W",     cct:"3000K/4000K",       color:"白色/黑色", totalQty:36, reservedQty:6,  availableQty:30, location:"桃園倉 A-05", updatedAt:"2026-04-26", note:"雙色皆有庫存" },
  { id:"inv007", model:"NDB0309-C",   series:"BLADE",        category:"崁燈",    watt:"9W",     cct:"3000K/4000K",       color:"白色/黑色", totalQty:24, reservedQty:4,  availableQty:20, location:"桃園倉 A-06", updatedAt:"2026-04-26", note:"" },
  { id:"inv008", model:"DFB0206-C",   series:"METIS",        category:"崁燈",    watt:"6W",     cct:"3000K",             color:"白色",     totalQty:20, reservedQty:0,  availableQty:20, location:"桃園倉 A-07", updatedAt:"2026-04-24", note:"" },
  { id:"inv009", model:"TSU0506-C",   series:"EOS",          category:"軌道燈",  watt:"6W",     cct:"3000K",             color:"白色/黑色", totalQty:16, reservedQty:0,  availableQty:16, location:"桃園倉 B-02", updatedAt:"2026-04-24", note:"" },
  { id:"inv010", model:"TSU0515-C",   series:"EOS",          category:"軌道燈",  watt:"15W",    cct:"3000K",             color:"白色",     totalQty:14, reservedQty:2,  availableQty:12, location:"桃園倉 B-03", updatedAt:"2026-04-26", note:"" },
  { id:"inv011", model:"DC.TS0110-C", series:"48V MAGNETIC", category:"磁吸系統",watt:"10W",    cct:"3000K/4000K",       color:"砂白/砂黑", totalQty:20, reservedQty:5,  availableQty:15, location:"桃園倉 C-01", updatedAt:"2026-04-25", note:"高需求款" },
  { id:"inv012", model:"DC.TS0120-C", series:"48V MAGNETIC", category:"磁吸系統",watt:"20W",    cct:"3000K",             color:"砂白",     totalQty:12, reservedQty:2,  availableQty:10, location:"桃園倉 C-02", updatedAt:"2026-04-25", note:"" },
  { id:"inv013", model:"DC.TS0206-C", series:"48V MAGNETIC", category:"磁吸系統",watt:"6W",     cct:"2700K/3000K/4000K", color:"砂白/砂黑", totalQty:0,  reservedQty:0,  availableQty:0,  location:"—",           updatedAt:"2026-04-20", note:"補貨中，預計 5 月初到貨" },
  { id:"inv014", model:"ALA0011-A",   series:"LED STRIP",    category:"鋁條燈",  watt:"4.8W/m", cct:"3000K",             color:"透明",     totalQty:200,reservedQty:30, availableQty:170,location:"桃園倉 D-01", updatedAt:"2026-04-27", note:"計量單位：公尺" },
  { id:"inv015", model:"ALA0011-P",   series:"LED STRIP",    category:"鋁條燈",  watt:"4.8W/m", cct:"3000K",             color:"透明",     totalQty:120,reservedQty:10, availableQty:110,location:"桃園倉 D-02", updatedAt:"2026-04-27", note:"防水版，計量單位：公尺" },
  { id:"inv016", model:"HB.D120-N",   series:"HEPBURN",      category:"崁燈",    watt:"20W",    cct:"3000K/4000K",       color:"白色/黑色", totalQty:30, reservedQty:8,  availableQty:22, location:"桃園倉 A-08", updatedAt:"2026-04-27", note:"全系列暢銷款" },
];

// ─────────────────────────────────────────────
//  CSS — Hermès-inspired 極簡高端風格（v2 擴充）
// ─────────────────────────────────────────────
const G = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Noto+Sans+TC:wght@200;300;400;500&display=swap');
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes spin{to{transform:rotate(360deg)}}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --ivory:#f7f4ef;--ivory2:#ece6dc;--blk:#0e0d0c;--blk2:#1c1a18;
  --gold:#b8935a;--gold2:#d4a96a;--muted:#8a8278;
  --bdr:#d8d0c4;--bdr2:#e8e2d8;--red:#9b3a3a;--green:#3a6b4a;
  --inv-green:#2d5a3d;--inv-green-light:#edf6f0;
}
body{background:var(--ivory);color:var(--blk);font-family:'Noto Sans TC',sans-serif;font-weight:300;-webkit-font-smoothing:antialiased;letter-spacing:.3px}

/* AUTH */
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
.auth-tabs{display:flex;border-bottom:0.5px solid var(--bdr);margin-bottom:32px}
.atab{flex:1;padding:12px;text-align:center;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);cursor:pointer;border-bottom:1px solid transparent;margin-bottom:-0.5px;transition:all .2s}
.atab.on{color:var(--blk);border-bottom-color:var(--gold)}
.lf{margin-bottom:20px}
.lf label{display:block;font-size:8px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:8px}
.lf input{width:100%;padding:11px 0;background:transparent;border:none;border-bottom:0.5px solid var(--bdr);color:var(--blk);font-family:'Noto Sans TC',sans-serif;font-size:13px;outline:none;transition:border-color .2s;border-radius:0}
.lf input:focus{border-bottom-color:var(--gold)}
.lf input::placeholder{color:var(--bdr)}
.ferr{font-size:10px;color:var(--red);margin-top:4px}
.req{color:var(--gold);margin-left:2px}
.r2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.sec-lbl{font-size:8px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);text-align:center;margin:22px 0 18px;position:relative}
.sec-lbl::before,.sec-lbl::after{content:'';position:absolute;top:50%;width:28%;height:0.5px;background:var(--bdr2)}
.sec-lbl::before{left:0}.sec-lbl::after{right:0}
.btn-primary{width:100%;padding:13px;background:var(--blk);border:none;color:var(--ivory);font-family:'Noto Sans TC',sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;cursor:pointer;transition:background .2s;margin-top:6px}
.btn-primary:hover{background:var(--blk2)}
.btn-primary:disabled{opacity:.4;cursor:not-allowed}
.auth-hint{font-size:10px;color:var(--muted);text-align:center;margin-top:18px;line-height:1.9}
.auth-err{font-size:10px;color:var(--red);text-align:center;margin-top:12px}
.first-notice{background:#f9f5ee;border:0.5px solid var(--gold);border-left:2px solid var(--gold);padding:11px 14px;margin-bottom:22px;font-size:11px;color:var(--gold);line-height:1.7}
.info-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--ivory);padding:24px}
.info-card{max-width:440px;width:100%;border:0.5px solid var(--bdr);padding:52px 44px;text-align:center}
.info-rule{width:24px;height:0.5px;background:var(--gold);margin:0 auto 18px}
.info-title{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:300;margin-bottom:5px}
.info-sub{font-size:8px;color:var(--gold);letter-spacing:4px;text-transform:uppercase;margin-bottom:22px}
.info-desc{font-size:12px;color:var(--muted);line-height:1.9;margin-bottom:22px}
.info-row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:0.5px solid var(--bdr2);font-size:12px}
.info-row span:first-child{color:var(--muted)}
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

/* 雲端同步指示燈 */
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
.sm-divider{height:0.5px;background:#1e1c18;margin:7px 22px}
.sm-foot{padding:14px 22px;border-top:0.5px solid #1e1c18}
.btn-sm-out{width:100%;padding:9px;background:transparent;border:0.5px solid #2a2520;color:#5a4a3a;font-family:'Noto Sans TC',sans-serif;font-size:8px;letter-spacing:4px;text-transform:uppercase;cursor:pointer;transition:all .2s}
.btn-sm-out:hover{border-color:#9b3a3a;color:#9b3a3a}
.content{flex:1;padding:48px;max-width:1400px;margin:0 auto;width:100%}
@media(max-width:768px){.content{padding:24px 16px}}
.phead{margin-bottom:36px;display:flex;align-items:flex-end;justify-content:space-between;border-bottom:0.5px solid var(--bdr2);padding-bottom:22px;flex-wrap:wrap;gap:12px}
.ptitle{font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:300;color:var(--blk);line-height:1;letter-spacing:.5px}
.psub{font-size:8px;letter-spacing:3px;color:var(--muted);text-transform:uppercase;margin-top:7px}
.catbar{display:flex;margin-bottom:32px;border-bottom:0.5px solid var(--bdr2);overflow-x:auto}
.catbtn{padding:10px 20px;background:transparent;border:none;border-bottom:1px solid transparent;color:var(--muted);font-family:'Noto Sans TC',sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;white-space:nowrap;margin-bottom:-0.5px;transition:all .2s}
.catbtn:hover{color:var(--blk)}
.catbtn.on{color:var(--blk);border-bottom-color:var(--gold)}
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
.pcard-model{font-size:15px;font-family:'Cormorant Garamond',serif;font-weight:400;color:var(--blk);margin-bottom:5px}
.pcard-desc{font-size:11px;color:var(--muted);line-height:1.7;margin-bottom:10px;flex:1}
.pcard-tags{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px}
.ptag{font-size:8px;padding:2px 7px;border:0.5px solid var(--bdr);color:var(--muted);letter-spacing:.5px}
.ptag.vtag{color:var(--gold);border-color:rgba(184,147,90,.4)}
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
.drawer-desc{font-size:12px;color:var(--muted);line-height:1.8;margin-bottom:16px}
.inv-badge-drawer{display:inline-flex;align-items:center;gap:6px;background:#edf6f0;border:0.5px solid #3a6b4a;padding:5px 12px;margin-bottom:14px;font-size:9px;color:#2d5a3d;letter-spacing:2px;text-transform:uppercase}
.inv-badge-dot{width:6px;height:6px;border-radius:50%;background:#3a6b4a;animation:pulse 2s infinite}
.spec-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:18px}
.spec-item{border:0.5px solid var(--bdr2);padding:8px 11px}
.spec-label{font-size:7px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:3px}
.spec-val{font-size:11px;color:var(--blk)}
.drawer-video{margin-bottom:16px;position:relative;padding-bottom:56.25%}
.drawer-video iframe{position:absolute;inset:0;width:100%;height:100%;border:none}
.drawer-note{background:#f4efe8;border-left:1px solid var(--gold);padding:9px 12px;font-size:11px;color:var(--muted);line-height:1.7;margin-bottom:16px}
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
.ci-model{font-family:'Cormorant Garamond',serif;font-size:14px;font-weight:400}
.ci-sub{font-size:9px;color:var(--muted);margin-top:1px}
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
.sp-notice{background:#f4efe8;border-left:1px solid var(--gold);padding:9px 12px;font-size:11px;color:var(--muted);line-height:1.7;margin-bottom:14px}
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
.inst-hint{background:#f4efe8;border-left:1px solid var(--gold);padding:9px 12px;font-size:11px;color:var(--muted);line-height:1.7;margin-bottom:16px}
.ip-sec-title{font-size:8px;letter-spacing:4px;text-transform:uppercase;color:var(--muted);margin-bottom:9px;padding-bottom:7px;border-bottom:0.5px solid var(--bdr2)}
.region-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:4px}
.region-card{border:0.5px solid var(--bdr2);padding:9px;cursor:pointer;transition:all .2s;position:relative}
.region-card:hover{border-color:var(--gold);background:#f9f5ee}
.region-card.on{border-color:var(--gold);background:#f4efe8}
.region-card.on::after{content:'—';position:absolute;top:5px;right:7px;color:var(--gold);font-size:10px;font-family:'Cormorant Garamond',serif}
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
.stay-notice{background:#1e1c18;padding:10px;margin-top:9px;font-size:10px;color:#8a7a6a;line-height:1.8;border-left:1px solid var(--gold)}
.stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--bdr2);border:0.5px solid var(--bdr2);margin-bottom:28px}
.stat-box{background:var(--ivory);padding:20px 22px}
.stat-num{font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:300}
.stat-lbl{font-size:8px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);margin-top:3px}
.tbl-wrap{border:0.5px solid var(--bdr2);overflow:auto;margin-bottom:18px}
table{width:100%;border-collapse:collapse;min-width:500px}
th{text-align:left;font-size:7px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);padding:9px 12px;border-bottom:0.5px solid var(--bdr2);background:#f4efe8;font-weight:400}
td{padding:10px 12px;border-bottom:0.5px solid var(--bdr2);font-size:11px}
tr:last-child td{border-bottom:none}
tr:hover td{background:#f7f2eb}
.rb{font-size:7px;padding:2px 7px;letter-spacing:2px;text-transform:uppercase;border:0.5px solid;display:inline-block}
.r-admin{color:#9b3a3a;border-color:rgba(155,58,58,.4)}
.r-vip{color:var(--gold);border-color:rgba(184,147,90,.4)}
.r-std{color:var(--muted);border-color:var(--bdr)}
.r-green{color:#3a6b4a;border-color:rgba(58,107,74,.4)}
.role-sel{background:transparent;border:0.5px solid var(--bdr);color:var(--blk);padding:3px 6px;font-size:10px;font-family:'Noto Sans TC',sans-serif;cursor:pointer}
.btn-ok{font-size:9px;padding:4px 9px;border:0.5px solid rgba(58,107,74,.5);background:transparent;color:var(--green);cursor:pointer;letter-spacing:1px;transition:all .2s}
.btn-ng{font-size:9px;padding:4px 9px;border:0.5px solid rgba(155,58,58,.5);background:transparent;color:var(--red);cursor:pointer;letter-spacing:1px;transition:all .2s}
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
.ac-card{background:#f4efe8;border:0.5px solid var(--bdr2);padding:12px;margin-bottom:18px}
.ac-name{font-size:13px;font-weight:400;margin-bottom:3px}
.ac-detail{font-size:11px;color:var(--muted);line-height:1.7}
.hint-box{background:#f4efe8;border-left:1px solid var(--gold);padding:9px 12px;font-size:11px;color:var(--muted);line-height:1.7;margin-bottom:14px}
.install-tbl{width:100%;border-collapse:collapse;margin-bottom:14px;font-size:11px}
.install-tbl th{background:#f4efe8;padding:7px 10px;text-align:left;font-size:7px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);border-bottom:0.5px solid var(--bdr2);font-weight:400}
.install-tbl td{padding:9px 10px;border-bottom:0.5px solid var(--bdr2);vertical-align:top}
.install-tbl tr:last-child td{border-bottom:none}
.toast{position:fixed;bottom:26px;right:26px;background:var(--blk);color:var(--ivory);padding:11px 18px;font-size:10px;letter-spacing:2px;z-index:999;border-left:1px solid var(--gold);pointer-events:none}

/* ── 庫存模組專屬樣式 ── */
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
.inv-location{font-size:9px;color:var(--muted);letter-spacing:.5px}
.inv-updated{font-size:9px;color:var(--muted)}
.btn-inv-cart{padding:6px 14px;background:var(--inv-green);border:none;color:#fff;font-family:'Noto Sans TC',sans-serif;font-size:8px;letter-spacing:2px;cursor:pointer;text-transform:uppercase;transition:background .2s}
.btn-inv-cart:hover{background:#2d5a3d}
.btn-inv-cart:disabled{opacity:.4;cursor:not-allowed;background:var(--muted)}
.inv-note{font-size:10px;color:var(--muted);background:#f4efe8;padding:6px 9px;border-left:2px solid var(--gold);line-height:1.6}

/* ── 管理員庫存管理 ── */
.inv-admin-tbl input[type=number]{width:70px;padding:4px 6px;border:0.5px solid var(--bdr);background:var(--ivory);font-family:'Noto Sans TC',sans-serif;font-size:12px;text-align:center;outline:none}
.inv-admin-tbl input[type=number]:focus{border-color:var(--gold)}
.btn-save-inv{font-size:8px;padding:4px 10px;border:0.5px solid rgba(58,107,74,.5);background:transparent;color:var(--green);cursor:pointer;letter-spacing:1px;white-space:nowrap}
.btn-save-inv:hover{background:#edf6f0}

/* ── 雲端設定頁面 ── */
.cloud-status{display:flex;align-items:center;gap:10px;padding:12px 16px;background:#f4efe8;border:0.5px solid var(--bdr2);margin-bottom:20px}
.cloud-url-inp{width:100%;padding:10px;border:0.5px solid var(--bdr);background:transparent;font-family:monospace;font-size:11px;outline:none;transition:border-color .2s;margin-bottom:10px}
.cloud-url-inp:focus{border-color:var(--gold)}
.cloud-step{display:flex;gap:14px;padding:14px 0;border-bottom:0.5px solid var(--bdr2)}
.cloud-step-num{font-family:'Cormorant Garamond',serif;font-size:22px;color:var(--gold);flex-shrink:0;line-height:1}
.cloud-step-body{flex:1}
.cloud-step-title{font-size:12px;font-weight:400;margin-bottom:4px}
.cloud-step-desc{font-size:11px;color:var(--muted);line-height:1.8}
.cloud-step-code{font-family:monospace;font-size:10px;background:#f0ebe2;padding:6px 10px;margin-top:6px;color:var(--blk);display:block}
`;

// ── SVG Icons ──
const BagIcon    = ({size=18}) => <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="6" width="13" height="10" rx="0.5"/><path d="M6 6V5a3 3 0 0 1 6 0v1"/></svg>;
const FlaskIcon  = ({size=18}) => <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 2h4M6.5 8.5 3.5 15.5h11l-3-7V2h-4v6.5z"/><circle cx="8" cy="12" r="0.7" fill="currentColor"/><circle cx="10.5" cy="13.5" r="0.5" fill="currentColor"/></svg>;
const ToolIcon   = ({size=18}) => <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3c.3 1.5-.7 3-2.2 3.5L6 13.5A1.4 1.4 0 0 1 4 11.5l7-7.5C12.5 3.5 13.8 2.7 15 3Z"/><circle cx="5" cy="13" r="1.2"/></svg>;
const SearchIcon = ({size=14}) => <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"><circle cx="6" cy="6" r="4.5"/><line x1="9.5" y1="9.5" x2="13" y2="13"/></svg>;
const CloseIcon  = ({size=12}) => <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"><line x1="1.5" y1="1.5" x2="10.5" y2="10.5"/><line x1="10.5" y1="1.5" x2="1.5" y2="10.5"/></svg>;
const BoxIcon    = ({size=18}) => <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2L2.5 5.5v7L9 16l6.5-3.5v-7L9 2z"/><line x1="9" y1="2" x2="9" y2="16"/><line x1="2.5" y1="5.5" x2="15.5" y2="5.5"/></svg>;
const CloudIcon  = ({size=16}) => <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"><path d="M12.5 10.5a3 3 0 0 0 0-6 3.1 3.1 0 0 0-.5.05A4 4 0 1 0 4 8.5h8.5z"/><line x1="8" y1="11" x2="8" y2="14"/><line x1="6" y1="13" x2="10" y2="13"/></svg>;
const PlaceholderIcon = () => <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="var(--bdr)" strokeWidth="0.5"><circle cx="22" cy="22" r="18"/><circle cx="22" cy="22" r="7"/><line x1="22" y1="4" x2="22" y2="15"/><line x1="22" y1="29" x2="22" y2="40"/><line x1="4" y1="22" x2="15" y2="22"/><line x1="29" y1="22" x2="40" y2="22"/></svg>;

// ── Helpers ──
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
function calcInstall(regionId, groups) {
  if (!regionId) return null;
  const reg = INSTALL_REGIONS.find(r=>r.id===regionId);
  if (!reg) return null;
  const totalQty = groups.reduce((s,g)=>s+Number(g.qty||0),0);
  let laborTotal=0, hasVHigh=false;
  for (const g of groups) {
    const cg=CEILING_GROUPS.find(c=>c.id===g.ceilingId), qty=Number(g.qty||0);
    if (!cg) continue;
    if (cg.surcharge===null){hasVHigh=true;continue;}
    laborTotal += (INSTALL_BASE+cg.surcharge)*qty;
  }
  laborTotal = Math.max(laborTotal, INSTALL_MIN);
  const travelFee = reg.travel===null ? null : (reg.freeAt&&totalQty>=reg.freeAt) ? 0 : reg.travel;
  const needStay  = reg.id==="southA"||reg.id==="southB"||reg.id==="remote"||totalQty>=TRAVEL_STAY.lampThreshold;
  return {totalQty,laborTotal,travelFee,hasVHigh,reg,needStay};
}

// ── Carousel ──
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

// ── PDF 產生器（雙區塊：燈具 + 安裝，取整）──
function generatePDF({cart,projectName,customer,installCalc}) {
  const today=new Date();
  const ds=`${today.getFullYear()}/${String(today.getMonth()+1).padStart(2,"0")}/${String(today.getDate()).padStart(2,"0")}`;
  const qn=`Q${today.getFullYear()}${String(today.getMonth()+1).padStart(2,"0")}${String(today.getDate()).padStart(2,"0")}-${String(Math.floor(Math.random()*999)+1).padStart(3,"0")}`;

  const lampSubtotal = cart.reduce((s,it)=>s+it.product.stdPrice*it.qty,0);
  const needShip = lampSubtotal<3000;
  const shipFee  = needShip?cart.reduce((s,it)=>s+(it.product.shipping||90)*it.qty,0):0;
  const instSubtotal = installCalc&&!installCalc.hasVHigh&&installCalc.travelFee!==null
    ? installCalc.laborTotal+(installCalc.travelFee||0) : 0;
  const rawTotal = lampSubtotal + shipFee + instSubtotal;
  const total    = roundPrice(rawTotal);

  const lampRows = cart.map((item,i)=>{
    const p=item.product.stdPrice;
    return `<tr><td>${i+1}</td><td><b>${item.product.model}</b><br><span style="font-size:10px;color:#666">${item.product.series}</span></td><td>${item.product.watt||""}</td><td>${item.product.beam||""}</td><td>${item.product.cct||""}</td><td>${item.product.voltage||""}</td><td style="text-align:center">${item.qty}</td><td style="text-align:right">NT$ ${p.toLocaleString()}</td><td style="text-align:right">NT$ ${(p*item.qty).toLocaleString()}</td></tr>`;
  }).join("");

  const instRows = instSubtotal>0 ? `
    <tr><td>1</td><td><b>燈具安裝工資</b><br><span style="font-size:10px;color:#666">${installCalc.totalQty} 盞 × NT$ ${INSTALL_BASE.toLocaleString()}</span></td><td style="text-align:center">${installCalc.totalQty}</td><td style="text-align:right">NT$ ${INSTALL_BASE.toLocaleString()}</td><td style="text-align:right">NT$ ${installCalc.laborTotal.toLocaleString()}</td></tr>
    ${installCalc.travelFee>0?`<tr><td>2</td><td><b>車馬費</b><br><span style="font-size:10px;color:#666">${installCalc.reg.label}</span></td><td style="text-align:center">1</td><td style="text-align:right">NT$ ${installCalc.travelFee.toLocaleString()}</td><td style="text-align:right">NT$ ${installCalc.travelFee.toLocaleString()}</td></tr>`:""}
  ` : "";

  const html=`<!DOCTYPE html><html lang="zh-TW"><head><meta charset="UTF-8"><title>報價單 ${qn}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Noto Sans TC","Microsoft JhengHei",sans-serif;font-size:12px;color:#111;padding:28px 36px}.hd{display:flex;justify-content:space-between;margin-bottom:18px;border-bottom:2px solid #111;padding-bottom:12px}.co-name{font-size:18px;font-weight:700;letter-spacing:2px}.co-sub{font-size:10px;color:#555;margin-top:2px}.doc-title{text-align:center;font-size:16px;font-weight:700;letter-spacing:4px;margin-bottom:14px}.meta{display:grid;grid-template-columns:1fr 1fr;border:1px solid #ccc;margin-bottom:14px}.mc{padding:7px 10px;border-bottom:1px solid #ccc;font-size:11px}.mc:nth-child(odd){border-right:1px solid #ccc}.ml{font-size:9px;color:#666;letter-spacing:1px}.mv{font-weight:500;margin-top:1px}.sec-hd{background:#f5f5f5;border-left:3px solid #111;padding:6px 10px;font-size:11px;font-weight:700;margin:14px 0 6px;letter-spacing:1px}table{width:100%;border-collapse:collapse;margin-bottom:8px;font-size:11px}th{background:#111;color:#fff;padding:5px 7px;text-align:left;font-size:9px}td{padding:5px 7px;border-bottom:1px solid #e8e8e8;vertical-align:top}tr:nth-child(even) td{background:#fafafa}.subtotal-row{background:#f9f5ee!important}.subtotal-row td{font-weight:600;color:#b8935a}.tot{display:flex;justify-content:flex-end;margin:12px 0}.tt{border:1px solid #ccc;min-width:240px}.tr{display:flex;justify-content:space-between;padding:6px 12px;border-bottom:1px solid #eee;font-size:11px}.tr.bold{font-weight:700;font-size:14px;background:#0e0d0c;color:#fff;padding:10px 12px}.price-note{background:#fdf8ee;border:1px solid #d4a96a;border-left:3px solid #b8935a;padding:10px 14px;margin-bottom:14px;font-size:10px;line-height:1.8;color:#6a5a3a}.notes{border:1px solid #ccc;padding:10px 12px;margin-bottom:12px;font-size:10px;line-height:2;color:#444}.sign{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:20px}.sb{border-top:1px solid #ccc;padding-top:6px;font-size:10px;color:#666}.footer{margin-top:14px;border-top:1px solid #ccc;padding-top:8px;font-size:9px;color:#999;text-align:center}</style></head><body>
<div class="hd"><div><div class="co-name">${COMPANY.name}</div><div class="co-sub">${COMPANY.eng}</div></div><div style="font-size:10px;color:#555;text-align:right">${COMPANY.email}</div></div>
<div class="doc-title">報　價　單</div>
<div class="meta"><div class="mc"><div class="ml">報價單號</div><div class="mv">${qn}</div></div><div class="mc"><div class="ml">報價日期</div><div class="mv">${ds}</div></div><div class="mc"><div class="ml">客戶公司</div><div class="mv">${customer.company||"—"}</div></div><div class="mc"><div class="ml">聯絡人</div><div class="mv">${customer.name||"—"}</div></div><div class="mc"><div class="ml">案名</div><div class="mv">${projectName}</div></div><div class="mc"><div class="ml">有效期限</div><div class="mv">${ds} 起 30 天</div></div></div>
<div class="price-note">⚠ 本表所列價格均為<strong>建議牌價</strong>，特定設計公司或專案採購，請聯繫業務獲取<strong>專屬折扣報價</strong>。</div>
<div class="sec-hd">一、燈具產品清單</div>
<table><thead><tr><th>#</th><th>型號／系列</th><th>瓦數</th><th>角度</th><th>色溫</th><th>電壓</th><th>數量</th><th>建議牌價</th><th>小計</th></tr></thead><tbody>${lampRows}<tr class="subtotal-row"><td colspan="7" style="text-align:right">燈具小計</td><td></td><td style="text-align:right">NT$ ${lampSubtotal.toLocaleString()}</td></tr>${needShip?`<tr><td colspan="7" style="text-align:right;color:#999">運費</td><td></td><td style="text-align:right">NT$ ${shipFee.toLocaleString()}</td></tr>`:""}</tbody></table>
${instSubtotal>0?`<div class="sec-hd">二、專業安裝服務</div><table><thead><tr><th>#</th><th>項目</th><th>數量</th><th>單價</th><th>小計</th></tr></thead><tbody>${instRows}<tr class="subtotal-row"><td colspan="3" style="text-align:right">安裝小計</td><td></td><td style="text-align:right">NT$ ${instSubtotal.toLocaleString()}</td></tr></tbody></table>`:""}
<div class="tot"><div class="tt"><div class="tr bold"><span>合計總價（已取整）</span><span>NT$ ${total.toLocaleString()}</span></div></div></div>
<div class="notes"><b>備　註：</b><br>A. 單筆未滿 NT$3,000，運費由買方自付。<br>B. 庫存不足時，生產交期約 4 週起。<br>C. 保固：室內 3 年、戶外 2 年（人為損壞不在保固範圍）。<br>D. 安裝最低出勤費 NT$2,000，4.5m 以上需鷹架，費用另計。<br>E. 有效期限 30 天，請於期限內回簽確認。</div>
<div class="sign"><div class="sb">業務代表簽章</div><div class="sb">客戶確認簽章</div><div class="sb">日期</div></div>
<div class="footer">${COMPANY.name} · 本報價單所列均為建議牌價，如需專案折扣請洽業務</div>
</body></html>`;
  const blob=new Blob([html],{type:"text/html;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=`報價單_${projectName}_${qn}.html`;a.click();
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════
//  主元件 App
// ═══════════════════════════════════════════
export default function App() {
  // ── 雲端同步 ──
  const [syncStatus, setSyncStatus] = useState("off"); // off | loading | ok
  const [sheetUrl,   setSheetUrl]   = useState(SHEET_URL);
  const [urlInput,   setUrlInput]   = useState(SHEET_URL);
  const [testResult, setTestResult] = useState("");

  // ── 核心資料 ──
  const [members,    setMembers]    = useState(INIT_MEMBERS);
  const [pending,    setPending]    = useState([]);
  const [products,   setProducts]   = useState(INIT_PRODUCTS);
  const [inventory,  setInventory]  = useState(INIT_INVENTORY);
  const [sampleReqs, setSampleReqs] = useState([]);
  const [installOrd, setInstallOrd] = useState([]);

  // ── 使用者 / 頁面狀態 ──
  const [user,       setUser]       = useState(null);
  const [waitInfo,   setWaitInfo]   = useState(null);
  const [autoAdmin,  setAutoAdmin]  = useState(null);
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
  const [checks,     setChecks]     = useState({c1:false,c2:false,c3:false,c4:false});
  const [approveT,   setApproveT]   = useState(null);
  const [approveF,   setApproveF]   = useState({username:"",password:"",role:"standard"});
  const [toast,      setToast]      = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authTab,    setAuthTab]    = useState("login");
  const [loginF,     setLoginF]     = useState({username:"",password:""});
  const [loginErr,   setLoginErr]   = useState("");
  const [regF,       setRegF]       = useState({name:"",position:"",company:"",taxId:"",phone:"",email:"",username:"",password:""});
  const [fe,         setFe]         = useState({});
  const [seriesExp,  setSeriesExp]  = useState(true);
  const [catExp,     setCatExp]     = useState(true);
  const [instRegion, setInstRegion] = useState("");
  const [instGroups, setInstGroups] = useState([{ceilingId:"std",qty:1}]);
  const [instNote,   setInstNote]   = useState("");
  const [instDone,   setInstDone]   = useState(false);
  const [newProd,    setNewProd]    = useState({model:"",series:"",category:"崁燈",watt:"",cct:"3000K/4000K",beam:"24°",voltage:"220V",cri:"Ra≥80",color:"白色",cutout:"",size:"",install:"崁入式",cert:"",shipping:"90",stdPrice:"",projPrice:"",video:"",desc:"",images:"",note:""});
  const [editInvItem,setEditInvItem]= useState(null); // 管理員庫存行內編輯
  const [newInv,     setNewInv]     = useState({model:"",series:"",category:"崁燈",watt:"",cct:"3000K",color:"白色",totalQty:0,reservedQty:0,availableQty:0,location:"",note:""});
  const [showAddInv, setShowAddInv] = useState(false);
  const blurRef = useRef(null);

  // ── 啟動時從雲端拉取資料 ──
  useEffect(() => {
    if (!sheetUrl) return;
    (async () => {
      setSyncStatus("loading");
      const [prods, invs] = await Promise.all([
        sheetGet("getProducts"),
        sheetGet("getInventory"),
      ]);
      if (prods && prods.length > 0) setProducts(prods);
      if (invs  && invs.length  > 0) setInventory(invs);
      setSyncStatus("ok");
    })();
  }, [sheetUrl]);

  // ── 雲端同步函式 ──
  const syncProducts = async (prods) => {
    if (!sheetUrl) return;
    setSyncStatus("loading");
    await sheetPost("saveProducts", prods);
    setSyncStatus("ok");
  };
  const syncInventory = async (inv) => {
    if (!sheetUrl) return;
    setSyncStatus("loading");
    await sheetPost("saveInventory", inv);
    setSyncStatus("ok");
  };
  const syncUpsertInv = async (item) => {
    if (!sheetUrl) return;
    setSyncStatus("loading");
    await sheetPost("upsertInventory", item);
    setSyncStatus("ok");
  };

  // ── 測試雲端連線 ──
  const testConnection = async () => {
    setTestResult("測試中...");
    try {
      const res = await fetch(`${urlInput}?action=ping`);
      const json = await res.json();
      setTestResult(json.success ? "✓ 連線成功：" + json.message : "✗ 連線失敗：" + json.error);
    } catch (e) {
      setTestResult("✗ 連線失敗：" + e.message);
    }
  };
  const applyUrl = () => {
    setSheetUrl(urlInput);
    toast$("雲端 URL 已更新，正在同步...");
  };
  const forceSyncAll = async () => {
    if (!urlInput) return;
    setSyncStatus("loading");
    toast$("全量同步中...");
    await Promise.all([
      sheetPost("saveProducts",  products),
      sheetPost("saveInventory", inventory),
    ]);
    setSyncStatus("ok");
    toast$("全量同步完成");
  };

  const toast$ = m => { setToast(m); setTimeout(()=>setToast(""),3000); };
  const isGuest = user?.role==="guest";
  const isAdmin = user?.role==="admin";
  const isVip   = user?.role==="vip"||isAdmin;
  const isFirst = members.length===0&&pending.length===0;

  // ── 訪客資料 Modal 狀態 ──
  const [guestModal, setGuestModal] = useState(false);
  const [guestInfo,  setGuestInfo]  = useState({company:"",contact:"",phone:""});
  const [guestErr,   setGuestErr]   = useState({});
  // ── 產品 inline 編輯（管理員直接在目錄頁點擊修改） ──
  const [inlineEdit, setInlineEdit] = useState(null);
  const [inlineData, setInlineData] = useState({});
  const cartCount = cart.reduce((s,i)=>s+i.qty,0);
  const cartTotal = cart.reduce((s,i)=>s+(isVip?i.product.projPrice:i.product.stdPrice)*i.qty,0);
  const allChecked = Object.values(checks).every(Boolean);
  const allSeries  = [...new Set(products.map(p=>p.series))];
  const allCats    = [...new Set(products.map(p=>p.category))];
  const allInvCats = ["全部",...new Set(inventory.map(i=>i.category))];

  const filtered = (() => {
    let ps = searchQ.trim() ? searchProducts(products, searchQ) : products;
    if (seriesF) ps = ps.filter(p=>p.series===seriesF);
    else if (cat!=="全部") ps = ps.filter(p=>p.category===cat);
    return ps;
  })();
  const filteredInv = invCat==="全部" ? inventory : inventory.filter(i=>i.category===invCat);
  const suggs = getSuggestions(products, searchQ);
  const instCalc = calcInstall(instRegion, instGroups);

  // 庫存統計
  const invTotalStock = inventory.reduce((s,i)=>s+Number(i.totalQty),0);
  const invAvailable  = inventory.reduce((s,i)=>s+Number(i.availableQty),0);
  const invSkuCount   = inventory.length;

  // 產品是否有台灣現貨
  const hasStock = (model) => inventory.some(i=>i.model===model && Number(i.availableQty)>0);

  const doSearch = q => {
    setSearchQ(q); if(q.trim()&&!searchHist.includes(q)) setSearchHist(h=>[q,...h].slice(0,8));
    setSearchFocus(false); setPage("catalog");
  };

  const doLogin = () => {
    if (loginF.username === ADMIN_USERNAME && loginF.password === ADMIN_PASSWORD) {
      setUser({ id:1, username:ADMIN_USERNAME, name:"管理員", position:"管理者", company:"Ledoux Taiwan", role:"admin" });
      setLoginErr("");
    } else {
      setLoginErr("帳號或密碼錯誤");
    }
  };

  // ── 照明設計配燈服務申請 ──
  const [designForm, setDesignForm] = useState({company:"",name:"",phone:"",project:""});
  const [designDone, setDesignDone] = useState(false);
  const submitDesignForm = async () => {
    if(!designForm.company||!designForm.name||!designForm.phone){toast$("請填寫必填欄位");return;}
    if(sheetUrl){
      await sheetPost("saveOrder",{
        id:"DESIGN"+Date.now(),
        date:new Date().toISOString().split("T")[0],
        customerName:designForm.name,
        company:designForm.company,
        projectName:designForm.project||"配燈服務申請",
        items:"照明設計配燈服務",
        subtotal:0,tax:0,shipping:0,total:0,isVip:"設計服務"
      });
    }
    setDesignDone(true);toast$("申請已送出，專員將盡快聯繫");
  };

  const addToCart = p => {
    setCart(c=>{const ex=c.find(i=>i.product.id===p.id);return ex?c.map(i=>i.product.id===p.id?{...i,qty:i.qty+1}:i):[...c,{product:p,qty:1}];});
    toast$(`${p.model} 已加入詢價單`);
  };
  const updateQty  = (id,d) => setCart(c=>c.map(i=>i.product.id===id?{...i,qty:Math.max(1,i.qty+d)}:i));
  const removeItem = id => setCart(c=>c.filter(i=>i.product.id!==id));
  const addToSamp  = p => {setSampCart(c=>c.find(i=>i.id===p.id)?c:[...c,p]);toast$(`${p.model} 已加入樣品清單`);};
  const removeSamp = id => setSampCart(c=>c.filter(i=>i.id!==id));
  const submitSamp = () => {
    if(!sampForm.name||!sampForm.phone){toast$("請填寫姓名和電話");return;}
    setSampleReqs(x=>[...x,{id:Date.now(),products:sampCart.map(p=>p.model),form:sampForm,date:new Date().toISOString().split("T")[0],status:"pending"}]);
    setSampDone(true);toast$("樣品申請已送出");
  };
  const submitInst = () => {
    if(!instCalc){toast$("請選擇安裝區域");return;}
    setInstallOrd(x=>[...x,{id:Date.now(),date:new Date().toISOString().split("T")[0],customer:{name:user.name,company:user.company},region:instRegion,groups:instGroups,note:instNote,calc:instCalc,status:"pending"}]);
    setInstDone(true);toast$("安裝申請已送出");
  };
  const resetInst = () => {setInstRegion("");setInstGroups([{ceilingId:"std",qty:1}]);setInstNote("");setInstDone(false);setInstOpen(false);};

  const doAddProd = () => {
    if(!newProd.model)return;
    const imgs=newProd.images?newProd.images.split("\n").map(s=>s.trim()).filter(Boolean):[];
    const newList=[...products,{...newProd,id:Date.now(),stdPrice:Number(newProd.stdPrice)||0,projPrice:Number(newProd.projPrice)||0,shipping:Number(newProd.shipping)||90,images:imgs}];
    setProducts(newList); syncProducts(newList);
    setShowAdd(false);toast$("產品已新增");
  };
  const startEdit = p => setEditProd({...p,images:(p.images||[]).join("\n")});
  const saveEdit  = () => {
    const imgs=editProd.images?String(editProd.images).split("\n").map(s=>s.trim()).filter(Boolean):[];
    const updated={...editProd,stdPrice:Number(editProd.stdPrice)||0,projPrice:Number(editProd.projPrice)||0,shipping:Number(editProd.shipping)||90,images:imgs};
    const newList=products.map(p=>p.id===updated.id?updated:p);
    setProducts(newList); syncProducts(newList);
    if(selProd?.id===editProd.id)setSelProd(updated);
    setEditProd(null);toast$("產品已更新");
  };

  // ── 庫存管理（管理員） ──
  const saveInvRow = async (item) => {
    const avail = Number(item.totalQty) - Number(item.reservedQty);
    const updated = {...item, availableQty: avail, updatedAt: new Date().toISOString().split("T")[0]};
    const newList = inventory.map(i=>i.id===updated.id?updated:i);
    setInventory(newList); setEditInvItem(null);
    await syncUpsertInv(updated);
    toast$(`${updated.model} 庫存已儲存`);
  };
  const deleteInvRow = async (id) => {
    const newList = inventory.filter(i=>i.id!==id);
    setInventory(newList); await syncInventory(newList); toast$("庫存項目已刪除");
  };
  const doAddInv = async () => {
    if(!newInv.model)return;
    const avail = Number(newInv.totalQty) - Number(newInv.reservedQty);
    const item={...newInv,id:"inv"+Date.now(),availableQty:avail,updatedAt:new Date().toISOString().split("T")[0]};
    const newList=[...inventory,item];
    setInventory(newList); await syncUpsertInv(item);
    setShowAddInv(false); setNewInv({model:"",series:"",category:"崁燈",watt:"",cct:"3000K",color:"白色",totalQty:0,reservedQty:0,availableQty:0,location:"",note:""});
    toast$("庫存項目已新增");
  };

  const handleGenPDF = () => {
    if(!projName.trim()){toast$("請先填寫案名");return;}
    if(!allChecked){toast$("請先勾選確認所有注意事項");return;}
    // 訪客必須先填公司資料
    if(isGuest){
      const errs={};
      if(!guestInfo.company.trim()) errs.company="必填";
      if(!guestInfo.contact.trim()) errs.contact="必填";
      if(!guestInfo.phone.trim())   errs.phone="必填";
      setGuestErr(errs);
      if(Object.keys(errs).length>0){setGuestModal(true);return;}
    }
    const customer = isGuest
      ? {company:guestInfo.company, name:guestInfo.contact, position:"", phone:guestInfo.phone}
      : {company:user.company, name:user.name, position:user.position};
    generatePDF({cart,projectName:projName,customer,installCalc:instRegion?instCalc:null});
    // 自動記錄到 Google Sheets
    if(sheetUrl){
      const orderData={
        id:"ORD"+Date.now(),
        date:new Date().toISOString().split("T")[0],
        customerName:customer.name,
        company:customer.company,
        projectName:projName,
        items:cart.map(i=>`${i.product.model}×${i.qty}`).join("、"),
        subtotal:cart.reduce((s,i)=>s+(isVip?i.product.projPrice:i.product.stdPrice)*i.qty,0),
        tax:Math.round(cart.reduce((s,i)=>s+(isVip?i.product.projPrice:i.product.stdPrice)*i.qty,0)*0.05),
        shipping:0,
        total:0,
        isVip:isVip?"是":"否"
      };
      sheetPost("saveOrder",orderData);
    }
    toast$("報價單已下載");
  };

  // ── 庫存狀態 ──
  const invStatusLabel = (item) => {
    if(Number(item.availableQty)<=0) return {cls:"out",label:"已售完"};
    if(Number(item.availableQty)<=5) return {cls:"low",label:"庫存偏低"};
    return {cls:"in-stock",label:"現貨供應"};
  };

  // ── 未登入：雙入口頁面 ──
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

          {/* 訪客入口 */}
          <div style={{marginBottom:28}}>
            <div style={{fontSize:"8px",letterSpacing:"4px",textTransform:"uppercase",color:"var(--muted)",marginBottom:14,paddingBottom:10,borderBottom:"0.5px solid var(--bdr2)"}}>訪客瀏覽</div>
            <div style={{fontSize:12,color:"var(--muted)",lineHeight:1.8,marginBottom:14}}>
              免帳號直接瀏覽產品目錄、選燈、產生報價單。<br/>
              下載報價單前需填寫公司基本資料。
            </div>
            <button className="btn-primary" onClick={()=>setUser({role:"guest",name:"訪客",company:"",position:"",username:"guest"})}>
              訪客瀏覽 · 免登入
            </button>
          </div>

          <div className="sec-lbl">管理員登入</div>

          {/* 管理員入口 */}
          <div className="lf">
            <label>帳號</label>
            <input value={loginF.username} onChange={e=>setLoginF(p=>({...p,username:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="請輸入帳號"/>
          </div>
          <div className="lf">
            <label>密碼</label>
            <input type="password" value={loginF.password} onChange={e=>setLoginF(p=>({...p,password:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="請輸入密碼"/>
          </div>
          <button className="btn-outline" style={{width:"100%",marginTop:6}} onClick={doLogin}>管理員登入</button>
          {loginErr&&<div className="auth-err">{loginErr}</div>}
        </div>
      </div>
    </div>
    </>
  );

  // ── 主畫面 ──
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
          {/* 台灣現貨庫存 — 特殊綠色項目 */}
          <div className={`sm-item inv ${page==="inventory"?"on":""}`} onClick={()=>{setPage("inventory");setMenuOpen(false);}}>
            <span>台灣現貨庫存</span>
            {inventory.filter(i=>Number(i.availableQty)>0).length>0&&<span className="sm-badge green">{inventory.filter(i=>Number(i.availableQty)>0).length}</span>}
          </div>
          <div className="sm-divider"/>
          <div className="sm-group-hd" onClick={()=>setSeriesExp(v=>!v)}>
            <span style={{fontSize:"7px",letterSpacing:"4px",textTransform:"uppercase"}}>依系列</span>
            <span className={`sm-group-arrow ${seriesExp?"open":""}`}>›</span>
          </div>
          {seriesExp&&allSeries.map(s=>(
            <div key={s} className={`sm-sub ${seriesF===s?"on":""}`} onClick={()=>{setSeriesF(s);setCat("全部");setPage("catalog");setMenuOpen(false);}}>
              <span className="sm-dot"/>{s}
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
          {user.role==="admin"&&<>
            <div className="sm-divider"/>
            <div className="sm-sec">管理</div>
            {[
              {id:"pending",      label:"待審核",   badge:pending.length},
              {id:"members",      label:"帳號管理"},
              {id:"products",     label:"產品管理"},
              {id:"inv_admin",    label:"庫存管理"},
              {id:"cloud_settings",label:"雲端設定"},
              {id:"sample_admin", label:"樣品申請", badge:sampleReqs.filter(r=>r.status==="pending").length},
              {id:"install_admin",label:"安裝申請", badge:installOrd.filter(o=>o.status==="pending").length},
            ].map(n=>(
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
          {/* 雲端同步指示燈 */}
          {sheetUrl&&<div style={{display:"flex",alignItems:"center",gap:5}}>
            <div className={`sync-dot ${syncStatus}`}/>
            <span className="sync-label">{syncStatus==="off"?"本地":syncStatus==="loading"?"同步中":"已同步"}</span>
          </div>}
        </div>
        <div className="tn-right">
          {/* 台灣現貨入口按鈕 */}
          <button className="tn-icon inv-icon" title="台灣現貨庫存" onClick={()=>{setPage("inventory");setCartOpen(false);setSampOpen(false);setInstOpen(false);}}>
            <BoxIcon/>{inventory.filter(i=>Number(i.availableQty)>0).length>0&&<span className="tn-ibadge green">{inventory.filter(i=>Number(i.availableQty)>0).length}</span>}
          </button>
          <button className="tn-icon" title="安裝服務" onClick={()=>{setInstOpen(v=>!v);setCartOpen(false);setSampOpen(false);}}>
            <ToolIcon/>{installOrd.filter(o=>o.status==="pending").length>0&&<span className="tn-ibadge red">{installOrd.filter(o=>o.status==="pending").length}</span>}
          </button>
          <button className="tn-icon" title="借樣品" onClick={()=>{setSampOpen(v=>!v);setCartOpen(false);setInstOpen(false);}}>
            <FlaskIcon/>{sampCart.length>0&&<span className="tn-ibadge red">{sampCart.length}</span>}
          </button>
          <button className="tn-icon" title="詢價單" onClick={()=>{setCartOpen(v=>!v);setSampOpen(false);setInstOpen(false);}}>
            <BagIcon/>{cartCount>0&&<span className="tn-ibadge">{cartCount}</span>}
          </button>
          <div className="tn-user-info"><div className="tn-uname">{user.name}</div><div className="tn-ucomp">{user.company}</div></div>
          <span className={`tn-badge ${user.role==="admin"?"tb-admin":user.role==="vip"?"tb-vip":"tb-std"}`}>{roleLabel(user.role)}</span>
          <button className="btn-signout" onClick={()=>{setUser(null);setPage("catalog");}}>登出</button>
        </div>
      </nav>

      {/* CONTENT */}
      <div className="content">

        {/* 產品目錄 */}
        {page==="catalog"&&<>
          <div className="phead">
            <div>
              <div className="ptitle">{seriesF?seriesF:searchQ?"搜索結果":"產品目錄"}</div>
              <div className="psub">{searchQ?`${searchQ} — ${filtered.length} 件`:isVip?"顯示標準價與專案價":"顯示標準售價"}</div>
            </div>
            <div style={{display:"flex",gap:12,alignItems:"center"}}>
              {(seriesF||searchQ)&&<button className="btn-cancel-sm" onClick={()=>{setSeriesF(null);setSearchQ("");setCat("全部");}}>清除篩選</button>}
              <span style={{fontSize:10,color:"var(--muted)",letterSpacing:2}}>{filtered.length} 件</span>
            </div>
          </div>
          {!seriesF&&!searchQ&&<div className="catbar">{["全部",...allCats].map(c=><button key={c} className={`catbtn ${cat===c?"on":""}`} onClick={()=>setCat(c)}>{c}</button>)}</div>}
          {/* 訪客資料 Modal */}
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
                  <button className="btn-confirm" onClick={()=>{
                    const errs={};
                    if(!guestInfo.company.trim())errs.company="必填";
                    if(!guestInfo.contact.trim())errs.contact="必填";
                    if(!guestInfo.phone.trim())errs.phone="必填";
                    setGuestErr(errs);
                    if(Object.keys(errs).length>0)return;
                    setGuestModal(false);
                    handleGenPDF();
                  }}>確認並下載</button>
                  <button className="btn-cancel-sm" onClick={()=>setGuestModal(false)}>取消</button>
                </div>
              </div>
            </div>
          </div>}

          <div className="pgrid">
            {filtered.map(p=>{
              const isEditing = isAdmin && inlineEdit===p.id;
              const d = isEditing ? inlineData : p;
              return(
              <div key={p.id} className="pcard" onClick={()=>!isEditing&&setSelProd(p)}>
                {hasStock(p.model)&&<div className="pcard-stock-badge"><span className="pcard-stock-dot"/>台灣現貨</div>}
                <div className="pcard-img">{p.images?.[0]?<img src={p.images[0]} alt={p.model}/>:<PlaceholderIcon/>}</div>
                <div className="pcard-body">
                  <div className="pcard-series">{p.series}</div>
                  <div className="pcard-model">{p.model}</div>
                  {isEditing?(
                    <div onClick={e=>e.stopPropagation()} style={{marginBottom:8}}>
                      {[["瓦數","watt"],["色溫","cct"],["開孔","cutout"],["建議牌價","stdPrice"],["庫存備註","note"]].map(([l,k])=>(
                        <div key={k} style={{marginBottom:6}}>
                          <div style={{fontSize:"7px",letterSpacing:"2px",textTransform:"uppercase",color:"var(--muted)",marginBottom:2}}>{l}</div>
                          <input
                            type={k==="stdPrice"?"number":"text"}
                            value={d[k]||""}
                            onChange={e=>setInlineData(x=>({...x,[k]:e.target.value}))}
                            style={{width:"100%",padding:"5px 7px",border:"0.5px solid var(--gold)",background:"#fffef9",fontFamily:"'Noto Sans TC',sans-serif",fontSize:11,outline:"none"}}
                          />
                        </div>
                      ))}
                      <div style={{display:"flex",gap:6,marginTop:8}}>
                        <button className="btn-save-inv" onClick={()=>{
                          const updated={...p,...inlineData,stdPrice:Number(inlineData.stdPrice||p.stdPrice),projPrice:Number(inlineData.projPrice||p.projPrice)};
                          const newList=products.map(x=>x.id===p.id?updated:x);
                          setProducts(newList);syncProducts(newList);
                          setInlineEdit(null);toast$(`${p.model} 已儲存並同步雲端`);
                        }}>儲存變更</button>
                        <button className="btn-cancel-sm" style={{padding:"4px 9px",fontSize:9}} onClick={()=>setInlineEdit(null)}>取消</button>
                      </div>
                    </div>
                  ):(
                    <div className="pcard-desc">{p.desc}</div>
                  )}
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
                  {isAdmin&&!isEditing&&(
                    <button onClick={e=>{e.stopPropagation();setInlineEdit(p.id);setInlineData({watt:p.watt,cct:p.cct,cutout:p.cutout,stdPrice:p.stdPrice,projPrice:p.projPrice,note:p.note});}}
                      style={{marginTop:8,width:"100%",padding:"5px",background:"transparent",border:"0.5px solid var(--bdr)",color:"var(--muted)",fontFamily:"'Noto Sans TC',sans-serif",fontSize:"8px",letterSpacing:"2px",cursor:"pointer",textTransform:"uppercase"}}>
                      編輯規格
                    </button>
                  )}
                </div>
              </div>
            );})}

            {filtered.length===0&&<div className="empty" style={{gridColumn:"1/-1"}}>找不到符合的產品</div>}
          </div>
        </>}

        {/* 台灣現貨庫存 */}
        {page==="inventory"&&<>
          <div className="inv-hero">
            <div className="inv-hero-badge"><span className="inv-hero-bdot"/>當日出貨 · 隔日到貨</div>
            <div className="inv-hero-title">桃園倉儲 · 即時供應</div>
            <div className="inv-hero-sub">Taiwan Stock · Ready to Ship</div>
            <div className="inv-hero-desc">
              台灣現貨直送，<strong>下單後當日備貨出倉</strong>，台灣本島全境<strong>最快隔日即可到貨</strong>。<br/>
              省去 4 週生產等待，讓您的專案如期完工。
            </div>
          </div>
          <div className="inv-stats">
            <div className="inv-stat"><div className="inv-stat-num">{invTotalStock.toLocaleString()}</div><div className="inv-stat-lbl">總庫存</div></div>
            <div className="inv-stat"><div className="inv-stat-num">{invAvailable.toLocaleString()}</div><div className="inv-stat-lbl">可調貨數量</div></div>
            <div className="inv-stat"><div className="inv-stat-num">{invSkuCount}</div><div className="inv-stat-lbl">品項數 SKU</div></div>
          </div>
          <div className="inv-catbar">
            {allInvCats.map(c=><button key={c} className={`inv-catbtn ${invCat===c?"on":""}`} onClick={()=>setInvCat(c)}>{c}</button>)}
          </div>
          <div className="inv-grid">
            {filteredInv.map(item=>{
              const st=invStatusLabel(item);
              return (
                <div key={item.id} className="inv-card">
                  <div className="inv-card-top">
                    <div>
                      <div className="inv-card-model">{item.model}</div>
                      <div className="inv-card-series">{item.series}</div>
                    </div>
                    <span className={`inv-status ${st.cls}`}>{st.label}</span>
                  </div>
                  <div className="inv-specs">
                    {item.watt&&<span className="inv-spec-tag">{item.watt}</span>}
                    {item.cct&&<span className="inv-spec-tag">{item.cct}</span>}
                    {item.color&&<span className="inv-spec-tag">{item.color}</span>}
                  </div>
                  <div className="inv-qty-row">
                    <div className="inv-qty-cell"><div className="inv-qty-num">{item.totalQty}</div><div className="inv-qty-lbl">總庫存</div></div>
                    <div className="inv-qty-cell"><div className="inv-qty-num">{item.reservedQty}</div><div className="inv-qty-lbl">已保留</div></div>
                    <div className="inv-qty-cell"><div className={`inv-qty-num ${Number(item.availableQty)>0?"avail":""}`}>{item.availableQty}</div><div className="inv-qty-lbl">可調貨</div></div>
                  </div>
                  {item.note&&<div className="inv-note">{item.note}</div>}
                  <div className="inv-card-footer">
                    <div>
                      <div className="inv-location">儲位：{item.location||"—"}</div>
                      <div className="inv-updated">更新：{item.updatedAt}</div>
                    </div>
                    <button
                      className="btn-inv-cart"
                      disabled={Number(item.availableQty)<=0}
                      onClick={()=>{
                        const prod=products.find(p=>p.model===item.model);
                        if(prod){addToCart(prod);}else{toast$(`${item.model} 已加入詢價單`);}
                      }}>
                      加入詢價
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredInv.length===0&&<div className="empty" style={{gridColumn:"1/-1"}}>此分類目前無現貨</div>}
          </div>
        </>}

        {/* 照明設計配燈服務 */}
        {page==="design"&&<>
          <div className="phead">
            <div>
              <div className="ptitle">照明設計配燈服務</div>
              <div className="psub">專業規劃 · 預算最適化</div>
            </div>
          </div>
          {/* 服務說明 */}
          <div style={{background:"linear-gradient(135deg,#0e0d0c,#1a1612)",padding:"32px 36px",marginBottom:28,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 70% 50%,rgba(184,147,90,.08),transparent 60%)"}}/>
            <div style={{fontSize:"7px",letterSpacing:"5px",textTransform:"uppercase",color:"var(--gold)",marginBottom:12,position:"relative",zIndex:1}}>服務說明</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:"#e8e0d4",lineHeight:1.5,marginBottom:14,position:"relative",zIndex:1}}>
              根據您的預算規劃最適燈具數量
            </div>
            <div style={{fontSize:13,color:"#8a7a6a",lineHeight:1.9,maxWidth:560,position:"relative",zIndex:1}}>
              預收專案總價之 <strong style={{color:"var(--gold)"}}>10%</strong> 作為設計服務費。<br/>
              若最終燈具採購金額達到預算之 <strong style={{color:"var(--gold)"}}>70% 以上</strong>，此費用將<strong style={{color:"var(--gold)"}}>全額折抵貨款</strong>。
            </div>
          </div>
          {/* 服務流程 */}
          <div style={{marginBottom:32}}>
            <div style={{fontSize:"7px",letterSpacing:"4px",textTransform:"uppercase",color:"var(--muted)",marginBottom:16}}>服務流程</div>
            <div style={{display:"flex",gap:0,overflowX:"auto"}}>
              {[
                ["01","提供需求","提供 CAD 圖與預算需求"],
                ["02","業務聯繫","專員確認細節與時程"],
                ["03","支付預付款","支付專案總價 10% 設計費"],
                ["04","專業配燈","出具配燈規劃報告"],
                ["05","確認下單","採購達標即全額折抵"],
              ].map(([n,t,d],i,arr)=>(
                <div key={n} style={{display:"flex",alignItems:"stretch",flex:1,minWidth:120}}>
                  <div style={{flex:1,border:"0.5px solid var(--bdr2)",padding:"16px 14px",background:"var(--ivory)"}}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:"var(--gold)",marginBottom:4}}>{n}</div>
                    <div style={{fontSize:11,fontWeight:400,marginBottom:4}}>{t}</div>
                    <div style={{fontSize:9,color:"var(--muted)",lineHeight:1.7}}>{d}</div>
                  </div>
                  {i<arr.length-1&&<div style={{display:"flex",alignItems:"center",padding:"0 6px",color:"var(--bdr)",fontSize:16,flexShrink:0}}>›</div>}
                </div>
              ))}
            </div>
          </div>
          {/* 申請表單 */}
          <div style={{maxWidth:460}}>
            <div style={{fontSize:"7px",letterSpacing:"4px",textTransform:"uppercase",color:"var(--muted)",marginBottom:16,paddingBottom:8,borderBottom:"0.5px solid var(--bdr2)"}}>申請配燈服務</div>
            {designDone?(
              <div style={{textAlign:"center",padding:"40px 0",color:"var(--green)",fontSize:14,lineHeight:2}}>
                申請已送出 ✓<br/>
                <span style={{fontSize:11,color:"var(--muted)"}}>專員將於 1–2 個工作日聯繫您</span><br/>
                <button className="btn-outline" style={{marginTop:16}} onClick={()=>{setDesignDone(false);setDesignForm({company:"",name:"",phone:"",project:""});}}>重新申請</button>
              </div>
            ):(
              <>
                {[["公司名稱","company","必填"],["聯絡人","name","姓名"],["聯絡電話","phone","0912-345-678"],["案名","project","選填，方便業務了解專案背景"]].map(([l,k,ph])=>(
                  <div key={k} className="lf">
                    <label>{l}{k!=="project"&&<span className="req"> *</span>}</label>
                    <input value={designForm[k]} onChange={e=>setDesignForm(p=>({...p,[k]:e.target.value}))} placeholder={ph}/>
                  </div>
                ))}
                <button className="btn-primary" style={{marginTop:8}} onClick={submitDesignForm}>我需要配燈服務</button>
                <div style={{fontSize:10,color:"var(--muted)",marginTop:10,lineHeight:1.8}}>
                  提交後專員將主動聯繫，協助評估專案規模與設計費用。
                </div>
              </>
            )}
          </div>
        </>}

        {/* 詢價單 */}
        {page==="inquiry"&&<>
          <div className="phead"><div><div className="ptitle">詢價單</div><div className="psub">填寫案名後下載報價單</div></div></div>
          {cart.length===0?<div className="empty">請至產品目錄加入品項</div>:<>
            <div className="tbl-wrap"><table>
              <thead><tr><th>型號</th><th>系列</th><th>瓦數</th><th>數量</th><th>{isVip?"專案價":"標準價"}</th><th>小計</th><th></th></tr></thead>
              <tbody>{cart.map(item=>{const price=isVip?item.product.projPrice:item.product.stdPrice;return(<tr key={item.product.id}><td style={{fontWeight:400}}>{item.product.model}</td><td>{item.product.series}</td><td>{item.product.watt}</td><td><div style={{display:"flex",alignItems:"center",gap:6}}><button className="qty-btn" onClick={()=>updateQty(item.product.id,-1)}>−</button><span>{item.qty}</span><button className="qty-btn" onClick={()=>updateQty(item.product.id,1)}>+</button></div></td><td style={{color:isVip?"var(--gold)":"inherit"}}>NT$ {price?.toLocaleString()}</td><td>NT$ {(price*item.qty).toLocaleString()}</td><td><button className="btn-del2" onClick={()=>removeItem(item.product.id)}><CloseIcon/></button></td></tr>);})}</tbody>
            </table></div>
            <div style={{maxWidth:460}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:14,paddingBottom:12,borderBottom:"0.5px solid var(--bdr2)"}}>
                <span style={{fontSize:"8px",letterSpacing:"3px",textTransform:"uppercase",color:"var(--muted)"}}>小計</span>
                <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22}}>NT$ {cartTotal.toLocaleString()}</span>
              </div>
              {cartTotal<3000&&<div className="warn-ship">未滿 NT$3,000，運費由買方支付</div>}
              <div style={{marginBottom:12}}>
                <label style={{display:"block",fontSize:"8px",letterSpacing:"3px",textTransform:"uppercase",color:"var(--muted)",marginBottom:6}}>案名 *</label>
                <input style={{width:"100%",padding:"9px",border:"0.5px solid var(--bdr)",background:"transparent",fontFamily:"'Noto Sans TC',sans-serif",fontSize:12,outline:"none"}} value={projName} onChange={e=>setProjName(e.target.value)} placeholder="請輸入案名"/>
              </div>
              <div className="checklist">
                <div className="cl-title">下載前請確認</div>
                {[{k:"c1",t:"單筆未滿 NT$3,000 運費由買方自付"},{k:"c2",t:"庫存不足時生產交期約 4 週起"},{k:"c3",t:"保固室內 3 年、戶外 2 年"},{k:"c4",t:"報價單有效期 30 天請回簽確認"}].map(({k,t})=>(<label key={k} className="cl-item"><input type="checkbox" checked={checks[k]} onChange={e=>setChecks(p=>({...p,[k]:e.target.checked}))}/>{t}</label>))}
              </div>
              <button className="btn-pdf" onClick={handleGenPDF} disabled={!projName.trim()||!allChecked}>{allChecked?"下載報價單":"請先勾選確認事項"}</button>
            </div>
          </>}
        </>}

        {/* 借樣品 */}
        {page==="sample"&&<>
          <div className="phead"><div><div className="ptitle">借樣品</div><div className="psub">申請試用 — 2 週內歸還可折抵購買</div></div><button className="btn-add2" onClick={()=>setSampOpen(true)}>申請清單 ({sampCart.length})</button></div>
          <div className="hint-box">從下方產品點選「申請樣品」加入清單後提交。</div>
          <div className="pgrid">{products.map(p=>(<div key={p.id} className="pcard"><div className="pcard-img" onClick={()=>setSelProd(p)} style={{cursor:"pointer"}}>{p.images?.[0]?<img src={p.images[0]} alt={p.model}/>:<PlaceholderIcon/>}</div><div className="pcard-body"><div className="pcard-series">{p.series}</div><div className="pcard-model">{p.model}</div><div className="pcard-tags">{p.watt&&<span className="ptag">{p.watt}</span>}{p.beam&&<span className="ptag">{p.beam}</span>}</div><button className={`btn-samp ${sampCart.find(i=>i.id===p.id)?"done":""}`} onClick={()=>sampCart.find(i=>i.id===p.id)?removeSamp(p.id):addToSamp(p)}>{sampCart.find(i=>i.id===p.id)?"已加入":"申請樣品"}</button></div></div>))}</div>
        </>}

        {/* 安裝服務 */}
        {page==="install"&&<>
          <div className="phead"><div><div className="ptitle">安裝服務</div><div className="psub">原廠技術安裝 — 僅限室內崁燈 — 含安裝不含開孔拉線</div></div><button className="btn-add2" onClick={()=>setInstOpen(true)}>立即估算費用</button></div>
          <div className="hint-box"><strong style={{color:"var(--blk)",display:"block",marginBottom:4}}>服務範疇</strong>本服務提供燈具定位與安裝，<strong>不含開孔、線路抽換、木作或補漆</strong>。出發地：桃園市八德區。</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:1,background:"var(--bdr2)",border:"0.5px solid var(--bdr2)",marginBottom:28}}>
            {[["最低出勤費","NT$ 2,000","單次工資未達此標，以 2,000 計收"],["標準安裝（3m 內）","NT$ 200 / 盞","含定位、安裝與功能測試"],["挑高施工（3.1–4.5m）","+NT$ 100–200 / 盞","視現場難度，需 A 型梯"],["4.5m 以上","安全紅線","需鷹架或高空作業車，費用另計"]].map(([t,v,d])=>(<div key={t} style={{background:"var(--ivory)",padding:"18px 20px"}}><div style={{fontSize:"7px",letterSpacing:"3px",textTransform:"uppercase",color:"var(--muted)",marginBottom:5}}>{t}</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:t.includes("4.5")?"var(--red)":"var(--blk)",marginBottom:4}}>{v}</div><div style={{fontSize:10,color:"var(--muted)"}}>{d}</div></div>))}
          </div>
          <div style={{marginBottom:28}}>
            <div style={{fontSize:"7px",letterSpacing:"4px",textTransform:"uppercase",color:"var(--muted)",marginBottom:12,paddingBottom:7,borderBottom:"0.5px solid var(--bdr2)"}}>全台分區車馬費一覽</div>
            <div className="tbl-wrap"><table className="install-tbl"><thead><tr><th>服務區域</th><th>代表縣市</th><th>里程參考</th><th>基礎車馬費</th><th>免收門檻</th></tr></thead><tbody>{INSTALL_REGIONS.map(r=>(<tr key={r.id}><td style={{fontWeight:400}}>{r.label}</td><td style={{color:"var(--muted)",fontSize:10}}>{r.areas}</td><td style={{color:"var(--muted)",fontSize:10}}>{r.km}</td><td style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14}}>{r.travel===null?"專案另議":`NT$ ${r.travel.toLocaleString()}`}</td><td style={{fontSize:10,color:"var(--green)"}}>{r.freeAt?`${r.freeAt} 盞免收`:r.travel===null?"不設門檻":"—"}</td></tr>))}</tbody></table></div>
          </div>
          <div style={{textAlign:"center",paddingTop:14,borderTop:"0.5px solid var(--bdr2)"}}><button className="btn-primary" style={{maxWidth:260,margin:"0 auto",display:"block"}} onClick={()=>setInstOpen(true)}>立即估算安裝費用</button></div>
        </>}

        {/* 待審核 */}
        {page==="pending"&&user.role==="admin"&&<>
          <div className="phead"><div><div className="ptitle">待審核申請</div></div></div>
          {approveT&&<div className="modal-wrap" onClick={()=>setApproveT(null)}><div className="modal-box" onClick={e=>e.stopPropagation()}><div className="modal-head"><div className="modal-title">核准申請</div><button className="close-btn" onClick={()=>setApproveT(null)}><CloseIcon/></button></div><div className="modal-body"><div className="ac-card"><div className="ac-name">{approveT.name} · {approveT.position}</div><div className="ac-detail">{approveT.company}<br/>{approveT.email} · {approveT.phone}</div></div><div className="fgrid"><div className="ff"><label>登入帳號</label><input value={approveF.username} onChange={e=>setApproveF(p=>({...p,username:e.target.value}))} placeholder={approveT.username}/></div><div className="ff"><label>登入密碼</label><input value={approveF.password} onChange={e=>setApproveF(p=>({...p,password:e.target.value}))} placeholder="設定密碼"/></div><div className="ff full"><label>報價權限</label><select value={approveF.role} onChange={e=>setApproveF(p=>({...p,role:e.target.value}))}><option value="standard">一般客戶</option><option value="vip">VIP 客戶</option><option value="admin">管理者</option></select></div></div><div className="form-actions"><button className="btn-confirm" onClick={doApprove}>確認核准</button><button className="btn-cancel-sm" onClick={()=>setApproveT(null)}>取消</button></div></div></div></div>}
          {pending.length===0?<div className="empty">目前沒有待審核的申請</div>:<div className="tbl-wrap"><table><thead><tr><th>姓名</th><th>職稱</th><th>公司</th><th>電話</th><th>申請日</th><th>操作</th></tr></thead><tbody>{pending.map(p=><tr key={p.id}><td style={{fontWeight:400}}>{p.name}</td><td style={{color:"var(--muted)"}}>{p.position}</td><td>{p.company}</td><td style={{color:"var(--muted)"}}>{p.phone}</td><td style={{color:"var(--muted)"}}>{p.appliedAt}</td><td style={{display:"flex",gap:6}}><button className="btn-ok" onClick={()=>{setApproveT(p);setApproveF({username:p.username,password:p.password,role:"standard"});}}>核准</button><button className="btn-ng" onClick={()=>{setPending(x=>x.filter(x=>x.id!==p.id));toast$("已拒絕");}}>拒絕</button></td></tr>)}</tbody></table></div>}
        </>}

        {/* 帳號管理 */}
        {page==="members"&&user.role==="admin"&&<>
          <div className="phead"><div><div className="ptitle">帳號管理</div></div></div>
          <div className="stats-row">{[["總帳號",members.length,""],["管理者",members.filter(m=>m.role==="admin").length,""],["VIP",members.filter(m=>m.role==="vip").length,""],["待審核",pending.length,"var(--red)"]].map(([l,n,c])=>(<div key={l} className="stat-box"><div className="stat-num" style={c?{color:c}:{}}>{n}</div><div className="stat-lbl">{l}</div></div>))}</div>
          <div className="tbl-wrap"><table><thead><tr><th>姓名</th><th>公司</th><th>帳號</th><th>密碼</th><th>身份</th><th>調整</th><th>開通日</th><th></th></tr></thead><tbody>{members.map(m=>(<tr key={m.id}><td style={{fontWeight:400}}>{m.name}</td><td>{m.company}</td><td style={{fontFamily:"monospace"}}>{m.username}</td><td style={{fontFamily:"monospace",color:"var(--muted)"}}>{m.password}</td><td><span className={`rb r-${m.role==="admin"?"admin":m.role==="vip"?"vip":"std"}`}>{roleLabel(m.role)}</span></td><td><select className="role-sel" value={m.role} onChange={e=>{setMembers(x=>x.map(i=>i.id===m.id?{...i,role:e.target.value}:i));if(user.id===m.id)setUser(u=>({...u,role:e.target.value}));toast$("權限已更新");}}>  <option value="standard">一般</option><option value="vip">VIP</option><option value="admin">管理</option></select></td><td style={{color:"var(--muted)"}}>{m.approvedAt}</td><td>{m.id!==user.id&&<button className="btn-del2" onClick={()=>{setMembers(x=>x.filter(x=>x.id!==m.id));toast$("帳號已刪除");}}><CloseIcon/></button>}</td></tr>))}</tbody></table></div>
        </>}

        {/* 產品管理 */}
        {page==="products"&&user.role==="admin"&&<>
          <div className="phead"><div><div className="ptitle">產品管理</div><div className="psub">{products.length} 件商品</div></div><button className="btn-add2" onClick={()=>setShowAdd(v=>!v)}>新增產品</button></div>
          <div className="hint-box">修改後自動同步至雲端 Google Sheets。圖片請貼入網址（每行一個），影片請貼 YouTube Embed URL。</div>
          {showAdd&&<div className="form-panel"><div className="fp-title">新增產品</div>
            <div className="fgrid">
              {[["型號","model"],["系列","series"],["瓦數","watt"],["色溫","cct"],["光束角","beam"],["電壓","voltage"],["演色性","cri"],["顏色","color"],["開孔尺寸","cutout"],["產品尺寸","size"],["認證","cert"],["標準價","stdPrice"],["專案價","projPrice"],["運費","shipping"]].map(([l,k])=>(<div key={k} className="ff"><label>{l}</label><input type={["stdPrice","projPrice","shipping"].includes(k)?"number":"text"} value={newProd[k]} onChange={e=>setNewProd(p=>({...p,[k]:e.target.value}))}/></div>))}
              <div className="ff"><label>分類</label><select value={newProd.category} onChange={e=>setNewProd(p=>({...p,category:e.target.value}))}><option>崁燈</option><option>軌道燈</option><option>磁吸系統</option><option>吸頂燈</option><option>壁燈</option><option>戶外燈</option><option>鋁條燈</option><option>矽膠燈帶</option></select></div>
              <div className="ff"><label>安裝方式</label><select value={newProd.install} onChange={e=>setNewProd(p=>({...p,install:e.target.value}))}><option>崁入式</option><option>軌道式</option><option>三線軌道式</option><option>磁吸嵌入</option><option>吸頂式</option><option>壁掛式</option><option>插地式</option></select></div>
              <div className="ff full"><label>產品描述</label><input value={newProd.desc} onChange={e=>setNewProd(p=>({...p,desc:e.target.value}))}/></div>
              <div className="ff full"><label>圖片網址（每行一個）</label><textarea rows={2} value={newProd.images} onChange={e=>setNewProd(p=>({...p,images:e.target.value}))} placeholder="https://..."/></div>
              <div className="ff full"><label>教學影片（YouTube Embed URL）</label><input value={newProd.video} onChange={e=>setNewProd(p=>({...p,video:e.target.value}))} placeholder="https://www.youtube.com/embed/xxxxx"/></div>
              <div className="ff full"><label>備註</label><input value={newProd.note} onChange={e=>setNewProd(p=>({...p,note:e.target.value}))}/></div>
            </div>
            <div className="form-actions"><button className="btn-confirm" onClick={doAddProd}>確認新增</button><button className="btn-cancel-sm" onClick={()=>setShowAdd(false)}>取消</button></div>
          </div>}
          {editProd&&<div className="form-panel" style={{background:"#f0ebe2"}}><div className="fp-title">編輯：{editProd.model}</div>
            <div className="fgrid">
              {[["型號","model"],["系列","series"],["瓦數","watt"],["色溫","cct"],["光束角","beam"],["電壓","voltage"],["演色性","cri"],["顏色","color"],["開孔尺寸","cutout"],["產品尺寸","size"],["認證","cert"],["標準價","stdPrice"],["專案價","projPrice"],["運費","shipping"]].map(([l,k])=>(<div key={k} className="ff"><label>{l}</label><input type={["stdPrice","projPrice","shipping"].includes(k)?"number":"text"} value={editProd[k]||""} onChange={e=>setEditProd(p=>({...p,[k]:e.target.value}))}/></div>))}
              <div className="ff full"><label>產品描述</label><input value={editProd.desc||""} onChange={e=>setEditProd(p=>({...p,desc:e.target.value}))}/></div>
              <div className="ff full"><label>圖片網址（每行一個）</label><textarea rows={2} value={typeof editProd.images==="string"?editProd.images:(editProd.images||[]).join("\n")} onChange={e=>setEditProd(p=>({...p,images:e.target.value}))}/></div>
              <div className="ff full"><label>教學影片（YouTube Embed URL）</label><input value={editProd.video||""} onChange={e=>setEditProd(p=>({...p,video:e.target.value}))}/></div>
              <div className="ff full"><label>備註</label><input value={editProd.note||""} onChange={e=>setEditProd(p=>({...p,note:e.target.value}))}/></div>
            </div>
            <div className="form-actions"><button className="btn-confirm" onClick={saveEdit}>儲存修改</button><button className="btn-cancel-sm" onClick={()=>setEditProd(null)}>取消</button></div>
          </div>}
          <div className="tbl-wrap"><table><thead><tr><th>型號</th><th>系列</th><th>分類</th><th>瓦數</th><th>標準價</th><th>專案價</th><th>影片</th><th>操作</th></tr></thead><tbody>{products.map(p=>(<tr key={p.id}><td style={{fontWeight:400}}>{p.model}</td><td>{p.series}</td><td>{p.category}</td><td>{p.watt}</td><td>NT$ {p.stdPrice?.toLocaleString()}</td><td style={{color:"var(--gold)"}}>NT$ {p.projPrice?.toLocaleString()}</td><td>{p.video?<span style={{fontSize:10,color:"var(--green)"}}>✓</span>:<span style={{color:"var(--muted)"}}>—</span>}</td><td style={{display:"flex",gap:6}}><button className="btn-edit2" onClick={()=>startEdit(p)}>編輯</button><button className="btn-del2" onClick={()=>{const nl=products.filter(x=>x.id!==p.id);setProducts(nl);syncProducts(nl);toast$("已刪除");}}><CloseIcon/></button></td></tr>))}</tbody></table></div>
        </>}

        {/* 庫存管理（管理員） */}
        {page==="inv_admin"&&user.role==="admin"&&<>
          <div className="phead"><div><div className="ptitle">庫存管理</div><div className="psub">{inventory.length} 筆 · 修改即時同步雲端</div></div><button className="btn-add2" onClick={()=>setShowAddInv(v=>!v)}>新增庫存</button></div>
          {showAddInv&&<div className="form-panel">
            <div className="fp-title">新增庫存項目</div>
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
              const isEditing = editInvItem?.id===item.id;
              const cur = isEditing ? editInvItem : item;
              return(
                <tr key={item.id}>
                  <td style={{fontWeight:400}}>{item.model}</td>
                  <td>{item.series}</td><td>{item.category}</td>
                  <td style={{fontSize:9,color:"var(--muted)"}}>{item.cct}</td>
                  <td style={{fontSize:9,color:"var(--muted)"}}>{item.color}</td>
                  <td>{isEditing?<input type="number" min="0" value={cur.totalQty} onChange={e=>setEditInvItem(p=>({...p,totalQty:Number(e.target.value)}))}/>:item.totalQty}</td>
                  <td>{isEditing?<input type="number" min="0" value={cur.reservedQty} onChange={e=>setEditInvItem(p=>({...p,reservedQty:Number(e.target.value)}))}/>:item.reservedQty}</td>
                  <td style={{color:"var(--inv-green)",fontFamily:"'Cormorant Garamond',serif",fontSize:15}}>{isEditing?Number(cur.totalQty)-Number(cur.reservedQty):item.availableQty}</td>
                  <td style={{fontSize:9,color:"var(--muted)"}}>{isEditing?<input value={cur.location} onChange={e=>setEditInvItem(p=>({...p,location:e.target.value}))} style={{width:90,padding:"4px 6px",border:"0.5px solid var(--bdr)",background:"transparent",fontFamily:"'Noto Sans TC',sans-serif",fontSize:11,outline:"none"}}/>:item.location}</td>
                  <td style={{display:"flex",gap:5}}>
                    {isEditing?<>
                      <button className="btn-save-inv" onClick={()=>saveInvRow(editInvItem)}>儲存</button>
                      <button className="btn-cancel-sm" style={{padding:"4px 9px",fontSize:9}} onClick={()=>setEditInvItem(null)}>取消</button>
                    </>:<>
                      <button className="btn-edit2" onClick={()=>setEditInvItem({...item})}>編輯</button>
                      <button className="btn-del2" onClick={()=>deleteInvRow(item.id)}><CloseIcon/></button>
                    </>}
                  </td>
                </tr>
              );
            })}</tbody>
          </table></div>
        </>}

        {/* 雲端設定 */}
        {page==="cloud_settings"&&user.role==="admin"&&<>
          <div className="phead"><div><div className="ptitle">雲端設定</div><div className="psub">Google Sheets 自動同步設定</div></div></div>
          <div className="cloud-status">
            <div className={`sync-dot ${syncStatus}`} style={{width:10,height:10}}/>
            <span style={{fontSize:11}}>{syncStatus==="off"?"尚未連線":syncStatus==="loading"?"同步中...":"雲端已連線，資料同步正常"}</span>
          </div>
          <div style={{marginBottom:24}}>
            <label style={{display:"block",fontSize:"8px",letterSpacing:"3px",textTransform:"uppercase",color:"var(--muted)",marginBottom:8}}>Google Apps Script 部署 URL</label>
            <input className="cloud-url-inp" value={urlInput} onChange={e=>setUrlInput(e.target.value)} placeholder="https://script.google.com/macros/s/xxxxx/exec"/>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button className="btn-confirm" onClick={applyUrl}>套用 URL</button>
              <button className="btn-ok" style={{padding:"9px 16px"}} onClick={testConnection}>測試連線</button>
              <button className="btn-add2" onClick={forceSyncAll}>立即全量同步</button>
            </div>
            {testResult&&<div style={{marginTop:10,fontSize:11,color:testResult.includes("✓")?"var(--green)":"var(--red)",padding:"8px 12px",background:"#f4efe8",borderLeft:"2px solid currentColor"}}>{testResult}</div>}
          </div>
          <div style={{borderTop:"0.5px solid var(--bdr2)",paddingTop:20}}>
            <div style={{fontSize:"8px",letterSpacing:"4px",textTransform:"uppercase",color:"var(--muted)",marginBottom:14}}>部署步驟</div>
            {[
              ["1","開啟 Google Sheets","建立一份新試算表，或開啟已有的試算表"],
              ["2","進入 Apps Script","上方選單：延伸功能 → Apps Script"],
              ["3","貼上後端程式碼","刪除預設代碼，貼入本系統提供的 Google_Apps_Script.js 全部內容"],
              ["4","部署為網頁應用程式","按「部署」→「新增部署作業」，類型選「網頁應用程式」\n執行身份：「我」｜存取權限：「所有人」"],
              ["5","複製部署 URL","按「部署」後複製產生的網址（以 /exec 結尾）"],
              ["6","填入上方輸入框","將 URL 貼入上方欄位，按「套用 URL」，系統將自動同步資料"],
            ].map(([num,title,desc])=>(
              <div key={num} className="cloud-step">
                <div className="cloud-step-num">{num}</div>
                <div className="cloud-step-body">
                  <div className="cloud-step-title">{title}</div>
                  <div className="cloud-step-desc">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </>}

        {/* 樣品申請管理 */}
        {page==="sample_admin"&&user.role==="admin"&&<>
          <div className="phead"><div><div className="ptitle">樣品申請管理</div><div className="psub">{sampleReqs.length} 筆</div></div></div>
          {sampleReqs.length===0?<div className="empty">目前沒有樣品申請</div>:<div className="tbl-wrap"><table><thead><tr><th>日期</th><th>聯絡人</th><th>公司</th><th>電話</th><th>品項</th><th>狀態</th><th>操作</th></tr></thead><tbody>{sampleReqs.map(r=>(<tr key={r.id}><td style={{color:"var(--muted)"}}>{r.date}</td><td style={{fontWeight:400}}>{r.form.name}</td><td>{r.form.company}</td><td style={{color:"var(--muted)"}}>{r.form.phone}</td><td style={{fontSize:10}}>{r.products.join("、")}</td><td><span className={`rb ${r.status==="pending"?"r-std":"r-vip"}`}>{r.status==="pending"?"待處理":"已處理"}</span></td><td><button className="btn-ok" onClick={()=>setSampleReqs(x=>x.map(i=>i.id===r.id?{...i,status:"done"}:i))}>完成</button></td></tr>))}</tbody></table></div>}
        </>}

        {/* 安裝申請管理 */}
        {page==="install_admin"&&user.role==="admin"&&<>
          <div className="phead"><div><div className="ptitle">安裝申請管理</div><div className="psub">{installOrd.length} 筆</div></div></div>
          {installOrd.length===0?<div className="empty">目前沒有安裝申請</div>:<div className="tbl-wrap"><table><thead><tr><th>日期</th><th>客戶</th><th>區域</th><th>盞數</th><th>預估費用</th><th>差旅</th><th>狀態</th><th>操作</th></tr></thead><tbody>{installOrd.map(o=>{const qty=o.groups.reduce((s,g)=>s+Number(g.qty||0),0);const est=o.calc&&!o.calc.hasVHigh&&o.calc.travelFee!==null?o.calc.laborTotal+(o.calc.travelFee||0):null;return(<tr key={o.id}><td style={{color:"var(--muted)"}}>{o.date}</td><td style={{fontWeight:400}}>{o.customer.name}<br/><span style={{fontSize:9,color:"var(--muted)"}}>{o.customer.company}</span></td><td>{INSTALL_REGIONS.find(r=>r.id===o.region)?.label}</td><td style={{textAlign:"center"}}>{qty}</td><td style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,color:"var(--gold)"}}>{est?`NT$ ${est.toLocaleString()}`:"另議"}</td><td>{o.calc?.needStay?<span style={{fontSize:9,color:"var(--red)"}}>需住宿</span>:"—"}</td><td><span className={`rb ${o.status==="pending"?"r-std":"r-vip"}`}>{o.status==="pending"?"待確認":"已處理"}</span></td><td><button className="btn-ok" onClick={()=>setInstallOrd(x=>x.map(i=>i.id===o.id?{...i,status:"done"}:i))}>完成</button></td></tr>);})}</tbody></table></div>}
        </>}

      </div>{/* end .content */}

      {/* 產品詳情 Drawer */}
      {selProd&&<div className="drawer-overlay" onClick={()=>setSelProd(null)}>
        <div className="drawer" onClick={e=>e.stopPropagation()}>
          <div className="drawer-top">
            <div className="drawer-series">{selProd.series} — {selProd.category}</div>
            <button className="close-btn" onClick={()=>setSelProd(null)}><CloseIcon/></button>
          </div>
          <Carousel images={selProd.images}/>
          <div className="drawer-body">
            <div className="drawer-model">{selProd.model}</div>
            {hasStock(selProd.model)&&<div className="inv-badge-drawer"><span className="inv-badge-dot"/>台灣現貨 · 當日出貨 · 隔日到貨</div>}
            <div className="drawer-desc">{selProd.desc}</div>
            <div className="spec-grid">
              {[["瓦數",selProd.watt],["流明",selProd.lumen],["色溫",selProd.cct],["光束角",selProd.beam],["電壓",selProd.voltage],["演色性",selProd.cri],["顏色",selProd.color],["開孔尺寸",selProd.cutout],["產品尺寸",selProd.size],["安裝方式",selProd.install],["認證",selProd.cert]].filter(([,v])=>v&&v!=="—").map(([l,v])=>(<div key={l} className="spec-item"><div className="spec-label">{l}</div><div className="spec-val">{v}</div></div>))}
            </div>
            {selProd.video&&(<div style={{marginBottom:16}}><div style={{fontSize:"7px",letterSpacing:"4px",textTransform:"uppercase",color:"var(--muted)",marginBottom:8}}>教學影片</div><div className="drawer-video"><iframe src={selProd.video} title="教學影片" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowFullScreen/></div></div>)}
            {(selProd.category==="鋁條燈"||selProd.category==="矽膠燈帶")&&(<div style={{background:"#fff8ee",border:"0.5px solid #e8c97a",borderLeft:"1px solid var(--gold)",padding:"10px 14px",marginBottom:14,fontSize:11,lineHeight:1.8,color:"#6a5a3a"}}><strong style={{color:"var(--gold)",display:"block",marginBottom:3}}>安裝注意事項</strong>{selProd.category==="鋁條燈"?<>單條建議最長 <strong>2m</strong> · 串聯最長 <strong>5.5m</strong><br/>需搭配 <strong>DC 24V 恒壓電源</strong></>:<>單條最長 <strong>5m</strong> · 超過請分段供電<br/>支援 <strong>0-10V / DMX / DALI</strong> 調光</>}</div>)}
            {selProd.note&&<div className="drawer-note">{selProd.note}</div>}
            <div className="price-block">
              <div className="pb-label">{isVip?"專案價":"售價"}</div>
              {isVip?<div className="pb-val gold">NT$ {selProd.projPrice?.toLocaleString()}</div>:(selProd.stdPrice>0?<div className="pb-val">NT$ {selProd.stdPrice?.toLocaleString()}</div>:<div className="pb-nq">請洽業務專員報價</div>)}
              {!isVip&&selProd.stdPrice>0&&<div style={{fontSize:10,color:"var(--muted)",marginTop:4}}>如需專案優惠，請洽業務</div>}
            </div>
            <div className="drawer-actions">
              <button className={`btn-cart ${isVip?"vip":""}`} onClick={()=>addToCart(selProd)}>加入詢價單</button>
              <button className={`btn-samp ${sampCart.find(i=>i.id===selProd.id)?"done":""}`} onClick={()=>sampCart.find(i=>i.id===selProd.id)?removeSamp(selProd.id):addToSamp(selProd)}>{sampCart.find(i=>i.id===selProd.id)?"已申請樣品":"申請樣品"}</button>
            </div>
          </div>
        </div>
      </div>}

      {/* 詢價單 Panel */}
      <div className={`side-panel ${cartOpen?"open":""}`}>
        <div className="sp-head"><div className="sp-title">詢價單</div><button className="close-btn" onClick={()=>setCartOpen(false)}><CloseIcon/></button></div>
        <div className="sp-body">
          {cart.length===0?<div className="empty" style={{paddingTop:48}}>尚未加入任何產品</div>:cart.map(item=>{const price=isVip?item.product.projPrice:item.product.stdPrice;return(<div key={item.product.id} className="ci-row"><div className="ci-img">{item.product.images?.[0]?<img src={item.product.images[0]} alt=""/>:<PlaceholderIcon/>}</div><div className="ci-info"><div className="ci-model">{item.product.model}</div><div className="ci-sub">{item.product.series} · {item.product.watt}</div><div className="ci-qty"><button className="qty-btn" onClick={()=>updateQty(item.product.id,-1)}>−</button><span style={{minWidth:20,textAlign:"center"}}>{item.qty}</span><button className="qty-btn" onClick={()=>updateQty(item.product.id,1)}>+</button><span className="ci-price" style={{marginLeft:7}}>NT$ {(price*item.qty).toLocaleString()}</span></div></div><button className="ci-del" onClick={()=>removeItem(item.product.id)}><CloseIcon/></button></div>);})}
        </div>
        {cart.length>0&&<div className="sp-foot">
          <div className="cart-total"><span className="cart-total-lbl">{isVip?"專案價小計":"標準價小計"}</span><span className="cart-total-val">NT$ {cartTotal.toLocaleString()}</span></div>
          {cartTotal<3000&&<div className="warn-ship">未滿 NT$3,000，運費由買方支付</div>}
          {cart.some(i=>i.product.category==="崁燈")&&(<div style={{border:"0.5px solid var(--gold)",padding:"10px 12px",marginBottom:10}}><div style={{fontSize:"7px",letterSpacing:"3px",textTransform:"uppercase",color:"var(--gold)",marginBottom:4}}>加購安裝服務</div><div style={{fontSize:10,color:"var(--muted)",marginBottom:6}}>本訂單含 {cart.filter(i=>i.product.category==="崁燈").reduce((s,i)=>s+i.qty,0)} 盞崁燈，可一併申請安裝</div><button style={{fontSize:"7px",letterSpacing:"2px",padding:"5px 10px",border:"0.5px solid var(--gold)",background:"transparent",color:"var(--gold)",cursor:"pointer",textTransform:"uppercase"}} onClick={()=>{setCartOpen(false);setInstOpen(true);}}>估算費用</button></div>)}
          <div className="cp-project"><label>案名 *</label><input value={projName} onChange={e=>setProjName(e.target.value)} placeholder="請輸入案名"/></div>
          <div className="checklist"><div className="cl-title">下載前請確認</div>{[{k:"c1",t:"單筆未滿 NT$3,000 運費由買方自付"},{k:"c2",t:"庫存不足時生產交期約 4 週起"},{k:"c3",t:"保固室內 3 年、戶外 2 年"},{k:"c4",t:"報價單有效期 30 天請回簽確認"}].map(({k,t})=>(<label key={k} className="cl-item"><input type="checkbox" checked={checks[k]} onChange={e=>setChecks(p=>({...p,[k]:e.target.checked}))}/>{t}</label>))}</div>
          <button className="btn-pdf" onClick={handleGenPDF} disabled={!projName.trim()||!allChecked}>{allChecked?"下載報價單":"請先勾選確認事項"}</button>
        </div>}
      </div>

      {/* 樣品申請 Panel */}
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
              <label>備註</label><textarea rows={2} value={sampForm.note} onChange={e=>setSampForm(p=>({...p,note:e.target.value}))}/>
            </div>
          </>}
        </div>
        {!sampDone&&<div className="sp-foot"><button className="btn-gold" onClick={submitSamp} disabled={sampCart.length===0}>送出樣品申請</button><button className="btn-ghost" onClick={()=>setSampOpen(false)}>稍後再說</button></div>}
      </div>

      {/* 安裝估價 Panel */}
      <div className={`side-panel ${instOpen?"open":""}`}>
        <div className="sp-head"><div className="sp-title">安裝費用試算</div><button className="close-btn" onClick={()=>setInstOpen(false)}><CloseIcon/></button></div>
        <div className="sp-body">
          {instDone?(<div style={{textAlign:"center",padding:"48px 0",color:"var(--green)",lineHeight:2,fontSize:14}}>申請已送出<br/><span style={{fontSize:11,color:"var(--muted)"}}>專員將於 1-2 個工作日確認時間</span><br/><button className="btn-outline" style={{marginTop:16}} onClick={resetInst}>重新試算</button></div>):(
            <><div className="inst-hint">本服務僅限室內崁燈，最低出勤費 NT$2,000。<br/>出發地：桃園市八德區。</div>
              <div style={{marginBottom:18}}>
                <div className="ip-sec-title">選擇安裝地點區域</div>
                <div className="region-grid">{INSTALL_REGIONS.map(r=>(<div key={r.id} className={`region-card ${instRegion===r.id?"on":""}`} onClick={()=>setInstRegion(r.id)}><div className="rc-label">{r.label}</div><div className="rc-km">{r.km}</div><div className="rc-fee">{r.travel===null?"另議":`NT$ ${r.travel.toLocaleString()}`}</div>{r.freeAt&&<div className="rc-free">{r.freeAt} 盞以上免收</div>}</div>))}</div>
              </div>
              <div style={{marginBottom:18}}>
                <div className="ip-sec-title">安裝數量 ＆ 天花高度</div>
                {instGroups.map((g,i)=>(<div key={i} className="group-row"><select className="gr-sel" value={g.ceilingId} onChange={e=>setInstGroups(gs=>gs.map((x,j)=>j===i?{...x,ceilingId:e.target.value}:x))}>{CEILING_GROUPS.map(c=><option key={c.id} value={c.id}>{c.label}{c.surcharge===null?" — 另議":c.surcharge>0?` +NT$${c.surcharge}/盞`:""}</option>)}</select><input className="gr-qty" type="number" min="1" value={g.qty} onChange={e=>setInstGroups(gs=>gs.map((x,j)=>j===i?{...x,qty:e.target.value}:x))}/><span style={{fontSize:10,color:"var(--muted)"}}>盞</span>{instGroups.length>1&&<button style={{background:"none",border:"none",cursor:"pointer",color:"var(--muted)",display:"flex"}} onClick={()=>setInstGroups(gs=>gs.filter((_,j)=>j!==i))}><CloseIcon/></button>}</div>))}
                <button style={{padding:"6px 14px",background:"transparent",border:"0.5px solid var(--bdr)",color:"var(--muted)",fontFamily:"'Noto Sans TC',sans-serif",fontSize:"7px",letterSpacing:"2px",cursor:"pointer",textTransform:"uppercase"}} onClick={()=>setInstGroups(gs=>[...gs,{ceilingId:"std",qty:1}])}>新增不同高度</button>
              </div>
              {instCalc&&<div className="calc-box">
                <div className="calc-row"><span>安裝工資（{instCalc.totalQty} 盞）</span><span>NT$ {instCalc.laborTotal.toLocaleString()}</span></div>
                <div className="calc-row"><span>車馬費</span><span>{instCalc.travelFee===null?"另議":instCalc.travelFee===0?<span style={{color:"var(--green)"}}>免收</span>:`NT$ ${instCalc.travelFee.toLocaleString()}`}</span></div>
                {instCalc.hasVHigh&&<div className="calc-warn">4.5m 以上安全紅線，需提供合格鷹架或高空作業車，工資另計。</div>}
                {!instCalc.hasVHigh&&instCalc.travelFee!==null&&<div className="calc-row total"><span>預估合計</span><span>NT$ {(instCalc.laborTotal+(instCalc.travelFee||0)).toLocaleString()}</span></div>}
                {instCalc.needStay&&<div className="stay-notice">本案場符合「遠程差旅條款」，需另計住宿費（NT$2,000/人/晚）及誤餐費（NT$500/人/日）。</div>}
                {instCalc.reg.freeAt&&instCalc.totalQty<instCalc.reg.freeAt&&<div style={{fontSize:9,color:"#6a5a4a",marginTop:6}}>再增加 {instCalc.reg.freeAt-instCalc.totalQty} 盞可免車馬費（省 NT$ {instCalc.reg.travel.toLocaleString()}）</div>}
              </div>}
              <div style={{marginTop:14}}><div className="ip-sec-title">備註</div><textarea style={{width:"100%",padding:9,border:"0.5px solid var(--bdr)",background:"transparent",fontFamily:"'Noto Sans TC',sans-serif",fontSize:12,outline:"none",resize:"vertical",minHeight:56}} value={instNote} onChange={e=>setInstNote(e.target.value)} placeholder="安裝地址、偏好時段、特殊現場說明等"/></div>
            </>
          )}
        </div>
        {!instDone&&<div className="sp-foot"><button className="btn-gold" onClick={submitInst} disabled={!instRegion}>送出安裝申請</button><button className="btn-ghost" onClick={()=>setInstOpen(false)}>稍後再說</button></div>}
      </div>

      {toast&&<div className="toast">{toast}</div>}
    </div>
    </>
  );
}
