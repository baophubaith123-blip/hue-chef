# AGENTS.md — Hue Chef

> **File này quy định luật làm việc giữa bạn (sinh viên) và trợ lý AI.**
> Mọi prompt gửi cho AI phải tuân thủ các quy tắc trong file này.
> AI phải đọc file này trước khi generate bất kỳ code nào.

---

## 📌 1. TỔNG QUAN DỰ ÁN

| Mục | Nội dung |
|---|---|
| **Tên dự án** | Hue Chef — Game nấu món ăn Huế |
| **Mã học phần** | INT.7.18 — Web FrontEnd nâng cao |
| **Hình thức** | Đồ án cá nhân |
| **Tác giả** | Nguyễn Gia Bảo |
| **MSSV** | 2401ITA006 |
| **Timeline** | 33 ngày |
| **Số vai trò** | 4 (Player / Support / Editor / Admin) |

---

## 📌 2. STACK

### 2.1. Công nghệ chính

- **React 18** — Framework chính
- **TypeScript 5.x** — Ngôn ngữ (strict mode)
- **Vite 5+** — Build tool
- **React Router v6** — Routing (40 tuyến)
- **CSS thuần + CSS Modules** — Styling
- **Context API + useReducer** — Global state (12 Contexts)
- **localStorage** — Storage (17 keys)
- **Tự viết i18n** — Đa ngôn ngữ vi + en

### 2.2. Thư viện ngoài được phép dùng

| Thư viện | Mục đích | Bắt buộc |
|---|---|---|
| `react-router-dom` | Routing | ✅ |
| `recharts` | Biểu đồ Admin | ✅ |

### 2.3. Thư viện KHÔNG được dùng

- ❌ **Redux / Redux Toolkit** — Dùng Context API thay thế.
- ❌ **Zustand** — Dùng Context API thay thế.
- ❌ **Tailwind CSS** — Dùng CSS thuần.
- ❌ **shadcn/ui** — Tự viết component.
- ❌ **Framer Motion** — Dùng CSS keyframes.
- ❌ **react-i18next** — Tự viết i18n Context.
- ❌ **Ant Design / Material UI** — Tự viết component.
- ❌ **Bất kỳ thư viện nặng** nào không cần thiết.

> ⚠️ **Trước khi thêm thư viện mới, phải hỏi.** Không tự ý thêm vào `package.json`.

---

## 📌 3. CẤU TRÚC THƯ MỤC

```
src/
├── app/                          # Tầng "vỏ"
│   ├── App.tsx                   # Root component
│   ├── providers.tsx             # Bọc 12 Context
│   └── router.tsx                # 40 tuyến
│
├── pages/                        # 37 trang
│   ├── auth/                     # Login, Register, ForgotPassword
│   ├── player/                   # 13 trang Player
│   ├── editor/                   # 5 trang Editor
│   ├── support/                  # 4 trang Support
│   ├── admin/                    # 12 trang Admin
│   └── common/                   # Help, Feedback, About, 404
│
├── features/                     # 15 features
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store.ts
│   │   └── types.ts
│   ├── recipes/
│   ├── cooking/
│   ├── achievements/
│   ├── collection/
│   ├── comments/
│   ├── reports/
│   ├── appeals/
│   ├── notifications/
│   ├── mail/
│   ├── profile/
│   ├── settings/
│   ├── editor/
│   ├── support/
│   └── admin/
│
├── components/                   # Dùng chung
│   ├── ProtectedRoute.tsx
│   ├── Button.tsx
│   ├── Modal.tsx
│   ├── Card.tsx
│   ├── Toast.tsx
│   ├── Loading.tsx
│   ├── EmptyState.tsx
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── LanguageSwitcher.tsx
│   ├── NotificationBell.tsx
│   ├── FileUpload.tsx
│   └── DynamicFormList.tsx
│
├── lib/                          # Hàm thuần
│   ├── format.ts
│   ├── score.ts                  # ⭐ TỰ VIẾT 100%
│   ├── random.ts
│   ├── storage.ts
│   ├── sound.ts
│   ├── validate.ts
│   ├── file.ts
│   └── slug.ts
│
├── data/                         # Mock data
│   ├── recipes.ts                # 15 món
│   ├── ingredients.ts            # 30+ nguyên liệu
│   ├── achievements.ts           # 12 badges
│   └── players.ts
│
├── contexts/                     # 12 Contexts
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   ├── LanguageContext.tsx
│   ├── RecipeContext.tsx
│   ├── CookingContext.tsx
│   ├── AchievementContext.tsx
│   ├── MailContext.tsx
│   ├── SupportContext.tsx
│   ├── AppealContext.tsx
│   ├── CommentContext.tsx
│   ├── AdminContext.tsx
│   └── NotificationContext.tsx
│
├── i18n/                         # Đa ngôn ngữ
│   ├── locales/
│   │   ├── vi.ts
│   │   └── en.ts
│   ├── types.ts
│   ├── useTranslation.ts
│   └── index.ts
│
└── styles/
    ├── globals.css
    ├── variables.css
    └── animations.css
```

