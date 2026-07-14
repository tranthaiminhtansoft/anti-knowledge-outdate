# Public readiness checklist

## Name / collision

- [x] GitHub public repo exact search: `anti-knowledge-outdate` hiện không có kết quả.
- [x] npm exact/package search không thấy package trùng tên trực tiếp.
- [ ] Web search sâu hơn cho tên gần giống.
- [ ] Kiểm tra WIPO/TMview/USPTO và cơ sở dữ liệu nhãn hiệu Việt Nam nếu muốn dùng tên như brand lâu dài.

## Legal / policy

- [x] Có disclaimer độc lập trong `NOTICE.md`.
- [x] Tách license code và content.
- [ ] Mọi claim về Hermes/Copilot/ChatGPT phải có nguồn chính thức và ngày kiểm chứng.
- [ ] Không dùng screenshot/logo/icon/font của bên thứ ba nếu chưa rõ license.
- [ ] Thêm `THIRD_PARTY_NOTICES.md` khi bắt đầu dùng asset hoặc trích dẫn dài.

## Security

- [x] Site tĩnh, không cần secret frontend.
- [x] `.gitignore` chặn `.env`.
- [ ] Secret scan trước khi public: `git secrets`, `gitleaks`, hoặc GitHub secret scanning.
- [ ] Actions permission tối thiểu.
- [ ] Không deploy PR từ fork tự động.

## Content quality

- [ ] Mỗi bài có: nguồn, `last_verified`, phạm vi phiên bản, reviewer.
- [ ] Có quy trình cập nhật khi sản phẩm thay đổi.
- [ ] Không để LLM tự merge hoặc publish không qua human review.
