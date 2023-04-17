const world = {
    paused: false,
    spawn_temporary: [3, 6],

    // Horizontal
    resist_x: 0.98, // 1 being no resistance at all
    air_resist_x: 0.98,
    // air_resist_x: 0.999,
    absolute_slow: 0.01, // Slowest X speed possible before motion is rounded down to 0

    // Vertical
    gravity:  0.15,

    level: './levels/test.json',
    
    // Temporary
    coins: 0,
}

/** Physics objects templates */
const objectTemplate = {
    'default': {
        texture: 'still',

        type: 'default',
        player: false,
        enemy: false,
        ai_info: false,

        doMotion: true,
        collision: true,
        friction: true,
        animate_by_state: false,

        x: 0,
        y: 0,

        accel_x: 0.075,
        air_accel: 0.075,
        walk: 2.5,
        run: 5,
        jump_accel: 6.4,
        jump_accel_super: 7,
        traction: 1,
        air_traction: 1,
        gravity_multiplier: 1,

        motion: {
            x: 0,
            y: 0,
            r: 0,
        },
        facing: 1,

        controls: {
            up: 'w',
            left: 'a',
            right: 'd',
            down: 's',
            run: 'shift',
            jump: ' ',
            action: 'e',
        },
    },
    'mario': {
        texture: 'mario_small_still',
    
        type: 'mario',
        player: 1,
        // enemy: false,
        control: 'player',

        doMotion: true,
        collision: true,
        friction: true,
        animate_by_state: true,
    
        // x: 3,
        // y: 11,
    
        accel_x: 0.075,
        air_accel: 0.075,
        walk: 2.5,
        run: 5,
        jump_accel: 6.4,
        jump_accel_super: 7,
        // traction: 1,
        // air_traction: 1,
    },
    'luigi': {
        texture: 'luigi_small_still',
    
        type: 'luigi',
        player: 2,
        // enemy: false,
        control: 'player',

        doMotion: true,
        collision: true,
        friction: true,
        animate_by_state: true,
    
        x: 3,
        y: 11,
    
        accel_x: 0.05,
        air_accel: 0.075,
        walk: 2.5,
        run: 5,
        jump_accel: 7,
        jump_accel_super: 7.7,
        traction: 1.005,
        air_traction: 1,
    
        facing: 1,
    },

    // Entity
    'mount': {
        texture: 'mount',
    
        type: 'mount',
        enemy: 'mount',

        doMotion: true,
        collision: true,
        friction: true,
        animate_by_state: false,
    
        // x: 3,
        // y: 11,
    
        accel_x: 0.075,
        air_accel: 0.075,
        walk: 2.5,
        run: 5,
        jump_accel: 6.4,
        jump_accel_super: 7,
        // traction: 1,
        // air_traction: 1,
    },

    // Enemies
    'goomba': {
        texture: 'goomba',

        type: 'goomba',
        player: false,
        enemy: 'goomba',
        ai_info: {
            auto_walk: true,
            turn_at_wall: true,
            turn_at_ledge: false,
            dissipate_at_wall: false,
        },

        doMotion: true,
        collision: true,
        friction: true,
        animate_by_state: false,
        traction: 1,
        air_traction: 1,

        accel_x: 0.5,
        air_accel: 0.5,
        walk: 0.8,
        run: 2,
        jump_accel: 4,
        jump_accel_super: 4,

        facing: -1,
        no_mirror: true,
    },

    // Green Koopa
    'koopa': {
        texture: 'koopa',

        type: 'koopa',
        player: false,
        enemy: 'koopa',
        ai_info: {
            auto_walk: true,
            turn_at_wall: true,
            turn_at_ledge: false,
            dissipate_at_wall: false,
        },

        doMotion: true,
        collision: true,
        friction: true,
        animate_by_state: false,
        traction: 1,
        air_traction: 1,

        accel_x: 0.5,
        air_accel: 0.5,
        walk: 0.8,
        run: 2,
        jump_accel: 4,
        jump_accel_super: 4,

        facing: -1,
    },
    'shell': {
        texture: 'shell',

        type: 'shell',
        player: false,
        enemy: 'shell',
        ai_info: {
            shell: true,
        },

        doMotion: true,
        collision: true,
        friction: false,
        animate_by_state: false,
        traction: 1,
        air_traction: 1,

        // accel_x: 0.5,
        // air_accel: 0.5,
        walk: 4.5,
        // run: 5,
        // jump_accel: 2,
        // jump_accel_super: 4,

        facing: -1,
    },
    
    // Red Koopa
    'red_koopa': {
        texture: 'red_koopa',

        type: 'koopa',
        player: false,
        enemy: 'koopa',
        ai_info: {
            auto_walk: true,
            turn_at_wall: true,
            turn_at_ledge: true,
        },

        doMotion: true,
        collision: true,
        friction: true,
        animate_by_state: false,
        traction: 1,
        air_traction: 1,

        accel_x: 0.5,
        air_accel: 0.5,
        walk: 0.8,
        run: 2,
        jump_accel: 4,
        jump_accel_super: 4,

        facing: -1,
    },

    // Temporary - replace with normal shell + texture_override
    'red_shell': {
        texture: 'red_shell',

        type: 'shell',
        player: false,
        enemy: 'shell',
        ai_info: {
            shell: true,
        },

        doMotion: true,
        collision: true,
        friction: false,
        animate_by_state: false,
        traction: 1,
        air_traction: 1,

        // accel_x: 0.5,
        // air_accel: 0.5,
        walk: 4.5,
        // run: 5,
        // jump_accel: 2,
        // jump_accel_super: 4,

        facing: -1,
    },

    // Items
    'mushroom': {
        texture: 'mushroom',

        type: 'big',
        player: false,
        enemy: 'powerup',
        ai_info: {
            auto_walk: true,
            turn_at_wall: true,
            turn_at_ledge: false,
            dissipate_at_wall: false,
        },

        doMotion: true,
        collision: true,
        friction: true,
        animate_by_state: false,
        traction: 1,
        air_traction: 1,

        accel_x: 0.5,
        air_accel: 0,
        walk: 1,
        run: 2,
        jump_accel: 4,
        jump_accel_super: 4,

        facing: 1,
        no_mirror: true,
    },
    'life': {
        texture: 'life',

        type: 'life',
        player: false,
        enemy: 'life',
        ai_info: {
            auto_walk: true,
            turn_at_wall: true,
            turn_at_ledge: false,
            dissipate_at_wall: false,
        },

        doMotion: true,
        collision: true,
        friction: true,
        animate_by_state: false,
        traction: 1,
        air_traction: 1,

        accel_x: 0.5,
        air_accel: 0,
        walk: 1,
        run: 2,
        jump_accel: 4,
        jump_accel_super: 4,

        facing: 1,
        no_mirror: true,
    },
    'flower': {
        texture: 'flower',

        type: 'fire',
        player: false,
        enemy: 'powerup',
        tiered_powerup: true,

        doMotion: true,
        collision: true,
        friction: true,
        animate_by_state: false,

        traction: 1,
        air_traction: 1,

        accel_x: 0.5,
        air_accel: 0,
        walk: 1,
        run: 2,
        jump_accel: 4,
        jump_accel_super: 4,

        facing: 1,
        no_mirror: true,
    },
    'star': {
        texture: 'life',

        type: 'star',
        player: false,
        enemy: 'star',
        ai_info: {
            auto_walk: true,
            bounce: true,
            turn_at_wall: true,
            turn_at_ledge: false,
            dissipate_at_wall: false,
        },

        doMotion: true,
        collision: true,
        friction: false,
        animate_by_state: false,
        traction: 1,
        air_traction: 1,

        accel_x: 0.5,
        air_accel: 0,
        walk: 2,
        jump_accel: 6,

        facing: 1,
        no_mirror: true,
    },

    // 'leaf': {
    //     texture: 'flower',

    //     type: 'leaf',
    //     player: false,
    //     enemy: 'powerup',
    //     tiered_powerup: true,

    //     doMotion: true,
    //     collision: true,
    //     friction: true,
    // },
    'parkour': {
        texture: 'parkour',

        type: 'parkour',
        player: false,
        enemy: 'powerup',
        tiered_powerup: false, // // //

        doMotion: true,
        collision: true,
        friction: true,
    },

    // Projectile
    'fireball': {
        texture: 'fireball',

        type: 'fireball',
        player: false,
        enemy: 'fireball',
        ai_info: {
            auto_walk: true,
            bounce: true,
            turn_at_wall: false,
            turn_at_ledge: false,
            dissipate_at_wall: true,
            despawn_on_unload: true,
        },

        doMotion: true,
        collision: true,
        friction: false,
        animate_by_state: false,
        traction: 1,
        air_traction: 1,

        accel_x: 3,
        air_accel: 3,
        walk: 3,
        jump_accel: 3.2,

        facing: 1,
        no_mirror: true,
    },

    // Particle
    'particle': {
        texture: 'brick_break1',
    
        type: 'particle',
        player: false,

        doMotion: true,
        collision: false,
        friction: true,
        animate_by_state: false,
    
        traction: 1,
        air_traction: 1,
    
        facing: 1,
    },
}

