// Tìm biểu mẫu đăng ký; chỉ gắn xử lý khi biểu mẫu có trên trang hiện tại.
const registerForm = document.getElementById("registerForm");

if (registerForm) {
    // Tự kiểm tra dữ liệu trước khi lưu tài khoản vào localStorage.
    registerForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim().toLowerCase();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        // Yêu cầu tất cả trường thông tin phải được điền.
        if (!name || !email || !password || !confirmPassword) {
            alert("Vui lòng điền đầy đủ thông tin!");
            return;
        }

        // Đảm bảo mật khẩu xác nhận giống với mật khẩu đã nhập.
        if (password !== confirmPassword) {
            alert("Mật khẩu nhập lại không giống nhau!");
            return;
        }

        const savedUser = localStorage.getItem("GameXUser");

        // Không cho tạo tài khoản mới nếu email đã được đăng ký.
        if (savedUser !== null) {
            const existingUser = JSON.parse(savedUser);

            if (existingUser.email?.toLowerCase() === email) {
                alert("Tài khoản này đã tồn tại!");
                return;
            }
        }

        const user = {
            name: name,
            email: email,
            password: password
        };

        // Lưu tài khoản, đặt trạng thái chưa đăng nhập và chuyển đến trang đăng nhập.
        localStorage.setItem("GameXUser", JSON.stringify(user));
        localStorage.setItem("isLoggedIn", "false");
        alert("Đăng ký thành công!");
        window.location.href = "login.html";
    });
}