### 3.1. Import 1 chiều (BẮT BUỘC)

```
pages/  →  features/  →  components/  →  lib/
  ↓           ↓              ↓            ↓
  ❌          ❌             ❌         data/
```

| Từ | Được import | KHÔNG được import |
|---|---|---|
| `pages/` | `features/`, `components/`, `lib/`, `i18n/` | — |
| `features/` | `components/`, `lib/`, `data/`, `i18n/` | `pages/` |
| `components/` | `lib/`, `i18n/` | `features/`, `pages/` |
| `lib/` | — | `features/`, `components/`, `pages/` |

> ⚠️ **Vi phạm import 1 chiều = vi phạm kiến trúc = trừ điểm.**

---

## 📌 4. QUI ƯỚC CODE

### 4.1. TypeScript

- ✅ **Luôn có type rõ ràng** cho props, state, function params.
- ❌ **Không dùng `any`** — dùng `unknown` nếu chưa biết type.
- ✅ **Dùng `interface`** cho object shape.
- ✅ **Dùng `type`** cho union, primitive, alias.
- ✅ **Export type** rõ ràng nếu dùng ở nơi khác.

**Ví dụ ĐÚNG:**
```tsx
interface Recipe {
  id: string;
  name: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
}

function cookRecipe(recipe: Recipe): void {
  // ...
}
```

**Ví dụ SAI:**
```tsx
function cookRecipe(recipe: any) {   // ❌ any
  // ...
}
```

### 4.2. Component

- ✅ **Named export** cho component (khuyến nghị).
- ✅ **Default export** cho page (do React Router yêu cầu).
- ✅ **PascalCase** cho tên component: `RecipeCard`, `CookingPot`.
- ✅ **camelCase** cho hàm và biến: `handleClick`, `currentStep`.
- ✅ **kebab-case** cho CSS class: `.recipe-card`, `.cooking-pot`.

**Ví dụ ĐÚNG:**
```tsx
// components/RecipeCard.tsx
export function RecipeCard({ recipe }: RecipeCardProps) { /* ... */ }

// pages/HomePage.tsx
export default function HomePage() { /* ... */ }
```

### 4.3. Xử lý lỗi

- ❌ **KHÔNG dùng `console.error()`** trong production.
- ✅ **Throw Error có type** hoặc custom error class.
- ✅ **Try/catch** cho async operations.
- ✅ **Hiện Toast/Modal** cho user khi có lỗi.

**Ví dụ ĐÚNG:**
```tsx
class AppError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AppError';
  }
}

function fetchUser(id: string): User {
  if (!id) {
    throw new AppError('ID không hợp lệ', 'INVALID_ID');
  }
  // ...
}
```

**Ví dụ SAI:**
```tsx
function fetchUser(id: string) {
  if (!id) {
    console.error('ID không hợp lệ');   // ❌
    return null;
  }
}
```

### 4.4. Logging

- ❌ **KHÔNG `console.log()`** trong code commit.
- ✅ **Chỉ log trong `import.meta.env.DEV`** khi cần debug.
- ✅ **Xoá log trước khi commit.**

**Ví dụ ĐÚNG:**
```tsx
if (import.meta.env.DEV) {
  console.log('Debug:', data);
}
```

### 4.5. Comment

- ✅ **Comment khi logic phức tạp.**
- ✅ **Dùng `// TODO: ...`** cho việc chưa làm xong.
- ✅ **Dùng `// FIXME: ...`** cho chỗ có bug tạm.
- ❌ **Không comment thừa** cho code đã rõ ràng.

### 4.6. State Management

- ✅ **Context API + useReducer** cho global state.
- ✅ **useState** cho local state.
- ❌ **KHÔNG lưu derived state** (state có thể tính từ state khác).
- ❌ **KHÔNG mutate state** trực tiếp — luôn dùng immutable update.

**Ví dụ ĐÚNG:**
```tsx
setRecipes((prev) => prev.map((r) => r.id === id ? { ...r, name: 'new' } : r));
```

