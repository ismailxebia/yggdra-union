const boardSize = 15;
const moveRange = 3;
const attackRange = 1;
const magicRange = 2;

let characterPosition = { x: 5, y: 5 };
let enemyPosition = { x: 10, y: 8 };
let isCharacterSelected = false;
let previousPosition = { ...characterPosition };
let targetPosition = null;
let isActionMenuActive = false;
let pathGrids = [];
let initialPosition = { ...characterPosition };
let isMoving = false;
let currentTurn = 1;
let turnPhase = 'allies'; // 'allies' or 'enemies'

const gameBoard = document.getElementById('gameBoard');
const actionMenu = document.getElementById('actionMenu');
const turnOverlay = document.getElementById('turnOverlay');
const turnText = document.getElementById('turnText');

function createBoard() {
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            const cell = document.createElement('div');
            cell.className = 'gridCell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            gameBoard.appendChild(cell);
        }
    }
    updateCharacterPosition();
}

function updateCharacterPosition() {
    document.querySelectorAll('.gridCell').forEach(cell => {
        cell.classList.remove('character', 'enemy', 'movable', 'path', 'initialPosition');
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        // Reset event listener
        cell.removeEventListener('click', moveCharacter);
        cell.removeEventListener('click', selectCharacter);

        if (row === characterPosition.x && col === characterPosition.y) {
            cell.classList.add('character');
            // Hanya tambahkan event listener jika turn allies dan karakter belum dipilih
            if (turnPhase === 'allies' && !isActionMenuActive) {
                cell.addEventListener('click', selectCharacter);
            }
        }

        if (row === enemyPosition.x && col === enemyPosition.y) {
            cell.classList.add('enemy');
        }

        if (initialPosition && row === initialPosition.x && col === initialPosition.y) {
            cell.classList.add('initialPosition');
        }

        // Hanya tambahkan event listener pada grid sekitar karakter jika karakter sedang dipilih
        if (isCharacterSelected && Math.abs(row - initialPosition.x) + Math.abs(col - initialPosition.y) <= moveRange && !(row === enemyPosition.x && col === enemyPosition.y)) {
            cell.classList.add('movable');
            cell.addEventListener('click', moveCharacter);
        }

        pathGrids.forEach(pos => {
            if (pos.x === row && pos.y === col) {
                cell.classList.add('path');
            }
        });
    });
}

function selectCharacter() {
    if (isActionMenuActive) return;

    if (!isCharacterSelected) {
        isCharacterSelected = true;
        previousPosition = { ...characterPosition };
        showInitialActionMenu();  // Tampilkan action menu di awal seleksi
        updateCharacterPosition(); // Update posisi dan highlight
    }
}

function moveCharacter(event) {
    if (isActionMenuActive) return;
    const newX = parseInt(event.target.dataset.row);
    const newY = parseInt(event.target.dataset.col);

    if ((Math.abs(newX - initialPosition.x) + Math.abs(newY - initialPosition.y) > moveRange) || (newX === enemyPosition.x && newY === enemyPosition.y)) {
        return; 
    }

    if (newX >= 0 && newX < boardSize && newY >= 0 && newY < boardSize) {
        targetPosition = { x: newX, y: newY };
        animateCharacterMove(characterPosition, targetPosition, () => {
            characterPosition = { ...targetPosition };
            isCharacterSelected = false;
            isMoving = false;
            showActionMenu();
        });
    } else {
        characterPosition = { ...previousPosition };
    }

    highlightMovement();
}

function animateCharacterMove(start, end, callback) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    let stepX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
    let stepY = dy === 0 ? 0 : dy > 0 ? 1 : -1;

    function step() {
        if (start.x !== end.x || start.y !== end.y) {
            // Hanya gerakkan karakter jika belum mencapai tujuan
            if (start.x !== end.x) {
                start.x += stepX;
            } else if (start.y !== end.y) {
                start.y += stepY;
            }
            pathGrids.push({ x: start.x, y: start.y });
            updateCharacterPosition();
        }

        // Pastikan pergerakan berhenti ketika karakter mencapai tujuan
        if (start.x === end.x && start.y === end.y) {
            if (callback) callback();
        } else {
            // Tambahkan delay untuk mengontrol kecepatan animasi
            setTimeout(step, 200);
        }
    }

    step();
}

function highlightMovement() {
    if (!isCharacterSelected) return;
    document.querySelectorAll('.gridCell').forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        if (Math.abs(row - initialPosition.x) + Math.abs(col - initialPosition.y) <= moveRange) {
            cell.classList.add('movable');
        }
    });
}

