import { useState, useRef, useEffect } from "react";

// ─────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────
const FORMSPREE_ID = "YOUR_FORM_ID";

const INIT_MEMBERS = [
  { id:1, username:"xxx3903052", password:"zzz3909086", name:"管理員", position:"管理者", company:"Ledoux Taiwan", phone:"", email:"", taxId:"", role:"admin", status:"approved", approvedAt:"2026-04-18" },
];

const INIT_PRODUCTS = [
  { id:1,  model:"HB.D110-N", series:"HEPBURN", category:"崁燈", watt:"10W", cct:"3000K / 4000K", beam:"24°", voltage:"220V", cri:"Ra≥90", color:"白色", cutout:"Ø95mm", install:"崁入式", shipping:90, stdPrice:1200, projPrice:980, desc:"極簡主義崁燈，鋁合金一體成型，隱藏光源設計", images:["https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Light-HB.D110-White-300x300.png"], video:"", note:"" },
  { id:2,  model:"HB.D120",   series:"HEPBURN", category:"崁燈", watt:"12W", cct:"3000K / 4000K", beam:"24°", voltage:"220V", cri:"Ra≥90", color:"白色", cutout:"Ø108mm", install:"崁入式", shipping:90, stdPrice:1380, projPrice:1120, desc:"Hepburn 系列經典款，優雅比例與高效能光源的完美結合", images:["https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Light-HB.D120-White-300x300.png"], video:"", note:"" },
  { id:3,  model:"HB.D130",   series:"HEPBURN", category:"崁燈", watt:"15W", cct:"3000K / 4000K", beam:"24°", voltage:"220V", cri:"Ra≥90", color:"白色", cutout:"Ø130mm", install:"崁入式", shipping:90, stdPrice:1580, projPrice:1280, desc:"15W 高效輸出，適合商業空間重點照明", images:["https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Light-HB.D130-240x300.jpg"], video:"", note:"" },
  { id:4,  model:"HB.D215",   series:"HEPBURN", category:"崁燈", watt:"20W", cct:"3000K / 4000K", beam:"36°", voltage:"220V", cri:"Ra≥90", color:"白色", cutout:"Ø150mm", install:"崁入式", shipping:100, stdPrice:1980, projPrice:1600, desc:"寬角度洗牆設計，均勻漫射光創造空間層次", images:["https://www.ledouxlight.com/wp-content/uploads/2023/01/Led-Recessed-Light-HB.D215-240x300.png"], video:"", note:"" },
  { id:5,  model:"HB.D230",   series:"HEPBURN", category:"崁燈", watt:"25W", cct:"3000K / 4000K", beam:"36°", voltage:"220V", cri:"Ra≥90", color:"白色", cutout:"Ø175mm", install:"崁入式", shipping:100, stdPrice:2280, projPrice:1860, desc:"25W 旗艦崁燈，適合高挑空間與精品陳列", images:["https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Light-HB.D230-240x300.jpg"], video:"", note:"" },
  { id:6,  model:"HB.D430",   series:"HEPBURN", category:"崁燈", watt:"30W", cct:"3000K / 4000K", beam:"36°", voltage:"220V", cri:"Ra≥90", color:"白色", cutout:"Ø200mm", install:"崁入式", shipping:120, stdPrice:2880, projPrice:2350, desc:"最大功率款，博物館與精品店首選", images:["https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Light-HB.D430-240x300.jpg"], video:"", note:"" },
  { id:7,  model:"NDB0306-C", series:"BLADE",   category:"崁燈", watt:"6W",  cct:"3000K / 4000K", beam:"24°", voltage:"220V", cri:"Ra≥80", color:"白色", cutout:"Ø75mm", install:"崁入式", shipping:75, stdPrice:780,  projPrice:630, desc:"Blade 超薄系列，燈體極致纖薄，存在感歸零", images:["https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Light-NDB0306-C-240x300.jpg"], video:"", note:"" },
  { id:8,  model:"NDB0309-C", series:"BLADE",   category:"崁燈", watt:"9W",  cct:"3000K / 4000K", beam:"24°", voltage:"220V", cri:"Ra≥80", color:"白色", cutout:"Ø85mm", install:"崁入式", shipping:75, stdPrice:920,  projPrice:750, desc:"9W 版本，天花板的隱形光源解決方案", images:["https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Light-NDB0309-C-240x300.jpg"], video:"", note:"" },
  { id:9,  model:"DFB0206-C", series:"METIS",   category:"崁燈", watt:"6W",  cct:"3000K / 4000K", beam:"40°", voltage:"220V", cri:"Ra≥90", color:"白色", cutout:"Ø75mm", install:"崁入式", shipping:75, stdPrice:1100, projPrice:890, desc:"Metis 系列純鋁鍛造散熱，長壽命設計", images:["https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Ceiling-Light-DFB0206-C-300x300.png"], video:"", note:"" },
  { id:10, model:"DFB0225-C", series:"METIS",   category:"崁燈", watt:"25W", cct:"3000K / 4000K", beam:"40°", voltage:"220V", cri:"Ra≥90", color:"白色", cutout:"Ø175mm", install:"崁入式", shipping:100, stdPrice:2680, projPrice:2180, desc:"25W 大功率版本，展示空間的最佳選擇", images:["https://www.ledouxlight.com/wp-content/uploads/2023/01/Led-Recessed-Ceiling-Light-DFB0225-C-1.png"], video:"", note:"" },
  { id:11, model:"TSU0506-C", series:"EOS",     category:"軌道燈", watt:"6W",  cct:"3000K / 4000K", beam:"24°", voltage:"220V", cri:"Ra≥80", color:"白色", cutout:"—", install:"軌道式", shipping:75, stdPrice:980,  projPrice:800, desc:"EOS 系列入門款，纖薄機身整合散熱模組", images:["https://www.ledouxlight.com/wp-content/uploads/2022/05/LED-Track-Light-TSU0506-C-240x300.jpg"], video:"", note:"" },
  { id:12, model:"TSU0515-C", series:"EOS",     category:"軌道燈", watt:"15W", cct:"3000K / 4000K", beam:"24°", voltage:"220V", cri:"Ra≥80", color:"白色", cutout:"—", install:"軌道式", shipping:90, stdPrice:1380, projPrice:1120, desc:"15W 精準投射，服飾與珠寶陳列專用", images:["https://www.ledouxlight.com/wp-content/uploads/2022/05/Led-Track-Light-TSU0515-White-240x300.jpg"], video:"", note:"" },
  { id:13, model:"TSU0823-C", series:"EOS",     category:"軌道燈", watt:"23W", cct:"3000K / 4000K", beam:"36°", voltage:"220V", cri:"Ra≥80", color:"白色", cutout:"—", install:"軌道式", shipping:90, stdPrice:1880, projPrice:1530, desc:"23W 大角度版，空間氛圍渲染首選", images:["https://www.ledouxlight.com/wp-content/uploads/2023/01/EOS-LED-Track-Light-TSU0823-C-1.png"], video:"", note:"" },
  { id:14, model:"HB.T130S",  series:"HEPBURN", category:"軌道燈", watt:"30W", cct:"3000K / 4000K", beam:"24°", voltage:"220V", cri:"Ra≥90", color:"白色", cutout:"—", install:"軌道式", shipping:120, stdPrice:2480, projPrice:2020, desc:"Hepburn 軌道旗艦，30W 極致輸出", images:["https://www.ledouxlight.com/wp-content/uploads/2023/01/Led-Track-Light-HB.T130S-300x300.png"], video:"", note:"" },
  { id:15, model:"TSU0206-1", series:"THEIA",   category:"軌道燈", watt:"6W",  cct:"3000K / 4000K", beam:"24°", voltage:"220V", cri:"Ra≥80", color:"白色", cutout:"—", install:"軌道式", shipping:75, stdPrice:980,  projPrice:800, desc:"Theia 系列，180° 可調角度，靈活定向", images:["https://www.ledouxlight.com/wp-content/uploads/2022/05/TSU0206-1-241x300.png"], video:"", note:"" },
  { id:16, model:"TSU0212-1", series:"THEIA",   category:"軌道燈", watt:"12W", cct:"3000K / 4000K", beam:"24°", voltage:"220V", cri:"Ra≥80", color:"白色", cutout:"—", install:"軌道式", shipping:90, stdPrice:1280, projPrice:1040, desc:"12W 強化版，精品零售空間標準配置", images:["https://www.ledouxlight.com/wp-content/uploads/2022/05/TSU0212-1-241x300.png"], video:"", note:"" },
  { id:17, model:"DC.TS0110-C", series:"48V MAGNETIC", category:"磁吸系統", watt:"10W", cct:"3000K / 4000K", beam:"20°", voltage:"48V DC", cri:"Ra≥90", color:"白色", cutout:"—", install:"磁吸嵌入", shipping:100, stdPrice:2380, projPrice:1940, desc:"48V 磁吸模組，無工具快速安裝，現代設計首選", images:["https://www.ledouxlight.com/wp-content/uploads/2022/05/48V-Led-Track-Light-DC.TS0110-C-241x300.jpg"], video:"", note:"" },
  { id:18, model:"DC.TS0120-C", series:"48V MAGNETIC", category:"磁吸系統", watt:"20W", cct:"3000K / 4000K", beam:"20°", voltage:"48V DC", cri:"Ra≥90", color:"白色", cutout:"—", install:"磁吸嵌入", shipping:100, stdPrice:2980, projPrice:2430, desc:"20W 高輸出磁吸燈，藝廊與精品空間專用", images:["https://www.ledouxlight.com/wp-content/uploads/2022/05/48V-Led-Track-Light-DC.TS0120-C-241x300.jpg"], video:"", note:"" },
  { id:19, model:"DC.TS0130-C", series:"48V MAGNETIC", category:"磁吸系統", watt:"30W", cct:"3000K / 4000K", beam:"20°", voltage:"48V DC", cri:"Ra≥90", color:"白色", cutout:"—", install:"磁吸嵌入", shipping:120, stdPrice:3580, projPrice:2920, desc:"30W 旗艦磁吸，最高端照明解決方案", images:["https://www.ledouxlight.com/wp-content/uploads/2022/05/48V-Led-Track-Light-DC.TS0130-C-241x300.jpg"], video:"", note:"" },
  { id:20, model:"DC.TS0206-C", series:"48V MAGNETIC", category:"磁吸系統", watt:"6W",  cct:"3000K / 4000K", beam:"20°", voltage:"48V DC", cri:"Ra≥90", color:"白色", cutout:"—", install:"磁吸嵌入", shipping:90, stdPrice:1980, projPrice:1620, desc:"入門磁吸款，系統彈性配置的理想起點", images:["https://www.ledouxlight.com/wp-content/uploads/2022/05/48V-Led-Track-Light-DC.TS0206-C--241x300.jpg"], video:"", note:"" },
  { id:21, model:"CSU0515-C",   series:"EOS",   category:"吸頂燈", watt:"15W", cct:"3000K / 4000K", beam:"36°", voltage:"220V", cri:"Ra≥80", color:"白色", cutout:"—", install:"吸頂式", shipping:90, stdPrice:1580, projPrice:1290, desc:"EOS 吸頂款，無需開孔直接安裝", images:["https://www.ledouxlight.com/wp-content/uploads/2022/05/Surface-Mount-CSU0510-C-240x300.jpg"], video:"", note:"" },
  { id:22, model:"CSA0206-1",   series:"THEIA", category:"吸頂燈", watt:"6W",  cct:"3000K / 4000K", beam:"24°", voltage:"220V", cri:"Ra≥80", color:"白色", cutout:"—", install:"吸頂式", shipping:75, stdPrice:1080, projPrice:880, desc:"Theia 吸頂 6W，住宅走廊首選", images:["https://www.ledouxlight.com/wp-content/uploads/2022/05/CSA0206-1-241x300.png"], video:"", note:"" },
  { id:23, model:"CSA0212-1",   series:"THEIA", category:"吸頂燈", watt:"12W", cct:"3000K / 4000K", beam:"24°", voltage:"220V", cri:"Ra≥80", color:"白色", cutout:"—", install:"吸頂式", shipping:90, stdPrice:1380, projPrice:1120, desc:"12W 加強版，商業走廊與接待廳適用", images:["https://www.ledouxlight.com/wp-content/uploads/2022/05/CSA0212-1-241x300.png"], video:"", note:"" },
];

const COMPANY = {
  name:"台灣諾科照明有限公司", eng:"Ledoux Lighting Taiwan Co., Ltd.",
  addr:"台灣", tel:"", fax:"", email:"info@ledouxlight.com", taxId:"",
};

// synonym map for search
const SYNONYMS = {
  "坎灯":"崁燈","坎燈":"崁燈","崁灯":"崁燈","嵌灯":"崁燈","嵌燈":"崁燈",
  "轨道灯":"軌道燈","导轨灯":"軌道燈","磁吸灯":"磁吸系統","磁吸燈":"磁吸系統",
  "吸顶灯":"吸頂燈","吸顶燈":"吸頂燈","壁灯":"壁燈","户外灯":"戶外燈",
  "珠宝灯":"軌道燈","珠寶燈":"軌道燈","jewelry":"軌道燈",
  "110v":"110V","220v":"220V","48v":"48V DC","ac110":"110V","ac220":"220V",
  "调光":"調光","调色":"調色","dimming":"調光",
  "软条灯":"線燈","鋁條燈":"線燈","线灯":"線燈","led strip":"線燈",
  "防水":"戶外燈","outdoor":"戶外燈","ip65":"戶外燈",
  "hepburn":"HEPBURN","blade":"BLADE","metis":"METIS","eos":"EOS","theia":"THEIA","magnetic":"48V MAGNETIC",
};

