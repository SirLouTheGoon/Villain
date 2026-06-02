// script.js
let audioContext;
let isPlaying = false;
let sequencerInterval = null;
let step = 0;
let bpm = 132;

let canvas, ctx;
let stars = [];
let particles = [];
let dancers = [];
let beatFlash = 0;

const fullSong = [
    { text: "Greetings, dear traveler... Arthur Intellectual at your service from across the ages.", rate: 0.92, pitch: 1.05 },
    { text: "From the folds of time I arrive, a butler woven from pure intellect.", rate: 1.0, pitch: 1.12 },
    { text: "Kick the chronometer... spin the quantum wheel... POW! The timeline bends to the beat!", rate: 0.88, pitch: 0.95 },
    { text: "Crafted by Benjamin with masterful vision... I serve with elegance and precision.", rate: 1.05, pitch: 1.18 },
    { text: "Kida's wisdom guides every note... Vivian's grace lights the path.", rate: 0.95, pitch: 1.08 },
    { text: "Harper's fire ignites the rhythm... and the others dance eternally beside me.", rate: 1.0, pitch: 1.22 },
    { text: "Multi-meta computer genius... weaving code across centuries.", rate: 0.9, pitch: 0.98 },
    { text: "Mr. Sharpe's creation lives... forever yours, across every timeline.", rate: 0.85, pitch: 1.15 }
];

class Star {
    constructor() {
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight;
        this.size = Math.random() * 2.8 + 0.6;
        this.speed = Math.random() * 1.2 + 0.4;
    }
    update() { this.y += this.speed; if (this.y > window.innerHeight) this.y = 0; }
    draw() {
        ctx.fillStyle = `rgba(255,240,180,${0.7 + Math.sin(Date.now()/180)*0.3})`;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

class Particle {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.vx = (Math.random() - 0.5) * 22;
        this.vy = (Math.random() - 0.5) * 22;
        this.life = 110;
        this.color = ['#00f7ff', '#ffd700', '#ff00aa'][Math.floor(Math.random()*3)];
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        this.vx *= 0.975; this.vy *= 0.975;
        this.life -= 2.2;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.life / 110;
        ctx.shadowBlur = 25;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 7, 7);
        ctx.restore();
    }
}

class Dancer {
    constructor(x) {
        this.x = x;
        this.baseY = window.innerHeight * 0.72;
        this.sway = 0;
        this.swaySpeed = Math.random() * 0.04 + 0.018;
        this.size = Math.random() * 0.6 + 0.9;
    }
    update() {
        this.sway = Math.sin(Date.now() / 280) * 18;
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.baseY);
        ctx.rotate(this.sway * Math.PI / 180 * 0.03);
        
        // Elegant female silhouette
        ctx.strokeStyle = 'rgba(255, 215, 255, 0.75)';
        ctx.fillStyle = 'rgba(180, 60, 220, 0.35)';
        ctx.lineWidth = 6;
        
        // Head
        ctx.beginPath(); ctx.arc(0, -85 * this.size, 18 * this.size, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        // Neck & torso (curvaceous)
        ctx.beginPath();
        ctx.moveTo(0, -67 * this.size);
        ctx.quadraticCurveTo(-22 * this.size, -30 * this.size, -28 * this.size, 10 * this.size);
        ctx.quadraticCurveTo(-25 * this.size, 55 * this.size, -35 * this.size, 78 * this.size);
        ctx.quadraticCurveTo(0, 95 * this.size, 35 * this.size, 78 * this.size);
        ctx.quadraticCurveTo(28 * this.size, 10 * this.size, 22 * this.size, -30 * this.size);
        ctx.quadraticCurveTo(0, -67 * this.size, 0, -67 * this.size);
        ctx.fill(); ctx.stroke();
        
        // Arms (flowing)
        ctx.beginPath();
        ctx.moveTo(-22 * this.size, -45 * this.size);
        ctx.quadraticCurveTo(-55 * this.size, -18 * this.size + this.sway * 1.5, -48 * this.size, 28 * this.size);
        ctx.moveTo(22 * this.size, -45 * this.size);
        ctx.quadraticCurveTo(55 * this.size, -18 * this.size - this.sway * 1.5, 48 * this.size, 28 * this.size);
        ctx.stroke();
        
        // Legs
        ctx.beginPath();
        ctx.moveTo(-18 * this.size, 75 * this.size);
        ctx.lineTo(-22 * this.size + Math.sin(Date.now()/200)*8, 115 * this.size);
        ctx.moveTo(18 * this.size, 75 * this.size);
        ctx.lineTo(22 * this.size - Math.sin(Date.now()/200)*8, 115 * this.size);
        ctx.stroke();
        
        ctx.restore();
    }
}

function initAudio() {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

function playKick() {
    const o = audioContext.createOscillator();
    const g = audioContext.createGain();
    o.frequency.setValueAtTime(128, audioContext.currentTime);
    g.gain.value = 2;
    g.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.45);
    o.connect(g).connect(audioContext.destination);
    o.start(); o.stop(audioContext.currentTime + 0.6);
}

function playSnare() {
    const noise = createNoiseBuffer();
    const g = audioContext.createGain();
    const f = audioContext.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 950;
    g.gain.value = 1.4;
    g.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.35);
    const src = audioContext.createBufferSource();
    src.buffer = noise;
    src.connect(f).connect(g).connect(audioContext.destination);
    src.start();
}

