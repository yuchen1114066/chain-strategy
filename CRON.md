# 戰情中心 Cron 設定

CEO 戰情中心 (`/erp/warroom`) 的資料來自 AI Snapshot 快取，需要 cron 定期觸發。

## 流程鏈

```
*/10 min   cron ─▶ /api/sync/erp?by=cron        鼎新 iGP 唯讀拉取
                       │
                       └─▶ 自動鏈式觸發 → AI recompute → 寫入 snapshot
                       
*/15 min   cron ─▶ /api/ai/recompute?by=cron    保底重算（含未變動鏡像時）
                       │
                       └─▶ 寫入 snapshot cache
                       
   60 s    Browser ─▶ /erp/warroom (ISR)        讀 snapshot cache 渲染
```

## 必要環境變數

```bash
TOPGP_SYNC_TOKEN=<隨機 64-byte，例：openssl rand -hex 32>
TOPGP_DB_HOST=<鼎新 SQL Server 主機>
TOPGP_DB_PORT=1433
TOPGP_DB_NAME=TOPGP
TOPGP_DB_USER=<唯讀帳號>
TOPGP_DB_PASS=<密碼>
TOPGP_DB_READONLY=true
```

未設定 `TOPGP_SYNC_TOKEN` 時，cron 自動進入 MOCK 模式（dev 友善），允許無 token 觸發。

## 部署選項

### A. Vercel（已附 `vercel.json`）

**⚠ Hobby（免費）限制**：只允許每天 1 次的 cron。`vercel.json` 已設為每天 08:00 同步 1 次（`0 8 * * *`）。  
要 `*/10`、`*/15` 這種高頻 cron 需升級 **Pro 方案**，或改用下面 B/C/D 三種外部 cron。

部署即生效。Vercel Cron 會自動帶 `Authorization: Bearer $VERCEL_CRON` header，
若用 Vercel Cron 並啟用 token 驗證，請改用 Vercel 內建簽章機制或對 cron path 開白名單。

### B. Linux crontab（自架）

```cron
*/10 * * * * curl -fsS -X POST -H "Authorization: Bearer $TOPGP_SYNC_TOKEN" "https://<host>/api/sync/erp?by=cron"
*/15 * * * * curl -fsS -X POST -H "Authorization: Bearer $TOPGP_SYNC_TOKEN" "https://<host>/api/ai/recompute?by=cron"
```

### C. GitHub Actions（無自架 server）

```yaml
# .github/workflows/erp-sync.yml
name: ERP Sync
on:
  schedule:
    - cron: "*/10 * * * *"
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -fsS -X POST -H "Authorization: Bearer ${{ secrets.TOPGP_SYNC_TOKEN }}" \
            "${{ secrets.HOST }}/api/sync/erp?by=cron"
```

### D. Kubernetes CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata: { name: erp-sync }
spec:
  schedule: "*/10 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: curl
            image: curlimages/curl
            args:
            - -fsS
            - -X
            - POST
            - -H
            - "Authorization: Bearer $(TOPGP_SYNC_TOKEN)"
            - "https://<host>/api/sync/erp?by=cron"
          restartPolicy: OnFailure
```

## 驗證

```bash
# 看快取狀態
curl https://<host>/api/ai/recompute

# 手動觸發完整流程
curl -X POST -H "Authorization: Bearer $TOPGP_SYNC_TOKEN" "https://<host>/api/sync/erp?by=cron"

# 看戰情中心
open https://<host>/erp/warroom
```

## 監控

- `/erp/admin/sync` — 同步執行歷史、Audit Log
- `/api/ai/recompute` GET — 看 snapshot 新鮮度
- War Room footer 即時顯示 `AI Snapshot age + 來源 (cron/sync/lazy/manual)`
