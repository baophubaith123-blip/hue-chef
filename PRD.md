# PRD — HUE CHEF
## Game nấu món ăn Huế

---

## 📋 THÔNG TIN TÀI LIỆU

| Mục | Nội dung |
|---|---|
| **Tên dự án** | Hue Chef — Game nấu món ăn Huế |
| **Mã học phần** | INT.7.18 — Web FrontEnd nâng cao |
| **Hình thức** | Đồ án cá nhân |
| **Phiên bản** | 2.2 (Cập nhật UI/UX & Sửa lỗi toàn diện theo error.md) |
| **Ngày cập nhật** | 03/11/2026 |
| **Tác giả** | Nguyễn Gia Bảo |
| **MSSV** | 2401ITA006 |
| **Trạng thái** | Hoàn thành 100% (Đã nghiệm thu và vượt qua toàn bộ kiểm thử TypeScript & Build) |

---

## 1. 🎯 TỔNG QUAN ĐỀ TÀI

### 1.1. Mô tả ngắn

Ứng dụng **game mô phỏng nấu ăn** đặt bối cảnh **quán ăn truyền thống Huế**. Người chơi **học công thức** rồi **thực hành nấu** bằng cách kéo thả nguyên liệu đúng thứ tự — qua đó **thu thập thành tích, mở khoá món mới, leo bảng xếp hạng**.

Hệ thống có **4 vai trò**:
- **Player** — Người chơi.
- **Support** — Hỗ trợ viên xử lý khiếu nại.
- **Editor** — Người sáng tạo công thức.
- **Admin** — Người kiểm duyệt và quản trị.

### 1.2. Vấn đề giải quyết

| # | Vấn đề | Giải pháp |
|---|---|---|
| 1 | Người trẻ xa rời ẩm thực truyền thống Huế | Game hóa việc học nấu ăn |
| 2 | App nấu ăn hiện tại khô khan | Drag-drop + animation + sound |
| 3 | Không có app tập trung vào ẩm thực Huế | 15+ món đặc sản Huế |
| 4 | User bị ban oan không có cách khiếu nại | Hệ thống Support + Appeal |
| 5 | Không có kênh giao tiếp Admin ↔ User | Hệ thống Mail + Broadcast |
| 6 | App chỉ hỗ trợ 1 ngôn ngữ | Đa ngôn ngữ vi + en |
| 7 | Admin vừa tạo vừa duyệt (xung đột) | Tách Editor (Creator) / Admin (Moderator) |

### 1.3. Đối tượng người dùng

- Học sinh, sinh viên — Tìm hiểu ẩm thực Huế.
- Du khách — Khám phá văn hóa ẩm thực địa phương.
- Người yêu thích nấu ăn — Luyện tập công thức Huế.
- Người nước ngoài — Dùng bản tiếng Anh.
- Content Creator — Editor tạo công thức.

### 1.4. Mục tiêu đo lường được (SMART)

| # | Mục tiêu | Chỉ số | Thời hạn |
|---|---|---|---|
| 1 | Xây dựng 15+ món ăn Huế | 15 recipes hoàn chỉnh | Tuần 1 |
| 2 | Hoàn thành game nấu ăn | Drag-drop + Timer + Score | Tuần 2 |
| 3 | Hoàn thành Editor + Admin workflow | Tạo → Duyệt → Chơi | Tuần 3 |
| 4 | Hoàn thành Support + Mail + i18n | Full features | Tuần 4-5 |
| 5 | Đạt 9-10/10 điểm rubric | Tự đánh giá + vấn đáp | Tuần 5 |

---

## 2. 🛠️ TECH STACK

### 2.1. Công nghệ chính

| Loại | Công nghệ | Phiên bản |
|---|---|---|
| Ngôn ngữ | TypeScript | 5.x |
| Framework | React | 18+ |
| Build tool | Vite | 5+ |
| Routing | React Router | v6 |
| Styling | CSS thuần + CSS Modules | — |
| State | Context API + useReducer | — |
| Storage | localStorage | — |
| i18n | Tự viết Context | — |

### 2.2. Thư viện ngoài

| Thư viện | Mục đích | Bắt buộc |
|---|---|---|
| `react-router-dom` | Routing 40 tuyến | ✅ |
| `recharts` | Biểu đồ Admin | ✅ |

### 2.3. Quy tắc

- ❌ Không dùng `any`.
- ❌ Không hardcode API URL.
- ❌ Không import từ `../../../`.
- ❌ Không `console.log()` trong prod.
- ✅ Commit theo Conventional Commits.

---

## 3. 👥 VAI TRÒ & PHÂN QUYỀN

