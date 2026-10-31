// API danh sách game và số thẻ hiển thị trong mỗi lần tải.
const API_URL = "https://www.mmobomb.com/api1/games";
const PAGE_SIZE = 8;
const LOCAL_GAMES_KEY = "gameX:uploadedGames";

// Các phần tử giao diện cần cập nhật khi tìm kiếm, sắp xếp hoặc tải dữ liệu.
const gameGrid = document.getElementById("gameGrid");
const gameSearch = document.getElementById("gameSearch");
const resultCount = document.getElementById("resultCount");
const sortButtons = document.querySelectorAll(".sort-button");
const pagination = document.getElementById("pagination");

let allGames = [];
let sortBy = "newest";
let currentPage = 1;

function getLocalGames() {
    try {
        const storedGames = JSON.parse(localStorage.getItem(LOCAL_GAMES_KEY) || "[]");
        return Array.isArray(storedGames) ? storedGames : [];
    } catch (error) {
        console.error("Không thể đọc game đã upload:", error);
        return [];
    }
}

// Chuẩn hóa chữ tiếng Việt để tìm kiếm không phân biệt dấu và chữ hoa/thường.
function normalizeSearchText(value) {
    return String(value || "")
        .toLocaleLowerCase("vi")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d");
}

// Hiển thị trạng thái danh sách và tùy chọn tạo nút thử tải lại.
function showMessage(message, showRetry = false) {
    gameGrid.replaceChildren();

    const messageElement = document.createElement("p");
    messageElement.className = "message";
    messageElement.textContent = message;
    gameGrid.appendChild(messageElement);

    if (showRetry) {
        const retryButton = document.createElement("button");
        retryButton.className = "load-more";
        retryButton.type = "button";
        retryButton.textContent = "Thử tải lại";
        retryButton.addEventListener("click", loadGames);
        gameGrid.appendChild(retryButton);
    }

}

