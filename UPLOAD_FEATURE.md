# Tính năng Upload File - AdminVocabulary

## Tổng quan
Tính năng upload file cho phép admin upload audio và hình ảnh cho từ vựng trong trang AdminVocabulary.

## Các tính năng đã triển khai

### 1. Upload Audio
- **File types được hỗ trợ**: MP3, WAV, M4A
- **Kích thước tối đa**: 10MB
- **Preview**: Hiển thị audio player để nghe thử
- **Fields**: 
  - Audio tiếng Việt (`audio_vi`)
  - Audio tiếng Anh (`audio_en`)

### 2. Upload Hình ảnh
- **File types được hỗ trợ**: JPG, JPEG, PNG, GIF, WEBP
- **Kích thước tối đa**: 10MB
- **Preview**: Hiển thị hình ảnh thumbnail
- **Field**: Hình ảnh (`image`)

### 3. Validation
- Kiểm tra kích thước file (tối đa 10MB)
- Kiểm tra định dạng file
- Hiển thị thông báo lỗi rõ ràng

### 4. UX/UI
- Button upload riêng biệt cho từng loại file
- Loading state khi đang upload
- Preview ngay lập tức sau khi upload thành công
- Input field để nhập URL thủ công (nếu cần)

## Cách sử dụng

### Thêm từ vựng mới
1. Chọn chủ đề từ danh sách
2. Click "Thêm mới"
3. Điền thông tin từ vựng
4. Upload file audio/hình ảnh bằng cách:
   - Click button "Chọn file audio/hình ảnh"
   - Chọn file từ máy tính
   - File sẽ được upload tự động và hiển thị preview
5. Click "Thêm" để lưu

### Chỉnh sửa từ vựng
1. Click "Sửa" trên từ vựng cần chỉnh sửa
2. Thay đổi thông tin hoặc upload file mới
3. Click "Cập nhật" để lưu

## API Endpoints

### Upload File
- **POST** `/api/v1/upload/single` - Upload file thông thường
- **POST** `/api/v1/upload/pdf/single` - Upload file PDF
- **GET** `/api/v1/upload/file/:filename` - Lấy file đã upload

### Response
```json
{
  "url": "http://localhost:8080/api/v1/upload/file/filename-123456789"
}
```

## Cấu trúc thư mục Backend
```
backend_quizz_job/src/
├── upload/           # Thư mục lưu file upload
├── middlewares/
│   └── muiter.ts     # Cấu hình multer
└── routes/
    └── upload.route.ts # API routes cho upload
```

## Lưu ý
- File được lưu trong thư mục `backend_quizz_job/src/upload/`
- Tên file được tạo tự động với timestamp để tránh trùng lặp
- URL file được trả về có thể truy cập trực tiếp từ browser
- Cần đảm bảo thư mục upload có quyền ghi 