**Ví dụ SAI:**
```tsx
recipes.find((r) => r.id === id).name = 'new';   // ❌ mutate
```

### 4.7. i18n

- ✅ **Mọi text hiển thị** phải dùng `t('key')`.
- ❌ **KHÔNG hardcode tiếng Việt** trong JSX.
- ✅ **Thêm key mới** vào cả `vi.ts` và `en.ts`.
- ❌ **KHÔNG dùng text động làm key** — dùng key cố định.

**Ví dụ ĐÚNG:**
```tsx
<h1>{t('home.welcome')}</h1>
```

**Ví dụ SAI:**
```tsx
<h1>Chào mừng</h1>   {/* ❌ hardcode */}
```

### 4.8. CSS

- ✅ **CSS Modules** cho component-scoped styles.
- ✅ **`globals.css`** cho global styles.
- ✅ **`variables.css`** cho CSS variables.
- ❌ **KHÔNG dùng inline style** trừ trường hợp đặc biệt.
- ❌ **KHÔNG dùng `!important`** trừ khi bất khả kháng.

### 4.9. File naming

| Loại | Convention | Ví dụ |
|---|---|---|
| Component | PascalCase + `.tsx` | `RecipeCard.tsx` |
| Page | PascalCase + `Page.tsx` | `HomePage.tsx` |
| Hook | camelCase + `use` prefix | `useRecipes.ts` |
| Context | PascalCase + `Context.tsx` | `AuthContext.tsx` |
| Utility | kebab-case + `.ts` | `string-utils.ts` |
| Type | `types.ts` | `types.ts` |
| CSS Module | PascalCase + `.module.css` | `RecipeCard.module.css` |
| CSS thường | kebab-case + `.css` | `globals.css` |

---

## 📌 5. QUI ƯỚC COMMIT

### 5.1. Format

```
<type>(<scope>): <mô tả ngắn gọn>
```

### 5.2. Các type được dùng

| Type | Ý nghĩa | Ví dụ |
|---|---|---|
| **feat** | Tính năng mới | `feat(cooking): add drag-drop ingredients` |
| **fix** | Sửa bug | `fix(timer): correct countdown logic` |
| **docs** | Tài liệu | `docs(readme): add setup guide` |
| **style** | Format code | `style: format with prettier` |
| **refactor** | Refactor | `refactor(auth): extract login hook` |
| **test** | Test | `test(cooking): add unit tests` |
| **chore** | Việc lặt vặt | `chore: update dependencies` |
| **perf** | Cải thiện performance | `perf(recipes): memoize filter` |

### 5.3. Scope

Tên feature/module bị ảnh hưởng:
- `auth`, `recipes`, `cooking`, `achievements`, `collection`
- `comments`, `reports`, `appeals`, `notifications`, `mail`
- `profile`, `settings`, `editor`, `support`, `admin`
- `i18n`, `theme`, `router`

### 5.4. Ví dụ ĐÚNG

```
feat(cooking): add drag-drop ingredients
fix(timer): correct countdown logic
docs(readme): add setup instructions
refactor(admin): extract user management table
```

### 5.5. Ví dụ SAI

```
final               ❌
fix stuff           ❌
abc                 ❌
xong bai            ❌
update              ❌
```

---

## 📌 6. QUI ƯỚC PROMPT CHO AI

### 6.1. Prompt tốt — 5 phần

Mỗi prompt gửi AI **PHẢI có đủ 5 phần**:

| # | Phần | Nội dung |
|---|---|---|
| 1 | **Bối cảnh** | Dự án, đề tài, đọc AGENTS.md |
| 2 | **Nhiệm vụ** | Một việc cụ thể, đúng phạm vi |
| 3 | **Ràng buộc** | Không any, không thêm thư viện |
| 4 | **Tiêu chí xong** | `npm run build` không lỗi |
| 5 | **Đầu ra** | Nêu kế hoạch trước, liệt kê tệp sau |

### 6.2. Ví dụ prompt YẾU ❌

> "Làm giúp tôi web đặt vé Đại Nội."

→ AI tự chọn thư viện, cấu trúc, cách đặt state → khó kiểm soát.

### 6.3. Ví dụ prompt TỐT ✅

```
BỐI CẢNH:
Dự án Hue Chef — game nấu món ăn Huế. Đọc AGENTS.md trước.

NHIỆM VỤ:
Tạo component RecipeCard hiển thị 1 món ăn.

RÀNG BUỘC:
- Không dùng any.
- Không thêm thư viện ngoài.
- CSS Modules.

TIÊU CHÍ XONG:
- npm run build không lỗi.
- TypeScript strict không warning.

ĐẦU RA:
- Nêu kế hoạch trước.
- Liệt kê tệp cần tạo sau.
```

