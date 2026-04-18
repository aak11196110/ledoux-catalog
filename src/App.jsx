import { useState, useEffect, useRef } from "react";

const FORMSPREE_ID = "YOUR_FORM_ID";

const INIT_MEMBERS = [
  { id:1, username:"xxx3903052", password:"zzz3909086", name:"管理員", position:"管理者", company:"Ledoux Taiwan", phone:"", email:"", taxId:"", role:"admin", status:"approved", approvedAt:"2026-04-18" },
];

const PRODUCTS = [
  { id:1,  model:"HB.D110-N", series:"HEPBURN", category:"崁燈", watt:"10W", cct:"3000K / 4000K", beam:"24°", image:"https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Light-HB.D110-White-300x300.png", stdPrice:1200, vipPrice:980, desc:"極簡主義崁燈，鋁合金一體成型，隱藏光源設計" },
  { id:2,  model:"HB.D120",   series:"HEPBURN", category:"崁燈", watt:"12W", cct:"3000K / 4000K", beam:"24°", image:"https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Light-HB.D120-White-300x300.png", stdPrice:1380, vipPrice:1120, desc:"Hepburn 系列經典款，優雅比例與高效能光源的完美結合" },
  { id:3,  model:"HB.D130",   series:"HEPBURN", category:"崁燈", watt:"15W", cct:"3000K / 4000K", beam:"24°", image:"https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Light-HB.D130-240x300.jpg", stdPrice:1580, vipPrice:1280, desc:"15W 高效輸出，適合商業空間重點照明" },
  { id:4,  model:"HB.D215",   series:"HEPBURN", category:"崁燈", watt:"20W", cct:"3000K / 4000K", beam:"36°", image:"https://www.ledouxlight.com/wp-content/uploads/2023/01/Led-Recessed-Light-HB.D215-240x300.png", stdPrice:1980, vipPrice:1600, desc:"寬角度洗牆設計，均勻漫射光創造空間層次" },
  { id:5,  model:"HB.D230",   series:"HEPBURN", category:"崁燈", watt:"25W", cct:"3000K / 4000K", beam:"36°", image:"https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Light-HB.D230-240x300.jpg", stdPrice:2280, vipPrice:1860, desc:"25W 旗艦崁燈，適合高挑空間與精品陳列" },
  { id:6,  model:"HB.D430",   series:"HEPBURN", category:"崁燈", watt:"30W", cct:"3000K / 4000K", beam:"36°", image:"https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Light-HB.D430-240x300.jpg", stdPrice:2880, vipPrice:2350, desc:"最大功率款，博物館與精品店首選" },
  { id:7,  model:"NDB0306-C", series:"BLADE",   category:"崁燈", watt:"6W",  cct:"3000K / 4000K", beam:"24°", image:"https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Light-NDB0306-C-240x300.jpg", stdPrice:780, vipPrice:630, desc:"Blade 超薄系列，燈體極致纖薄，存在感歸零" },
  { id:8,  model:"NDB0309-C", series:"BLADE",   category:"崁燈", watt:"9W",  cct:"3000K / 4000K", beam:"24°", image:"https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Light-NDB0309-C-240x300.jpg", stdPrice:920, vipPrice:750, desc:"9W 版本，天花板的隱形光源解決方案" },
  { id:9,  model:"DFB0206-C", series:"METIS",   category:"崁燈", watt:"6W",  cct:"3000K / 4000K", beam:"40°", image:"https://www.ledouxlight.com/wp-content/uploads/2022/12/Led-Recessed-Ceiling-Light-DFB0206-C-300x300.png", stdPrice:1100, vipPrice:890, desc:"Metis 系列純鋁鍛造散熱，長壽命設計" },
  { id:10, model:"DFB0225-C", series:"METIS",   category:"崁燈", watt:"25W", cct:"3000K / 4000K", beam:"40°", image:"https://www.ledouxlight.com/wp-content/uploads/2023/01/Led-Recessed-Ceiling-Light-DFB0225-C-1.png", stdPrice:2680, vipPrice:2180, desc:"25W 大功率版本，展示空間的最佳選擇" },
  { id:11, model:"TSU0506-C", series:"EOS",     category:"軌道燈", watt:"6W",  cct:"3000K / 4000K", beam:"24°", image:"https://www.ledouxlight.com/wp-content/uploads/2022/05/LED-Track-Light-TSU0506-C-240x300.jpg", stdPrice:980, vipPrice:800, desc:"EOS 系列入門款，纖薄機身整合散熱模組" },
  { id:12, model:"TSU0515-C", series:"EOS",     category:"軌道燈", watt:"15W", cct:"3000K / 4000K", beam:"24°", image:"https://www.ledouxlight.com/wp-content/uploads/2022/05/Led-Track-Light-TSU0515-White-240x300.jpg", stdPrice:1380, vipPrice:1120, desc:"15W 精準投射，服飾與珠寶陳列專用" },
  { id:13, model:"TSU0823-C", series:"EOS",     category:"軌道燈", watt:"23W", cct:"3000K / 4000K", beam:"36°", image:"https://www.ledouxlight.com/wp-content/uploads/2023/01/EOS-LED-Track-Light-TSU0823-C-1.png", stdPrice:1880, vipPrice:1530, desc:"23W 大角度版，空間氛圍渲染首選" },
  { id:14, model:"HB.T130S",  series:"HEPBURN", category:"軌道燈", watt:"30W", cct:"3000K / 4000K", beam:"24°", image:"https://www.ledouxlight.com/wp-content/uploads/2023/01/Led-Track-Light-HB.T130S-300x300.png", stdPrice:2480, vipPrice:2020, desc:"Hepburn 軌道旗艦，30W 極致輸出" },
  { id:15, model:"TSU0206-1", series:"THEIA",   category:"軌道燈", watt:"6W",  cct:"3000K / 4000K", beam:"24°", image:"https://www.ledouxlight.com/wp-content/uploads/2022/05/TSU0206-1-241x300.png", stdPrice:980, vipPrice:800, desc:"Theia 系列，180° 可調角度，靈活定向" },
  { id:16, model:"TSU0212-1", series:"THEIA",   category:"軌道燈", watt:"12W", cct:"3000K / 4000K", beam:"24°", image:"https://www.ledouxlight.com/wp-content/uploads/2022/05/TSU0212-1-241x300.png", stdPrice:1280, vipPrice:1040, desc:"12W 強化版，精品零售空間標準配置" },
  { id:17, model:"DC.TS0110-C", series:"48V MAGNETIC", category:"磁吸系統", watt:"10W", cct:"3000K / 4000K", beam:"20°", image:"https://www.ledouxlight.com/wp-content/uploads/2022/05/48V-Led-Track-Light-DC.TS0110-C-241x300.jpg", stdPrice:2380, vipPrice:1940, desc:"48V 磁吸模組，無工具快速安裝，現代設計首選" },
  { id:18, model:"DC.TS0120-C", series:"48V MAGNETIC", category:"磁吸系統", watt:"20W", cct:"3000K / 4000K", beam:"20°", image:"https://www.ledouxlight.com/wp-content/uploads/2022/05/48V-Led-Track-Light-DC.TS0120-C-241x300.jpg", stdPrice:2980, vipPrice:2430, desc:"20W 高輸出磁吸燈，藝廊與精品空間專用" },
  { id:19, model:"DC.TS0130-C", series:"48V MAGNETIC", category:"磁吸系統", watt:"30W", cct:"3000K / 4000K", beam:"20°", image:"https://www.ledouxlight.com/wp-content/uploads/2022/05/48V-Led-Track-Light-DC.TS0130-C-241x300.jpg", stdPrice:3580, vipPrice:2920, desc:"30W 旗艦磁吸，最高端照明解決方案" },
  { id:20, model:"DC.TS0206-C", series:"48V MAGNETIC", category:"磁吸系統", watt:"6W",  cct:"3000K / 4000K", beam:"20°", image:"https://www.ledouxlight.com/wp-content/uploads/2022/05/48V-Led-Track-Light-DC.TS0206-C--241x300.jpg", stdPrice:1980, vipPrice:1620, desc:"入門磁吸款，系統彈性配置的理想起點" },
  { id:21, model:"CSU0515-C",   series:"EOS",   category:"吸頂燈", watt:"15W", cct:"3000K / 4000K", beam:"36°", image:"https://www.ledouxlight.com/wp-content/uploads/2022/05/Surface-Mount-CSU0510-C-240x300.jpg", stdPrice:1580, vipPrice:1290, desc:"EOS 吸頂款，無需開孔直接安裝" },
  { id:22, model:"CSA0206-1",   series:"THEIA", category:"吸頂燈", watt:"6W",  cct:"3000K / 4000K", beam:"24°", image:"https://www.ledouxlight.com/wp-content/uploads/2022/05/CSA0206-1-241x300.png", stdPrice:1080, vipPrice:880, desc:"Theia 吸頂 6W，住宅走廊首選" },
  { id:23, model:"CSA0212-1",   series:"THEIA", category:"吸頂燈", watt:"12W", cct:"3000K / 4000K", beam:"24°", image:"https://www.ledouxlight.com/wp-content/uploads/2022/05/CSA0212-1-241x300.png", stdPrice:1380, vipPrice:1120, desc:"12W 加強版，商業走廊與接待廳適用" },
];

