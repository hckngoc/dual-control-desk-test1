# Bàn giao nhóm — RMIT_SGS_N3T_C2

Repo đã tồn tại: https://github.com/hckngoc/dual-control-desk. Không khởi tạo Git lại, không clone đè thư mục đang có, không tạo nhánh thứ hai cho đợt hardening này.

## Ownership

| Vai trò | Trách nhiệm |
|---|---|
| M1 — Tide/operations | Realm thật, account linking, roles, independent admins, threshold và governance evidence |
| M2 — Backend/security | Engine, JWT/DPoP, API authorization, regression tests |
| M3 — Frontend | Expense UI, loading/errors, roles, demo readability |
| M4 — QA/storytelling | Test evidence, README, script, quay demo.mp4 và checklist nộp |

Đây là vai trò bàn giao, không phải danh tính người dùng Tide. Nhóm tự xác nhận tên thành viên, không bịa tên trong README.

## Quy tắc Git của đợt này

Nhánh hiện hữu: **feat/challenge2-hardening-thinh**. Trước khi sửa/commit:

```powershell
git rev-parse --show-toplevel
git branch --show-current
git status
git remote -v
git log -1 --oneline
```

Nếu sai nhánh hoặc remote, dừng Git mutation và xác nhận workspace. Giữ mọi thay đổi của teammate. Không switch main, reset, force-push, xóa nhánh, merge tự động hoặc stage toàn bộ bằng git add . mà chưa review.

```powershell
npm test
npm run check
cd app
npm ci
npm test
npm run build
npm run typecheck
cd ..
git diff
# stage CHỈ các file có chủ đích, không gồm local config
git diff --cached
git commit -m "fix: harden expense workflow and Tide runtime configuration"
git push -u origin feat/challenge2-hardening-thinh
```

Không commit .env, adapter, token, private key, H2 database, node_modules hoặc build output. app/public/silent-check-sso.html có thay đổi local trước đợt này; không tự đưa vào commit hardening.

Chủ repo review feature branch và quyết định PR/merge theo quy trình nhóm. Đợt này không thay đổi main. Nếu push bị authentication từ chối, dùng Git Credential Manager của tài khoản có quyền; không nhúng token vào remote URL.

## Trước khi nộp

Xem [test plan](TEST_PLAN_VI.md), [Tide setup](TIDE_SETUP_VI.md) và [video checklist](VIDEO_SCRIPT_EN.md). Chỉ đánh dấu VERIFIED khi có bằng chứng thực. Nộp đúng repository public, chứa app source, README với tên nhóm và video thật. PR/feature branch được push chưa tự động cập nhật default branch mà giám khảo có thể nhìn thấy.
