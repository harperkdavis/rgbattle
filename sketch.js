const input = { keys: {}, mouse: {} }
const game = {
    points: [],
    splitters: [],
    blueWins: 0,
    redWins: 0,
    greenWins: 0,
    
    mass: 0,
};


const G = 100;

function setup() {
    createCanvas();
    windowResized();

    reset();
}

function reset() {
    game.points = [];
    game.splitters = [];

    for (let i = 0; i < 400; i++) {
        game.points.push({
            x: random(0, width),
            y: random(0, height),
            vx: random(-1, 1),
            vy: random(-1, 1),
            color: color(random(100, 255), random(0, 50), random(0, 50)),
            team: -1,
            m: 0.2,
        });
    }

    for (let i = 0; i < 200; i++) {
        game.points[i * 2].color = color(random(0, 50), random(0, 50), random(100, 255));
        game.points[i * 2].team = 1;
    }

    for (let i = 0; i < 20; i++) {
        game.points.unshift({
            x: random(0, width),
            y: random(0, height),
            vx: random(-1, 1),
            vy: random(-1, 1),
            color: color(random(0, 50), random(100, 255), random(0, 50)),
            team: 0,
            m: 0.2,
        });
    }

    for (let i = 0; i < 10; i++) {
        game.splitters.push({
            x: random(0, width),
            y: random(0, height),
            vx: random(-1, 1),
            vy: random(-1, 1),
        });
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
    input.keys[keyCode] = 0;
}

function keyReleased() {
    input.keys[keyCode] = -1;
}

function mousePressed() {
    input.mouse[mouseButton] = 0;
}

function mouseReleased() {
    input.mouse[mouseButton] = -1;
}

function updateInput() {
    for (let key in input.keys) {
        if (input.keys[key] >= 0) {
            input.keys[key] += 1;
        }
    }
    for (let button in input.mouse) {
        if (input.mouse[button] >= 0) {
            input.mouse[button] += 1;
        }
    }
}

function radius(m) {
    return sqrt(m) * 5;
}

function update() {
    const forces = [];

    const step = 1;

    for (const point of game.points) {
        if (point.team === 0) {
            point.m *= 1.00095;
        }
    }

    const splitterForces = [];
    for (let i = 0; i < game.splitters.length; i++) {
        for (let j = 0; j < game.points.length; j++) {
            const r = radius(game.points[j].m);
            const d = dist(game.splitters[i].x, game.splitters[i].y, game.points[j].x, game.points[j].y);
            if (d < r) {
                const r = radius(game.points[j].m);
                const m = game.points[j].m / 2;
                game.points[j].m = m;
                const pushX = Math.sign(game.points[j].vx) * r * 1.5;
                const pushY = Math.sign(game.points[j].vy) * r * 1.5;
                game.points[j].x += pushX;
                game.points[j].y += pushY;
                game.points[j].vx /= 2;
                game.points[j].vy /= 2;
                game.points.push({
                    x: game.points[j].x - pushX,
                    y: game.points[j].y - pushY,
                    vx: -game.points[j].vx / 2,
                    vy: -game.points[j].vy / 2,
                    color: game.points[j].color,
                    team: game.points[j].team,
                    m,
                });
            }

            if (game.points[j].team === 0) { // then attract
                const dx = game.points[j].x - game.splitters[i].x;
                const dy = game.points[j].y - game.splitters[i].y;
                const d = max(sqrt(dx * dx + dy * dy), 10);
                const f = G / (d * d) * game.points[j].m;
                const fx = f * dx / d;
                const fy = f * dy / d;
                splitterForces[i] = splitterForces[i] || { x: 0, y: 0 };
                splitterForces[i].x += fx;
                splitterForces[i].y += fy;
            }
        }
    }

    for (let i = 0; i < game.splitters.length; i++) {
        const s = game.splitters[i];
        const f = splitterForces[i] || { x: 0, y: 0 };
        s.vx += f.x * step;
        s.vy += f.y * step;
        if (s.x < 0) {
            s.vx = abs(s.vx);
        }
        if (s.x > width) {
            s.vx = -abs(s.vx);
        }
        if (s.y < 0) {
            s.vy = abs(s.vy);
        }
        if (s.y > height) {
            s.vy = -abs(s.vy);
        }
        s.x += s.vx * step;
        s.y += s.vy * step;
        s.vx /= 1.001;
        s.vy /= 1.001;
    }

    const playerRadius = radius(game.mass);
    for (let i = 0; i < game.points.length; i++) {
        const p1 = game.points[i];
        const r1 = radius(p1.m);
        for (let j = i + 1; j < game.points.length; j++) {
            const p2 = game.points[j];
            const r2 = radius(p2.m);
            const d = dist(p1.x, p1.y, p2.x, p2.y);
            if (d < r1 + r2) {
                if (p1.m >= p2.m) {
                    const momentum = abs(p1.m * p1.vx) + abs(p2.m * p2.vx);
                    p1.m += p2.m;
                    p2.m = 0;
                    p1.vx = Math.sign(p1.vx) * momentum / p1.m;
                    p1.vy = Math.sign(p1.vy) * momentum / p1.m;
                } else {
                    const momentum = abs(p1.m * p1.vx) + abs(p2.m * p2.vx);
                    p2.m += p1.m;
                    p1.m = 0;
                    p2.vx = Math.sign(p2.vx) * momentum / p2.m;
                    p2.vy = Math.sign(p2.vy) * momentum / p2.m;
                }
            }
        }
        // const d = dist(p1.x, p1.y, mouseX, mouseY);
        // if (d < playerRadius + r1) {
        //     if (game.mass >= p1.m) {
        //         game.mass += p1.m;
        //         p1.m = 0;
        //     } else {
        //         p1.m += game.mass;
        //         game.mass = 0;
        //     }
        // }
    }

    game.points = game.points.filter(p => p.m >= 0.2);

    for (let i = 0; i < game.points.length; i++) {
        const p1 = game.points[i];
        for (let j = i + 1; j < game.points.length; j++) {
            const p2 = game.points[j];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const d = max(sqrt(dx * dx + dy * dy), 1);
            const f = G / (d * d) * p1.m * p2.m * p1.team * -p2.team;
            const fx = f * dx / d;
            const fy = f * dy / d;
            forces[i] = forces[i] || { x: 0, y: 0 };
            forces[j] = forces[j] || { x: 0, y: 0 };
            forces[i].x += fx;
            forces[i].y += fy;
            forces[j].x -= fx;
            forces[j].y -= fy;
        }
        if (p1.team === 0) {
            for (let j = 0; j < game.splitters.length; j++) {
                const s = game.splitters[j];
                const dx = s.x - p1.x;
                const dy = s.y - p1.y;
                const d = max(sqrt(dx * dx + dy * dy), 1);
                const f = - G / (d * d) * p1.m * 0.5;
                const fx = f * dx / d;
                const fy = f * dy / d;
                forces[i] = forces[i] || { x: 0, y: 0 };
                forces[i].x += fx;
                forces[i].y += fy;
            }
        }
    }

    for (let i = 0; i < game.points.length; i++) {
        const p = game.points[i];
        p.vx += forces[i].x * step;
        p.vy += forces[i].y * step;
        if (p.x < 0) {
            p.vx = abs(p.vx);
        }
        if (p.x > width) {
            p.vx = -abs(p.vx);
        }
        if (p.y < 0) {
            p.vy = abs(p.vy);
        }
        if (p.y > height) {
            p.vy = -abs(p.vy);
        }
        p.x += p.vx * step;
        p.y += p.vy * step;
    }
}

function draw() {
    // let i = 0;
    // reset();
    // console.time('runOne')
    // while (!(game.points.every(p => p.team === 0) || game.points.every(p => p.team === 1) || game.points.every(p => p.team === -1))) {
    //     update();
    //     i += 1;
    // }
    // console.timeEnd('runOne')
    // console.log('finished in:', i);
    // console.log('winner:', game.points.every(p => p.team === 0) ? 'green' : game.points.every(p => p.team === 1) ? 'blue' : 'red');
    // if (game.points.every(p => p.team === 0)) {
    //     game.greenWins += 1;
    // }
    // if (game.points.every(p => p.team === 1)) {
    //     game.blueWins += 1;
    // }
    // if (game.points.every(p => p.team === -1)) {
    //     game.redWins += 1;
    // }
    update();
    updateInput();
    background(0);
    noStroke();
    for (let i = 0; i < game.points.length; i++) {
        const p = game.points[i];
        fill(p.color);
        ellipse(p.x, p.y, radius(p.m) * 2, radius(p.m) * 2);
    }

    noFill();
    stroke(255);
    for (let i = 0; i < game.splitters.length; i++) {
        const s = game.splitters[i];
        line(s.x - 4, s.y - 4, s.x + 4, s.y + 4);
        line(s.x - 4, s.y + 4, s.x + 4, s.y - 4);
    }

    // fill(255, 255, 0);
    // stroke(255);
    // ellipse(mouseX, mouseY, radius(game.mass) * 2, radius(game.mass) * 2);

    noStroke();
    const totalWins = game.greenWins + game.blueWins + game.redWins;
    fill(255, 0, 0);
    text(`Red: ${game.redWins} (${(game.redWins / totalWins * 100).toFixed(2)}%)`, 10, 20);
    fill(0, 255, 0);
    text(`Green: ${game.greenWins} (${(game.greenWins / totalWins * 100).toFixed(2)}%)`, 10, 40);
    fill(0, 0, 255);
    text(`Blue: ${game.blueWins} (${(game.blueWins / totalWins * 100).toFixed(2)}%)`, 10, 60);
}