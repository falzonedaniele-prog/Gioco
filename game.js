// Canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 1200;
canvas.height = 800;

// Game constants
const GRAVITY = 0.6;
const JUMP_STRENGTH = 12;
const WALK_SPEED = 5;
const LEVEL_COUNT = 3;

// Game state
let gameState = {
    currentLevel: 0,
    memoryFragmentsCollected: 0,
    gameProgress: 0,
    gameStartTime: 0,
    gameOver: false,
    gameWon: false,
    currentMessage: '',
    messageTimer: 0,
    desaturation: 0,
    playerResetCount: 0
};

// Player object
let player = {
    x: 0,
    y: 0,
    width: 24,
    height: 24,
    velocityX: 0,
    velocityY: 0,
    jumping: false,
    grounded: false
};

// Player image
const playerImage = new Image();
playerImage.src = 'images/cursor.png';

// Keyboard input
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Level definitions
const levels = [
    {
        name: "The Desktop",
        narrative: "A familiar place, corrupted. Find what remains before it's gone forever.",
        platforms: [
            { x: 100, y: 700, w: 150, h: 20 },
            { x: 350, y: 650, w: 120, h: 20 },
            { x: 600, y: 600, w: 100, h: 20 },
            { x: 800, y: 550, w: 120, h: 20 },
            { x: 1000, y: 600, w: 150, h: 20 },
            { x: 200, y: 450, w: 100, h: 20 },
            { x: 500, y: 400, w: 130, h: 20 },
            { x: 800, y: 350, w: 140, h: 20 },
            { x: 1050, y: 300, w: 100, h: 20 }
        ],
        hazards: [
            { x: 400, y: 500, w: 50, h: 50 },
            { x: 900, y: 450, w: 40, h: 40 }
        ],
        memoryFragments: [
            { x: 600, y: 550, collected: false, color: '#FF6B9D' }
        ],
        triggers: [
            { x: 100, y: 600, w: 200, h: 100, text: "Memory Fragment 1: A child's laugh." }
        ],
        spawnX: 120,
        spawnY: 650
    },
    {
        name: "The Fade",
        narrative: "Colors drain away. Platforms crumble. Time is running out.",
        platforms: [
            { x: 50, y: 700, w: 120, h: 20 },
            { x: 300, y: 650, w: 100, h: 20 },
            { x: 550, y: 580, w: 90, h: 20 },
            { x: 750, y: 500, w: 80, h: 20 },
            { x: 950, y: 420, w: 100, h: 20 },
            { x: 150, y: 380, w: 110, h: 20 },
            { x: 450, y: 320, w: 95, h: 20 },
            { x: 750, y: 250, w: 85, h: 20 },
            { x: 1050, y: 200, w: 100, h: 20 }
        ],
        hazards: [
            { x: 200, y: 600, w: 60, h: 60 },
            { x: 650, y: 500, w: 50, h: 50 },
            { x: 500, y: 400, w: 70, h: 40 }
        ],
        memoryFragments: [
            { x: 550, y: 530, collected: false, color: '#4ECDC4' }
        ],
        triggers: [
            { x: 750, y: 400, w: 150, h: 120, text: "Memory Fragment 2: A loyal companion." }
        ],
        spawnX: 70,
        spawnY: 650
    },
    {
        name: "The Void",
        narrative: "Everything is fading. Only memories remain. Make the final jump.",
        platforms: [
            { x: 50, y: 700, w: 100, h: 20 }, //spawn platform
            { x: 300, y: 650, w: 80, h: 20 }, //first platform
            { x: 550, y: 580, w: 70, h: 20 }, //second platform
            { x: 790, y: 505, w: 80, h: 20 }, //third platform
            { x: 650, y: 400, w: 100, h: 20 }, //forth platform
            { x: 400, y: 230, w: 75, h: 20 }, //sixth platform
            { x: 550, y: 280, w: 85, h: 20 }, //fifth platform
            { x: 900, y: 200, w: 90, h: 20 }, //final platform
            { x: 600, y: 100, w: 150, h: 30 } // seventh platform
        ],
        hazards: [
            { x: 400, y: 600, w: 80, h: 50 }, //fist hazard
            { x: 700, y: 550, w: 60, h: 60 }, //second hazard
            { x: 300, y: 300, w: 90, h: 40 } //third hazard
        ],
        memoryFragments: [
            { x: 900, y: 150, collected: false, color: '#FFE66D' }
        ],
        triggers: [
            { x: 600, y: 50, w: 150, h: 100, text: "Memory Fragment 3: A moment of triumph." }
        ],
        spawnX: 70, 
        spawnY: 650 
    }
];

// Initialize game
function initGame() {
    gameState.gameStartTime = Date.now();
    gameState.currentLevel = 0;
    gameState.memoryFragmentsCollected = 0;
    gameState.gameOver = false;
    gameState.gameWon = false;
    gameState.playerResetCount = 0;
    loadLevel(0);
}