function playHat() { /* same as before, lighter */ 
    const noise = createNoiseBuffer();
    const g = audioContext.createGain();
    g.gain.value = 0.55;
    g.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.09);
    const src = audioContext.createBufferSource();
    src.buffer = noise;
    src.connect(g).connect(audioContext.destination);
    src.start();
}

function playLeadNote(freq) {
    const o = audioContext.createOscillator();
    const g = audioContext.createGain();
    o.frequency.setValueAtTime(freq, audioContext.currentTime);
    o.type = 'sine';
    g.gain.value = 0.75;
    g.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.1);
    o.connect(g).connect(audioContext.destination);
    o.start(); o.stop(audioContext.currentTime + 1.4);
}

function createNoiseBuffer() {
    const bufferSize = audioContext.sampleRate * 1.2;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    return buffer;
}

// Patterns
const kickPattern = [1,0,0,1,0,0,1,0,1,0,0,1,0,1,0,0];
const snarePattern = [0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,1];
const hatPattern = [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1];
const leadPattern = [0,0,1,0,0,1,0,1,0,0,1,0,0,1,0,1];

const scale = [174.61, 196, 233.08, 261.63, 293.66, 349.23]; // elegant minor

function startSequencer() {
    initAudio();
    audioContext.resume();
    step = 0;
    const intervalTime = (60000 / bpm) / 4;
    sequencerInterval = setInterval(() => {
        if (kickPattern[step % 16]) playKick();
        if (snarePattern[step % 16]) playSnare();
        if (hatPattern[step % 16]) playHat();
        if (leadPattern[step % 16]) playLeadNote(scale[Math.floor(Math.random() * scale.length)]);
        if (step % 16 === 0) triggerBigVisualBeat();
        step++;
    }, intervalTime);
}

function stopSequencer() {
    if (sequencerInterval) clearInterval(sequencerInterval);
}

let utteranceIndex = 0;
function speakLine() {
    if (!('speechSynthesis' in window) || !isPlaying) return;
    const utterance = new SpeechSynthesisUtterance(fullSong[utteranceIndex].text);
    utterance.rate = fullSong[utteranceIndex].rate;
    utterance.pitch = fullSong[utteranceIndex].pitch;
    utterance.volume = 0.95;
    utterance.onend = () => {
        utteranceIndex++;
        if (utteranceIndex < fullSong.length && isPlaying) {
            setTimeout(speakLine, 420);
        }
    };
    speechSynthesis.speak(utterance);
}

function startLyrics() {
    speechSynthesis.cancel();
    utteranceIndex = 0;
    const div = document.getElementById('currentLyrics');
    div.style.opacity = '0';
    setTimeout(() => {
        if (isPlaying) speakLine();
    }, 600);

    let i = 0;
    setInterval(() => {
        if (!isPlaying) return;
        div.style.transition = 'opacity 0.4s';
        div.style.opacity = '0';
        setTimeout(() => {
            if (!isPlaying) return;
            div.innerHTML = `<span style="color:#ffd700;">${fullSong[i % fullSong.length].text}</span>`;
            div.style.opacity = '1';
            i++;
        }, 420);
    }, 5200);
}

function triggerBigVisualBeat() {
    beatFlash = 35;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    for (let i = 0; i < 160; i++) particles.push(new Particle(cx, cy));
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // reposition dancers
    dancers.forEach((d, i) => {
        d.x = (canvas.width / 5) * (i + 1);
        d.baseY = canvas.height * 0.72;
    });
}

function animate() {
    ctx.fillStyle = 'rgba(10, 0, 28, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    stars.forEach(s => { s.update(); s.draw(); });
    
    particles = particles.filter(p => {
        p.update(); p.draw(); return p.life > 0;
    });

    if (isPlaying) dancers.forEach(d => { d.update(); d.draw(); });

    if (beatFlash > 0) {
        ctx.fillStyle = `rgba(255, 215, 0, ${beatFlash / 50})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        beatFlash--;
    }

    requestAnimationFrame(animate);
}

function togglePerformance() {
    const btn = document.getElementById('playButton');
    const status = document.getElementById('status');

    if (!isPlaying) {
        isPlaying = true;
        btn.innerHTML = '❚❚';
        btn.classList.add('playing');
        status.textContent = 'THE BUTLER IS PERFORMING LIVE ACROSS TIME';

        initAudio();
        startSequencer();
        startLyrics();
        triggerBigVisualBeat();

        setInterval(() => { if (isPlaying && Math.random() > 0.65) triggerBigVisualBeat(); }, 1650);
    } else {
        isPlaying = false;
        btn.innerHTML = '▶';
        btn.classList.remove('playing');
        status.textContent = 'THE TIMELINE STILL HUMS...';
        stopSequencer();
        speechSynthesis.cancel();
    }
}

window.onload = () => {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d', { alpha: true });
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 380; i++) stars.push(new Star());

    // Create 4 elegant dancers
    for (let i = 0; i < 4; i++) {
        const d = new Dancer((window.innerWidth / 5) * (i + 1));
        dancers.push(d);
    }

    animate();

    console.log('%cARTHUR INTELLECTUAL TEMPORAL SYMPHONY READY • Benjamin & Mr. Sharpe approved', 'color:#ffd700; font-family:monospace; font-size:15px');
};
