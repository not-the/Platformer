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
            if(row[k].contains) outrow.push(`${row[k].type}/c/${row[k].contains}`)
            else outrow.push(row[k].type);
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
        data = {},
        additional_data={},
        data_referential={},
    ) {
        // Stack data
        let combined = {
            ...clone(objectTemplate.default), // Defaults
            ...clone(data), // Object template
            ...clone(additional_data), // Overrides
            ...data_referential, // Not cloned, properties can be references
        }
        for(const key in combined) {
            let value = combined[key];
            this[key] = value;
        }
        this.s = new PIXI.AnimatedSprite(anim[this.texture]);

        // State
        this.form = 'small';
        this.speed_x = this.walk; // Current max horizontal speed, changes when running
        this.grounded = false;
        this.jump_ready = true;
        this.jumping = false;
        this.crouching = false;
        this.power_ready = true;
        this.power_anim = 0;
        this.projectiles = 0;
        this.colliding = {
            u: false, r: false, l: false,
        }

        if(this.player != false) this.lives = 3;
        this.invincible = false;
        this.dead = false;

        // Render
        spriteFix(this.s, this.big_sprite);
        [this.s.x, this.s.y] = convertCoord(data.x, data.y);
        this.s.animationSpeed = this.animation_speed || 0.08;
        playPauseSprite(this.s);

        physicsObjects.push(this);
        app.stage.addChild(this.s);

        if(this.lifespan) setTimeout(() => {
            this.death();
        }, this.lifespan);
    }

    tick() {
        // if(this.invincible > 0 && cycle % 30 > 15) {
        //     this.s.opacity = 0;
        // } else this.s.opacity = 1;

        if(this.unloaded || !this.s.visible) return;
        if(this.doMotion) this.physics();
        if(this.control == 'player') this.playerControls();
        else if(this.ai_info) this.ai();
        if(this.animate_by_state) this.animations();
    }

    load(state) {
        // this.unloaded = !state;
        this.s.visible = state;
        if(this.ai_info?.despawn_on_unload && !state) this.death();
    }

    /** Collision */

    /** Physics */
    physics() {
        // Ticking
        if(this.invincible > 0) this.invincible--;

        // Riding
        if(this.riding) {
            const ride = this.riding;
            let offset = this.riding.s.height != 48 ? 48 : 0;
            this.s.x = ride.s.x;
            this.s.y = ride.s.y - ride.s.height + offset;
            if(!this.no_mirror) this.s.scale.x = this.riding.s.scale.x;
            return;
        }

        // Fell offscreen
        if(this.s.y > 768 && !this.dead) {
            if(this.player != false) this.death();
            else this.despawn();
        }

        // Facing
        if(!this.no_mirror) this.s.scale.x = this.facing * 3;

        /* ----- Physics ----- */
        // Ground
        /* const a = { // Adjacent tile shorthand
            inside: '0, 0',
            left: '-1, 0',
            right: '1, 0',
            up: '0, -1',
            under: '0, 1',

            downleft: '-1, 1',
            downright: '1, 1',
            upleft: stage?.[Number(rcx)-1]?.[Number(rcy)-1],
            upright: stage?.[Number(rcx)+1]?.[Number(rcy)-1],
        }
        for(let d in adj) {
            if(adj[d] == undefined) {
                if(rcx > 0 && rcx <= stage.length-2) adj[d] = { type: '_', data: tiledata['_'] };
                else adj[d] = { type: 'ground', data: tiledata['ground'] };
            }
        }

        let [w, h] = [Math.ceil(this.s.width / 48), Math.ceil(this.s.height / 48)];
        let adj = {};
        for(let wi = w; wi > w-3; wi--) {
            for(let hm = h; hm > h-3; hm--) {
                // let tile = this.getAdjacent(wi, hm)
                // if(tile) tile.data.set(tile, 'hard');
                adj[`${wi}, ${hi}`] = this.getAdjacent(wi, hm);
            }
        }
        console.log(adj);
        return; */
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
            upleft: stage?.[Number(rcx)-1]?.[Number(rcy)-1],
            upright: stage?.[Number(rcx)+1]?.[Number(rcy)-1],

            // Tall
            up2: stage?.[rcx]?.[Number(rcy)-2],
            upleft2: stage?.[Number(rcx)-1]?.[Number(rcy)-2],
            upright2: stage?.[Number(rcx)+1]?.[Number(rcy)-2],
        }
        for(let d in adj) {
            if(adj[d] == undefined) {
                if(rcx > 0 && rcx <= stage.length-2) adj[d] = { type: '_', data: tiledata['_'] };
                else adj[d] = { type: 'ground', data: tiledata['ground'] };
            }
        }
        this.adj = adj;

        let ground = 768; // 672 = bottom of screen
        if(adj.downleft.data.collision || adj.under.data.collision || adj.downright.data.collision) {
            if(
                adj.under.data.collision // Under
                || (adj.downleft.data.collision && this.s.x % 48 < 16) // Downleft
                || (adj.downright.data.collision && this.s.x % 48 > 32) // Downright
            ) {
                ground = convertCoord(rcx, Number(rcy))[1]; 
            }
        }

        // Gravity & Vertical from above
        if(this.s.y < ground || Math.sign(world.gravity*this.gravity_multiplier) == -1 || !this.collision
            && Math.sign(this.motion.y) == 1
        ) {
            let grav = world.gravity * this.gravity_multiplier;
            if(this.jumping && Math.sign(this.motion.y) == -1) grav *= 0.7;
            this.motion.y += grav;
            this.grounded = false;
        } else if(this.s.y >= ground) {
            // Halt
            if(!this.grounded && this.collision) {
                this.s.y = ground;
                this.motion.y = 0;
                this.grounded = true;
            }
            // Collision event
            adj.under.data.collide('u', adj.under, this);
            if(!adj.under.data.collision) {
                adj.downleft.data.collide('u', adj.downleft, this);
                adj.downright.data.collide('u', adj.downright, this);
            }
        };

        let allowXMotion = true;
        let allowYMotion = true;
        let tall = (this.form != 'small' && !this.crouching);

        // Vertical from below
        if(this.s.y % 48 > 36 && Math.sign(this.motion.y) == -1)  {
            let left = (adj.upleft.data.collision && this.s.x % 48 < 16);
            let right = (adj.upright.data.collision && this.s.x % 48 > 32);
            let left2 = (adj.upleft2.data.collision && this.s.x % 48 < 16);
            let up2 = (adj.up2.data.collision);
            let right2 = (adj.upright2.data.collision && this.s.x % 48 > 32);

            if(
                // !this.collision && 
                ( (tall && (left2 || up2 || right2))
                ||
                (!tall && tiledata[adj.up.type].collision || left || right ) )
            ) {
                allowYMotion = false;
                this.colliding.u = true;
            }
            adj.up.data.collide('b', adj.up, this);
            if(left) adj.upleft.data.collide('b', adj.upleft, this);
            if(right) adj.upright.data.collide('b', adj.upright, this);
            if(tall) {
                if(left2) adj.upleft2.data.collide('b', adj.upleft2, this);
                if(up2) adj.up2.data.collide('b', adj.up2, this);
                if(right2) adj.upright2.data.collide('b', adj.upright2, this);
            }
        }
        else this.colliding.u = false;

        // Motion & Friction

        // Determine if movement is allowed
        if(this.s.x % 48 < 24) {  // Left wall
            if(Math.sign(this.motion.x) != 1) {
                if(
                    tiledata[adj.left.type].collision
                    || (tall && tiledata[adj.upleft.type].collision)
                ) {
                    allowXMotion = false;
                    this.colliding.l = true;
                    this.s.x = (adj.left.x + 48) || this.s.x;
                }
                adj.left.data.collide('r', adj.left, this);
                if(tall) adj.upleft.data.collide('r', adj.upleft, this);
            }
        } else this.colliding.l = false;
        if(this.s.x % 48 > 24) { // Right wall
            if(Math.sign(this.motion.x) != -1) {
                if(
                    tiledata[adj.right.type].collision
                    || (tall && tiledata[adj.upright.type].collision)
                ) {
                    allowXMotion = false;
                    this.colliding.r = true;
                    this.s.x = (adj.right.x - 48) || this.s.x;
                }
                adj.right.data.collide('l', adj.right, this);
                if(tall) adj.upright.data.collide('l', adj.upright, this);
            }
        } else this.colliding.r = false;

        // Move
        if(allowXMotion || !this.collision) this.runMotion('x'); // Move subject
        else this.motion.x = 0; // Hit wall
        if(allowYMotion || !this.collision) this.runMotion('y'); // Move subject
        else this.motion.y = 0; // Hit ceiling
        // this.s.angle += this.motion.r;
        
        // Apply friction
        if(this.friction) {
            if(this.grounded) this.motion.x -= (this.motion.x * (1 - world.resist_x*this.traction)); // Ground friction
            else this.motion.x *= world.air_resist_x*this.air_traction; // Air friction
            if(Math.abs(this.motion.x) < world.absolute_slow) this.motion.x = 0; // Round to 0
        }

        // Inside block
        if(
            this.collision &&
                (tiledata[adj.inside.type].collision ||
                    (tall && tiledata[adj.up.type].collision))
        ) {
            this.s.x += - 1 * Math.sign(this.s.scale.x);
        }; // Move back if stuck in a block
        adj.inside.data.collide('in', adj.inside, this); // Inside
        if(tall) adj.up.data.collide('in', adj.up, this); // Inside
    }

    // getAdjacent(off_x=0, off_y=0) {
    //     let rc = convertCoord(this.s.x, this.s.y, true);
    //     let rcx = Math.round(Number(rc[0]));
    //     let rcy = Math.round(Number(rc[1]));
    //     let tile = stage?.[Number(rcx) + off_x]?.[Number(rcy) + off_y];

    //     if(tile == undefined) {
    //         if(rcx > 0 && rcx <= stage.length-2) tile = { type: '_', data: tiledata['_'] };
    //         else tile = { type: 'ground', data: tiledata['ground'] };
    //     }

    //     return tile;
    // }

    /** Player animations handler */
    animations() {
        
        /* ----- Animate ----- */
        // Override
        if(this.sprite_override) {
            this.s.textures = anim[this.sprite_override];
        }
        // Using power
        else if(this.power_anim > 0) {
            this.s.textures = anim[`${this.type}_${this.form}_throw`];
            this.power_anim--;
        }
        // Crouch
        else if(this.crouching) {
            this.s.textures = anim[`${this.type}_${this.form}_crouch`];
        }
        // Jump
        else if(!this.grounded) {
            if(!this.jump_ready) this.s.textures = anim[`${this.type}_${this.form}_jump`];
            else this.s.textures = anim[`${this.type}_${this.form}_fall`];
        }
        // Turn
        else if(
            pressed[this.controls.right] && Math.sign(this.motion.x) == -1
            || pressed[this.controls.left] && Math.sign(this.motion.x) == 1
        ) {
            this.s.textures = anim[`${this.type}_${this.form}_turning`];
        }
        // Run
        else if(pressed[this.controls.right] || pressed[this.controls.left]) {
            if(this.s.textures != anim[`${this.type}_${this.form}_run`]) {
                this.s.textures = anim[`${this.type}_${this.form}_run`];
                playPauseSprite(this.s);
            }
            if(pressed[this.controls.run]) this.s.animationSpeed = 0.24;
            else this.s.animationSpeed = 0.16;
        }
        // Still
        else {
            this.s.textures = anim[`${this.type}_${this.form}_still`];
        }
    }

    /** Player controls handler */
    playerControls(rider) {
        if(this.dead == true) return;

        // Riding
        if(pressed[this.controls.action]) this.unride();
        if(this.riding) return this.riding.playerControls(rider || this);

        /* ----- Movement ----- */
        let acceleration = this.grounded ? this.accel_x : this.air_accel;
        let jump = Math.abs(this.motion.x) > 2.8 ? this.jump_accel_super : this.jump_accel;

        // Run
        if(pressed[this.controls.run] && !this.crouching) {
            this.speed_x = this.run;
            this.usePower();
        }
        else {
            this.speed_x = this.walk;
            this.power_ready = true;
        }

        // Jump
        if(pressed[this.controls.jump] && this.grounded && this.jump_ready) {
            this.motion.y -= jump;
            this.jump_ready = false;
            this.jumping = true;
        }
        // Reset jump
        else if(!pressed[' ']) {
            this.jumping = false;
            if(this.grounded) this.jump_ready = true;
        }
        // Crouch
        if(pressed[this.controls.down] && this.grounded) this.crouching = true;
        else if(this.crouching && this.grounded && !(this.form != 'small' && tiledata[this.adj.up.type].collision)) this.crouching = false;
        // Right
        if(pressed[this.controls.right]) {
            if(this.motion.x < this.speed_x && (!this.crouching || !this.grounded)) this.motion.x += acceleration;
            if(this.grounded) this.facing = 1;
        };
        // Left
        if(pressed[this.controls.left]) {
            if(this.motion.x > this.speed_x*-1 && (!this.crouching || !this.grounded)) this.motion.x -= acceleration;
            if(this.grounded) this.facing = -1;
        };
        // Action
        if(pressed[this.controls.action]) {
            this.unride();
        }
    }

    usePower() {
        if(this.power_ready == false) return;
        this.power_ready = false;
        // if(this.form == 'small') return;
        switch (this.form) {
            case 'fire':
                if(this.projectiles >= 2) return;
                this.power_anim = 15;
                // Turn around
                if(pressed[this.controls.left]) this.facing = -1;
                if(pressed[this.controls.right]) this.facing = 1;
                spawn('fireball', this.s.x+this.facing*24, this.s.y-24, {facing: this.facing, lifespan: 7000 }, { owner: this });
                this.projectiles++;
                break;
            default:
                break;
        }
    }

    /** Simple AI. Walks back and forth */
    ai() {
        if(this.dead || this.riding || typeof this.topRider?.player == 'number') return;
        if(this.ai_info.shell) return this.shell();

        /* ----- Movement ----- */
        let acceleration = this.grounded ? this.accel_x : this.air_accel;

        // Turn at ledge
        if(this.ai_info.turn_at_ledge) {
            if(
                tiledata[this.adj.under.type].collision && // must have block below
                (this.s.x % 48 < 12 && !tiledata[this.adj.downleft.type].collision && this.facing == -1
                || this.s.x % 48 > 36 && !tiledata[this.adj.downright.type].collision && this.facing == 1)
            ) this.facing *= -1;
        }

        // Bounce
        if(this.ai_info.bounce) {
            if(this.grounded) this.motion.y = this.jump_accel*-1;
        }

        // Dissipate at wall
        if(this.ai_info.dissipate_at_wall) {
            if(this.colliding.l || this.colliding.r) this.death();
        }

        // auto walk
        if(this.ai_info.auto_walk) {
            // Right
            if(this.facing == 1) {
                if(this.motion.x < this.speed_x) this.motion.x += acceleration;
            };
            // Left
            if(this.facing == -1) {
                if(this.motion.x > this.speed_x*-1) this.motion.x -= acceleration;
            };
        }

        if(this.ai_info.turn_at_wall) {
            if(this.colliding.l) this.facing = 1;
            if(this.colliding.r) this.facing = -1;
        }
    }

    /** Shell AI */
    shell() {
        if(this.dead || !this.collision) return;
        if(this.colliding.l) this.motion.x = this.walk;
        if(this.colliding.r) this.motion.x = this.walk * -1;
    }

    /** Interaction with player. "this" will always be the player
     * @param {*} subject Object player is interacting with
     * @returns 
     */
    playerReaction(subject) {
        if(this.dead || subject.dead || !this.collision || !subject.collision) return;
        let [top, side] = this.objectCollisionDirection(subject);

        // Per enemy behavior
        switch (subject.enemy) {
            // Player
            case false:
                if(top) {
                    this.bouncePlayer();
                } else {
                    let dir = 'left' ? 1 : -1;
                    // this.motion.x = dir/4;
                }
                break;
            // Goomba, Koopa
            case 'goomba':
            case 'koopa':
                if(top) {
                    this.bouncePlayer();
                    subject.damage(this);
                } else this.damage();
                // this.ride(subject);
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
                else if(!top) this.damage();
                break;
            // Mount
            case 'mount':
                if(top && Math.sign(this.motion.y) == 1) this.ride(subject);
                break;
            // Powerup
            case 'powerup':
                let power = subject.type;
                subject.despawn();
                if(this.form != 'small' && power == 'big') return;
                if(this.form != power) {
                    world.paused = true;
                    setTimeout(() => {
                        world.paused = false;
                        // this.sprite_override = undefined;
                    }, 500);
                }
                this.form = power;
                // this.sprite_override = 'powering_up';
                break;
            case 'life':
                subject.despawn();
                this.lives++;
                updateHud();
                break;
            default:
                break;
        }
    }

    objectCollisionDirection(subject) {
        let top = (this.s.y < subject.s.y - 24);
        let side = (this.s.x < subject.s.x) ? 'left' : 'right';
        return [top, side];
    }

    /** Interaction between 2 non-player objects */
    interaction(subject) {
        let actor, actee;
        if(this.dead || subject.dead) return;

        if(this.enemy == 'goomba' && subject.enemy == 'goomba') {
            let [top, side] = this.objectCollisionDirection(subject);
            let [otop, oside] = subject.objectCollisionDirection(this);
            if(top && !this.riding) this.ride(subject);
            else if(otop && !subject.riding) subject.ride(this);
        }
        else if(this.enemy == 'shell' && subject.enemy == 'shell') { // Both shells
            let dir = this.objectCollisionDirection(subject)[1];
            if(this.motion.x == 0 && subject.motion.x != 0) this.genericDeathAnimation(dir === 'left' ? 1 : -1);

            // actor = subject; actee = this;
            // subject.death(this, Math.sign(subject.motion.x));
            // actee.death(actor, Math.sign(actor.motion.x));
        }
        else if(this.enemy == 'shell') {
            actor = this; actee = subject;
            actee.damage(actor, Math.sign(actor.motion.x));
        }
        else if(subject.enemy == 'shell') {
            actor = subject; actee = this;
            actee.damage(actor, Math.sign(actor.motion.x));
        }

        else if(this.enemy == 'fireball' && subject.enemy != 'fireball') {
            actor = this; actee = subject;
            actor.damage();
            actee.damage(actor, Math.sign(actor.motion.x));
        }
        else if(subject.enemy == 'fireball' && this.enemy != 'fireball') {
            actor = subject; actee = this;
            actor.damage();
            actee.damage(actor, Math.sign(actor.motion.x));
        }

        // if(this.enemy == 'powerup')
    }

    /** Attaches an object to the top of another object */
    ride(subject) {
        if(this.riding || subject.rider) return;
        this.riding = subject;
        subject.topRider = this.topRider ? this.topRider : this;
        subject.rider = this;
    }
    unride() {
        if(!this.riding) return;
        delete this.riding.topRider;
        delete this.riding.rider;
        delete this.riding;
        this.bouncePlayer(0, -6, false);
    }

    /** Bounce off enemy/object */
    bouncePlayer(x=0, y=-3, allow_high_bounce=true) {
        if(allow_high_bounce) this.jumping = true;
        if(pressed[this.controls.jump]) y = -6;
        this.motion.y = y;
        if(x != 0) this.motion.x = x;
    }

    /** Damage */
    damage(source={}, dir=0) {
        if(this.invincible > 0) return;
        if(this.rider) this.rider.unride();

        if(this.form == 'small') return this.death(source, dir);
        else if(this.form == 'big') this.form = 'small';
        else this.form = 'big';
        this.invincible = 120;
        // this.sprite_override = 'powering_up';
        world.paused = true;
        setTimeout(() => {
            world.paused = false;
            // this.sprite_override = undefined;
        }, 500);
    }

    /** Player death */
    deathPlayer() {
        this.animate_by_state = false;
        this.s.textures = anim[`${this.type}_dead`];
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
            updateHud();
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
    death(source={}, dir=0) {
        this.dead = true;

        if(this.player != false) return this.deathPlayer();
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
            case 'red_koopa':
                if(source.player != false) {
                    let drop = this.texture == 'red_koopa' ? 'red_shell': 'shell';
                    spawn(drop, this.s.x, this.s.y);
                    this.despawn();
                } else {
                    this.s.textures = this.texture == 'red_koopa' ? anim.red_shell: anim.shell;
                    this.s.scale.y *= -1;
                    this.genericDeathAnimation(dir);
                }
                break;
            case 'shell':
                this.genericDeathAnimation(dir);
            case 'fireball':
                spawn('particle', this.s.x, this.s.y, { texture: 'fire_poof', doMotion: false, animation_speed: 0.2, lifespan: 200, });
                this.despawn();
                break;
            default:
                this.despawn();
                // console.warn('default despawn');
                // this.genericDeathAnimation(dir);
                break;
        }
    }

    /** Generic death animation */
    genericDeathAnimation(dir=-1) {
        if(this.rider) this.rider.unride();
        this.dead = true;
        this.collision = false;
        this.motion.x = 3*dir;
        this.motion.y = -4;
        this.motion.r = 5*dir;
        setTimeout(() => { this.despawn(); }, 3000);
    }

    /** Despawn */
    despawn() {
        if(this.rider) this.rider.unride();
        if(this.owner) this.owner.projectiles--;
        app.stage.removeChild(this.s); // Delete PIXI sprite
        let index = physicsObjects.findIndex(obj => obj === this);
        physicsObjects.splice(index, 1); // Remove from physicsObjects list
    }


    /** Move based on motion */
    runMotion(axis='x') { this.s[axis] += this.motion[axis]; }
}