function loadLevel(levelIndex) {
    gameState.currentLevel = levelIndex;
    const level = levels[levelIndex];
    
    player.x = level.spawnX;
    player.y = level.spawnY;
    player.velocityX = 0;
    player.velocityY = 0;
    player.grounded = false;
    
    gameState.currentMessage = level.narrative;
    gameState.messageTimer = 300;
    gameState.desaturation = levelIndex * 0.3;
}

// Main game loop
function update() {
    if (gameState.gameOver || gameState.gameWon) {
        return;
    }

    const level = levels[gameState.currentLevel];
    
    // Update progress
    const elapsedSeconds = (Date.now() - gameState.gameStartTime) / 1000;
    gameState.gameProgress = Math.min(100, (elapsedSeconds / 60) * 100); // 60 second timer
    
    if (gameState.gameProgress >= 100) {
        gameState.gameOver = true;
        gameState.currentMessage = "SYSTEM SHUTDOWN: Data erased.";
        gameState.messageTimer = 400;
    }

    // Handle player input
    player.velocityX = 0;
    if (keys['arrowleft'] || keys['a']) {
        player.velocityX = -WALK_SPEED;
    }
    if (keys['arrowright'] || keys['d']) {
        player.velocityX = WALK_SPEED;
    }
    if ((keys[' '] || keys['arrowup'] || keys['w']) && player.grounded) {
        player.velocityY = -JUMP_STRENGTH;
        player.grounded = false;
    }

    // Apply gravity
    player.velocityY += GRAVITY;
    if (player.velocityY > 20) player.velocityY = 20; // Terminal velocity

    // Update player position
    player.x += player.velocityX;
    player.y += player.velocityY;

    // Reset grounded state
    player.grounded = false;

    // Platform collision
    for (let platform of level.platforms) {
        if (
            player.velocityY >= 0 &&
            player.y + player.height >= platform.y &&
            player.y + player.height <= platform.y + platform.h + 5 &&
            player.x + player.width > platform.x &&
            player.x < platform.x + platform.w
        ) {
            player.y = platform.y - player.height;
            player.velocityY = 0;
            player.grounded = true;
        }
    }

    // Check if a point is inside a triangle
function isPointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
    // Barycentric coordinate method
    const v0x = cx - ax, v0y = cy - ay;
    const v1x = bx - ax, v1y = by - ay;
    const v2x = px - ax, v2y = py - ay;

    const dot00 = v0x * v0x + v0y * v0y;
    const dot01 = v0x * v1x + v0y * v1y;
    const dot02 = v0x * v2x + v0y * v2y;
    const dot11 = v1x * v1x + v1y * v1y;
    const dot12 = v1x * v2x + v1y * v2y;

    const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    return (u >= 0) && (v >= 0) && (u + v <= 1);
}

// Hazard collision (triangular)
    for (let hazard of level.hazards) {
        // Triangle vertices
        const ax = hazard.x + hazard.w / 2;  // top center
        const ay = hazard.y;
        const bx = hazard.x + hazard.w;       // bottom right
        const by = hazard.y + hazard.h;
        const cx = hazard.x;                  // bottom left
        const cy = hazard.y + hazard.h;

        // Check multiple points on player for better detection
        const checkPoints = [
            { x: player.x + player.width / 2, y: player.y + player.height }, // bottom center
            { x: player.x + player.width / 2, y: player.y + player.height / 2 }, // center
            { x: player.x, y: player.y + player.height }, // bottom left
            { x: player.x + player.width, y: player.y + player.height } // bottom right
        ];

        for (let point of checkPoints) {
            if (isPointInTriangle(point.x, point.y, ax, ay, bx, by, cx, cy)) {
                resetPlayer();
                break;
            }
        }
    }

    // Falling into void
    if (player.y > canvas.height) {
        resetPlayer();
    }

    // Screen boundaries
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Memory fragment collection
    for (let fragment of level.memoryFragments) {
        if (!fragment.collected &&
            player.x + player.width > fragment.x - 15 &&
            player.x < fragment.x + 15 &&
            player.y + player.height > fragment.y - 15 &&
            player.y < fragment.y + 15
        ) {
            fragment.collected = true;
            gameState.memoryFragmentsCollected++;
            gameState.currentMessage = "Memory Fragment collected!";
            gameState.messageTimer = 200;
        }
    }

    // Check level completion
    if (gameState.currentLevel < LEVEL_COUNT - 1) {
        if (gameState.memoryFragmentsCollected === gameState.currentLevel + 1) {
            advanceLevel();
        }
    } else if (gameState.memoryFragmentsCollected === LEVEL_COUNT) {
        completeGame();
    }

    // Trigger zones
    for (let trigger of level.triggers) {
        if (
            player.x + player.width > trigger.x &&
            player.x < trigger.x + trigger.w &&
            player.y + player.height > trigger.y &&
            player.y < trigger.y + trigger.h
        ) {
            gameState.currentMessage = trigger.text;
            gameState.messageTimer = 250;
        }
    }

    // Message timer
    if (gameState.messageTimer > 0) {
        gameState.messageTimer--;
    }
}

