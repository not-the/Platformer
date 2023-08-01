/** Editor */
function setEditorTool() {
    drawSel.value = event.srcElement.dataset.value;
    document.querySelectorAll('#tools img').forEach(e => e.classList.remove('selection'));
    event.srcElement.classList.add('selection');
    // if(menuElements['toolbox_icon'] !== undefined) menuElements['toolbox_icon'].textures = anim[drawSel.value];

    htmlMenu('tools', false); // Close toolbox
}

// Players
let delta = 0.5;
var players = {};
let playerID = 1;

/** Join game (local) */
function join(method='keyboard', gamepad_index) {
    players[playerID] = {
        'method':           method,
        'gamepad_index':    gamepad_index,
    };
    for(let [id, object] of Object.entries(physicsObjects)) if(object.player === playerID) players[playerID].object = object;

    /** Product code -> Name */
    // const controllers  = { "09cc)": "Dualshock", }
    /** Product code -> PNG */
    // const method_icons = { "09cc)": "gamepad_ps", }

    // const gp = navigator.getGamepads()[gamepad_index];
    // const product = gp.id.split(' ')[7];
    // console.log(product);
    console.log(`PLAYER (${playerID}) joined using a ${method} ()`);

    /** Update players menu */
    let method_img = /*method_icons[product] || */method;
    const element = document.getElementById(`player_${playerID}`);
    element.classList.remove('inactive');
    element.innerHTML = `
    <div class="box">
        <img src="./assets/ui/${method_img}.png" alt="" title="${method}">
        <figcaption>${playerID}</figcaption>
    </div>
    <input type="button" value="Identify" onclick="gamepadVibrate(${gamepad_index})"${method === 'gamepad' ? '' : ' disabled'}>
    <img src="./assets/player${playerID}/still.png" alt="" class="character">`;

    // Reset
    playerID++;
}

function gamepadVibrate(id) {
    navigator.getGamepads()[id].vibrationActuator.playEffect("dual-rumble", {
        startDelay: 0,
        duration: 300,
        weakMagnitude: 1.0,
        strongMagnitude: 1.0,
    });

    // Vibrate img
    const img = event.srcElement.parentNode.querySelector('img');
    img.classList.add('vibrate');
    setTimeout(() => {
        img.classList.remove('vibrate');
    }, 350);
}


/** Converts pixel coordinates to tile coordinates and vice versa */
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

// Sprite lists
var physicsObjects = {};
var objID = 0;
var menuElements = {};
var menuID = 0;
var animatingTiles = [];

