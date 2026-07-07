export interface Article {
  id: string;
  title: string;
  category: string;
  time: string;
  author: string;
  summary: string;
  image: string;
  content: string;
}

export const EDITORIAL_ARTICLES: Article[] = [
  {
    id: 'art-1',
    title: 'Mã hóa đầu cuối (E2EE) trở thành lá chắn tối cao bảo vệ thông tin cá nhân năm 2026',
    category: 'CÔNG NGHỆ BẢO MẬT',
    time: '2 giờ trước',
    author: 'Khánh Vy - Ban Công nghệ',
    summary: 'Trong bối cảnh các cuộc tấn công mạng nhằm vào dữ liệu người dùng ngày càng gia tăng, cơ chế mã hóa đầu cuối (End-to-End Encryption - E2EE) đã trở thành tiêu chuẩn bắt buộc cho mọi nền tảng truyền thông bảo mật.',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=400',
    content: `Mã hóa đầu cuối (E2EE) là hệ thống truyền thông trong đó chỉ những người đang trò chuyện trực tiếp mới có thể đọc được nội dung tin nhắn. Về mặt kỹ thuật, tin nhắn được mã hóa thành bản mã (ciphertext) ngay tại thiết bị người gửi bằng khóa công khai (Public Key) của người nhận và chỉ có thể giải mã bằng khóa riêng tư (Private Key) tương ứng lưu trữ cục bộ trên thiết bị của người nhận.

Tại sao máy chủ cũng không thể đọc tin nhắn? Trong các ứng dụng trò chuyện thông thường, tin nhắn được truyền qua mạng dưới dạng văn bản rõ hoặc chỉ được mã hóa trên đường truyền (Transit Encryption). Khi tin nhắn đến máy chủ, nó sẽ được giải mã để máy chủ lưu trữ hoặc xử lý. Điều này có nghĩa là quản trị viên máy chủ hoặc bất kỳ tin tặc nào xâm nhập được vào máy chủ đều có thể đọc toàn bộ tin nhắn của bạn.

Với E2EE, máy chủ chỉ đóng vai trò là một bưu tá trung chuyển các gói tin mã hóa nhị phân. Do không giữ Khóa riêng tư RSA hay khóa đối xứng AES của thiết bị người dùng, máy chủ hoàn toàn không có khả năng giải mật mã. Kể cả khi cơ sở dữ liệu bị rò rỉ, kẻ tấn công cũng chỉ thu về được các bản mã vô nghĩa.

Quy trình ghép cặp khóa:
1. Mỗi người dùng khi đăng ký sẽ tự tạo ra một cặp khóa bất đối xứng RSA-2048.
2. Khóa công khai (Public Key) được đẩy lên máy chủ để bất kỳ ai muốn nhắn tin cho họ đều có thể lấy về làm khuôn đúc.
3. Khóa riêng tư (Private Key) được bảo mật tuyệt đối bên trong bộ nhớ đệm cô lập của trình duyệt và được bảo vệ bởi lớp khóa sinh trắc học thiết bị.`
  },
  {
    id: 'art-2',
    title: 'Xác thực sinh trắc học vật lý: Khi Touch ID và Face ID trực tiếp bảo vệ khóa mật mã',
    category: 'AN NINH MẠNG',
    time: '4 giờ trước',
    author: 'Minh Phong - Chuyên gia Mật mã học',
    summary: 'Không chỉ là phương thức mở khóa màn hình tiện lợi, sinh trắc học thực tế trên thiết bị đang đóng vai trò chốt chặn then chốt giúp cô lập an toàn các khóa riêng tư RSA khỏi mã độc.',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=400',
    content: `Mở khóa sinh trắc học thực tế trên thiết bị sử dụng API WebAuthn (Web Authentication) chuẩn của liên minh FIDO. Khi người dùng chạm vân tay vào cảm biến Touch ID hoặc quét khuôn mặt bằng Face ID, hệ điều hành sẽ xác thực danh tính trong một vùng phần cứng siêu bảo mật biệt lập (Secure Enclave hoặc TPM) trên thiết bị.

Sự khác biệt giữa Mô phỏng và Thực tế:
- Mô phỏng sinh trắc học: Chỉ là các hiệu ứng đồ họa chạy vòng lặp để minh họa trực quan tiến độ quét trên giao diện. Nó không yêu cầu sự tương tác thực tế từ phần cứng thiết bị.
- Sinh trắc học thực tế: Trình duyệt sẽ trực tiếp gọi hộp thoại bảo mật của hệ điều hành (Touch ID, Face ID, Windows Hello, mã khóa hệ thống). Nếu người dùng không khớp đúng vân tay vật lý, hệ thống sẽ từ chối cấp quyền truy cập khóa mật mã, ngăn chặn triệt để các hành vi xâm nhập từ xa.

Liên kết khóa bảo mật:
Trong ứng dụng trò chuyện của chúng tôi, khi thiết bị được khóa sinh trắc học, khóa riêng tư RSA giải mã tin nhắn sẽ được mã hóa và "đóng băng" cục bộ. Chỉ khi cảm biến sinh trắc học thực tế của thiết bị trả về tín hiệu xác thực thành công, khóa giải mã mới được nạp vào RAM để giải mật mã tin nhắn, đảm bảo dữ liệu luôn an toàn ngay cả khi có ai đó cầm điện thoại của bạn lúc đang khóa.`
  },
  {
    id: 'art-3',
    title: 'Cơ chế tự hủy dữ liệu: Phương pháp triệt tiêu dấu vết kỹ thuật số trên bộ nhớ RAM',
    category: 'KHOA HỌC MẬT MÃ',
    time: '1 ngày trước',
    author: 'Thu Linh - Nhà nghiên cứu An toàn thông tin',
    summary: 'Tin nhắn tự hủy không chỉ đơn thuần là xóa dòng chữ trên màn hình. Để đạt độ bảo mật tuyệt đối, dữ liệu cần được ghi đè và giải phóng triệt để khỏi bộ nhớ vật lý.',
    image: 'https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&q=80&w=400',
    content: `Tin nhắn tự hủy (Ephemeral Messaging) là tính năng vô cùng quan trọng cho các cuộc thảo luận tối mật. Khi tin nhắn được đọc, một bộ đếm ngược thời gian thực sẽ được kích hoạt trực tiếp trên cả client người gửi và người nhận.

Triệt tiêu dữ liệu thực sự trong RAM:
Trong mật mã học chuyên sâu, khi một đối tượng dữ liệu bị xóa thông thường, hệ điều hành chỉ đơn thuần là gỡ bỏ con trỏ tham chiếu, trong khi các hạt nhị phân chứa nội dung thực tế vẫn nằm nguyên vẹn trên ô nhớ RAM hoặc ổ đĩa cứng cho đến khi bị ghi đè. Kẻ tấn công sử dụng các công cụ khôi phục bộ nhớ (Memory Dumping) có thể trích xuất lại các tin nhắn này.

Để giải quyết triệt để vấn đề này, cơ chế tự hủy của SecureCrypt thực hiện:
1. Ghi đè toàn bộ mảng dữ liệu (Byte Array) chứa bản rõ và khóa giải mã bằng dữ liệu ngẫu nhiên (Zeroing/Overwriting).
2. Gọi bộ gom rác (Garbage Collector) để giải phóng vùng nhớ bị chiếm dụng ngay lập tức.
3. Phát tín hiệu đồng bộ qua WebSocket để máy chủ xóa vĩnh viễn tệp đính kèm và bản mã khỏi cơ sở dữ liệu trung tâm, không để lại bất kỳ bản sao lưu vật lý nào trên Internet.`
  }
];
