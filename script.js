// Load sprites

// class tile extends PIXI.Sprite {
//     constructor(x, y, texture) {
//         super(texture);
//         this.x = x;
//         this.y = y;
//         // this.texture = texture;
//         spriteFix(this);
//     }
// }

function convertCoord(x, y, reverse=false) {
    let rx, ry;
    if(reverse) {
        rx = (x - 24) / 48;
        ry = y / 48;
    } else {
        rx = x * 48 + 24;
        ry = y * 48;
    }

    return [rx, ry];
}

function tile(type='ground', texture=anim.ground, x=0, y=0) {
    let s = new PIXI.AnimatedSprite(texture);
    s.type = type;
    spriteFix(s);
    [s.x, s.y] = convertCoord(x, y);
    s.interactive = true;
    s.buttonMode = true;
    s.on('pointerdown', draw);
    s.on('mouseover', draw);
    app.stage.addChild(s);
    return s;

    function draw() {
        if(!pressed['leftClick']) return;
        s.type = 'ground';
        s.textures = anim.ground;
    }
}

// Tiles
var stage = [];
// Horizontal
for(hi = 0; hi < 15; hi++) {
    stage.push([]);
    for(vi = 0; vi < 9; vi++) {
        if(hi == 0 && vi == 7) {
            stage[hi].push(tile('ground', anim.ground, hi, vi));
        } else stage[hi].push(tile('none', anim.none, hi, vi));
        
    }
}

function enemy(type='goomba', texture=anim.goomba, x=0, y=0) {
    let s = new PIXI.AnimatedSprite(texture);
    spriteFix(s);
    [s.x, s.y] = convertCoord(x, y);
    app.stage.addChild(s);
    if(type == 'goomba') s.animationSpeed = 0.05;
    s.play();
    return s;
}

// Enemies and items
var items = [
    enemy('goomba', anim.goomba, 8, 6),
    enemy('goomba', anim.goomba, 8, 5),
    enemy('goomba', anim.goomba, 8, 4),
    enemy('goomba', anim.goomba, 8, 3),
]



// Mario
var mario = {
    s: new PIXI.AnimatedSprite(anim.small_still),

    // Stats
    accel_x: 0.075, // Horizontal acceleration
    air_accel: 0.075,
    walk: 2.7, // Max speed when walking
    run: 5, // Max speed when running
    speed_x: 2, // Maximum horizontal speed, changes when running
    jump_accel: 6, // Jump
    jump_accel_super: 7, // Jump when running

    // Data
    motion: {
        x: 0,
        y: 0,
    },
    grounded: false,
    jump_ready: true,
    crouching: false,
}
spriteFix(mario.s);
[mario.s.x, mario.s.y] = convertCoord(0, 5);
mario.s.animationSpeed = 0.16;
mario.s.play();
app.stage.addChild(mario.s);


// Controls
const world = {
    // Horizontal
    resist_x: 0.98, // 1 being no resistance at all
    air_resist_x: 0.98,
    // air_resist_x: 0.999,
    absolute_slow: 0.01, // Slowest X speed possible before motion is rounded down to 0

    // Vertical
    gravity:  0.125,
}
let pressed = {}


