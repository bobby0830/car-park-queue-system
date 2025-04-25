# 停車場排隊系統 (Car Park Queue System)

即時排隊系統，專為停車場設計，提供QR碼車位管理、即時等候時間更新、多次排隊和取消功能。

## 功能特點

- 即時更新：等候時間、使用時間每秒自動更新
- 車位QR碼：每個車位都有專屬QR碼，掃描後直接加入排隊
- 多次排隊：用戶可同時預約多個車位
- 取消功能：排隊中的請求可隨時取消
- 狀態自動轉換：等候中 → 使用中 → 已完成
- 手機響應式設計：適配各種設備尺寸

## 技術架構

### 前端
- React 19
- React Bootstrap
- Socket.io-client (即時更新)
- QR碼掃描與生成

### 後端
- Node.js
- Express
- MongoDB
- Socket.io (即時通訊)

## 安裝指南

### 前提條件
- Node.js (v14+)
- MongoDB

### 後端設置
```bash
cd backend
npm install
npm run dev
```

### 前端設置
```bash
cd frontend
npm install
npm start
```

## 使用說明

1. 管理員：訪問 `/admin/qrcodes` 產生車位QR碼
2. 用戶：掃描QR碼或手動選擇車位加入排隊
3. 等候中的排隊可以取消
4. 系統會自動轉換狀態並更新時間

## 數據庫結構

使用MongoDB，主要集合為 `queue`，含以下欄位：
- id：排隊序號
- user_id：用戶識別
- parking_space：車位號碼 (1-10)
- current_time：系統當前時間
- waiting_time：等候時間（秒）
- reserved_time：預約使用時間（秒）
- status：狀態 (waiting, in_use, completed)
- usage_time：使用中倒數時間（秒）
- created_at：加入時間
