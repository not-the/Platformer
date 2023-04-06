// const data = {
//     tile: {
//         'ground': {
//             collision: ['u', 'r', 'd', 'l'],
//         }
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

var physicsObjects = [];

class physicsObject {
    constructor(
        texture,
        physics = {
            player: 1,
            enemy: false,
            collision: true,
            animate_by_state: false,
        },
        x, y, stats = {
            accel_x: 0.075,
            air_accel: 0.075,
            walk: 2.5,
            run: 5,
            jump_accel: 7,
            jump_accel_super: 7.8,
        }, facing) {
        this.s = new PIXI.AnimatedSprite(texture);

        // Basic
        this.player = physics.player;
        this.enemy = physics.enemy;
        this.collision = physics.collision;
        this.animate_by_state = physics.animate_by_state;

        // Stats
        this.accel_x = stats.accel_x, // Horizontal acceleration
        this.air_accel = stats.air_accel,
        this.walk = stats.walk, // Max speed when walking
        this.run = stats.run, // Max speed when running
        this.jump_accel = stats.jump_accel, // Jump
        this.jump_accel_super = stats.jump_accel_super, // Jump when running

        // Motion
        this.motion = {
            x: 0,
            y: 0,
        }

        // State
        this.facing = facing;
        this.speed_x = this.walk, // Current max horizontal speed, changes when running
        this.grounded = false;
        this.jump_ready = true;
        this.crouching = false;
        this.colliding = {
            u: false, r: false, l: false,
        }

        // Render
        spriteFix(this.s);
        [this.s.x, this.s.y] = convertCoord(x, y);
        this.s.animationSpeed = 0.08;
        this.s.play();

        physicsObjects.push(this);
        app.stage.addChild(this.s);
    }


    /** Physics */
    physics() {
        // Facing
        this.s.scale.x = this.facing * 3;

        /* ----- Physics ----- */
        // Ground
        let rc = convertCoord(this.s.x, this.s.y, true);
        let rcx = Math.round(Number(rc[0]));
        let rcy = Math.round(Number(rc[1]));
        const adj = { // Adjacent tiles
            inside: stage?.[rcx]?.[rcy],
            left: stage?.[Number(rcx)-1]?.[Number(rcy)],
            right: stage?.[Number(rcx)+1]?.[Number(rcy)],
            up: stage?.[rcx]?.[Number(rcy)-1],
            under: stage?.[rcx]?.[Number(rcy)+1],
        }
        for(let d in adj) {
            if(adj[d] == undefined) adj[d] = { type: 'ground' }
        }
        let ground = 768; // 672 = bottom of screen
        if(adj.under != undefined) if(adj.under.type != 'none') ground = convertCoord(rcx, Number(rcy))[1];

        // Gravity
        if(this.s.y < ground || Math.sign(world.gravity) == -1) {
            this.motion.y += world.gravity;
            this.grounded = false;
        } else if(this.s.y >= ground && !this.grounded) {
            this.s.y = ground;
            this.motion.y = 0;
            this.grounded = true;
        };

        // Motion & Friction
        // Left/Right
        let allowXMotion = true;
        let allowYMotion = true;

        if(this.s.x % 48 < 24) {  // Left wall
            if(
                Math.sign(this.motion.x) != 1
                && adj.left.type != 'none'
            ) {
                allowXMotion = false;
                this.colliding.l = true;
            }
            else this.colliding.l = false;
        }
        if(this.s.x % 48 > 24) { // Right wall
            if(
                Math.sign(this.motion.x) != -1
                && adj.right.type != 'none'
            ) {
                allowXMotion = false;
                this.colliding.r = true;
            }
            else this.colliding.r = false;
        }

        if(allowXMotion) this.s.x += this.motion.x; // Move mario
        else this.motion.x = 0; // Hit wall

        // Vertical
        if(this.s.y % 48 > 36) {
            if(
                adj.up.type != 'none'
                && Math.sign(this.motion.y) == -1
            )  {
                allowYMotion = false;
                this.colliding.u = true;
            }
            else this.colliding.u = false;
        }

        if(allowYMotion) this.s.y += this.motion.y;
        else this.motion.y = 0;
        
        // if(this.grounded) this.motion.x *= world.resist_x; // Ground friction
        // else this.motion.x *= world.air_resist_x; // Air friction
        if(this.grounded) this.motion.x -= (this.motion.x * (1 - world.resist_x)); // Ground friction
        else this.motion.x *= world.air_resist_x; // Air friction
        if(Math.abs(this.motion.x) < world.absolute_slow) this.motion.x = 0; // Round to 0

        // Move this back if stuck in a block
        if(adj.inside.type != 'none') this.s.x += - 1 * Math.sign(this.s.scale.x);


        // Tile culling
        // for(let i = 0; i < stage.length; i++) {
        //     let list = stage[i];
        //     for(let ii = 0; ii < list.length; ii++) {
        //         var object = list[ii];
        //         var bounds = object.getBounds();
        //         let viewport = { x:0, y: 0, 'width': app.stage.width, 'height': app.stage.height }
        //         object.renderable =
        //             bounds.x >= viewport.x && 
        //             bounds.y>=viewport.y && 
        //             bounds.x+bounds.width <= viewport.height && 
        //             bounds.y+bounds.height <= viewport.width;
        //     }
        // } 
    }