class tiledataclass {
    constructor(data = {
        // type: '_',
        texture: anim.dead,
        animated: false,

        collision: false,
        collisionCode: false,

        container: false,
        contains: false,
    }) {
        // this.type = data.type;
        this.texture = data.texture;
        this.animated = data.animated;

        this.collision = data.collision;
        this.collisionCode = data.collisionCode;

        this.insertable = data.insertable;
        this.container = data.container;
        this.contains = data.contains;
    }

    set(tile, name) {
        const data = tiledata[name];
        tile.type = name;
        tile.data = data;
        tile.contains = data.contains;
        tile.textures = data.texture;
        tile.time_origin = undefined;
        if(data.animated) { s.animationSpeed = data.animated; s.play(); }
    }

    collide(dir, tile, source) {
        if(source.dead || !source.collision) return;
        const data = tiledata[tile.type];
        if(data == undefined) return;

        if(data.collisionCode) {
            // Small
            if(dir=='b' && !tile.contains && source.form == 'small' && source.player) {
                this.animate(tile, 'bounce');
                return;
            }

            // Container
            if(tile.contains && (dir == 'b' || (dir != 'u' && source.type == 'shell'))) {
                this.animate(tile, 'bounce');
                if(this.dropItem(tile, source)) this.set(tile, 'used');
                return;
            }
            
            // Determine block (temporary?)
            switch (data.collisionCode) {
                case 'question':
                    break;
                case 'brick':
                    if(dir == 'b' || (dir != 'u' && source.type == 'shell')) {
                        this.animate(tile, 'bounce');
                        this.set(tile, '_');
                        spawn('particle', tile.x, tile.y, { motion: { x: -1.5, y: -5, r: -1, } });
                        spawn('particle', tile.x, tile.y, { motion: { x: 1.5, y: -5, r: 1, }, texture: 'brick_break2' });
                        spawn('particle', tile.x, tile.y, { motion: { x: -2, y: -4, r: -1, }, texture: 'brick_break3' });
                        spawn('particle', tile.x, tile.y, { motion: { x: 2, y: -4, r: 1, }, texture: 'brick_break4' });
                    }
                    break;
                case 'damage':
                    source.damage();
                    break;
                case 'coin':
                    collectCoin();
                    this.set(tile, '_');
                default:
                    break;
            }

        }
    }

