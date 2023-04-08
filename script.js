/** Get JSON - https://stackoverflow.com/a/22790025/11039898
 * @param {string} url JSON file URL
 * @param {boolean} parse Whether or not to convert into a JS object
 * @returns 
 */
function get(url, parse = false){
    var Httpreq = new XMLHttpRequest(); // a new request
    Httpreq.open("GET", url, false);
    Httpreq.send(null);

    if(parse == true) return JSON.parse(Httpreq.responseText);
    return Httpreq.responseText;          
}

function setEditorTool() {
    drawSel.value = event.srcElement.dataset.value;
    document.querySelectorAll('.tools img').forEach(e => e.classList.remove('selection'));
    event.srcElement.classList.add('selection');
}


let player1;

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
var animatingTiles = [];

function exportLevel() {
    var output = {
        creator: '???',
        objects: [],
        level: [],
    };
    for(i in stage) {
        output.level.push([]);
        let row = stage[i];
        let outrow = output.level[i];
        for(k in row) {
            outrow.push(row[k].type);
        }
    }
    for(obj of physicsObjects) {
        output.objects.push({
            type: obj.type,
            x: obj.s.x,
            y: obj.s.y,
        });
    }
    return JSON.stringify(output);
}

class physicsObject {
    constructor(
        data = {
            type: 'mario',
            texture: anim.dead,
            player: 1,
            enemy: false,
            control: 'player',

            doMotion: true,
            collision: true,
            friction: true,
            animate_by_state: false,
            big_sprite: false,

            x: 0,
            y: 0,

            accel_x: 0.075,
            air_accel: 0.075,
            walk: 2.5,
            run: 5,
            jump_accel: 7,
            jump_accel_super: 7.8,

            facing: 1,
        }) {
        this.s = new PIXI.AnimatedSprite(data.texture);

        // Basic
        this.type = data.type;
        this.player = data.player;
        this.enemy = data.enemy;
        this.control = data.control;
        this.doMotion = data.doMotion;
        this.collision = data.collision;
        this.friction = data.friction;
        this.animate_by_state = data.animate_by_state;
        this.big_sprite = data.big_sprite;

        // Stats
        this.accel_x = data.accel_x, // Horizontal acceleration
        this.air_accel = data.air_accel,
        this.walk = data.walk, // Max speed when walking
        this.run = data.run, // Max speed when running
        this.jump_accel = data.jump_accel, // Jump
        this.jump_accel_super = data.jump_accel_super, // Jump when running

        // Motion
        this.motion = {
            x: 0,
            y: 0,
            r: 0,
        }

        // State
        this.facing = data.facing;
        this.speed_x = this.walk, // Current max horizontal speed, changes when running
        this.grounded = false;
        this.jump_ready = true;
        this.crouching = false;
        this.colliding = {
            u: false, r: false, l: false,
        }

        if(this.player != false) this.lives = 3;
        this.invincible = false;
        this.dead = false;

        // Render
        spriteFix(this.s, this.big_sprite);
        [this.s.x, this.s.y] = convertCoord(data.x, data.y);
        this.s.animationSpeed = 0.08;
        playPauseSprite(this.s);

        physicsObjects.push(this);
        app.stage.addChild(this.s);
    }

    /** Collision */

    /** Physics */
    physics() {
        // Fell offscreen
        if(this.s.y > 768 && !this.dead) {
            if(this.player != false) this.deathPlayer();
            else this.despawn();
        }

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

            downleft: stage?.[Number(rcx)-1]?.[Number(rcy)+1],
            downright: stage?.[Number(rcx)+1]?.[Number(rcy)+1],
        }
        for(let d in adj) {
            if(adj[d] == undefined) {
                if(rcx > 0 && rcx <= stage.length-2) adj[d] = { type: '_', data: tiledata['_'] };
                else adj[d] = { type: 'ground', data: tiledata['ground'] };
            }
        }
        this.adj = adj;
        let ground = 768; // 672 = bottom of screen
        if(adj.under != undefined) if(tiledata[adj.under.type].collision) ground = convertCoord(rcx, Number(rcy))[1];

