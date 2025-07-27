const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const hitZoneX = 100;
const noteSpeed = 200;
const spawnInterval = 1000;
let notes = [];
let score = 0;
let effects = [];

function spawnHeart() {
    const now = performance.now();
    notes.push({
        time: now,
        x: canvas.width,
        hit: false,
        autoMissed: false
    });
}

function startGame() {
    spawnHeartRandom(); // 最初のノートを生成
    requestAnimationFrame(gameLoop);
}


function spawnHeartRandom() {
    const now = performance.now();
    const y = 60 + Math.random() * 80;

    notes.push({
        time: now,
        x: canvas.width,
        y: y,
        hit: false,
        autoMissed: false
    });

    // 次のノート生成間隔を 0.5秒〜1.5秒のランダムに
    const nextInterval = 100 + Math.random() * 1000;

    setTimeout(spawnHeartRandom, nextInterval);
}

function gameLoop(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 枠線だけのヒットゾーンハート
    drawHeart(hitZoneX, 100, 20, null, "#ccc");

    // ノート描画・移動・自動MISS判定
    notes.forEach(note => {
        const dt = (timestamp - note.time) / 1000;
        note.x = canvas.width - dt * noteSpeed;

        if (!note.hit && note.x > 0 && note.x < canvas.width) {
            drawHeart(note.x, 100, 20);
        }

        // 自動MISS判定（30px以上通過したら）
        if (!note.hit && !note.autoMissed && note.x < hitZoneX - 30) {
            note.autoMissed = true;
            showJudgement("MISS", "#aaa");
        }
    });

    // エフェクト表示（PERFECT / GOOD）
    effects = effects.filter(effect => effect.age < 0.3);
    effects.forEach(effect => {
        effect.age += 1 / 60;
        const scale = 1 + effect.age * 3;
        const alpha = 1 - (effect.age / 0.3);
        drawHeart(
            effect.x,
            effect.y,
            20 * scale,
            effect.color,
            null,
            alpha
        );
    });

    requestAnimationFrame(gameLoop);
}

function drawHeart(x, y, size, fill = "#ff5a8c", stroke = null, alpha = 1.0) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x, y - size, x - size, y - size, x - size, y);
    ctx.bezierCurveTo(x - size, y + size, x, y + size * 1.5, x, y + size * 2);
    ctx.bezierCurveTo(x, y + size * 1.5, x + size, y + size, x + size, y);
    ctx.bezierCurveTo(x + size, y - size, x, y - size, x, y);
    if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
    }
    if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    ctx.restore();
}

function updateScore() {
    document.getElementById("score").textContent = `いいね: ${score}`;
}

function showJudgement(text, color = "#333") {
    const el = document.getElementById("judgement");
    el.textContent = text;
    el.style.color = color;
    el.style.opacity = 1;

    setTimeout(() => {
        el.style.opacity = 0;
    }, 300);
}

canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dx = x - hitZoneX;
    const dy = y - 100;
    if (Math.sqrt(dx * dx + dy * dy) > 30) return;

    const now = performance.now();
    const hitNote = notes.find(note =>
        !note.hit && Math.abs(note.x - hitZoneX) < 40
    );

    if (hitNote) {
        hitNote.hit = true;
        const diff = Math.abs(hitNote.x - hitZoneX);
        let result = "";
        let color = "";

        if (diff < 4) {
            result = "PERFECT";
            score += 2;
            color = "#ffd700";
        } else if (diff < 12) {
            result = "GOOD";
            score += 1;
            color = "#ff69b4";
        } else {
            result = "BAD";
            score += 0;
        }

        if (color) {
            effects.push({ x: hitZoneX, y: 100, age: 0, color });
        }

        showJudgement(result, color || "#999");
    } else {
        showJudgement("MISS", "#aaa");
    }

    updateScore();
});

startGame();
