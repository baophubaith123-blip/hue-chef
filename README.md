# 🍜 Hue Chef — Game Nấu Ẩm Thực Huế

> **Đồ án cuối kỳ — INT.7.18 Web FrontEnd Nâng Cao**
>
> **Tác giả:** Nguyễn Gia Bảo — MSSV: 2401ITA006

---

## 📖 Giới thiệu

**Hue Chef** là game mô phỏng nấu các món ăn đặc trưng xứ Huế qua cơ chế kéo-thả (drag-and-drop) nguyên liệu. Người chơi sẽ làm quen với 15 món ăn kinh điển, mở khoá 27 huy chương thành tích, xây dựng bộ sưu tập công thức và nhận điểm thưởng theo từng màn nấu. Hệ thống hỗ trợ **4 vai trò** phân quyền rõ ràng (Player / Support / Editor / Admin) với **40 tuyến** truy cập.

---

## ✨ Tính năng nổi bật

| Nhóm | Tính năng |
|---|---|
| 🎮 **Gameplay** | **Ván chơi 5 màn** cho mọi món: ① Đi chợ (ghi nhớ danh sách, từ 3★ danh sách tự che — xem lại trừ 5s và sạp đảo vị trí) → ② Bắt nguyên liệu rơi toàn màn hình → ③ Kéo thả + thanh **Nêm chuẩn vị** theo từng bước sơ chế → ④ Nấu hoàn thiện (chạm vòng tròn theo nhịp, chỉ "Tuyệt vời" mới tính combo) → ⑤ Hỏi đáp. Luật & điểm của từng màn gói trong nút "?" mở popup. **Hệ thống Combo**: thả đúng liên tiếp trong cửa sổ 2 giây để gom điểm thưởng combo (+10→+50/lần), thả sai hoặc chậm quá 2s là mất chuỗi |
| ⚡ **Minigames** | Thử thách thao tác chế biến (Xào/Luộc/Hấp/Nướng) + Quiz văn hóa ẩm thực Huế phong cách gameshow (vòng đếm ngược, **bonus tốc độ** tới +50% điểm câu, chuỗi đúng cộng dồn điểm) |
| 👑 **Bảng xếp hạng** | Bục vinh danh Podium Top 3 (Vàng 👑, Bạc 🥈, Đồng 🥉) vẽ hoàn toàn bằng CSS + danh sách **cuộn riêng**, **cập nhật thời gian thực** (tự làm mới khi có điểm mới / đổi tab / 5 giây), mũi tên ▲▼ tăng giảm hạng so với kỳ trước, 40 tài khoản người chơi thật |
| 🏛️ **Imperial UI/UX** | Ngôn ngữ thiết kế Cố Đô Cung Đình Huế: Tím mận hoàng gia (#4A1525), Đỏ gạch (#C8553D), Vàng kim (#E9A23B), Nền kem ấm (#FAF5EF); các danh sách dài (công thức, xếp hạng, bước nấu, khay nguyên liệu) có **bộ cuộn riêng** để thanh tìm kiếm & tiêu đề đứng im |
| 🏆 **Thành tích** | 27 huy chương theo điều kiện với 4 độ hiếm (Thường/Hiếm/Sử thi/Huyền thoại), xem chi tiết tiến độ khi bấm vào |
| 💾 **Lưu trữ bền vững** | Toàn bộ tiến trình (món đã nấu/bộ sưu tập, thành tích, EXP/level, hộp thư, thông báo) lưu bằng localStorage ngay trên máy người chơi — tắt máy, mở lại hôm sau vẫn còn nguyên; chỉ mất khi xoá dữ liệu trình duyệt hoặc chơi trên trình duyệt/máy khác |
| 📚 **Bộ sưu tập** | Theo dõi các món đã nấu, lần nấu, điểm cao nhất, số sao trung bình |
| ✍️ **Editor** | Tạo/sửa công thức (draft → chờ duyệt), xem lý do từ chối, resubmit, tạo kịch bản minigame |
| 💬 **Support** | Live chat 1-1 với Player, tạo phiếu khiếu nại, đề xuất giải pháp cho Admin |
| 🛡️ **Admin** | Duyệt công thức, CRUD người dùng & khoá/mở tài khoản, audit log, CRUD nguyên liệu/thành tích, quản lý bình luận, báo cáo, khiếu nại, cài đặt hệ thống, sao lưu JSON |
| 📬 **Hệ thống Mail** | 6 loại thư: phê duyệt / từ chối công thức, cảnh cáo, thông báo khoá, thông báo chung, hỗ trợ trả lời |
| 🌐 **i18n** | Tiếng Việt + English (auto-detect ngôn ngữ trình duyệt, lưu lựa chọn vào localStorage) |
| 🌙 **Dark Mode** | Toggle theme sáng/tối, CSS variables full màu sắc (primary #1B2A4A, accent #E8450A, plum dark mode) |
| 🔊 **Sound Effects** | Web Audio API 5 âm thanh (click / success / error / drop / unlock) với toggle bật tắt |
| 📱 **Responsive** | Tối ưu mobile/tablet/desktop (Sidebar ngăn kéo, Grid thích ứng, 3 Panel cooking) |

---

## 🛠️ Công nghệ sử dụng

| Danh mục | Công nghệ |
|---|---|
| Framework | **React 18** + **TypeScript 5.6** (strict mode) |
| Build tool | **Vite 5** với plugin React |
| Routing | **React Router v6** (40 tuyến + protected routes theo vai trò) |
| State Management | **Context API + useReducer** (12 Contexts, tuỳ biến 100%) |
| Storage | **localStorage** (17 keys lưu auth, users, recipes, mail, settings, achievements…) |
| i18n | Tự viết Context (không dùng i18next), 160+ keys mỗi ngôn ngữ |
| UI Styling | **CSS thuần + CSS Modules** (không dùng Tailwind / shadcn / UI kit) |
| Animations | **CSS Keyframes** (không dùng Framer Motion) |
| Charts | **Recharts** (biểu đồ Admin dashboard) |
| Sound | **Web Audio API** (OscillatorNode tự tạo sóng âm thanh) |

### ❌ Thư viện KHÔNG dùng (theo quy tắc AGENTS.md)
- Redux / Redux Toolkit / Zustand
- Tailwind CSS
- shadcn/ui / Ant Design / Material UI
- Framer Motion
- react-i18next
- Bất kỳ thư viện nặng không cần thiết

---

## 🏗️ Kiến trúc & Cấu trúc thư mục

```
src/
├── app/                          # Lớp "vỏ"
│   ├── App.tsx                   # Root component
│   ├── providers.tsx             # Bọc 12 Context (Theme → Language → Auth → … → Comment)
│   └── router.tsx                # 40 tuyến + protected routes
│
├── pages/                        # 37 trang (default export)
│   ├── auth/                     # LoginPage, RegisterPage
│   ├── common/                   # HelpPage, FeedbackPage, AboutPage, NotFoundPage (404)
│   ├── player/                   # 8 trang Player (Home, RecipeList, RecipeDetail, Cooking, Inbox, MailDetail, Achievements, Collection)
│   ├── editor/                   # 5 trang Editor (Dashboard, MyRecipes, RecipeForm, RecipeDetail, 1 nữa)
│   ├── support/                  # 4 trang Support (Dashboard, Appeals, AppealDetail, Chat)
│   └── admin/                    # 15 trang Admin (Dashboard, Review, ReviewDetail, Broadcast, Users, UserDetail, AllRecipes, Achievements, Ingredients, Comments, Reports, Appeals, Settings, AuditLog, Backup)
│
├── features/                     # 15 features (named export components)
│   ├── auth/                     # Store + types + hooks đăng ký/đăng nhập
│   ├── recipes/                  # Recipe CRUD, workflow duyệt
│   ├── cooking/                  # Drag-drop, timer, tính điểm (score.ts tự viết 100%)
│   ├── achievements/             # AchievementBadge, AchievementList
│   ├── collection/               # Bộ sưu tập món đã nấu
│   ├── comments/                 # Bình luận + báo cáo
│   ├── reports/                  # Báo cáo vi phạm
│   ├── appeals/                  # Khiếu nại + workflow
│   ├── notifications/            # Thông báo thời gian thực (local)
│   ├── mail/                     # Hộp thư 6 loại
│   ├── profile/                  # Hồ sơ người dùng
│   ├── settings/                 # Cài đặt hệ thống
│   ├── editor/                   # Workflow Editor
│   ├── support/                  # Workflow Support
│   └── admin/                    # UserManagementTable, BanUserModal, AuditLogTable, lib/audit.ts
│
├── components/                   # Dùng chung
│   ├── ProtectedRoute.tsx        # Phân quyền theo vai trò
│   ├── Header.tsx + Footer.tsx   # Global header + footer (responsive)
│   ├── LanguageSwitcher.tsx      # Đổi ngôn ngữ + toggle dark mode
│   ├── NotificationBell.tsx      # Chuông thông báo (dropdown)
│   ├── Button.tsx / Card.tsx / Modal.tsx
│   ├── Toast.tsx / Loading.tsx / EmptyState.tsx
│   └── FileUpload.tsx / DynamicFormList.tsx
│
├── contexts/                     # 12 Contexts
│   ├── AuthContext.tsx           # Đăng nhập/đăng ký/quên mật khẩu
│   ├── ThemeContext.tsx          # Light / Dark mode (localStorage)
│   ├── LanguageContext.tsx       # vi / en (auto-detect browser)
│   ├── RecipeContext.tsx         # 15 món + CRUD + duyệt
│   ├── CookingContext.tsx        # State nấu ăn hiện tại
│   ├── AchievementContext.tsx    # 12 thành tích + mở khoá
│   ├── MailContext.tsx           # 6 loại thư
│   ├── SupportContext.tsx        # Chat threads
│   ├── AppealContext.tsx         # Phiếu khiếu nại 4 trạng thái
│   ├── CommentContext.tsx        # Bình luận + báo cáo
│   ├── AdminContext.tsx          # User CRUD + audit log
│   └── NotificationContext.tsx   # Push notification
│
├── lib/                          # Hàm thuần (không import từ features/pages/components)
│   ├── format.ts                 # Định dạng ngày giờ, số
│   ├── score.ts                  # ⭐ TÍNH ĐIỂM 100% TỰ VIẾT (không AI)
│   ├── random.ts                 # Random seed
│   ├── storage.ts                # get/set JSON storage với safe parse
│   ├── sound.ts                  # Web Audio API (5 loại âm + toggle)
│   ├── validate.ts               # Validate form (login/register/recipe)
│   ├── file.ts                   # Xử lý file upload
│   ├── errors.ts                 # AppError class
│   └── slug.ts                   # Tạo slug SEO
│
├── data/                         # Mock data (seed)
│   ├── recipes.ts                # 15 món ăn Huế
│   ├── ingredients.ts            # 30+ nguyên liệu
│   ├── achievements.ts           # 12 thành tích
│   ├── players.ts                # 4 tài khoản demo
│   └── types.ts                  # Interfaces Recipe / Ingredient / Achievement
│
├── i18n/                         # Đa ngôn ngữ tự viết
│   ├── locales/
│   │   ├── vi.ts                 # 160+ keys tiếng Việt
│   │   └── en.ts                 # 160+ keys tiếng Anh
│   ├── types.ts                  # Interface I18nDictionary (type-safe)
│   ├── useTranslation.tsx        # Hook t('key', params) + LanguageProvider
│   └── index.ts                  # DEFAULT_LOCALE + resolveLocale
│
└── styles/
    ├── globals.css               # Reset + base
    ├── variables.css             # CSS variables (light + [data-theme=dark])
    └── animations.css            # @keyframes dùng chung
```

### Luồng import 1 chiều (AGENTS.md §3.1)

```
pages/  →  features/  →  components/  →  lib/
  ↓           ↓              ↓            ↓
  ❌          ❌             ❌         data/
```

**Quy tắc:** Không import ngược chiều mũi tên (tránh circular dependency).

---

## 🚀 Cài đặt & Chạy

### Yêu cầu
- **Node.js ≥ 18** (recommend v20 LTS)
- **npm** hoặc **pnpm** / **yarn**

### Các bước

```bash
# 1. Clone dự án
git clone https://github.com/baophubaith123-blip/hue-chef.git
cd hue-chef

# 2. Cài đặt dependencies
npm install

# 3. (Tùy chọn) Tạo file .env nếu muốn tuỳ chỉnh
echo "VITE_APP_NAME=Hue Chef" > .env

# 4. Chạy môi trường phát triển
npm run dev
# → Truy cập: http://localhost:5173

# 5. Build production
npm run build
# → Output: dist/ (CSS 92KB gzip 15KB, JS 847KB gzip 254KB)

# 6. Preview build local
npm run preview

# 7. Kiểm tra TypeScript strict
npx tsc --noEmit
```

### Scripts trong package.json
| Lệnh | Mục đích |
|---|---|
| `npm run dev` | Khởi động dev server Vite (HMR) |
| `npm run build` | `tsc -b && vite build` — Kiểm tra TS strict + build production |
| `npm run preview` | Xem trước kết quả build cục bộ |

---

## 👤 Tài khoản demo (Seed data)

Mở trang `/login` và dùng các tài khoản dưới đây:

| Vai trò | Email | Mật khẩu | Route mặc định |
|---|---|---|---|
| 🎮 **Player** | `player@hue.vn` | `player123` | `/` (Trang chủ nấu ăn) |
| 💬 **Support** | `support@hue.vn` | `support123` | `/support` (Support dashboard) |
| ✍️ **Editor** | `editor@hue.vn` | `editor123` | `/editor` (Editor workspace) |
| 🛡️ **Admin** | `admin@hue.vn` | `admin123` | `/admin` (Admin panel) |

> 💡 **Demo credentials cũng hiển thị ở dưới LoginPage để bạn tiện copy test.**

---

## 🍜 15 Món Ăn Huế Seed

| # | ID | Tên món | Category | Độ khó | Thời gian (s) | Base score |
|---|---|---|---|---|---|---|
| 1 | `bun-bo-hue` | Bún bò Huế | bun | ⭐⭐⭐⭐⭐ | 240 | 1000 |
| 2 | `com-hen` | Cơm hến | com | ⭐⭐⭐ | 180 | 600 |
| 3 | `banh-beo` | Bánh bèo | banh | ⭐⭐ | 120 | 400 |
| 4 | `banh-khoai` | Bánh khoái | banh | ⭐⭐⭐⭐ | 200 | 800 |
| 5 | `banh-loc` | Bánh lọc | banh | ⭐⭐⭐ | 150 | 600 |
| 6 | `banh-nam` | Bánh nậm | banh | ⭐⭐⭐ | 160 | 600 |
| 7 | `che-hat-sen` | Chè hạt sen | che | ⭐⭐ | 120 | 400 |
| 8 | `nem-lui` | Nem lụi | nem | ⭐⭐⭐⭐ | 220 | 800 |
| 9 | `bun-thit-nuong` | Bún thịt nướng | bun | ⭐⭐⭐ | 180 | 600 |
| 10 | `banh-canh` | Bánh canh Nam Phổ | bun | ⭐⭐⭐⭐ | 200 | 800 |
| 11 | `banh-xeo` | Bánh xèo Huế | banh | ⭐⭐⭐⭐ | 210 | 800 |
| 12 | `bun-mam` | Bún mắm nêm | bun | ⭐⭐⭐⭐⭐ | 240 | 1000 |
| 13 | `com-am-phu` | Cơm âm phủ | com | ⭐⭐⭐⭐ | 200 | 800 |
| 14 | `banh-bot-loc` | Bánh bột lọc | banh | ⭐⭐⭐ | 150 | 600 |
| 15 | `che-bap` | Chè bắp | che | ⭐⭐ | 120 | 400 |

> Mỗi món có 3-5 `ingredients` và 3-5 `steps` — xem chi tiết trong [data/recipes.ts](src/data/recipes.ts).

---

## 🏆 12 Thành tích

| ID | Tên | Mô tả | Điều kiện |
|---|---|---|---|
| `first-cook` | Đầu bếp tập sự | Nấu món đầu tiên | Cook count = 1 |
| `bun-master` | Bún bò chuyên gia | Nấu 5 món bún | Category bun + count ≥ 5 |
| `com-master` | Cơm hến thần thánh | Nấu 3 món cơm | Category com + count ≥ 3 |
| `banh-master` | Bánh Huế chính gốc | Nấu 5 món bánh | Category banh + count ≥ 5 |
| `che-master` | Chè ngọt ngào | Nấu 3 món chè | Category che + count ≥ 3 |
| `nem-master` | Nem lụi thần sầu | Nấu 3 món nem | Category nem + count ≥ 3 |
| `perfect-score` | Điểm tuyệt đối | Đạt 5 sao món bất kỳ | 5 sao rating |
| `no-mistake` | Không sai bước nào | Nấu 1 món không lỗi | Cook flawless ≥ 1 |
| `all-categories` | Đa tài | Nấu đủ cả 5 loại | bun, com, banh, che, nem |
| `high-score` | Cao thủ | Tổng 5000 điểm | Score ≥ 5000 |
| `level-5` | Đầu bếp cấp 5 | Đạt level 5 | Level ≥ 5 |
| `all-recipes` | Bậc thầy ẩm thực | Nấu hết 15 món | Cook count ≥ 15 |

Xem chi tiết điều kiện trong [AchievementContext.tsx](src/contexts/AchievementContext.tsx).

---

## 🛣️ Danh sách các tuyến (40 routes)

### Public routes
| Route | Trang | Quyền |
|---|---|---|
| `/login` | LoginPage | 🌐 All |
| `/register` | RegisterPage | 🌐 All |
| `/help` | HelpPage | 🌐 All |
| `/feedback` | FeedbackPage | 🌐 All |
| `/about` | AboutPage | 🌐 All |
| `*` | NotFoundPage 404 | 🌐 All |

### 🎮 Player (`/`, `/recipes/*`, `/cooking/*`, `/inbox/*`, `/achievements`, `/collection`)
### 💬 Support (`/support`, `/support/appeals`, `/support/appeals/:id`, `/support/chat` ← player+support)
### ✍️ Editor (`/editor`, `/editor/recipes`, `/editor/recipes/new`, `/editor/recipes/:id`, `/editor/recipes/:id/edit`)
### 🛡️ Admin (`/admin`, `/admin/review`, `/admin/review/:id`, `/admin/broadcast`, `/admin/users`, `/admin/users/:id`, `/admin/recipes`, `/admin/achievements`, `/admin/ingredients`, `/admin/comments`, `/admin/reports`, `/admin/appeals`, `/admin/settings`, `/admin/audit-log`, `/admin/backup`)

Danh sách đầy đủ tại [router.tsx](src/app/router.tsx).

---

## 🗺️ Roadmap & Tiến độ phát triển trên GitHub

Dự án hoàn thành qua 10 giai đoạn phát triển toàn diện (trên nhánh `main` và nhánh tính năng):

| Giai đoạn | Commit message | Mục tiêu hoàn thành |
|---|---|---|
| 🏷️ **Phase 1** | `feat(setup): phase 1 - auth, player core, seed data` | Auth + Player core + 15 recipes + 12 achievements seed |
| 🏷️ **Phase 2** | `feat(cooking): phase 2 - drag-drop cooking + scoring` | Drag-drop cooking, timer, score.ts tự viết 100% |
| 🏷️ **Phase 3** | `feat(editor-admin): phase 3 - creator workflow + approval` | Editor tạo công thức, Admin duyệt (draft→pending→approved/rejected) |
| 🏷️ **Phase 4** | `feat(support-mail): phase 4 - appeals, chat, broadcast, ban notices` | Support chat, khiếu nại, mail 6 loại, cảnh báo, khoá |
| 🏷️ **Phase 5** | `feat(admin): phase 5 - user management, audit log, achievements` | User CRUD + ban/unban, AuditLogTable, 11 Admin pages, AchievementContext + NotificationBell + 2 Player pages |
| 🏷️ **Phase 6** | `feat(i18n-polish): phase 6 - multi-language, dark mode, sound, common pages` | i18n vi/en (auto-detect), Dark mode CSS vars, Web Audio sound, 4 Common pages (Help/Feedback/About/404), Header+Footer responsive |
| 🏷️ **Phase 7** | `style(ui): comprehensive imperial hue design system overhaul` & `style(ui): align layout with 9-frame reference map` | **Nâng cấp UI/UX Cố Đô Cung Đình Huế toàn diện**: Sidebar màu tím mận, Topbar tinh giản, Hero Banner 2 cột chống đè chữ, Podium Leaderboard Top 3 vẽ bằng CSS, Trang cá nhân 2 cột, Màn hình nấu ăn 3 Panel bo tròn 16px, Minigame chọn phương pháp chế biến & Quiz 2 cột đáp án, Modal kết quả cúp vàng 🏆 |
| 🏷️ **Phase 8** | `fix(ui): resolve all issues from error.md and enhance UI` | **Hoàn thiện và xử lý triệt để toàn bộ 8 mục trong `error.md`**: Khắc phục tương phản màu chữ Dark Mode trên toàn bộ trang & minigame, nén ảnh đại diện 256x256 bằng Canvas chống tràn localStorage & fix avatar layout, bỏ badge "Đã dùng" chống phồng chip nguyên liệu, đồng bộ hóa thông báo & hộp thư `/inbox`, fix lỗi dịch bộ lọc & tìm kiếm công thức, thêm banner động steaming & orbiting culinary delicacies cho Trang Chủ và Trang Giới Thiệu, xử lý màu chữ autofill. |
| 🏷️ **Phase 9** | `feat(player/recipes/achievements)` — GD1→GD4 | **Redesign toàn bộ giao diện Player phong cách game + làm lại nội dung**: banner 3D nguyên liệu mắt lồi & linh vật Nồi Nồi, màn nấu sân khấu game, quiz gameshow, 40 tài khoản người chơi thật đăng nhập được, 15 công thức viết lại theo 5 cấp độ khó (Địa ngục = 20 đúng + 20 nhiễu, 182 câu hỏi quiz), 27 thành tích có độ hiếm; `score.ts` giữ nguyên 100% tự viết. |
| 🏷️ **Phase 10** | `feat(cooking/player/live)` | **Combo & hoàn thiện theo mẫu thiết kế mới**: combo thả đúng liên tiếp (cửa sổ 2 giây, +10→+50/lần, hiện riêng dòng "Thưởng combo" ở kết quả), bonus tốc độ quiz, HUD màn nấu, trang cá nhân/hộp thư/giới thiệu phong cách game, BXH có mũi tên trend + **cập nhật thời gian thực**, **bộ cuộn riêng** cho lưới công thức / danh sách BXH / cột bước nấu / khay nguyên liệu, sửa ảnh bún bò Huế bị gãy; khẳng định cơ chế **lưu trữ bền vững bằng localStorage** cho bộ sưu tập, thành tích và hộp thư. |
| 🏷️ **Phase 12** | `feat(cooking): score rescale` | **Chống lạm phát điểm — điểm gốc của món là TRẦN của cả ván** (theo yêu cầu của tác giả sau ván test 1.576 điểm ở món 400): tổng điểm ván = điểm gốc × tổng tỷ trọng các thành phần theo hiệu quả chơi — Đi chợ 15% · Bắt nguyên liệu 15% · Nấu (thả đúng/sai + combo gộp trong phần) 30% · Nêm chuẩn vị 10% · Hoàn thiện 15% · Hỏi đáp 10% · Thưởng nấu nhanh 5%; tỷ trọng tự chuẩn hoá lại nếu một màn bị tắt nên ván hoàn hảo luôn = đúng điểm gốc (400→1.000 theo ★). Sao tính theo % trần (≥95% = 5 sao, giữ ngưỡng của `lib/score.ts`, file này vẫn không đổi — phần chia tỷ trọng nằm ở `lib/score-rescale.ts`). Mọi con số trong game (HUD, nhãn bay, chip các màn, bảng phân rã ở modal kết quả) đều là điểm đã quy đổi và cộng lại khớp tổng; combo chuyển thành chỉ số hiển thị riêng. |
| 🏷️ **Phase 13** | `feat(economy/content/perks)` | **Kinh tế xu + kho 50 món + perk thành tích** (theo yêu cầu của tác giả): **(1) Tiền xu** — thắng ván nhận xu = điểm ÷ 10 (làm tròn xuống), hoàn thành lần đầu +50%; **luật thắng mới: điểm cuối ≥ 40% điểm gốc mới tính thắng** (dưới 40% = thua, 0 xu, không EXP, không tính đã nấu); món 1★ miễn phí (cố định 400 điểm), 2★→5★ phải **mua bằng xu** — giá tăng theo điểm của món trong cùng cấp sao (công thức ở `lib/pricing.ts`: dải điểm 900–1.200 / 1.300–1.650 / 1.800–2.200 / 2.500–3.000, hệ số giá ×1,3 / ×3 / ×4,4 / ×6); thẻ món khoá hiện 🔒 + giá, trang chi tiết có panel mua, vào nấu món chưa sở hữu bị chặn về trang chi tiết; thanh trên cùng + hồ sơ hiện số xu và số món đã sở hữu; 40 tài khoản được gieo sẵn xu + món theo thứ hạng; Editor có ô **Điểm công thức** (kẹp trong dải của cấp sao) + **Giá xu** (nút gợi ý tự tính). **(2) Kho món 15 → 50** (đúng cơ cấu 5/10/14/16/5 theo ★): +35 công thức thật, đủ nguyên liệu/bước/quiz theo chuẩn cấp sao (tổng 603 câu quiz), kho nguyên liệu 72 → 83. **(3) Perk thành tích** — 11 loại perk (xu/EXP +%, giờ chợ/nấu/quiz, xem lại rẻ hơn tới miễn phí, nồi hứng rộng, vùng nêm rộng, cửa sổ “Tuyệt vời” rộng, **khiên combo**, **cơ hội thứ hai** quiz...) với sức mạnh tăng theo độ hiếm Thường→Huyền thoại; gắn cho cả 27 thành tích cũ + **6 thành tích kinh tế mới** (sở hữu món, tích xu — tổng 33); người chơi **đeo đúng 1 thành tích** đã mở khoá, perk được chụp lúc bắt đầu ván và áp vào cả 5 màn, có chip ⚡ trên HUD, hộp perk ở modal chi tiết và dòng “Perk đang đeo” ở hồ sơ; form Admin thêm trường loại perk + giá trị và 3 loại điều kiện mới. `lib/score.ts` vẫn không đổi. |
| 🏷️ **Phase 14** | `fix(admin/support/editor) + feat(comments)` | **Hoàn thiện 3 khu vực Admin / Support / Editor sau kiểm toán toàn diện (50 đầu mục: Admin 22 · Support 17 · Editor 11) + test E2E thật 4 vai trò**: **Ban có hạn dùng thật** — admin đặt lý do + hạn khóa, thư báo khóa gửi tới người chơi, tài khoản bị khóa vẫn đăng nhập được nhưng bị giới hạn ở trang Trò chuyện hỗ trợ để **tự gửi khiếu nại** (trước đây khóa là vĩnh viễn ngầm, không thư báo, và trang kháng cáo bị chính cơ chế chặn vai trò khóa chết → vòng lặp chuyển hướng vô hạn); phiên đăng nhập tự đồng bộ khi bị khóa/mở khóa/đổi vai trò và tự đăng xuất khi treo máy theo cài đặt. **Support**: sửa vòng lặp render vô hạn ở chat (ghi localStorage liên tục), đóng được hội thoại, badge chưa đọc tính đúng tin nhắn chat, dữ liệu mẫu (hội thoại + khiếu nại + tài khoản bị khóa mẫu duc@hue.vn) để khu vực hỗ trợ không còn trống, nút Đề xuất gửi đúng 1 lần và thư quyết định dùng trạng thái sau xử lý. **Admin**: thành tích admin tạo/sửa/xóa **chảy sang phía người chơi** (trước đây ghi chung key với kho mở khóa của người chơi nên vừa không hiển thị vừa phá dữ liệu — nay tách 2 key riêng + danh sách đã xóa), **trang Cài đặt có hiệu lực thật** (chế độ bảo trì chặn người chơi trừ admin, giới hạn cảnh cáo tự khóa, dung lượng avatar tối đa, điểm tối đa của công thức, thời gian treo máy), nhật ký kiểm toán ghi đủ duyệt/từ chối công thức, xóa bình luận, xử lý báo cáo, gửi thông báo chung; sao lưu xuất/nhập thêm thành tích + cài đặt, nhập sai định dạng báo lỗi rõ ràng thay vì báo thành công giả; bổ sung 2 mục Bình luận/Báo cáo vào menu. **Editor**: nút Chạy thử 5 màn hết bị văng về trang chủ (route nấu ăn mở cho editor/admin ở chế độ xem trước), **minigame Gõ phím (typing-speed) chơi được thật** (trước đây chọn được nhưng vào ván là kẹt cứng), cổng gửi duyệt chặn công thức thiếu nội dung ở cả tầng dữ liệu, đáp án đúng không còn bị lệch khi xóa lựa chọn, số liệu gameplay bị kẹp trong giới hạn an toàn, kho nguyên liệu tự bổ sung loại mới. **Bình luận người chơi**: trang chi tiết món có mục bình luận kèm chấm sao + báo cáo (trước đây chỉ có phía Admin nên 2 trang Bình luận/Báo cáo không bao giờ có dữ liệu). **Sửa lỗi nghiêm trọng ở màn nấu**: khay nguyên liệu khóa cứng nguyên liệu đã dùng ở bước trước khiến **36/51 món không thể hoàn thành** khi một nguyên liệu được dùng lại ở bước sau — nay khay tính theo nồi của bước hiện tại, khớp thiết kế reset nồi của CookingContext. Quét tĩnh toàn bộ khóa i18n: 720 khóa đang dùng, **0 khóa thiếu**. `lib/score.ts` vẫn không đổi. |
| 🏷️ **Phase 15** | `feat(recipes/editor/taxonomy) + feat(editor-achievements)` | **Tìm kiếm & phân loại đúng thật + Editor tự chủ dữ liệu**: **Thanh tìm kiếm Player làm lại** — bỏ dãy nút phân loại trải ngang, thay bằng 2 nút lọc **bấm-mở-chọn** (🏷️ Phân loại · ⭐ Độ khó, có nút Xoá lọc), lưới món mặc định xếp **từ dễ đến Địa ngục** (1★→5★). **Phân loại lại toàn bộ 50 món cho đúng bản chất**: 17 món từng mang nhãn Cơm nhưng chỉ 4 món thật sự là cơm/xôi → tạo 3 phân loại mới **Gỏi · Trộn · Cuốn** (5 món: vả trộn, mít trộn, gỏi cuốn, bánh tráng cuốn thịt heo, bánh ướt cuốn thịt), **Canh · Lẩu** (3), **Món mặn** (8) và đổi nhãn Cơm → **Cơm · Xôi**; tổng 16 món đổi loại, có migration áp dụng cho cả dữ liệu đã lưu trong trình duyệt. **Sổ đăng ký taxonomy** (key `hue-chef-taxonomy`): Editor **tự thêm được phân loại công thức, phân loại nguyên liệu, đơn vị và động từ thao tác của bước** — preset cũ giữ nguyên, loại tự thêm có quản lý/xoá (chặn xoá khi đang dùng); 3 phân loại mới + nhóm nguyên liệu **Đậu · Hạt** được ghi nhận do tài khoản Editor tạo. **Sửa lỗi dữ liệu Editor**: 50 công thức mẫu trước đây không có chủ sở hữu nên dashboard Editor toàn số 0 — nay gán cho `editor@hue.vn` (+ backfill dữ liệu cũ), dashboard hiện đúng 50 món đã duyệt + 33 thành tích. **Form công thức viết lại cho dễ hiểu**: mục Các bước có chú thích từng ô (tên bước / hướng dẫn / thời gian / chữ trên nút thao tác / nguyên liệu của bước), nút 'Remove' tiếng Anh → 'Xóa', thêm nút **👁 Xem trước công thức** kèm checklist 7 mục + chạy thử ván trước khi gửi duyệt; danh sách Công thức của tôi có nút **Xem lại** mở trang chi tiết chỉ-đọc. **Thành tích cho Editor**: trang `/editor/achievements` tạo thành tích kèm perk → trạng thái Chờ duyệt → **Admin duyệt** ở trang Thành tích thì mới chảy sang người chơi (key `hue-chef-editor-achievements`, có ghi nhật ký kiểm toán achievement.approve/reject, sao lưu xuất/nhập thêm taxonomy + thành tích editor). **Danh sách nguyên liệu**: cuộn riêng với header dính, nhãn phân loại hiển thị tiếng Việt (trước đây in thô 'protein'), **bổ sung đơn vị cho đủ 83 nguyên liệu**, bỏ cột Mô tả. Quét i18n: 785 khóa đang dùng, **0 khóa thiếu**; `lib/score.ts` vẫn không đổi. Kiểm chứng E2E thật (Playwright + Edge): 48/48 đạt — gồm cả kiểm tra migration trên dữ liệu cũ từ Phase 14. |
| 🎪 **Phase 16** | `feat(theme/player/cooking) + feat(assets)` | **Reskin toàn bộ giao diện Player theo theme 'Lễ hội ẩm thực' (mẫu D)**: nền mận ấm, khung/biển gỗ treo, đèn lồng + cờ hội, viền dày nét game 2D — áp dụng cho Landing, shell Player (sidebar biển gỗ, topbar viền cờ hội, pill xu), Trang chủ, Công thức, Chi tiết món, Bảng xếp hạng (**podium thùng gỗ vàng/bạc/đồng + biển tên gỗ**, danh sách hạng thẻ giấy cuộn riêng), Thành tích, Bộ sưu tập, Hộp thư, Trang cá nhân, Giới thiệu/Trợ giúp/Góp ý và toàn bộ màn chơi. **Ảnh món giữ nguyên ảnh THẬT**, chỉ đóng khung gỗ viền vàng (món mới của Editor chỉ cần ảnh thật). **Màn Đi chợ chia SẠP**: 8 sạp/trang, biển 'Sạp x/y' + mũi tên gỗ + chấm trang (chè hạt sen 10 ô = 2 sạp; bún bò Huế 40 ô = 5 sạp) — chọn giữ nguyên khi lật sạp, xáo trộn khi Xem lại phân phối lại qua mọi sạp. **Màn Nấu chia KHAY**: tối đa 3 khay (bún bò 40 chip ≈ 14/khay), biển 'Khay x/3' tách riêng khỏi dialog Nêm, chip đã thả giữ trạng thái khóa ở mọi khay. **Mascot Nồi Nồi vẽ lại 2D** theo nét lễ hội (`public/images/noi-noi-2d.webp`). **Hai bản sáng/tối**: sáng = 'lễ hội ban ngày' (kem/gỗ sáng), tối = 'chợ đêm' (mận sâu, podium phát sáng). Chỉ đổi lớp vỏ + cách trình bày: **logic chơi, dữ liệu, điểm số giữ nguyên 100%**, `lib/score.ts` không đổi; Admin/Editor/Support giữ nguyên. Kiểm chứng E2E thật (Playwright + Edge): tour toàn bộ trang Player cả sáng lẫn tối; ván chè hạt sen thắng **358/400**; ván nem lụi 3★ chạy thử trọn 5 màn **1.131 điểm** với lật sạp + lật khay; bún bò 5★ lật Sạp 1/5 → 2/5 và Khay 2/3 → 3/3 thả đúng nguyên liệu xuyên khay. |
| 🏷️ **Phase 11** | `feat(cooking): 5-stage run` | **Ván chơi 5 màn theo kịch bản của tác giả**: ① Đi chợ ghi nhớ (30–60s theo ★, nút Lên Xe; từ 3★ danh sách tự che sau giờ xem, xem lại −5s, mỗi lần che sạp tự đảo vị trí) → ② Bắt nguyên liệu rơi toàn màn hình (nút Bắt đầu + đếm ngược 3s, combo 2 giây dùng lại `combo.ts`) → ③ Kéo thả + **thanh Nêm chuẩn vị** mở khi bấm nút sơ chế của bước (tối đa +50% điểm bước; bước nhiều nguyên liệu → kim nhanh hơn, vùng vàng hẹp hơn; nêm lệch xa phải nêm lại) → ④ **Nấu hoàn thiện**: chỉ còn Nồi Nồi ở giữa, chạm vòng tròn đúng nhịp (Tuyệt vời +50 & là mức duy nhất tính combo, Tốt theo độ gần viền, Trượt −20; 10–20s theo ★, 5★ hai vòng cùng lúc) → ⑤ Hỏi đáp như cũ. Luật + điểm của mỗi màn nằm trong **popup của nút "?"** (mẫu hộp chi tiết thành tích, mở popup thì màn chơi tạm dừng). Điểm các màn cộng qua kênh bonus — `lib/score.ts` không đổi; modal kết quả có bảng điểm từng màn. Editor thêm **thẻ "Cấu hình màn chơi"** (5 công tắc + chỉnh giờ chợ/tốc độ rơi/giờ hoàn thiện), ô **động từ sơ chế** + chọn nguyên liệu cho từng bước, nút **Chạy thử 5 màn** (chế độ xem trước không tính điểm), kiểm tra hợp lệ khi gửi duyệt (≥1 bước có nguyên liệu + ≥1 quiz) và nhãn "Đủ 5 màn ✓" ở hàng chờ duyệt của Admin. |

Xem lịch sử commit đầy đủ: [github.com/baophubaith123-blip/hue-chef/commits/main](https://github.com/baophubaith123-blip/hue-chef/commits/main)

---

## 🧪 Test lỗi quan trọng (AGENTS.md §4.2)

| # | Scenario | Cách test | Kết quả mong đợi |
|---|---|---|---|
| 1 | Đăng nhập sai mật khẩu | Login với `player@hue.vn` + `sai` | Hiện Toast/i18n "Sai mật khẩu" |
| 2 | Email không tồn tại | Login với `none@none.com` | Hiện lỗi "Email không tồn tại" |
| 3 | Bỏ trống form | Submit Register/Login rỗng | Field error từng ô theo AGENTS.md |
| 4 | Truy cập route không có quyền | Player thủ công mở `/admin` | Redirect về 403 hoặc NotFoundPage |
| 5 | localStorage hỏng | `localStorage.setItem('hue-chef-auth', 'invalid')` → reload | App không crash, tự reset về empty state |
| 6 | Admin xoá chính mình | `/admin/users` → xoá tài khoản Admin đang đăng nhập | Bị chặn + Toast lỗi "Không thể xoá chính mình" |
| 7 | Admin xoá Admin cuối cùng | Leave 1 admin, xoá nó | Bị chặn + Toast "Không thể xoá Admin cuối cùng" |
| 8 | Đổi ngôn ngữ không mất state | Đang on CookingPage → đổi VI → EN | Tiến độ nấu không bị reset |
| 9 | Reload vẫn giữ ngôn ngữ | Đổi EN → F5 → vẫn EN | Storage lưu `hue-chef-locale` |
| 10 | Dark mode reload | Toggle 🌙 → reload → vẫn dark | Storage lưu `hue-chef-theme` |
| 11 | Truy cập route không tồn tại | Mở `/abc-def-xyz` | NotFoundPage 404 gradient đẹp |
| 12 | Tương phản chữ Dark Mode | Bật Dark mode trên Home, Profile, Cooking, Minigames | Chữ hiển thị rõ nét màu kem/vàng kim, không bị chìm màu đen |
| 13 | Nén và lưu avatar | Upload ảnh chân dung dung lượng lớn tại Profile | Tự động resize 256x256, lưu thành công không tràn bộ nhớ, không làm méo banner |
| 14 | Thả nguyên liệu vào nồi | Kéo thả nguyên liệu vào nồi nấu | Thẻ nguyên liệu mờ đi tinh tế, giữ nguyên kích thước không bị phồng |
| 15 | Đồng bộ Hộp thư & Chuông | Nhận thông báo mở khóa thành tích → mở `/inbox` | Danh sách 3 thông báo hiển thị đầy đủ trên `/inbox`, bấm "Đã đọc tất cả" cập nhật tức thì |
| 16 | Bộ lọc công thức song ngữ | Chuyển đổi giữa Tiếng Việt và English | Tab "Tất cả" / "All" và placeholder tìm kiếm thay đổi đúng theo ngôn ngữ |

---

## 🤖 Khai báo AI

Theo **Qui ước Studio (AGENTS.md §11)**, dự án này **có sử dụng AI** (Trae AI / Studio) để trợ giúp phát triển:

### ✅ Có dùng AI cho:
- Generate component structure + CSS Modules boilerplate
- Đề xuất CSS animations, transitions, responsive breakpoints
- Debug lỗi TypeScript strict (import paths, type mismatch, unused variable)
- Tạo bản dịch i18n 160+ keys giữa tiếng Việt ↔ Anh
- Tạo template Help/Feedback/About/NotFound pages + form validation logic
- Refactor và split Contexts / Pages theo feature-based structure
- Viết regex patterns & validate helpers

### ❌ Không dùng AI cho:
- Logic **tính điểm trong `lib/score.ts`** (tự viết 100%, người viết giải thích được công thức weighted score cho từng bước nấu, penalty sai lệnh, bonus thời gian)
- Thiết kế database schema trong `data/types.ts` và cấu trúc 17 localStorage keys
- **Quyết định kiến trúc 12 Contexts**, 15 features, 40 routes, 4 roles phân quyền
- Quy tắc AGENTS.md, luật import 1 chiều, quy ước commit convention, qui trình 6 phase N-1 tag
- Câu hỏi vấn đáp cuối kỳ về flow auth, cooking state machine, audit log append-only

> ⚖️ **Nguyên tắc vàng:** "AI là công cụ. Sinh viên là người chịu trách nhiệm."
> Toàn bộ code AI generate đã được đọc + review + test build (`npm run build`) trước khi commit.

---

## 📌 Qui ước code (tóm tắt AGENTS.md)

| Qui tắc | Quy định |
|---|---|
| TypeScript | Không `any`, dùng `unknown`, interface cho object, type cho union/alias |
| Export | Component → named export; Page → default export (React Router) |
| Naming | PascalCase (component/page/context/hook), camelCase (hàm/biến), kebab-case (file .ts/css) |
| State | Không mutate trực tiếp → immutable update `map`, `filter`, spread |
| i18n | **Không hardcode tiếng Việt** trong JSX → luôn dùng `t('key')` |
| CSS | CSS Modules cho component scoped; `variables.css` cho màu sắc global |
| Import path | Dùng `@/` alias, **cấm `../../../`** (đã config tsconfig + vite) |
| Console log | Chỉ log trong `import.meta.env.DEV`, xoá trướ̛c khi commit |
| Error | Throw `AppError` có `code`, không `console.error()`, hiện Toast cho user |
| Commit format | `<type>(<scope>): <mô tả>` — `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf` |

---

## 📞 Liên hệ

| Thông tin | Chi tiết |
|---|---|
| Họ tên | Nguyễn Gia Bảo |
| MSSV | 2401ITA006 |
| Mã học phần | INT.7.18 — Web FrontEnd nâng cao |
| Repository | [github.com/baophubaith123-blip/hue-chef](https://github.com/baophubaith123-blip/hue-chef) |
| License | MIT (nếu cần) — Dùng cho mục đích học tập |

---

<div align="center">
<strong>🍜 Cảm ơn giảng viên và bạn bè đã đồng hành! — Made with ❤️ in Da Nang</strong>
</div>