### 3.1. Bốn vai trò

| # | Vai trò | Nhiệm vụ chính | Số chức năng |
|---|---|---|---|
| 1 | **PLAYER** | Người chơi — học + nấu | 31 |
| 2 | **SUPPORT** | Hỗ trợ — xử lý khiếu nại | 10 |
| 3 | **EDITOR** | **Người sáng tạo** — tạo công thức | 10 |
| 4 | **ADMIN** | **Người kiểm duyệt** — duyệt + quản trị | 32 |

### 3.2. Bảng so sánh quyền hạn

| Chức năng | Player | Support | Editor | Admin |
|---|:-:|:-:|:-:|:-:|
| Xem công thức | ✅ | ❌ | ✅ | ✅ |
| **Tạo công thức** | ❌ | ❌ | **✅** | ❌ |
| **Sửa công thức của mình** | ❌ | ❌ | **✅** | ❌ |
| **Xoá công thức của mình** | ❌ | ❌ | **✅** | ❌ |
| **Duyệt công thức** | ❌ | ❌ | ❌ | **✅** |
| **Từ chối công thức** | ❌ | ❌ | ❌ | **✅** |
| Xem tất cả công thức | Approved only | ❌ | ✅ | ✅ |
| Quản lý Users | ❌ | ❌ | ❌ | ✅ |
| Ban/Unban User | ❌ | ❌ | ❌ | ✅ |
| Xoá User | ❌ | ❌ | ❌ | ✅ |
| Xử lý khiếu nại | ❌ | ✅ | ❌ | ✅ |
| Broadcast | ❌ | ❌ | ❌ | ✅ |
| Audit Log | ❌ | ❌ | ❌ | ✅ |
| Backup/Restore | ❌ | ❌ | ❌ | ✅ |

### 3.3. Tài khoản test

| Vai trò | Email | Password | Cách tạo |
|---|---|---|---|
| Player | Tự do | Tự chọn | Đăng ký `/register` |
| Support | `support@hue.vn` | `support123` | Mock data |
| Editor | `editor@hue.vn` | `editor123` | Mock data |
| Admin | `admin@hue.vn` | `admin123` | Mock data |

---

## 4. 🗺️ TUYẾN DỰ KIẾN — 40 TUYẾN

### 4.1. Auth (3 tuyến)

| # | Đường dẫn | Trang | Mô tả |
|---|---|---|---|
| 1 | `/login` | LoginPage | Đăng nhập 4 vai trò |
| 2 | `/register` | RegisterPage | Đăng ký Player |
| 3 | `/forgot-password` | ForgotPasswordPage | Quên mật khẩu |

### 4.2. Player (13 tuyến)

| # | Đường dẫn | Trang | Mô tả |
|---|---|---|---|
| 4 | `/` | HomePage | Trang chủ Player |
| 5 | `/recipes` | RecipeListPage | Danh sách món |
| 6 | `/recipes/:id` | RecipeDetailPage | Chi tiết + comments |
| 7 | `/cooking/:id` | CookingPage | Nấu ăn ⭐ |
| 8 | `/achievements` | AchievementsPage | Thành tích |
| 9 | `/collection` | CollectionPage | Bộ sưu tập |
| 10 | `/profile` | ProfilePage | Hồ sơ cá nhân |
| 11 | `/profile/:userId` | UserProfilePage | Hồ sơ người khác |
| 12 | `/inbox` | InboxPage | Hộp thư |
| 13 | `/inbox/:mailId` | MailDetailPage | Chi tiết thư |
| 14 | `/reports` | ReportsPage | Lịch sử báo cáo |
| 15 | `/appeals` | AppealsPage | Khiếu nại |
| 16 | `/settings` | SettingsPage | Cài đặt |

### 4.3. Editor (5 tuyến)

| # | Đường dẫn | Trang | Mô tả |
|---|---|---|---|
| 17 | `/editor` | EditorDashboardPage | Dashboard |
| 18 | `/editor/recipes` | EditorMyRecipesPage | Công thức của tôi |
| 19 | `/editor/recipes/new` | EditorRecipeFormPage | Tạo mới |
| 20 | `/editor/recipes/:id` | EditorRecipeDetailPage | Chi tiết |
| 21 | `/editor/recipes/:id/edit` | EditorRecipeFormPage | Sửa |

### 4.4. Support (4 tuyến)

| # | Đường dẫn | Trang | Mô tả |
|---|---|---|---|
| 22 | `/support` | SupportDashboardPage | Dashboard |
| 23 | `/support/appeals` | SupportAppealsPage | Danh sách khiếu nại |
| 24 | `/support/appeals/:id` | SupportAppealDetailPage | Chi tiết |
| 25 | `/support/chat/:userId` | SupportChatPage | Chat |