    animations() {
        /* ----- Animate ----- */
        // Crouch
        if(this.crouching) {
            this.s.textures = anim.crouch;
        }
        // Jump
        else if(!this.grounded) {
            if(!this.jump_ready) this.s.textures = anim.small_jump;
            else this.s.textures = anim.fall;
        }
        // Turn
        else if(
            pressed['d'] && Math.sign(this.motion.x) == -1
            || pressed['a'] && Math.sign(this.motion.x) == 1
        ) {
            this.s.textures = anim.turning;
        }
        // Run
        else if(pressed['d'] || pressed['a']) {
            if(this.s.textures != anim.small_run) {
                this.s.textures = anim.small_run;
                this.s.play();
            }
            if(pressed['shift']) this.s.animationSpeed = 0.24;
            else this.s.animationSpeed = 0.16;
        }
        // Still
        else {
            this.s.textures = anim.small_still;
        }
    }

    playerControls() {
        /* ----- Movement ----- */
        let acceleration = this.grounded ? this.accel_x : this.air_accel;

        // Run
        if(pressed['shift'] && !this.crouching) this.speed_x = this.run;
        else this.speed_x = this.walk;

        // Jump
        if(pressed[' '] && this.grounded && this.jump_ready) {
            this.motion.y -= Math.abs(this.motion.x) > 2.8 ? this.jump_accel_super : this.jump_accel;
            this.jump_ready = false;
        } else if(!pressed[' '] && this.grounded) {
            this.jump_ready = true;
        }
        // Crouch
        if(pressed['s'] && this.grounded) this.crouching = true;
        else if(this.crouching && this.grounded) this.crouching = false
        // Right
        if(pressed['d']) {
            if(this.motion.x < this.speed_x && (!this.crouching || !this.grounded)) this.motion.x += acceleration;
            if(this.grounded) this.facing = 1;
        };
        // Left
        if(pressed['a']) {
            if(this.motion.x > this.speed_x*-1 && (!this.crouching || !this.grounded)) this.motion.x -= acceleration;
            if(this.grounded) this.facing = -1;
        };
    }

    ai(turn_at_ledges=false) {
        /* ----- Movement ----- */
        let acceleration = this.grounded ? this.accel_x : this.air_accel;

        // Right
        if(this.facing == 1) {
            if(this.motion.x < this.speed_x && (!this.crouching || !this.grounded)) this.motion.x += acceleration;
            if(this.grounded) this.s.scale.x = 3;
        };
        // Left
        if(this.facing == -1) {
            if(this.motion.x > this.speed_x*-1 && (!this.crouching || !this.grounded)) this.motion.x -= acceleration;
            if(this.grounded) this.s.scale.x = -3;
        };

        if(this.colliding.l) this.facing = 1;
        if(this.colliding.r) this.facing = -1;
    }
}


/** Creates and returns a tile */
function tile(type='ground', texture=anim.ground, x=0, y=0) {
    let s = new PIXI.AnimatedSprite(texture);
    s.type = type;
    spriteFix(s);
    [s.x, s.y] = convertCoord(x, y);
    s.eventMode = 'static'; // 'none'/'passive'/'auto'/'static'/'dynamic'
    s.buttonMode = true;
    s.on('pointerdown', () => { draw(undefined, true); });
    s.on('mouseover', draw);

    app.stage.addChild(s);
    return s;

    function draw(event, skip=false) {
        if(!pressed['leftClick'] && !skip) return;
        let value = drawSel.value;
        s.type = value == 'none' ? 'none' : 'ground';
        s.textures = anim[value];
    }
}

// Tiles
var stage = [];
// Horizontal
for(hi = 0; hi < 25; hi++) {
    stage.push([]);
    for(vi = 0; vi < 14; vi++) {
        if(vi >= 12) {
            stage[hi].push(tile('ground', anim.ground, hi, vi));
        } else stage[hi].push(tile('none', anim.none, hi, vi));
        
    }
}


// Enemy test
var goomba = new physicsObject(anim.goomba, {
    player: false,
    enemy: 'goomba',
    collision: true,
    animate_by_state: false,
}, 16, 6,
{
    accel_x: 0.5,
    air_accel: 0.5,
    walk: 1,
    run: 2,
    jump_accel: 4,
    jump_accel_super: 4,
},
-1);

var koopa = new physicsObject(anim.goomba, {
    player: false,
    enemy: 'koopa',
    collision: true,
    animate_by_state: false,
}, 19, 9,
{
    accel_x: 0.5,
    air_accel: 0.5,
    walk: 1,
    run: 2,
    jump_accel: 4,
    jump_accel_super: 4,
},
-1);

// Mario (Player)
var mario = new physicsObject(anim.small_still, {
    player: 1,
    collision: true,
    animate_by_state: true,
},
3, 6,
{
    accel_x: 0.075,
    air_accel: 0.075,
    walk: 2.5,
    run: 5,
    jump_accel: 7,
    jump_accel_super: 7.8,
},
1);

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

    // Physics
    for(object of physicsObjects) {
        if(object.collision) object.physics();
        if(object.player != false) object.playerControls();
        else object.ai(false);
        if(object.animate_by_state) object.animations();
    }


    // Touch detection
    for(i in physicsObjects) {
        let one = physicsObjects[i];
        for(let o = i; o < physicsObjects.length; o++) {
            let two = physicsObjects[o];
            if(one == two) continue;
            // console.log(one.enemy, two.enemy);

            let oneCenterX = one.s.x + (one.s.width/2);
            let oneCenterY = one.s.y + (one.s.height/2);
            let twoCenterX = two.s.x + (two.s.width/2);
            let twoCenterY = two.s.y + (two.s.height/2);
            // console.log('one', oneCenterX, oneCenterY);
            // console.log('two', twoCenterX, twoCenterY);

            if(
                oneCenterX < two.s.x + two.s.width &&
                oneCenterX > two.s.x &&
                oneCenterY > two.s.y + two.s.height &&
                oneCenterY < two.s.y
            ) console.log('overlap');

            // if(Math.abs(oneCenterX - twoCenterX) > 24 && Math.abs(oneCenterY - twoCenterY) > 24) console.log('overlap');
        }
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