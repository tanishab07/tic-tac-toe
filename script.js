/* TIC TAC TOE - GAME SETTINGS */

const SCORE_KEY = "ticTacToeScores";
const MODE_KEY = "ticTacToeMode";

const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

const boxes = document.querySelectorAll(".box");
const modeSelect = document.querySelector("#gameMode");
const newButton = document.querySelector("#new-btn");

const playerScoreElement = document.querySelector("#playerScore");
const drawScoreElement = document.querySelector("#drawScore");
const player2ScoreElement = document.querySelector("#player2Score");

let mode = localStorage.getItem(MODE_KEY) || "two-player";
let playerTurn = "X";
let moveCount = 0;
let gameActive = true;


/* SCORE MANAGEMENT */

// Read scores saved in localStorage.
// Also support the older score keys if needed.

function getScores() {
    try {
        const saved = localStorage.getItem(SCORE_KEY);

        if (saved) {
            const parsed = JSON.parse(saved);

            return {
                user1: Number(parsed.user1) || 0,
                draws: Number(parsed.draws) || 0,
                user2: Number(parsed.user2) || 0
            };
        }
    } catch (error) {
        console.warn("Could not read saved scores.", error);
    }

    return {
        user1: Number(localStorage.getItem("user1Score")) || 0,
        draws: Number(localStorage.getItem("drawScore")) || 0,
        user2: Number(localStorage.getItem("user2Score")) || 0
    };
}

let scores = getScores();

function saveScores() {
    localStorage.setItem(SCORE_KEY, JSON.stringify(scores));
    displayScores();
}

function displayScores() {
    if (playerScoreElement) {
        playerScoreElement.textContent = scores.user1;
    }

    if (drawScoreElement) {
        drawScoreElement.textContent = scores.draws;
    }

    if (player2ScoreElement) {
        player2ScoreElement.textContent = scores.user2;
    }

    updateScoreLabels();
}

function updateScoreLabels() {
    const secondLabel = player2ScoreElement?.parentElement
        ?.querySelector("p");

    if (secondLabel) {
        secondLabel.textContent = mode === "ai"
            ? "AI"
            : "Player2";
    }
}

function updateScore(result) {
    if (result === "X") {
        scores.user1++;
    } else if (result === "O") {
        scores.user2++;
    } else if (result === "draw") {
        scores.draws++;
    }

    saveScores();
}

function resetScores() {
    scores = {
        user1: 0,
        draws: 0,
        user2: 0
    };

    saveScores();

    // Also clear older keys so old scores don't reappear.
    localStorage.removeItem("user1Score");
    localStorage.removeItem("drawScore");
    localStorage.removeItem("user2Score");
}


/* GAME MODE */

if (mode !== "ai" && mode !== "two-player") {
    mode = "two-player";
}

if (modeSelect) {
    modeSelect.value = mode;

    modeSelect.addEventListener("change", function () {
        mode = modeSelect.value;
        localStorage.setItem(MODE_KEY, mode);

        updateScoreLabels();
        startNewRound();
    });
}


/* BOARD MANAGEMENT */

function startNewRound() {
    playerTurn = "X";
    moveCount = 0;
    gameActive = true;

    boxes.forEach(function (box) {
        box.textContent = "";
        box.disabled = false;
    });
}

function getBoard() {
    return Array.from(boxes, function (box) {
        return box.textContent.trim();
    });
}

function checkWinner(board = getBoard()) {
    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;

        if (
            board[a] !== "" &&
            board[a] === board[b] &&
            board[b] === board[c]
        ) {
            return board[a];
        }
    }

    return null;
}

function finishRound(result) {
    if (!gameActive) return;

    // Prevent duplicate score updates.
    gameActive = false;

    boxes.forEach(function (box) {
        box.disabled = true;
    });

    updateScore(result);

    if (result === "X") {
        window.location.href = "winner.html";
    } else if (result === "O") {
        window.location.href = "winner2.html";
    } else {
        window.location.href = "draw.html";
    }
}

