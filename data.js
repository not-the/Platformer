const world = {
    // World
    paused: true,
    editing: false,
    spawn_temporary: [3, 6],

    // UI
    menu: 'main',


    // Horizontal
    resist_x: 0.98, // 1 being no resistance at all
    air_resist_x: 0.98,
    absolute_slow: 0.01, // Slowest X speed possible before motion is rounded down to 0

    // Vertical
    gravity:  0.15,

    // Current level
    level: './levels/test.json',
    
    // Score
    coins: 0, // temporary?
}

const mappings = {
    'keyboard': {
        start:  'escape',
        up:     'w',
        left:   'a',
        right:  'd',
        down:   's',
        run:    'shift',
        jump:   ' ',
        action: 'e',
    },
    'gamepad': {
        start:  9,

        up:     12,
        left:   14,
        right:  15,
        down:   13,
        run:    2,
        jump:   0,
        action: 3,
    },
}

/** DEBUG */
const zoomLevels = [0.1, 0.3, 0.5, 0.75, 1, 1.5, 2];
var cheats = {
    zoom: 4,
}

/** Main Menu */
const menus = {
    main: [
        {
            texture: 'overlay',
            x: 0,
            y: -48,
        },
        {
            texture: 'title',
            x: 64,
            y: 24,
        },
        {
            'label': 'Play',
            x: 64,
            y: 168,
            click: () => {
                if(world.paused) pause();
                toggleMenu(false);
            },
        },
        { // temporary
            'label': 'EDIT',
            x: 524,
            y: 168,
            click: () => {
                prepEditor();
            },
        },
        {
            'label': 'Levels',
            x: 64,
            y: 264,
            click: () => {
                buildMenu('browse');
            }
        },
        {
            'label': 'Create...',
            x: 64,
            y: 384,
            click: () => {
                htmlMenu('creation', true, 'create');
            }
        },
        {
            texture: 'half_button',
            'label': 'Export',
            x: 64,
            y: 480,
            click: () => {
                htmlMenu('creation', true, 'export');
            }
        },
        {
            texture: 'half_button',
            'label': 'Import',
            x: 284,
            y: 480,
            click: () => {
                htmlMenu('creation', true, 'import');
            }
        },

        // Controllers button
        {
            texture: 'small_button',
            x: 950,
            y: 480,
            click: () => {
                htmlMenu('players', true, '');
            }
        },
        {
            texture: 'gamepad',
            x: 950,
            y: 480,
        },

        // Settings button
        {
            texture: 'small_button',
            x: 1049,
            y: 480,
            click: () => {
                htmlMenu('creation', true, 'settings');
            }
        },
        {
            texture: 'gear',
            x: 1049,
            y: 480,
        },
    ],

    browse: [
        {
            texture: 'overlay',
            x: 0,
            y: -48,
        },
        {
            texture: 'button_small',
            'label': 'Back',
            x: 64,
            y: 32,
            click: () => {
                buildMenu('main');
            },
        },

        // Col 1
        {
            texture: 'button_large_blue',
            'label': 'TEST',
            x: 64,
            y: 128,
            click: () => { importLevel('./levels/test.json') },
        },
        {
            texture: 'button_large_blue',
            'label': 'Super Mario Bros. 1-1',
            x: 64,
            y: 224,
            click: () => { importLevel('./levels/1-1.json') },
        },
        {
            texture: 'button_large_blue',
            'label': 'user1',
            x: 64,
            y: 320,
            click: () => { importLevel('./levels/user1.json') },
        },
        // {
        //     texture: 'button_large_blue',
        //     'label': 'user2',
        //     x: 64,
        //     y: 416,
        //     click: () => { importLevel('./levels/user2.json') },
        // },

        // Col 2
        // {
        //     texture: 'button_large_blue',
        //     'label': 'PLACEHOLDER',
        //     x: 524,
        //     y: 128,
        //     click: () => { importLevel('./levels/test.json') },
        // },
        // {
        //     texture: 'button_large_blue',
        //     'label': 'PLACEHOLDER',
        //     x: 524,
        //     y: 224,
        //     click: () => { importLevel('./levels/test.json') },
        // },
        // {
        //     texture: 'button_large_blue',
        //     'label': 'PLACEHOLDER',
        //     x: 524,
        //     y: 320,
        //     click: () => { importLevel('./levels/test.json') },
        // },
        // {
        //     texture: 'button_large_blue',
        //     'label': 'PLACEHOLDER',
        //     x: 524,
        //     y: 416,
        //     click: () => { importLevel('./levels/test.json') },
        // },

        // Next/previous
        // {
        //     texture: 'half_button_small',
        //     'label': '<- Prev',
        //     x: 64,
        //     y: 520,
        //     click: () => {
        //         buildMenu('main');
        //     },
        // },
        // {
        //     texture: 'half_button_small',
        //     'label': 'Next ->',
        //     x: 284,
        //     y: 520,
        //     click: () => {
        //         buildMenu('main');
        //     },
        // },
    ],

    editor: [
        {
            texture: 'toolbar',
            x: 0,
            y: -48,
        },
    ],
}