// ── Styles ──────────────────────────────────────────────────────────────────
const G = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Noto+Sans+TC:wght@200;300;400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --ivory: #f7f4ef;
  --ivory2: #efe9e0;
  --black: #0e0d0c;
  --black2: #1c1a18;
  --gold: #b8935a;
  --gold2: #d4a96a;
  --muted: #8a8278;
  --bdr: #d8d0c4;
  --bdr2: #e8e2d8;
  --red: #9b3a3a;
  --green: #3a6b4a;
}

body {
  background: var(--ivory);
  color: var(--black);
  font-family: 'Noto Sans TC', sans-serif;
  font-weight: 300;
  -webkit-font-smoothing: antialiased;
}

/* ── AUTH PAGE ── */
.auth-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--black);
}
@media (max-width: 768px) {
  .auth-page { grid-template-columns: 1fr; }
  .auth-visual { display: none; }
}
.auth-visual {
  background: linear-gradient(160deg, #1a1612 0%, #0e0d0c 100%);
  display: flex; flex-direction: column;
  justify-content: flex-end; padding: 64px;
  border-right: 1px solid #2a2520;
  position: relative; overflow: hidden;
}
.auth-visual::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse at 30% 60%, rgba(184,147,90,.08) 0%, transparent 60%);
}
.av-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: auto; padding-bottom: 0; }
.av-logo { font-family: 'Cormorant Garamond', serif; font-size: 13px; letter-spacing: 8px; color: var(--gold); text-transform: uppercase; }
.av-year { font-size: 9px; letter-spacing: 3px; color: #3a3028; text-transform: uppercase; }
.av-center { margin: auto 0; }
.av-title { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 300; color: #e8e0d4; letter-spacing: 6px; text-transform: uppercase; margin: 20px 0 6px; }
.av-title-en { font-size: 9px; letter-spacing: 4px; color: #4a4038; text-transform: uppercase; margin-bottom: 20px; }
.av-desc { font-size: 8px; letter-spacing: 4px; color: #3a3028; text-transform: uppercase; }
.av-line { width: 100%; height: 1px; background: linear-gradient(to right, transparent, #2e2820, transparent); }

.auth-form-side {
  background: var(--ivory);
  display: flex; align-items: center; justify-content: center;
  padding: 48px 32px;
}
.auth-inner { width: 100%; max-width: 380px; }
.auth-logo-sm { font-family: 'Cormorant Garamond', serif; font-size: 22px; letter-spacing: 4px; color: var(--black); margin-bottom: 4px; }
.auth-tagline { font-size: 10px; letter-spacing: 3px; color: var(--muted); text-transform: uppercase; margin-bottom: 40px; }

.auth-tabs { display: flex; border-bottom: 1px solid var(--bdr); margin-bottom: 32px; }
.atab { flex: 1; padding: 12px; text-align: center; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: var(--muted); cursor: pointer; border-bottom: 1px solid transparent; margin-bottom: -1px; transition: all .2s; }
.atab.on { color: var(--black); border-bottom-color: var(--gold); }

.lf { margin-bottom: 20px; }
.lf label { display: block; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
.lf input { width: 100%; padding: 12px 0; background: transparent; border: none; border-bottom: 1px solid var(--bdr); color: var(--black); font-family: 'Noto Sans TC', sans-serif; font-size: 13px; outline: none; transition: border-color .2s; border-radius: 0; }
.lf input:focus { border-bottom-color: var(--gold); }
.lf input.err-input { border-bottom-color: var(--red); }
.lf input::placeholder { color: var(--bdr); }
.ferr { font-size: 10px; color: var(--red); margin-top: 5px; }
.req { color: var(--gold); margin-left: 2px; }

.r2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.sec-lbl { font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: var(--muted); text-align: center; margin: 24px 0 20px; position: relative; }
.sec-lbl::before, .sec-lbl::after { content: ''; position: absolute; top: 50%; width: 30%; height: 1px; background: var(--bdr2); }
.sec-lbl::before { left: 0; }
.sec-lbl::after { right: 0; }

.btn-primary {
  width: 100%; padding: 14px; background: var(--black); border: none;
  color: var(--ivory); font-family: 'Noto Sans TC', sans-serif;
  font-size: 10px; letter-spacing: 3px; text-transform: uppercase;
  cursor: pointer; transition: background .2s; margin-top: 8px;
}
.btn-primary:hover { background: var(--black2); }
.btn-primary:disabled { opacity: .4; cursor: not-allowed; }

.btn-bio {
  width: 100%; padding: 12px; background: transparent;
  border: 1px solid var(--bdr); color: var(--muted);
  font-family: 'Noto Sans TC', sans-serif; font-size: 10px;
  letter-spacing: 2px; cursor: pointer; transition: all .2s; margin-top: 10px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.btn-bio:hover { border-color: var(--gold); color: var(--gold); }

.auth-hint { font-size: 10px; color: var(--muted); text-align: center; margin-top: 20px; line-height: 1.8; letter-spacing: .5px; }
.auth-err { font-size: 11px; color: var(--red); text-align: center; margin-top: 14px; }

.first-notice { background: #f9f5ee; border: 1px solid var(--gold); border-left: 3px solid var(--gold); padding: 12px 16px; margin-bottom: 24px; font-size: 11px; color: var(--gold); line-height: 1.7; }

/* ── WAIT / AUTO-ADMIN SCREENS ── */
.info-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--ivory); padding: 24px; }
.info-card { max-width: 480px; width: 100%; border: 1px solid var(--bdr); padding: 56px 48px; text-align: center; }
.info-icon { font-size: 40px; margin-bottom: 24px; }
.info-title { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 400; margin-bottom: 8px; color: var(--black); }
.info-sub { font-size: 11px; color: var(--gold); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 24px; }
.info-desc { font-size: 12px; color: var(--muted); line-height: 1.9; margin-bottom: 28px; }
.info-table { text-align: left; border-top: 1px solid var(--bdr2); }
.info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--bdr2); font-size: 12px; }
.info-row span:first-child { color: var(--muted); }
.btn-outline { padding: 12px 32px; background: transparent; border: 1px solid var(--black); color: var(--black); font-family: 'Noto Sans TC', sans-serif; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; cursor: pointer; margin-top: 28px; transition: all .2s; }
.btn-outline:hover { background: var(--black); color: var(--ivory); }

/* ── APP SHELL ── */
.app { min-height: 100vh; background: var(--ivory); display: flex; flex-direction: column; }

/* TOP NAV */
.topnav {
  background: var(--black); color: var(--ivory);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 28px; height: 56px; position: sticky; top: 0; z-index: 50;
  border-bottom: 1px solid #1e1c18;
}
.tn-left { display: flex; align-items: center; gap: 20px; }
.tn-hamburger { background: none; border: none; cursor: pointer; display: flex; flex-direction: column; gap: 5px; padding: 6px; }
.tn-hamburger span { display: block; width: 22px; height: 1px; background: #8a7a6a; transition: all .25s; }
.tn-hamburger:hover span { background: var(--gold); }
.tn-logo { font-family: 'Cormorant Garamond', serif; font-size: 15px; letter-spacing: 5px; color: var(--gold); text-transform: uppercase; }
.tn-right { display: flex; align-items: center; gap: 16px; }
.tn-user { text-align: right; }
.tn-uname { font-size: 11px; color: var(--ivory); }
.tn-urole { font-size: 9px; color: #6a5a4a; letter-spacing: 1px; margin-top: 1px; }
.tn-badge { font-size: 8px; padding: 2px 8px; border: 1px solid; letter-spacing: 1px; }
.tb-admin { color: #c45a5a; border-color: rgba(196,90,90,.4); }
.tb-vip { color: var(--gold); border-color: rgba(184,147,90,.4); }
.tb-standard { color: #8a7a6a; border-color: #3a3530; }
.btn-out2 { padding: 6px 14px; background: transparent; border: 1px solid #2a2520; color: #6a5a4a; font-family: 'Noto Sans TC', sans-serif; font-size: 9px; letter-spacing: 2px; cursor: pointer; transition: all .2s; }
.btn-out2:hover { border-color: #c45a5a; color: #c45a5a; }

/* SIDE MENU DRAWER */
.sidemenu-overlay { position: fixed; inset: 0; background: rgba(14,13,12,.5); z-index: 100; }
.sidemenu { position: fixed; top: 0; left: 0; bottom: 0; width: 280px; background: var(--black); z-index: 101; display: flex; flex-direction: column; transform: translateX(-100%); transition: transform .3s cubic-bezier(.4,0,.2,1); }
.sidemenu.open { transform: translateX(0); }
.sm-head { padding: 20px 24px 16px; border-bottom: 1px solid #1e1c18; display: flex; align-items: center; justify-content: space-between; }
.sm-logo { font-family: 'Cormorant Garamond', serif; font-size: 14px; letter-spacing: 5px; color: var(--gold); }
.sm-close { background: none; border: none; color: #6a5a4a; font-size: 18px; cursor: pointer; }
.sm-close:hover { color: var(--ivory); }
.sm-user { padding: 20px 24px; border-bottom: 1px solid #1e1c18; }
.sm-uname { font-size: 13px; color: var(--ivory); font-weight: 400; }
.sm-ucomp { font-size: 10px; color: #6a5a4a; margin-top: 3px; letter-spacing: .5px; }
.sm-ubadge { font-size: 8px; padding: 2px 8px; border: 1px solid; letter-spacing: 1px; display: inline-block; margin-top: 8px; }
.sm-nav { flex: 1; padding: 12px 0; overflow-y: auto; }
.sm-item { display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #6a5a4a; cursor: pointer; transition: all .15s; border-left: 2px solid transparent; }
.sm-item:hover { color: var(--ivory); background: #161410; }
.sm-item.on { color: var(--gold); border-left-color: var(--gold); background: rgba(184,147,90,.05); }
.sm-badge { min-width: 18px; height: 18px; background: #9b3a3a; color: #fff; font-size: 9px; border-radius: 9px; display: flex; align-items: center; justify-content: center; padding: 0 5px; }
.sm-divider { height: 1px; background: #1e1c18; margin: 8px 24px; }
.sm-foot { padding: 16px 24px; border-top: 1px solid #1e1c18; }
.btn-out3 { width: 100%; padding: 10px; background: transparent; border: 1px solid #2a2520; color: #6a5a4a; font-family: 'Noto Sans TC', sans-serif; font-size: 9px; letter-spacing: 3px; text-transform: uppercase; cursor: pointer; transition: all .2s; }
.btn-out3:hover { border-color: #9b3a3a; color: #9b3a3a; }

/* MAIN CONTENT */
.content { flex: 1; padding: 48px; max-width: 1400px; margin: 0 auto; width: 100%; }

/* PAGE HEADER */
.phead { margin-bottom: 40px; display: flex; align-items: flex-end; justify-content: space-between; border-bottom: 1px solid var(--bdr2); padding-bottom: 24px; }
.phead-left {}
.ptitle { font-family: 'Cormorant Garamond', serif; font-size: 36px; font-weight: 300; color: var(--black); line-height: 1; }
.psub { font-size: 10px; letter-spacing: 2px; color: var(--muted); text-transform: uppercase; margin-top: 8px; }
.pcount { font-size: 11px; color: var(--muted); }

/* CATEGORY FILTER */
.catbar { display: flex; gap: 0; margin-bottom: 36px; border-bottom: 1px solid var(--bdr2); overflow-x: auto; }
.catbtn { padding: 12px 24px; background: transparent; border: none; border-bottom: 2px solid transparent; color: var(--muted); font-family: 'Noto Sans TC', sans-serif; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; white-space: nowrap; margin-bottom: -1px; transition: all .2s; }
.catbtn:hover { color: var(--black); }
.catbtn.on { color: var(--black); border-bottom-color: var(--gold); }

/* PRODUCT GRID */
.pgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1px; background: var(--bdr2); border: 1px solid var(--bdr2); }
.pcard { background: var(--ivory); cursor: pointer; transition: background .2s; display: flex; flex-direction: column; }
.pcard:hover { background: #f2ece3; }
.pcard:hover .pcard-img img { transform: scale(1.04); }
.pcard-img { height: 200px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #f0ebe2; }
.pcard-img img { max-height: 175px; max-width: 80%; object-fit: contain; transition: transform .4s ease; }
.pcard-body { padding: 20px 22px 24px; flex: 1; display: flex; flex-direction: column; }
.pcard-series { font-size: 8px; letter-spacing: 3px; text-transform: uppercase; color: var(--gold); margin-bottom: 5px; }
.pcard-model { font-size: 16px; font-family: 'Cormorant Garamond', serif; font-weight: 400; color: var(--black); margin-bottom: 6px; }
.pcard-desc { font-size: 11px; color: var(--muted); line-height: 1.7; margin-bottom: 14px; flex: 1; }
.pcard-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
.ptag { font-size: 9px; padding: 3px 8px; border: 1px solid var(--bdr); color: var(--muted); letter-spacing: 1px; }
.pcard-price { border-top: 1px solid var(--bdr2); padding-top: 14px; display: flex; justify-content: space-between; align-items: flex-end; }
.price-vip-val { font-family: 'Cormorant Garamond', serif; font-size: 22px; color: var(--gold); }
.price-std-val { font-family: 'Cormorant Garamond', serif; font-size: 22px; color: var(--black); }
.price-old { font-size: 10px; color: var(--muted); text-decoration: line-through; }
.vip-tag { font-size: 8px; padding: 2px 7px; background: var(--black); color: var(--gold); letter-spacing: 1px; }

/* PRODUCT DETAIL DRAWER */
.drawer-overlay { position: fixed; inset: 0; background: rgba(14,13,12,.6); z-index: 200; display: flex; justify-content: flex-end; backdrop-filter: blur(2px); }
.drawer { width: 480px; max-width: 95vw; background: var(--ivory); height: 100vh; overflow-y: auto; display: flex; flex-direction: column; box-shadow: -20px 0 60px rgba(0,0,0,.15); }
.drawer-top { padding: 28px 32px; border-bottom: 1px solid var(--bdr2); display: flex; justify-content: space-between; align-items: center; }
.drawer-series { font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: var(--gold); }
.drawer-close { background: none; border: none; font-size: 20px; color: var(--muted); cursor: pointer; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; }
.drawer-close:hover { color: var(--black); }
.drawer-img { height: 260px; background: #f0ebe2; display: flex; align-items: center; justify-content: center; }
.drawer-img img { max-height: 230px; object-fit: contain; }
.drawer-body { padding: 32px; flex: 1; }
.drawer-model { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 300; margin-bottom: 6px; }
.drawer-desc { font-size: 12px; color: var(--muted); line-height: 1.8; margin-bottom: 28px; }
.spec-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }
.spec-item { border: 1px solid var(--bdr2); padding: 12px 14px; }
.spec-label { font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-bottom: 5px; }
.spec-val { font-size: 13px; color: var(--black); font-weight: 400; }
.price-block { border-top: 1px solid var(--bdr2); padding-top: 24px; }
.price-block-label { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
.price-block-val { font-family: 'Cormorant Garamond', serif; font-size: 40px; font-weight: 300; color: var(--gold); }
.price-block-old { font-size: 12px; color: var(--muted); margin-top: 4px; }
.price-block-std { font-family: 'Cormorant Garamond', serif; font-size: 40px; font-weight: 300; color: var(--black); }
.price-block-note { font-size: 11px; color: var(--muted); margin-top: 6px; font-style: italic; }

/* ADMIN SECTIONS */
.stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 1px; background: var(--bdr2); border: 1px solid var(--bdr2); margin-bottom: 36px; }
.stat-box { background: var(--ivory); padding: 24px 28px; }
.stat-num { font-family: 'Cormorant Garamond', serif; font-size: 40px; font-weight: 300; color: var(--black); }
.stat-lbl { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-top: 4px; }

.section { margin-bottom: 40px; }
.section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid var(--bdr2); }
.section-title { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 300; }
.btn-add2 { padding: 9px 20px; background: var(--black); border: none; color: var(--ivory); font-family: 'Noto Sans TC', sans-serif; font-size: 9px; letter-spacing: 2px; cursor: pointer; transition: background .2s; }
.btn-add2:hover { background: var(--black2); }

/* TABLE */
.tbl-wrap { border: 1px solid var(--bdr2); overflow: hidden; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); padding: 10px 16px; border-bottom: 1px solid var(--bdr2); background: #f4efe8; font-weight: 400; }
td { padding: 13px 16px; border-bottom: 1px solid var(--bdr2); font-size: 12px; color: var(--black); }
tr:last-child td { border-bottom: none; }
tr:hover td { background: #f7f2eb; }

.rb { font-size: 8px; padding: 2px 8px; letter-spacing: 1px; text-transform: uppercase; border: 1px solid; display: inline-block; }
.r-admin { color: #9b3a3a; border-color: rgba(155,58,58,.4); background: rgba(155,58,58,.06); }
.r-vip { color: var(--gold); border-color: rgba(184,147,90,.4); background: rgba(184,147,90,.06); }
.r-standard { color: var(--muted); border-color: var(--bdr); }

.role-sel { background: transparent; border: 1px solid var(--bdr); color: var(--black); padding: 4px 8px; font-size: 11px; font-family: 'Noto Sans TC', sans-serif; cursor: pointer; }
.role-sel option { background: var(--ivory); }

.btn-ok { font-size: 10px; padding: 5px 12px; border: 1px solid rgba(58,107,74,.5); background: transparent; color: var(--green); cursor: pointer; letter-spacing: 1px; transition: all .2s; }
.btn-ok:hover { background: rgba(58,107,74,.08); }
.btn-ng { font-size: 10px; padding: 5px 12px; border: 1px solid rgba(155,58,58,.5); background: transparent; color: var(--red); cursor: pointer; letter-spacing: 1px; transition: all .2s; }
.btn-ng:hover { background: rgba(155,58,58,.08); }
.btn-del2 { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 14px; }
.btn-del2:hover { color: var(--red); }

.empty { text-align: center; padding: 60px; color: var(--muted); font-size: 12px; letter-spacing: 1px; }

/* FORM PANEL */
.form-panel { border: 1px solid var(--bdr2); padding: 28px; margin-bottom: 24px; background: #f9f5ef; }
.fp-title { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 300; margin-bottom: 20px; }
.fgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.ff { }
.ff.full { grid-column: 1 / -1; }
.ff label { display: block; font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-bottom: 7px; }
.ff input, .ff select { width: 100%; padding: 10px 0; background: transparent; border: none; border-bottom: 1px solid var(--bdr); color: var(--black); font-family: 'Noto Sans TC', sans-serif; font-size: 12px; outline: none; transition: border-color .2s; }
.ff input:focus, .ff select:focus { border-bottom-color: var(--gold); }
.ff select option { background: var(--ivory); }
.form-actions { margin-top: 20px; display: flex; gap: 12px; }
.btn-confirm { padding: 11px 28px; background: var(--black); border: none; color: var(--ivory); font-family: 'Noto Sans TC', sans-serif; font-size: 9px; letter-spacing: 2px; cursor: pointer; }
.btn-confirm:hover { background: var(--black2); }
.btn-cancel2 { padding: 11px 20px; background: transparent; border: 1px solid var(--bdr); color: var(--muted); font-family: 'Noto Sans TC', sans-serif; font-size: 9px; letter-spacing: 2px; cursor: pointer; }

/* APPROVE MODAL */
.modal-wrap { position: fixed; inset: 0; background: rgba(14,13,12,.7); z-index: 300; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(3px); }
.modal-box { background: var(--ivory); width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
.modal-head { padding: 24px 28px; border-bottom: 1px solid var(--bdr2); display: flex; justify-content: space-between; align-items: center; }
.modal-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 300; }
.modal-close { background: none; border: none; font-size: 18px; color: var(--muted); cursor: pointer; }
.modal-body { padding: 28px; }
.applicant-card { background: #f4efe8; border: 1px solid var(--bdr2); padding: 16px; margin-bottom: 24px; }
.ac-name { font-size: 14px; font-weight: 400; margin-bottom: 4px; }
.ac-detail { font-size: 11px; color: var(--muted); line-height: 1.7; }

/* TOAST */
.toast { position: fixed; bottom: 32px; right: 32px; background: var(--black); color: var(--ivory); padding: 14px 22px; font-size: 11px; letter-spacing: 1px; z-index: 999; border-left: 3px solid var(--gold); }
`;

export default function App() {
  const [members, setMembers] = useState(INIT_MEMBERS);
  const [pending, setPending] = useState([]);
  const [products, setProducts] = useState(PRODUCTS);
  const [user, setUser] = useState(null);
  const [waitInfo, setWaitInfo] = useState(null);
  const [autoAdmin, setAutoAdmin] = useState(null);
  const [page, setPage] = useState("catalog");
  const [cat, setCat] = useState("全部");
  const [selProd, setSelProd] = useState(null);
  const [showAddProd, setShowAddProd] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState(null);
  const [toast, setToast] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authTab, setAuthTab] = useState("login");
  const [loginF, setLoginF] = useState({ username: "", password: "" });
  const [loginErr, setLoginErr] = useState("");
  const [regF, setRegF] = useState({ name:"", position:"", company:"", taxId:"", phone:"", email:"", username:"", password:"" });
  const [fe, setFe] = useState({}); // field errors
  const [newProd, setNewProd] = useState({ model:"", series:"", category:"崁燈", watt:"", cct:"3000K / 4000K", beam:"24°", image:"", stdPrice:"", vipPrice:"", desc:"" });
  const [approveF, setApproveF] = useState({ username:"", password:"", role:"standard" });

  const toast$ = (m) => { setToast(m); setTimeout(() => setToast(""), 3000); };
  const isVip = user?.role === "vip" || user?.role === "admin";
  const roleLabel = (r) => ({ admin:"管理者", vip:"VIP 客戶", standard:"一般客戶" })[r] || r;
  const isFirst = members.length === 0 && pending.length === 0;
  const cats = ["全部", ...new Set(products.map(p => p.category))];
  const filtered = cat === "全部" ? products : products.filter(p => p.category === cat);

  const saveCredential = async (u, p) => {
    if (!window.PasswordCredential) return;
    try { await navigator.credentials.store(new window.PasswordCredential({ id: u, password: p })); } catch (_) {}
  };

  const tryAutoLogin = async () => {
    if (!navigator.credentials) { toast$("此瀏覽器不支援自動登入"); return; }
    try {
      const cred = await navigator.credentials.get({ password: true, mediation: "optional" });
      if (cred?.id) {
        const m = members.find(m => m.username === cred.id && m.password === cred.password);
        if (m) { setUser(m); toast$("✓ 自動登入成功"); return; }
        setLoginErr("找不到對應帳號，請手動輸入");
      } else { toast$("未找到已儲存帳號，請手動登入"); }
    } catch (_) { toast$("請手動登入"); }
  };

  const doLogin = async () => {
    const m = members.find(m => m.username === loginF.username && m.password === loginF.password);
    if (m) { await saveCredential(loginF.username, loginF.password); setUser(m); return; }
    setLoginErr("帳號或密碼錯誤，請確認後重試");
  };

  const doRegister = async () => {
    const req = { name:"姓名", position:"職稱", company:"公司全名", taxId:"統一編號", phone:"聯絡電話", email:"Email", username:"帳號", password:"密碼" };
    const errs = {};
    Object.entries(req).forEach(([k, lbl]) => { if (!regF[k]?.trim()) errs[k] = `${lbl} 為必填`; });
    if (regF.taxId && !/^\d{8}$/.test(regF.taxId.trim())) errs.taxId = "須為 8 位數字";
    if (members.find(m => m.username === regF.username) || pending.find(p => p.username === regF.username)) errs.username = "帳號已被使用";
    setFe(errs);
    if (Object.keys(errs).length > 0) return;
    setSubmitting(true);
    if (isFirst) {
      const a = { id: Date.now(), ...regF, role:"admin", status:"approved", approvedAt: new Date().toISOString().split("T")[0] };
      setMembers([a]); setAutoAdmin(a); setSubmitting(false); return;
    }
    const app = { id: Date.now(), ...regF, status:"pending", appliedAt: new Date().toISOString().split("T")[0] };
    if (FORMSPREE_ID !== "YOUR_FORM_ID") {
      try { await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ subject:`新申請：${regF.name} / ${regF.company}`, ...regF }) }); } catch (_) {}
    }
    setPending(p => [...p, app]); setWaitInfo(app); setSubmitting(false);
  };

  const doApprove = () => {
    if (!approveF.username || !approveF.password) return;
    setMembers(x => [...x, { ...approveTarget, ...approveF, status:"approved", approvedAt: new Date().toISOString().split("T")[0] }]);
    setPending(x => x.filter(p => p.id !== approveTarget.id));
    setApproveTarget(null); toast$("✓ 帳號已開通");
  };

  const changeRole = (id, r) => {
    setMembers(x => x.map(m => m.id === id ? {...m, role:r} : m));
    if (user?.id === id) setUser(u => ({...u, role:r}));
    toast$("✓ 權限已更新");
  };

  const doAddProd = () => {
    if (!newProd.model) return;
    setProducts(x => [...x, { ...newProd, id: Date.now(), stdPrice: Number(newProd.stdPrice), vipPrice: Number(newProd.vipPrice) }]);
    setNewProd({ model:"", series:"", category:"崁燈", watt:"", cct:"3000K / 4000K", beam:"24°", image:"", stdPrice:"", vipPrice:"", desc:"" });
    setShowAddProd(false); toast$("✓ 產品已新增");
  };

  const resetReg = () => { setRegF({ name:"", position:"", company:"", taxId:"", phone:"", email:"", username:"", password:"" }); setFe({}); setAuthTab("login"); };

  // ── Auto admin screen ──
  if (autoAdmin) return (
    <>
      <style>{G}</style>
      <div className="info-page">
        <div className="info-card">
          <div className="info-icon">✦</div>
          <div className="info-title">歡迎加入</div>
          <div className="info-sub">管理者帳號已建立</div>
          <div className="info-desc">您是本系統第一位使用者，已自動取得管理者權限。請妥善保管您的帳號資訊。</div>
          <div className="info-table">
            <div className="info-row"><span>姓名</span><span>{autoAdmin.name}・{autoAdmin.position}</span></div>
            <div className="info-row"><span>公司</span><span>{autoAdmin.company}</span></div>
            <div className="info-row"><span>帳號</span><span style={{fontFamily:"monospace"}}>{autoAdmin.username}</span></div>
            <div className="info-row"><span>身份</span><span style={{color:"var(--gold)"}}>管理者</span></div>
          </div>
          <button className="btn-outline" onClick={() => { setAutoAdmin(null); setLoginF({ username: autoAdmin.username, password: autoAdmin.password }); }}>進入系統</button>
        </div>
      </div>
    </>
  );

  // ── Wait screen ──
  if (waitInfo) return (
    <>
      <style>{G}</style>
      <div className="info-page">
        <div className="info-card">
          <div className="info-icon">◈</div>
          <div className="info-title">申請已提交</div>
          <div className="info-sub">等待專員審核</div>
          <div className="info-desc">感謝您的申請。我們的專員將審核您的資料後開通帳號，請稍候。</div>
          <div className="info-table">
            <div className="info-row"><span>姓名</span><span>{waitInfo.name}・{waitInfo.position}</span></div>
            <div className="info-row"><span>公司</span><span>{waitInfo.company}</span></div>
            <div className="info-row"><span>統一編號</span><span>{waitInfo.taxId}</span></div>
            <div className="info-row"><span>申請帳號</span><span style={{fontFamily:"monospace"}}>{waitInfo.username}</span></div>
            <div className="info-row"><span>申請日期</span><span>{waitInfo.appliedAt}</span></div>
          </div>
          <button className="btn-outline" onClick={() => { setWaitInfo(null); resetReg(); }}>返回登入</button>
        </div>
      </div>
    </>
  );

  // ── Login / Register ──
  if (!user) return (
    <>
      <style>{G}</style>
      <div className="auth-page">
        <div className="auth-visual">
          <div className="av-top">
            <div className="av-logo">LEDOUX</div>
            <div className="av-year">Est. 2002</div>
          </div>
          <div className="av-center">
            <div className="av-line" />
            <div className="av-title">報價系統</div>
            <div className="av-title-en">Quotation Platform</div>
            <div className="av-line" />
          </div>
          <div className="av-desc">Authorized Partners Only</div>
        </div>
        <div className="auth-form-side">
          <div className="auth-inner">
            <div className="auth-logo-sm">LEDOUX</div>
            <div className="auth-tagline">Taiwan · 專業報價系統</div>
            <div className="auth-tabs">
              <div className={`atab ${authTab==="login"?"on":""}`} onClick={() => { setAuthTab("login"); setLoginErr(""); setFe({}); }}>登入</div>
              <div className={`atab ${authTab==="register"?"on":""}`} onClick={() => { setAuthTab("register"); setLoginErr(""); setFe({}); }}>申請帳號</div>
            </div>

            {authTab === "login" ? (
              <>
                <div className="lf"><label>帳號</label><input value={loginF.username} onChange={e => setLoginF(p=>({...p,username:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="請輸入帳號" /></div>
                <div className="lf"><label>密碼</label><input type="password" value={loginF.password} onChange={e => setLoginF(p=>({...p,password:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="請輸入密碼" /></div>
                <button className="btn-primary" onClick={doLogin}>登入系統</button>
                <button className="btn-bio" onClick={tryAutoLogin}>🔐 Face ID / 指紋 / 已儲存帳號</button>
                {loginErr && <div className="auth-err">{loginErr}</div>}
                <div className="auth-hint">本系統為 Ledoux Taiwan 專屬報價平台<br />帳號需由專員審核後開通</div>
              </>
            ) : (
              <>
                {isFirst && <div className="first-notice">✦ 系統尚無帳號，您將自動成為第一位管理者</div>}
                <div className="r2">
                  <div className="lf"><label>姓名<span className="req">*</span></label><input value={regF.name} onChange={e=>{setRegF(p=>({...p,name:e.target.value}));setFe(p=>({...p,name:""}));}} className={fe.name?"err-input":""} placeholder="您的姓名" />{fe.name&&<div className="ferr">{fe.name}</div>}</div>
                  <div className="lf"><label>職稱<span className="req">*</span></label><input value={regF.position} onChange={e=>{setRegF(p=>({...p,position:e.target.value}));setFe(p=>({...p,position:""}));}} className={fe.position?"err-input":""} placeholder="採購經理" />{fe.position&&<div className="ferr">{fe.position}</div>}</div>
                </div>
                <div className="lf"><label>公司全名<span className="req">*</span></label><input value={regF.company} onChange={e=>{setRegF(p=>({...p,company:e.target.value}));setFe(p=>({...p,company:""}));}} className={fe.company?"err-input":""} placeholder="含有限公司／股份有限公司" />{fe.company&&<div className="ferr">{fe.company}</div>}</div>
                <div className="r2">
                  <div className="lf"><label>統一編號<span className="req">*</span></label><input value={regF.taxId} onChange={e=>{setRegF(p=>({...p,taxId:e.target.value}));setFe(p=>({...p,taxId:""}));}} className={fe.taxId?"err-input":""} placeholder="8 位數字" maxLength={8} />{fe.taxId&&<div className="ferr">{fe.taxId}</div>}</div>
                  <div className="lf"><label>聯絡電話<span className="req">*</span></label><input value={regF.phone} onChange={e=>{setRegF(p=>({...p,phone:e.target.value}));setFe(p=>({...p,phone:""}));}} className={fe.phone?"err-input":""} placeholder="0912-345-678" />{fe.phone&&<div className="ferr">{fe.phone}</div>}</div>
                </div>
                <div className="lf"><label>Email<span className="req">*</span></label><input value={regF.email} onChange={e=>{setRegF(p=>({...p,email:e.target.value}));setFe(p=>({...p,email:""}));}} className={fe.email?"err-input":""} placeholder="name@company.com" />{fe.email&&<div className="ferr">{fe.email}</div>}</div>
                <div className="sec-lbl">設定登入帳號</div>
                <div className="r2">
                  <div className="lf"><label>帳號<span className="req">*</span></label><input value={regF.username} onChange={e=>{setRegF(p=>({...p,username:e.target.value}));setFe(p=>({...p,username:""}));}} className={fe.username?"err-input":""} placeholder="自訂帳號" />{fe.username&&<div className="ferr">{fe.username}</div>}</div>
                  <div className="lf"><label>密碼<span className="req">*</span></label><input type="password" value={regF.password} onChange={e=>{setRegF(p=>({...p,password:e.target.value}));setFe(p=>({...p,password:""}));}} className={fe.password?"err-input":""} placeholder="設定密碼" />{fe.password&&<div className="ferr">{fe.password}</div>}</div>
                </div>
                <button className="btn-primary" onClick={doRegister} disabled={submitting}>{submitting?"送出中...":isFirst?"建立管理者帳號":"送出申請"}</button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );

  // ── Logged in ──
  const navItems = [
    { id:"catalog", label:"產品目錄" },
    ...(user.role==="admin" ? [
      { id:"pending", label:"待審核", badge: pending.length },
      { id:"members", label:"帳號管理" },
      { id:"products", label:"產品管理" },
    ] : []),
  ];

  return (
    <>
      <style>{G}</style>
      <div className="app">

        {/* SIDE MENU */}
        {menuOpen && <div className="sidemenu-overlay" onClick={() => setMenuOpen(false)} />}
        <div className={`sidemenu ${menuOpen ? "open" : ""}`}>
          <div className="sm-head">
            <div className="sm-logo">LEDOUX</div>
            <button className="sm-close" onClick={() => setMenuOpen(false)}>✕</button>
          </div>
          <div className="sm-user">
            <div className="sm-uname">{user.name}</div>
            <div className="sm-ucomp">{user.company}</div>
            <span className={`sm-ubadge ${user.role==="admin"?"tb-admin":user.role==="vip"?"tb-vip":"tb-standard"}`}>{roleLabel(user.role)}</span>
          </div>
          <div className="sm-nav">
            {navItems.map((n, i) => (
              <div key={n.id}>
                {i > 0 && navItems[i-1].id === "catalog" && <div className="sm-divider" />}
                <div className={`sm-item ${page===n.id?"on":""}`} onClick={() => { setPage(n.id); setMenuOpen(false); }}>
                  <span>{n.label}</span>
                  {n.badge > 0 && <span className="sm-badge">{n.badge}</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="sm-foot">
            <button className="btn-out3" onClick={() => { setUser(null); setPage("catalog"); setMenuOpen(false); }}>登出系統</button>
          </div>
        </div>

        {/* TOP NAV */}
        <nav className="topnav">
          <div className="tn-left">
            <button className="tn-hamburger" onClick={() => setMenuOpen(v => !v)}>
              <span /><span /><span />
            </button>
            <div className="tn-logo">LEDOUX</div>
          </div>
          <div className="tn-right">
            <div className="tn-user">
              <div className="tn-uname">{user.name}</div>
              <div className="tn-urole">{user.company}</div>
            </div>
            <span className={`tn-badge ${user.role==="admin"?"tb-admin":user.role==="vip"?"tb-vip":"tb-standard"}`}>{roleLabel(user.role)}</span>
            <button className="btn-out2" onClick={() => { setUser(null); setPage("catalog"); }}>登出</button>
          </div>
        </nav>

        <div className="content">

          {/* ── 產品目錄 ── */}
          {page === "catalog" && <>
            <div className="phead">
              <div className="phead-left">
                <div className="ptitle">產品目錄</div>
                <div className="psub">{isVip ? "VIP 特別優惠價格已啟用" : "Standard Collection · 如需特別報價請洽業務"}</div>
              </div>
              <div className="pcount">{filtered.length} 件商品</div>
            </div>
            <div className="catbar">
              {cats.map(c => <button key={c} className={`catbtn ${cat===c?"on":""}`} onClick={() => setCat(c)}>{c}</button>)}
            </div>
            <div className="pgrid">
              {filtered.map(p => (
                <div key={p.id} className="pcard" onClick={() => setSelProd(p)}>
                  <div className="pcard-img">
                    {p.image ? <img src={p.image} alt={p.model} /> : <span style={{fontSize:48,color:"var(--bdr)"}}>◎</span>}
                  </div>
                  <div className="pcard-body">
                    <div className="pcard-series">{p.series}</div>
                    <div className="pcard-model">{p.model}</div>
                    <div className="pcard-desc">{p.desc}</div>
                    <div className="pcard-tags">
                      {p.watt && <span className="ptag">{p.watt}</span>}
                      {p.cct && <span className="ptag">{p.cct}</span>}
                      {p.beam && <span className="ptag">{p.beam}</span>}
                    </div>
                    <div className="pcard-price">
                      {isVip ? (
                        <div>
                          <div className="price-old">NT$ {p.stdPrice?.toLocaleString()}</div>
                          <div className="price-vip-val">NT$ {p.vipPrice?.toLocaleString()}</div>
                        </div>
                      ) : (
                        <div className="price-std-val">NT$ {p.stdPrice?.toLocaleString()}</div>
                      )}
                      {isVip && <span className="vip-tag">VIP</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>}

          {/* ── 待審核 ── */}
          {page === "pending" && user.role === "admin" && <>
            <div className="phead"><div className="phead-left"><div className="ptitle">待審核申請</div><div className="psub">核准後設定帳號與權限</div></div></div>
            {approveTarget && (
              <div className="modal-wrap" onClick={() => setApproveTarget(null)}>
                <div className="modal-box" onClick={e => e.stopPropagation()}>
                  <div className="modal-head">
                    <div className="modal-title">核准申請</div>
                    <button className="modal-close" onClick={() => setApproveTarget(null)}>✕</button>
                  </div>
                  <div className="modal-body">
                    <div className="applicant-card">
                      <div className="ac-name">{approveTarget.name}・{approveTarget.position}</div>
                      <div className="ac-detail">{approveTarget.company}<br />{approveTarget.taxId && `統編：${approveTarget.taxId}`}<br />{approveTarget.email} · {approveTarget.phone}</div>
                    </div>
                    <div className="fgrid">
                      <div className="ff"><label>登入帳號</label><input value={approveF.username} onChange={e=>setApproveF(p=>({...p,username:e.target.value}))} placeholder={approveTarget.username} /></div>
                      <div className="ff"><label>登入密碼</label><input value={approveF.password} onChange={e=>setApproveF(p=>({...p,password:e.target.value}))} placeholder="設定密碼" /></div>
                      <div className="ff full"><label>報價權限</label>
                        <select value={approveF.role} onChange={e=>setApproveF(p=>({...p,role:e.target.value}))}>
                          <option value="standard">一般客戶（標準售價）</option>
                          <option value="vip">VIP 客戶（特別優惠價）</option>
                          <option value="admin">管理者（可管理系統）</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-actions"><button className="btn-confirm" onClick={doApprove}>確認核准</button><button className="btn-cancel2" onClick={() => setApproveTarget(null)}>取消</button></div>
                  </div>
                </div>
              </div>
            )}
            {pending.length === 0
              ? <div className="empty">— 目前沒有待審核的申請 —</div>
              : <div className="tbl-wrap"><table>
                  <thead><tr><th>姓名</th><th>職稱</th><th>公司</th><th>統編</th><th>電話</th><th>申請日</th><th>操作</th></tr></thead>
                  <tbody>{pending.map(p => (
                    <tr key={p.id}>
                      <td style={{fontWeight:400}}>{p.name}</td>
                      <td style={{color:"var(--muted)"}}>{p.position}</td>
                      <td>{p.company}</td>
                      <td style={{fontFamily:"monospace",color:"var(--muted)"}}>{p.taxId}</td>
                      <td style={{color:"var(--muted)"}}>{p.phone}</td>
                      <td style={{color:"var(--muted)"}}>{p.appliedAt}</td>
                      <td style={{display:"flex",gap:8}}>
                        <button className="btn-ok" onClick={() => { setApproveTarget(p); setApproveF({ username:p.username, password:p.password, role:"standard" }); }}>核准</button>
                        <button className="btn-ng" onClick={() => { setPending(x=>x.filter(x=>x.id!==p.id)); toast$("已拒絕此申請"); }}>拒絕</button>
                      </td>
                    </tr>
                  ))}</tbody>
                </table></div>
            }
          </>}

          {/* ── 帳號管理 ── */}
          {page === "members" && user.role === "admin" && <>
            <div className="phead"><div className="phead-left"><div className="ptitle">帳號管理</div><div className="psub">管理所有已開通帳號與權限</div></div></div>
            <div className="stats-row">
              <div className="stat-box"><div className="stat-num">{members.length}</div><div className="stat-lbl">總帳號數</div></div>
              <div className="stat-box"><div className="stat-num">{members.filter(m=>m.role==="admin").length}</div><div className="stat-lbl">管理者</div></div>
              <div className="stat-box"><div className="stat-num">{members.filter(m=>m.role==="vip").length}</div><div className="stat-lbl">VIP 帳號</div></div>
              <div className="stat-box"><div className="stat-num" style={{color:"var(--red)"}}>{pending.length}</div><div className="stat-lbl">待審核</div></div>
            </div>
            <div className="tbl-wrap"><table>
              <thead><tr><th>姓名</th><th>職稱</th><th>公司</th><th>帳號</th><th>密碼</th><th>目前權限</th><th>調整</th><th>開通日</th><th></th></tr></thead>
              <tbody>{members.map(m => (
                <tr key={m.id}>
                  <td style={{fontWeight:400}}>{m.name}</td>
                  <td style={{color:"var(--muted)"}}>{m.position}</td>
                  <td>{m.company}</td>
                  <td style={{fontFamily:"monospace"}}>{m.username}</td>
                  <td style={{fontFamily:"monospace",color:"var(--muted)"}}>{m.password}</td>
                  <td><span className={`rb r-${m.role}`}>{roleLabel(m.role)}</span></td>
                  <td>
                    <select className="role-sel" value={m.role} onChange={e=>changeRole(m.id,e.target.value)}>
                      <option value="standard">一般客戶</option>
                      <option value="vip">VIP 客戶</option>
                      <option value="admin">管理者</option>
                    </select>
                  </td>
                  <td style={{color:"var(--muted)"}}>{m.approvedAt}</td>
                  <td>{m.id !== user.id && <button className="btn-del2" onClick={() => { setMembers(x=>x.filter(x=>x.id!==m.id)); toast$("帳號已刪除"); }}>✕</button>}</td>
                </tr>
              ))}</tbody>
            </table></div>
          </>}

          {/* ── 產品管理 ── */}
          {page === "products" && user.role === "admin" && <>
            <div className="phead"><div className="phead-left"><div className="ptitle">產品管理</div><div className="psub">{products.length} 件商品</div></div><button className="btn-add2" onClick={() => setShowAddProd(v=>!v)}>＋ 新增產品</button></div>
            {showAddProd && (
              <div className="form-panel">
                <div className="fp-title">新增產品</div>
                <div className="fgrid">
                  <div className="ff"><label>型號</label><input value={newProd.model} onChange={e=>setNewProd(p=>({...p,model:e.target.value}))} placeholder="HB.D120" /></div>
                  <div className="ff"><label>系列</label><input value={newProd.series} onChange={e=>setNewProd(p=>({...p,series:e.target.value}))} placeholder="HEPBURN" /></div>
                  <div className="ff"><label>分類</label><select value={newProd.category} onChange={e=>setNewProd(p=>({...p,category:e.target.value}))}><option>崁燈</option><option>軌道燈</option><option>磁吸系統</option><option>吸頂燈</option><option>壁燈</option><option>戶外燈</option></select></div>
                  <div className="ff"><label>瓦數</label><input value={newProd.watt} onChange={e=>setNewProd(p=>({...p,watt:e.target.value}))} placeholder="10W" /></div>
                  <div className="ff"><label>色溫</label><input value={newProd.cct} onChange={e=>setNewProd(p=>({...p,cct:e.target.value}))} placeholder="3000K / 4000K" /></div>
                  <div className="ff"><label>光束角</label><input value={newProd.beam} onChange={e=>setNewProd(p=>({...p,beam:e.target.value}))} placeholder="24°" /></div>
                  <div className="ff"><label>標準價（NT$）</label><input type="number" value={newProd.stdPrice} onChange={e=>setNewProd(p=>({...p,stdPrice:e.target.value}))} /></div>
                  <div className="ff"><label>VIP 價（NT$）</label><input type="number" value={newProd.vipPrice} onChange={e=>setNewProd(p=>({...p,vipPrice:e.target.value}))} /></div>
                  <div className="ff full"><label>產品描述</label><input value={newProd.desc} onChange={e=>setNewProd(p=>({...p,desc:e.target.value}))} placeholder="簡短描述這款產品的特色" /></div>
                  <div className="ff full"><label>產品圖片網址</label><input value={newProd.image} onChange={e=>setNewProd(p=>({...p,image:e.target.value}))} placeholder="https://..." /></div>
                </div>
                <div className="form-actions"><button className="btn-confirm" onClick={doAddProd}>確認新增</button><button className="btn-cancel2" onClick={() => setShowAddProd(false)}>取消</button></div>
              </div>
            )}
            <div className="tbl-wrap"><table>
              <thead><tr><th>型號</th><th>系列</th><th>分類</th><th>瓦數</th><th>標準價</th><th>VIP 價</th><th></th></tr></thead>
              <tbody>{products.map(p => (
                <tr key={p.id}>
                  <td style={{fontWeight:400}}>{p.model}</td>
                  <td>{p.series}</td><td>{p.category}</td><td>{p.watt}</td>
                  <td>NT$ {p.stdPrice?.toLocaleString()}</td>
                  <td style={{color:"var(--gold)"}}>NT$ {p.vipPrice?.toLocaleString()}</td>
                  <td><button className="btn-del2" onClick={() => { setProducts(x=>x.filter(x=>x.id!==p.id)); toast$("產品已刪除"); }}>✕</button></td>
                </tr>
              ))}</tbody>
            </table></div>
          </>}
        </div>
      </div>

      {/* 產品詳細 Drawer（右側滑出，不跳連結）*/}
      {selProd && (
        <div className="drawer-overlay" onClick={() => setSelProd(null)}>
          <div className="drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-top">
              <div className="drawer-series">{selProd.series} · {selProd.category}</div>
              <button className="drawer-close" onClick={() => setSelProd(null)}>✕</button>
            </div>
            <div className="drawer-img">
              {selProd.image ? <img src={selProd.image} alt={selProd.model} /> : <span style={{fontSize:64,color:"var(--bdr)"}}>◎</span>}
            </div>
            <div className="drawer-body">
              <div className="drawer-model">{selProd.model}</div>
              <div className="drawer-desc">{selProd.desc}</div>
              <div className="spec-grid">
                <div className="spec-item"><div className="spec-label">瓦數</div><div className="spec-val">{selProd.watt || "—"}</div></div>
                <div className="spec-item"><div className="spec-label">色溫</div><div className="spec-val">{selProd.cct || "—"}</div></div>
                <div className="spec-item"><div className="spec-label">光束角</div><div className="spec-val">{selProd.beam || "—"}</div></div>
                <div className="spec-item"><div className="spec-label">型號</div><div className="spec-val">{selProd.model}</div></div>
              </div>
              <div className="price-block">
                {isVip ? (
                  <>
                    <div className="price-block-label">VIP 特別優惠價</div>
                    <div className="price-block-val">NT$ {selProd.vipPrice?.toLocaleString()}</div>
                    <div className="price-block-old">標準售價：NT$ {selProd.stdPrice?.toLocaleString()}</div>
                  </>
                ) : (
                  <>
                    <div className="price-block-label">標準售價</div>
                    <div className="price-block-std">NT$ {selProd.stdPrice?.toLocaleString()}</div>
                    <div className="price-block-note">如需特別報價，請洽業務專員</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
