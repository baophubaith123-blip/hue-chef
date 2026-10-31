# 🍜 Hue Chef — Game Nấu Ẩm Thực Huế

> **Đồ án cuối kỳ — INT.7.18 Web FrontEnd Nâng Cao**
>
> **Tác giả:** Nguyễn Gia Bảo — MSSV: 2401ITA006

---

## 📖 Giới thiệu

**Hue Chef** là game mô phỏng nấu các món ăn đặc trưng xứ Huế qua cơ chế kéo-thả (drag-and-drop) nguyên liệu. Người chơi sẽ làm quen với 15 món ăn kinh điển, mở khoá 12 huy chương thành tích, xây dựng bộ sưu tập công thức và nhận điểm thưởng theo từng màn nấu. Hệ thống hỗ trợ **4 vai trò** phân quyền rõ ràng (Player / Support / Editor / Admin) với **40 tuyến** truy cập.

---

## ✨ Tính năng nổi bật

| Nhóm | Tính năng |
|---|---|
| 🎮 **Gameplay** | Drag & drop nấu ăn, tính điểm theo độ chính xác, 1~5 sao, tính năng đếm ngược thời gian |
| ⚡ **Minigames** | Thử thách thao tác chế biến (Xào/Luộc/Hấp/Nướng) + Quiz câu hỏi văn hóa ẩm thực Huế tích hợp ngay trong màn nấu |
| 👑 **Bảng xếp hạng** | Bục vinh danh Podium Top 3 (Vàng 👑, Bạc 🥈, Đồng 🥉) vẽ hoàn toàn bằng CSS + Danh sách Top 4+ |
| 🏛️ **Imperial UI/UX** | Ngôn ngữ thiết kế Cố Đô Cung Đình Huế: Tím mận hoàng gia (#4A1525), Đỏ gạch (#C8553D), Vàng kim (#E9A23B), Nền kem ấm (#FAF5EF) |
| 🏆 **Thành tích** | 12 huy chương theo điều kiện (loại món, số lần nấu, điểm tuyệt đối, level, nấu đủ 15 món…) |
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

Dự án hoàn thành qua 7 giai đoạn phát triển toàn diện (trên nhánh `main` và nhánh tính năng):

| Giai đoạn | Commit message | Mục tiêu hoàn thành |
|---|---|---|
| 🏷️ **Phase 1** | `feat(setup): phase 1 - auth, player core, seed data` | Auth + Player core + 15 recipes + 12 achievements seed |
| 🏷️ **Phase 2** | `feat(cooking): phase 2 - drag-drop cooking + scoring` | Drag-drop cooking, timer, score.ts tự viết 100% |
| 🏷️ **Phase 3** | `feat(editor-admin): phase 3 - creator workflow + approval` | Editor tạo công thức, Admin duyệt (draft→pending→approved/rejected) |
| 🏷️ **Phase 4** | `feat(support-mail): phase 4 - appeals, chat, broadcast, ban notices` | Support chat, khiếu nại, mail 6 loại, cảnh báo, khoá |
| 🏷️ **Phase 5** | `feat(admin): phase 5 - user management, audit log, achievements` | User CRUD + ban/unban, AuditLogTable, 11 Admin pages, AchievementContext + NotificationBell + 2 Player pages |
| 🏷️ **Phase 6** | `feat(i18n-polish): phase 6 - multi-language, dark mode, sound, common pages` | i18n vi/en (auto-detect), Dark mode CSS vars, Web Audio sound, 4 Common pages (Help/Feedback/About/404), Header+Footer responsive |
| 🏷️ **Phase 7** | `style(ui): comprehensive imperial hue design system overhaul` & `style(ui): align layout with 9-frame reference map` | **Nâng cấp UI/UX Cố Đô Cung Đình Huế toàn diện**: Sidebar màu tím mận, Topbar tinh giản, Hero Banner 2 cột chống đè chữ, Podium Leaderboard Top 3 vẽ bằng CSS, Trang cá nhân 2 cột, Màn hình nấu ăn 3 Panel bo tròn 16px, Minigame chọn phương pháp chế biến & Quiz 2 cột đáp án, Modal kết quả cúp vàng 🏆 |

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
