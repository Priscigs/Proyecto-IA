const io = require('socket.io-client');
const serverUrl = "http://192.168.1.104:4000";
const socket = io(serverUrl);

// Variables globales
let gameID = null;
let playerTurnID = null;
let board = null;

// Conectar.
socket.on('connect', () => {
    console.log("Connected to server");

    socket.emit('signin', {
        user_name: "Prisci",
        tournament_id: 142857,
        user_role: 'player'
    });
});

// Sign in correcto.
socket.on('ok_signin', () => {
    console.log("Login");
});

// Ready.
socket.on('ready', function(data){
    gameID = data.game_id;
    playerTurnID = data.player_turn_id;
    board = data.board;

    console.log(data)

    // Lógica de la IA
    setTimeout(() => {
        const movement = makeMove(playerTurnID, board);
        sendMove(movement);
    }, 50); // Retraso de medio segundo (500 milisegundos)
});

// Finish.
socket.on('finish', function(data){
    gameID = data.game_id;
    playerTurnID = data.player_turn_id;
    const winnerTurnID = data.winner_turn_id;
    board = data.board;

    socket.emit("player_ready",{
        tournament_id:"142857",
        player_turn_id:playerTurnID,
        game_id:gameID
    })

    // Continuar jugando si el juego no ha terminado
    if (winnerTurnID === null) {
        setTimeout(() => {
            const movement = makeMove(playerTurnID, board);
            sendMove(movement);
        }, 50); // Retraso de medio segundo (500 milisegundos)
    }
});

// Función para enviar el movimiento al servidor
function sendMove(movement) {
    socket.emit('play', {
        tournament_id: 142857,
        player_turn_id: playerTurnID,
        game_id: gameID,
        movement: movement
    });
}

// Función para tomar la decisión de movimiento utilizando Minimax con poda alpha-beta
function makeMove(playerTurnID, currentBoard) {
    const availableMoves = getAvailableMoves(currentBoard);
    let bestScore = -Infinity;
    let bestMove = null;

    for (let i = 0; i < availableMoves.length; i++) {
        const move = availableMoves[i];
        const newBoard = makeMoveOnBoard(currentBoard, move, playerTurnID);
        const score = minimax(newBoard, 4, -Infinity, Infinity, false, playerTurnID);

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    console.log("AI move:", bestMove); // Imprimir el movimiento de la IA
    return bestMove;
}

// Función de evaluación básica para el tablero (debes mejorarla para adaptarla a Connect 4)
function evaluateBoard(board, playerTurnID) {
    const playerChar = playerTurnID === 1 ? 'X' : 'O';
    const opponentChar = playerTurnID === 1 ? 'O' : 'X';
    let score = 0;

    // Evaluar filas
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 4; j++) {
            const line = board[i].slice(j, j + 4);
            score += evaluateLine(line, playerChar, opponentChar);
        }
    }

    // Evaluar columnas
    for (let j = 0; j < 7; j++) {
        for (let i = 0; i < 3; i++) {
            const line = [board[i][j], board[i + 1][j], board[i + 2][j], board[i + 3][j]];
            score += evaluateLine(line, playerChar, opponentChar);
        }
    }

    // Evaluar diagonales hacia abajo
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 4; j++) {
            const line = [board[i][j], board[i + 1][j + 1], board[i + 2][j + 2], board[i + 3][j + 3]];
            score += evaluateLine(line, playerChar, opponentChar);
        }
    }

    // Evaluar diagonales hacia arriba
    for (let i = 3; i < 6; i++) {
        for (let j = 0; j < 4; j++) {
            const line = [board[i][j], board[i - 1][j + 1], board[i - 2][j + 2], board[i - 3][j + 3]];
            score += evaluateLine(line, playerChar, opponentChar);
        }
    }

    return score;
}

function evaluateLine(line, playerChar, opponentChar) {
    let playerCount = 0;
    let opponentCount = 0;

    for (let i = 0; i < 4; i++) {
        if (line[i] === playerChar) {
            playerCount++;
        } else if (line[i] === opponentChar) {
            opponentCount++;
        }
    }

    if (playerCount === 4) {
        return 1000; // Jugador gana
    } else if (opponentCount === 4) {
        return -1000; // Oponente gana
    } else if (playerCount === 3 && opponentCount === 0) {
        return 100; // Jugador tiene 3 fichas consecutivas
    } else if (playerCount === 0 && opponentCount === 3) {
        return -100; // Oponente tiene 3 fichas consecutivas
    } else if (playerCount === 2 && opponentCount === 0) {
        return 10; // Jugador tiene 2 fichas consecutivas
    } else if (playerCount === 0 && opponentCount === 2) {
        return -10; // Oponente tiene 2 fichas consecutivas
    } else {
        return 0; // No hay secuencias significativas
    }
}

// Función para obtener los movimientos disponibles en el tablero
function getAvailableMoves(board) {
    const availableMoves = [];
    for (let j = 0; j < 7; j++) {
        if (board[0][j] === 0) {
            availableMoves.push(j);
        }
    }
    return availableMoves;
}

// Función para realizar un movimiento en el tablero
function makeMoveOnBoard(board, move, playerTurnID) {
    const newBoard = [...board.map(row => [...row])];
    for (let i = 5; i >= 0; i--) {
        if (newBoard[i][move] === 0) {
            newBoard[i][move] = playerTurnID;
            break;
        }
    }
    return newBoard;
}

// Función de Minimax con poda Alpha-Beta
function minimax(board, depth, alpha, beta, maximizingPlayer, playerTurnID) {
    const availableMoves = getAvailableMoves(board);
    const opponentTurnID = playerTurnID === 1 ? 2 : 1;

    if (depth === 0 || availableMoves.length === 0) {
        return evaluateBoard(board, playerTurnID);
    }

    if (maximizingPlayer) {
        let maxScore = -Infinity;
        for (let i = 0; i < availableMoves.length; i++) {
            const move = availableMoves[i];
            const newBoard = makeMoveOnBoard(board, move, playerTurnID);
            const score = minimax(newBoard, depth - 1, alpha, beta, false, opponentTurnID);
            maxScore = Math.max(maxScore, score);
            alpha = Math.max(alpha, score);
            if (beta <= alpha) {
                break; // Podar el subárbol restante
            }
        }
        return maxScore;
    } else {
        let minScore = Infinity;
        for (let i = 0; i < availableMoves.length; i++) {
            const move = availableMoves[i];
            const newBoard = makeMoveOnBoard(board, move, opponentTurnID);
            const score = minimax(newBoard, depth - 1, alpha, beta, true, opponentTurnID);
            minScore = Math.min(minScore, score);
            beta = Math.min(beta, score);
            if (beta <= alpha) {
                break; // Podar el subárbol restante
            }
        }
        return minScore;
    }
}
