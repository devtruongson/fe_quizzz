# Quiz App Frontend

Ứng dụng học từ vựng được xây dựng với React, TypeScript, Tailwind CSS và Ant Design.

## Tính năng

### Người dùng thường
- ✅ Đăng ký/Đăng nhập
- ✅ Trang chủ với dashboard
- ✅ Xem danh sách chủ đề học tập
- ✅ Xem tiến độ học tập
- ✅ Hồ sơ cá nhân
- ✅ Thống kê học tập

### Admin
- ✅ Quản lý người dùng
- ✅ Quản lý chủ đề
- ✅ Quản lý từ vựng
- ✅ Dashboard thống kê

## Công nghệ sử dụng

- **React 19** - Framework UI
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Ant Design** - UI Components
- **React Router** - Routing
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **Vite** - Build tool

## Cài đặt

### Yêu cầu hệ thống
- Node.js 18+ 
- npm hoặc yarn

### Bước 1: Cài đặt dependencies
```bash
npm install
```

### Bước 2: Cấu hình môi trường
Tạo file `.env` trong thư mục gốc:
```env
VITE_API_BASE_URL=http://localhost:8080/api
```

### Bước 3: Chạy ứng dụng
```bash
npm run dev
```

Ứng dụng sẽ chạy tại: http://localhost:5173

## Cấu trúc thư mục

```
src/
├── components/          # Reusable components
│   └── Header.tsx      # Header navigation
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── pages/              # Page components
│   ├── Home.tsx        # Dashboard
│   ├── Login.tsx       # Login page
│   ├── Register.tsx    # Register page
│   ├── Topics.tsx      # Topics list
│   ├── Admin.tsx       # Admin panel
│   └── Profile.tsx     # User profile
├── services/           # API services
│   └── api.ts         # API client
├── types/              # TypeScript types
│   └── index.ts       # Type definitions
├── App.tsx            # Main app component
└── main.tsx           # Entry point
```

## API Endpoints

Ứng dụng kết nối với backend API tại `http://localhost:8080/api`:

### Authentication
- `POST /users/login` - Đăng nhập
- `POST /users/register` - Đăng ký

### Users
- `GET /users` - Lấy danh sách người dùng
- `GET /users/:id` - Lấy thông tin người dùng
- `POST /users` - Tạo người dùng mới
- `PUT /users/:id` - Cập nhật người dùng
- `DELETE /users/:id` - Xóa người dùng

### Topics
- `GET /topics` - Lấy danh sách chủ đề
- `GET /topics/:id` - Lấy thông tin chủ đề
- `POST /topics` - Tạo chủ đề mới
- `PUT /topics/:id` - Cập nhật chủ đề
- `DELETE /topics/:id` - Xóa chủ đề

### Vocabulary
- `GET /vocabulaire-questions` - Lấy danh sách từ vựng
- `GET /vocabulaire-questions/:id` - Lấy thông tin từ vựng
- `POST /vocabulaire-questions` - Tạo từ vựng mới
- `PUT /vocabulaire-questions/:id` - Cập nhật từ vựng
- `DELETE /vocabulaire-questions/:id` - Xóa từ vựng

## Tính năng chính

### 1. Authentication
- Đăng ký tài khoản mới
- Đăng nhập với email/password
- Lưu trạng thái đăng nhập trong localStorage
- Protected routes cho các trang yêu cầu đăng nhập

### 2. Dashboard
- Hiển thị thống kê học tập
- Tiến độ các chủ đề
- Hành động nhanh
- Chủ đề nổi bật

### 3. Quản lý chủ đề
- Xem danh sách tất cả chủ đề
- Tìm kiếm chủ đề
- Hiển thị tiến độ học tập
- Phân loại theo trạng thái

### 4. Admin Panel
- Quản lý người dùng (CRUD)
- Quản lý chủ đề (CRUD)
- Quản lý từ vựng (CRUD)
- Dashboard thống kê

### 5. Profile
- Xem thông tin cá nhân
- Cập nhật mật khẩu
- Thống kê học tập
- Thành tích đạt được

## Scripts

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

## Deployment

### Build cho production
```bash
npm run build
```

### Deploy lên Vercel
1. Push code lên GitHub
2. Kết nối repository với Vercel
3. Cấu hình environment variables
4. Deploy tự động

### Deploy lên Netlify
1. Build project: `npm run build`
2. Upload thư mục `dist` lên Netlify
3. Cấu hình redirect rules cho SPA

## Troubleshooting

### Lỗi CORS
Đảm bảo backend đã cấu hình CORS cho domain frontend.

### Lỗi API connection
Kiểm tra:
- Backend đang chạy tại port 8080
- API base URL trong `.env`
- Network connectivity

### Lỗi build
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install
```

## Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## License

MIT License
