# Test plan và tiêu chí bằng chứng

Dùng **PASS** (đã chạy và thành công), **FAIL** (đã chạy và thất bại), **BLOCKED** (thiếu dependency thật), **NOT TESTED** (chưa chạy). Không coi unit fixtures/simulator là Tide thật.

## 1. Automated source checks

Node 22.18+:

```powershell
# root
npm test
npm run check
# app
npm ci
npm test
npm run build
npm run typecheck
```

Root tests: business rules và HTTP simulator. App tests: **actual Next route handlers** với signing keys/claims được tạo riêng trong RAM, không dùng hay sinh adapter cho server đang chạy. Bao gồm signature/issuer/audience/azp/time/subject, DPoP key/ath/URL/method/replay, missing authentication, x-demo-user không có quyền, realm RBAC, malformed JSON, body size, 400/401/403/404/409/413/415, duplicate concurrent approvals và full workflow.

npm run check xác nhận engine/overlay không lệch và kiểm tra tên file tracked có nguy cơ chứa local secrets. Đây không phải secret content/history scanner toàn diện. CI còn chạy build không có adapter. Node native TypeScript có thể in MODULE_TYPELESS_PACKAGE_JSON warning; production bundler vẫn typecheck riêng.

## 2. Simulator smoke flow — không có xác thực thật

Chạy npm run demo, mở http://localhost:4173.

| Bước | Kết quả |
|---|---|
| Alice tạo $12,000 | PENDING, cần 2 roles |
| Grace tạo khoản riêng, thử Finance self-approve | 403, không đổi state, audit từ chối |
| Frank execute trước quorum | 409 |
| Bob Finance approve | PENDING 1/2 |
| Dave giữ cả hai roles thử đếm hai lần trên khoản riêng | Lần 2 bị từ chối |
| Carol Department approve | APPROVED 2/2 |
| Frank mock settle | SETTLED_MOCK, reference MOCK-, không chuyển tiền |
| Frank execute lại | 409 |
| Erin thử tự cấp role | 403 trong simulator; không chứng minh Tide IGA |

## 3. Real Tide acceptance — cần realm/operator

Dùng đúng app realm, adapter thật và phiên Tide thật. Không thay thế bằng test fixtures. UI disable chỉ là UX, không phải bằng chứng server authorization.

| ID | Kiểm tra | Kết quả phải quan sát |
|---|---|---|
| R01 | Protected expense/audit/whoami/customers API không có token, kể cả x-demo-user | 401, không rò dữ liệu |
| R02 | Login/logout + callback, direct /expenses navigation | Identity đúng, logout không còn truy cập được bằng phiên UI |
| R03 | Requester tạo $12,000 | 201, submittedBy là verified sub |
| R04 | Wrong role / self-approval qua request secureFetch có JWT+DPoP hợp lệ | 403, state không đổi, audit ACTION_REJECTED |
| R05 | Finance approve, same sub cố dùng Department, duplicate Finance | 200 rồi 409 cho các lần trùng/đếm hai lần |
| R06 | Department subject khác approve | APPROVED |
| R07 | Early execute / wrong role / executor là requester hoặc approver | 409 / 403 / 403 |
| R08 | Treasury subject độc lập execute, rồi execute lại | SETTLED_MOCK rồi 409 |
| R09 | Bearer replay, DPoP proof thiếu/sai key/URL/method/ath/jti lặp | 401 |
| R10 | $9,999.99 và $10,000 | Finance-only và Finance+Department đúng ngưỡng |
| R11 | Login qua proxy nếu dùng | Public htu đúng, chỉ trust proxy đã kiểm soát |
| R12 | /api/admin/roles trong app thật | 404, không có API cấp role |

Không dán JWT vào URL, commit, issue hoặc video. Để kiểm tra direct request, dùng harness với secureFetch của SDK đã cài trong chính phiên người dùng; plain Bearer sẽ chỉ kiểm tra DPoP downgrade rejection. Khi quay rejection, có thể dùng requester giữ Finance để chứng minh self-approval bị server từ chối; UI bình thường sẽ giải thích và disable hành động này.

## 4. MultiAdmin acceptance riêng

1. Realm là application realm, IGA bật, Tide-backed mode, threshold >=2 đã kiểm tra.
2. Hai admin thật, account độc lập. Không giả định bootstrap đặt đủ threshold.
3. Admin A tạo protected role grant cho mình: CR vẫn pending, quyền chưa có trong fresh verified token, API từ chối.
4. Admin B hoàn tất enclave approval; đủ quorum rồi commit: trạng thái thực thay đổi.
5. Token mới thể hiện role hiệu lực, app chấp nhận thao tác phù hợp.

Chỉ khi tất cả bằng chứng có thật mới VERIFIED. Login và dual business approval không chứng minh cryptographic governance.

## 5. Submission checklist

- [ ] Public repo có app source, root README và tên RMIT_SGS_N3T_C2.
- [ ] Tests, build và copy/hygiene checks có kết quả thực; không commit secret.
- [ ] Đã ghi nhận Tide login/DPoP/RBAC và governance thực hoặc đánh dấu BLOCKED.
- [ ] demo.mp4 thật có hình/âm thanh, không lộ secret, nằm trong repo.
- [ ] Feature branch được review; nhóm chủ động quyết định tích hợp trước khi nộp.
- [ ] Mở link repo ở phiên không đăng nhập, kiểm tra source/README/video rồi nộp link.

Kết quả đợt hardening: [HARDENING_REPORT.md](HARDENING_REPORT.md).