### 6.4. Ba luật của Studio

1. **Không commit mã chưa đọc** — Đọc xong, review xong mới commit.
2. **Mỗi PR có 1 thay đổi tự viết tay** — Và người viết giải thích được.
3. **Ai viết prompt, người đó giải thích** — Nhóm bốc thăm để hỏi.

### 6.5. Vòng 6 bước Vibe Coding

```
1. Spec    → Viết rõ cần gì, xong là gì
2. Prompt  → Viết theo 5 phần
3. Generate → Bắt AI nêu kế hoạch trước
4. Review  → Đọc theo checklist 8 điểm  ⚠️ KHÔNG BỎ
5. Test    → build + thử tay            ⚠️ KHÔNG BỎ
6. Commit  → Commit nhỏ, khai báo AI
```

---

## 📌 7. QUI ƯỚC VỀ FILE

### 7.1. Đuôi file

| Loại | Đuôi | Ví dụ |
|---|---|---|
| React component (TSX) | `.tsx` | `RecipeCard.tsx` |
| TypeScript thuần | `.ts` | `format.ts` |
| CSS thường | `.css` | `globals.css` |
| CSS Modules | `.module.css` | `RecipeCard.module.css` |
| JSON | `.json` | `data.json` |
| Markdown | `.md` | `README.md` |
| Biến môi trường | `.env` | `.env` |

### 7.2. Encoding

- ✅ **UTF-8** cho mọi file.
- ✅ **LF** (không CRLF) cho xuống dòng.
- ✅ **Indent 2 spaces** (không tab).

### 7.3. Thứ tự import

```tsx
// 1. React imports
import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';

// 2. React Router
import { Link, useNavigate } from 'react-router-dom';

// 3. Thư viện ngoài
import { BarChart } from 'recharts';

// 4. Contexts
import { useAuth } from '@/contexts/AuthContext';

// 5. Features
import { RecipeCard } from '@/features/recipes/components/RecipeCard';

// 6. Components
import { Button } from '@/components/Button';

// 7. Lib
import { calculateScore } from '@/lib/score';

// 8. Data
import { recipes } from '@/data/recipes';

// 9. i18n
import { useTranslation } from '@/i18n/useTranslation';

// 10. CSS
import styles from './RecipeCard.module.css';
```

### 7.4. Path Alias

- ✅ **Dùng `@/`** thay cho `../../../`.
- ✅ **Cấu hình** trong `vite.config.ts` và `tsconfig.json`.

```tsx
// ❌ SAI
import { Button } from '../../../components/Button';

// ✅ ĐÚNG
import { Button } from '@/components/Button';
```

---

## 📌 8. CẤM TUYỆT ĐỐI

### 8.1. Code

- ❌ **KHÔNG dùng `any`.**
- ❌ **KHÔNG hardcode API URL.**
- ❌ **KHÔNG import từ `../../../`.**
- ❌ **KHÔNG `console.log()` trong prod.**
- ❌ **KHÔNG mutate state.**
- ❌ **KHÔNG dùng `!important` CSS.**
- ❌ **KHÔNG viết inline style** (trừ trường hợp đặc biệt).
- ❌ **KHÔNG hardcode text tiếng Việt** — phải dùng `t('key')`.

### 8.2. Thư viện

- ❌ **KHÔNG dùng Redux Toolkit.**
- ❌ **KHÔNG dùng Zustand.**
- ❌ **KHÔNG dùng Tailwind CSS.**
- ❌ **KHÔNG dùng shadcn/ui.**
- ❌ **KHÔNG dùng Framer Motion.**
- ❌ **KHÔNG dùng react-i18next.**
- ❌ **KHÔNG thêm thư viện mà không hỏi.**

### 8.3. Git

- ❌ **KHÔNG commit trực tiếp lên `main`.**
- ❌ **KHÔNG commit mã chưa đọc.**
- ❌ **KHÔNG commit message chung chung** (`update`, `fix stuff`).
- ❌ **KHÔNG commit file `node_modules/`, `dist/`, `.env`.**

### 8.4. AI

- ❌ **KHÔNG copy code AI mà không đọc.**
- ❌ **KHÔNG commit code AI mà không test.**
- ❌ **KHÔNG nhờ AI làm bài kiểm tra** (Buổi 11).
- ❌ **KHÔNG fake kết quả AI** — khai báo trung thực.

---

## 📌 9. CHECKLIST TRƯỚC KHI COMMIT