### 4.5. Admin (12 tuyến)

| # | Đường dẫn | Trang | Mô tả |
|---|---|---|---|
| 26 | `/admin` | AdminDashboardPage | Dashboard |
| 27 | `/admin/review` | AdminReviewPage | Duyệt công thức |
| 28 | `/admin/review/:id` | AdminReviewDetailPage | Chi tiết duyệt |
| 29 | `/admin/users` | AdminUsersPage | Quản lý users |
| 30 | `/admin/users/:id` | AdminUserDetailPage | Chi tiết user |
| 31 | `/admin/recipes` | AdminAllRecipesPage | Xem tất cả |
| 32 | `/admin/achievements` | AdminAchievementsPage | CRUD badges |
| 33 | `/admin/ingredients` | AdminIngredientsPage | CRUD ingredients |
| 34 | `/admin/comments` | AdminCommentsPage | Quản lý comments |
| 35 | `/admin/reports` | AdminReportsPage | Xử lý reports |
| 36 | `/admin/appeals` | AdminAppealsPage | Xử lý appeals |
| 37 | `/admin/broadcast` | AdminBroadcastPage | Gửi thông báo |
| 38 | `/admin/settings` | AdminSettingsPage | Cài đặt |
| 39 | `/admin/audit-log` | AdminAuditLogPage | Audit log |
| 40 | `/admin/backup` | AdminBackupPage | Backup/Restore |

### 4.6. Common (4 tuyến)

| # | Đường dẫn | Trang |
|---|---|---|
| — | `/help` | HelpPage |
| — | `/feedback` | FeedbackPage |
| — | `/about` | AboutPage |
| — | `*` | NotFoundPage |

---

## 5. 📋 FEATURE LIST — 16 FEATURES

| # | Feature | Vai trò | Điểm |
|---|---|---|---|
| 1 | `auth` | Cả 4 | 15 |
| 2 | `recipes` | Player + Editor + Admin | 18 |
| 3 | `cooking` ⭐ | Player | 22 |
| 4 | `achievements` | Player + Admin | 8 |
| 5 | `collection` | Player | 6 |
| 6 | `comments` | Player + Admin | 10 |
| 7 | `reports` | Player + Editor + Admin | 12 |
| 8 | `appeals` | Player + Support + Admin | 12 |
| 9 | `notifications` | Cả 4 | 10 |
| 10 | `mail` | Cả 4 | 15 |
| 11 | `profile` | Player | 8 |
| 12 | `editor` ⭐ | Editor | 10 |
| 13 | `support` | Support | 10 |
| 14 | `admin` | Admin | 20 |
| 15 | `i18n` | Cả 4 | 8 |
| 16 | `minigames & imperial-ui` ⭐ | Player + Editor | 16 |

**TỔNG:** ~200 điểm.

### 5.1. Feature `auth` — 15 điểm

| Chức năng | Điểm |
|---|---|
| Đăng ký Player | 3 |
| Đăng nhập 4 vai trò | 3 |
| Đăng xuất | 1 |
| Session localStorage | 1 |
| Protected Route | 3 |
| Validation | 2 |
| Forgot password | 2 |

### 5.2. Feature `recipes` — 18 điểm

| Chức năng | Điểm |
|---|---|
| Danh sách 15+ món | 3 |
| Lọc theo loại/độ khó/giá | 3 |
| Tìm kiếm (không dấu) | 2 |
| Sort | 1 |
| Chi tiết món | 3 |
| **Editor CRUD công thức** | 5 |
| Comments + đánh giá | 1 |

### 5.3. Feature `cooking` ⭐ — 22 điểm

| Chức năng | Điểm |
|---|---|
| Layout 3 cột | 2 |
| Drag-drop nguyên liệu | 5 |
| Timer đếm ngược | 3 |
| State machine (useReducer) | 4 |
| Tính điểm `calculateScore()` | 3 |
| Modal kết quả | 2 |
| Animation CSS | 3 |
| Sound | 2 |

### 5.4. Feature `achievements` — 8 điểm

| Chức năng | Điểm |
|---|---|
| 12 badges | 3 |
| Progress bar | 2 |
| Notification khi mở | 2 |
| Modal chi tiết | 1 |

### 5.5. Feature `collection` — 6 điểm

| Chức năng | Điểm |
|---|---|
| Timeline các món đã nấu | 2 |
| Biểu đồ (Recharts) | 3 |
| Filter theo loại, ngày | 1 |

