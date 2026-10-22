# Test plan / Demo acceptance criteria

## Tầng 1 — tự động, chạy ngay không cần Tide

`npm test` bao gồm business rules (Node test runner) và HTTP flow. `npm run demo` khởi động web local-only tại http://localhost:4173; mọi identity trong dropdown là giả lập, không xác thực thật.

| Test | User / bước | Mong đợi |
|---|---|---|
| T01 | Alice tạo yêu cầu $12,000 | `PENDING`, cần Finance + Department |
| T02 | Alice tự Approve | HTTP 403, vẫn PENDING |
| T03 | Frank Execute trước duyệt | HTTP 409 |
| T04 | Bob Finance Approve | PENDING, 1/2 |
| T05 | Bob Approve lần nữa dưới role khác | 403/409, không được đếm lần hai |
| T06 | Carol Department Approve | APPROVED, 2/2 |
| T07 | Frank mock Execute | SETTLED_MOCK, có audit event |
| T08 | Frank Execute lại | HTTP 409 |
| T09 | Erin Admin thử tự cấp role trong app | HTTP 403 (app không có role change API) |
| T10 | Alice tạo $200, Bob approve | APPROVED sau 1 chữ ký nghiệp vụ |

Đây mới là kiểm thử business logic. T09 không chứng minh TideCloak QEA; phải làm phần tầng 2.

## Tầng 2 — real Tide, cần M1 chạy trên máy nhóm

| Test | Hành động | Điều kiện PASS |
|---|---|---|
| R01 | Mở `/api/expenses` không login | HTTP 401, không rò dữ liệu |
| R02 | User chỉ có requester POST new expense | HTTP 201 |
| R03 | User requester POST approve API trực tiếp | HTTP 403 |
| R04 | Finance user duyệt Finance | HTTP 200 |
| R05 | Cùng Tide `sub` có cả Finance+Department tự cố duyệt hai lần | HTTP 409 ở lần 2 |
| R06 | Department user khác duyệt | trạng thái APPROVED |
| R07 | Người không có treasury-executor gọi execute | HTTP 403 |
| R08 | Treasury executor khác thực hiện | SETTLED_MOCK |
| R09 | Gửi Bearer token thiếu DPoP proof trong client DPoP-bound | 401/403; không thành công |
| R10 | Một admin tạo role grant cho chính mình tại realm bật Tide MultiAdmin | Change request vẫn PENDING, không cập nhật role trong JWT mới |
| R11 | Admin thứ hai thật dùng Tide enclave approve CR | Chỉ commit sau đủ approvals, role mới có hiệu lực |
| R12 | Thử qua `/api/admin/roles` | Route không tồn tại; không có bypass cấp quyền |

Quan trọng: phân biệt account login khác nhau (Tide sub) với người thật độc lập. Test R10–R11 phải chạy bằng **tài khoản admin khác nhau**, vào đúng realm, kiểm tra `iga.attestor=tide`, yêu cầu quorum >=2. Nếu status là `simple`, **không được đánh dấu PASS về cryptographic governance**.

## Tầng 3 — bộ checklist nộp

- [ ] Public repository có mã nguồn Tide runtime `app/` sau setup, `core/`, test, docs, và README overview 5 tiêu chí <=300 từ.
- [ ] Không commit `.env`, `data/tidecloak.json`, token, password, database H2.
- [ ] `npm test` xanh; Tide app login thực và `tide-doctor` không FAIL; browser không có DPoP/CSP errors.
- [ ] Thể hiện hai luồng: **DENIED** trước quorum; **SUCCESS** khi đủ quorum, role governance đúng Tide.
- [ ] Video 2 phút có âm thanh/lời nói, phụ đề dễ đọc, trình bày trust bottleneck → giải pháp → demo.
- [ ] `demo.mp4` nằm trong repo; nếu GitHub từ chối file lớn, tối ưu dưới giới hạn của GitHub hoặc dùng Git LFS và kiểm tra ban tổ chức có thể phát trực tiếp.
- [ ] Gửi đúng URL repo public qua Google Form cuộc thi.