function checkRoundEnd() {
    const winner = checkWinner();

    if (winner) {
        finishRound(winner);
        return true;
    }

    if (moveCount === 9) {
        finishRound("draw");
        return true;
    }

    return false;
}


/* TWO-PLAYER MODE */

function handleTwoPlayerMove(box) {
    box.textContent = playerTurn;
    box.disabled = true;
    moveCount++;

    if (checkRoundEnd()) return;

    playerTurn = playerTurn === "X" ? "O" : "X";
}


/* AI MODE - MINIMAX ALGORITHM */

// The AI plays O. The human plays X.
// Minimax searches possible future moves and
// chooses the move with the best outcome.

function minimax(board, isMaximizing, depth) {
    const winner = checkWinner(board);

    if (winner === "O") return 10 - depth;
    if (winner === "X") return depth - 10;
    if (board.every(cell => cell !== "")) return 0;

    if (isMaximizing) {
        let bestScore = -Infinity;

        for (let i = 0; i < 9; i++) {
            if (board[i] === "") {
                board[i] = "O";

                const score = minimax(board, false, depth + 1);

                board[i] = "";
                bestScore = Math.max(bestScore, score);
            }
        }

        return bestScore;
    } else {
        let bestScore = Infinity;

        for (let i = 0; i < 9; i++) {
            if (board[i] === "") {
                board[i] = "X";

                const score = minimax(board, true, depth + 1);

                board[i] = "";
                bestScore = Math.min(bestScore, score);
            }
        }

        return bestScore;
    }
}

function makeAIMove() {
    if (!gameActive) return;

    const board = getBoard();
    let bestScore = -Infinity;
    let bestMove = -1;

    for (let i = 0; i < 9; i++) {
        if (board[i] === "") {
            board[i] = "O";

            const score = minimax(board, false, 0);

            board[i] = "";

            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }

    if (bestMove === -1) return;

    boxes[bestMove].textContent = "O";
    boxes[bestMove].disabled = true;
    moveCount++;

    checkRoundEnd();
}


/* BOX CLICK EVENTS */

boxes.forEach(function (box) {
    box.addEventListener("click", function () {
        if (!gameActive || box.disabled) return;
        if (box.textContent.trim() !== "") return;

        // In AI mode, the human always plays X.
        if (mode === "ai") {
            box.textContent = "X";
            box.disabled = true;
            moveCount++;

            if (checkRoundEnd()) return;

            makeAIMove();
            return;
        }

        // In two-player mode, X and O alternate.
        handleTwoPlayerMove(box);
    });
});


/* NEW ROUND BUTTON */

if (newButton) {
    newButton.addEventListener("click", startNewRound);
}


/* PLAY AGAIN BUTTON */

const playAgainButton = document.querySelector("#playAgainBtn");

if (playAgainButton) {
    playAgainButton.addEventListener("click", function () {
        window.location.href = "index.html";
    });
}


/* RESET SCORE BUTTON */

const resetButtons = document.querySelectorAll(".secondary-btn");

resetButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        const confirmed = window.confirm(
            "Are you sure you want to reset all the scores?"
        );

        // Cancel means no changes.
        if (!confirmed) return;

        resetScores();

        // If we're on the game page, clear the current board too.
        if (boxes.length > 0) {
            startNewRound();
        }
    });
});


/* RESULT PAGE TEXT */

function updateResultPage() {
    const resultTitle = document.querySelector("#resultTitle");
    const resultMessage = document.querySelector("#resultMessage");

    if (!resultTitle || !resultMessage) return;

    if (mode === "ai" && window.location.pathname.endsWith("winner2.html")) {
        resultTitle.textContent = "AI Wins!";
        resultMessage.textContent =
            "The AI won this round. Try again!";
    } else if (
        mode === "ai" &&
        window.location.pathname.endsWith("winner.html")
    ) {
        resultTitle.textContent = "You Win!";
        resultMessage.textContent =
            "Amazing! You beat the AI!";
    }
}


/* INITIALIZE */

displayScores();
updateResultPage();

// Start with a clean board on index.html.
// The result pages have no game boxes, so this
// will not affect them.
if (boxes.length > 0) {
    startNewRound();
}