/** Returns the current level in string form */
function exportLevel() {
    const creatorName = document.getElementById("export_creator_name").value || '???';
    var output = {
        creator: creatorName,
        bg: app.renderer.background.color,
        objects: [],
        level: [],
        config: {
            scroll_behavior: world.scroll_behavior,
        }
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
    for(let [key, obj] of Object.entries(physicsObjects)) {
        output.objects.push({
            type: obj.type,
            x: obj.s.x,
            y: obj.s.y,
        });
    }
    return JSON.stringify(output);
}

/** Exports the level to a JSON file and downloads it */
function downloadLevel() {
    let level_string = exportLevel(); // Create file
    var data = "data:text/json;charset=utf-8," + encodeURIComponent(level_string);
    const levelName = document.getElementById("export_level_name").value || 'Custom level';

    let link = document.createElement("a");
    link.setAttribute("href", data);
    link.setAttribute("download", `${levelName}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
}

// Entity class
class entity {
    constructor(
        data = {},
        additional_data={},
        data_referential={},
    ) {
        // Stack data
        let combined = {
            ...clone(objectTemplate.default), // Defaults
            ...clone(data), // Object template
            ...clone(additional_data), // Overrides from the spawn()
            ...data_referential, // Not cloned, properties can be references
        }
        for(const key in combined) {
            let value = combined[key];
            this[key] = value;
        }
        this.s = new PIXI.AnimatedSprite(anim[this.texture]);

        // State
        this.speed_x = this.walk; // Current max horizontal speed, changes when running
        this.gravity_present = 1;
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
        spriteFix(this.s);
        [this.s.x, this.s.y] = convertCoord(data.x, data.y);
        this.s.animationSpeed = this.animation_speed || 0.08;
        playPauseSprite(this.s);

        this.id = objID;
        physicsObjects[this.id] = this;
        objID++;
        app.stage.addChild(this.s);

        if(this.lifespan) setTimeout(() => {
            this.death();
        }, this.lifespan);
    }

    gravity() {
        return world.gravity * this.gravity_multiplier * this.gravity_present;
    }

    tick() {
        /** Run even if paused */
        if(this.player) this.controlsHandler();

        /** Paused */
        if(world.paused) return;
        if(this.ghost) return this.despawn(); // Editor ghost
        
        // Iframe blinking
        if(this.player && this.invincible > 0 && cycle % 30 > 15) this.s.alpha = 0;
        else this.s.alpha = 1;

        if(this.unloaded || !this.s.visible) return; // Unloaded
        if(this.doMotion) this.physics();

        if(this.disabled) return;
        if(this.player) this.playerControls(undefined); /** Player controlled */
        else if(this.ai_info) this.ai(); /** AI controlled */

        // Animate
        if(this.power_anim > 0) this.power_anim--;
        if(this.animate_by_state) this.animations();
    }

    load(state) {
        if(this.player) return;
        // this.unloaded = !state;
        this.s.visible = state;
        if(this.ai_info?.despawn_on_unload && !state) this.death();
    }

    /** Translates keypresses and controller inputs into an easy to use object */
    controlsHandler() {
        const mappings = {
            'keyboard': {
                up:     'w',
                left:   'a',
                right:  'd',
                down:   's',
                run:    'shift',
                jump:   ' ',
                action: 'e',
            },
            'gamepad': {
                up:     12,
                left:   14,
                right:  15,
                down:   13,
                run:    2,
                jump:   0,
                action: 3,
                
                start:  9,
            },
        }
        let user = players[this.player];
        if(user == undefined) return;

        let map = mappings[user.method];
        if(user.method === 'keyboard') {
            for(let [key, value] of Object.entries(map)) this.controls[key] = pressed[value];
        } else if(user.method === 'gamepad') {
            let gamepad = navigator.getGamepads()[user.gamepad_index];
            for(let [key, value] of Object.entries(map)) {
                this.controls[key] = gamepad.buttons[value].pressed;
            }

            if(this.controls['start']) {
                if(!this.hot['start']) menuKey();
                this.hot['start'] = true;
            } else delete this.hot['start'];
        }
    }

    /** Collision */

    /** Physics */
    physics() {
        let stageHeight = stage[0].length*48;
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
        if(this.s.y > stageHeight+48 && !this.dead) {
            if(this.player != false) this.death();
            else this.despawn();
        }
        // Offscreen horizontally
        if((this.s.x < -96 || this.s.x > stage.length *48 + 96) && !this.player) {
            this.despawn();
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
                if(rcx > 0 && rcx <= stage.length-2) adj[d] = { type: '_', data: tileDataset['_'] };
                else adj[d] = { type: 'ground', data: tileDataset['ground'] };
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
                if(rcx > 0 && rcx <= stage.length-2) adj[d] = { type: '_', data: tileDataset['_'] };
                else {
                    let off = rcx <= 0 ? -24 : 72;
                    adj[d] = { type: 'ground', data: tileDataset['ground'], x: (rcx*48+off) };
                }
            }
        }
        this.adj = adj;

        let ground = stageHeight+96; // 672 = bottom of screen
        if(adj.downleft.data.collision.u || adj.under.data.collision.u || adj.downright.data.collision.u) {
            if(
                adj.under.data.collision.u // Under
                || (adj.downleft.data.collision.u && this.s.x % 48 < 16) // Downleft
                || (adj.downright.data.collision.u && this.s.x % 48 > 32) // Downright
                || adj.inside.data.slope || adj.under.data.slope
            ) {
                // Flat
                if(!(adj.inside.data.slope || adj.under.data.slope)) ground = convertCoord(undefined, Number(rcy))[1];
                // Slope
                else {
                    let standing = adj.inside.data.slope ? adj.inside.data.slope : adj.under.data.slope; // Determine which block entity is on
                    let tileY = adj.under.data.slope ? rcy+1 : rcy // Mario is only "inside" the slope for the bottom half, so compensate for him being above it when necessary

                    let sh = Math.round(this.s.x % 48) + 6; // Plus six so Mario doesnt collide with tiles underneath
                    if(standing === 'reverse') sh = 48-sh+12; // Reverse slope
                    ground = convertCoord(undefined, Number(tileY))[1] - sh;
                    if(this.s.y > ground) this.s.y = ground;
                }
            }
        }

        // Gravity & Vertical from above
        let grav = this.gravity();
        if(this.s.y < ground || Math.sign(this.gravity()) == -1 || !this.collision
            && Math.sign(this.motion.y) == 1
        ) {
            // Falling
            if(this.jumping && Math.sign(this.motion.y) == -1) grav *= 0.7;
            this.motion.y += grav * delta*2;
            this.grounded = false;
        } else if(this.s.y >= ground) {
            // Halt
            if(!this.grounded && this.collision) {
                this.s.y = ground;
                this.motion.y = 0;
                this.grounded = true;
                this.pounding = false;
            }
            // Collision event
            adj.under.data.collide('u', adj.under, this);
            if(!adj.under.data.collision.u) {
                adj.downleft.data.collide('u', adj.downleft, this);
                adj.downright.data.collide('u', adj.downright, this);
            }
        };

        let allowXMotion = true;
        let allowYMotion = true;
        let tall = (this.form != 'small' && !this.crouching);

        // Vertical from below
        if(this.s.y % 48 > 36 && Math.sign(this.motion.y) == -1)  {
            let left = (adj.upleft.data.collision.u && this.s.x % 48 < 16);
            let right = (adj.upright.data.collision.u && this.s.x % 48 > 32);
            let left2 = (adj.upleft2.data.collision.u && this.s.x % 48 < 16);
            let up2 = (adj.up2.data.collision.u);
            let right2 = (adj.upright2.data.collision.u && this.s.x % 48 > 32);

            if(
                // !this.collision && 
                ( (tall && (left2 || up2 || right2))
                ||
                (!tall && tileDataset[adj.up.type].collision.u || left || right ) )
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

        // Camera edge - Prevent going off-camera
        if(this.player != false && this.collision) {
            let left = (this.s.x < (app.stage.x*-1) + 24);
            let right = (this.s.x > (app.stage.x*-1) + app.stage.width - 24);
            // Left
            if(left || right) allowXMotion = false;
            if(left) this.s.x = (app.stage.x*-1)+24;
            if(right) this.s.x = (app.stage.x*-1) + app.stage.width - 25;
        }

        // Left wall
        if(this.s.x % 48 < 24 && this.collision) {
            if(
                tileDataset[adj.left.type].collision.r
                || (tall && tileDataset[adj.upleft.type].collision.r)
            ) {
                allowXMotion = false;
                this.colliding.l = true;
                this.s.x = (adj.left.x + 48) || this.s.x;
            }
            adj.left.data.collide('r', adj.left, this);
            if(tall) adj.upleft.data.collide('r', adj.upleft, this);
        }
        this.colliding.l = (this.s.x % 48 <= 24 && tileDataset[adj.left.type].collision.r);

        // Right wall
        if(this.s.x % 48 > 24 && this.collision) {
            if(
                tileDataset[adj.right.type].collision.l
                || (tall && tileDataset[adj.upright.type].collision.l)
            ) {
                allowXMotion = false;
                this.colliding.r = true;
                this.s.x = (adj.right.x - 48) || this.s.x;
            }
            adj.right.data.collide('l', adj.right, this);
            if(tall) adj.upright.data.collide('l', adj.upright, this);
        }
        this.colliding.r = (this.s.x % 48 >= 24 && tileDataset[adj.right.type].collision.l);

        // Move
        if(allowXMotion || !this.collision) this.runMotion('x'); // Move subject
        else this.motion.x = 0; // Hit wall
        if(allowYMotion || !this.collision) this.runMotion('y'); // Move subject
        else this.motion.y = 0; // Hit ceiling
        // this.s.angle += this.motion.r*delta*2;
        
        // Apply friction
        if(this.friction) {
            if(this.grounded) this.motion.x -= (this.motion.x * (1 - world.resist_x*this.traction)) // Ground friction
            * this.adj.under.data.friction // Tile friction
            * (delta*2); // Delta
            else this.motion.x *= world.air_resist_x*this.air_traction; // Air friction
            if(Math.abs(this.motion.x) < world.absolute_slow) this.motion.x = 0; // Round to 0
        }

        // Inside block
        if(
            this.collision &&
                (tileDataset[adj.inside.type].collision.in ||
                    (tall && tileDataset[adj.up.type].collision.in))
        ) {
            this.s.x += - 1 * Math.sign(this.s.scale.x) * delta*2;
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
    //         if(rcx > 0 && rcx <= stage.length-2) tile = { type: '_', data: tileDataset['_'] };
    //         else tile = { type: 'ground', data: tileDataset['ground'] };
    //     }

    //     return tile;
    // }

    /** Animate by state */
    animations() {
        
        /* ----- Animate ----- */
        // Override
        if(this.sprite_override) setAnimation(this.s, this.sprite_override);
        // Using power
        else if(this.power_anim > 0) setAnimation(this.s, `${this.type}_${this.form}_throw`);

        // Crouch
        else if(this.crouching) setAnimation(this.s, `${this.type}_${this.form}_crouch`);
        // Jump
        else if(!this.grounded) {
            if(!this.jump_ready) setAnimation(this.s, `${this.type}_${this.form}_jump`);
            else setAnimation(this.s, `${this.type}_${this.form}_fall`);
        }
        // Turn
        else if(
            this.controls.right && Math.sign(this.motion.x) == -1
            || this.controls.left && Math.sign(this.motion.x) == 1
        ) {
           setAnimation(this.s, `${this.type}_${this.form}_turn`);
        }
        // Run
        else if(this.controls.right || this.controls.left) {
            setAnimation(this.s, `${this.type}_${this.form}_run`);
            if(this.controls.run) this.s.animationSpeed = 0.24;
            else this.s.animationSpeed = 0.16;
        }
        // Still
        else setAnimation(this.s, `${this.type}_${this.form}_still`);

        // Filters
        if(this.star_mode && this.s.filters?.length === 0) this.s.filters = [filters.rainbow];
        else if(this.s.filters?.length !== 0) this.s.filters = [];

        // Power animations
        const power = powers?.[this.form];
        if(power?.animate !== undefined) power.animate(this);
    }

    /** Player controls handler */
    playerControls(rider) {
        if(this.dead == true) return;

        // Timed power countdown
        if(this.star_mode > 0) this.star_mode--;

        // Riding
        if(this.controls.action) this.unride();
        if(this.riding) return this.riding.playerControls(rider || this);

        /* ----- Movement ----- */
        let acceleration = this.grounded ? this.accel_x : this.air_accel;
        if(this.star_mode) acceleration *= 1.5;
        let jump = Math.abs(this.motion.x) > 2.8 ? this.jump_accel_super : this.jump_accel;
        let holding_l_or_r = (this.controls.left || this.controls.right);

        // Parkour moveset
        if(this.form === 'parkour') {
            // Wall slide
            let wall_attached = (this.colliding.l || this.colliding.r);
            if(wall_attached && holding_l_or_r && Math.sign(this.motion.y) == 1 && !this.crouching && !this.grounded) {
                this.motion.y = 0.4;
                if(this.controls.jump) {
                    let jump_direction = this.colliding.l ? 1 : this.colliding.r ? -1 : 0;
                    this.motion.x += jump_direction * 5;
                    this.motion.y -= jump;
    
                    // Jump state
                    this.jump_ready = false;
                    this.jumping = true;
                }
            }
            // Ground pound
            else if(this.controls.down && !this.grounded && !this.pounding) {
                // this.gravity_present = 0;
                this.pounding = true;
                this.motion.y = 3;
            }
        }


        // Run
        if(this.controls.run && !this.crouching) {
            this.speed_x = this.run;
            if(this.star_mode) this.speed_x *= 5;
            this.powerAction();
        }
        else {
            this.speed_x = this.walk;
            this.power_ready = true;
        }

        // Jump button (any time)
        if(this.controls.jump && !this.jump_ready) {
            this.powerJump();
        }

        // Jump
        if(this.controls.jump && this.grounded && this.jump_ready) {
            this.motion.y -= jump;

            // Jump state
            this.jump_ready = false;
            this.jumping = true;
        }
        // Reset jump
        else if(!this.controls.jump) {
            this.jumping = false;
            if(this.grounded) this.jump_ready = true;
        }
        // Crouch
        if(this.controls.down && this.grounded) this.crouching = true;
        else if(this.crouching && this.grounded && !(this.form != 'small' && tileDataset[this.adj.up.type].collision.d)) this.crouching = false;
        // Right
        if(this.controls.right) {
            if(this.motion.x < this.speed_x && (!this.crouching || !this.grounded)) this.motion.x += acceleration * delta*2;
            if(this.grounded || this.form == 'parkour' || this.turns_midair) this.facing = 1;
        };
        // Left
        if(this.controls.left) {
            if(this.motion.x > this.speed_x*-1 && (!this.crouching || !this.grounded)) this.motion.x -= acceleration * delta*2;
            if(this.grounded || this.form == 'parkour' || this.turns_midair) this.facing = -1;
        };
        // Action
        if(this.controls.action) {
            this.unride();
        }
    }

    powerAction() {
        if(this.power_ready == false) return;
        this.power_ready = false;

        // Power action
        const power = powers?.[this.form];
        if(power?.action !== undefined) power.action(this);
    }
    powerJump() {
        // if(this.power_ready == false) return;
        // this.power_ready = false;

        // Power action
        const power = powers?.[this.form];
        if(power?.jump !== undefined) power.jump(this);
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
                tileDataset[this.adj.under.type].collision.u && // must have block below
                (this.s.x % 48 < 12 && !tileDataset[this.adj.downleft.type].collision.u && this.facing == -1
                || this.s.x % 48 > 36 && !tileDataset[this.adj.downright.type].collision.u && this.facing == 1)
            ) this.facing *= -1;
        }

        // Bounce
        if(this.ai_info.bounce) {
            if(this.grounded) this.motion.y = this.jump_accel*-1;
        }

        // Dissipate at wall
        if(this.ai_info.dissipate_at_wall) {
            if(
                (this.colliding.l && Math.sign(this.motion.x) === -1)
                ||
                (this.colliding.r && Math.sign(this.motion.x) === 1)
            ) this.death();
        }

        // auto walk
        if(this.ai_info.auto_walk) {
            // Right
            if(this.facing == 1) {
                if(this.motion.x < this.speed_x) this.motion.x += acceleration * delta*2;
            };
            // Left
            if(this.facing == -1) {
                if(this.motion.x > this.speed_x*-1) this.motion.x -= acceleration * delta*2;
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

    objectCollisionDirection(subject) {
        let top = (this.s.y < subject.s.y - 24);
        let side = (this.s.x < subject.s.x) ? 'left' : 'right';
        return [top, side];
    }

    /** Interaction between 2 physicsObjects */
    interaction(subject, stop=false) {
        if(this.dead || subject.dead || !this.collision || !subject.collision) return;

        let [top, side] = this.objectCollisionDirection(subject);
        const dir = side == 'left' ? subject.walk : subject.walk*-1;
        // let nodamage = false;
        // if(subject.bounces_player && top) nodamage = true;

        // Interactions
        if(this?.ai_info.auto_ride?.includes(subject.type) && top) this.ride(subject); // Auto ride
        if(this.player != false && subject.bounces_player && top && !this.star_mode) this.bounce(subject); // Player bounce

        return; // temporary

        // Take damage
        let takeDamage = ((subject.deal_damage && !nodamage));
        if(subject.type === 'shell' && subject.motion.x === 0) takeDamage = false;
        if(takeDamage) this.damage(subject, dir, top);
        
        // Repeat for subject
        if(!stop) subject.interaction(this, true);
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
        this.bounce(undefined, 0, -6, false);
    }

    /** Bounce off enemy/object */
    bounce(source, x=0, y=-3, allow_high_bounce=true) {
        if(this.gravity_multiplier === 0) return; // Don't bounce if gravity is disabled

        if(allow_high_bounce) this.jumping = true;
        if(this.controls.jump) y -= 3; /** Higher if holding jump */
        if(source?.motion?.y !== undefined) y += source.motion.y; /** Bounce higher if lower object is moving up */
        this.motion.y = y;
        if(x != 0) this.motion.x = x;
    }

    /** Damage */
    damage(source={}, dir=0, top=false) {
        if(this.invincible > 0) return 0;
        if(this.star_mode > 0) return 0;

        // Types
        if(source.deal_damage == 'under' && this.immune.includes('under')) this.bounce(source);
        if(this.immune.includes(source.deal_damage)) return 0;

        // Damage
        if(this.rider) this.rider.unride();
        if(this.form === 'small') return this.death(source, dir);
        else if(this.form === 'big') this.form = 'small';
        else this.form = 'big';
        this.invincible = 120;
        // this.sprite_override = 'powering_up';
        world.paused = true;
        setTimeout(() => {
            world.paused = false;
            // this.sprite_override = undefined;
        }, 500);
    }

    /** Non-player death */
    death(source={}, dir=0, top=false) {
        this.dead = true;
        this.motion.x = 0;
        
        switch (this.enemy) {
            case 'shell':
            case 'bill':
                this.genericDeathAnimation(dir);
            case 'fireball':
                spawn('particle', this.s.x, this.s.y, { texture: this.texture_dead || 'none', doMotion: false, animation_speed: 0.2, lifespan: 200, });
                this.despawn();
                break;
            default:
                this.despawn();
                break;
        }
    }

    /** Generic death animation */
    genericDeathAnimation(dir=1) {
        if(world.paused) return this.despawn();
        if(this.rider) this.rider.unride();
        this.dead = true;
        this.collision = false;
        this.gravity_multiplier = 1;
        this.s.scale.y *= -1;
        this.motion.x = 3*dir;
        this.motion.y = -4;
        this.motion.r = 5*dir;
        setTimeout(() => { this.despawn(); }, 3000);
    }

    /** Despawn */
    despawn() {
        if(this.rider) this.rider.unride();
        if(this.owner && this.owner.projectiles > 0) this.owner.projectiles--;
        deleteSprite(this.s);
        delete physicsObjects[this.id];
    }


    /** Move based on motion */
    runMotion(axis='x') { this.s[axis] += this.motion[axis] * delta*2; }
}

class player extends entity {
    interaction(source={}) {
        if(source.code === 'powerup') {
            if(!this.powers_up) return;
            let power = source.type;
            source.despawn();
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
        }
        if(this.star_mode && source.code !== 'powerup' && !source.player) source.genericDeathAnimation(this);
    }
    death(source={}, dir=0, top=false) {
        this.dead = true;
        this.animate_by_state = false;
        if(anim[`${this.type}_dead`]) this.s.textures = anim[`${this.type}_dead`];
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

            // Determine if singleplayer or not
            let player_count = 0;
            let last_player;
            for(let [key, value] of Object.entries(physicsObjects)) {
                if(value.player !== false) player_count++;
                last_player = value;
            }
        
            // Reset (singleplayer)
            // if(player_count <= 1) {
            //     buildMenu('dead');
            //     setTimeout(() => { restartLevel() }, 1000);
            //     return;
            // }
            if(player_count <= 1) return restartLevel();

            // Reset (multiplayer)
            this.dead = false;
            this.animate_by_state = true;
            this.collision = true;
            [this.motion.x, this.motion.y] = [0, 0];
            [this.s.x, this.s.y] = [last_player.s.x, last_player.s.y-96];
            // [this.s.x, this.s.y] = convertCoord(...[3, 6]);
        }, 3000);
    }
}
class megaman extends player {
    animations() {
        const f = this.power_anim ? '_firing' : '';

        /* ----- Animate ----- */
        // Override
        if(this.sprite_override) {
            this.s.textures = anim[this.sprite_override];
        }

        // Crouch
        else if(this.crouching) {
            this.s.textures = anim[`${this.type}_${this.form}_crouch${f}`];
        }
        // Jump
        else if(!this.grounded) {
            if(!this.jump_ready) this.s.textures = anim[`${this.type}_${this.form}_jump${f}`];
            else this.s.textures = anim[`${this.type}_${this.form}_fall${f}`];
        }
        // Turn
        else if(
            this.controls.right && Math.sign(this.motion.x) == -1
            || this.controls.left && Math.sign(this.motion.x) == 1
        ) {
            this.s.textures = anim[`${this.type}_${this.form}_turn${f}`];
        }
        // Run
        else if(this.controls.right || this.controls.left) {
            if(this.s.textures != anim[`${this.type}_${this.form}_run${f}`]) {
                this.s.textures = anim[`${this.type}_${this.form}_run${f}`];
                playPauseSprite(this.s);
            }
        }
        // Still
        else {
            this.s.textures = anim[`${this.type}_${this.form}_still${f}`];
        }
    }
}
class star extends entity {
    interaction(subject) {
        if(subject.player) {
            subject.star_mode = 1200;
            this.despawn();
        }
    }
}
class goomba extends entity {
    interaction(subject) {
        // Generic
        if(this.dead || subject.dead || !this.collision || !subject.collision) return;
        let [top, side] = this.objectCollisionDirection(subject);
        let [subject_top, subject_side] = subject.objectCollisionDirection(this);

        // Player
        if(subject.deal_damage === 'player') {
            if(subject_top) {
                this.damage();
                subject.bounce();
            }
            else subject.damage();
        }

        // Goomba stack
        if(top && subject.type === 'goomba') this.ride(subject);
    }
    death(source={}, dir=0, top=false) {
        // Generic
        this.dead = true;
        this.motion.x = 0;

        // Goomba death
        if(source.player != false && !top) {
            this.s.textures = anim.goomba_flat;
            setTimeout(() => { this.despawn(); }, 1000);
        }
        else this.genericDeathAnimation(dir);
    }
}
class koopa extends entity {
    interaction(subject) {
        if(this.dead || subject.dead || !this.collision || !subject.collision) return;
        let [top, side] = this.objectCollisionDirection(subject);
        let [subject_top, subject_side] = subject.objectCollisionDirection(this);

        // Player
        if(subject.deal_damage === 'player') {
            if(subject_top) {
                this.damage(subject);
                subject.bounce();
            }
            else subject.damage(this);
        }
    }
    death(source={}, dir=0, top=false) {
        if(source.code === 'player') {
            let drop = this.texture == 'red_koopa' ? 'red_shell': 'shell';
            spawn(drop, this.s.x, this.s.y).invincible = 2;
            this.despawn();
        } else {
            this.s.textures = this.texture == 'red_koopa' ? anim.red_shell: anim.shell;
            this.genericDeathAnimation(dir);
        }
    }
}
class shell extends entity {
    interaction(subject) {
        // Generic
        if(this.dead || subject.dead || !this.collision || !subject.collision || this.invincible) return;
        let [top, side] = this.objectCollisionDirection(subject);
        let dir = side === 'left' ? -1 : 1;
        let [subject_top, subject_side] = subject.objectCollisionDirection(this);

        // Shell behavior
        if(Math.sign(this.motion.x) !== Math.sign(dir) && Math.sign(this.motion.x !== 0) && !subject_top) subject.damage();
        else if(subject.code === 'player') {
            this.invincible = 12;
            if(this.motion.x === 0) this.motion.x = this.walk*dir;
            else this.motion.x = 0;
            if(subject_top) subject.bounce();
        }
    }
}
// Bill, etc
class enemy extends entity {
    interaction(subject) {
        // Generic
        if(this.dead || subject.dead || !this.collision || !subject.collision) return;
        let [top, side] = this.objectCollisionDirection(subject);
        let [subject_top, subject_side] = subject.objectCollisionDirection(this);

        // Player
        if(subject.deal_damage === 'player') {
            if(subject_top) {
                this.damage();
                subject.bounce();
            }
            else subject.damage();
        }
    }
}
class fireball extends entity {
    interaction(subject) {
        // Generic
        if(this.dead || subject.dead || !this.collision || !subject.collision) return;

        // Deal damage
        if(!subject.immune.includes('fireball')) {
            subject.damage();
            this.despawn();
        }
    }
}
class dude extends player {
    animations() {

        /* ----- Animate ----- */
        // Override
        if(this.sprite_override) setAnimation(this.s, this.sprite_override);
        // Using power
        else if(this.power_anim > 0) setAnimation(this.s, `${this.type}_${this.form}_throw`);

        // Whip
        else if(this.attacking > 0) { 
            setAnimation(this.s, `dude_attack`);
            this.attacking--;
            // this.gravity_present = (this.attacking > 0) ? 0.2 : 1;
            // this.motion.y /= 2;
        }

        // Crouch
        else if(this.crouching) setAnimation(this.s, `${this.type}_${this.form}_crouch`);
        // Jump
        else if(!this.grounded) {
            if(this.motion.y < -1) setAnimation(this.s, `${this.type}_${this.form}_jump`); // Rising
            else if(this.motion.y > -1 && this.motion.y < 1) setAnimation(this.s, `${this.type}_${this.form}_still`); // Apex
            else setAnimation(this.s, `${this.type}_${this.form}_fall`); // Falling
        }
        // Turn
        else if(
            this.controls.right && Math.sign(this.motion.x) == -1
            || this.controls.left && Math.sign(this.motion.x) == 1
        ) {
           setAnimation(this.s, `${this.type}_${this.form}_turn`);
        }
        // Run
        else if(this.controls.right || this.controls.left) {
            setAnimation(this.s, `${this.type}_${this.form}_run`);
            if(this.controls.run) this.s.animationSpeed = 0.24;
            else this.s.animationSpeed = 0.16;
        }
        // Still
        else setAnimation(this.s, `${this.type}_${this.form}_still`);

        // Filters
        if(this.star_mode && this.s.filters?.length === 0) this.s.filters = [filters.rainbow];
        else if(this.s.filters?.length !== 0) this.s.filters = [];

        // Power animations
        const power = powers?.[this.form];
        if(power?.animate !== undefined) power.animate(this);



        // DUDE hover
        // if(this.controls.jump && Math.sign(this.motion.y) === 1) this.gravity_present = 0.05;
        // else this.gravity_present = 1;
    }
}

const entities = {
    'player':   player,
    'megaman':  megaman,
    'star':     star,
    // 'powerup': powerup,
    'goomba':   goomba,
    'koopa':    koopa,
    'shell':    shell,
    'bill':     enemy,
    'fireball': fireball,
    'dude':     dude,
}





/** Deletes a sprite */
function deleteSprite(s) { app.stage.removeChild(s); }

/** Creates and returns a tile */
function tile(type='ground', x=0, y=0, contained) {
    let s = alterTile(undefined, type, true);
    app.stage.addChild(s);
    return s;

    /** Tile handler */
    function alterTile(s, type, firstTime=false) {
        const data = tileDataset[type];
        if(firstTime) {
            s = new PIXI.AnimatedSprite(data.texture);
            spriteFix(s);
            [s.x, s.y] = convertCoord(x, y);
            s.eventMode = 'static'; // 'none'/'passive'/'auto'/'static'/'dynamic'
            s.buttonMode = true;
            s.zIndex = 2;
            s.on('pointerdown', () => { draw(undefined, true); });
            s.on('mouseover', draw);
        }

        // OoB, skip
        if(s == undefined) return; 

        // Insert coin
        if(data?.insertable && s?.data?.container) return s.contains = type;

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
        if(!world.editing) return;
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
                let tile = stage?.[x]?.[y];
                if(tile !== undefined && step.tile !== undefined) alterTile(tile, step.tile);
                if(tile !== undefined && step.entity !== undefined) spawn(step.entity, convertCoord(x, 0)[0], convertCoord(0, y)[1], step.data );
                x += step.move[0];
                y += step.move[1];
            }
        }
        else if(space == 'object') {
            if(s.data.collision.in || s.data.container) {
                s.contains = name;
                if(world.paused) spawn(s.contains, s.x, s.y, {ghost:true}); // Editor preview
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
        for(spr of stage[hi]) deleteSprite(spr);
    }
    // Reset objects
    for(i in physicsObjects) physicsObjects[i].despawn();

    stage = [];
    physicsObjects = {};
    objID = 0;
    animatingTiles = [];
}

/** Import level */
function importLevel(data=false, type='url', sub='level', editor=false) {
    world.editing = false;
    world.level = data;
    world.level_data_type = 'url';
    world.sub = sub;

    // Import from local file
    if(type === 'upload') {
        var file = importInput.files[0];
        var reader = new FileReader();
        reader.onload = event => importLevel(JSON.parse(String(event.target.result)), 'raw');
        reader.readAsText(file);
        return;
    }

    // Remember player data between sublevels
    let forms = {};
    for(let [playerID, player] of Object.entries(players)) forms[playerID] = player?.object?.form;

    // Reset
    reset();

    let imported;
    if(data && type === 'url') {
        // Import from serverside file
        try { imported = get(data, true); }
        catch (error) { return console.error('Error fetching level. Details below:', error); }
        generate(imported);
    }
    else if(data && type == 'raw') {
        generate(data);
    }

    // Blank stage
    else {
        // Screen is 25 wide, 14 tall
        const domLevelWidth = document.getElementById("option_level_width");
        const domLevelHeight = document.getElementById("option_level_height");
        for(hi = 0; hi < domLevelWidth.value; hi++) {
            stage.push([]);
            for(vi = 0; vi < domLevelHeight.value; vi++) {
                if(vi >= 12) {
                    stage[hi].push(tile('ground', hi, vi));
                } else stage[hi].push(tile('_', hi, vi));
            }
        }

        app.renderer.background.color = 0x9290ff; // BG color
        spawn("mario", ...convertCoord(3, 11));
    }

    // Close menu
    htmlMenu('creation', false);
    updateLevelOptions();
    panCamera();
    resetHud();
    if(editor) prepEditor();
    else {
        pause(false);
        toggleMenu(false);
    }

    function generate(imported) {
        if(sub !== 'level') imported = imported[sub]; // Sub-level
        const level = imported['level'];
        app.renderer.background.color = imported.bg === undefined ? 0x9290ff : imported.bg; // BG color

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
            let o = spawn(obj.type, obj.x, obj.y);
            /*if(sub !== 'level')*/ o.form = forms[o.player] || o.form;
        }

        // Update
        world.scroll_behavior = imported?.config?.scroll_behavior || 'normal';
        config_scroll_behavior.value = world.scroll_behavior; // Update edit page
        config_bg_color.value = imported.bg;
    }
}
importLevel(world.level);

/** Restart level */
function restartLevel() {
    importLevel(world.level, world.level_data_type, world.sub);
}

/** Resizes the current level */
function resizeLevel(dir, axis='x') {
    if(!world.editing) return console.log('resizeLevel: Not in editor mode, cannot resize');
    // Increase
    if(axis === 'x') {
        if(dir == 1) {
            stage.push([]);
            for(i in stage[0]) {
                stage[stage.length-1].push(tile('_', stage.length-1, i));
            }
        } else if(dir == -1) {
            for(s of stage[stage.length-1]) deleteSprite(s);
            stage.pop();
        }
    }
    else if(axis === 'y') {
        if(dir == -1) {
            for(i in stage) {
                let row = stage[i];
                deleteSprite(row[row.length-1]);
                row.pop();
            }
        } else if(dir == 1) {
            for(i in stage) {
                let row = stage[i];
                row.push(tile('_', i, row.length));
            }
            
        }
    }

    updateLevelOptions();
}

/** Updates values in the level options pane */
function updateLevelOptions() {
    document.getElementById('current_level_width').value = stage.length;
    document.getElementById('current_level_height').value = stage[0].length;
}

/** Spawn object */
function spawn(name='goomba', x=0, y=0, data={}, data_referential={}) {
    if(Object.keys(physicsObjects).length > 250) return console.warn('Object limit reached (250)');
    if(objectTemplate[name] == undefined) return console.warn('Not an object');
    const objClass = entities[objectTemplate[name]?.code] || entities[name] || entity;
    let o = new objClass(objectTemplate[name], data, data_referential);
    o.s.x = x;
    o.s.y = y;
    o.s.scale.x = o.facing * 3;

    for(let [playerID, player] of Object.entries(players)) if(o.player == playerID) player.object = o;
    if(name === 'flag') world.flag = o; // Flag

    // Interactable
    if(!data.ghost) {
        o.s.eventMode = 'static'; // 'none'/'passive'/'auto'/'static'/'dynamic'
        o.s.buttonMode = true;
        o.s.on('pointerdown', click);
    }
    return o;

    /** Editor */
    function click() {
        // Click and drag goes here
        if(drawSel.value == 'tile/_') o.genericDeathAnimation(); // Erase
    }
}

/** Spawn coin */
function collectCoin(visual=false, x, y) {
    if(visual) spawn('particle', x, y, { motion: { x: 0, y: -5, r: 0, }, texture: 'coin_collect', lifespan: 500 });
    world.coins++;
    updateHud();
}




// HUD
var hudLives;
function resetHud() {
    deleteSprite(hudLives);
    hudLives= new PIXI.Text('hud', new PIXI.TextStyle({
        fontFamily: 'visitor',
        fontSize: 40,
        // fontStyle: 'italic',
        // fontWeight: 'bold',
        // fill: ['#ffffff', '#00ff99'], // gradient
        fill: '#ffffff',
        // stroke: '#4a1850',
        // strokeThickness: 5,
        dropShadow: true,
        dropShadowAngle: Math.PI / 4,
        dropShadowColor: '#000000',
        dropShadowDistance: 4,
        dropShadowAlpha: 1,
        wordWrap: true,
        wordWrapWidth: 440,
        lineJoin: 'round',
    }));
    hudLives.zIndex = 5;
    hudLives.x = 12;
    hudLives.y = 3;
    app.stage.addChild(hudLives);

    updateHud();
}
function updateHud() {
    hudLives.text = `Lives x-  Coins x-`;
}
resetHud();
updateHud();


/** Builds menu sprites */
function buildMenu(id='main') {
    // Delete
    destroyMenu();

    // Build
    const menu = menus[id]
    for(element of menu) {
        let offX = element.x - app.stage.x;
        let offY = element.y - app.stage.y + 48;

        if(element.texture == undefined) element.texture = 'button_large';
        let tex = element.texture;
        let s = new PIXI.AnimatedSprite(anim[element.texture]);
        s.id = element.id || menuID;
        s.x = offX;
        s.y = offY
        if(element.click) {
            [s.loop, s.zIndex, s.eventMode, s.buttonMode, s.cursor] = [false, 6, 'static', true, 'pointer'];
            s.on('click', element.click);
            s.on('mouseover', event => { event.currentTarget.play() });
            s.on('mouseout', event => { event.currentTarget.textures = anim[tex]; });
        }
        s.template = element;
        spriteFix(s, false);

        // Add to stage
        app.stage.addChild(s);
        menuElements[element.id || menuID] = s;
        
        // Label
        if(element.label !== undefined) {
            let label = new PIXI.Text(element.label, new PIXI.TextStyle({
                fontFamily: 'visitor',
                fontSize: 45,
                fill: '#ffffff',
                stroke: '#333333',
                strokeThickness: 6,
                dropShadow: true,
                dropShadowAngle: Math.PI / 4,
                dropShadowColor: '#000000',
                dropShadowDistance: 7,
                dropShadowAlpha: 0.2,
            }));
            label.x = offX + 36;
            label.y = offY + 6; // + 18
            s.label = label;

            app.stage.addChild(label);
        }

        // Prepare for next
        world.menu = id;
        menuID++;
    }

    world.editing = (id === 'editor');
}
buildMenu();

function destroyMenu() {
    // Reset
    for(let [key, element] of Object.entries(menuElements)) {
        deleteSprite(element.label);
        deleteSprite(element);
    }
    menuElements = {};
    menuID = 0;
    world.menu = false;
}

/** Escape key */
function menuKey() {
    if(!gamespace.classList.contains('hide_tools')) htmlMenu('tools', false);
    else if(!gamespace.classList.contains('hide_players')) htmlMenu('players', false);
    else if(!gamespace.classList.contains('hide_creation')) htmlMenu('creation', false);
    else if(world.menu === 'editor') buildMenu('main'); // htmlMenu('tools', true);
    else {
        // Pause game & open menu
        toggleMenu(!world.paused);
        pause();
    }
}

/** Pause/Unpause */
function pause(state=undefined) {
    // if(world.paused && world.editing) {
    //     return console.warn('Are you sure you want to exit editor mode? Unsaved changes will be lost');
    // }
    world.paused = state === undefined ? !world.paused : state;
    for(let [keycol, col] of Object.entries(stage)) for(let [key, tile] of Object.entries(col)) playPauseSprite(tile); // Play/pause tiles
    for(let [id, object] of Object.entries(physicsObjects)) playPauseSprite(object.s);
}

/** Toggle main menu */
function toggleMenu(state=false) {
    state ? buildMenu() : destroyMenu();
}

/** Toggle HTML creation menu */
function htmlMenu(id='creation', state=true, pane='create') {
    document.location.hash = state ? `#${pane}` : '';
    style(gamespace, `hide_${id}`, !state);
}

function prepEditor() {
    pause(true);
    buildMenu('editor');

    
    for(spr of app.stage.children) {
        // Stop animations
        if(spr.stop != undefined) playPauseSprite(spr);

        // Editor preview
        if(world.paused && world.editing) {
            try {
                if(spr?.contains !== undefined) spawn('particle', spr?.x, spr?.y, {texture:spr?.contains, ghost:true}); /** Make container contents visible */
                if(spr?.type == 'invis_question') spawn('particle', spr?.x, spr?.y, {texture:'invis_question', ghost:true}); /** Make invisible question blocks visible */
            }
            catch (error) { console.warn(error); }
        }
    }
}


// Controls
let pressed = {}


// Game Ticker
let gamespeed = 1;
let cycle = 0;
let elapsed = 0.0;
app.ticker.add(gameTick);

function gameTick(d, repeat=false) {
    delta = d > 1.25 ? 1.25 : d; // If below a certain framerate, slow game down instead of allowing objects to clip into tiles
    elapsed += d;
    cycle++;

    // Determine framerate
    // if(elapsed < 120) {
    //     let gs = Math.round(app.ticker.FPS / 60);
    //     /* if(gamespeed < gs) */ gamespeed = gs;
    // }

    // Editor
    if(world.editing && world.paused && world.menu === 'editor') {
        let dis = pressed['shift'] ? 10 : 4;
        if(pressed['arrowright'] || pressed['d'])   panCamera(app.stage.x - dis * delta*2,    app.stage.y);
        if(pressed['arrowleft'] || pressed['a'])    panCamera(app.stage.x + dis * delta*2,    app.stage.y);
        // if(pressed['arrowup'] || pressed['w'])      panCamera(app.stage.x,          app.stage.y + dis);
        // if(pressed['arrowdown'] || pressed['s'])    panCamera(app.stage.x,          app.stage.y - dis);
        if(pressed['arrowup'] || pressed['w']) app.stage.y += dis * delta*2;;
        if(pressed['arrowdown'] || pressed['s']) app.stage.y -= dis * delta*2;;
    }

    // Physics
    for(let [key, object] of Object.entries(physicsObjects)) object.tick();

    if(world.paused) return;

    // Touch detection
    for(let [key, object] of Object.entries(physicsObjects)) {
        let one = object;
        for(let [key2, object2] of Object.entries(physicsObjects)) {
            let two = physicsObjects[key2];
            if(one === two) continue;
            if(!one.collision || !two.collision) continue;

            // Pythagorean theorem
            if(distance(one, two)[0] <= one.s.width/2 + two.s.width/2) { // 48 if both are 48 wide
                // let player = false;
                // let nonplayer = false;
                // if(one.player != false) { player = one; nonplayer = two; }
                // if(two.player != false) { player = two; nonplayer = one; }
                one.interaction(two);
                two.interaction(one);
            }
        }
    }

    // Camera panning
    world.scroll_behavior === 'autoscroll' ? panCamera(app.stage.x-1, app.stage.y-1) : panCamera();

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

    // Filters
    filters.rainbow.hue(cycle*1.5 % 360);

    // Debug
    // try {
    //     let pad = navigator.getGamepads()[players[0]['gamepad_index']] ;
    //     document.getElementById('debug').innerHTML = `
    //     <table>
    //         <tr>
    //             <td>(0) X</td>
    //             <th>${pad.buttons[0].pressed ? pad.buttons[0].pressed : ''}</th>
    //         </tr>
    //         <tr>
    //             <td>(1) O</td>
    //             <th>${pad.buttons[1].pressed ? pad.buttons[1].pressed : ''}</th>
    //         </tr>
    //         <tr>
    //             <td>(2) Square</td>
    //             <th>${pad.buttons[2].pressed ? pad.buttons[2].pressed : ''}</th>
    //         </tr>
    //         <tr>
    //             <td>(3) Triangle</td>
    //             <th>${pad.buttons[3].pressed ? pad.buttons[3].pressed : ''}</th>
    //         </tr>
    //         <tr>
    //             <td>(4) L Bumper</td>
    //             <th>${pad.buttons[4].pressed ? pad.buttons[4].pressed : ''}</th>
    //         </tr>
    //         <tr>
    //             <td>(5) R Bumper</td>
    //             <th>${pad.buttons[5].pressed ? pad.buttons[5].pressed : ''}</th>
    //         </tr>
    //         <tr>
    //             <td>(6) L Trigger </td>
    //             <th>${pad.buttons[6].pressed ? pad.buttons[6].pressed : ''}</th>
    //         </tr>
    //         <tr>
    //             <td>(7) R Trigger</td>
    //             <th>${pad.buttons[7].pressed ? pad.buttons[7].pressed : ''}</th>
    //         </tr>
    //         <tr>
    //             <td>(8) Select</td>
    //             <th>${pad.buttons[8].pressed ? pad.buttons[8].pressed : ''}</th>
    //         </tr>
    //         <tr>
    //             <td>(9) Start</td>
    //             <th>${pad.buttons[9].pressed ? pad.buttons[9].pressed : ''}</th>
    //         </tr>
    //         <tr>
    //             <td>(10) L3</td>
    //             <th>${pad.buttons[10].pressed ? pad.buttons[10].pressed : ''}</th>
    //         </tr>
    //         <tr>
    //             <td>(11) R3</td>
    //             <th>${pad.buttons[11].pressed ? pad.buttons[11].pressed : ''}</th>
    //         </tr>
    //         <tr>
    //             <td>(12) Up DPAD</td>
    //             <th>${pad.buttons[12].pressed ? pad.buttons[12].pressed : ''}</th>
    //         </tr>
    //         <tr>
    //             <td>(13) Down DP</td>
    //             <th>${pad.buttons[13].pressed ? pad.buttons[13].pressed : ''}</th>
    //         </tr>
    //         <tr>
    //             <td>(14) Left DP</td>
    //             <th>${pad.buttons[14].pressed ? pad.buttons[14].pressed : ''}</th>
    //         </tr>
    //         <tr>
    //             <td>(15) Right DP</td>
    //             <th>${pad.buttons[15].pressed ? pad.buttons[15].pressed : ''}</th>
    //         </tr>
    //         <tr>
    //             <td>(16) HOME</td>
    //             <th>${pad.buttons[16].pressed ? pad.buttons[16].pressed : ''}</th>
    //         </tr>
    //         <tr>
    //             <td>(17) Trackpad Click</td>
    //             <th>${pad.buttons[17].pressed ? pad.buttons[17].pressed : ''}</th>
    //         </tr>
    //     </table>`;
    // } catch (error) { }
    // document.getElementById('debug').innerHTML = `
    // <table>
    //     <tr>
    //         <td></td>
    //         <th>X</th>
    //         <th>Y</th>
    //     </tr>
    //     <tr>
    //         <th>Coordinate</th>
    //         <td>${Math.round(player1.s.x)}</td>
    //         <td>${Math.round(player1.s.y)}</td>
    //     </tr>
    //     <tr>
    //         <th>Motion</th>
    //         <td>${Math.round(player1.motion.x)}</td>
    //         <td>${Math.round(player1.motion.y)}</td>
    //     </tr>
    //     <tr>
    //         <th>Gamespeed</th>
    //         <td>${gamespeed * 60}fps</td>
    //         <td>${gamespeed}</td>
    //     </tr>
    // </table>`;

    // Run again
    // if(repeat || elapsed < 120) return;
    // if(gamespeed == 1) gameTick(0, true);
}

/** Determines average player's location and pans the camera there */
function panCamera(x, y) {
    let origin = {
        x: app.stage.x,
        y: app.stage.y,
    }
    // Average player position
    let range = [0, 25]; // 0-24 is the screen
    let posX = [];
    let posY = [];
    for(let [key, obj] of Object.entries(physicsObjects)) if(obj.player && (!obj.dead || Object.keys(player).length !== 1)) { posX.push(obj.s.x); posY.push(obj.s.y); }
    posX = Math.round(average(posX)) || 0;
    posY = Math.round(average(posY)) || 0;
    const sleft = (posX < (app.view.width * 2/5) - app.stage.x);
    const sright = (posX > (app.view.width * 3/5) - app.stage.x);
    const exception = (x !== undefined || world.scroll_behavior === 'autoscroll');
    if(
        ( sleft || sright ) || exception
    ) {
        // Limit calculation
        let sectionX = sleft ? 2/5 : 3/5;
        posX = (posX * -1) + app.view.width * sectionX; // Automatic
        const limitX = stage.length * -48 + 1200;

        // Manual
        if(x != undefined) posX = x;

        if(posX > 0) posX = 0; // Left limit
        if(posX < limitX) posX = limitX; // Right limit

        if(posX > app.stage.x && world.scroll_behavior === 'no_left') return; // no_left
        if(app.stage.scale.x == 1) app.stage.x = posX; // Update position
        try { /* Needs a catch because it tries to run before the values exist */
            hudLives.x = (app.stage.x*-1) + 12;
            hudLives.y = (app.stage.y);
        } catch (error) { } 

        // Update rendered region
        let left = Math.floor(convertCoord(Math.round(app.stage.x)*-1, 0, true)[0]);
        range = [left-2, left+27];

        // Tile Culling
        for(let i in stage) {
            let col = stage[i];
            let state = (i >= range[0] && i <= range[1]);
            for(let item of col) item.visible = state;
        }

        // Object unloading
        for(let [key, object] of Object.entries(physicsObjects)) {
            let state = (object.s.x >= (range[0]-6) * 48 && object.s.x <= (range[1]+6) * 48);
            object.load(state);
        }
    }
    const stop = (posY > (app.view.height * 0.3) - app.stage.y);
    const sbottom = (posY < (app.view.height * 0.7) - app.stage.y);
    if(
        (stop || sbottom) || exception
    ) {
        let sectionY = stop ? 0.7 : 0.3;
        posY = (posY * -1) + app.view.height * sectionY; // Automatic
        const limitY = stage[0].length * -48 + 864;

        // Manual
        if(y != undefined) posY = y;
        
        if(posY > 190) posY = 192; // limitY limit
        if(posY < limitY) posY = limitY; // Lower limit

        if(app.stage.scale.y == 1) app.stage.y = posY - 144; // Update position
        try { hudLives.y = app.stage.y*-1; /* Match HUD */ }
        catch (error) { console.warn(error); }
    }

    // Move UI
    for(let [key, element] of Object.entries(menuElements)) {
        element.x += (app.stage.x - origin.x)*-1;
        element.y += app.stage.y - origin.y;
        if(element.label) element.label.x += (app.stage.x - origin.x)*-1;
        if(element.label) element.label.y += app.stage.y - origin.y;
    }
}

/** Get distance between two physics objects */
function distance(one, two) {
    let distX = one.s.x - two.s.x;
    let distY = one.s.y - two.s.y;
    return [Math.sqrt(distX**2 + distY**2), distX, distY];
}



// Event Listeners
document.addEventListener('keydown', event => {
    let key = event.key.toLowerCase();
    pressed[key] = true;
    if(key == ' ' || key == 'arrowup' || key == 'arrowdown') event.preventDefault();

    if(Object.keys(players).length === 0) join('keyboard');
})
document.addEventListener('keyup', event => {
    let key = event.key.toLowerCase();
    delete pressed[key];

    // Pause
    if(key === 'escape') menuKey();

    // Temporary / Developer
    if(key === 'q') {
        style(gamespace, 'hide_tools', !gamespace.classList.contains('hide_tools'));
        world.editing = true;
    }
})

// Mouse
document.addEventListener('mousedown', event => { pressed['leftClick'] = true })
document.addEventListener('mouseup', event => { pressed['leftClick'] = false; })

// Touch
document.querySelectorAll('[data-button]').forEach(e => {
    e.addEventListener('touchstart', event => { pressed[event.target.dataset.button] = true; })
    function end(event) { delete pressed[event.target.dataset.button]; }
    e.addEventListener('touchend', end);
    e.addEventListener('touchcancel', end);
});

/** Gamepad */
window.addEventListener("gamepadconnected", e => {
    // const gp = navigator.getGamepads()[e.gamepad.index];
    join('gamepad', e.gamepad.index);
})
// window.addEventListener("gamepaddisconnected", e => {
//     const gp = navigator.getGamepads()[e.gamepad.index];

    // // Loop players and find relevant user
    // for() {

    // }
    // leave('gamepad', e.gamepad.index);
// })

/** Settings */
function setting(name='controls', state='no') {
    const checkbox = document.getElementById(`setting_${name}`);
    if(state == 'no') checkbox.checked = checkbox.checked;
    else checkbox.checked = state;

    // Update
    if(name === 'controls') style(body, 'show_controls', checkbox.checked);
}

config_scroll_behavior.addEventListener('change', event => {
    if(!world.editing) return event.srcElement.value = world.scroll_behavior;
    world.scroll_behavior = event.srcElement.value;
})
config_bg_color.addEventListener('input', event => {
    app.renderer.background.color = config_bg_color.value;
})

// Debug
document.querySelector('canvas').addEventListener('wheel', event => {
    event.preventDefault();

    // let dir = Math.sign(event.deltaY)*-1;
    // cheats.zoom += dir;
    // let factor = zoomLevels[cheats.zoom];
    // if(factor == undefined) return cheats.zoom -= dir;
    // app.stage.scale.x = factor;
    // app.stage.scale.y = factor;
})

/** Settings Checkboxes */
document.querySelectorAll('.setting').forEach(element => {
    element.addEventListener('change', event => {
        setting(event.srcElement.id.split('_')[1]);
    });
})

// Hash changes
addEventListener("hashchange", event => {
    document.querySelectorAll('.tabs > a').forEach(element => { element.classList.remove('selection'); });
    document.querySelector(`*[href="${document.location.hash}"`)?.classList?.add('selection');
});
if(location.hash === "#dev") toggleMenu(0); // Skip main menu if in dev mode

// Page loses focus
window.onblur = () => { pressed = {}; }

/** Set touch controls visibility */
setting('controls', (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)));


// beforeunload
// window.onbeforeunload = event => {
//     alert("Unsaved changes will be lost"); //Gecko + Webkit, Safari, Chrome etc.
// }
