// ── MODO PRESENTACION PARA TIC2Hub ──────────────────────────────────────────

let presentationMode = false;
let slides = [];
let currentSlideIndex = 0;

window.togglePresentation = function() {
    let overlay = document.getElementById('presentation-overlay');
    
    // Si no existe, inyectarlo
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'presentation-overlay';
        overlay.innerHTML = `
            <div id="presentation-content"></div>
            <div id="presentation-controls">
                <button class="pres-btn" onclick="window.prevSlide()">⬅ Anterior</button>
                <span id="presentation-counter">1 / 1</span>
                <button class="pres-btn" onclick="window.nextSlide()">Siguiente ➡</button>
                <button class="pres-btn pres-btn-danger" style="margin-left:auto;" onclick="window.togglePresentation()">✕ Cerrar</button>
            </div>
        `;
        document.body.appendChild(overlay);

        // Estilos
        const style = document.createElement('style');
        style.textContent = `
            #presentation-overlay {
                position: fixed;
                inset: 0;
                background-color: #f8f9fa; /* FONDO CLARO PARA PROYECTORES */
                z-index: 99999;
                display: flex;
                flex-direction: column;
                color: #333;
                font-family: system-ui, sans-serif;
            }
            #presentation-content {
                flex: 1;
                overflow-y: auto;
                padding: 50px 10%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-start;
            }
            .presentation-slide {
                max-width: 900px;
                width: 100%;
                margin: auto 0;
                font-size: 1.5rem; /* Texto más grande para proyector */
                line-height: 1.6;
            }
            .presentation-slide h1 { font-size: 3rem; margin-bottom: 20px; color: #2c3e50; }
            .presentation-slide h2 { font-size: 2.2rem; margin-top: 30px; color: #4a90e2; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            .presentation-slide p, .presentation-slide li { margin-bottom: 15px; }
            .presentation-slide img { max-width: 100%; height: auto; display: block; margin: 20px auto; }
            #presentation-controls {
                background: #2c3e50;
                padding: 15px 30px;
                display: flex;
                align-items: center;
                box-shadow: 0 -4px 10px rgba(0,0,0,0.1);
            }
            .pres-btn {
                background: transparent;
                border: 2px solid #ecf0f1;
                color: #ecf0f1;
                padding: 10px 20px;
                border-radius: 8px;
                font-size: 1.1rem;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s;
            }
            .pres-btn:hover { background: #ecf0f1; color: #2c3e50; }
            .pres-btn-danger { border-color: #e74c3c; color: #e74c3c; }
            .pres-btn-danger:hover { background: #e74c3c; color: white; }
            #presentation-counter { color: white; font-size: 1.2rem; font-weight: bold; margin: 0 30px; }
            body.presentation-active { overflow: hidden; }
        `;
        document.head.appendChild(style);
    }
    
    if (presentationMode) {
        // Cerrar
        presentationMode = false;
        overlay.style.display = 'none';
        document.body.classList.remove('presentation-active');
        document.getElementById('presentation-content').innerHTML = '';
        slides = [];
    } else {
        // Abrir
        presentationMode = true;
        overlay.style.display = 'flex';
        document.body.classList.add('presentation-active');
        
        buildSlides();
        currentSlideIndex = 0;
        showSlide(currentSlideIndex);
    }
};

function buildSlides() {
    slides = [];
    
    let currentSlide = document.createElement('div');
    currentSlide.className = 'presentation-slide';
    
    let elementsToProcess = [];
    
    // Ignoramos el header, los scripts, y el test de evaluación
    Array.from(document.body.children).forEach(child => {
        const tag = child.tagName.toLowerCase();
        if (tag === 'script' || tag === 'style' || child.id === 'presentation-overlay' || child.id === 'presentation-sticky-header' || child.id === 'theory-test-container' || (child.classList && (child.classList.contains('nav-buttons') || child.classList.contains('test-cta')))) {
            return;
        }
        
        if (tag === 'section' || child.classList.contains('container')) {
            Array.from(child.children).forEach(subchild => {
                const subTag = subchild.tagName.toLowerCase();
                if (subTag === 'script' || (subchild.classList && (subchild.classList.contains('nav-buttons') || subchild.classList.contains('test-cta')))) return;
                elementsToProcess.push(subchild);
            });
        } else {
            elementsToProcess.push(child);
        }
    });

    // Separadores de diapositiva
    const splitTags = ['h1', 'h2', 'h3', 'h4'];
    
    elementsToProcess.forEach(child => {
        
        const tag = child.tagName.toLowerCase();
        let isCardOrBox = false;
        if (child.className && typeof child.className === 'string') {
            isCardOrBox = child.className.includes('info-box') || child.className.includes('diagram-box') || child.className.includes('-card') || child.className.includes('task-link');
        }
        let shouldSplit = splitTags.includes(tag) || tag === 'hr' || isCardOrBox;

        
        if (shouldSplit) {
            if (currentSlide.innerHTML.trim() !== '') {
                slides.push(currentSlide);
            }
            currentSlide = document.createElement('div');
            currentSlide.className = 'presentation-slide';
            if (child.tagName.toLowerCase() === 'hr') return; // Saltamos los HRs en modo presentación
        }
        
        currentSlide.appendChild(child.cloneNode(true));
    });
    
    if (currentSlide.innerHTML.trim() !== '') {
        slides.push(currentSlide);
    }
}