        // Gravity
        if(this.s.y < ground || Math.sign(world.gravity) == -1 || !this.collision) {
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
                && tiledata[adj.left.type].collision
            ) {
                allowXMotion = false;
                this.colliding.l = true;
                adj.left.data.collide('r', adj.left, this);
            }
            else this.colliding.l = false;
        }
        if(this.s.x % 48 > 24) { // Right wall
            if(
                Math.sign(this.motion.x) != -1
                && tiledata[adj.right.type].collision
            ) {
                allowXMotion = false;
                this.colliding.r = true;
                adj.right.data.collide('l', adj.right, this);
            }
            else this.colliding.r = false;
        }

        // Vertical
        if(this.s.y % 48 > 36) {
            if(
                tiledata[adj.up.type].collision
                && Math.sign(this.motion.y) == -1
            )  {
                allowYMotion = false;
                this.colliding.u = true;
                adj.up.data.collide('b', adj.up, this);
            }
            else this.colliding.u = false;
        }

        if(allowXMotion || !this.collision) this.runMotion('x'); // Move subject
        else this.motion.x = 0; // Hit wall

        if(allowYMotion || !this.collision) this.runMotion('y'); // Move subject
        else this.motion.y = 0; // Hit ceiling

        this.s.angle += this.motion.r;
        
        // if(this.grounded) this.motion.x *= world.resist_x; // Ground friction
        // else this.motion.x *= world.air_resist_x; // Air friction
        if(this.friction) {
            if(this.grounded) this.motion.x -= (this.motion.x * (1 - world.resist_x)); // Ground friction
            else this.motion.x *= world.air_resist_x; // Air friction
            if(Math.abs(this.motion.x) < world.absolute_slow) this.motion.x = 0; // Round to 0
        }

        // Move this back if stuck in a block
        if(tiledata[adj.inside.type].collision) this.s.x += - 1 * Math.sign(this.s.scale.x);


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

    /** Player animations handler */
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
                playPauseSprite(this.s);
            }
            if(pressed['shift']) this.s.animationSpeed = 0.24;
            else this.s.animationSpeed = 0.16;
        }
        // Still
        else {
            this.s.textures = anim.small_still;
        }
    }

    /** Player controls handler */
    playerControls() {
        if(this.dead == true) return;

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

    /** Simple AI. Walks back and forth */
    ai() {
        if(this.dead == true) return;

        /* ----- Movement ----- */
        let acceleration = this.grounded ? this.accel_x : this.air_accel;

        // Turn at ledge
        if(this.control == 'ai_turn_at_ledge') {
            if(
                (this.s.x % 48 < 12 && !tiledata[this.adj.downleft.type].collision && this.facing == -1)
                || (this.s.x % 48 > 36 && !tiledata[this.adj.downright.type].collision && this.facing == 1)
            ) this.facing *= -1;
        }

        // Right
        if(this.facing == 1) {
            if(this.motion.x < this.speed_x) this.motion.x += acceleration;
        };
        // Left
        if(this.facing == -1) {
            if(this.motion.x > this.speed_x*-1) this.motion.x -= acceleration;
        };

        if(this.colliding.l) this.facing = 1;
        if(this.colliding.r) this.facing = -1;
    }

    /** Shell AI */
    shell() {
        if(this.colliding.l) this.motion.x = this.walk;
        if(this.colliding.r) this.motion.x = this.walk * -1;
    }

    /** Interaction with player. "this" will always be the player
     * @param {*} subject Object player is interacting with
     * @returns 
     */
    playerReaction(subject) {
        if(this.dead || subject.dead) return;
        let top = (this.s.y < subject.s.y - 24);
        let side = (this.s.x < subject.s.x) ? 'left' : 'right';

        // Per enemy behavior
        switch (subject.enemy) {
            // Player
            case undefined:
                if(top) {
                    this.bouncePlayer();
                } else {
                    let dir = 'left' ? 1 : -1;
                    this.s.x += dir;
                }
                break;
            // Goomba, Koopa
            case 'goomba':
            case 'koopa':
                if(top) {
                    this.bouncePlayer();
                    subject.death(this);
                } else this.deathPlayer();
                break;
            // Shell
            case 'shell':
                if(top) this.bouncePlayer();
                let dir = side == 'left' ? subject.walk : subject.walk*-1;
                if(subject.motion.x == 0) { // && (Math.sign(dir) == Math.sign(subject.motion.x))
                    subject.motion.x = dir; // Kick
                } else if(subject.motion != 0 && top) {
                    subject.motion.x = 0; // Stop when bouncing
                }
                else if(!top) this.deathPlayer();
                break;
            default:
                break;
        }
    }

    /** Interaction between 2 non-player objects */
    interaction(subject) {
        let actor, actee;
        if(this.dead || subject.dead) return;

        if(this.enemy == 'shell' && subject.enemy == 'shell') { // Both shells
            actor = subject; actee = this;
            subject.death(this, Math.sign(subject.motion.x))
        }
        else if(this.enemy == 'shell') { actor = this; actee = subject; }
        else if(subject.enemy == 'shell') { actor = subject; actee = this; }
        else return; // No interaction

        console.log('test');
        actee.death(actor, Math.sign(actor.motion.x));
    }

    /** Bounce off enemy/object */
    bouncePlayer() {
        let upward = -3;
        if(pressed[' ']) upward = -7;
        this.motion.y = upward;
    }

    /** Player death */
    deathPlayer() {
        this.dead = true;
        this.animate_by_state = false;
        this.s.textures = anim.dead;
        this.collision = false;
        this.doMotion = false;

        setTimeout(() => {
            this.doMotion = true;
            this.motion.x = 0;
            this.motion.y = -7;
        }, 500)


        if(this.lives < 0) return console.log('GAME OVER');

        // Respawn
        setTimeout(() => {
            // Lives
            this.lives--;
            hudLives.text = `Lives x${this.lives}`;
            console.log(`${this.lives} lives remaining`);

            // Reset
            this.dead = false;
            this.animate_by_state = true;
            this.collision = true;
            [this.motion.x, this.motion.y] = [0, 0];
            [this.s.x, this.s.y] = convertCoord(...world.spawn_temporary);
        }, 3000);
    }

    /** Non-player death */
    death(source, dir=0) {
        console.log(source);
        this.dead = true;
        this.motion.x = 0;
        switch (this.enemy) {
            case 'goomba':
                if(source.player != false) {
                    this.s.textures = anim.goomba_flat;
                    setTimeout(() => { this.despawn(); }, 1000);
                }
                else this.genericDeathAnimation(dir);
                break;
            case 'koopa':
                if(source.player != false) {
                    let drop = this.type == 'red_koopa' ? 'red_shell': 'shell';
                    spawn(drop, this.s.x, this.s.y);
                    this.despawn();
                } else {
                    this.s.textures = anim.shell;
                    this.s.scale.y *= -1;
                    this.genericDeathAnimation(dir);
                }
                break;
            case 'shell':
                this.genericDeathAnimation(dir);
            default:
                this.despawn();
                break;
        }
    }

    /** Generic death animation */
    genericDeathAnimation(dir) {
        this.collision = false;
        this.motion.x = 2*dir;
        this.motion.y = -4;
        this.motion.r = 2*dir;
        setTimeout(() => { this.despawn(); }, 3000);
    }

    /** Despawn */
    despawn() {
        app.stage.removeChild(this.s); // Delete PIXI sprite
        let index = physicsObjects.findIndex(obj => obj == this);
        physicsObjects.splice(index, 1); // Remove from physicsObjects list
    }


    /** Move based on motion */
    runMotion(axis='x') { this.s[axis] += this.motion[axis]; }
}