    dropItem(tile, source) {
        if(tile.contains == 'coin') {
            collectCoin(true, tile.x, tile.y-52);
            return true;
        };
        if(tile.contains == 'multi_coin') {
            collectCoin(true, tile.x, tile.y-52);
            if(cycle >= tile.time_origin + 400) return true;
            if(!tile.time_origin) tile.time_origin = cycle;
        }
        else {
            let type = tile.contains;
            const data = objectTemplate[type];
            if(data.tiered_powerup && source.form == 'small') type = 'mushroom';
            spawn(type, tile.x, tile.y-48, { motion: { x:0, y:-5, r:0 } });
            return true;
        }
    }

    animate(tile, animation='bounce') {
        if(animatingTiles.findIndex(obj => obj.tile == tile) != -1) return; // Already mid-animation
        animatingTiles.push({
            'tile': tile,
            'animation': animation,
            'length': 20,
            'time': 20, // in frames
            'origin': {
                x: clone(tile.x),
                y: clone(tile.y),
            },
        });
    }
}

/** Tile data */
const tiledata = {
    '_': new tiledataclass({
        type: '_',
        texture: anim.none,
        collision: false,
    }),
    'ground': new tiledataclass({
        // type: 'ground',
        texture: anim.ground,
        collision: true,
    }),
    'hard': new tiledataclass({
        // type: 'hard',
        texture: anim.hard,
        collision: true,
    }),
    'brick': new tiledataclass({
        // type: 'brick',
        texture: anim.brick,

        collision: true,
        collisionCode: 'brick',

        container: true,
    }),
    'question': new tiledataclass({
        // type: 'question',
        texture: anim.question,
        animated: 0.07,

        collision: true,
        collisionCode: 'question', // temporary

        container: true,
        contains: 'coin',
    }),
    'invis_question': new tiledataclass({
        // type: 'question',
        texture: anim.none,
        animated: false,

        collision: false,
        collisionCode: 'question',

        container: true,
        contains: 'coin',
    }),
    'used': new tiledataclass({
        // type: 'question',
        texture: anim.used,
        animated: false,

        collision: true,
    }),
    'coin': new tiledataclass({
        // type: 'question',
        texture: anim.coin,
        animated: 0.07,

        collision: false,
        collisionCode: 'coin',
        insertable: true,
    }),
    'multi_coin': new tiledataclass({
        // type: 'question',
        texture: anim.coin,
        animated: 0.07,

        collision: false,
        collisionCode: 'coin',
        insertable: true,
    }),
    'spikes': new tiledataclass({
        // type: 'question',
        texture: anim.spikes,
        animated: false,

        collision: true,
        collisionCode: 'damage',
    }),

    'pipe_top_l': new tiledataclass({
        // type: 'question',
        texture: anim.pipe_top_l,
        animated: false,

        collision: true,
    }),
    'pipe_top_r': new tiledataclass({
        // type: 'question',
        texture: anim.pipe_top_r,
        animated: false,

        collision: true,
    }),
    'pipe_l': new tiledataclass({
        // type: 'question',
        texture: anim.pipe_l,
        animated: false,

        collision: true,
    }),
    'pipe_r': new tiledataclass({
        // type: 'question',
        texture: anim.pipe_r,
        animated: false,

        collision: true,
    }),

    'black': new tiledataclass({ texture: anim.black }),
    'bg_brick': new tiledataclass({ texture: anim.bg_brick }),
    'bg_brick_door': new tiledataclass({ texture: anim.bg_brick_door }),
    'bg_brick_mid': new tiledataclass({ texture: anim.bg_brick_mid }),
    'bg_brick_top': new tiledataclass({ texture: anim.bg_brick_top }),
    'brick_window_l': new tiledataclass({ texture: anim.brick_window_l }),
    'brick_window_r': new tiledataclass({ texture: anim.brick_window_r }),

    // Decoration
    'bush': new tiledataclass({ texture: anim.bush }),
    'bush_med': new tiledataclass({ texture: anim.bush_med }),
    'bush_large': new tiledataclass({ texture: anim.bush_large }),
    'cloud': new tiledataclass({ texture: anim.cloud }),
    'cloud_med': new tiledataclass({ texture: anim.cloud_med }),
    'cloud_large': new tiledataclass({ texture: anim.cloud_large }),
    'hill': new tiledataclass({ texture: anim.hill }),
    'hill_large': new tiledataclass({ texture: anim.hill_large }),
}