### 5.6. Feature `comments` — 10 điểm

| Chức năng | Điểm |
|---|---|
| Bình luận công thức | 3 |
| Đánh giá sao | 2 |
| Reply comment | 2 |
| Thích comment | 1 |
| Báo cáo comment | 2 |

### 5.7. Feature `reports` — 12 điểm

| Chức năng | Điểm |
|---|---|
| Player gửi báo cáo | 3 |
| Xem lịch sử báo cáo | 2 |
| Editor xử lý nhẹ | 2 |
| Admin xử lý nặng | 3 |
| Lọc + tìm kiếm | 2 |

### 5.8. Feature `appeals` — 12 điểm

| Chức năng | Điểm |
|---|---|
| Player khiếu nại | 3 |
| Support nhận + chat | 3 |
| Upload bằng chứng | 3 |
| Đề xuất Admin | 2 |
| Admin xử lý | 1 |

### 5.9. Feature `notifications` — 10 điểm

| Chức năng | Điểm |
|---|---|
| Notification bell | 2 |
| Dropdown thông báo | 2 |
| Đánh dấu đã đọc | 2 |
| Xoá thông báo | 1 |
| Âm thanh thông báo | 1 |
| Filter theo loại | 2 |

### 5.10. Feature `mail` — 15 điểm

| Chức năng | Điểm |
|---|---|
| Hộp thư Player | 3 |
| Chi tiết thư | 2 |
| Badge chưa đọc | 2 |
| Broadcast từ Admin | 4 |
| Ban Notice popup | 3 |
| Warning popup | 3 |
| Phân loại thư | 2 |

### 5.11. Feature `profile` — 8 điểm

| Chức năng | Điểm |
|---|---|
| Xem profile | 2 |
| Sửa profile | 2 |
| Đổi mật khẩu | 2 |
| Xoá tài khoản | 2 |

### 5.12. Feature `editor` ⭐ — 10 điểm

| Chức năng | Điểm |
|---|---|
| Dashboard Editor | 2 |
| Danh sách công thức của tôi | 2 |
| **Tạo công thức** (form dynamic) | 3 |
| **Sửa công thức của mình** | 2 |
| **Xoá công thức của mình** | 1 |

### 5.13. Feature `support` — 10 điểm

| Chức năng | Điểm |
|---|---|
| Dashboard Support | 2 |
| Danh sách khiếu nại | 2 |
| Chi tiết + bằng chứng | 2 |
| Chat realtime (mock) | 2 |
| Ghi chú nội bộ | 1 |
| Đề xuất Admin | 1 |

### 5.14. Feature `admin` — 20 điểm

| Chức năng | Điểm |
|---|---|
| Dashboard + biểu đồ | 4 |
| **Duyệt công thức** (Review Queue) | 5 |
| Quản lý Users (ban/unban/delete) | 3 |
| Quản lý Comments | 1 |
| Xử lý Reports | 1 |
| Xử lý Appeals | 1 |
| CRUD Achievements | 2 |
| CRUD Ingredients | 2 |
| Broadcast | 1 |

### 5.15. Feature `i18n` — 8 điểm

| Chức năng | Điểm |
|---|---|
| LanguageContext | 2 |
| 100+ keys vi + en | 2 |
| LanguageSwitcher | 2 |
| Auto-detect browser | 1 |
| Lưu preference | 1 |

### 5.16. Feature `minigames & imperial-ui` ⭐ — 16 điểm

| Chức năng | Điểm |
|---|---|
| Minigame thử thách phương pháp chế biến (Action Cooking) | 4 |
| Minigame câu đố trắc nghiệm ẩm thực Huế (Quiz Game) | 3 |
| Bục vinh danh Podium Top 3 Leaderboard bằng CSS | 3 |
| Thiết kế 3 Panel Cooking (Nguyên liệu 2 cột, Nồi viền nét đứt, Checkmark các bước) | 3 |
| Hệ thống bảng màu Hoàng Cung (Mận hoàng gia, Đỏ gạch, Vàng kim, Kem ấm) | 3 |

---

## 6. 🧠 GLOBAL STATE — 12 CONTEXTS

| # | Context | Chức năng |
|---|---|---|
| 1 | **AuthContext** | User + role + tiến độ |
| 2 | **ThemeContext** | Sáng/tối |
| 3 | **LanguageContext** | vi/en |
| 4 | **RecipeContext** | Recipes + CRUD |
| 5 | **CookingContext** ⭐ | State machine nấu |
| 6 | **AchievementContext** | 12 badges |
| 7 | **MailContext** | Hộp thư + Broadcast |
| 8 | **SupportContext** | Khiếu nại + chat |
| 9 | **AppealContext** | Đơn khiếu nại |
| 10 | **CommentContext** | Bình luận |
| 11 | **AdminContext** | Quản trị nâng cao |
| 12 | **NotificationContext** | Thông báo |

