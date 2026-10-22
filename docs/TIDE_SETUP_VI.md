# TideCloak thật — cấu hình ứng dụng hiện có

**RMIT Hackathon 2026 — Challenge 2 · RMIT_SGS_N3T_C2**

## 1. Chạy source/test/build ngay, không tạo realm

Repo đã có `app/`. Không chạy lại `scripts/setup-tide.sh`: script chỉ dùng lịch sử scaffold và từ chối ghi đè app hiện tại.

Windows PowerShell, Node.js 22.18+ và npm:

```powershell
# root
npm test
npm run check
npm run demo
# terminal khác, root
cd app
npm ci
npm test
npm run build
npm run typecheck
npm run dev
```

Simulator: http://localhost:4173 (identity giả, không có Tide). App thật: http://localhost:3000/expenses.

Không cần cài Docker/WSL/jq để kiểm thử source hoặc build. Thiếu adapter không còn gây import lỗi: trang hiển thị hướng dẫn cấu hình, /api/config trả 503; API được bảo vệ vẫn yêu cầu JWT + DPoP. Build thành công **không** có nghĩa Tide login/MultiAdmin đã được kiểm chứng.

## 2. Có realm TideCloak sẵn — đường ưu tiên

Không chạy init, không tạo realm trùng, không xóa container/database.

1. Trong đúng realm ứng dụng, xác định public client và bật DPoP-bound access tokens.
2. Xuất **Tide adapter** qua chức năng export của realm/client với IGA đã cấu hình (provider `keycloak-oidc-keycloak-json`). Không dùng JSON OIDC thông thường thiếu phần mở rộng Tide.
3. Lưu bản thật ở `app/data/tidecloak.json` (Git bỏ qua). Hoặc đặt toàn bộ JSON vào biến **server-only** `CLIENT_ADAPTER`; với Next có thể dùng `app/.env.local`, một dòng và quote đúng cú pháp dotenv. Không đặt `NEXT_PUBLIC_`, không dán adapter lên GitHub.
4. Kiểm tra adapter có `realm`, `auth-server-url`, `resource`, `public-client: true`, `jwk.keys` công khai không rỗng, `vendorId` và `homeOrkUrl`. URL ngoài localhost phải HTTPS. Không chứa credentials hoặc private JWK.
5. Client redirect/web origins phải tương ứng http://localhost:3000; cho phép /auth/redirect, /silent-check-sso.html và các URL ứng dụng như cấu hình client phù hợp. Access token phải có audience bằng resource/client ID (self audience mapper có trong realm template).
6. Chạy `npm run dev` trong app, mở /expenses, đăng nhập và kiểm tra /api/whoami hiển thị đúng subject/realm roles.

SDK thực tế khóa trong lockfile: @tidecloak/nextjs 0.14.17, @tidecloak/react 0.14.33, @tidecloak/js 0.14.41. Wrapper Next nhận prop `config`, không chuyển tiếp `configUrl`; Providers fetch /api/config rồi truyền object ổn định với `useDPoP: { mode: 'strict', alg: 'ES256' }`. Không import adapter vào bundle lúc build.

Mỗi lần đổi biến môi trường hãy restart app; khi realm đổi signing keys, xuất lại adapter. Trường hợp lỗi cấu hình sẽ fail closed, không mock đăng nhập.

## 3. Realm mới — chỉ operator có quyền quyết định

Đây là bước độc lập, **không phải prerequisite cho sửa source**. Không thực thi trong đợt hardening này.

Operator cần môi trường Linux/WSL có Docker daemon, Bash, curl, jq và các tiện ích script đang dùng (sudo, lsof); Node/npm chạy được trong môi trường đã chọn. Repo không tự cài hay sửa Docker/WSL.

Đọc `app/scripts/init-tidecloak.sh` trước. Script bootstrap:
- Yêu cầu mật khẩu admin riêng qua .env, email license thật và người sở hữu tự đọc/đồng ý https://tide.org/legal.
- Yêu cầu operator chủ động đặt `TIDE_BOOTSTRAP_FRESH=yes`.
- Từ chối nếu đã có container tên tidecloak, adapter hoặc database keycloakdb; không tự dừng/xóa/ghi đè state cũ.
- Tạo container và realm, license/IGA, account linking, xuất adapter; có thể cấp admin và commit thay đổi lúc bootstrap.

Chỉ sau khi tự quyết định các điều trên, operator mới chạy `npm run init` từ app với biến opt-in đó. Invite/account-linking phải do chủ tài khoản tự hoàn thành. Không nhờ agent chấp nhận terms, dùng email giả hoặc tự xóa state để tiếp tục. Nếu bootstrap lỗi giữa chừng, giữ dữ liệu và chẩn đoán; không rerun init để reset.

## 4. Realm roles và bốn người dùng độc lập

Tạo bốn **realm roles**: requester, finance-approver, department-approver, treasury-executor. Cấp qua quy trình quản trị có thẩm quyền; người dùng đăng nhập lại để nhận token mới.

Một khoản >= $10,000 cần requester, Finance, Department và treasury với các subject độc lập theo luật app. Dưới ngưỡng chỉ cần Finance, treasury vẫn riêng. UI chỉ hỗ trợ thao tác; quyết định quyền nằm ở server với token đã xác minh.

## 5. Kiểm chứng IGA / MultiAdmin riêng

Đăng nhập thành công không chứng minh governance. Kiểm tra đúng realm (không phải master), IGA bật, attestor/governance thực sự Tide-backed, mode không còn firstAdmin/simple, threshold thực tế >=2 và ít nhất hai admin độc lập.

1. Admin A yêu cầu gán role approver cho mình.
2. Ghi nhận change request ID/status và việc một admin không thể làm grant có hiệu lực.
3. Fresh token chưa có role, API vẫn từ chối.
4. Admin B độc lập hoàn thành phê duyệt bằng Tide enclave; thu đủ threshold và commit.
5. Fresh verified token sau đó chứa role, và API chấp nhận thao tác đúng quyền.

Quan sát trạng thái thực trong console. Phản hồi cần thêm enclave approval không phải đã approve/commit. Không tự giả định bootstrap cấu hình threshold >=2. Nếu không có môi trường này, đánh dấu **BLOCKED**, không đóng giả thành video thực.

## 6. Proxy và giới hạn

Mặc định không tin x-forwarded-host/proto trong DPoP. Chỉ bật `TRUST_PROXY_HEADERS=true` khi một proxy do nhóm kiểm soát thay thế các header đó; cần xác minh URL công khai khớp htu.

Chạy một tiến trình Next cho demo. Expense/audit/replay nằm trong RAM, mất khi restart, không dùng multi-instance. Audit không bất biến, không chuyển tiền thật. [Security](SECURITY.md) và [test plan](TEST_PLAN_VI.md) mô tả giới hạn và bằng chứng cần thu thập.