function showInitialActionMenu() {
    isActionMenuActive = true;
    const finalCell = document.querySelector(`.gridCell[data-row="${characterPosition.x}"][data-col="${characterPosition.y}"]`);
    const rect = finalCell.getBoundingClientRect();
    actionMenu.style.top = `${rect.top + rect.height}px`;
    actionMenu.style.left = `${rect.left}px`;

    const distanceToEnemy = Math.abs(characterPosition.x - enemyPosition.x) + Math.abs(characterPosition.y - enemyPosition.y);

    actionMenu.querySelectorAll('li').forEach(li => {
        if (li.innerText === 'Move') {
            li.style.display = 'block';
        } else if (li.innerText === 'Attack' && distanceToEnemy <= attackRange) {
            li.style.display = 'block';
        } else if (li.innerText === 'Magic' && distanceToEnemy <= magicRange) {
            li.style.display = 'block';
        } else if (li.innerText === 'Wait' || li.innerText === 'Back') {
            li.style.display = 'block';
        } else {
            li.style.display = 'none';
        }
    });

    actionMenu.classList.remove('hidden');
    highlightMovement();
}

function showActionMenu() {
    if (targetPosition && (targetPosition.x !== previousPosition.x || targetPosition.y !== previousPosition.y)) {
        isActionMenuActive = true;
        const finalCell = document.querySelector(`.gridCell[data-row="${characterPosition.x}"][data-col="${characterPosition.y}"]`);
        const rect = finalCell.getBoundingClientRect();
        actionMenu.style.top = `${rect.top + rect.height}px`;
        actionMenu.style.left = `${rect.left}px`;
        
        const distanceToEnemy = Math.abs(characterPosition.x - enemyPosition.x) + Math.abs(characterPosition.y - enemyPosition.y);
        actionMenu.querySelectorAll('li').forEach(li => {
            if (li.innerText === 'Move') {
                li.style.display = 'none';
            } else if (li.innerText === 'Attack' && distanceToEnemy <= attackRange) {
                li.style.display = 'block';
            } else if (li.innerText === 'Magic' && distanceToEnemy <= magicRange) {
                li.style.display = 'block';
            } else if (li.innerText === 'Wait' || li.innerText === 'Back') {
                li.style.display = 'block';
            } else {
                li.style.display = 'none';
            }
        });

        actionMenu.classList.remove('hidden');
        highlightMovement();
    }
}

function hideActionMenu() {
    actionMenu.classList.add('hidden');
    isActionMenuActive = false;
    removeMovementHighlight();
}

function performAction(action) {
    if (action === 'move') {
        isMoving = true;
        hideActionMenu();
        updateCharacterPosition();
    } else if (action === 'attack') {
        alert('Attack!');
        endTurn();
    } else if (action === 'magic') {
        alert('Magic!');
        endTurn();
    } else if (action === 'wait') {
        alert('Wait!');
        initialPosition = { ...characterPosition };
        hideActionMenu();
        resetCharacterState();
        endTurn();
    } else if (action === 'back') {
        // Mengembalikan posisi karakter ke posisi sebelumnya
        characterPosition = { ...previousPosition };
        // Kosongkan pathGrids agar highlight movement dihapus
        pathGrids = [];
        // Update posisi karakter untuk menghapus highlight movement
        updateCharacterPosition();
        // Sembunyikan menu aksi
        hideActionMenu();
        // Reset state karakter setelah back
        resetCharacterState();
    }
}

function removeMovementHighlight() {
    pathGrids = [];
    updateCharacterPosition();
}

function cancelMovement() {
    if (isActionMenuActive) return;
    characterPosition = { ...previousPosition };
    isCharacterSelected = false;
    isMoving = false;
    pathGrids = [];
    updateCharacterPosition();
}

function resetCharacterState() {
    isCharacterSelected = false;
    isMoving = false;
    targetPosition = null;
    previousPosition = { ...characterPosition };
    updateCharacterPosition();
}

function endTurn() {
    if (turnPhase === 'allies') {
        turnPhase = 'enemies';
        enemyTurn();
    } else {
        turnPhase = 'allies';
        currentTurn++;
        showTurnOverlay(currentTurn);
    }
}

function showTurnOverlay(turn) {
    turnText.innerText = `TURN ${turn.toString().padStart(2, '0')}`;
    turnOverlay.classList.add('show');
    setTimeout(() => {
        turnOverlay.classList.remove('show');
        if (turnPhase === 'allies') {
            resetCharacterState();
        }
    }, 2000);
}

function enemyTurn() {
    setTimeout(() => {
        const possibleMoves = getPossibleMoves(enemyPosition);
        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        enemyPosition = randomMove;
        updateCharacterPosition();
        endTurn();
    }, 1000);
}

function getPossibleMoves(position) {
    const possibleMoves = [];
    const directions = [
        { x: -1, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: -1 },
        { x: 0, y: 1 }
    ];

    directions.forEach(dir => {
        const newX = position.x + dir.x;
        const newY = position.y + dir.y;
        if (newX >= 0 && newX < boardSize && newY >= 0 && newY < boardSize) {
            if (newX !== characterPosition.x || newY !== characterPosition.y) {
                possibleMoves.push({ x: newX, y: newY });
            }
        }
    });

    if (possibleMoves.length === 0) {
        possibleMoves.push({ ...position });
    }

    return possibleMoves;
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'z' || event.key === 'Z') {
        if (isActionMenuActive || turnPhase === 'enemies') return;
        isCharacterSelected = true;
        showInitialActionMenu();
    }
    if (event.key === 'x' || event.key === 'X') {
        cancelMovement();
    }
});

createBoard();