### 6.1. LocalStorage Keys — 17 keys

| # | Key | Nội dung |
|---|---|---|
| 1 | `hue-chef-users` | Danh sách users |
| 2 | `hue-chef-auth` | Phiên đăng nhập |
| 3 | `hue-chef-progress` | Tiến độ Player |
| 4 | `hue-chef-recipes` | Recipes |
| 5 | `hue-chef-achievements` | Thành tích |
| 6 | `hue-chef-settings` | Cài đặt |
| 7 | `hue-chef-language` | Ngôn ngữ |
| 8 | `hue-chef-theme` | Theme |
| 9 | `hue-chef-notifications` | Thông báo |
| 10 | `hue-chef-reports` | Báo cáo |
| 11 | `hue-chef-appeals` | Khiếu nại |
| 12 | `hue-chef-comments` | Bình luận |
| 13 | `hue-chef-audit-log` | Audit log |
| 14 | `hue-chef-email-templates` | Email templates |
| 15 | `hue-chef-broadcasts` | Broadcast history |
| 16 | `hue-chef-inbox` | Hộp thư |
| 17 | `hue-chef-support-chats` | Support chats |

---

## 7. 📅 TIMELINE — 33 NGÀY

### Tuần 1: Setup + Auth + Player Core (Ngày 1-7)

| Ngày | Việc | Sản phẩm |
|---|---|---|
| 1 | Setup project + AGENTS.md + PRD | Repo khởi tạo |
| 2 | Mock data: 15 recipes + 30 ingredients | `data/` |
| 3 | AuthContext + Login + Register | Auth |
| 4 | ProtectedRoute + Phân quyền 4 vai trò | Bảo vệ route |
| 5 | HomePage + RecipeListPage | Home + List |
| 6 | RecipeDetailPage + Comments | Chi tiết |
| 7 | Review + Fix bugs | ✅ Checkpoint 1 |

### Tuần 2: Cooking (Ngày 8-14)

| Ngày | Việc | Sản phẩm |
|---|---|---|
| 8 | Layout Cooking 3 cột | Layout |
| 9 | Drag-drop nguyên liệu | Drop hoạt động |
| 10 | CookingContext useReducer | State machine |
| 11 | Timer + Progress bar | Timer OK |
| 12 | `calculateScore()` + Modal | Điểm OK |
| 13 | Animation CSS keyframes | Bay + rung |
| 14 | Review + Fix bugs | ✅ Checkpoint 2 |

### Tuần 3: Editor + Admin Review (Ngày 15-21)

| Ngày | Việc | Sản phẩm |
|---|---|---|
| 15 | Editor Dashboard + My Recipes | Editor UI |
| 16 | Editor Recipe Form (dynamic) | Form tạo |
| 17 | Editor gửi duyệt + Sửa + Xoá | Workflow |
| 18 | Admin Review Queue + Chi tiết | `/admin/review` |
| 19 | Admin Duyệt/Từ chối | Approve |
| 20 | Editor nhận thông báo (Mail) | Notification |
| 21 | Achievements + Collection | Badges |

### Tuần 4: Support + Mail + i18n (Ngày 22-28)

| Ngày | Việc | Sản phẩm |
|---|---|---|
| 22 | Support Dashboard + Appeals | Support UI |
| 23 | Support Chat + Upload evidence | Chat |
| 24 | MailContext + Inbox + Broadcast | Mail |
| 25 | Ban Notice + Warning popup | Popup |
| 26 | Setup i18n + LanguageContext | i18n |
| 27 | Dịch toàn bộ UI | Song ngữ |
| 28 | Sound + Toggle bật/tắt | Sound |

### Tuần 5: Polish + Nộp (Ngày 29-33)

| Ngày | Việc | Sản phẩm |
|---|---|---|
| 29 | Responsive + Loading + Empty states | UX tốt |
| 30 | Testing 20+ kịch bản | Test report |
| 31 | Viết README + docs | README |
| 32 | Fix bugs cuối + Commit sạch | Code sạch |
| 33 | Push + PR + Demo | ✅ Nộp |

---

## 8. 📦 DELIVERABLES

### 8.1. Sản phẩm nộp bài

