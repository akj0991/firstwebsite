const circle = document.getElementById('circle');
const leafContainer = document.getElementById('leaf-container');
const leaves = [];

const COLORS = {
    middayTop: '#d0f0ff',
    middayBottom: '#87ceeb',
    sunsetTop: '#2f3d66',
    sunsetBottom: '#d88956'
};

const LEAF_PALETTE = ['#e07a5f', '#f4a259', '#d97b29', '#c35a27', '#df6f3a'];

const pointer = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    vx: 0,
    speed: 0,
    lastMove: performance.now(),
    prevTime: performance.now()
};

let gradientState = {
    top: COLORS.middayTop,
    bottom: COLORS.middayBottom,
    pointer: COLORS.middayBottom
};

function hexToRgb(hex) {
    const value = hex.replace('#', '');
    const bigint = parseInt(value, 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

function rgbToHex({ r, g, b }) {
    const toHex = (component) => component.toString(16).padStart(2, '0');
    return `#${toHex(Math.round(r))}${toHex(Math.round(g))}${toHex(Math.round(b))}`;
}

function lerpColor(colorA, colorB, t) {
    const a = hexToRgb(colorA);
    const b = hexToRgb(colorB);
    return rgbToHex({
        r: a.r + (b.r - a.r) * t,
        g: a.g + (b.g - a.g) * t,
        b: a.b + (b.b - a.b) * t
    });
}

function darken(color, amount) {
    const { r, g, b } = hexToRgb(color);
    return rgbToHex({
        r: r * (1 - amount),
        g: g * (1 - amount),
        b: b * (1 - amount)
    });
}

function getDayTransitionFactor() {
    const now = new Date();
    const hours = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
    let delta = Math.abs(hours - 12);
    if (delta > 12) {
        delta = 24 - delta;
    }
    return Math.min(1, delta / 6);
}

function updateSkyGradient() {
    const factor = getDayTransitionFactor();
    const top = lerpColor(COLORS.middayTop, COLORS.sunsetTop, factor);
    const bottom = lerpColor(COLORS.middayBottom, COLORS.sunsetBottom, factor);
    gradientState = {
        top,
        bottom,
        pointer: darken(lerpColor(COLORS.middayBottom, COLORS.sunsetBottom, factor * 0.9), 0.18)
    };
    document.body.style.background = `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`;
    circle.style.backgroundColor = gradientState.pointer;
}

updateSkyGradient();
setInterval(updateSkyGradient, 60 * 1000);

function positionCircle(x, y) {
    circle.style.transform = `translate3d(${x - 25}px, ${y - 25}px, 0)`;
}

positionCircle(pointer.x, pointer.y);

document.addEventListener('mousemove', (event) => {
    const now = performance.now();
    const dt = (now - pointer.prevTime) / 1000;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;

    pointer.x = event.clientX;
    pointer.y = event.clientY;

    if (dt > 0) {
        pointer.vx = dx / dt;
        pointer.speed = Math.sqrt(dx * dx + dy * dy) / dt;
    } else {
        pointer.vx = 0;
        pointer.speed = 0;
    }

    pointer.prevTime = now;
    pointer.lastMove = now;
    positionCircle(pointer.x, pointer.y);
});

window.addEventListener('resize', () => {
    leaves.forEach((leaf) => {
        if (leaf.settled) {
            leaf.y = window.innerHeight - leaf.radius;
        }
    });
});

const tau = 0.5;
const emissionCoefficient = 0.02;
let emissionAccumulator = 0;
let previousTime = performance.now();

function createLeaf() {
    const radius = 10 + Math.random() * 8;
    const leaf = {
        el: document.createElement('div'),
        radius,
        baseX: pointer.x,
        y: pointer.y,
        swayAmplitude: radius * 1.5,
        swayOmega: (2 * Math.PI) / 3,
        swayPhase: Math.random() * Math.PI * 2,
        startTime: performance.now(),
        vx0: pointer.vx,
        terminalVelocity: 160 + Math.random() * 70,
        vy: 0,
        settled: false
    };

    leaf.el.className = 'leaf';
    leaf.el.style.width = `${radius * 2}px`;
    leaf.el.style.height = `${radius * 2}px`;
    leaf.el.style.backgroundColor = LEAF_PALETTE[Math.floor(Math.random() * LEAF_PALETTE.length)];

    leafContainer.appendChild(leaf.el);
    leaves.push(leaf);
}

function updateLeaves(dt, time) {
    const bottom = window.innerHeight;

    for (let i = 0; i < leaves.length; i += 1) {
        const leaf = leaves[i];

        if (!leaf.settled) {
            leaf.vy += (leaf.terminalVelocity - leaf.vy) * (dt / tau);
            const maxFall = bottom - leaf.radius;
            const progress = Math.min(1, Math.max(0, leaf.y / Math.max(1, maxFall)));
            const vx = leaf.vx0 * (1 - progress * progress);
            leaf.baseX += vx * dt;
            leaf.y += leaf.vy * dt;

            if (leaf.y >= maxFall) {
                leaf.y = maxFall;
                leaf.settled = true;
                leaf.swayAmplitude = 0;
            }
        }

        const swayOffset = leaf.swayAmplitude * Math.sin(leaf.swayOmega * ((time - leaf.startTime) / 1000) + leaf.swayPhase);
        const x = leaf.baseX + swayOffset;
        leaf.el.style.transform = `translate3d(${x - leaf.radius}px, ${leaf.y - leaf.radius}px, 0)`;
    }
}

function animate(time) {
    const dt = (time - previousTime) / 1000;
    previousTime = time;

    if (time - pointer.lastMove > 120) {
        pointer.speed = 0;
        pointer.vx = 0;
    }

    const emissionRate = pointer.speed * emissionCoefficient;
    emissionAccumulator += emissionRate * dt;

    while (emissionAccumulator >= 1) {
        createLeaf();
        emissionAccumulator -= 1;
    }

    updateLeaves(dt, time);
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
