# LEDOUX 諾科照明 報價系統

## 專案說明

React + Vite 單頁應用程式，提供燈具電子型錄、報價單、樣品申請、安裝服務等功能。

- **框架**：React 18 + Vite 4
- **後端**：Google Apps Script（`SHEET_URL`）
- **部署**：Vercel（`ledoux-catalog.vercel.app`）

## 檔案對應關係

| 檔案 | 角色 | 誰能看到 |
|------|------|----------|
| `src/App.jsx` | 客戶前端網頁 | 客戶（公開） |
| `index.html` | 前端入口頁 | 客戶（公開） |
| `kimboss.html` | 管理後台 | 僅限 Kim（私有） |
| Apps Script | 後端邏輯（試算表 / Email） | 內部 |

## 用語對照

- 說「**後台**」→ 指 `kimboss.html`
- 說「**前端**」或「**客戶看到的**」→ 指 `src/App.jsx`

## 開發指令

```bash
npm run dev      # 本地開發
npm run build    # 打包
npm run preview  # 預覽打包結果
```

## 修改功能的強制流程

**每次修改任何功能時，必須依序完成以下步驟：**

### 步驟一：自動分析影響範圍

收到修改需求後，先判斷這項修改是否需要同時更動以下檔案：

| 檔案 | 說明 |
|------|------|
| `src/App.jsx` | 前台使用者介面與邏輯 |
| `kimboss.html` | 後台管理頁面 |
| `Apps Script` | Google Apps Script 後端（處理試算表、Email 通知等） |

### 步驟二：一次全部改好

所有需要修改的檔案必須在同一次回覆中全部改完，不能只改其中一個。

### 步驟三：Apps Script 更新提醒

如果這次修改包含 Apps Script 的變動，改完後**必須**在回覆結尾加上：

> ⚠️ **請記得更新 Apps Script**：請將上方新的 Apps Script 程式碼複製到 Claude.ai 專案中覆蓋更新。

---

## 自動 Git 提交規則

**每次修改完任何檔案後，立即自動執行以下步驟，不需確認：**

1. `git add .`
2. `git commit -m "說明此次修改內容"`
3. `git push`

這三個指令必須依序全部執行完畢，commit message 要簡要說明這次改了什麼。
