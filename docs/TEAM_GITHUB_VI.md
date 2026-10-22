# TEAM 4 NGƯỜI: GitHub + phân chia công việc

## Chia việc song song theo ownership

| Thành viên | Ownership | Việc cụ thể | Bằng chứng bàn giao |
|---|---|---|---|
| **M1 — Tide/DevOps (leader)** | `scripts/`, `app/src/lib/auth/`, Docker/realm | Tải template chính thức, chạy init sau consent, đăng ký 3 admin Tide, cấu hình IGA tide MultiAdmin, kiểm chứng ngưỡng >= 2, RBAC role grants, hỗ trợ teammate đăng nhập | Screenshot/recording pending CR + enclave approval; `tide-doctor` sạch; không lộ secret |
| **M2 — Backend/Security** | `core/`, `test/`, `app/src/app/api/`, `app/src/lib/expense/` | Expense/create/approve/mock settle, rule tách người, kiểm tra JWT server, kiểm thử 401/403/409, bất biến phê duyệt | PR backend + test report |
| **M3 — Frontend/UX** | `demo/public/`, `app/src/app/expenses/` | Dashboard, form, trạng thái, nút hành động, thông báo forbidden, identity-flow Tide UI, screenshot sản phẩm | PR frontend + video walkthrough UI |
| **M4 — QA/Product/Storytelling** | `docs/`, `README.md`, `demo.mp4` | Threat model, 5 judging prompts, test các attack, viết tiếng Anh, quay clip 2 phút, đối chiếu checklist submission | PR docs + video + final audit |

Các thành viên chạy song song từ cùng repo. **M1 tạo repo và merge skeleton đầu tiên**. Các nhánh riêng sửa những thư mục đã sở hữu; những thay đổi đụng auth/permission phải có review M1+M2.

## Tạo GitHub repository lần đầu — M1

1. Tạo tài khoản GitHub nếu chưa có và đăng nhập https://github.com.
2. Góc phải trên → `+` → `New repository`.
3. Repository name: **dual-control-desk**; Visibility: **Public**. Không đánh dấu initialize README vì gói này đã có README.
4. Trên Mac: giải nén gói, mở Terminal trong thư mục có `package.json`. Khởi tạo Git:

```bash
git init -b main
git add .
git commit -m "chore: initialize Dual-Control Expense Desk"
git remote add origin https://github.com/OWNER/dual-control-desk.git
git push -u origin main
```

Thay OWNER bằng GitHub username thật, không copy nguyên chữ OWNER. Nếu HTTPS đòi auth, dùng Git Credential Manager hoặc `gh auth login` (GitHub CLI); không dùng password GitHub làm token.

5. Repo → Settings → Collaborators / Collaborators and teams → Add people → nhập từng GitHub username của 3 thành viên còn lại → mời và họ phải **Accept invitation**. Cho quyền Write, không chia sẻ mật khẩu.
6. Repo → Settings → Branches → Add branch protection rule cho `main`: require pull request; ít nhất 1 approval, status checks chạy tests. Với UI mới của GitHub có thể dùng `Rulesets` → New branch ruleset → target `main`.

## Thành viên M2/M3/M4 clone và tạo branch

```bash
git clone https://github.com/OWNER/dual-control-desk.git
cd dual-control-desk
npm test
git switch -c feature/backend-rules  # M2
# M3: feature/frontend-dashboard ; M4: docs/demo-and-testing
# sửa phần được phân công ...
git add .
git commit -m "feat: implement assigned work"
git push -u origin HEAD
```

Trên GitHub → `Compare & pull request` → mô tả thay đổi + ảnh/kiểm thử → `Create pull request` → assign reviewer → sau khi CI xanh và approved thì `Squash and merge`. Sau đó trong local:

```bash
git switch main
git pull --ff-only origin main
```

Không làm việc trực tiếp trên `main`. Tránh commit `.env`, adapter, access token, Docker H2 database, `node_modules`.

## Timeline ba cột mốc

- **Milestone 1 — chạy được:** M1 scaffold Tide, M2 tests xanh, M3 màn hình, M4 kiểm tra README <=300 words.
- **Milestone 2 — Tide thật:** M1 2+ quản trị viên và IGA, M2 kiểm thử thật 401/403/các role, M3 hoàn thiện UI real Tide, M4 quay failure cases và kiểm tra scope claim.
- **Milestone 3 — nộp:** Merge mọi PR; verify public repo từ incognito; commit `demo.mp4` hoặc liên kết tới video trong README **và** giữ video trong repository theo yêu cầu; chạy final smoke tests; nộp link GitHub trong Google Form.

## API contract dùng chung

- `POST /api/expenses` body `{title, amount}` (USD numeric) → `{id, status, required, ...}`.
- `GET /api/expenses` → mảng expense.
- `POST /api/expenses/:id/approve` body `{role: 'finance-approver'|'department-approver'}`.
- `POST /api/expenses/:id/execute` body `{}` → status `SETTLED_MOCK`.
- `GET /api/audit` → audit event array.
- Offline **chỉ** nhận `x-demo-user`; Tide **chỉ** nhận Tide JWT/DPoP qua `secureFetch`.

Business state: `PENDING → APPROVED → SETTLED_MOCK`. Mọi lỗi trả JSON `{error: string}` và HTTP `401` chưa xác thực, `403` sai role/chống self approval, `409` trạng thái xung đột/chưa đủ duyệt.