### 9.1. Trước khi commit

- ☐ Đã đọc toàn bộ code mình viết.
- ☐ Đã hiểu code AI generate.
- ☐ Đã xoá `console.log()`.
- ☐ Đã test bằng `npm run dev`.
- ☐ `npx tsc --noEmit` không lỗi.
- ☐ Console trình duyệt không có lỗi đỏ.
- ☐ Commit message đúng format.

### 9.2. Trước khi push

- ☐ Đã commit hết thay đổi.
- ☐ `git status` không còn file chưa commit.
- ☐ Branch đúng (không phải `main`).
- ☐ Đã pull mới nhất từ `main`.

### 9.3. Trước khi tạo PR

- ☐ `npm run build` thành công.
- ☐ Đã test trên mobile.
- ☐ Đã test chuyển ngôn ngữ.
- ☐ Đã test 4 vai trò.
- ☐ README đã cập nhật.
- ☐ PR description đầy đủ.

---

## 📌 10. XỬ LÝ KHI AI GENERATE SAI

### 10.1. Các lỗi thường gặp

| Lỗi | Cách xử lý |
|---|---|
| AI dùng `any` | Yêu cầu AI sửa thành type cụ thể |
| AI thêm thư viện ngoài | Yêu cầu AI dùng thư viện có sẵn |
| AI viết Tailwind | Yêu cầu AI dùng CSS thuần |
| AI dùng Redux | Yêu cầu AI dùng Context |
| AI hardcode tiếng Việt | Yêu cầu AI dùng `t('key')` |
| AI mutate state | Yêu cầu AI dùng immutable update |
| AI viết `../../../` | Yêu cầu AI dùng `@/` |

### 10.2. Cách yêu cầu AI sửa

**Prompt sửa:**
```
BỐI CẢNH:
Code vừa generate vi phạm quy tắc AGENTS.md.

LỖI:
- Dùng `any` ở dòng 15.
- Hardcode text tiếng Việt ở dòng 30.

YÊU CẦU:
- Sửa lại theo đúng AGENTS.md.
- Không thay đổi logic.
- Liệt kê các thay đổi đã sửa.
```

---

## 📌 11. KHAI BÁO AI

### 11.1. Khi nào khai báo?

- ✅ **Khi AI generate code** → khai báo trong commit message.
- ✅ **Khi AI giúp refactor** → khai báo.
- ✅ **Khi AI viết docs** → khai báo.
- ❌ **Khi AI chỉ giải thích** → không cần.

### 11.2. Cách khai báo

**Trong commit message:**
```
feat(cooking): add drag-drop ingredients

AI-assisted: Yes
AI-tool: Claude / ChatGPT / Copilot
Reviewed-by: [Tên sinh viên]
```

**Trong README.md:**
```markdown
## Khai báo AI

- **Có dùng AI** cho:
  - Generate component structure.
  - Suggest CSS animations.
  - Debug lỗi TypeScript.
- **Không dùng AI** cho:
  - Logic tính điểm `calculateScore()`.
  - Thiết kế database schema.
  - Quyết định kiến trúc.
```

### 11.3. Trung thực

- ✅ **Khai báo trung thực** mọi trợ giúp từ AI.
- ❌ **KHÔNG fake** — giảng viên có thể hỏi vấn đáp.
- ❌ **KHÔNG copy-paste** mà không hiểu.

---

## 📌 12. LIÊN HỆ KHI CẦN

### 12.1. Giảng viên

- **Email:** [Email giảng viên]
- **Teams:** [Username]
- **Zalo:** [Số điện thoại]

### 12.2. Tài liệu tham khảo

- **React docs:** https://react.dev
- **TypeScript docs:** https://www.typescriptlang.org/docs
- **React Router:** https://reactrouter.com
- **MDN Web Docs:** https://developer.mozilla.org
- **Recharts:** https://recharts.org
- **Vite:** https://vitejs.dev

---

## ✅ KẾT LUẬN

**File AGENTS.md này là "luật" cho dự án Hue Chef.**

**Nguyên tắc vàng:**
> **"AI là công cụ. Sinh viên là người chịu trách nhiệm."**

**3 điều cần nhớ:**
1. **Review + Test** là 2 bước KHÔNG ĐƯỢC BỎ.
2. **Commit code chưa đọc** = vi phạm luật Studio.
3. **Khai báo trung thực** việc dùng AI.

**Khi AI vi phạm luật → yêu cầu sửa ngay.**

---

*File này được cập nhật lần cuối: [Ngày]*
*Phiên bản: 1.0*