/** Creates and returns a tile */
function tile(type='ground', x=0, y=0) {
    const data = tiledata[type];

    let s = new PIXI.AnimatedSprite(data.texture);
    s.data = data;
    s.type = type;
    spriteFix(s);
    [s.x, s.y] = convertCoord(x, y);

    // Click to draw
    s.eventMode = 'static'; // 'none'/'passive'/'auto'/'static'/'dynamic'
    s.buttonMode = true;
    s.on('pointerdown', () => { draw(undefined, true); });
    s.on('mouseover', draw);

    app.stage.addChild(s);
    return s;

    /** Editor click */
    function draw(event, skip=false) {
        if(!pressed['leftClick'] && !skip) return;
        let value = drawSel.value;
        let [space, name] = value.split('/');
        if(space == 'tile') {
            const data = tiledata[name];
            s.type = name;
            s.textures = data.texture;
            if(data.animated) { s.animationSpeed = data.animated; playPauseSprite(s);; }
        }
        // Build structure
        else if(space == 'structure') {
            const struct = structures[name];
            for(step of struct) {
                let tile = stage[x][y];
                if(tile != false) {
                    let data = tiledata[step.tile];
                    tile.type = step.tile;
                    tile.textures = data.texture;
                }
                x += step.move[0];
                y += step.move[1];
            }
        }
        else if(space == 'object') {
            spawn(name, s.x, s.y)
        }
    }
}


