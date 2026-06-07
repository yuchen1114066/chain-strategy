# private/downloads/

**這個資料夾刻意不在 `public/` 下** — Next.js 不會把它當靜態檔對外提供。

放這裡的檔案只能透過受權限保護的 API route 取得：

| 檔案 | API Route | 權限 |
|------|-----------|------|
| `quotation-analyzer-standalone.zip` | `GET /api/admin/downloads/quotation-analyzer-standalone` | 管理員（`ADMIN_DOWNLOAD_TOKEN`） |
| `wms-standalone.zip` | `GET /api/admin/downloads/wms-standalone` | 管理員（`ADMIN_DOWNLOAD_TOKEN`） |

## 重新打包 standalone ZIP

當 `standalone-quotation-analyzer/` 內容更新後：

```bash
rm private/downloads/quotation-analyzer-standalone.zip
zip -r private/downloads/quotation-analyzer-standalone.zip \
  standalone-quotation-analyzer \
  -x "*/node_modules/*" "*/.next/*"
```

當 `standalone-wms/` 內容更新後：

```bash
rm private/downloads/wms-standalone.zip
zip -r private/downloads/wms-standalone.zip \
  standalone-wms \
  -x "*/node_modules/*" "*/.next/*"
```

## 設定 ADMIN_DOWNLOAD_TOKEN

`.env.local` 內：

```
ADMIN_DOWNLOAD_TOKEN=請改成一組高熵亂數字串
```

未設定 → API 預設拒絕（不會誤開放下載）。