function renderPagination(totalGames) {
    const totalPages = Math.ceil(totalGames / PAGE_SIZE);
    pagination.replaceChildren();
    pagination.hidden = totalPages <= 1;

    if (totalPages <= 1) return;

    const createPageButton = (label, page, disabled = false, current = false, ariaLabel = `Trang ${page}`) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "page-button";
        button.textContent = label;
        button.disabled = disabled;
        button.setAttribute("aria-label", ariaLabel);
        if (current) button.setAttribute("aria-current", "page");
        button.addEventListener("click", () => {
            currentPage = page;
            renderGames();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
        return button;
    };

    const addEllipsis = () => {
        const ellipsis = document.createElement("span");
        ellipsis.className = "pagination-ellipsis";
        ellipsis.textContent = "...";
        pagination.appendChild(ellipsis);
    };

    const pages = [1];
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    if (startPage > 2) pages.push("ellipsis-start");
    for (let page = startPage; page <= endPage; page += 1) pages.push(page);
    if (endPage < totalPages - 1) pages.push("ellipsis-end");
    if (totalPages > 1) pages.push(totalPages);

    pagination.appendChild(createPageButton("←", currentPage - 1, currentPage === 1, false, "Trang trước"));
    pages.forEach((page) => {
        if (typeof page === "string") {
            addEllipsis();
            return;
        }
        pagination.appendChild(createPageButton(String(page), page, false, page === currentPage));
    });
    pagination.appendChild(createPageButton("→", currentPage + 1, currentPage === totalPages, false, "Trang sau"));
}

// Tạo thẻ game và lưu dữ liệu hiện tại trước khi điều hướng đến trang chi tiết.
function createGameCard(game) {
    const card = document.createElement("article");
    card.className = "game-card";

    const link = document.createElement("a");
    link.href = `detail.html?id=${encodeURIComponent(game.id)}`;
    link.className = "game-card-link";
    link.addEventListener("click", () => {
        try {
            sessionStorage.setItem("gameX:selectedGame", JSON.stringify(game));
            sessionStorage.setItem("gameX:games", JSON.stringify(allGames));
        } catch (error) {
            console.error("Không thể lưu dữ liệu game cho trang chi tiết:", error);
        }
    });

    const cover = document.createElement("div");
    cover.className = "game-cover";
    if (typeof game.thumbnail === "string" && game.thumbnail) {
        const image = document.createElement("img");
        image.src = game.thumbnail;
        image.alt = game.title;
        image.loading = "lazy";
        image.addEventListener("error", () => {
            image.remove();
            cover.textContent = "🎮";
        }, { once: true });
        cover.appendChild(image);
    } else {
        cover.textContent = "🎮";
    }

    const info = document.createElement("div");
    info.className = "game-info";

    const title = document.createElement("h2");
    title.textContent = game.title;

    const description = document.createElement("p");
    description.className = "description";
    description.textContent = game.short_description || "Chưa có mô tả cho trò chơi này.";

    const meta = document.createElement("div");
    meta.className = "game-meta";

    const platform = document.createElement("span");
    platform.className = "game-platform";
    platform.textContent = game.platform || "Nền tảng chưa cập nhật";

    const releaseDate = document.createElement("span");
    const date = new Date(`${game.release_date}T00:00:00`);
    releaseDate.textContent = Number.isNaN(date.getTime())
        ? "Chưa rõ ngày phát hành"
        : date.toLocaleDateString("vi-VN");

    meta.append(platform, releaseDate);
    info.append(title, description, meta);
    link.append(cover, info);
    card.appendChild(link);

    return card;
}

// Lọc theo mọi trường tìm kiếm, sắp xếp kết quả và cập nhật phần danh sách đang thấy.
function renderGames() {
    const query = normalizeSearchText(gameSearch.value).trim().split(/\s+/).filter(Boolean);
    const matchingGames = allGames.filter((game) => {
        const searchableText = [
            game.title,
            game.short_description,
            game.platform,
            game.publisher,
            game.developer,
            game.genre,
            game.category,
            ...(Array.isArray(game.tags) ? game.tags : [])
        ]
            .filter((value) => typeof value === "string")
            .map(normalizeSearchText)
            .join(" ");

        return query.every((term) => searchableText.includes(term));
    });

    matchingGames.sort((first, second) => {
        if (sortBy === "az") {
            return first.title.localeCompare(second.title);
        }

        if (sortBy === "za") {
            return second.title.localeCompare(first.title);
        }

        const firstDate = Date.parse(first.release_date || "");
        const secondDate = Date.parse(second.release_date || "");
        return (Number.isNaN(secondDate) ? 0 : secondDate) -
            (Number.isNaN(firstDate) ? 0 : firstDate);
    });

    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const gamesToShow = matchingGames.slice(startIndex, startIndex + PAGE_SIZE);
    gameGrid.replaceChildren(...gamesToShow.map(createGameCard));
    resultCount.textContent = `Trang ${currentPage} · Hiển thị ${gamesToShow.length} / ${matchingGames.length} game`;
    renderPagination(matchingGames.length);

    if (matchingGames.length === 0) {
        pagination.hidden = true;
        showMessage("Không tìm thấy game phù hợp.");
    }
}

// Lấy dữ liệu game từ API, kiểm tra định dạng và hiển thị lỗi có thể thử lại.
async function loadGames() {
    resultCount.textContent = "Đang tải game...";
    pagination.hidden = true;
    showMessage("Đang tải game...");

    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`API trả về lỗi ${response.status}.`);
        }

        const games = await response.json();
        if (!Array.isArray(games)) {
            throw new Error("Dữ liệu game từ API không hợp lệ.");
        }

        const apiGames = games.filter((game) =>
            game &&
            typeof game.title === "string" &&
            typeof game.thumbnail === "string" &&
            typeof game.game_url === "string" &&
            game.thumbnail.startsWith("https://") &&
            game.game_url.startsWith("https://")
        );
        allGames = [...getLocalGames(), ...apiGames];

        if (allGames.length === 0) {
            resultCount.textContent = "Không có game";
            showMessage("API hiện chưa có trò chơi để hiển thị.");
            return;
        }

        currentPage = 1;
        renderGames();
    } catch (error) {
        console.error("Không thể tải danh sách game:", error);
        allGames = getLocalGames();
        if (allGames.length > 0) {
            currentPage = 1;
            renderGames();
            return;
        }

        resultCount.textContent = "Không tải được game";
        showMessage("Không thể kết nối tới API game. Hãy kiểm tra mạng rồi thử lại.", true);
    }
}

// Mỗi lần tìm kiếm bắt đầu hiển thị lại từ trang kết quả đầu tiên.
gameSearch.addEventListener("input", () => {
    currentPage = 1;
    renderGames();
});

// Cập nhật trạng thái điều khiển sắp xếp rồi dựng lại danh sách.
sortButtons.forEach((button) => {
    button.addEventListener("click", () => {
        sortBy = button.dataset.sort;
        currentPage = 1;

        sortButtons.forEach((sortButton) => {
            const isActive = sortButton === button;
            sortButton.classList.toggle("active", isActive);
            sortButton.setAttribute("aria-pressed", String(isActive));
        });

        renderGames();
    });
});

// Tải danh sách lần đầu khi script khởi chạy.
loadGames();