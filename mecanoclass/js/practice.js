import { requireGameAccess, currentUser } from '../../js/common/auth.js';
import { saveGameResult, getRandomMecanoText } from '../../js/common/db.js';
import { renderHeader, showToast } from '../../js/common/ui.js';
import { getUrlParams } from '../../js/common/utils.js';

let engine;
let currentClassId = null;
let practiceText = '';
let game = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Get classId from URL
    const params = getUrlParams();
    currentClassId = params.classId || null;

    // Initialize platform game (assuming it's global somehow, or available)
    game = new PlatformGame('platformGameCanvas');

    requireGameAccess('mecanoclass', {
        onGranted: async (user, profile, classId) => {
            renderHeader(user, profile);

            if (profile && profile.photoURL) {
                game.setAvatar(profile.photoURL);
            }

            if (!currentClassId && classId) {
                currentClassId = classId;
            }

            await loadAndStartEngine();
        }
    });

    // ESC to restart
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            location.reload();
        }
    });
    
    document.getElementById('btnStartPractice').addEventListener('click', startPractice);
    document.getElementById('btnSaveResult').addEventListener('click', saveAndExit);
});

async function loadAndStartEngine() {
    const textDisplay = document.getElementById('textDisplay');
    if (!textDisplay) return;
    
    textDisplay.innerText = currentClassId
        ? "Cargando texto de la clase..."
        : "Cargando texto aleatorio...";

    let textData;
    try {
        if (currentClassId) {
            const result = await getRandomMecanoText(currentClassId);
            textData = result ? result.text : "No hay textos disponibles en esta clase.";
        } else {
            // Use local fallback if db call not available without class
            if (typeof initialTexts !== 'undefined' && initialTexts.length > 0) {
                textData = initialTexts[Math.floor(Math.random() * initialTexts.length)].text;
            } else {
                textData = "La velocidad es importante pero la precision es fundamental para ganar esta carrera.";
            }
        }
    } catch (e) {
        console.error("Error fetching text", e);
        textData = "Error al cargar texto. Usa este texto de ejemplo.";
    }

    practiceText = textData;

    engine = new TypingEngine(textData, {
        onComplete: showResults,
        onUpdate: (wpm, accuracy) => {
            updateStats(wpm, accuracy);

            game.progress = engine.currentIndex / engine.fullText.length;
            game.accuracy = accuracy / 100;
            game.draw();
        },
        onCorrectKey: () => {
            game.onCorrectKey();
            const correctKeys = engine.currentIndex - engine.errors;
            game.updatePosition(correctKeys, engine.fullText.length);
        },
        onIncorrectKey: () => {
            game.draw();
        }
    });
}

function startPractice(event) {
    if (event) event.stopPropagation();

    if (!engine) return console.error("Engine not initialized");

    const overlay = document.getElementById('overlayStart');
    overlay.style.display = 'none';
    overlay.classList.remove('d-flex');
    const input = document.getElementById('hiddenInput');
    input.focus();

    const gameContainer = document.getElementById('gameContainer');
    if (gameContainer) {
        gameContainer.onclick = function () {
            input.focus();
        };
    }

    engine.start();
}

function updateStats(wpm, accuracy) {
    document.getElementById('wpmDisplay').innerText = wpm;
    document.getElementById('accuracyDisplay').innerText = accuracy + '%';
}

function showResults(stats) {
    if (stats.accuracy < 90) {
        document.getElementById('overlayFailed').style.display = 'flex';
        document.getElementById('failedAccuracy').innerText = stats.accuracy + '%';
        document.getElementById('failedWpm').innerText = stats.wpm + ' PPM';
    } else {
        document.getElementById('overlayEnd').style.display = 'flex';
        document.getElementById('finalWpm').innerText = stats.wpm + ' PPM';
        engine.finalStats = stats;
    }
}

async function saveAndExit() {
    if (engine && engine.finalStats) {
        const btn = document.getElementById('btnSaveResult');
        const originalText = btn.innerText;
        btn.innerText = "Guardando...";
        btn.disabled = true;

        try {
            const duration = engine.endTime && engine.startTime
                ? Math.round((engine.endTime - engine.startTime) / 1000)
                : null;

            await saveGameResult('mecanoclass', currentUser.uid, currentClassId, engine.finalStats.wpm, {
                wpm: engine.finalStats.wpm,
                accuracy: engine.finalStats.accuracy,
                duration: duration,
                mode: 'practice'
            });
            showToast("¡Resultado guardado correctamente!", 'success');

            if (currentClassId) {
                // Return to dashboard or keep playing
                showToast("Guardado con éxito. Redirigiendo...", 'success');
            } else {
                window.history.back();
            }
        } catch (error) {
            console.error("Error saving result:", error);
            showToast("Error al guardar: " + error.message, 'error');
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }
}