// Game Ticker
let elapsed = 0.0;
app.ticker.add((delta) => {
    elapsed += delta;

    /* ----- Physics ----- */
    // Ground
    let rc = convertCoord(mario.s.x, mario.s.y, true);
    let rcx = Math.round(Number(rc[0]));
    let rcy = Math.round(Number(rc[1]));
    const adj = { // Adjacent tiles
        inside: stage?.[rcx]?.[rcy],
        left: stage?.[Number(rcx)-1]?.[Number(rcy)],
        right: stage?.[Number(rcx)+1]?.[Number(rcy)],
        up: stage?.[rcx]?.[Number(rcy)-1],
        under: stage?.[rcx]?.[Number(rcy)+1],
    }
    for(d in adj) if(adj[d] == undefined) adj[d] = { type: 'ground' }
    let ground = 480; // 384 = bottom of screen
    if(adj.under != undefined) if(adj.under.type != 'none') ground = convertCoord(rcx, Number(rcy))[1];
    let leftCoord, rightCoord;
    leftCoord = convertCoord(Number(rcx)-1)[0];
    console.log(leftCoord);

    // Gravity
    if(mario.s.y < ground) {
        mario.motion.y += world.gravity;
        mario.grounded = false;
    } else if(mario.s.y >= ground && !mario.grounded) {
        mario.s.y = ground;
        mario.motion.y = 0;
        mario.grounded = true;
    };

    // Motion & Friction
    // Left/Right
    if(
        adj.left.type == 'none'
        && Math.sign(mario.motion.x) != 1 // Left wall
        // && mario.s.x >= leftCoord
        ||

        adj.right.type == 'none'
        && Math.sign(mario.motion.x) != -1 // Right wall
    ) {
        mario.s.x += mario.motion.x; // Move mario
    } else {
        mario.motion.x = 0;
    }
    // Vertical
    if(adj.up.type != 'none' && Math.sign(mario.motion.y) != 1) {
        mario.motion.y = 0;
    }
    mario.s.y += mario.motion.y;
    // if(mario.grounded) mario.motion.x *= world.resist_x; // Ground friction
    // else mario.motion.x *= world.air_resist_x; // Air friction
    if(mario.grounded) mario.motion.x -= (mario.motion.x * (1 - world.resist_x)); // Ground friction
    else mario.motion.x *= world.air_resist_x; // Air friction
    if(Math.abs(mario.motion.x) < world.absolute_slow) mario.motion.x = 0; // Round to 0

    // Move mario back if stuck in a block
    if(adj.inside.type != 'none') mario.s.x += - 2 * Math.sign(mario.s.scale.x);



    /* ----- Movement ----- */
    let acceleration = mario.grounded ? mario.accel_x : mario.air_accel;

    // Run
    if(pressed['shift'] && !mario.crouching) mario.speed_x = mario.run;
    else mario.speed_x = mario.walk;

    // Jump
    if(pressed[' '] && mario.grounded && mario.jump_ready) {
        mario.motion.y -= Math.abs(mario.motion.x) > 2.8 ? mario.jump_accel_super : mario.jump_accel;
        mario.jump_ready = false;
    } else if(!pressed[' '] && mario.grounded) {
        mario.jump_ready = true;
    }
    // Crouch
    if(pressed['s'] && mario.grounded) mario.crouching = true;
    else if(mario.crouching && mario.grounded) mario.crouching = false
    // Right
    if(pressed['d']) {
        if(mario.motion.x < mario.speed_x && (!mario.crouching || !mario.grounded)) mario.motion.x += acceleration;
        if(mario.grounded) mario.s.scale.x = 3;
    };
    // Left
    if(pressed['a']) {
        if(mario.motion.x > mario.speed_x*-1 && (!mario.crouching || !mario.grounded)) mario.motion.x -= acceleration;
        if(mario.grounded) mario.s.scale.x = -3;
    };


    /* ----- Animate ----- */
    // Crouch
    if(mario.crouching) {
        mario.s.textures = anim.crouch;
    }
    // Jump
    else if(!mario.grounded) {
        mario.s.textures = anim.small_jump;
    }
    // Turn
    else if(
        pressed['d'] && Math.sign(mario.motion.x) == -1
        || pressed['a'] && Math.sign(mario.motion.x) == 1
    ) {
        mario.s.textures = anim.turning;
    }
    // Run
    else if(pressed['d'] || pressed['a']) {
        if(mario.s.textures != anim.small_run) {
            mario.s.textures = anim.small_run;
            mario.s.play();
        }
        if(pressed['shift']) mario.s.animationSpeed = 0.24;
        else mario.s.animationSpeed = 0.16;
    }
    // Still
    else {
        mario.s.textures = anim.small_still;
    }

    // Debug
    document.getElementById('debug').innerHTML = `
    <table>
        <tr>
            <td></td>
            <th>X</th>
            <th>Y</th>
        </tr>
        <tr>
            <th>Coordinate</th>
            <td>${Math.round(mario.s.x)}</td>
            <td>${Math.round(mario.s.y)}</td>
        </tr>
        <tr>
            <th>Motion</th>
            <td>${Math.round(mario.motion.x)}</td>
            <td>${Math.round(mario.motion.y)}</td>
        </tr>
    </table>`;
});


// Event Listeners
document.addEventListener('keydown', event => {
    let key = event.key.toLowerCase();
    pressed[key] = true;
})

document.addEventListener('keyup', event => {
    let key = event.key.toLowerCase();
    delete pressed[key];
})

// Mouse
document.addEventListener('mousedown', event => {
    pressed['leftClick'] = true
})
document.addEventListener('mouseup', event => {
    pressed['leftClick'] = false;
})