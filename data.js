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
}

/** Physics objects templates */
const objectTemplate = {
    'mario': {
        texture: anim.small_still,
    
        type: 'mario',
        player: 1,
        // enemy: false,
        control: 'player',

        doMotion: true,
        collision: true,
        friction: true,
        animate_by_state: true,
        big_sprite: false,
    
        x: 3,
        y: 11,
    
        accel_x: 0.075,
        air_accel: 0.075,
        walk: 2.5,
        run: 5,
        jump_accel: 7,
        jump_accel_super: 7.8,
    
        facing: 1,
    },
    'goomba': {
        texture: anim.goomba,

        type: 'goomba',
        player: false,
        enemy: 'goomba',
        control: 'ai',

        doMotion: true,
        collision: true,
        friction: true,
        animate_by_state: false,
        big_sprite: false,

        x: 0,
        y: 0,

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
        texture: anim.koopa,

        type: 'koopa',
        player: false,
        enemy: 'koopa',
        control: 'ai',

        doMotion: true,
        collision: true,
        friction: true,
        animate_by_state: false,
        big_sprite: true,

        x: 0,
        y: 0,

        accel_x: 0.5,
        air_accel: 0.5,
        walk: 0.8,
        run: 2,
        jump_accel: 4,
        jump_accel_super: 4,

        facing: -1,
    },
    'shell': {
        texture: anim.shell,

        type: 'shell',
        player: false,
        enemy: 'shell',
        control: 'shell',

        doMotion: true,
        collision: true,
        friction: false,
        animate_by_state: false,
        big_sprite: false,

        x: 0,
        y: 0,

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
        texture: anim.red_koopa,

        type: 'red_koopa',
        player: false,
        enemy: 'koopa',
        control: 'ai_turn_at_ledge',

        doMotion: true,
        collision: true,
        friction: true,
        animate_by_state: false,
        big_sprite: true,

        x: 0,
        y: 0,

        accel_x: 0.5,
        air_accel: 0.5,
        walk: 0.8,
        run: 2,
        jump_accel: 4,
        jump_accel_super: 4,

        facing: -1,
    },
    'red_shell': {
        texture: anim.red_shell,

        type: 'red_shell',
        player: false,
        enemy: 'shell',
        control: 'shell',

        doMotion: true,
        collision: true,
        friction: false,
        animate_by_state: false,
        big_sprite: false,

        x: 0,
        y: 0,

        // accel_x: 0.5,
        // air_accel: 0.5,
        walk: 4.5,
        // run: 5,
        // jump_accel: 2,
        // jump_accel_super: 4,

        facing: -1,
    },
}

class tiledataclass {
    constructor(data = {
        type: '_',
        texture: anim.dead,
        animated: false,

        collision: true,
        collisionCode: false,
    }) {
        // this.type = data.type;
        this.texture = data.texture;
        this.animated = data.animated;

        this.collision = data.collision;
        this.collisionCode = data.collisionCode;
    }

    set(tile, name) {
        const data = tiledata[name];
        tile.type = name;
        tile.textures = data.texture;
        if(data.animated) { s.animationSpeed = data.animated; s.play(); }
    }

    collide(dir, tile, source) {
        const data = tiledata[tile.type];
        if(dir == 'b' && data.collisionCode) {
            console.log(data.collisionCode);
            // Determine block (temporary?)
            switch (data.collisionCode) {
                case 'question':
                    this.animate(tile, 'bounce');
                    this.set(tile, 'used');
                    break;
                case 'brick':
                    this.animate(tile, 'bounce');
                    break;
                default:
                    break;
            }
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
    }),
    'question': new tiledataclass({
        // type: 'question',
        texture: anim.question,
        animated: 0.07,

        collision: true,
        collisionCode: 'question', // temporary
    }),
    'used': new tiledataclass({
        // type: 'question',
        texture: anim.used,
        animated: false,

        collision: true,
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
