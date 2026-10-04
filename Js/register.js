const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim().toLowerCase();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (!name || !email || !password || !confirmPassword) {
            alert("Vui lòng điền đầy đủ thông tin!");
            return;
        }

        if (password !== confirmPassword) {
            alert("Mật khẩu nhập lại không giống nhau!");
            return;
        }

        const savedUser = localStorage.getItem("GameXUser");

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

        localStorage.setItem("GameXUser", JSON.stringify(user));
        localStorage.setItem("isLoggedIn", "false");
        alert("Đăng ký thành công!");
        window.location.href = "login.html";
    });
}