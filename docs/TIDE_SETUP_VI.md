# TIDE SETUP — triển khai với TideCloak thật

## Tình trạng gói

Gói này gồm business engine đã kiểm thử, simulator và **overlay** Next.js cho template chính thức. Không có Tide server, không có realm đã cấp phép và không có `data/tidecloak.json` thật. Không được xem simulator là tích hợp TideCloak. Template phải tải trên máy có kết nối Internet. Ứng dụng local demo chỉ dùng dữ liệu giả.

## 0. Chuẩn bị

- macOS/Linux, Node.js >=20, npm, Docker Desktop, curl, tar, git.
- Quyết định triển khai **local Docker** hay **Skycloak** trước khi tạo realm. Hướng dẫn bên dưới là local Docker; các realm không thể tự di chuyển giữa hai lựa chọn.
- Tự đọc https://tide.org/legal, cung cấp **email thật do chủ realm quản lý**, và chủ realm **đồng ý rõ ràng**; không được lấy một email giả hoặc đồng ý thay ai.
- Nếu realm đã tồn tại, không khởi tạo trùng; làm theo Tide Agent Pack `start-tidecloak-dev`/`add-auth-nextjs-existing` và kiểm tra adapter hiện hữu.

## 1. Kiểm thử business logic trước

```bash
npm test             # kỳ vọng tất cả unit + HTTP tests thành công
npm run demo         # trang mô phỏng: http://localhost:4173
```

## 2. Khởi tạo mã từ template chính thức (không tạo realm)

```bash
bash scripts/setup-tide.sh
cd app
npm install
cp .env.example .env
```

Các file `src/lib/auth/*`, `src/app/providers.tsx`, `src/app/auth/redirect/page.tsx`, `next.config.ts`, `public/tide_dpop_auth.html`, `scripts/init-tidecloak.sh` được giữ từ template Tide. Không thay thế chúng bằng code mock. `scripts/setup-tide.sh` từ chối ghi đè `app/` đã tồn tại.

## 3. Cấu hình bí mật và giấy phép

Mở `app/.env`, đặt `KC_BOOTSTRAP_ADMIN_PASSWORD` bằng giá trị mạnh do bạn chọn, `TIDE_LICENSE_EMAIL` bằng **email thật của bạn**, và `TIDE_TERMS_ACCEPTED=yes` **chỉ khi bạn đích thân đã đồng ý**. Không commit `.env`, token hay `data/tidecloak.json`. Nếu các mục này đã tồn tại từ phiên trước, không cần hỏi/điền lại.

Đảm bảo Docker daemon chạy:

```bash
docker info
docker run --rm hello-world
```

Sau đó:

```bash
cd app                 # nếu đang ở root dự án
npm run init
```

Tide bootstrap tự khởi tạo container/realm, licensing/IGA, first admin, account linking và adapter theo bản script chính thức. Khi script in invite link, **người sở hữu tài khoản phải tự mở link và hoàn tất thao tác**. Nếu script báo lỗi, dùng Tide Agent Pack `tide_doctor` và playbook phù hợp; không bỏ qua bước Tide authentication để chạy app.

Kiểm tra `app/data/tidecloak.json` được tạo, bao gồm trường `jwk.keys`; không đăng file này lên GitHub. Kiểm tra `docker ps`, `http://localhost:8080`, phiên đăng nhập thực.

## 4. Khởi chạy app tích hợp

```bash
cd app
npm run dev
```

Mở `http://localhost:3000/expenses` (không phải `/` của simulator). Đăng nhập bằng Tide thật. `src/app/api/*` sử dụng `withAuth` của template; trình duyệt gọi `secureFetch` với DPoP, không gửi header `x-demo-user`.

Chạy doctor từ root repository khi app đang chạy:

```bash
bash .tide-pack/templates/shared/tide-doctor.sh --app app --url http://localhost:3000
```

Nếu doctor của phiên bản pack không nhận `--app`, hãy `cd app` và chạy `bash ../.tide-pack/templates/shared/tide-doctor.sh --url http://localhost:3000`. Quan trọng nhất là kết quả kiểm tra JWT, DPoP, 401/403 và quyền thực, không chỉ giao diện.

## 5. Thêm vai trò và tài khoản

Trong TideCloak Admin Console của realm **dual-control-desk** (không phải realm `master`), tạo bốn realm roles:

- `requester`: tạo khoản chi
- `finance-approver`: ký duyệt Finance
- `department-approver`: ký duyệt Department
- `treasury-executor`: thực hiện mock settlement

Tạo tối thiểu 4 tài khoản người dùng Tide khác nhau, gán 4 vai trò tương ứng bằng TideCloak Admin Console và đăng nhập lại để có JWT mới. Việc tạo role và gán role trên realm bật IGA tạo các **change requests**; cần phê duyệt/commit thông qua giao diện quản trị trước khi quyền có hiệu lực. Không bật đường tắt admin trong API ứng dụng.

**MultiAdmin demonstration là bước không được bỏ qua:** Liên kết ít nhất **hai** admin Tide khác nhau; kiểm tra IGA `tide` (không phải `simple`/Tideless), chuyển sang governance có yêu cầu nhiều admin theo hướng dẫn Tide, và kiểm tra ngưỡng thực tế >=2. Không tự giả định 2-of-3 được cấu hình tự động. Admin thứ nhất thử gán `finance-approver` cho chính mình; trạng thái phải `PENDING`, không phát sinh quyền trong token mới. Admin thứ hai phê duyệt bằng Tide enclave qua native Admin Console; chỉ sau đủ quorum/commit mới có quyền. Nếu `POST .../approve` trả `mode=needs-approval`, phải hoàn thành enclave signing và gọi lại `/approve`; không tính là approved ngay sau phản hồi đầu tiên.

API IGA chuẩn là `/admin/realms/<realm>/iga/change-requests?status=PENDING`, duyệt `POST /.../{id}/approve`; không dùng API cũ `/tide-admin/change-set/*`. Không lưu admin token vào server ứng dụng. Hãy thử hành động ở **realm này**; master realm có thể được miễn IGA, vì vậy thử tại master không chứng minh an toàn.

## 6. Giới hạn bảo mật / minh bạch demo

MVP sử dụng expense store in-memory trong tiến trình Next.js: mất khi restart, không dùng multi-instance hoặc chạy production. Một người kiểm soát application server/DB có thể sửa tình trạng khoản chi, vì per-expense approvals chưa được Tide ký bằng cryptographic policy. Đừng tuyên bố đã ngăn mọi kiểu override đối với dữ liệu kế toán. Hãy nhấn mạnh **Tide bảo vệ thông tin định danh, role attestation và governed role changes**; nghiệp vụ duyệt và mock settlement là phần app minh họa. Nếu muốn bảo vệ không thể sửa đổi từng lệnh thanh toán thì cần thiết kế Tide policy-governed signing/Forseti được Tide team triển khai/test, ngoài phạm vi MVP tự dựng này.
