const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim().toLowerCase();
        const password = document.getElementById("password").value.trim();
        const savedUser = localStorage.getItem("GameXUser");

        if (savedUser === null) {
            alert("Bạn chưa đăng ký tài khoản!");
            window.location.href = "register.html";
            return;
        }

        const user = JSON.parse(savedUser);

        if (email === user.email?.trim().toLowerCase() && password === user.password) {
            localStorage.setItem("isLoggedIn", "true");
            window.location.href = "index.html";
        } else {
            alert("Email hoặc mật khẩu không chính xác!");
        }
    });
}