# Tính năng Audio Controls - TopicFlashcard

## Tổng quan
Tính năng audio controls cho phép người dùng phát, tạm dừng, tua nhanh và tua lùi audio cho từng flashcard với 2 loại audio riêng biệt (tiếng Việt và tiếng Anh).

## Các tính năng đã triển khai

### 1. **2 Loại Audio Riêng Biệt**
- **Audio tiếng Việt** (`audio_vi`): Phát khi xem mặt sau của flashcard
- **Audio tiếng Anh** (`audio_en`): Phát khi xem mặt trước của flashcard
- Mỗi loại audio có controls riêng biệt và độc lập

### 2. **Audio Controls**
- **Play/Pause**: Phát hoặc tạm dừng audio
- **Rewind** (⏪): Tua lùi 5 giây
- **Forward** (⏩): Tua nhanh 5 giây
- **Progress Slider**: Kéo để tua đến vị trí bất kỳ
- **Time Display**: Hiển thị thời gian hiện tại và tổng thời gian

### 3. **Auto Stop Audio**
- **Khi flip card**: Tự động tắt audio đang phát
- **Khi chuyển card**: Tự động tắt audio khi chuyển sang card khác
- **Khi audio kết thúc**: Tự động reset về trạng thái ban đầu

### 4. **Visual Feedback**
- **Active State**: Audio đang phát sẽ có màu xanh lá
- **Inactive State**: Audio không phát có màu trắng
- **Progress Bar**: Hiển thị tiến độ phát audio
- **Time Counter**: Hiển thị thời gian dạng MM:SS

## Cách sử dụng

### Phát Audio
1. **Mặt trước (tiếng Anh)**: Click nút play trên audio player tiếng Anh
2. **Mặt sau (tiếng Việt)**: Click nút play trên audio player tiếng Việt
3. **Toggle**: Click lại để tạm dừng

### Điều khiển Audio
- **⏪ Rewind**: Tua lùi 5 giây
- **⏩ Forward**: Tua nhanh 5 giây
- **Slider**: Kéo để tua đến vị trí mong muốn
- **Time Display**: Xem thời gian hiện tại / tổng thời gian

### Chuyển đổi Card
- **Flip Card**: Audio sẽ tự động tắt
- **Next/Prev Card**: Audio sẽ tự động tắt
- **Hoàn thành**: Audio sẽ tự động tắt

## Technical Implementation

### State Management
```typescript
const [isPlaying, setIsPlaying] = useState(false);
const [currentTime, setCurrentTime] = useState(0);
const [duration, setDuration] = useState(0);
const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
const [currentAudioType, setCurrentAudioType] = useState<'vi' | 'en' | null>(null);
```

### Audio Events
- `timeupdate`: Cập nhật thời gian hiện tại
- `loadedmetadata`: Lấy thông tin duration
- `ended`: Reset khi audio kết thúc
- `play/pause`: Cập nhật trạng thái playing

### Key Functions
- `handleAudio(url, type)`: Xử lý phát audio theo loại
- `handlePlayPause()`: Toggle play/pause
- `handleSeek(value)`: Tua đến vị trí
- `handleRewind()`: Tua lùi 5s
- `handleForward()`: Tua nhanh 5s

## UI Components

### AudioPlayer Component
```typescript
const AudioPlayer = ({ 
  audioUrl, 
  language, 
  audioType 
}: { 
  audioUrl?: string; 
  language: string; 
  audioType: 'vi' | 'en' 
}) => {
  // Component logic
}
```

### Styling
- **Container**: Glassmorphism effect với backdrop blur
- **Controls**: Circular buttons với hover effects
- **Progress**: Custom slider với green theme
- **Responsive**: Tự động điều chỉnh theo kích thước màn hình

## Browser Compatibility
- **HTML5 Audio API**: Hỗ trợ đầy đủ trên modern browsers
- **Audio Formats**: MP3, WAV, M4A, OGG
- **Mobile Support**: Touch-friendly controls
- **Accessibility**: Keyboard navigation support

## Performance Optimizations
- **Single Audio Element**: Sử dụng 1 audio element cho tất cả
- **Event Cleanup**: Proper cleanup khi component unmount
- **Memory Management**: Reset state khi chuyển audio
- **Error Handling**: Graceful error handling cho audio loading

## Future Enhancements
- **Volume Control**: Thêm thanh điều chỉnh âm lượng
- **Playback Speed**: Tùy chỉnh tốc độ phát (0.5x, 1x, 1.5x, 2x)
- **Loop Mode**: Lặp lại audio
- **Keyboard Shortcuts**: Phím tắt cho controls
- **Audio Preloading**: Preload audio cho card tiếp theo 