const structures = {
    'pipe': [
        {
            tile: 'pipe_l',
            move: [0, -1],
        },
        {
            tile: 'pipe_top_l',
            move: [1, 0],
        },
        {
            tile: 'pipe_top_r',
            move: [0, 1],
        },
        {
            tile: 'pipe_r',
            move: [-1, 0],
        }
    ],
    'pipe_neck': [
        {
            tile: 'pipe_l',
            move: [1, 0],
        },
        {
            tile: 'pipe_r',
            move: [-1, 0],
        }
    ],
    'castle': [
        { tile: 'black', move: [-1, 0] },
        { tile: 'bg_brick', move: [-1, 0] },
        { tile: 'bg_brick', move: [0, -1] },
        { tile: 'bg_brick', move: [0, -1] },
        { tile: 'bg_brick_top', move: [1, 1] },
        { tile: 'bg_brick', move: [0, -1] },
        { tile: 'bg_brick_mid', move: [0, -1] },
        { tile: 'brick_window_r', move: [0, -1] },
        { tile: 'bg_brick_top', move: [1, 3] },
        { tile: 'bg_brick_door', move: [0, -1] },
        { tile: 'bg_brick_mid', move: [0, -1] },
        { tile: 'bg_brick', move: [0, -1] },
        { tile: 'bg_brick_top', move: [1, 4] },
        { tile: 'bg_brick', move: [0, -1] },
        { tile: 'bg_brick', move: [0, -1] },
        { tile: 'bg_brick_mid', move: [0, -1] },
        { tile: 'brick_window_l', move: [0, -1] },
        { tile: 'bg_brick_top', move: [1, 4] },
        { tile: 'bg_brick', move: [0, -1] },
        { tile: 'bg_brick', move: [0, -1] },
        { tile: 'bg_brick_top', move: [0, -1] },
    ],
}



const powers = {
    'parkour': {
        animate: object => {
            // Wall slide
            if(object.form === 'parkour' && object.pounding) {
                object.s.textures = anim[`${object.type}_${object.form}_climb2`];
            }
            else if(object.form === 'parkour' && (object.colliding.l || object.colliding.r) && !object.grounded) {
                object.s.textures = anim[`${object.type}_${object.form}_wall_slide`];
            }
        },
    },
    'fire': {
        action: object => {
            if(object.projectiles >= 2) return;
            if(object.projectiles < 0) object.projectiles = 0; // bandaid fix for projectile count randomly going well into the negative and allowing spam
            object.power_anim = 15;
            // Turn around
            if(pressed[object.controls.left]) object.facing = -1;
            if(pressed[object.controls.right]) object.facing = 1;
            spawn('fireball', object.s.x+object.facing*24, object.s.y-24, {facing: object.facing, lifespan: 7000 }, { owner: object });
            object.projectiles++;
        },
    },
}
