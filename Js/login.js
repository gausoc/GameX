// Tìm biểu mẫu đăng nhập; chỉ gắn xử lý khi biểu mẫu có trên trang hiện tại.
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    // Ngăn gửi form mặc định để kiểm tra thông tin đã lưu trong trình duyệt.
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim().toLowerCase();
        const password = document.getElementById("password").value.trim();
        const savedUser = localStorage.getItem("GameXUser");

        // Chuyển người dùng sang đăng ký nếu chưa có tài khoản cục bộ.
        if (savedUser === null) {
            alert("Bạn chưa đăng ký tài khoản!");
            window.location.href = "register.html";
            return;
        }

        const user = JSON.parse(savedUser);

        // Đánh dấu đăng nhập thành công và quay về danh sách game nếu thông tin khớp.
        if (email === user.email?.trim().toLowerCase() && password === user.password) {
            localStorage.setItem("isLoggedIn", "true");
            window.location.href = "index.html";
        } else {
            alert("Email hoặc mật khẩu không chính xác!");
        }
    });
}