/** Physics objects templates */
const objectTemplate = {
    'default': {
        texture: 'mario_small_still',

        type: 'default',
        player: false,
        form: 'small',
        enemy: false,
        ai_info: false,
        deal_damage: false,
        immune: ['enemy', 'sharp'], // Damage type immunity list
        bounces_player: true,       // If players will bounce off of this
        interacts: [],              // If interacts with interactable tiles - 'b' below, 's', sides
        powers_up: false,           // Determines if powerups change state

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
            up:     false,
            left:   false,
            right:  false,
            down:   false,
            run:    false,
            jump:   false,
            action: false,
        },
        hot: {}, /** Button cooldown- prevents pause button from firing every frame */
    },
    'mario': {
        texture: 'mario_small_still',
    
        type: 'mario',
        player: 1,
        // enemy: false,
        deal_damage: 'player',
        immune: ['player', 'under'],
        interacts: ['b'],
        powers_up: true,

        doMotion: true,
        collision: true,
        friction: true,
        animate_by_state: true,
    
        // x: 3,
        // y: 11,
    
        accel_x: 0.085,
        air_accel: 0.085,
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
        deal_damage: 'player',
        immune: ['player', 'under'],
        interacts: ['b'],
        powers_up: true,

        doMotion: true,
        collision: true,
        friction: true,
        animate_by_state: true,
    
        x: 3,
        y: 11,
    
        accel_x: 0.063,
        air_accel: 0.085,
        walk: 2.5,
        run: 5,
        jump_accel: 7,
        jump_accel_super: 7.7,
        traction: 1.005,
        air_traction: 1,
    
        facing: 1,
    },

    // Mega Man
    'megaman': {
        texture: 'megaman_big_still',
    
        type: 'megaman',
        player: 1,
        form: 'big',
        // deal_damage: 'player',
        immune: ['player'],
        interacts: ['b'],

        animate_by_state: true,
    
        accel_x: 0.5,
        air_accel: 0.5,
        walk: 2.5,
        run: 2.5,
        jump_accel: 7,
        jump_accel_super: 7,
        traction: 0.9,
        air_traction: 0.9,
        gravity_multiplier: 1.4,

        facing: 1,
    },

    // Entity
    'mount': {
        texture: 'mount_still',
    
        type: 'mount',
        enemy: 'mount',
        immune: ['sharp', 'player'],

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
            auto_ride: ['goomba'],
        },
        deal_damage: 'enemy',

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
        deal_damage: 'enemy',

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
        deal_damage: 'shell', // interact ??
        immune: ['player', 'enemy'],
        interacts: ['b', 's'],

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
        deal_damage: 'enemy',

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
        deal_damage: 'shell',
        immune: ['player', 'enemy'],
        interacts: ['b', 's'],

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
    // Bill
    'bill': {
        texture: 'bill',

        type: 'bill',
        player: false,
        enemy: 'bill',
        ai_info: {
            auto_walk: true,
            // dissipate_at_wall: true,
        },
        deal_damage: 'enemy',
        // interacts: ['b', 's', 'a'],

        doMotion: true,
        collision: false,
        friction: false,
        animate_by_state: false,
        traction: 1,
        air_traction: 1,
        gravity_multiplier: 0,

        accel_x: 1,
        air_accel: 1,
        walk: 2,

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
        bounces_player: false,
        immune: ['under'],

        doMotion: true,
        collision: true,
        friction: true,
        animate_by_state: false,
        traction: 1,
        air_traction: 1,

        accel_x: 0.5,
        air_accel: 0.5,
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
        bounces_player: false,
        immune: ['under'],

        doMotion: true,
        collision: true,
        friction: true,
        animate_by_state: false,
        traction: 1,
        air_traction: 1,

        accel_x: 0.5,
        air_accel: 0.5,
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
        bounces_player: false,
        immune: ['under'],
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
        texture: 'star',

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
        bounces_player: false,
        immune: ['under'],

        doMotion: true,
        collision: true,
        friction: false,
        animate_by_state: false,
        traction: 1,
        air_traction: 1,
        gravity_multiplier: 0.75,

        accel_x: 0.5,
        air_accel: 0.5,
        walk: 2,
        jump_accel: 5,

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
    'cloud': {
        texture: 'flower',

        type: 'cloud',
        player: false,
        enemy: 'powerup',
        bounces_player: false,
        immune: ['under'],
        tiered_powerup: false,

        doMotion: true,
        collision: true,
        friction: true,
    },
    'parkour': {
        texture: 'parkour',

        type: 'parkour',
        player: false,
        enemy: 'powerup',
        bounces_player: false,
        immune: ['under'],
        tiered_powerup: false, // // //

        doMotion: true,
        collision: true,
        friction: true,
    },

    // Projectile
    'fireball': {
        texture: 'fireball',
        texture_dead: 'fire_poof',

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
        bounces_player: false,
        immune: ['under', 'player'],
        deal_damage: 'player',

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
    'lemon': {
        texture: 'lemon',

        type: 'lemon',
        player: false,
        enemy: 'fireball',
        ai_info: {
            auto_walk: true,
            dissipate_at_wall: true, // temporary, should be false
            despawn_on_unload: true,
        },
        bounces_player: false,
        immune: ['under', 'player'],
        deal_damage: 'player',
        interacts: ['b', 's', 'a'],

        doMotion: true,
        collision: true,
        friction: false,
        animate_by_state: false,
        traction: 1,
        air_traction: 1,

        accel_x: 5,
        air_accel: 5,
        walk: 5,
        gravity_multiplier: 0,

        facing: 1,
        no_mirror: true,
    },

    // Particle
    'particle': {
        texture: 'brick_break1',
    
        type: 'particle',
        player: false,
        bounces_player: false,

        doMotion: true,
        collision: false,
        friction: true,
        animate_by_state: false,
    
        traction: 1,
        air_traction: 1,
    
        facing: 1,
    },
    'flag': {
        texture: 'flag',
    
        type: 'flag',
        bounces_player: false,

        doMotion: true,
        collision: false,
        friction: false,
    
        gravity_multiplier: 0,
    },

    data: { texture: 'flag', friction: false, gravity_multiplier: 0, }
}

class tileData {
    constructor(data = {
        // type: '_',
        texture: anim.dead,
        animated: false,

        collision: false,
        collisionCode: false,
        slope: false,

        container: false,
        contains: false,
    }) {
        // this.type = data.type;
        this.texture = data.texture;
        this.animated = data.animated;

        this.collision = data.collision == true ?
        { u:true, r:true, d:true, l:true, in:true } : { u:false, r:false, d:false, l:false, in:false };
        this.sides = data.sides;
        this.collisionCode = data.collisionCode;
        this.slope = data.slope;

        this.insertable = data.insertable;
        this.container = data.container;
        this.contains = data.contains;
    }

    set(tile, name) {
        const data = tileDataset[name];
        tile.type = name;
        tile.data = data;
        tile.contains = data.contains;
        tile.textures = data.texture;
        tile.time_origin = undefined;
        if(data.animated) { s.animationSpeed = data.animated; s.play(); }
    }

    collide(dir, tile, source) {
        if(source.dead || !source.collision) return;
        const data = tileDataset[tile.type];
        if(data == undefined) return;

        if(data.collisionCode) {
            // Small
            if(
                dir=='b' && !tile.contains && source.form == 'small' && source.player
                && (data.collisionCode === 'brick' || data.collisionCode === 'question')
            ) {
                this.animate(tile, 'bounce');
                this.hurtAbove(tile, source);
                return;
            }

            // Container
            if(tile.contains && (dir == 'b' || (dir != 'u' && source.interacts.includes('s')))) {
                this.animate(tile, 'bounce');
                this.hurtAbove(tile, source);
                if(this.dropItem(tile, source)) this.set(tile, 'used');
                // console.log(source);
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
                    source.damage({ deal_damage: 'sharp' });
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

    hurtAbove(tile, source) {
        for(let [key, object] of Object.entries(physicsObjects)) if(object?.adj?.under === tile) object.damage({ deal_damage: 'under' });
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
const tileDataset = {
    '_': new tileData({
        type: '_',
        texture: anim.none,
        collision: false,
    }),
    'ground': new tileData({
        texture: anim.ground,
        collision: true,
    }),
    'hard': new tileData({
        texture: anim.hard,
        collision: true,
    }),
    'brick': new tileData({
        texture: anim.brick,

        collision: true,
        collisionCode: 'brick',

        container: true,
    }),
    'question': new tileData({
        texture: anim.question,
        animated: 0.07,

        collision: true,
        collisionCode: 'question', // temporary

        container: true,
        contains: 'coin',
    }),
    'invis_question': new tileData({
        texture: anim.none,
        animated: false,

        collision: false,
        collisionCode: 'question',

        container: true,
        contains: 'coin',
    }),
    'used': new tileData({
        texture: anim.used,
        animated: false,

        collision: true,
    }),
    'coin': new tileData({
        texture: anim.coin,
        animated: 0.07,

        collision: false,
        collisionCode: 'coin',
        insertable: true,
    }),
    'multi_coin': new tileData({
        texture: anim.coin,
        animated: 0.07,

        collision: false,
        collisionCode: 'coin',
        insertable: true,
    }),
    'spikes': new tileData({
        texture: anim.spikes,

        collision: true,
        collisionCode: 'damage',
    }),
    'bridge': new tileData({
        texture: anim.bridge,

        collision: { u: true, },
    }),
    'pole': new tileData({
        texture: anim.pole,

        collision: { u: true, },
        // collisionCode: 'flagpole',
    }),
    'pole_top': new tileData({
        texture: anim.pole_top,

        collision: { u: true, },
        // collisionCode: 'flagpole',
    }),

    'pipe_top_l': new tileData({
        // type: 'question',
        texture: anim.pipe_top_l,
        animated: false,

        collision: true,
    }),
    'pipe_top_r': new tileData({
        // type: 'question',
        texture: anim.pipe_top_r,
        animated: false,

        collision: true,
    }),
    'pipe_l': new tileData({
        // type: 'question',
        texture: anim.pipe_l,
        animated: false,

        collision: true,
    }),
    'pipe_r': new tileData({
        // type: 'question',
        texture: anim.pipe_r,
        animated: false,

        collision: true,
    }),

    'black': new tileData({ texture: anim.black }),
    'bg_brick': new tileData({ texture: anim.bg_brick }),
    'bg_brick_door': new tileData({ texture: anim.bg_brick_door }),
    'bg_brick_mid': new tileData({ texture: anim.bg_brick_mid }),
    'bg_brick_top': new tileData({ texture: anim.bg_brick_top }),
    'brick_window_l': new tileData({ texture: anim.brick_window_l }),
    'brick_window_r': new tileData({ texture: anim.brick_window_r }),

    // Decoration
    'bush': new tileData({ texture: anim.bush }),
    'bush_med': new tileData({ texture: anim.bush_med }),
    'bush_large': new tileData({ texture: anim.bush_large }),
    'cloud': new tileData({ texture: anim.cloud }),
    'cloud_med': new tileData({ texture: anim.cloud_med }),
    'cloud_large': new tileData({ texture: anim.cloud_large }),
    'hill': new tileData({ texture: anim.hill }),
    'hill_large': new tileData({ texture: anim.hill_large }),

    // Slopes
    'ground_slope_l': new tileData({
        // type: 'ground',
        texture: anim.ground_slope_l,
        // collision: { l: true, d: true,},
        collision: false,
        // slope: [48, 0],
        slope: 'reverse', // temporary
    }),
    'ground_slope_r': new tileData({
        // type: 'ground',
        texture: anim.ground_slope_r,
        // collision: { r: true, d: true,},
        collision: false,
        slope: [0, 48],
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
            move: [0, -1],
        },
        {
            tile: '_',
            move: [1, 0],
        },
        {
            tile: '_',
            move: [0, 1],
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
    'flagpole': [
        { tile: 'hard', move: [0, -1] },
        { tile: 'pole', move: [0, -1] },
        { tile: 'pole', move: [0, -1] },
        { tile: 'pole', move: [0, -1] },
        { tile: 'pole', move: [0, -1] },
        { tile: 'pole', move: [0, -1] },
        { tile: 'pole', move: [0, -1] },
        { tile: 'pole', move: [0, -1] },
        { tile: 'pole', move: [0, -1] },
        { tile: 'pole', move: [0, -1] },
        { tile: 'pole_top', move: [0, 1] },
        { entity: 'flag', move: [0, 0] }
    ],
}



const powers = {
    // Temporary - Mega Man projectiles/animations
    'big': {
        action: object => {
            if(object.type !== 'megaman') return;

            // Fire
            if(object.projectiles >= 3) return;
            if(object.projectiles < 0) object.projectiles = 0;
            object.power_anim = 15;
            // Turn around
            if(pressed[object.controls.left]) object.facing = -1;
            if(pressed[object.controls.right]) object.facing = 1;
            spawn('lemon', object.s.x+object.facing*24, object.s.y-30, {facing: object.facing, lifespan: 7000 }, { owner: object });
            object.projectiles++;
        },
        animate: object => {
            if(object.type !== 'megaman') return;
            if(!object.power_anim) return;

            /* ----- Animate ----- */
            // Override
            if(object.sprite_override) {
                object.s.textures = anim[object.sprite_override];
            }

            // Crouch
            else if(object.crouching) {
                object.s.textures = anim[`${object.type}_${object.form}_crouch_firing`];
            }
            // Jump
            else if(!object.grounded) {
                if(!object.jump_ready) object.s.textures = anim[`${object.type}_${object.form}_jump_firing`];
                else object.s.textures = anim[`${object.type}_${object.form}_fall_firing`];
            }
            // Turn
            else if(
                object.controls.right && Math.sign(object.motion.x) == -1
                || object.controls.left && Math.sign(object.motion.x) == 1
            ) {
                object.s.textures = anim[`${object.type}_${object.form}_turn_firing`];
            }
            // Run
            else if(object.controls.right || object.controls.left) {
                if(object.s.textures != anim[`${object.type}_${object.form}_run_firing`]) {
                    object.s.textures = anim[`${object.type}_${object.form}_run_firing`];
                    playPauseSprite(object.s);
                }
            }
            // Still
            else {
                object.s.textures = anim[`${object.type}_${object.form}_still_firing`];
            }
        }
    },
    'parkour': {
        animate: object => {
            // Wall slide
            if(object.pounding) {
                object.s.textures = anim[`${object.type}_${object.form}_climb2`];
            }
            else if((object.colliding.l || object.colliding.r) && !object.grounded) {
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
    'cloud': {
        action: object => {
            // if(object.projectiles >= 2) return;
            // if(object.projectiles < 0) object.projectiles = 0; // bandaid fix for projectile count randomly going well into the negative and allowing spam
            // object.power_anim = 15;
            // Turn around
            
            object.motion.y = -3;
            let [dl, under, dr] = [object.adj.downleft, object.adj.under, object.adj.downright];
            if(dl.type == '_') dl?.data?.set(dl, 'ground');
            if(under.type == '_') under?.data?.set(under, 'ground');
            if(dr.type == '_') dr?.data?.set(dr, 'ground');
            
            // object.projectiles++;
        },
    },
}