/** Stage */
var stage = [];

/** Reset level */
function reset() {
    // world.paused = true;

    // Reset stage
    for(hi = 0; hi < stage.length; hi++) {
        for(spr of stage[hi]) {
            app.stage.removeChild(spr); // Delete PIXI sprite
        }
    }

    // Reset objects
    for(spr of physicsObjects) {
        app.stage.removeChild(spr.s); // Delete PIXI sprite
    }

    stage = [];
    physicsObjects = [];
    animatingTiles = [];
}

/** Import level */
function importLevel(url=false) {
    reset();

    if(url) {
        let imported;
        try { imported = get(url, true); }
        catch (error) { return console.error('Error fetching level. Details below:', error); }
        // console.log(level);
        const level = imported.level;

        // Stage
        for(hi = 0; hi < level.length; hi++) {
            stage.push([]);
            for(vi = 0; vi < level[hi].length; vi++) {
                let block = level[hi][vi];
                stage[hi].push(tile(block, hi, vi));
            }
        }

        // Objects
        for(obj of imported.objects) {
            let m = spawn(obj.type, obj.x, obj.y);
            if(obj.type == 'mario') player1 = m;
        }
    }

    // Blank stage
    else {
        const stageConfigTemporary = {
            // width: 50, // Screen 25
            height: 14, // Screen 14
        }
        let domLevelWidth = document.getElementById("option_level_width");
        for(hi = 0; hi < domLevelWidth.value; hi++) {
            stage.push([]);
            for(vi = 0; vi < stageConfigTemporary.height; vi++) {
                if(vi >= 12) {
                    stage[hi].push(tile('ground', hi, vi));
                } else stage[hi].push(tile('_', hi, vi));
            }
        }

        player1 = spawn("mario", ...convertCoord(3, 11));
    }
}
importLevel(world.level);

/** Resizes the current level */
function resizeLevel(dir) {
    // Increase
    if(dir == 1) {
        stage.push([]);
        for(i in stage[0]) {
            stage[stage.length-1].push(tile('_', stage.length-1, i));
        }
    } else if(dir == -1) {
        for(s of stage[stage.length-1]) {
            app.stage.removeChild(s);
        }
        stage.pop();
    }
}


/** Spawn object */
function spawn(name='goomba', x=0, y=0) {
    let o = new physicsObject(objectTemplate[name]);
    o.s.x = x;
    o.s.y = y;

    // Interactable
    o.s.eventMode = 'static'; // 'none'/'passive'/'auto'/'static'/'dynamic'
    o.s.buttonMode = true;
    o.s.on('pointerdown', click);
    return o;

    function click() {
        if(drawSel.value == 'tile/_') o.despawn();
    }
}

// Mario (Player)
// player1 = new physicsObject(objectTemplate['mario']);

// HUD
var hudLives = new PIXI.Text('Lives x3', new PIXI.TextStyle({
    fontFamily: 'Comic Sans MS',
    fontSize: 24,
    // fontStyle: 'italic',
    // fontWeight: 'bold',
    // fill: ['#ffffff', '#00ff99'], // gradient
    fill: '#ffffff',
    stroke: '#4a1850',
    strokeThickness: 5,
    dropShadow: true,
    dropShadowColor: '#000000',
    // dropShadowBlur: 4,
    dropShadowAngle: Math.PI / 6,
    dropShadowDistance: 6,
    wordWrap: true,
    wordWrapWidth: 440,
    lineJoin: 'round',
}));
hudLives.x = 12;
hudLives.y = 3;
app.stage.addChild(hudLives);



// Controls
let pressed = {}


// Game Ticker
let gamespeed = 1;
let cycle = 0;
let elapsed = 0.0;
app.ticker.add(gameTick);