function resetPlayer() {
    const level = levels[gameState.currentLevel];
    player.x = level.spawnX;
    player.y = level.spawnY;
    player.velocityX = 0;
    player.velocityY = 0;
    player.grounded = false;
    gameState.playerResetCount++;
}

function advanceLevel() {
    gameState.currentLevel++;
    loadLevel(gameState.currentLevel);
}

function completeGame() {
    gameState.gameWon = true;
    gameState.currentMessage = "UPLOAD COMPLETE: Memories preserved in the Cloud. You saved them.";
    gameState.messageTimer = 500;
}

// Rendering
function draw() {
    // Clear canvas with fade effect
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const level = levels[gameState.currentLevel];

    // Apply desaturation effect
    ctx.globalAlpha = 1;
    ctx.filter = `grayscale(${gameState.desaturation})`;

    // Draw platforms
    ctx.fillStyle = '#333333';
    for (let platform of level.platforms) {
        ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 2;
        ctx.strokeRect(platform.x, platform.y, platform.w, platform.h);
    }

    // Draw hazards (red triangles)
    ctx.fillStyle = '#FF4444';
    for (let hazard of level.hazards) {
        ctx.beginPath();
        ctx.moveTo(hazard.x + hazard.w / 2, hazard.y);
        ctx.lineTo(hazard.x + hazard.w, hazard.y + hazard.h);
        ctx.lineTo(hazard.x, hazard.y + hazard.h);
        ctx.closePath();
        ctx.fill();
    }

    // Draw memory fragments
    for (let fragment of level.memoryFragments) {
        if (!fragment.collected) {
            ctx.fillStyle = fragment.color;
            ctx.globalAlpha = 0.8 + Math.sin(Date.now() / 100) * 0.2;
            ctx.beginPath();
            ctx.arc(fragment.x, fragment.y, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    ctx.filter = 'none';

    // Draw player (cursor image)
    const glowSize = 4 + Math.sin(Date.now() / 50) * 2;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = glowSize;
    if (playerImage.complete && playerImage.naturalWidth !== 0) {
        ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
    } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
    ctx.shadowBlur = 0;

    // Draw UI
    drawUI();
}

function drawUI() {
    // Progress bar frame
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 30, 300, 20);

    // Progress bar fill
    const progressWidth = (gameState.gameProgress / 100) * 300;
    ctx.fillStyle = gameState.gameProgress > 80 ? '#FF4444' : '#FF9900';
    ctx.fillRect(50, 30, progressWidth, 20);

    // Progress text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px "Courier New"';
    ctx.textAlign = 'left';
    ctx.fillText(`FORMATTING: ${Math.floor(gameState.gameProgress)}%`, 60, 46);

    // Memory counter
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`MEMORIES: ${gameState.memoryFragmentsCollected}/${LEVEL_COUNT}`, 50, 80);

    // Level info
    ctx.fillStyle = '#808080';
    ctx.font = '14px "Courier New"';
    ctx.textAlign = 'right';
    ctx.fillText(`LEVEL ${gameState.currentLevel + 1}/${LEVEL_COUNT}`, canvas.width - 50, 50);

    // Current message
    if (gameState.messageTimer > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${gameState.messageTimer / 300})`;
        ctx.font = 'bold 14px "Courier New"';
        ctx.textAlign = 'center';
        wrapText(ctx, gameState.currentMessage, canvas.width / 2, canvas.height - 80, 600, 20);
    }

    // Game over screen
    if (gameState.gameOver && !gameState.gameWon) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#FF4444';
        ctx.font = 'bold 48px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('SYSTEM ERROR', canvas.width / 2, canvas.height / 2 - 50);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px "Courier New"';
        ctx.fillText('The computer has been formatted.', canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText('Refresh to try again.', canvas.width / 2, canvas.height / 2 + 50);
    }

    // Game won screen
    if (gameState.gameWon) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#4ECDC4';
        ctx.font = 'bold 48px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('UPLOAD COMPLETE', canvas.width / 2, canvas.height / 2 - 60);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px "Courier New"';
        ctx.fillText('Three memories preserved in the Cloud.', canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillText('They will never be forgotten.', canvas.width / 2, canvas.height / 2 + 40);
        ctx.fillText('Refresh to play again.', canvas.width / 2, canvas.height / 2 + 70);
    }
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let lines = [];

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    for (let n = 0; n < lines.length; n++) {
        context.fillText(lines[n], x, y + n * lineHeight);
    }
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start game
initGame();
gameLoop();
