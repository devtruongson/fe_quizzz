# Hướng dẫn cài đặt Quiz App Frontend

## Bước 1: Cài đặt dependencies

Chạy lệnh sau để cài đặt tất cả dependencies:

```bash
npm install
```

## Bước 2: Cấu hình môi trường

Tạo file `.env` trong thư mục gốc với nội dung:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8080/api

# App Configuration
VITE_APP_NAME=Quiz App
VITE_APP_VERSION=1.0.0

# Development Configuration
VITE_DEV_MODE=true
```

## Bước 3: Chạy backend

Đảm bảo backend đang chạy tại `http://localhost:8080`:

```bash
# Trong thư mục backend_quizz_job
npm run dev
```

## Bước 4: Chạy frontend

```bash
npm run dev
```

Frontend sẽ chạy tại: http://localhost:5173

## Bước 5: Kiểm tra

1. Mở trình duyệt và truy cập http://localhost:5173
2. Đăng ký tài khoản mới hoặc đăng nhập
3. Kiểm tra các tính năng:
   - Dashboard
   - Danh sách chủ đề
   - Hồ sơ cá nhân
   - Admin panel (nếu có quyền admin)

## Troubleshooting

### Lỗi "Cannot find module"
```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install
```

### Lỗi CORS
Đảm bảo backend đã cấu hình CORS đúng cách.

### Lỗi API connection
Kiểm tra:
- Backend đang chạy
- URL trong .env file
- Network connectivity

### Lỗi TypeScript
```bash
# Kiểm tra types
npm run build
```

## Cấu trúc project sau khi cài đặt

```
quizz_front_end/
├── src/
│   ├── components/
│   │   └── Header.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Topics.tsx
│   │   ├── Admin.tsx
│   │   └── Profile.tsx
│   ├── services/
│   │   └── api.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── vite.config.ts
├── .env
└── README.md
```

## Dependencies đã cài đặt

### Production
- react: ^19.1.0
- react-dom: ^19.1.0
- react-router-dom: ^6.28.0
- antd: ^5.20.1
- @ant-design/icons: ^5.5.0
- axios: ^1.7.9
- react-query: ^3.39.3
- zustand: ^5.0.2
- react-hook-form: ^7.53.2
- react-hot-toast: ^2.4.1

### Development
- typescript: ~5.8.3
- tailwindcss: ^3.4.17
- autoprefixer: ^10.4.20
- postcss: ^8.4.49
- vite: ^6.3.5
- eslint: ^9.25.0

## Scripts có sẵn

```bash
# Development
npm run dev

# Build production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Tài khoản test

### User thường
- Email: user@test.com
- Password: 123456

### Admin
- Email: admin@test.com  
- Password: admin123

## Tính năng đã implement

### ✅ Hoàn thành
- [x] Authentication (Login/Register)
- [x] Protected Routes
- [x] Header Navigation
- [x] Dashboard
- [x] Topics List
- [x] Admin Panel
- [x] User Profile
- [x] API Integration
- [x] Responsive Design
- [x] TypeScript Types
- [x] Tailwind CSS Styling
- [x] Ant Design Components

### 🔄 Cần phát triển thêm
- [ ] Vocabulary Learning Interface
- [ ] Exam System
- [ ] Progress Tracking
- [ ] Audio/Video Support
- [ ] Offline Mode
- [ ] Push Notifications
- [ ] Social Features
- [ ] Leaderboard
- [ ] Achievements System 