function gameTick(delta, repeat=false) {
    elapsed += delta;
    cycle++;
    // Determine framerate
    if(elapsed < 120) {gamespeed = Math.round(app.ticker.FPS / 60); };

    // Cheats
    if(pressed['arrowright'] || pressed['arrowleft'] || pressed['arrowup'] || pressed['arrowdown']) cheats.freecam = true;
    if(cheats.freecam) {
        if(pressed['arrowright']) app.stage.x += -4;
        if(pressed['arrowleft']) app.stage.x += 4;
        if(pressed['arrowup']) app.stage.y += 4;
        if(pressed['arrowdown']) app.stage.y += -4;
    }

    if(world.paused) return;

    // UI (temporary)
    hudLives.x = (app.stage.x*-1) + 12;

    // Physics
    for(object of physicsObjects) {
        if(object.doMotion) object.physics();
        if(object.control == 'player') object.playerControls();
        else if(object.control.startsWith('ai')) object.ai();
        else if(object.control == 'shell') object.shell();
        if(object.animate_by_state) object.animations();
    }


    // Touch detection
    for(i in physicsObjects) {
        let one = physicsObjects[i];
        for(let o = i; o < physicsObjects.length; o++) {
            let two = physicsObjects[o];
            if(one === two) continue;

            // Pythagorean theorem
            if(distance(one, two)[0] <= 48) {
                let player = false;
                let nonplayer = false;
                if(one.player != false) { player = one; nonplayer = two; }
                if(two.player != false) { player = two; nonplayer = one; }
                if(player != false) {
                    player.playerReaction(nonplayer);
                } else {
                    one.interaction(two);
                }
            }
        }
    }

    // Camera panning
    if(player1.s.x >= app.view.width * 3/5 && !cheats.freecam) {
        // console.log('pan');
        app.stage.x = (player1.s.x * -1) + app.view.width * 3/5;
    }

    // Animated tiles
    for(i in animatingTiles) {        
        // Animate
        let item = animatingTiles[i];
        if(item.animation == 'bounce') {
            if(item.time <= item.length/2) item.tile.y += 1;
            else item.tile.y -= 1;
        }

        // Timer
        item.time--;
        if(item.time >= 0) continue;

        // Done
        animatingTiles.splice(i, 1);
        item.tile.x = item.origin.x;
        item.tile.y = item.origin.y;
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
            <td>${Math.round(player1.s.x)}</td>
            <td>${Math.round(player1.s.y)}</td>
        </tr>
        <tr>
            <th>Motion</th>
            <td>${Math.round(player1.motion.x)}</td>
            <td>${Math.round(player1.motion.y)}</td>
        </tr>
        <tr>
            <th>Gamespeed</th>
            <td>${gamespeed * 60}fps</td>
            <td>${gamespeed}</td>
        </tr>
    </table>`;

    // Run again
    if(repeat) return;
    if(gamespeed == 1) gameTick(0, true);
}



// Get distance between two physics objects
function distance(one, two) {
    let distX = one.s.x - two.s.x;
    let distY = one.s.y - two.s.y;
    return [Math.sqrt(distX**2 + distY**2), distX, distY];
}


/** DEBUG */
const zoomLevels = [0.1, 0.3, 0.5, 0.75, 1, 1.5, 2];
var cheats = {
    freecam: false,
    zoom: 4,
}
// function freecam() {

// }


// Event Listeners
document.addEventListener('keydown', event => {
    let key = event.key.toLowerCase();
    pressed[key] = true;
})

document.addEventListener('keyup', event => {
    let key = event.key.toLowerCase();
    delete pressed[key];

    // Pause
    if(key == 'escape') world.paused = !world.paused;
    for(spr of app.stage.children) {
        if(spr.stop != undefined) playPauseSprite(spr);
    }
})

// Mouse
document.addEventListener('mousedown', event => {
    pressed['leftClick'] = true
})
document.addEventListener('mouseup', event => {
    pressed['leftClick'] = false;
})

// Debug
document.addEventListener('wheel', event => {
    // event.preventDefault();
    let dir = Math.sign(event.deltaY)*-1;
    cheats.zoom += dir;
    let factor = zoomLevels[cheats.zoom];
    if(factor == undefined) return cheats.zoom -= dir;
    app.stage.scale.x = factor;
    app.stage.scale.y = factor;
})
