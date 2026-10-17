const API_URL = "https://www.mmobomb.com/api1/games";
const PAGE_SIZE = 24;

const gameGrid = document.getElementById("gameGrid");
const gameSearch = document.getElementById("gameSearch");
const resultCount = document.getElementById("resultCount");
const sortButtons = document.querySelectorAll(".sort-button");
const loadMoreButton = document.getElementById("loadMore");

let allGames = [];
let sortBy = "newest";
let shownGames = PAGE_SIZE;

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

function createGameCard(game) {
    const card = document.createElement("article");
    card.className = "game-card";

    const link = document.createElement("a");
    link.href = game.game_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    const cover = document.createElement("div");
    cover.className = "game-cover";
    const image = document.createElement("img");
    image.src = game.thumbnail;
    image.alt = game.title;
    image.loading = "lazy";
    image.addEventListener("error", () => {
        image.remove();
        cover.textContent = "🎮";
    }, { once: true });
    cover.appendChild(image);

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

function renderGames() {
    const query = gameSearch.value.trim().toLocaleLowerCase("vi");
    const matchingGames = allGames.filter((game) => {
        const searchableText = [
            game.title,
            game.short_description,
            game.platform,
            game.publisher
        ].join(" ").toLocaleLowerCase("vi");

        return searchableText.includes(query);
    });

    matchingGames.sort((first, second) => {
        if (sortBy === "az") {
            return first.title.localeCompare(second.title);
        }

        if (sortBy === "za") {
            return second.title.localeCompare(first.title);
        }

        return new Date(second.release_date) - new Date(first.release_date);
    });

    const gamesToShow = matchingGames.slice(0, shownGames);
    gameGrid.replaceChildren(...gamesToShow.map(createGameCard));
    resultCount.textContent = `Hiển thị ${gamesToShow.length} / ${matchingGames.length} game`;
    loadMoreButton.hidden = gamesToShow.length >= matchingGames.length;

    if (matchingGames.length === 0) {
        showMessage("Không tìm thấy game phù hợp.");
    }
}

async function loadGames() {
    resultCount.textContent = "Đang tải game...";
    loadMoreButton.hidden = true;
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

        allGames = games.filter((game) =>
            game &&
            typeof game.title === "string" &&
            typeof game.thumbnail === "string" &&
            typeof game.game_url === "string" &&
            game.thumbnail.startsWith("https://") &&
            game.game_url.startsWith("https://")
        );

        if (allGames.length === 0) {
            resultCount.textContent = "Không có game";
            showMessage("API hiện chưa có trò chơi để hiển thị.");
            return;
        }

        shownGames = PAGE_SIZE;
        renderGames();
    } catch (error) {
        console.error("Không thể tải danh sách game:", error);
        resultCount.textContent = "Không tải được game";
        showMessage("Không thể kết nối tới API game. Hãy kiểm tra mạng rồi thử lại.", true);
    }
}

gameSearch.addEventListener("input", () => {
    shownGames = PAGE_SIZE;
    renderGames();
});

sortButtons.forEach((button) => {
    button.addEventListener("click", () => {
        sortBy = button.dataset.sort;
        shownGames = PAGE_SIZE;

        sortButtons.forEach((sortButton) => {
            const isActive = sortButton === button;
            sortButton.classList.toggle("active", isActive);
            sortButton.setAttribute("aria-pressed", String(isActive));
        });

        renderGames();
    });
});

loadMoreButton.addEventListener("click", () => {
    shownGames += PAGE_SIZE;
    renderGames();
});

loadGames();