const world = {
    paused: false,
    spawn_temporary: [3, 6],

    // Horizontal
    resist_x: 0.98, // 1 being no resistance at all
    air_resist_x: 0.98,
    // air_resist_x: 0.999,
    absolute_slow: 0.01, // Slowest X speed possible before motion is rounded down to 0

    // Vertical
    gravity:  0.125,

    level: './levels/test.json',
    
    // Temporary
    coins: 0,
}

/** Physics objects templates */
const objectTemplate = {
    'default': {
        texture: '1_dead',

        type: 'default',
        player: false,
        enemy: false,
        control: '',

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
        traction: 1,
        air_traction: 1,
        gravity_multiplier: 1,

        motion: {
            x: 0,
            y: 0,
            r: 0,
        },
        facing: 1,
    },
    'mario': {
        texture: '1_small_still',
    
        type: 'mario',
        player: 1,
        // enemy: false,
        control: 'player',

        doMotion: true,
        collision: true,
        friction: true,
        animate_by_state: true,
        // big_sprite: false,
    
        // x: 3,
        // y: 11,
    
        accel_x: 0.075,
        air_accel: 0.075,
        walk: 2.5,
        run: 5,
        jump_accel: 7,
        jump_accel_super: 7.8,
        // traction: 1,
        // air_traction: 1,

        controls: {
            up: 'w',
            left: 'a',
            right: 'd',
            down: 's',
            run: 'shift',
            jump: ' ',
        },
    },
    'luigi': {
        texture: '2_small_still',
    
        type: 'luigi',
        player: 2,
        // enemy: false,
        control: 'player',

        doMotion: true,
        collision: true,
        friction: true,
        animate_by_state: true,
        big_sprite: false,
    
        x: 3,
        y: 11,
    
        accel_x: 0.07,
        air_accel: 0.07,
        walk: 2.5,
        run: 5,
        jump_accel: 7.8,
        jump_accel_super: 8.5,
        traction: 1.005,
        air_traction: 1,
    
        facing: 1,

        controls: {
            up: 'w',
            left: 'a',
            right: 'd',
            down: 's',
            run: 'shift',
            jump: ' ',
        },
    },
    'goomba': {
        texture: 'goomba',

        type: 'goomba',
        player: false,
        enemy: 'goomba',
        control: 'ai',

        doMotion: true,
        collision: true,
        friction: true,
        animate_by_state: false,
        big_sprite: false,
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

    // Green Koopa
    'koopa': {
        texture: 'koopa',

        type: 'koopa',
        player: false,
        enemy: 'koopa',
        control: 'ai',

        doMotion: true,
        collision: true,
        friction: true,
        animate_by_state: false,
        big_sprite: true,
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
        control: 'shell',

        doMotion: true,
        collision: true,
        friction: false,
        animate_by_state: false,
        big_sprite: false,
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
        control: 'ai_turn_at_ledge',

        doMotion: true,
        collision: true,
        friction: true,
        animate_by_state: false,
        big_sprite: true,
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
        control: 'shell',

        doMotion: true,
        collision: true,
        friction: false,
        animate_by_state: false,
        big_sprite: false,
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

        type: 'mushroom',
        player: false,
        enemy: 'powerup',
        control: 'ai',

        doMotion: true,
        collision: true,
        friction: true,
        animate_by_state: false,
        big_sprite: false,
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

    // Particle
    'particle': {
        texture: 'brick_break1',
    
        type: 'particle',
        player: false,
        control: '',

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

        collision: true,
        collisionCode: false,

        container: false,
        contains: false,
    }) {
        // this.type = data.type;
        this.texture = data.texture;
        this.animated = data.animated;

        this.collision = data.collision;
        this.collisionCode = data.collisionCode;

        this.container = data.container;
        this.contains = data.contains;
    }

    set(tile, name) {
        const data = tiledata[name];
        tile.type = name;
        tile.textures = data.texture;
        if(data.animated) { s.animationSpeed = data.animated; s.play(); }
    }

    collide(dir, tile, source) {
        const data = tiledata[tile.type];
        if(data == undefined) return;

        if(data.collisionCode) {
            // Determine block (temporary?)
            switch (data.collisionCode) {
                case 'question':
                    if(dir == 'b' || (dir != 'u' && source.type == 'shell')) {
                        this.animate(tile, 'bounce');
                        this.set(tile, 'used');
                        this.dropItem(tile);
                    }
                    break;
                case 'brick':
                    if(dir == 'b' || (dir != 'u' && source.type == 'shell')) {
                        this.animate(tile, 'bounce');
                        
                        // Drop item
                        
                        this.set(tile, '_');
                        spawn('particle', tile.x, tile.y, {
                            motion: { x: -1.5, y: -5, r: -1, },
                        });
                        spawn('particle', tile.x, tile.y, {
                            motion: { x: 1.5, y: -5, r: 1, }, texture: 'brick_break2'
                        });
                        spawn('particle', tile.x, tile.y, {
                            motion: { x: -2, y: -4, r: -1, }, texture: 'brick_break3'
                        });
                        spawn('particle', tile.x, tile.y, {
                            motion: { x: 2, y: -4, r: 1, }, texture: 'brick_break4'
                        });
                    }
                    break;
                case 'damage':
                    source.death();
                    break;
                default:
                    break;
            }
        }
    }

    dropItem(tile) {
        if(tile.contains == 'coin') collectCoin(true, tile.x, tile.y);
        else {
            spawn(tile.contains, tile.x, tile.y-48, {
                motion: { x: 0, y: -5, r: 0, },
            });
        }
    }

    animate(tile, animation='bounce') {
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

    // Decoration
    'bush': new tiledataclass({
        // type: 'bush',
        texture: anim.bush,
        collision: false,
    }),
    'bush_med': new tiledataclass({
        // type: 'bush',
        texture: anim.bush_med,
        collision: false,
    }),
    'bush_large': new tiledataclass({
        // type: 'bush',
        texture: anim.bush_large,
        collision: false,
    }),
    'cloud': new tiledataclass({
        // type: 'bush',
        texture: anim.cloud,
        collision: false,
    }),
    'cloud_med': new tiledataclass({
        // type: 'bush',
        texture: anim.cloud_med,
        collision: false,
    }),
    'cloud_large': new tiledataclass({
        // type: 'bush',
        texture: anim.cloud_large,
        collision: false,
    }),
    'hill': new tiledataclass({
        // type: 'bush',
        texture: anim.hill,
        collision: false,
    }),
    'hill_large': new tiledataclass({
        // type: 'bush',
        texture: anim.hill_large,
        collision: false,
    }),
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
}