function showSlide(index) {
    const content = document.getElementById('presentation-content');
    const counter = document.getElementById('presentation-counter');
    
    content.innerHTML = '';
    
    if (slides[index]) {
        content.appendChild(slides[index]);
    }
    
    counter.textContent = `${index + 1} / ${slides.length}`;
    content.scrollTop = 0;
}

window.nextSlide = function() {
    if (currentSlideIndex < slides.length - 1) {
        currentSlideIndex++;
        showSlide(currentSlideIndex);
    }
};

window.prevSlide = function() {
    if (currentSlideIndex > 0) {
        currentSlideIndex--;
        showSlide(currentSlideIndex);
    }
};

// Navegación con teclado
document.addEventListener('keydown', (e) => {
    if (!presentationMode) return;
    
    if (e.key === 'ArrowRight' || e.key === 'Space') { 
        e.preventDefault(); 
        window.nextSlide(); 
    }
    if (e.key === 'ArrowLeft') { 
        e.preventDefault(); 
        window.prevSlide(); 
    }
    if (e.key === 'Escape') { 
        e.preventDefault(); 
        window.togglePresentation(); 
    }
    if (e.key === 'ArrowDown') { 
        e.preventDefault(); 
        document.getElementById('presentation-content').scrollBy({ top: 150, behavior: 'smooth' }); 
    }
    if (e.key === 'ArrowUp') { 
        e.preventDefault(); 
        document.getElementById('presentation-content').scrollBy({ top: -150, behavior: 'smooth' }); 
    }
});

// ── AUTO ÍNDICE (TABLE OF CONTENTS) ─────────────────────────────────────────
(function generateTableOfContents() {
    // Buscar todos los h2
    const h2s = Array.from(document.querySelectorAll('.container h2'));
    if (h2s.length === 0) return;

    // Crear el contenedor del índice
    const tocBox = document.createElement('div');
    tocBox.className = 'info-box'; // Utilizamos la clase info-box para que tenga estilo y actúe como diapositiva en presentación
    tocBox.style.marginBottom = '30px';
    tocBox.innerHTML = '<h3 style="margin-top:0;">📑 Índice de Contenidos</h3>';
    
    const ul = document.createElement('ul');
    ul.style.listStyleType = 'none';
    ul.style.paddingLeft = '0';
    
    h2s.forEach((h2, idx) => {
        // Asignar ID si no tiene para poder navegar
        if (!h2.id) h2.id = 'section-' + idx;
        
        const li = document.createElement('li');
        li.style.marginBottom = '8px';
        
        const a = document.createElement('a');
        a.href = '#' + h2.id;
        a.textContent = h2.textContent;
        a.style.textDecoration = 'none';
        a.style.color = 'var(--primary)';
        a.style.fontWeight = 'bold';
        
        a.addEventListener('mouseover', () => a.style.textDecoration = 'underline');
        a.addEventListener('mouseout', () => a.style.textDecoration = 'none');
        
        li.appendChild(a);
        ul.appendChild(li);
    });
    
    tocBox.appendChild(ul);
    
    // Insertarlo después del primer párrafo (que suele ser la intro después del h1) o después del h1
    const h1 = document.querySelector('.container h1');
    if (h1) {
        let insertAfter = h1;
        // Si el siguiente elemento es un párrafo, insertarlo después del párrafo
        if (h1.nextElementSibling && h1.nextElementSibling.tagName.toLowerCase() === 'p') {
            insertAfter = h1.nextElementSibling;
        }
        insertAfter.parentNode.insertBefore(tocBox, insertAfter.nextSibling);
    }
})();
