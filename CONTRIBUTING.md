# Contributing

Bạn có thể đóng góp bằng cách mở Issue theo mẫu câu hỏi hoặc Pull Request sửa nội dung.

## 🔐 Quy tắc bảo vệ repo

- Không push trực tiếp lên `main`; mọi thay đổi phải đi qua Pull Request.
- Không xoá, rename, hoặc thay đổi default branch `main`.
- Branch hợp lệ chỉ dùng một trong hai pattern:
  - `develop/homelab/xxx`
  - `release/homelab/xxx`
- PR phải dùng template và có đủ ba phần:
  - `🧩 WHAT CHANGED`
  - `🚀 BENEFIT`
  - `✅ EVIDENCE`
- Sau khi mở PR, cần có profile reviewer khác review OK trước khi merge.
- Chỉ merge khi review OK và required checks/test/build pass.

## 🧩 Nguyên tắc nội dung

- Viết tiếng Việt dễ hiểu, tránh hype.
- Có nguồn chính thức khi so sánh sản phẩm hoặc mô tả tính năng.
- Ghi ngày kiểm chứng (`last_verified`).
- Không copy nguyên văn nội dung, hình ảnh, sơ đồ từ nguồn khác nếu chưa rõ license.
- Không commit secret, token, API key, private data, hoặc credentials.
