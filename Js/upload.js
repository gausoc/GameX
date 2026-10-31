const form = document.getElementById('uploadForm');
const coverInput = document.getElementById('coverImage');
const dropZone = document.getElementById('dropZone');
const imagePreview = document.getElementById('imagePreview');
const previewImage = document.getElementById('previewImage');
const removeImage = document.getElementById('removeImage');
const uploadError = document.getElementById('uploadError');
const description = document.getElementById('gameDescription');
const characterCount = document.getElementById('characterCount');
const formMessage = document.getElementById('formMessage');
const LOCAL_GAMES_KEY = 'gameX:uploadedGames';

function showImage(file) {
    if (!file) {
        return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        uploadError.textContent = 'Vui lòng chọn ảnh JPG, PNG hoặc WEBP.';
        coverInput.value = '';
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        uploadError.textContent = 'Ảnh không được lớn hơn 5MB.';
        coverInput.value = '';
        return;
    }

    uploadError.textContent = '';
    const reader = new FileReader();
    reader.addEventListener('load', () => {
        previewImage.src = reader.result;
        imagePreview.hidden = false;
        dropZone.hidden = true;
    });
    reader.readAsDataURL(file);
}

coverInput.addEventListener('change', () => showImage(coverInput.files[0]));

['dragenter', 'dragover'].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropZone.classList.add('dragging');
    });
});

['dragleave', 'drop'].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropZone.classList.remove('dragging');
    });
});

dropZone.addEventListener('drop', (event) => {
    showImage(event.dataTransfer.files[0]);
});

removeImage.addEventListener('click', () => {
    coverInput.value = '';
    previewImage.removeAttribute('src');
    imagePreview.hidden = true;
    dropZone.hidden = false;
    uploadError.textContent = '';
});

description.addEventListener('input', () => {
    characterCount.textContent = `${description.value.length}/500`;
});

form.addEventListener('submit', (event) => {
    event.preventDefault();
    formMessage.textContent = '';

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    if (description.value.trim().length < 20) {
        description.setCustomValidity('Mô tả cần có ít nhất 20 ký tự.');
        form.reportValidity();
        description.setCustomValidity('');
        return;
    }

    const image = previewImage.getAttribute('src');
    const game = {
        id: `local-${Date.now()}`,
        title: document.getElementById('gameName').value.trim(),
        short_description: description.value.trim(),
        genre: document.getElementById('category').value,
        platform: document.getElementById('platform').value,
        game_url: document.getElementById('gameUrl').value.trim(),
        thumbnail: image || '',
        release_date: new Date().toISOString().slice(0, 10),
        publisher: 'GameX community',
        developer: 'GameX developer'
    };

    try {
        const uploadedGames = JSON.parse(localStorage.getItem(LOCAL_GAMES_KEY) || '[]');
        uploadedGames.unshift(game);
        localStorage.setItem(LOCAL_GAMES_KEY, JSON.stringify(uploadedGames));
        formMessage.textContent = 'Đăng game thành công! Đang chuyển về kho game...';
        window.setTimeout(() => {
            window.location.href = 'index.html';
        }, 700);
    } catch (error) {
        console.error('Không thể lưu game trên trình duyệt:', error);
        formMessage.textContent = 'Không thể lưu game. Vui lòng thử lại hoặc dùng ảnh nhỏ hơn.';
    }
});