const HOT_KEYWORDS = ["崁燈","軌道燈","磁吸系統","HEPBURN","EOS","10W","調光","珠寶燈","防水","48V"];

// ─────────────────────────────────────────────
//  CSS
// ─────────────────────────────────────────────
const G = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Noto+Sans+TC:wght@200;300;400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--ivory:#f7f4ef;--ivory2:#efe9e0;--black:#0e0d0c;--black2:#1c1a18;--gold:#b8935a;--gold2:#d4a96a;--muted:#8a8278;--bdr:#d8d0c4;--bdr2:#e8e2d8;--red:#9b3a3a;--green:#3a6b4a}
body{background:var(--ivory);color:var(--black);font-family:'Noto Sans TC',sans-serif;font-weight:300;-webkit-font-smoothing:antialiased}

/* AUTH */
.auth-page{min-height:100vh;display:grid;grid-template-columns:1fr 1fr;background:var(--black)}
@media(max-width:768px){.auth-page{grid-template-columns:1fr}.auth-visual{display:none}}
.auth-visual{background:linear-gradient(160deg,#1a1612 0%,#0e0d0c 100%);display:flex;flex-direction:column;justify-content:flex-end;padding:64px;border-right:1px solid #2a2520;position:relative;overflow:hidden}
.auth-visual::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 30% 60%,rgba(184,147,90,.08) 0%,transparent 60%)}
.av-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:auto}
.av-logo{font-family:'Cormorant Garamond',serif;font-size:13px;letter-spacing:8px;color:var(--gold);text-transform:uppercase}
.av-year{font-size:9px;letter-spacing:3px;color:#3a3028;text-transform:uppercase}
.av-title{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:300;color:#e8e0d4;letter-spacing:6px;text-transform:uppercase;margin:20px 0 6px}
.av-title-en{font-size:9px;letter-spacing:4px;color:#4a4038;text-transform:uppercase;margin-bottom:20px}
.av-desc{font-size:8px;letter-spacing:4px;color:#3a3028;text-transform:uppercase}
.av-line{width:100%;height:1px;background:linear-gradient(to right,transparent,#2e2820,transparent)}
.auth-form-side{background:var(--ivory);display:flex;align-items:center;justify-content:center;padding:48px 32px}
.auth-inner{width:100%;max-width:400px}
.auth-logo-sm{font-family:'Cormorant Garamond',serif;font-size:22px;letter-spacing:4px;color:var(--black);margin-bottom:4px}
.auth-tagline{font-size:10px;letter-spacing:3px;color:var(--muted);text-transform:uppercase;margin-bottom:40px}
.auth-tabs{display:flex;border-bottom:1px solid var(--bdr);margin-bottom:32px}
.atab{flex:1;padding:12px;text-align:center;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);cursor:pointer;border-bottom:1px solid transparent;margin-bottom:-1px;transition:all .2s}
.atab.on{color:var(--black);border-bottom-color:var(--gold)}
.lf{margin-bottom:20px}
.lf label{display:block;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:8px}
.lf input{width:100%;padding:12px 0;background:transparent;border:none;border-bottom:1px solid var(--bdr);color:var(--black);font-family:'Noto Sans TC',sans-serif;font-size:13px;outline:none;transition:border-color .2s;border-radius:0}
.lf input:focus{border-bottom-color:var(--gold)}
.lf input.err-input{border-bottom-color:var(--red)}
.lf input::placeholder{color:var(--bdr)}
.ferr{font-size:10px;color:var(--red);margin-top:5px}
.req{color:var(--gold);margin-left:2px}
.r2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.sec-lbl{font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);text-align:center;margin:24px 0 20px;position:relative}
.sec-lbl::before,.sec-lbl::after{content:'';position:absolute;top:50%;width:30%;height:1px;background:var(--bdr2)}
.sec-lbl::before{left:0}.sec-lbl::after{right:0}
.btn-primary{width:100%;padding:14px;background:var(--black);border:none;color:var(--ivory);font-family:'Noto Sans TC',sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;transition:background .2s;margin-top:8px}
.btn-primary:hover{background:var(--black2)}
.btn-primary:disabled{opacity:.4;cursor:not-allowed}
.btn-bio{width:100%;padding:12px;background:transparent;border:1px solid var(--bdr);color:var(--muted);font-family:'Noto Sans TC',sans-serif;font-size:10px;letter-spacing:2px;cursor:pointer;transition:all .2s;margin-top:10px;display:flex;align-items:center;justify-content:center;gap:8px}
.btn-bio:hover{border-color:var(--gold);color:var(--gold)}
.auth-hint{font-size:10px;color:var(--muted);text-align:center;margin-top:20px;line-height:1.8;letter-spacing:.5px}
.auth-err{font-size:11px;color:var(--red);text-align:center;margin-top:14px}
.first-notice{background:#f9f5ee;border:1px solid var(--gold);border-left:3px solid var(--gold);padding:12px 16px;margin-bottom:24px;font-size:11px;color:var(--gold);line-height:1.7}

/* INFO */
.info-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--ivory);padding:24px}
.info-card{max-width:480px;width:100%;border:1px solid var(--bdr);padding:56px 48px;text-align:center}
.info-icon{font-size:40px;margin-bottom:24px}
.info-title{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:400;margin-bottom:8px}
.info-sub{font-size:11px;color:var(--gold);letter-spacing:2px;text-transform:uppercase;margin-bottom:24px}
.info-desc{font-size:12px;color:var(--muted);line-height:1.9;margin-bottom:28px}
.info-table{text-align:left;border-top:1px solid var(--bdr2)}
.info-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--bdr2);font-size:12px}
.info-row span:first-child{color:var(--muted)}
.btn-outline{padding:12px 32px;background:transparent;border:1px solid var(--black);color:var(--black);font-family:'Noto Sans TC',sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;margin-top:28px;transition:all .2s}
.btn-outline:hover{background:var(--black);color:var(--ivory)}

/* APP */
.app{min-height:100vh;background:var(--ivory);display:flex;flex-direction:column}
.topnav{background:var(--black);color:var(--ivory);display:flex;align-items:center;justify-content:space-between;padding:0 28px;height:56px;position:sticky;top:0;z-index:50;border-bottom:1px solid #1e1c18}
.tn-left{display:flex;align-items:center;gap:20px}
.tn-hamburger{background:none;border:none;cursor:pointer;display:flex;flex-direction:column;gap:5px;padding:6px}
.tn-hamburger span{display:block;width:22px;height:1px;background:#8a7a6a;transition:all .25s}
.tn-hamburger:hover span{background:var(--gold)}
.tn-logo{font-family:'Cormorant Garamond',serif;font-size:15px;letter-spacing:5px;color:var(--gold);text-transform:uppercase}
.tn-right{display:flex;align-items:center;gap:16px}
.tn-user{text-align:right}
.tn-uname{font-size:11px;color:var(--ivory)}
.tn-urole{font-size:9px;color:#6a5a4a;letter-spacing:1px;margin-top:1px}
.tn-badge{font-size:8px;padding:2px 8px;border:1px solid;letter-spacing:1px}
.tb-admin{color:#c45a5a;border-color:rgba(196,90,90,.4)}
.tb-vip{color:var(--gold);border-color:rgba(184,147,90,.4)}
.tb-standard{color:#8a7a6a;border-color:#3a3530}
.btn-out2{padding:6px 14px;background:transparent;border:1px solid #2a2520;color:#6a5a4a;font-family:'Noto Sans TC',sans-serif;font-size:9px;letter-spacing:2px;cursor:pointer;transition:all .2s}
.btn-out2:hover{border-color:#c45a5a;color:#c45a5a}
.icon-btn{position:relative;background:none;border:none;color:#8a7a6a;cursor:pointer;padding:4px;font-size:20px;display:flex;align-items:center}
.icon-btn:hover{color:var(--gold)}
.icon-badge{position:absolute;top:-4px;right:-4px;background:var(--gold);color:var(--black);font-size:8px;border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-weight:500}
.icon-badge.red{background:var(--red);color:#fff}

/* SEARCH BAR */
.search-wrap{position:relative;flex:1;max-width:360px}
.search-input{width:100%;padding:8px 14px 8px 36px;background:#1a1814;border:1px solid #2a2520;color:var(--ivory);font-family:'Noto Sans TC',sans-serif;font-size:12px;outline:none;border-radius:0;transition:border-color .2s}
.search-input:focus{border-color:var(--gold)}
.search-input::placeholder{color:#4a4038}
.search-icon{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#4a4038;font-size:14px;pointer-events:none}
.search-clear{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;color:#4a4038;cursor:pointer;font-size:16px;display:flex;align-items:center}
.search-clear:hover{color:var(--ivory)}
.search-dropdown{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#1a1814;border:1px solid #2a2520;z-index:200;max-height:320px;overflow-y:auto}
.sd-section{padding:8px 14px 4px;font-size:8px;letter-spacing:2px;text-transform:uppercase;color:#3a3028}
.sd-item{padding:9px 14px;font-size:12px;color:#8a7a6a;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:8px}
.sd-item:hover{background:#261e18;color:var(--ivory)}
.sd-item.highlight{color:var(--gold)}

/* SIDEMENU */
.sidemenu-overlay{position:fixed;inset:0;background:rgba(14,13,12,.5);z-index:100}
.sidemenu{position:fixed;top:0;left:0;bottom:0;width:300px;background:var(--black);z-index:101;display:flex;flex-direction:column;transform:translateX(-100%);transition:transform .3s cubic-bezier(.4,0,.2,1)}
.sidemenu.open{transform:translateX(0)}
.sm-head{padding:20px 24px 16px;border-bottom:1px solid #1e1c18;display:flex;align-items:center;justify-content:space-between}
.sm-logo{font-family:'Cormorant Garamond',serif;font-size:14px;letter-spacing:5px;color:var(--gold)}
.sm-close{background:none;border:none;color:#6a5a4a;font-size:18px;cursor:pointer}
.sm-close:hover{color:var(--ivory)}
.sm-user{padding:20px 24px;border-bottom:1px solid #1e1c18}
.sm-uname{font-size:13px;color:var(--ivory);font-weight:400}
.sm-ucomp{font-size:10px;color:#6a5a4a;margin-top:3px}
.sm-ubadge{font-size:8px;padding:2px 8px;border:1px solid;letter-spacing:1px;display:inline-block;margin-top:8px}
.sm-nav{flex:1;padding:12px 0;overflow-y:auto}
.sm-section{padding:10px 24px 4px;font-size:8px;letter-spacing:3px;text-transform:uppercase;color:#3a3028}
.sm-item{display:flex;align-items:center;justify-content:space-between;padding:12px 24px 12px 28px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6a5a4a;cursor:pointer;transition:all .15s;border-left:2px solid transparent}
.sm-item:hover{color:var(--ivory);background:#161410}
.sm-item.on{color:var(--gold);border-left-color:var(--gold);background:rgba(184,147,90,.05)}
.sm-group-header{display:flex;align-items:center;justify-content:space-between;padding:10px 24px 10px 28px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#5a5048;cursor:pointer;transition:all .15s}
.sm-group-header:hover{color:#8a7a6a}
.sm-group-arrow{font-size:10px;transition:transform .2s}
.sm-group-arrow.open{transform:rotate(90deg)}
.sm-sub{display:flex;align-items:center;padding:8px 24px 8px 40px;font-size:10px;letter-spacing:1px;color:#4a4038;cursor:pointer;transition:all .15s}
.sm-sub:hover{color:#8a7a6a}
.sm-sub.on{color:var(--gold)}
.sm-dot{width:4px;height:4px;border-radius:50%;background:currentColor;margin-right:10px;opacity:.6}
.sm-badge{min-width:18px;height:18px;background:#9b3a3a;color:#fff;font-size:9px;border-radius:9px;display:flex;align-items:center;justify-content:center;padding:0 5px}
.sm-divider{height:1px;background:#1e1c18;margin:8px 24px}
.sm-foot{padding:16px 24px;border-top:1px solid #1e1c18}
.btn-out3{width:100%;padding:10px;background:transparent;border:1px solid #2a2520;color:#6a5a4a;font-family:'Noto Sans TC',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;transition:all .2s}
.btn-out3:hover{border-color:#9b3a3a;color:#9b3a3a}

/* CONTENT */
.content{flex:1;padding:48px;max-width:1400px;margin:0 auto;width:100%}
@media(max-width:768px){.content{padding:24px 16px}}
.phead{margin-bottom:40px;display:flex;align-items:flex-end;justify-content:space-between;border-bottom:1px solid var(--bdr2);padding-bottom:24px}
.ptitle{font-family:'Cormorant Garamond',serif;font-size:36px;font-weight:300;color:var(--black);line-height:1}
.psub{font-size:10px;letter-spacing:2px;color:var(--muted);text-transform:uppercase;margin-top:8px}
.pcount{font-size:11px;color:var(--muted)}

/* CATBAR */
.catbar{display:flex;gap:0;margin-bottom:36px;border-bottom:1px solid var(--bdr2);overflow-x:auto}
.catbtn{padding:12px 24px;background:transparent;border:none;border-bottom:2px solid transparent;color:var(--muted);font-family:'Noto Sans TC',sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;white-space:nowrap;margin-bottom:-1px;transition:all .2s}
.catbtn:hover{color:var(--black)}
.catbtn.on{color:var(--black);border-bottom-color:var(--gold)}

/* PRODUCT GRID */
.pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1px;background:var(--bdr2);border:1px solid var(--bdr2)}
.pcard{background:var(--ivory);cursor:pointer;transition:background .2s;display:flex;flex-direction:column}
.pcard:hover{background:#f2ece3}
.pcard:hover .pcard-img img{transform:scale(1.04)}
.pcard-img{height:200px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#f0ebe2}
.pcard-img img{max-height:175px;max-width:80%;object-fit:contain;transition:transform .4s ease}
.pcard-body{padding:20px 22px 24px;flex:1;display:flex;flex-direction:column}
.pcard-series{font-size:8px;letter-spacing:3px;text-transform:uppercase;color:var(--gold);margin-bottom:5px}
.pcard-model{font-size:16px;font-family:'Cormorant Garamond',serif;font-weight:400;color:var(--black);margin-bottom:6px}
.pcard-desc{font-size:11px;color:var(--muted);line-height:1.7;margin-bottom:14px;flex:1}
.pcard-tags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}
.ptag{font-size:9px;padding:3px 8px;border:1px solid var(--bdr);color:var(--muted);letter-spacing:1px}
.pcard-price{border-top:1px solid var(--bdr2);padding-top:14px;display:flex;justify-content:space-between;align-items:flex-end}
.price-std-val{font-family:'Cormorant Garamond',serif;font-size:20px;color:var(--black)}
.price-proj-val{font-family:'Cormorant Garamond',serif;font-size:16px;color:var(--muted)}
.price-proj-label{font-size:8px;letter-spacing:1px;color:var(--muted)}

/* DRAWER */
.drawer-overlay{position:fixed;inset:0;background:rgba(14,13,12,.6);z-index:200;display:flex;justify-content:flex-end;backdrop-filter:blur(2px)}
.drawer{width:520px;max-width:95vw;background:var(--ivory);height:100vh;overflow-y:auto;display:flex;flex-direction:column;box-shadow:-20px 0 60px rgba(0,0,0,.15)}
.drawer-top{padding:28px 32px;border-bottom:1px solid var(--bdr2);display:flex;justify-content:space-between;align-items:center}
.drawer-series{font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--gold)}
.drawer-close{background:none;border:none;font-size:20px;color:var(--muted);cursor:pointer}
.drawer-close:hover{color:var(--black)}
.carousel{position:relative;height:280px;background:#f0ebe2;overflow:hidden}
.carousel-img{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
.carousel-img img{max-height:250px;object-fit:contain}
.carousel-prev,.carousel-next{position:absolute;top:50%;transform:translateY(-50%);background:rgba(14,13,12,.3);border:none;color:#fff;width:32px;height:32px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:background .2s}
.carousel-prev{left:8px}.carousel-next{right:8px}
.carousel-prev:hover,.carousel-next:hover{background:rgba(14,13,12,.7)}
.carousel-dots{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);display:flex;gap:6px}
.cdot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.5);cursor:pointer;transition:background .2s}
.cdot.on{background:#fff}
.drawer-body{padding:32px;flex:1}
.drawer-model{font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:300;margin-bottom:6px}
.drawer-desc{font-size:12px;color:var(--muted);line-height:1.8;margin-bottom:20px}
.spec-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px}
.spec-item{border:1px solid var(--bdr2);padding:10px 14px}
.spec-label{font-size:8px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:4px}
.spec-val{font-size:12px;color:var(--black);font-weight:400}
.drawer-video{margin-bottom:20px}
.drawer-video iframe{width:100%;height:200px;border:none}
.drawer-note{background:#f4efe8;border-left:2px solid var(--gold);padding:10px 14px;font-size:11px;color:var(--muted);line-height:1.7;margin-bottom:20px}
.price-block{border-top:1px solid var(--bdr2);padding-top:20px;display:flex;gap:32px;align-items:flex-end;flex-wrap:wrap}
.pb-label{font-size:8px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:4px}
.pb-val{font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:300;color:var(--black)}
.pb-val.gold{color:var(--gold)}
.drawer-actions{margin-top:24px;display:flex;gap:10px;flex-wrap:wrap}
.btn-add-cart{flex:1;padding:12px;background:var(--black);border:none;color:var(--ivory);font-family:'Noto Sans TC',sans-serif;font-size:10px;letter-spacing:2px;cursor:pointer;transition:background .2s;min-width:120px}
.btn-add-cart:hover{background:var(--black2)}
.btn-add-cart-gold{background:var(--gold);color:var(--black)}
.btn-add-cart-gold:hover{background:var(--gold2)}
.btn-sample{flex:1;padding:12px;background:transparent;border:1px solid var(--gold);color:var(--gold);font-family:'Noto Sans TC',sans-serif;font-size:10px;letter-spacing:2px;cursor:pointer;transition:all .2s;min-width:120px}
.btn-sample:hover{background:var(--gold);color:var(--black)}
.btn-sample.requested{border-color:var(--green);color:var(--green);cursor:default}

/* ADMIN */
.stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--bdr2);border:1px solid var(--bdr2);margin-bottom:36px}
.stat-box{background:var(--ivory);padding:24px 28px}
.stat-num{font-family:'Cormorant Garamond',serif;font-size:40px;font-weight:300;color:var(--black)}
.stat-lbl{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-top:4px}
.tbl-wrap{border:1px solid var(--bdr2);overflow:auto}
table{width:100%;border-collapse:collapse;min-width:600px}
th{text-align:left;font-size:8px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);padding:10px 14px;border-bottom:1px solid var(--bdr2);background:#f4efe8;font-weight:400}
td{padding:12px 14px;border-bottom:1px solid var(--bdr2);font-size:12px;color:var(--black)}
tr:last-child td{border-bottom:none}
tr:hover td{background:#f7f2eb}
.rb{font-size:8px;padding:2px 8px;letter-spacing:1px;text-transform:uppercase;border:1px solid;display:inline-block}
.r-admin{color:#9b3a3a;border-color:rgba(155,58,58,.4);background:rgba(155,58,58,.06)}
.r-vip{color:var(--gold);border-color:rgba(184,147,90,.4);background:rgba(184,147,90,.06)}
.r-standard{color:var(--muted);border-color:var(--bdr)}
.role-sel{background:transparent;border:1px solid var(--bdr);color:var(--black);padding:4px 8px;font-size:11px;font-family:'Noto Sans TC',sans-serif;cursor:pointer}
.btn-ok{font-size:10px;padding:5px 12px;border:1px solid rgba(58,107,74,.5);background:transparent;color:var(--green);cursor:pointer;letter-spacing:1px;transition:all .2s}
.btn-ok:hover{background:rgba(58,107,74,.08)}
.btn-ng{font-size:10px;padding:5px 12px;border:1px solid rgba(155,58,58,.5);background:transparent;color:var(--red);cursor:pointer;letter-spacing:1px;transition:all .2s}
.btn-ng:hover{background:rgba(155,58,58,.08)}
.btn-del2{background:none;border:none;color:var(--muted);cursor:pointer;font-size:14px}
.btn-del2:hover{color:var(--red)}
.btn-edit2{background:none;border:none;color:var(--muted);cursor:pointer;font-size:12px;letter-spacing:1px;text-decoration:underline}
.btn-edit2:hover{color:var(--gold)}
.btn-add2{padding:9px 20px;background:var(--black);border:none;color:var(--ivory);font-family:'Noto Sans TC',sans-serif;font-size:9px;letter-spacing:2px;cursor:pointer;transition:background .2s}
.btn-add2:hover{background:var(--black2)}
.empty{text-align:center;padding:60px;color:var(--muted);font-size:12px;letter-spacing:1px}
.form-panel{border:1px solid var(--bdr2);padding:28px;margin-bottom:24px;background:#f9f5ef}
.fp-title{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:300;margin-bottom:20px}
.fgrid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.ff{}
.ff.full{grid-column:1/-1}
.ff label{display:block;font-size:8px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:7px}
.ff input,.ff select,.ff textarea{width:100%;padding:10px 0;background:transparent;border:none;border-bottom:1px solid var(--bdr);color:var(--black);font-family:'Noto Sans TC',sans-serif;font-size:12px;outline:none;transition:border-color .2s;resize:vertical}
.ff input:focus,.ff select:focus,.ff textarea:focus{border-bottom-color:var(--gold)}
.ff select option{background:var(--ivory)}
.form-actions{margin-top:20px;display:flex;gap:12px}
.btn-confirm{padding:11px 28px;background:var(--black);border:none;color:var(--ivory);font-family:'Noto Sans TC',sans-serif;font-size:9px;letter-spacing:2px;cursor:pointer}
.btn-confirm:hover{background:var(--black2)}
.btn-cancel2{padding:11px 20px;background:transparent;border:1px solid var(--bdr);color:var(--muted);font-family:'Noto Sans TC',sans-serif;font-size:9px;letter-spacing:2px;cursor:pointer}

/* MODAL */
.modal-wrap{position:fixed;inset:0;background:rgba(14,13,12,.7);z-index:300;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(3px)}
.modal-box{background:var(--ivory);width:100%;max-width:560px;max-height:90vh;overflow-y:auto}
.modal-head{padding:24px 28px;border-bottom:1px solid var(--bdr2);display:flex;justify-content:space-between;align-items:center}
.modal-title{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:300}
.modal-close{background:none;border:none;font-size:18px;color:var(--muted);cursor:pointer}
.modal-body{padding:28px}
.applicant-card{background:#f4efe8;border:1px solid var(--bdr2);padding:16px;margin-bottom:24px}
.ac-name{font-size:14px;font-weight:400;margin-bottom:4px}
.ac-detail{font-size:11px;color:var(--muted);line-height:1.7}

/* CART PANEL */
.cart-panel{position:fixed;top:0;right:0;bottom:0;width:480px;max-width:100vw;background:var(--ivory);z-index:250;box-shadow:-20px 0 60px rgba(0,0,0,.15);display:flex;flex-direction:column;transform:translateX(100%);transition:transform .3s cubic-bezier(.4,0,.2,1)}
.cart-panel.open{transform:translateX(0)}
.cp-head{padding:24px 28px;border-bottom:1px solid var(--bdr2);display:flex;justify-content:space-between;align-items:center;flex-shrink:0}
.cp-title{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:300}
.cp-body{flex:1;overflow-y:auto;padding:20px 28px}
.ci-row{display:flex;gap:12px;padding:16px 0;border-bottom:1px solid var(--bdr2);align-items:flex-start}
.ci-img{width:60px;height:60px;background:#f0ebe2;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ci-img img{max-width:50px;max-height:50px;object-fit:contain}
.ci-info{flex:1;min-width:0}
.ci-model{font-family:'Cormorant Garamond',serif;font-size:15px;font-weight:400}
.ci-sub{font-size:10px;color:var(--muted);margin-top:2px}
.ci-qty{display:flex;align-items:center;gap:8px;margin-top:8px}
.qty-btn{width:24px;height:24px;border:1px solid var(--bdr);background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;color:var(--black)}
.qty-btn:hover{border-color:var(--gold)}
.qty-num{font-size:13px;min-width:20px;text-align:center}
.ci-price{font-family:'Cormorant Garamond',serif;font-size:16px;color:var(--black);white-space:nowrap}
.ci-del{background:none;border:none;color:var(--muted);cursor:pointer;font-size:16px;flex-shrink:0}
.ci-del:hover{color:var(--red)}
.cp-foot{padding:20px 28px;border-top:1px solid var(--bdr2);flex-shrink:0}
.cp-total{display:flex;justify-content:space-between;margin-bottom:16px}
.cp-total-lbl{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--muted)}
.cp-total-val{font-family:'Cormorant Garamond',serif;font-size:24px}
.cp-project{margin-bottom:12px}
.cp-project label{display:block;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:6px}
.cp-project input{width:100%;padding:10px;border:1px solid var(--bdr);background:transparent;font-family:'Noto Sans TC',sans-serif;font-size:13px;outline:none}
.cp-project input:focus{border-color:var(--gold)}
.btn-gen-pdf{width:100%;padding:14px;background:var(--black);border:none;color:var(--ivory);font-family:'Noto Sans TC',sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;margin-bottom:10px;transition:background .2s}
.btn-gen-pdf:hover{background:var(--black2)}
.btn-gen-pdf:disabled{opacity:.4;cursor:not-allowed}

/* CHECKLIST */
.checklist{background:#f4efe8;border:1px solid var(--bdr2);padding:16px;margin-bottom:14px}
.cl-title{font-size:11px;font-weight:400;margin-bottom:10px;color:var(--black)}
.cl-item{display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;font-size:11px;color:var(--muted);line-height:1.6;cursor:pointer}
.cl-item input[type=checkbox]{margin-top:2px;accent-color:var(--gold);flex-shrink:0;cursor:pointer}

/* TRANSFER */
.transfer-block{background:#f4efe8;border:1px solid var(--bdr2);padding:20px;margin-top:16px}
.tb-title{font-size:12px;font-weight:400;margin-bottom:12px;color:var(--black)}
.tb-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
.tb-field label{display:block;font-size:8px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:6px}
.tb-field input{width:100%;padding:8px 0;background:transparent;border:none;border-bottom:1px solid var(--bdr);font-family:'Noto Sans TC',sans-serif;font-size:12px;outline:none}
.tb-hint{font-size:11px;color:var(--muted);line-height:1.7;margin-bottom:12px}
.btn-transfer{width:100%;padding:11px;background:transparent;border:1px solid var(--gold);color:var(--gold);font-family:'Noto Sans TC',sans-serif;font-size:9px;letter-spacing:2px;cursor:pointer;transition:all .2s}
.btn-transfer:hover{background:var(--gold);color:var(--black)}
.btn-transfer:disabled{opacity:.4;cursor:not-allowed}

/* CATALOG */
.catalog-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:24px}
.cat-card{border:1px solid var(--bdr2);padding:24px;cursor:pointer;transition:all .2s;display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px;text-decoration:none;color:inherit}
.cat-card:hover{border-color:var(--gold);background:#f4efe8}
.cat-icon{font-size:32px}
.cat-name{font-size:12px;font-weight:400;color:var(--black)}
.cat-size{font-size:10px;color:var(--muted)}
.btn-upload{padding:11px 24px;background:transparent;border:1px solid var(--bdr);color:var(--muted);font-family:'Noto Sans TC',sans-serif;font-size:9px;letter-spacing:2px;cursor:pointer;transition:all .2s}
.btn-upload:hover{border-color:var(--gold);color:var(--gold)}
.upload-area{border:2px dashed var(--bdr);padding:40px;text-align:center;margin-bottom:24px;cursor:pointer;transition:all .2s}
.upload-area:hover,.upload-area.drag{border-color:var(--gold);background:#f9f5ee}
.upload-hint{font-size:11px;color:var(--muted);margin-top:8px}

/* IMG HINT */
.img-hint-box{background:#f4efe8;border:1px solid var(--bdr2);border-left:3px solid var(--gold);padding:12px 16px;font-size:11px;color:var(--muted);line-height:1.7;margin-bottom:16px}
.img-hint-box a{color:var(--gold);text-decoration:none}
.img-hint-box a:hover{text-decoration:underline}

/* SAMPLE */
.sample-panel{position:fixed;top:0;right:0;bottom:0;width:440px;max-width:100vw;background:var(--ivory);z-index:250;box-shadow:-20px 0 60px rgba(0,0,0,.15);display:flex;flex-direction:column;transform:translateX(100%);transition:transform .3s cubic-bezier(.4,0,.2,1)}
.sample-panel.open{transform:translateX(0)}
.sp-head{padding:24px 28px;border-bottom:1px solid var(--bdr2);display:flex;justify-content:space-between;align-items:center;flex-shrink:0}
.sp-title{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:300}
.sp-body{flex:1;overflow-y:auto;padding:24px 28px}
.sp-notice{background:#f4efe8;border-left:3px solid var(--gold);padding:12px 16px;font-size:11px;color:var(--muted);line-height:1.7;margin-bottom:20px}
.sp-items{margin-bottom:20px}
.sp-item{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--bdr2)}
.sp-item-img{width:44px;height:44px;background:#f0ebe2;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sp-item-img img{max-width:36px;max-height:36px;object-fit:contain}
.sp-item-info{flex:1;min-width:0}
.sp-item-model{font-size:13px;font-weight:400}
.sp-item-sub{font-size:10px;color:var(--muted);margin-top:2px}
.sp-item-del{background:none;border:none;color:var(--muted);cursor:pointer;font-size:14px}
.sp-item-del:hover{color:var(--red)}
.sp-form label{display:block;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:6px;margin-top:14px}
.sp-form input,.sp-form textarea{width:100%;padding:10px;border:1px solid var(--bdr);background:transparent;font-family:'Noto Sans TC',sans-serif;font-size:12px;outline:none;transition:border-color .2s}
.sp-form input:focus,.sp-form textarea:focus{border-color:var(--gold)}
.sp-foot{padding:20px 28px;border-top:1px solid var(--bdr2);flex-shrink:0}
.btn-submit-sample{width:100%;padding:14px;background:var(--gold);border:none;color:var(--black);font-family:'Noto Sans TC',sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;transition:background .2s;margin-bottom:8px}
.btn-submit-sample:hover{background:var(--gold2)}
.btn-submit-sample:disabled{opacity:.4;cursor:not-allowed}

/* TOAST */
.toast{position:fixed;bottom:32px;right:32px;background:var(--black);color:var(--ivory);padding:14px 22px;font-size:11px;letter-spacing:1px;z-index:999;border-left:3px solid var(--gold)}
`;

// ─────────────────────────────────────────────
//  PDF GENERATOR
// ─────────────────────────────────────────────
function generatePDF({ cart, projectName, customer, useProj }) {
  const today = new Date();
  const dateStr = `${today.getFullYear()}/${String(today.getMonth()+1).padStart(2,"0")}/${String(today.getDate()).padStart(2,"0")}`;
  const quoteNo = `Q${today.getFullYear()}${String(today.getMonth()+1).padStart(2,"0")}${String(today.getDate()).padStart(2,"0")}-${String(Math.floor(Math.random()*999)+1).padStart(3,"0")}`;
  const subtotal = cart.reduce((s,it)=>{ const p=useProj?it.product.projPrice:it.product.stdPrice; return s+p*it.qty; },0);
  const needShipping = subtotal < 3000;
  const shippingFee = needShipping ? cart.reduce((s,it)=>s+(it.product.shipping||90)*it.qty,0) : 0;
  const tax = Math.round(subtotal*0.05);
  const total = subtotal + tax + shippingFee;
  const rows = cart.map((item,i)=>{
    const price=useProj?item.product.projPrice:item.product.stdPrice;
    const sub=price*item.qty;
    return `<tr><td>${i+1}</td><td><b>${item.product.model}</b><br><span style="font-size:10px;color:#666">${item.product.series}</span></td><td>${item.product.watt||""}</td><td>${item.product.beam||""}</td><td>${item.product.cct||""}</td><td>${item.product.voltage||""}</td><td>${item.product.cri||""}</td><td>${item.product.color||""}</td><td>${item.product.cutout||""}</td><td>${item.product.install||""}</td><td style="text-align:center">${item.qty}</td><td>組</td><td style="text-align:right">NT$ ${price.toLocaleString()}</td><td style="text-align:right">NT$ ${sub.toLocaleString()}</td><td style="font-size:10px;color:#666">${item.product.note||""}</td></tr>`;
  }).join("");
  const html=`<!DOCTYPE html><html lang="zh-TW"><head><meta charset="UTF-8"><title>報價單 ${quoteNo}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Noto Sans TC","Microsoft JhengHei",sans-serif;font-size:12px;color:#111;background:#fff;padding:30px 40px}.hd{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;border-bottom:2px solid #111;padding-bottom:16px}.co-name{font-size:20px;font-weight:700;letter-spacing:2px}.co-sub{font-size:10px;color:#555;margin-top:3px}.co-info{font-size:10px;color:#555;line-height:1.8;text-align:right}.doc-title{text-align:center;font-size:18px;font-weight:700;letter-spacing:4px;margin-bottom:20px}.meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #ccc;margin-bottom:20px}.meta-cell{padding:8px 12px;border-bottom:1px solid #ccc}.meta-cell:nth-child(odd){border-right:1px solid #ccc}.meta-label{font-size:9px;color:#666;letter-spacing:1px;text-transform:uppercase}.meta-val{font-size:12px;font-weight:500;margin-top:2px}table{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:11px}th{background:#111;color:#fff;padding:7px 8px;text-align:left;font-size:9px;letter-spacing:1px}td{padding:7px 8px;border-bottom:1px solid #e0e0e0;vertical-align:top}tr:nth-child(even) td{background:#fafafa}.total-block{display:flex;justify-content:flex-end;margin-bottom:20px}.total-table{border:1px solid #ccc;min-width:260px}.tt-row{display:flex;justify-content:space-between;padding:8px 14px;border-bottom:1px solid #eee}.tt-row.bold{font-weight:700;font-size:14px;background:#f5f5f5}.tt-lbl{color:#555}.notes{border:1px solid #ccc;padding:14px;margin-bottom:20px;font-size:10px;line-height:2;color:#444}.notes b{color:#111}.sign-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-top:32px}.sign-box{border-top:1px solid #ccc;padding-top:8px;font-size:10px;color:#666}.footer{margin-top:24px;border-top:1px solid #ccc;padding-top:12px;font-size:9px;color:#999;text-align:center}</style></head><body><div class="hd"><div><div class="co-name">${COMPANY.name}</div><div class="co-sub">${COMPANY.eng}</div></div><div class="co-info">${COMPANY.addr?COMPANY.addr+"<br>":""}${COMPANY.tel?"Tel: "+COMPANY.tel+"<br>":""}${COMPANY.email}</div></div><div class="doc-title">報　價　單</div><div class="meta-grid"><div class="meta-cell"><div class="meta-label">報價單號</div><div class="meta-val">${quoteNo}</div></div><div class="meta-cell"><div class="meta-label">報價日期</div><div class="meta-val">${dateStr}</div></div><div class="meta-cell"><div class="meta-label">客戶公司</div><div class="meta-val">${customer.company||"—"}</div></div><div class="meta-cell"><div class="meta-label">聯絡人</div><div class="meta-val">${customer.name||"—"}${customer.position?" · "+customer.position:""}</div></div><div class="meta-cell"><div class="meta-label">案名</div><div class="meta-val">${projectName}</div></div><div class="meta-cell"><div class="meta-label">有效期限</div><div class="meta-val">${dateStr} 起 30 天內</div></div></div><table><thead><tr><th>#</th><th>型號／系列</th><th>瓦數</th><th>角度</th><th>色溫</th><th>電壓</th><th>演色性</th><th>顏色</th><th>開孔</th><th>安裝</th><th style="text-align:center">數量</th><th>單位</th><th style="text-align:right">單價</th><th style="text-align:right">金額</th><th>備註</th></tr></thead><tbody>${rows}</tbody></table><div class="total-block"><div class="total-table"><div class="tt-row"><span class="tt-lbl">小計</span><span>NT$ ${subtotal.toLocaleString()}</span></div>${needShipping?`<div class="tt-row"><span class="tt-lbl">運費</span><span>NT$ ${shippingFee.toLocaleString()}</span></div>`:""}<div class="tt-row"><span class="tt-lbl">稅金（5%）</span><span>NT$ ${tax.toLocaleString()}</span></div><div class="tt-row bold"><span class="tt-lbl">總計</span><span>NT$ ${total.toLocaleString()}</span></div></div></div><div class="notes"><b>備　註：</b><br>A. 交期如遇天災不可抗力因素，得予展延，不計入違約。<br>B. 單筆訂單未滿 NT$3,000 者，運費（NT$75～120）由買方自付。<br>C. 庫存不足時，生產交期約 4 週起，提前到貨將主動通知。<br>D. 保固期限：室內產品 3 年；戶外產品 2 年（人為損壞不在保固範圍內）。<br>E. 本報價單有效期限為開立日起 30 天，請於期限內回簽確認，逾期恕不保留。</div><div class="sign-row"><div class="sign-box">業務代表簽章</div><div class="sign-box">客戶確認簽章</div><div class="sign-box">日期</div></div><div class="footer">${COMPANY.name} · 本報價單僅供核可客戶使用，請勿外流</div></body></html>`;
  const blob=new Blob([html],{type:"text/html;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url; a.download=`報價單_${projectName}_${quoteNo}.html`; a.click();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
const roleLabel = r => ({admin:"管理者",vip:"VIP 客戶",standard:"一般客戶"})[r]||r;

function Carousel({ images }) {
  const [idx,setIdx]=useState(0);
  const imgs=images?.filter(Boolean)||[];
  if(!imgs.length) return <div className="carousel" style={{display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:64,color:"var(--bdr)"}}>◎</span></div>;
  return <div className="carousel">
    <div className="carousel-img"><img src={imgs[idx]} alt="" onError={e=>e.target.style.display="none"}/></div>
    {imgs.length>1&&<><button className="carousel-prev" onClick={()=>setIdx(i=>(i-1+imgs.length)%imgs.length)}>‹</button><button className="carousel-next" onClick={()=>setIdx(i=>(i+1)%imgs.length)}>›</button><div className="carousel-dots">{imgs.map((_,i)=><div key={i} className={`cdot ${i===idx?"on":""}`} onClick={()=>setIdx(i)}/>)}</div></>}
  </div>;
}

// smart search
function searchProducts(products, q) {
  if (!q.trim()) return products;
  const lq = q.toLowerCase().trim();
  const mapped = SYNONYMS[lq] || SYNONYMS[q] || q;
  const terms = [lq, mapped.toLowerCase()].filter(Boolean);
  return products.filter(p => {
    const hay = [p.model,p.series,p.category,p.watt,p.cct,p.beam,p.voltage,p.cri,p.color,p.cutout,p.install,p.desc,p.note].join(" ").toLowerCase();
    return terms.some(t => hay.includes(t));
  });
}

function getSuggestions(products, q) {
  if (!q || q.length < 1) return [];
  const lq = q.toLowerCase();
  const all = [...new Set(products.flatMap(p=>[p.model,p.series,p.category,p.watt,p.cct,p.color]))];
  return all.filter(v=>v&&v.toLowerCase().includes(lq)).slice(0,6);
}

// ─────────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  const [members,setMembers]=useState(INIT_MEMBERS);
  const [pending,setPending]=useState([]);
  const [products,setProducts]=useState(INIT_PRODUCTS);
  const [catalogs,setCatalogs]=useState(()=>{ try{ return JSON.parse(localStorage.getItem("ledoux_catalogs")||"[]"); }catch{return [];} });
  const [sampleRequests,setSampleRequests]=useState([]);
  const [user,setUser]=useState(null);
  const [waitInfo,setWaitInfo]=useState(null);
  const [autoAdmin,setAutoAdmin]=useState(null);
  const [page,setPage]=useState("catalog");
  const [cat,setCat]=useState("全部");
  const [seriesFilter,setSeriesFilter]=useState(null);
  const [searchQ,setSearchQ]=useState("");
  const [searchFocus,setSearchFocus]=useState(false);
  const [searchHistory,setSearchHistory]=useState(()=>{ try{ return JSON.parse(localStorage.getItem("ledoux_search_history")||"[]"); }catch{return [];} });
  const [selProd,setSelProd]=useState(null);
  const [editProd,setEditProd]=useState(null);
  const [showAddProd,setShowAddProd]=useState(false);
  const [menuOpen,setMenuOpen]=useState(false);
  const [cartOpen,setCartOpen]=useState(false);
  const [sampleOpen,setSampleOpen]=useState(false);
  const [cart,setCart]=useState([]);
  const [sampleCart,setSampleCart]=useState([]);
  const [sampleForm,setSampleForm]=useState({name:"",company:"",phone:"",address:"",note:""});
  const [sampleDone,setSampleDone]=useState(false);
  const [projectName,setProjectName]=useState("");
  const [checkItems,setCheckItems]=useState({c1:false,c2:false,c3:false,c4:false});
  const [approveTarget,setApproveTarget]=useState(null);
  const [toast,setToast]=useState("");
  const [submitting,setSubmitting]=useState(false);
  const [authTab,setAuthTab]=useState("login");
  const [loginF,setLoginF]=useState({username:"",password:""});
  const [loginErr,setLoginErr]=useState("");
  const [regF,setRegF]=useState({name:"",position:"",company:"",taxId:"",phone:"",email:"",username:"",password:""});
  const [fe,setFe]=useState({});
  const [newProd,setNewProd]=useState({model:"",series:"",category:"崁燈",watt:"",cct:"3000K / 4000K",beam:"24°",voltage:"220V",cri:"Ra≥80",color:"白色",cutout:"",install:"崁入式",shipping:"90",stdPrice:"",projPrice:"",desc:"",images:"",video:"",note:""});
  const [approveF,setApproveF]=useState({username:"",password:"",role:"standard"});
  const [transferF,setTransferF]=useState({amount:"",account:""});
  const [transferDone,setTransferDone]=useState(false);
  const [seriesExpanded,setSeriesExpanded]=useState(true);
  const [catExpanded,setCatExpanded]=useState(true);
  const fileInputRef=useRef();
  const [dragOver,setDragOver]=useState(false);
  const searchRef=useRef();

  const toast$=(m)=>{setToast(m);setTimeout(()=>setToast(""),3000)};
  const isVip=user?.role==="vip"||user?.role==="admin";
  const isFirst=members.length===0&&pending.length===0;
  const cartCount=cart.reduce((s,i)=>s+i.qty,0);
  const cartTotal=cart.reduce((s,i)=>{const p=isVip?i.product.projPrice:i.product.stdPrice;return s+p*i.qty;},0);
  const allChecked=Object.values(checkItems).every(Boolean);

  // derived series list from products
  const allSeries=[...new Set(products.map(p=>p.series))];
  const allCats=[...new Set(products.map(p=>p.category))];

  // filtered products
  const filtered=(() => {
    let ps = searchQ.trim() ? searchProducts(products,searchQ) : products;
    if (seriesFilter) ps=ps.filter(p=>p.series===seriesFilter);
    else if (cat!=="全部") ps=ps.filter(p=>p.category===cat);
    return ps;
  })();

  const suggestions=getSuggestions(products,searchQ);

  // save catalogs to localStorage
  useEffect(()=>{ localStorage.setItem("ledoux_catalogs",JSON.stringify(catalogs)); },[catalogs]);
  useEffect(()=>{ localStorage.setItem("ledoux_search_history",JSON.stringify(searchHistory)); },[searchHistory]);

  const doSearch=(q)=>{
    setSearchQ(q);
    if(q.trim()&&!searchHistory.includes(q)){
      setSearchHistory(h=>[q,...h].slice(0,8));
    }
    setSearchFocus(false);
    setPage("catalog");
  };

  const [rememberMe,setRememberMe]=useState(()=>localStorage.getItem("ledoux_remember")==="1");

  useEffect(()=>{
    const saved=localStorage.getItem("ledoux_saved_cred");
    if(saved){ try{ const {u,p}=JSON.parse(saved); setLoginF({username:u,password:p}); setRememberMe(true); }catch(_){} }
  },[]);

  const doLogin=async()=>{
    const m=members.find(m=>m.username===loginF.username&&m.password===loginF.password);
    if(m){
      if(rememberMe){ localStorage.setItem("ledoux_saved_cred",JSON.stringify({u:loginF.username,p:loginF.password})); localStorage.setItem("ledoux_remember","1"); }
      else{ localStorage.removeItem("ledoux_saved_cred"); localStorage.removeItem("ledoux_remember"); }
      setUser(m); return;
    }
    setLoginErr("帳號或密碼錯誤");
  };

  const doRegister=async()=>{
    const req={name:"姓名",position:"職稱",company:"公司全名",phone:"聯絡電話",email:"Email",username:"帳號",password:"密碼"};
    const errs={};
    Object.entries(req).forEach(([k,lbl])=>{if(!regF[k]?.trim())errs[k]=`${lbl} 為必填`;});
    if(regF.taxId&&!/^\d{8}$/.test(regF.taxId.trim()))errs.taxId="須為 8 位數字";
    if(members.find(m=>m.username===regF.username)||pending.find(p=>p.username===regF.username))errs.username="帳號已被使用";
    setFe(errs);if(Object.keys(errs).length>0)return;
    setSubmitting(true);
    if(isFirst){const a={id:Date.now(),...regF,role:"admin",status:"approved",approvedAt:new Date().toISOString().split("T")[0]};setMembers([a]);setAutoAdmin(a);setSubmitting(false);return;}
    const app={id:Date.now(),...regF,status:"pending",appliedAt:new Date().toISOString().split("T")[0]};
    if(FORMSPREE_ID!=="YOUR_FORM_ID"){try{await fetch(`https://formspree.io/f/${FORMSPREE_ID}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subject:`新申請：${regF.name} / ${regF.company}`,...regF})});}catch(_){}}
    setPending(p=>[...p,app]);setWaitInfo(app);setSubmitting(false);
  };

  const doApprove=()=>{ if(!approveF.username||!approveF.password)return; setMembers(x=>[...x,{...approveTarget,...approveF,status:"approved",approvedAt:new Date().toISOString().split("T")[0]}]); setPending(x=>x.filter(p=>p.id!==approveTarget.id)); setApproveTarget(null);toast$("✓ 帳號已開通"); };
  const changeRole=(id,r)=>{ setMembers(x=>x.map(m=>m.id===id?{...m,role:r}:m)); if(user?.id===id)setUser(u=>({...u,role:r})); toast$("✓ 權限已更新"); };

  const doAddProd=()=>{ if(!newProd.model)return; const imgs=newProd.images?newProd.images.split("\n").map(s=>s.trim()).filter(Boolean):[]; setProducts(x=>[...x,{...newProd,id:Date.now(),stdPrice:Number(newProd.stdPrice),projPrice:Number(newProd.projPrice),shipping:Number(newProd.shipping)||90,images:imgs}]); setNewProd({model:"",series:"",category:"崁燈",watt:"",cct:"3000K / 4000K",beam:"24°",voltage:"220V",cri:"Ra≥80",color:"白色",cutout:"",install:"崁入式",shipping:"90",stdPrice:"",projPrice:"",desc:"",images:"",video:"",note:""}); setShowAddProd(false);toast$("✓ 產品已新增"); };
  const startEdit=(p)=>setEditProd({...p,images:(p.images||[]).join("\n")});
  const saveEdit=()=>{ const imgs=editProd.images?editProd.images.split("\n").map(s=>s.trim()).filter(Boolean):[]; setProducts(x=>x.map(p=>p.id===editProd.id?{...editProd,stdPrice:Number(editProd.stdPrice),projPrice:Number(editProd.projPrice),shipping:Number(editProd.shipping)||90,images:imgs}:p)); if(selProd?.id===editProd.id)setSelProd(prev=>({...prev,...editProd,images:imgs})); setEditProd(null);toast$("✓ 產品已更新"); };

  const addToCart=(product)=>{ setCart(c=>{const ex=c.find(i=>i.product.id===product.id);if(ex)return c.map(i=>i.product.id===product.id?{...i,qty:i.qty+1}:i);return [...c,{product,qty:1}];}); toast$(`✓ ${product.model} 已加入詢價單`); };
  const updateQty=(id,delta)=>setCart(c=>c.map(i=>i.product.id===id?{...i,qty:Math.max(1,i.qty+delta)}:i));
  const removeItem=(id)=>setCart(c=>c.filter(i=>i.product.id!==id));

  const addToSample=(product)=>{ setSampleCart(c=>{if(c.find(i=>i.id===product.id))return c;return [...c,product];}); toast$(`✓ ${product.model} 已加入樣品申請`); };
  const removeSample=(id)=>setSampleCart(c=>c.filter(i=>i.id!==id));
  const submitSample=()=>{ if(!sampleForm.name||!sampleForm.phone){toast$("請填寫姓名和電話");return;} const req={id:Date.now(),products:sampleCart.map(p=>p.model),form:sampleForm,date:new Date().toISOString().split("T")[0],status:"pending"}; setSampleRequests(x=>[...x,req]); setSampleDone(true); toast$("✓ 樣品申請已送出"); };

  const handleGenPDF=()=>{ if(!projectName.trim()){toast$("請先填寫案名");return;} if(!allChecked){toast$("請先勾選確認所有注意事項");return;} generatePDF({cart,projectName,customer:{company:user.company,name:user.name,position:user.position},useProj:isVip}); toast$("✓ 報價單已下載"); };

  const handleTransfer=()=>{ if(!transferF.amount||!transferF.account){toast$("請填寫轉帳金額和帳戶尾數");return;} setTransferDone(true);toast$("✓ 轉帳通知已送出"); };

  const handleFiles=(files)=>{ Array.from(files).forEach(f=>{const url=URL.createObjectURL(f);setCatalogs(c=>[...c,{id:Date.now()+Math.random(),name:f.name,url,size:Math.round(f.size/1024)+"KB"}]);}); toast$("✓ 型錄已上傳，已自動儲存"); };

  const resetReg=()=>{setRegF({name:"",position:"",company:"",taxId:"",phone:"",email:"",username:"",password:""});setFe({});setAuthTab("login");};

  // ── screens ──
  if(autoAdmin) return <><style>{G}</style><div className="info-page"><div className="info-card"><div className="info-icon">✦</div><div className="info-title">歡迎加入</div><div className="info-sub">管理者帳號已建立</div><div className="info-desc">您是本系統第一位使用者，已自動取得管理者權限。</div><div className="info-table"><div className="info-row"><span>姓名</span><span>{autoAdmin.name}</span></div><div className="info-row"><span>公司</span><span>{autoAdmin.company}</span></div><div className="info-row"><span>帳號</span><span style={{fontFamily:"monospace"}}>{autoAdmin.username}</span></div><div className="info-row"><span>身份</span><span style={{color:"var(--gold)"}}>管理者</span></div></div><button className="btn-outline" onClick={()=>{setAutoAdmin(null);setLoginF({username:autoAdmin.username,password:autoAdmin.password});}}>進入系統</button></div></div></>;

  if(waitInfo) return <><style>{G}</style><div className="info-page"><div className="info-card"><div className="info-icon">◈</div><div className="info-title">申請已提交</div><div className="info-sub">等待專員審核</div><div className="info-desc">感謝您的申請，專員審核後將開通帳號。</div><div className="info-table"><div className="info-row"><span>姓名</span><span>{waitInfo.name}</span></div><div className="info-row"><span>公司</span><span>{waitInfo.company}</span></div><div className="info-row"><span>帳號</span><span style={{fontFamily:"monospace"}}>{waitInfo.username}</span></div><div className="info-row"><span>申請日期</span><span>{waitInfo.appliedAt}</span></div></div><button className="btn-outline" onClick={()=>{setWaitInfo(null);resetReg();}}>返回登入</button></div></div></>;

  if(!user) return (
    <><style>{G}</style>
    <div className="auth-page">
      <div className="auth-visual">
        <div className="av-top"><div className="av-logo">LEDOUX</div><div className="av-year">Est. 2002</div></div>
        <div style={{margin:"auto 0"}}><div className="av-line"/><div className="av-title">報價系統</div><div className="av-title-en">Quotation Platform</div><div className="av-line"/></div>
        <div className="av-desc">Authorized Partners Only</div>
      </div>
      <div className="auth-form-side">
        <div className="auth-inner">
          <div className="auth-logo-sm">LEDOUX</div>
          <div className="auth-tagline">Taiwan · 專業報價系統</div>
          <div className="auth-tabs">
            <div className={`atab ${authTab==="login"?"on":""}`} onClick={()=>{setAuthTab("login");setLoginErr("");setFe({});}}>登入</div>
            <div className={`atab ${authTab==="register"?"on":""}`} onClick={()=>{setAuthTab("register");setLoginErr("");setFe({});}}>申請帳號</div>
          </div>
          {authTab==="login"?(<>
            <div className="lf"><label>帳號</label><input value={loginF.username} onChange={e=>setLoginF(p=>({...p,username:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="請輸入帳號"/></div>
            <div className="lf"><label>密碼</label><input type="password" value={loginF.password} onChange={e=>setLoginF(p=>({...p,password:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="請輸入密碼"/></div>
            <div style={{display:"flex",alignItems:"center",gap:8,margin:"12px 0 4px"}}>
              <input type="checkbox" id="rem" checked={rememberMe} onChange={e=>setRememberMe(e.target.checked)} style={{accentColor:"var(--gold)",cursor:"pointer"}}/>
              <label htmlFor="rem" style={{fontSize:11,color:"var(--muted)",cursor:"pointer",letterSpacing:".5px"}}>記住帳號，下次自動填入</label>
            </div>
            <button className="btn-primary" onClick={doLogin}>登入系統</button>
            {loginErr&&<div className="auth-err">{loginErr}</div>}
            <div className="auth-hint">本系統為 Ledoux Taiwan 專屬報價平台<br/>帳號需由專員審核後開通</div>
          </>):(<>
            {isFirst&&<div className="first-notice">✦ 系統尚無帳號，您將自動成為第一位管理者</div>}
            <div className="r2">
              <div className="lf"><label>姓名<span className="req">*</span></label><input value={regF.name} onChange={e=>{setRegF(p=>({...p,name:e.target.value}));setFe(p=>({...p,name:""}));}} className={fe.name?"err-input":""} placeholder="您的姓名"/>{fe.name&&<div className="ferr">{fe.name}</div>}</div>
              <div className="lf"><label>職稱<span className="req">*</span></label><input value={regF.position} onChange={e=>{setRegF(p=>({...p,position:e.target.value}));setFe(p=>({...p,position:""}));}} className={fe.position?"err-input":""} placeholder="採購經理"/>{fe.position&&<div className="ferr">{fe.position}</div>}</div>
            </div>
            <div className="lf"><label>公司全名<span className="req">*</span></label><input value={regF.company} onChange={e=>{setRegF(p=>({...p,company:e.target.value}));setFe(p=>({...p,company:""}));}} className={fe.company?"err-input":""} placeholder="含有限公司／股份有限公司"/>{fe.company&&<div className="ferr">{fe.company}</div>}</div>
            <div className="r2">
              <div className="lf"><label>統一編號</label><input value={regF.taxId} onChange={e=>{setRegF(p=>({...p,taxId:e.target.value}));setFe(p=>({...p,taxId:""}));}} className={fe.taxId?"err-input":""} placeholder="選填，8 位數字" maxLength={8}/>{fe.taxId&&<div className="ferr">{fe.taxId}</div>}</div>
              <div className="lf"><label>聯絡電話<span className="req">*</span></label><input value={regF.phone} onChange={e=>{setRegF(p=>({...p,phone:e.target.value}));setFe(p=>({...p,phone:""}));}} className={fe.phone?"err-input":""} placeholder="0912-345-678"/>{fe.phone&&<div className="ferr">{fe.phone}</div>}</div>
            </div>
            <div className="lf"><label>Email<span className="req">*</span></label><input value={regF.email} onChange={e=>{setRegF(p=>({...p,email:e.target.value}));setFe(p=>({...p,email:""}));}} className={fe.email?"err-input":""} placeholder="name@company.com"/>{fe.email&&<div className="ferr">{fe.email}</div>}</div>
            <div className="sec-lbl">設定登入帳號</div>
            <div className="r2">
              <div className="lf"><label>帳號<span className="req">*</span></label><input value={regF.username} onChange={e=>{setRegF(p=>({...p,username:e.target.value}));setFe(p=>({...p,username:""}));}} className={fe.username?"err-input":""} placeholder="自訂帳號"/>{fe.username&&<div className="ferr">{fe.username}</div>}</div>
              <div className="lf"><label>密碼<span className="req">*</span></label><input type="password" value={regF.password} onChange={e=>{setRegF(p=>({...p,password:e.target.value}));setFe(p=>({...p,password:""}));}} className={fe.password?"err-input":""} placeholder="設定密碼"/>{fe.password&&<div className="ferr">{fe.password}</div>}</div>
            </div>
            <button className="btn-primary" onClick={doRegister} disabled={submitting}>{submitting?"送出中...":isFirst?"建立管理者帳號":"送出申請"}</button>
          </>)}
        </div>
      </div>
    </div></>
  );

  // ── LOGGED IN ──
  const navItems=[
    {id:"catalog",label:"產品目錄"},
    {id:"inquiry",label:"詢價單",badge:cartCount},
    {id:"sample",label:"借樣品",badge:sampleCart.length},
    {id:"catalogs",label:"電子型錄"},
    ...(user.role==="admin"?[
      {id:"pending",label:"待審核",badge:pending.length},
      {id:"members",label:"帳號管理"},
      {id:"products",label:"產品管理"},
      {id:"sample_admin",label:"樣品申請",badge:sampleRequests.filter(r=>r.status==="pending").length},
    ]:[]),
  ];

  return (
    <><style>{G}</style>
    <div className="app">

      {/* SIDEMENU */}
      {menuOpen&&<div className="sidemenu-overlay" onClick={()=>setMenuOpen(false)}/>}
      <div className={`sidemenu ${menuOpen?"open":""}`}>
        <div className="sm-head"><div className="sm-logo">LEDOUX</div><button className="sm-close" onClick={()=>setMenuOpen(false)}>✕</button></div>
        <div className="sm-user">
          <div className="sm-uname">{user.name}</div>
          <div className="sm-ucomp">{user.company}</div>
          <span className={`sm-ubadge ${user.role==="admin"?"tb-admin":user.role==="vip"?"tb-vip":"tb-standard"}`}>{roleLabel(user.role)}</span>
        </div>
        <div className="sm-nav">
          <div className="sm-section">主選單</div>
          {navItems.slice(0,4).map(n=>(
            <div key={n.id} className={`sm-item ${page===n.id?"on":""}`} onClick={()=>{setPage(n.id);setMenuOpen(false);}}>
              <span>{n.label}</span>
              {n.badge>0&&<span className="sm-badge">{n.badge}</span>}
            </div>
          ))}

          {/* SERIES */}
          <div className="sm-divider"/>
          <div className="sm-group-header" onClick={()=>setSeriesExpanded(v=>!v)}>
            <span style={{fontSize:"8px",letterSpacing:"3px",textTransform:"uppercase"}}>依系列瀏覽</span>
            <span className={`sm-group-arrow ${seriesExpanded?"open":""}`}>›</span>
          </div>
          {seriesExpanded&&allSeries.map(s=>(
            <div key={s} className={`sm-sub ${seriesFilter===s?"on":""}`} onClick={()=>{setSeriesFilter(s);setCat("全部");setPage("catalog");setMenuOpen(false);}}>
              <span className="sm-dot"/>{s}
            </div>
          ))}

          {/* CATEGORIES */}
          <div className="sm-divider"/>
          <div className="sm-group-header" onClick={()=>setCatExpanded(v=>!v)}>
            <span style={{fontSize:"8px",letterSpacing:"3px",textTransform:"uppercase"}}>依分類瀏覽</span>
            <span className={`sm-group-arrow ${catExpanded?"open":""}`}>›</span>
          </div>
          {catExpanded&&allCats.map(c=>(
            <div key={c} className={`sm-sub ${!seriesFilter&&cat===c&&page==="catalog"?"on":""}`} onClick={()=>{setCat(c);setSeriesFilter(null);setPage("catalog");setMenuOpen(false);}}>
              <span className="sm-dot"/>{c}
            </div>
          ))}

          {user.role==="admin"&&<>
            <div className="sm-divider"/>
            <div className="sm-section">管理</div>
            {navItems.slice(4).map(n=>(
              <div key={n.id} className={`sm-item ${page===n.id?"on":""}`} onClick={()=>{setPage(n.id);setMenuOpen(false);}}>
                <span>{n.label}</span>
                {n.badge>0&&<span className="sm-badge">{n.badge}</span>}
              </div>
            ))}
          </>}
        </div>
        <div className="sm-foot"><button className="btn-out3" onClick={()=>{setUser(null);setPage("catalog");setMenuOpen(false);}}>登出系統</button></div>
      </div>

      {/* TOPNAV */}
      <nav className="topnav">
        <div className="tn-left">
          <button className="tn-hamburger" onClick={()=>setMenuOpen(v=>!v)}><span/><span/><span/></button>
          <div className="tn-logo">LEDOUX</div>
          {/* SEARCH */}
          <div className="search-wrap" ref={searchRef}>
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="搜索型號、系列、分類…" value={searchQ}
              onChange={e=>setSearchQ(e.target.value)}
              onFocus={()=>setSearchFocus(true)}
              onBlur={()=>setTimeout(()=>setSearchFocus(false),180)}
              onKeyDown={e=>{if(e.key==="Enter")doSearch(searchQ);}}/>
            {searchQ&&<button className="search-clear" onClick={()=>{setSearchQ("");setSeriesFilter(null);}}>✕</button>}
            {searchFocus&&(
              <div className="search-dropdown">
                {searchQ&&suggestions.length>0&&<>
                  <div className="sd-section">建議</div>
                  {suggestions.map(s=><div key={s} className="sd-item" onClick={()=>doSearch(s)}>🔎 {s}</div>)}
                </>}
                {searchHistory.length>0&&<>
                  <div className="sd-section">搜索記錄</div>
                  {searchHistory.map(h=><div key={h} className="sd-item" onClick={()=>doSearch(h)}>🕐 {h}</div>)}
                </>}
                {!searchQ&&<>
                  <div className="sd-section">熱門關鍵字</div>
                  {HOT_KEYWORDS.map(k=><div key={k} className="sd-item highlight" onClick={()=>doSearch(k)}>🔥 {k}</div>)}
                </>}
              </div>
            )}
          </div>
        </div>
        <div className="tn-right">
          <button className="icon-btn" onClick={()=>{setSampleOpen(v=>!v);setCartOpen(false);}}>
            🧪{sampleCart.length>0&&<span className="icon-badge red">{sampleCart.length}</span>}
          </button>
          <button className="icon-btn" onClick={()=>{setCartOpen(v=>!v);setSampleOpen(false);}}>
            🗂{cartCount>0&&<span className="icon-badge">{cartCount}</span>}
          </button>
          <div className="tn-user"><div className="tn-uname">{user.name}</div><div className="tn-urole">{user.company}</div></div>
          <span className={`tn-badge ${user.role==="admin"?"tb-admin":user.role==="vip"?"tb-vip":"tb-standard"}`}>{roleLabel(user.role)}</span>
          <button className="btn-out2" onClick={()=>{setUser(null);setPage("catalog");}}>登出</button>
        </div>
      </nav>

      {/* INQUIRY CART PANEL */}
      <div className={`cart-panel ${cartOpen?"open":""}`}>
        <div className="cp-head"><div className="cp-title">詢價單</div><button className="drawer-close" onClick={()=>setCartOpen(false)}>✕</button></div>
        <div className="cp-body">
          {cart.length===0?<div className="empty" style={{paddingTop:60}}>— 尚未加入任何產品 —</div>:
            cart.map(item=>{
              const price=isVip?item.product.projPrice:item.product.stdPrice;
              return <div key={item.product.id} className="ci-row">
                <div className="ci-img">{item.product.images?.[0]?<img src={item.product.images[0]} alt=""/>:<span style={{fontSize:24,color:"var(--bdr)"}}>◎</span>}</div>
                <div className="ci-info">
                  <div className="ci-model">{item.product.model}</div>
                  <div className="ci-sub">{item.product.series} · {item.product.watt}</div>
                  <div className="ci-qty">
                    <button className="qty-btn" onClick={()=>updateQty(item.product.id,-1)}>−</button>
                    <span className="qty-num">{item.qty}</span>
                    <button className="qty-btn" onClick={()=>updateQty(item.product.id,1)}>+</button>
                    <span className="ci-price" style={{marginLeft:8}}>NT$ {(price*item.qty).toLocaleString()}</span>
                  </div>
                </div>
                <button className="ci-del" onClick={()=>removeItem(item.product.id)}>✕</button>
              </div>;
            })
          }
          {cart.length>0&&<div className="transfer-block">
            <div className="tb-title">💳 轉帳通知</div>
            {!transferDone?(<>
              <div className="tb-hint">如已完成匯款，填寫下方資訊，專人將盡快確認收款。</div>
              <div className="tb-grid">
                <div className="tb-field"><label>轉帳金額（NT$）</label><input value={transferF.amount} onChange={e=>setTransferF(p=>({...p,amount:e.target.value}))} placeholder="例：15000"/></div>
                <div className="tb-field"><label>帳戶末 5 碼</label><input value={transferF.account} onChange={e=>setTransferF(p=>({...p,account:e.target.value}))} placeholder="例：12345" maxLength={5}/></div>
              </div>
              <button className="btn-transfer" onClick={handleTransfer} disabled={!transferF.amount||!transferF.account}>送出轉帳通知</button>
            </>):<div style={{color:"var(--green)",fontSize:12,lineHeight:1.8}}>✓ 轉帳通知已送出<br/>NT$ {transferF.amount}・末5碼：{transferF.account}<br/><span style={{color:"var(--muted)"}}>專員將於確認後與您聯繫</span></div>}
          </div>}
        </div>
        {cart.length>0&&<div className="cp-foot">
          <div className="cp-total">
            <span className="cp-total-lbl">{isVip?"專案價小計":"標準價小計"}</span>
            <span className="cp-total-val">NT$ {cartTotal.toLocaleString()}</span>
          </div>
          {cartTotal<3000&&<div style={{fontSize:10,color:"var(--red)",marginBottom:10}}>⚠ 訂單未滿 NT$3,000，運費由買方支付（NT$75～120）</div>}
          <div className="cp-project">
            <label>案名 <span className="req">*</span></label>
            <input value={projectName} onChange={e=>setProjectName(e.target.value)} placeholder="請輸入案名（必填）"/>
          </div>
          <div className="checklist">
            <div className="cl-title">📋 下載前請確認以下事項</div>
            {[
              {k:"c1",t:"單筆未滿 NT$3,000，運費由買方自付（NT$75～120）"},
              {k:"c2",t:"庫存不足時，生產交期約 4 週起，提前到貨將主動通知"},
              {k:"c3",t:"保固：室內 3 年、戶外 2 年；人為損壞不在保固範圍"},
              {k:"c4",t:"本報價單有效期 30 天，請於期限內回簽確認"},
            ].map(({k,t})=>(
              <label key={k} className="cl-item">
                <input type="checkbox" checked={checkItems[k]} onChange={e=>setCheckItems(p=>({...p,[k]:e.target.checked}))}/>
                {t}
              </label>
            ))}
          </div>
          <button className="btn-gen-pdf" onClick={handleGenPDF} disabled={!projectName.trim()||!allChecked}>
            {allChecked?"下載報價單 PDF":"請先勾選確認所有注意事項"}
          </button>
        </div>}
      </div>

      {/* SAMPLE PANEL */}
      <div className={`sample-panel ${sampleOpen?"open":""}`}>
        <div className="sp-head"><div className="sp-title">借樣品申請</div><button className="drawer-close" onClick={()=>setSampleOpen(false)}>✕</button></div>
        <div className="sp-body">
          <div className="sp-notice">樣品借用後請於 2 週內歸還，如需購買可折抵費用。需求確認後專員將與您聯繫安排寄送。</div>
          {sampleDone?<div style={{textAlign:"center",padding:"40px 0",color:"var(--green)",fontSize:14,lineHeight:2}}>✓ 樣品申請已送出<br/><span style={{fontSize:12,color:"var(--muted)"}}>專員將於 1-2 個工作日內與您聯繫</span></div>:<>
            <div className="sp-items">
              {sampleCart.length===0?<div style={{textAlign:"center",padding:"24px 0",color:"var(--muted)",fontSize:12}}>— 尚未選擇樣品，請從產品頁點選「申請樣品」—</div>:
                sampleCart.map(p=><div key={p.id} className="sp-item">
                  <div className="sp-item-img">{p.images?.[0]?<img src={p.images[0]} alt=""/>:<span style={{fontSize:20,color:"var(--bdr)"}}>◎</span>}</div>
                  <div className="sp-item-info"><div className="sp-item-model">{p.model}</div><div className="sp-item-sub">{p.series} · {p.watt}</div></div>
                  <button className="sp-item-del" onClick={()=>removeSample(p.id)}>✕</button>
                </div>)
              }
            </div>
            <div className="sp-form">
              <label>聯絡人姓名 *</label><input value={sampleForm.name} onChange={e=>setSampleForm(p=>({...p,name:e.target.value}))} placeholder="您的姓名"/>
              <label>公司名稱</label><input value={sampleForm.company} onChange={e=>setSampleForm(p=>({...p,company:e.target.value}))} placeholder="公司名稱（選填）"/>
              <label>聯絡電話 *</label><input value={sampleForm.phone} onChange={e=>setSampleForm(p=>({...p,phone:e.target.value}))} placeholder="0912-345-678"/>
              <label>寄送地址</label><input value={sampleForm.address} onChange={e=>setSampleForm(p=>({...p,address:e.target.value}))} placeholder="完整地址（含郵遞區號）"/>
              <label>備註</label><textarea rows={2} value={sampleForm.note} onChange={e=>setSampleForm(p=>({...p,note:e.target.value}))} placeholder="特殊需求或說明"/>
            </div>
          </>}
        </div>
        {!sampleDone&&<div className="sp-foot">
          <button className="btn-submit-sample" onClick={submitSample} disabled={sampleCart.length===0}>送出樣品申請</button>
          <button className="btn-cancel2" style={{width:"100%",textAlign:"center"}} onClick={()=>setSampleOpen(false)}>稍後再說</button>
        </div>}
      </div>

      <div className="content">

        {/* 產品目錄 */}
        {page==="catalog"&&<>
          <div className="phead">
            <div>
              <div className="ptitle">{seriesFilter?seriesFilter+" 系列":searchQ?"搜索結果":"產品目錄"}</div>
              <div className="psub">{searchQ?`關鍵字：${searchQ}　共 ${filtered.length} 筆`:isVip?"顯示標準價與專案價":"顯示標準售價"}</div>
            </div>
            <div style={{display:"flex",gap:12,alignItems:"center"}}>
              {(seriesFilter||searchQ)&&<button className="btn-cancel2" onClick={()=>{setSeriesFilter(null);setSearchQ("");setCat("全部");}}>清除篩選</button>}
              <div className="pcount">{filtered.length} 件商品</div>
            </div>
          </div>
          {!seriesFilter&&!searchQ&&<div className="catbar">
            {["全部",...new Set(products.map(p=>p.category))].map(c=><button key={c} className={`catbtn ${cat===c?"on":""}`} onClick={()=>setCat(c)}>{c}</button>)}
          </div>}
          <div className="pgrid">
            {filtered.map(p=>(
              <div key={p.id} className="pcard" onClick={()=>setSelProd(p)}>
                <div className="pcard-img">{p.images?.[0]?<img src={p.images[0]} alt={p.model}/>:<span style={{fontSize:48,color:"var(--bdr)"}}>◎</span>}</div>
                <div className="pcard-body">
                  <div className="pcard-series">{p.series}</div>
                  <div className="pcard-model">{p.model}</div>
                  <div className="pcard-desc">{p.desc}</div>
                  <div className="pcard-tags">
                    {p.watt&&<span className="ptag">{p.watt}</span>}
                    {p.cct&&<span className="ptag">{p.cct}</span>}
                    {p.beam&&<span className="ptag">{p.beam}</span>}
                    {p.cutout&&p.cutout!=="—"&&<span className="ptag">{p.cutout}</span>}
                  </div>
                  <div className="pcard-price">
                    <div>
                      {isVip
                        ? <><div className="price-proj-label" style={{marginBottom:2}}>專案價</div><div className="price-std-val" style={{color:"var(--gold)"}}>NT$ {p.projPrice?.toLocaleString()}</div></>
                        : <div className="price-std-val">NT$ {p.stdPrice?.toLocaleString()}</div>
                      }
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length===0&&<div className="empty" style={{gridColumn:"1/-1"}}>— 找不到符合的產品，請試試其他關鍵字 —</div>}
          </div>
        </>}

        {/* 詢價單頁面 */}
        {page==="inquiry"&&<>
          <div className="phead"><div><div className="ptitle">詢價單</div><div className="psub">加入產品、填寫案名後下載報價單</div></div></div>
          {cart.length===0?<div className="empty">— 尚未加入任何產品，請至產品目錄選購 —</div>:<>
            <div className="tbl-wrap" style={{marginBottom:24}}>
              <table>
                <thead><tr><th>型號</th><th>系列</th><th>瓦數</th><th>數量</th><th>標準價</th>{isVip&&<th>專案價</th>}<th>小計</th><th></th></tr></thead>
                <tbody>{cart.map(item=>{
                  const price=isVip?item.product.projPrice:item.product.stdPrice;
                  return <tr key={item.product.id}>
                    <td style={{fontWeight:400}}>{item.product.model}</td>
                    <td>{item.product.series}</td><td>{item.product.watt}</td>
                    <td><div style={{display:"flex",alignItems:"center",gap:8}}><button className="qty-btn" onClick={()=>updateQty(item.product.id,-1)}>−</button><span>{item.qty}</span><button className="qty-btn" onClick={()=>updateQty(item.product.id,1)}>+</button></div></td>
                    <td>NT$ {item.product.stdPrice?.toLocaleString()}</td>
                    {isVip&&<td style={{color:"var(--gold)"}}>NT$ {item.product.projPrice?.toLocaleString()}</td>}
                    <td>NT$ {(price*item.qty).toLocaleString()}</td>
                    <td><button className="btn-del2" onClick={()=>removeItem(item.product.id)}>✕</button></td>
                  </tr>;
                })}</tbody>
              </table>
            </div>
            <div style={{maxWidth:480}}>
              <div style={{marginBottom:12}}><label style={{display:"block",fontSize:"9px",letterSpacing:"2px",textTransform:"uppercase",color:"var(--muted)",marginBottom:8}}>案名 <span className="req">*</span></label><input style={{width:"100%",padding:"10px",border:"1px solid var(--bdr)",background:"transparent",fontFamily:"'Noto Sans TC',sans-serif",fontSize:13,outline:"none"}} value={projectName} onChange={e=>setProjectName(e.target.value)} placeholder="請輸入案名"/></div>
              {cartTotal<3000&&<div style={{fontSize:11,color:"var(--red)",marginBottom:12}}>⚠ 訂單未滿 NT$3,000，運費由買方支付（NT$75～120）</div>}
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:16,fontSize:12,color:"var(--muted)"}}><span>小計</span><strong style={{color:"var(--black)",fontFamily:"'Cormorant Garamond',serif",fontSize:20}}>NT$ {cartTotal.toLocaleString()}</strong></div>
              <div className="checklist">
                <div className="cl-title">📋 下載前請確認以下事項</div>
                {[{k:"c1",t:"單筆未滿 NT$3,000，運費由買方自付（NT$75～120）"},{k:"c2",t:"庫存不足時，生產交期約 4 週起，提前到貨將主動通知"},{k:"c3",t:"保固：室內 3 年、戶外 2 年；人為損壞不在保固範圍"},{k:"c4",t:"本報價單有效期 30 天，請於期限內回簽確認"},].map(({k,t})=><label key={k} className="cl-item"><input type="checkbox" checked={checkItems[k]} onChange={e=>setCheckItems(p=>({...p,[k]:e.target.checked}))}/>{t}</label>)}
              </div>
              <button className="btn-gen-pdf" onClick={handleGenPDF} disabled={!projectName.trim()||!allChecked}>{allChecked?"下載報價單 PDF":"請先勾選確認所有注意事項"}</button>
            </div>
          </>}
        </>}

        {/* 借樣品頁面 */}
        {page==="sample"&&<>
          <div className="phead"><div><div className="ptitle">借樣品</div><div className="psub">申請試用樣品，2 週內歸還可折抵購買</div></div><button className="btn-add2" onClick={()=>{setSampleOpen(true);}}>查看申請清單 ({sampleCart.length})</button></div>
          <div style={{background:"#f4efe8",border:"1px solid var(--bdr2)",borderLeft:"3px solid var(--gold)",padding:"14px 18px",marginBottom:28,fontSize:12,color:"var(--muted)",lineHeight:1.8}}>
            📦 從下方產品目錄點選「申請樣品」加入清單，完成後點右上角提交申請。樣品數量以庫存為準，專員確認後安排寄送。
          </div>
          <div className="pgrid">
            {products.map(p=>(
              <div key={p.id} className="pcard">
                <div className="pcard-img" onClick={()=>setSelProd(p)} style={{cursor:"pointer"}}>{p.images?.[0]?<img src={p.images[0]} alt={p.model}/>:<span style={{fontSize:48,color:"var(--bdr)"}}>◎</span>}</div>
                <div className="pcard-body">
                  <div className="pcard-series">{p.series}</div>
                  <div className="pcard-model">{p.model}</div>
                  <div className="pcard-desc">{p.desc}</div>
                  <div className="pcard-tags">{p.watt&&<span className="ptag">{p.watt}</span>}{p.beam&&<span className="ptag">{p.beam}</span>}</div>
                  <button className={`btn-sample ${sampleCart.find(i=>i.id===p.id)?"requested":""}`} onClick={()=>sampleCart.find(i=>i.id===p.id)?removeSample(p.id):addToSample(p)}>
                    {sampleCart.find(i=>i.id===p.id)?"✓ 已加入申請清單":"申請樣品"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>}

        {/* 電子型錄 */}
        {page==="catalogs"&&<>
          <div className="phead"><div><div className="ptitle">電子型錄</div><div className="psub">下載最新產品型錄</div></div>{user.role==="admin"&&<button className="btn-upload" onClick={()=>fileInputRef.current?.click()}>＋ 上傳型錄</button>}</div>
          {user.role==="admin"&&<><div className={`upload-area ${dragOver?"drag":""}`} onClick={()=>fileInputRef.current?.click()} onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault();setDragOver(false);handleFiles(e.dataTransfer.files);}}>
            <div style={{fontSize:32,marginBottom:8}}>📁</div>
            <div style={{fontSize:12,color:"var(--black)"}}>點擊或拖曳檔案至此上傳</div>
            <div className="upload-hint">支援 PDF、PNG、JPG 等格式 · 上傳後自動儲存於此裝置</div>
          </div></>}
          <input ref={fileInputRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg" style={{display:"none"}} onChange={e=>handleFiles(e.target.files)}/>
          {catalogs.length===0?<div className="empty">— 尚無型錄，{user.role==="admin"?"請上傳型錄檔案":"請洽業務索取"} —</div>:
            <div className="catalog-grid">
              {catalogs.map(c=>(
                <a key={c.id} href={c.url} download={c.name} className="cat-card">
                  <div className="cat-icon">{c.name.endsWith(".pdf")?"📄":"🖼"}</div>
                  <div className="cat-name">{c.name}</div>
                  <div className="cat-size">{c.size}</div>
                  {user.role==="admin"&&<button className="btn-del2" style={{marginTop:4}} onClick={e=>{e.preventDefault();setCatalogs(x=>x.filter(x=>x.id!==c.id));toast$("已刪除");}}>✕</button>}
                </a>
              ))}
            </div>
          }
        </>}

        {/* 待審核 */}
        {page==="pending"&&user.role==="admin"&&<>
          <div className="phead"><div><div className="ptitle">待審核申請</div><div className="psub">核准後設定帳號與權限</div></div></div>
          {approveTarget&&<div className="modal-wrap" onClick={()=>setApproveTarget(null)}><div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div className="modal-head"><div className="modal-title">核准申請</div><button className="modal-close" onClick={()=>setApproveTarget(null)}>✕</button></div>
            <div className="modal-body">
              <div className="applicant-card"><div className="ac-name">{approveTarget.name}・{approveTarget.position}</div><div className="ac-detail">{approveTarget.company}<br/>{approveTarget.email} · {approveTarget.phone}</div></div>
              <div className="fgrid">
                <div className="ff"><label>登入帳號</label><input value={approveF.username} onChange={e=>setApproveF(p=>({...p,username:e.target.value}))} placeholder={approveTarget.username}/></div>
                <div className="ff"><label>登入密碼</label><input value={approveF.password} onChange={e=>setApproveF(p=>({...p,password:e.target.value}))} placeholder="設定密碼"/></div>
                <div className="ff full"><label>報價權限</label><select value={approveF.role} onChange={e=>setApproveF(p=>({...p,role:e.target.value}))}><option value="standard">一般客戶</option><option value="vip">VIP 客戶</option><option value="admin">管理者</option></select></div>
              </div>
              <div className="form-actions"><button className="btn-confirm" onClick={doApprove}>確認核准</button><button className="btn-cancel2" onClick={()=>setApproveTarget(null)}>取消</button></div>
            </div>
          </div></div>}
          {pending.length===0?<div className="empty">— 目前沒有待審核的申請 —</div>:
            <div className="tbl-wrap"><table><thead><tr><th>姓名</th><th>職稱</th><th>公司</th><th>電話</th><th>申請日</th><th>操作</th></tr></thead>
              <tbody>{pending.map(p=><tr key={p.id}><td style={{fontWeight:400}}>{p.name}</td><td style={{color:"var(--muted)"}}>{p.position}</td><td>{p.company}</td><td style={{color:"var(--muted)"}}>{p.phone}</td><td style={{color:"var(--muted)"}}>{p.appliedAt}</td><td style={{display:"flex",gap:8}}><button className="btn-ok" onClick={()=>{setApproveTarget(p);setApproveF({username:p.username,password:p.password,role:"standard"});}}>核准</button><button className="btn-ng" onClick={()=>{setPending(x=>x.filter(x=>x.id!==p.id));toast$("已拒絕此申請");}}>拒絕</button></td></tr>)}</tbody>
            </table></div>}
        </>}

        {/* 帳號管理 */}
        {page==="members"&&user.role==="admin"&&<>
          <div className="phead"><div><div className="ptitle">帳號管理</div><div className="psub">管理所有已開通帳號</div></div></div>
          <div className="stats-row">
            <div className="stat-box"><div className="stat-num">{members.length}</div><div className="stat-lbl">總帳號數</div></div>
            <div className="stat-box"><div className="stat-num">{members.filter(m=>m.role==="admin").length}</div><div className="stat-lbl">管理者</div></div>
            <div className="stat-box"><div className="stat-num">{members.filter(m=>m.role==="vip").length}</div><div className="stat-lbl">VIP 帳號</div></div>
            <div className="stat-box"><div className="stat-num" style={{color:"var(--red)"}}>{pending.length}</div><div className="stat-lbl">待審核</div></div>
          </div>
          <div className="tbl-wrap"><table><thead><tr><th>姓名</th><th>職稱</th><th>公司</th><th>帳號</th><th>密碼</th><th>權限</th><th>調整</th><th>開通日</th><th></th></tr></thead>
            <tbody>{members.map(m=><tr key={m.id}><td style={{fontWeight:400}}>{m.name}</td><td style={{color:"var(--muted)"}}>{m.position}</td><td>{m.company}</td><td style={{fontFamily:"monospace"}}>{m.username}</td><td style={{fontFamily:"monospace",color:"var(--muted)"}}>{m.password}</td><td><span className={`rb r-${m.role}`}>{roleLabel(m.role)}</span></td><td><select className="role-sel" value={m.role} onChange={e=>changeRole(m.id,e.target.value)}><option value="standard">一般</option><option value="vip">VIP</option><option value="admin">管理</option></select></td><td style={{color:"var(--muted)"}}>{m.approvedAt}</td><td>{m.id!==user.id&&<button className="btn-del2" onClick={()=>{setMembers(x=>x.filter(x=>x.id!==m.id));toast$("帳號已刪除");}}>✕</button>}</td></tr>)}</tbody>
          </table></div>
        </>}

        {/* 產品管理 */}
        {page==="products"&&user.role==="admin"&&<>
          <div className="phead"><div><div className="ptitle">產品管理</div><div className="psub">{products.length} 件商品</div></div><button className="btn-add2" onClick={()=>setShowAddProd(v=>!v)}>＋ 新增產品</button></div>
          <div className="img-hint-box">💡 圖片請使用網址貼入。推薦免費圖床：<a href="https://imgur.com" target="_blank" rel="noreferrer">imgur.com</a> — 上傳後複製圖片連結貼入即可。</div>
          {showAddProd&&<div className="form-panel"><div className="fp-title">新增產品</div>
            <div className="fgrid">
              {[["型號","model","HB.D120"],["系列","series","HEPBURN"],["瓦數","watt","10W"],["色溫","cct","3000K / 4000K"],["光束角","beam","24°"],["電壓","voltage","220V"],["演色性","cri","Ra≥90"],["顏色","color","白色"],["開孔尺寸","cutout","Ø95mm"],["標準價（NT$）","stdPrice",""],["專案價（NT$）","projPrice",""],["運費（NT$）","shipping","90"]].map(([lbl,key,ph])=>(
                <div key={key} className="ff"><label>{lbl}</label><input type={["stdPrice","projPrice","shipping"].includes(key)?"number":"text"} value={newProd[key]} onChange={e=>setNewProd(p=>({...p,[key]:e.target.value}))} placeholder={ph}/></div>
              ))}
              <div className="ff"><label>分類</label><select value={newProd.category} onChange={e=>setNewProd(p=>({...p,category:e.target.value}))}><option>崁燈</option><option>軌道燈</option><option>磁吸系統</option><option>吸頂燈</option><option>壁燈</option><option>戶外燈</option></select></div>
              <div className="ff"><label>安裝方式</label><select value={newProd.install} onChange={e=>setNewProd(p=>({...p,install:e.target.value}))}><option>崁入式</option><option>軌道式</option><option>磁吸嵌入</option><option>吸頂式</option><option>壁掛式</option><option>戶外埋地</option></select></div>
              <div className="ff full"><label>產品描述</label><input value={newProd.desc} onChange={e=>setNewProd(p=>({...p,desc:e.target.value}))} placeholder="簡短描述產品特色"/></div>
              <div className="ff full"><label>圖片網址（每行一個，支援多張）</label><textarea rows={3} value={newProd.images} onChange={e=>setNewProd(p=>({...p,images:e.target.value}))} placeholder={"https://example.com/img1.jpg\nhttps://example.com/img2.jpg"}/></div>
              <div className="ff full"><label>影片連結（YouTube embed URL）</label><input value={newProd.video} onChange={e=>setNewProd(p=>({...p,video:e.target.value}))} placeholder="https://www.youtube.com/embed/xxxxx"/></div>
              <div className="ff full"><label>備註</label><input value={newProd.note} onChange={e=>setNewProd(p=>({...p,note:e.target.value}))} placeholder="特殊說明或注意事項"/></div>
            </div>
            <div className="form-actions"><button className="btn-confirm" onClick={doAddProd}>確認新增</button><button className="btn-cancel2" onClick={()=>setShowAddProd(false)}>取消</button></div>
          </div>}

          {editProd&&<div className="form-panel" style={{background:"#f0ebe2"}}><div className="fp-title">編輯產品：{editProd.model}</div>
            <div className="fgrid">
              {[["型號","model"],["系列","series"],["瓦數","watt"],["色溫","cct"],["光束角","beam"],["電壓","voltage"],["演色性","cri"],["顏色","color"],["開孔尺寸","cutout"],["標準價（NT$）","stdPrice"],["專案價（NT$）","projPrice"],["運費（NT$）","shipping"]].map(([lbl,key])=>(
                <div key={key} className="ff"><label>{lbl}</label><input type={["stdPrice","projPrice","shipping"].includes(key)?"number":"text"} value={editProd[key]||""} onChange={e=>setEditProd(p=>({...p,[key]:e.target.value}))}/></div>
              ))}
              <div className="ff"><label>分類</label><select value={editProd.category} onChange={e=>setEditProd(p=>({...p,category:e.target.value}))}><option>崁燈</option><option>軌道燈</option><option>磁吸系統</option><option>吸頂燈</option><option>壁燈</option><option>戶外燈</option></select></div>
              <div className="ff"><label>安裝方式</label><select value={editProd.install||""} onChange={e=>setEditProd(p=>({...p,install:e.target.value}))}><option>崁入式</option><option>軌道式</option><option>磁吸嵌入</option><option>吸頂式</option><option>壁掛式</option><option>戶外埋地</option></select></div>
              <div className="ff full"><label>產品描述</label><input value={editProd.desc} onChange={e=>setEditProd(p=>({...p,desc:e.target.value}))}/></div>
              <div className="ff full"><label>圖片網址（每行一個）</label><textarea rows={3} value={editProd.images} onChange={e=>setEditProd(p=>({...p,images:e.target.value}))}/></div>
              <div className="ff full"><label>影片連結</label><input value={editProd.video||""} onChange={e=>setEditProd(p=>({...p,video:e.target.value}))}/></div>
              <div className="ff full"><label>備註</label><input value={editProd.note||""} onChange={e=>setEditProd(p=>({...p,note:e.target.value}))}/></div>
            </div>
            <div className="form-actions"><button className="btn-confirm" onClick={saveEdit}>儲存修改</button><button className="btn-cancel2" onClick={()=>setEditProd(null)}>取消</button></div>
          </div>}

          <div className="tbl-wrap"><table><thead><tr><th>型號</th><th>系列</th><th>分類</th><th>瓦數</th><th>開孔</th><th>標準價</th><th>專案價</th><th>運費</th><th>操作</th></tr></thead>
            <tbody>{products.map(p=><tr key={p.id}><td style={{fontWeight:400}}>{p.model}</td><td>{p.series}</td><td>{p.category}</td><td>{p.watt}</td><td>{p.cutout}</td><td>NT$ {p.stdPrice?.toLocaleString()}</td><td style={{color:"var(--gold)"}}>NT$ {p.projPrice?.toLocaleString()}</td><td>NT$ {p.shipping||90}</td><td style={{display:"flex",gap:8}}><button className="btn-edit2" onClick={()=>startEdit(p)}>編輯</button><button className="btn-del2" onClick={()=>{setProducts(x=>x.filter(x=>x.id!==p.id));toast$("產品已刪除");}}>✕</button></td></tr>)}</tbody>
          </table></div>
        </>}

        {/* 樣品申請管理 */}
        {page==="sample_admin"&&user.role==="admin"&&<>
          <div className="phead"><div><div className="ptitle">樣品申請管理</div><div className="psub">{sampleRequests.length} 筆申請</div></div></div>
          {sampleRequests.length===0?<div className="empty">— 目前沒有樣品申請 —</div>:
            <div className="tbl-wrap"><table><thead><tr><th>申請日</th><th>聯絡人</th><th>公司</th><th>電話</th><th>申請品項</th><th>地址</th><th>狀態</th><th>操作</th></tr></thead>
              <tbody>{sampleRequests.map(r=><tr key={r.id}><td style={{color:"var(--muted)"}}>{r.date}</td><td style={{fontWeight:400}}>{r.form.name}</td><td>{r.form.company}</td><td style={{color:"var(--muted)"}}>{r.form.phone}</td><td style={{fontSize:11}}>{r.products.join("、")}</td><td style={{color:"var(--muted)",fontSize:11}}>{r.form.address||"—"}</td><td><span className={`rb ${r.status==="pending"?"r-standard":"r-vip"}`}>{r.status==="pending"?"待處理":"已處理"}</span></td><td><button className="btn-ok" onClick={()=>setSampleRequests(x=>x.map(i=>i.id===r.id?{...i,status:"done"}:i))}>標記完成</button></td></tr>)}</tbody>
            </table></div>}
        </>}
      </div>
    </div>

    {/* PRODUCT DETAIL DRAWER */}
    {selProd&&<div className="drawer-overlay" onClick={()=>setSelProd(null)}>
      <div className="drawer" onClick={e=>e.stopPropagation()}>
        <div className="drawer-top"><div className="drawer-series">{selProd.series} · {selProd.category}</div><button className="drawer-close" onClick={()=>setSelProd(null)}>✕</button></div>
        <Carousel images={selProd.images}/>
        <div className="drawer-body">
          <div className="drawer-model">{selProd.model}</div>
          <div className="drawer-desc">{selProd.desc}</div>
          <div className="spec-grid">
            {[["瓦數",selProd.watt],["色溫",selProd.cct],["光束角",selProd.beam],["電壓",selProd.voltage],["演色性",selProd.cri],["顏色",selProd.color],["開孔尺寸",selProd.cutout],["安裝方式",selProd.install]].map(([lbl,val])=>(
              <div key={lbl} className="spec-item"><div className="spec-label">{lbl}</div><div className="spec-val">{val||"—"}</div></div>
            ))}
          </div>
          {selProd.video&&<div className="drawer-video"><iframe src={selProd.video} title="產品影片" allowFullScreen/></div>}
          {selProd.note&&<div className="drawer-note">📌 {selProd.note}</div>}
          <div className="price-block">
            <div>
              <div className="pb-label">{isVip?"專案價":"售價"}</div>
              <div className={`pb-val ${isVip?"gold":""}`}>NT$ {isVip?selProd.projPrice?.toLocaleString():selProd.stdPrice?.toLocaleString()}</div>
              {!isVip&&<div style={{fontSize:11,color:"var(--muted)",marginTop:6}}>如需專案報價，請洽業務專員</div>}
            </div>
          </div>
          <div className="drawer-actions">
            <button className={`btn-add-cart ${isVip?"btn-add-cart-gold":""}`} onClick={()=>addToCart(selProd)}>加入詢價單</button>
            <button className={`btn-sample ${sampleCart.find(i=>i.id===selProd.id)?"requested":""}`} onClick={()=>sampleCart.find(i=>i.id===selProd.id)?removeSample(selProd.id):addToSample(selProd)}>
              {sampleCart.find(i=>i.id===selProd.id)?"✓ 已申請樣品":"申請樣品"}
            </button>
          </div>
        </div>
      </div>
    </div>}

    {toast&&<div className="toast">{toast}</div>}
    </>
  );
}