/** Creates and returns a tile */
function tile(type='ground', x=0, y=0, contained) {
    let s = alterTile(undefined, type, true);
    app.stage.addChild(s);
    return s;

    /** Tile handler */
    function alterTile(s, type, firstTime=false) {
        const data = tiledata[type];
        if(firstTime) {
            s = new PIXI.AnimatedSprite(data.texture);
            spriteFix(s);
            [s.x, s.y] = convertCoord(x, y);
            s.eventMode = 'static'; // 'none'/'passive'/'auto'/'static'/'dynamic'
            s.buttonMode = true;
            s.on('pointerdown', () => { draw(undefined, true); });
            s.on('mouseover', draw);
        }

        // Insert coin
        if(data?.insertable && s.data.container) return s.contains = type;

        // Replace
        if(!firstTime) s.textures = data.texture;
        s.data = data;
        s.type = type;
        s.contains = contained || data.contains;
        s.time_origin = undefined;
        if(data.animated) { s.animationSpeed = data.animated; playPauseSprite(s); }
        return s;
    }

    /** Editor click */
    function draw(event, skip=false) {
        if(!pressed['leftClick'] && !skip) return;
        let value = drawSel.value;
        let [space, name] = value.split('/');
        if(space == 'tile') {
            alterTile(s, name);
        }
        // Build structure
        else if(space == 'structure') {
            const struct = structures[name];
            for(step of struct) {
                let tile = stage[x][y];
                alterTile(tile, step.tile);
                x += step.move[0];
                y += step.move[1];
            }
        }
        else if(space == 'object') {
            if(s.data.collision || s.data.container) {
                s.contains = name;
            } else spawn(name, s.x, s.y);
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
                let [name, datatype, data] = block.split('/');
                stage[hi].push(tile(name, hi, vi, data));
            }
        }

        // Objects
        for(obj of imported.objects) {
            let m = spawn(obj.type, obj.x, obj.y);
            if(obj.type == 'mario' || obj.type == 'luigi') player1 = m;
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
function spawn(name='goomba', x=0, y=0, data={}, data_referential={}) {
    let o = new physicsObject(objectTemplate[name], data, data_referential);
    o.s.x = x;
    o.s.y = y;

    // Interactable
    o.s.eventMode = 'static'; // 'none'/'passive'/'auto'/'static'/'dynamic'
    o.s.buttonMode = true;
    o.s.on('pointerdown', click);
    return o;

    function click() {
        if(drawSel.value == 'tile/_') o.genericDeathAnimation();
    }
}

/** Spawn coin */
function collectCoin(visual=false, x, y) {
    if(visual == true) {
        spawn('particle', x, y, {
            motion: { x: 0, y: -5, r: 0, }, texture: 'coin_collect', lifespan: 500,
        });
    }
    world.coins++;
    updateHud();
}

// HUD
var hudLives = new PIXI.Text('hud', new PIXI.TextStyle({
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
    dropShadowDistance: 3,
    wordWrap: true,
    wordWrapWidth: 440,
    lineJoin: 'round',
}));
hudLives.x = 12;
hudLives.y = 3;
app.stage.addChild(hudLives);
function updateHud() {
    hudLives.text = `Lives x${player1.lives}   Coins x${world.coins}`;
}
updateHud();



// Controls
let pressed = {}


// Game Ticker
let gamespeed = 1;
let cycle = 0;
let elapsed = 0.0;
app.ticker.add(gameTick);

function gameTick(delta, repeat=false) {
    elapsed += delta;

    // Determine framerate
    cycle++;
    if(elapsed < 120) {
        let gs = Math.round(app.ticker.FPS / 60);
        /* if(gamespeed < gs) */ gamespeed = gs;
    }

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
    hudLives.y = -48;

    // Physics
    for(object of physicsObjects) object.tick();


    // Touch detection
    for(i in physicsObjects) {
        let one = physicsObjects[i];
        for(let o = i; o < physicsObjects.length; o++) {
            let two = physicsObjects[o];
            if(one === two) continue;
            if(!one.collision || !two.collision) continue;

            // Pythagorean theorem
            if(distance(one, two)[0] <= one.s.width/2 + two.s.width/2) { // 48 if both are 48 wide
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
    let range = [0, 25]; // 0-24 is the screen
    if(player1.s.x >= app.view.width * 3/5 && !cheats.freecam) {
        let pos = (player1.s.x * -1) + app.view.width * 3/5;
        if(app.stage.scale.x == 1) app.stage.x = pos;

        // Update rendered space
        let left = Math.floor(convertCoord(pos*-1, 0, true)[0]);
        range = [left-2, left+27];
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

    // Tile Culling
    for(let i in stage) {
        let col = stage[i];
        let state = (i >= range[0] && i <= range[1]);
        for(let item of col) {
            item.visible = state;
        }
    }

    // Object unloading
    for(object of physicsObjects) {
        let state = (object.s.x >= (range[0]-6) * 48 && object.s.x <= (range[1]+6) * 48);
        object.load(state);
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
    if(repeat || elapsed < 120) return;
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
    if(key == ' ' || key == 'arrowup' || key == 'arrowdown') event.preventDefault();
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

// Touch
document.querySelectorAll('[data-button]').forEach(e => {
    e.addEventListener('touchstart', event => {
        let key = event.srcElement.dataset.button;
        pressed[key] = true;
    })
    e.addEventListener('touchend', end);
    e.addEventListener('touchcancel', end);
    function end(event) {
        let key = event.srcElement.dataset.button;
        delete pressed[key];
    }
});


// Debug
document.querySelector('canvas').addEventListener('wheel', event => {
    event.preventDefault();
    // event.preventDefault();
    let dir = Math.sign(event.deltaY)*-1;
    cheats.zoom += dir;
    let factor = zoomLevels[cheats.zoom];
    if(factor == undefined) return cheats.zoom -= dir;
    app.stage.scale.x = factor;
    app.stage.scale.y = factor;
})

// Page loses focus
window.onblur = () => { pressed = {}; }

// beforeunload
// window.onbeforeunload = event => {
//     alert("Unsaved changes will be lost"); //Gecko + Webkit, Safari, Chrome etc.
// }
