// Cấu hình API và các khóa sessionStorage dùng chung với trang danh sách.
const API_URL = "https://www.mmobomb.com/api1/game";
const selectedGameKey = "gameX:selectedGame";
const gamesKey = "gameX:games";

const detailsContainer = document.getElementById("gameDetails");
const gameId = new URLSearchParams(window.location.search).get("id");

// Tạo phần tử DOM và gán nội dung dạng văn bản an toàn.
function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

// Đọc dữ liệu game trong sessionStorage; báo lỗi nếu dữ liệu không hợp lệ.
function getStoredGame(key) {
    try {
        const storedValue = sessionStorage.getItem(key);
        return storedValue ? JSON.parse(storedValue) : null;
    } catch (error) {
        console.error("Không thể đọc dữ liệu game đã lưu:", error);
        return null;
    }
}

// Hiển thị ngày theo định dạng tiếng Việt, giữ nguyên giá trị nếu không phân tích được.
function formatDate(value) {
    if (!value) return "Chưa cập nhật";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleDateString("vi-VN");
}

// Tạo ảnh bìa khi URL hợp lệ; dùng biểu tượng thay thế nếu ảnh không tải được.
function createCover(game) {
    const cover = createElement("div", "cover");
    if (typeof game.thumbnail === "string" && game.thumbnail.startsWith("https://")) {
        const image = document.createElement("img");
        image.src = game.thumbnail;
        image.alt = `Ảnh bìa game ${game.title}`;
        image.addEventListener("error", () => {
            image.remove();
            cover.appendChild(createElement("span", "cover-fallback", "🎮"));
        }, { once: true });
        cover.appendChild(image);
    } else {
        cover.appendChild(createElement("span", "cover-fallback", "🎮"));
    }
    return cover;
}

// Tạo tối đa bốn thẻ game liên quan từ danh sách đã lưu ở trang trước.
function renderRelatedGames(currentGame) {
    const games = getStoredGame(gamesKey);
    if (!Array.isArray(games)) return null;

    const related = games
        .filter((game) => String(game.id) !== String(currentGame.id))
        .slice(0, 4);
    if (related.length === 0) return null;

    const section = createElement("section", "related-section");
    section.appendChild(createElement("h2", "", "Game khác bạn có thể thích"));
    const grid = createElement("div", "related-grid");

    related.forEach((game) => {
        const link = document.createElement("a");
        link.className = "related-card";
        link.href = `detail.html?id=${encodeURIComponent(game.id)}`;
        link.addEventListener("click", () => {
            try {
                sessionStorage.setItem(selectedGameKey, JSON.stringify(game));
            } catch (error) {
                console.error("Không thể lưu dữ liệu game cho trang chi tiết:", error);
            }
        });

        if (typeof game.thumbnail === "string" && game.thumbnail.startsWith("https://")) {
            const image = document.createElement("img");
            image.src = game.thumbnail;
            image.alt = `Ảnh bìa game ${game.title}`;
            image.loading = "lazy";
            link.appendChild(image);
        } else {
            link.appendChild(createElement("div", "related-cover", "🎮"));
        }
        link.appendChild(createElement("h3", "", game.title));
        grid.appendChild(link);
    });

    section.appendChild(grid);
    return section;
}

// Hiển thị thông tin chính, thông số và liên kết mở trang game.
function renderGame(game) {
    document.title = `${game.title} | GameX`;
    detailsContainer.replaceChildren();

    const layout = createElement("div", "detail-layout");
    const main = createElement("article", "detail-main");
    main.appendChild(createCover(game));

    const content = createElement("div", "detail-content");
    const badges = createElement("div", "badges");
    if (game.genre) badges.appendChild(createElement("span", "badge", game.genre));
    if (game.platform) badges.appendChild(createElement("span", "badge", game.platform));
    content.appendChild(badges);
    content.appendChild(createElement("h1", "", game.title || "Game không có tên"));

    const meta = createElement("div", "game-meta");
    if (game.developer || game.publisher) {
        meta.appendChild(createElement("span", "", `Nhà phát triển: ${game.developer || game.publisher}`));
    }
    meta.appendChild(createElement("span", "", `Ngày phát hành: ${formatDate(game.release_date)}`));
    content.appendChild(meta);
    content.appendChild(createElement(
        "p",
        "description",
        game.short_description || "Game chưa có mô tả."
    ));
    main.appendChild(content);

    const aside = createElement("aside", "detail-aside");
    aside.appendChild(createElement("h2", "", "Thông tin game"));
    const specs = createElement("dl", "spec-list");
    [
        ["Thể loại", game.genre],
        ["Nền tảng", game.platform],
        ["Nhà phát hành", game.publisher],
        ["Nhà phát triển", game.developer],
        ["Ngày phát hành", formatDate(game.release_date)]
    ].forEach(([label, value]) => {
        if (!value) return;
        const row = document.createElement("div");
        row.append(
            createElement("dt", "", label),
            createElement("dd", "", value)
        );
        specs.appendChild(row);
    });
    aside.appendChild(specs);

    if (typeof game.game_url === "string" && game.game_url.startsWith("https://")) {
        const playLink = createElement("a", "play-link", "Mở trang game");
        playLink.href = game.game_url;
        playLink.target = "_blank";
        playLink.rel = "noopener noreferrer";
        aside.appendChild(playLink);
    }

    layout.append(main, aside);
    detailsContainer.appendChild(layout);
    const relatedSection = renderRelatedGames(game);
    if (relatedSection) detailsContainer.appendChild(relatedSection);
}

// Ưu tiên dữ liệu đã lưu; nếu thiếu thì lấy thông tin game trực tiếp từ API.
async function loadGameDetails() {
    if (!gameId) {
        detailsContainer.replaceChildren(createElement(
            "p",
            "status-message",
            "Chưa chọn game. Hãy quay lại danh sách và bấm vào game bạn muốn xem."
        ));
        return;
    }

    const storedGame = getStoredGame(selectedGameKey);
    if (storedGame && String(storedGame.id) === String(gameId)) {
        renderGame(storedGame);
        return;
    }

    try {
        const response = await fetch(`${API_URL}?id=${encodeURIComponent(gameId)}`);
        if (!response.ok) {
            throw new Error(`API trả về lỗi ${response.status}.`);
        }

        const responseData = await response.json();
        const game = Array.isArray(responseData) ? responseData[0] : responseData;
        if (!game || String(game.id) !== String(gameId) || typeof game.title !== "string") {
            throw new Error("Không tìm thấy thông tin game này.");
        }

        renderGame(game);
    } catch (error) {
        console.error("Không thể tải thông tin game:", error);
        detailsContainer.replaceChildren(createElement(
            "p",
            "status-message",
            "Không tải được thông tin game. Hãy quay lại danh sách, tải lại game rồi thử mở lại."
        ));
    }
}

loadGameDetails();