| # | Sản phẩm | Bắt buộc |
|---|---|---|
| 1 | Repo GitHub với 40 tuyến, 15+ món, 4 vai trò | ✅ |
| 2 | README.md | ✅ |
| 3 | AGENTS.md | ✅ |
| 4 | PRD.md (file này) | ✅ |
| 5 | `.env` | ✅ |
| 6 | 10+ commits Conventional Commits | ✅ |
| 7 | Pull Request vào `main` | ✅ |
| 8 | File Word demo 8+ kịch bản | ✅ |
| 9 | Video demo (nếu yêu cầu) | ⚠️ |

### 8.2. Kịch bản demo (8 phút)

---

## 9. 🔄 CẬP NHẬT TRIỂN KHAI SAU PRD (Phase 9–10)

> Ghi nhận các thay đổi đã triển khai sau khi PRD được duyệt — PRD gốc giữ nguyên để đối chiếu.

| Hạng mục | PRD gốc | Hiện trạng triển khai |
|---|---|---|
| Thành tích | 12 huy chương | **27 huy chương**, 4 độ hiếm (Thường/Hiếm/Sử thi/Huyền thoại), 2 loại điều kiện mới (perfect_count, cook_difficulty) |
| Global state | 12 contexts | **13 contexts** |
| Tài khoản BXH | Dữ liệu mẫu tĩnh | **40 tài khoản người chơi thật**, đăng nhập được, BXH lọc tuần/tháng/mọi thời đại |
| Độ khó công thức | Chưa phân cấp thật | **5 cấp** (Dễ→Địa ngục), nguyên liệu đúng/nhiễu 6/4→20/20, bước cần 1–3 nguyên liệu, 182 câu hỏi quiz |
| Điểm thưởng | Điểm nền + minigame | Thêm **combo thả đúng liên tiếp** (cửa sổ 2 giây, +10→+50/lần) và **bonus tốc độ quiz** (tới +50%); `lib/score.ts` vẫn 100% tự viết, combo cộng qua kênh bonus mở rộng |
| Ván chơi | Chỉ kéo thả + minigame | **5 màn nối tiếp** (đi chợ ghi nhớ → bắt nguyên liệu rơi → kéo thả + nêm chuẩn vị → nấu hoàn thiện nhịp điệu → hỏi đáp), cấu hình được trong Editor (bật/tắt từng màn, chỉnh thời gian/tốc độ), điểm từng màn cộng qua kênh bonus và hiện bảng phân rã ở modal kết quả |
| Trần điểm ván | Điểm gốc + cộng dồn không trần (ván test đạt 1.576 ở món 400) | **Điểm gốc là trần của ván**: mỗi thành phần ăn một tỷ trọng của điểm gốc theo hiệu quả (15/15/30/10/15/10/5), ván hoàn hảo = đúng điểm gốc; sao theo % trần |
| Tiền tệ & sở hữu món | Chưa có — mọi món chơi tự do | **Xu** (thắng ván nhận điểm ÷ 10, lần đầu +50%); món 2★+ phải mua, giá tăng theo điểm trong cùng cấp sao; **ván chỉ thắng khi đạt ≥ 40% điểm gốc**; Editor chỉnh điểm/giá theo dải từng cấp sao (`lib/pricing.ts`) |
| Kho công thức | 15 món (3 món mỗi cấp sao) | **50 món** đúng cơ cấu 5/10/14/16/5 theo ★, 603 câu quiz, kho nguyên liệu 83 loại |
| Perk thành tích | Thành tích chỉ để trưng bày | **11 loại perk** theo độ hiếm, gắn cho 33 thành tích; **đeo đúng 1 thành tích** để perk áp vào cả 5 màn (giờ chợ/nấu/quiz, nồi hứng, vùng nêm, khiên combo, cơ hội thứ hai...); Admin tạo được thành tích kèm perk |
| Khóa tài khoản & khiếu nại | Khóa không thời hạn, không thư báo; người bị khóa không vào được trang kháng cáo | **Khóa có lý do + hạn khóa**, thư báo khóa tự động, người bị khóa đăng nhập được nhưng chỉ dùng được Trò chuyện hỗ trợ và **tự gửi khiếu nại**; Support đề xuất → Admin chấp nhận thì mở khóa ngay (Phase 14) |
| Thành tích do Admin tạo | Chỉ hiển thị trong Admin, ghi chung kho với dữ liệu mở khóa của người chơi | Lưu ở **2 key riêng** (ghi đè + danh sách đã xóa) rồi hợp nhất vào danh mục phía người chơi: tạo/sửa/xóa ở Admin đều phản ánh ngay cho Player (Phase 14) |
| Cài đặt hệ thống | Form trang trí, giá trị không được áp dụng | **Áp dụng thật**: chế độ bảo trì, số cảnh cáo trước khi tự khóa, dung lượng avatar tối đa, điểm tối đa của công thức, thời gian treo máy tự đăng xuất (Phase 14) |
| Bình luận món ăn | Chỉ có trang quản trị ở Admin | Người chơi **bình luận + chấm sao + báo cáo** ngay tại trang chi tiết món; Admin kiểm duyệt ở Bình luận/Báo cáo, xóa qua báo cáo là xóa chính bình luận (Phase 14) |
| Minigame gõ phím | Có trong danh sách chọn nhưng chưa có màn chơi | **Chơi được**: gõ đúng câu mẫu theo ký tự, tính chính xác + thưởng tốc độ như các minigame khác (Phase 14) |
| Nguyên liệu dùng lại giữa các bước | Khay khóa vĩnh viễn nguyên liệu đã thả ở bước trước (36/51 món không thể hoàn thành) | Khay tính theo **nồi của bước hiện tại** — nguyên liệu dùng lại ở bước sau thả lại bình thường (Phase 14) |
| Tìm kiếm & lọc món | Dãy nút phân loại trải ngang, không lọc được độ khó, thứ tự món lộn xộn | 2 nút lọc **bấm-mở-chọn** (Phân loại · Độ khó) + Xoá lọc; lưới món xếp **dễ → Địa ngục** (Phase 15) |
| Phân loại món | 5 loại cứng; 17/50 món bị xếp sai (vả trộn vào Cơm) | **8 loại đúng bản chất món** (thêm Gỏi·Trộn·Cuốn, Canh·Lẩu, Món mặn; Cơm → Cơm·Xôi), 16 món được phân loại lại, Editor **tự thêm loại mới** được (Phase 15) |
| Dữ liệu phía Editor | Công thức mẫu không có chủ sở hữu → dashboard Editor toàn 0 | 50 món + 33 thành tích mẫu thuộc về **editor@hue.vn**, có migration cho dữ liệu đã lưu (Phase 15) |
| Soạn công thức | Ô bước không nhãn gây khó hiểu; không xem trước được | Nhãn + chú thích từng ô, **Xem trước + checklist 7 mục + chạy thử** trước khi gửi duyệt, **Xem lại** mọi công thức của mình (Phase 15) |
| Thành tích phía Editor | Editor không có mục thành tích | Editor tạo thành tích → **Admin duyệt** → người chơi thấy; dashboard Editor có số đếm thành tích (Phase 15) |
| Danh sách nguyên liệu | Phân loại in thô tiếng Anh, không có đơn vị, cuộn chung trang | Nhãn tiếng Việt, **đơn vị đủ 83 loại**, nhóm Đậu·Hạt mới, **cuộn riêng**, bỏ cột Mô tả (Phase 15) |
| Giao diện người chơi | Phong cách cung đình phẳng, podium bảng xếp hạng là 3 cột đen đơn điệu | **Theme 'Lễ hội ẩm thực'**: gỗ + biển gỗ, đèn lồng, cờ hội, viền dày nét game 2D cho toàn bộ phía Player; podium thành **thùng gỗ vàng/bạc/đồng**; sáng = lễ hội ngày, tối = chợ đêm (Phase 16) |
| Ảnh món ăn | Ảnh thật hiển thị phẳng | Ảnh thật **đóng khung gỗ viền vàng** — giữ đúng món thật và dễ thêm món mới (Phase 16) |
| Chợ nguyên liệu khi món nhiều nguyên liệu | Toàn bộ ô chợ dồn vào một lưới dài | **Chia sạp 8 ô/trang** ('Sạp x/y' + mũi tên + chấm trang), lựa chọn giữ nguyên khi lật sạp (Phase 16) |
| Khay nguyên liệu khi nấu | Toàn bộ chip (tối đa 40) dồn một khay cuộn dài | **Chia tối đa 3 khay**, chip đã dùng giữ khóa ở mọi khay, thanh lật khay riêng với dialog Nêm (Phase 16) |
| Khung cảnh trong game | Các màn chơi nền phẳng đơn sắc | **Tranh cảnh vẽ thật theo từng màn** (chợ Huế, bếp lửa, sân hứng, lễ hội ngày/đêm) lưu thành file ảnh trong project, phủ sau giao diện mọi màn chơi và đầu các trang Player (Phase 17) |
| Bố cục ván chơi | Trang bị kéo dài, cuộn xuống thì mất đồng hồ và tên món | **Gói trọn 1 khung hình**: tên món, điểm, đồng hồ luôn hiện; các cột cuộn bên trong khung (Phase 17) |
| Thanh cuộn | Thanh cuộn hệ thống thô, có nút mũi tên | **Tàn hình**: mảnh 6px, chỉ hiện mờ khi đang cuộn hoặc rê chuột, toàn app (Phase 17) |
| Chữ trong thẻ Trang chủ (theme tối) | Hàng thành tích/vinh danh nền tối nhưng chữ cũng tối, gần như không đọc được | Chữ kem/vàng tương phản rõ trên nền hàng tối (Phase 17) |
| Hộp thống kê Bộ sưu tập | Lật đen (theme tối) / trắng (theme sáng) lạc tông với thân thẻ kem | Bảng giấy đậm viền gỗ **giống hệt ở cả 2 theme** (Phase 17) |
| Pha Đi chợ | Danh sách và sạp hiện cùng lúc ở độ khó thấp; lưới sạp có thể bị co mất trên màn hình thấp | **2 pha tách bạch ở mọi độ khó**: Ghi nhớ (chỉ danh sách, 12/10/8s theo ★) → bấm 'Lên Xe' hoặc hết giờ xem mới hiện sạp; đồng hồ chợ chỉ chạy ở pha chọn; lưới sạp luôn đủ chiều cao (Phase 18) |
| Gợi ý ở màn Nấu | Dòng 'Bước này cần N nguyên liệu' + chip cần thiết phát sáng/tag | **Bỏ hẳn** — người chơi tự đọc hướng dẫn của bước để tìm nguyên liệu đúng (Phase 18) |
| Nồi Nồi ở màn Nấu | Ảnh 280px quá to/lệch, nền kem của tranh lệch tông với panel ở cả 2 theme | Thu còn 200px, đặt trên **tấm nền kem khớp màu tranh**, thống nhất cả 2 theme; cột nồi hết chiếm rộng nhất (Phase 18) |
| Điểm Hoàn thiện | Nhãn nổi có thể hiện số âm ở mức 'Tốt' (−4) do in độ lệch điểm rescale tích lũy | 'Tốt' **không bao giờ âm** (sàn +5); thêm mức **'Kém' −10** khi bấm sớm trước nửa vòng; 'Trượt' −20; nhãn nổi in điểm của chính vòng đó (Phase 18) |
| Phản hồi Hỏi đáp | Đáp án tràn khỏi khung hình; chữ câu hỏi trắng trên bong bóng kem ở theme tối | Câu hỏi + 4 đáp án **trọn 1 khung**; đúng → **✓ xanh lá** trên đáp án đã chọn; sai → **✗ đỏ** trên đáp án đã chọn + ✓ xanh lá trên đáp án đúng; chữ câu hỏi mận đậm đọc rõ (Phase 18) |
| Chữ trên nền giấy (theme tối) | Landing/Chi tiết món/Trang cá nhân: chữ trắng trên thẻ kem không đọc được | Ghim màu chữ giấy nâu đậm cho bề mặt kem ở **cả 2 theme**, đo tương phản tự động đạt (Phase 18) |
| Đeo thành tích | Bỏ đeo ở Trang cá nhân không đồng bộ: Trang chủ vẫn hiện đang đeo, perk vẫn chạy theo state cũ | **Một nguồn sự thật duy nhất** trong hồ sơ dùng chung — đổi là áp dụng ngay khắp nơi; Trang chủ phân biệt 🏅 đang đeo / ⭐ danh hiệu cấp độ (Phase 18) |
| Linh vật Nồi Nồi | Ảnh mascot kiểu cũ, lệch phong cách game | **Vẽ lại 2D** nét lễ hội, dùng thống nhất ở nồi nấu, MC hỏi đáp, hứng nguyên liệu, hoàn thiện, hộp thư trống, giới thiệu và trang cá nhân (Phase 16) |
| Bảng xếp hạng | Tĩnh, tải lại trang | **Thời gian thực**: tự làm mới khi có điểm mới, khi quay lại tab, heartbeat 5 giây; có mũi tên tăng/giảm hạng so với kỳ trước |
| Cuộn danh sách | Cuộn toàn trang | **Bộ cuộn riêng** cho lưới công thức (tìm kiếm đứng im), danh sách BXH, cột bước nấu và khay nguyên liệu |
| Lưu trữ | localStorage | Giữ nguyên & đã kiểm chứng: bộ sưu tập, thành tích, EXP, hộp thư, thông báo **không mất khi tắt máy/mở lại**; chỉ mất khi xoá dữ liệu trình duyệt hoặc đổi trình duyệt/máy (đồng bộ đa thiết bị cần backend — ngoài phạm vi PRD) |
