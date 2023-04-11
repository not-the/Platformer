// DOM
const drawSel = document.getElementById('drawtile');

// PIXI.js Setup
let app = new PIXI.Application({ width: 1200, height: 672, backgroundColor: 0x9290ff, });
PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;
app.stage.y += 48;
document.getElementById('game').appendChild(app.view);

/** Sets sprite anchor and scale */
function spriteFix(sprite, big=false) {
    sprite.anchor.x = 0.5;
    sprite.anchor.y = 1;
    sprite.scale.x = 3;
    sprite.scale.y = 3;
}

function playPauseSprite(spr) {
    world.paused ? spr.stop() : spr.play()
}

const textures = {
    // Small mario
    'still': PIXI.Texture.from('./assets/player1/player.png'),
    'run1':  PIXI.Texture.from('./assets/player1/run1.png'),
    'run2':  PIXI.Texture.from('./assets/player1/run2.png'),
    'run3':  PIXI.Texture.from('./assets/player1/run3.png'),
    'jump':  PIXI.Texture.from('./assets/player1/jump.png'),
    'turn':  PIXI.Texture.from('./assets/player1/turn.png'),
    'crouch': PIXI.Texture.from('./assets/player1/crouch.png'),
    'dead': PIXI.Texture.from('./assets/player1/dead.png'),

    // Small luigi
    '2_still': PIXI.Texture.from('./assets/player2/player.png'),
    '2_run1':  PIXI.Texture.from('./assets/player2/run1.png'),
    '2_run2':  PIXI.Texture.from('./assets/player2/run2.png'),
    '2_run3':  PIXI.Texture.from('./assets/player2/run3.png'),
    '2_jump':  PIXI.Texture.from('./assets/player2/jump.png'),
    '2_turn':  PIXI.Texture.from('./assets/player2/turn.png'),
    '2_crouch': PIXI.Texture.from('./assets/player2/crouch.png'),
    '2_dead': PIXI.Texture.from('./assets/player2/dead.png'),

    // Big luigi
    'luigi_big_still': PIXI.Texture.from('./assets/player2/big/still.png'),
    'luigi_big_run1':  PIXI.Texture.from('./assets/player2/big/run1.png'),
    'luigi_big_run2':  PIXI.Texture.from('./assets/player2/big/run2.png'),
    'luigi_big_run3':  PIXI.Texture.from('./assets/player2/big/run3.png'),
    'luigi_big_jump':  PIXI.Texture.from('./assets/player2/big/jump.png'),
    'luigi_big_turn':  PIXI.Texture.from('./assets/player2/big/turn.png'),
    'luigi_big_crouch': PIXI.Texture.from('./assets/player2/big/crouch.png'),

    // Fire luigi
    'luigi_fire_still': PIXI.Texture.from('./assets/player2/big/still.png'),
    'luigi_fire_run1':  PIXI.Texture.from('./assets/player2/big/run1.png'),
    'luigi_fire_run2':  PIXI.Texture.from('./assets/player2/big/run2.png'),
    'luigi_fire_run3':  PIXI.Texture.from('./assets/player2/big/run3.png'),
    'luigi_fire_jump':  PIXI.Texture.from('./assets/player2/big/jump.png'),
    'luigi_fire_turn':  PIXI.Texture.from('./assets/player2/big/turn.png'),
    'luigi_fire_crouch': PIXI.Texture.from('./assets/player2/big/crouch.png'),

    // Tiles
    'none': PIXI.Texture.from('./assets/tile/none.png'),
    'ground': PIXI.Texture.from('./assets/tile/ground.png'),
    'hard': PIXI.Texture.from('./assets/tile/hard.png'),
    'brick': PIXI.Texture.from('./assets/tile/brick.png'),
    'question': PIXI.Texture.from('./assets/tile/question.png'),
    'question2': PIXI.Texture.from('./assets/tile/question2.png'),
    'question3': PIXI.Texture.from('./assets/tile/question3.png'),
    'used': PIXI.Texture.from('./assets/tile/used.png'),
    'coin1': PIXI.Texture.from('./assets/tile/coin1.png'),
    'coin2': PIXI.Texture.from('./assets/tile/coin2.png'),
    'coin3': PIXI.Texture.from('./assets/tile/coin3.png'),
    'spikes': PIXI.Texture.from('./assets/tile/spikes.png'),

    // Part
    'pipe_top_l': PIXI.Texture.from('./assets/tile/pipe_top_l.png'),
    'pipe_top_r': PIXI.Texture.from('./assets/tile/pipe_top_r.png'),
    'pipe_l': PIXI.Texture.from('./assets/tile/pipe_l.png'),
    'pipe_r': PIXI.Texture.from('./assets/tile/pipe_r.png'),

    // Decoration
    'bush': PIXI.Texture.from('./assets/decoration/bush.png'),
    'bush_med': PIXI.Texture.from('./assets/decoration/bush_med.png'),
    'bush_large': PIXI.Texture.from('./assets/decoration/bush_large.png'),
    'cloud': PIXI.Texture.from('./assets/decoration/cloud.png'),
    'cloud_med': PIXI.Texture.from('./assets/decoration/cloud_med.png'),
    'cloud_large': PIXI.Texture.from('./assets/decoration/cloud_large.png'),
    'hill': PIXI.Texture.from('./assets/decoration/hill.png'),
    'hill_large': PIXI.Texture.from('./assets/decoration/hill_large.png'),

    // Enemies
    'goomba1': PIXI.Texture.from('./assets/enemy/goomba.png'),
    'goomba2': PIXI.Texture.from('./assets/enemy/goomba2.png'),
    'goomba_flat': PIXI.Texture.from('./assets/enemy/goomba_flat.png'),
    'koopa1': PIXI.Texture.from('./assets/enemy/koopa1.png'),
    'koopa2': PIXI.Texture.from('./assets/enemy/koopa2.png'),
    'shell': PIXI.Texture.from('./assets/enemy/shell.png'),
    'shell_escaping': PIXI.Texture.from('./assets/enemy/shell_escaping.png'),
    'red_koopa1': PIXI.Texture.from('./assets/enemy/red_koopa1.png'),
    'red_koopa2': PIXI.Texture.from('./assets/enemy/red_koopa2.png'),
    'red_shell': PIXI.Texture.from('./assets/enemy/red_shell.png'),
    'red_shell_escaping': PIXI.Texture.from('./assets/enemy/red_shell_escaping.png'),

    // Items
    'mushroom': PIXI.Texture.from('./assets/item/mushroom.png'),
    'flower1': PIXI.Texture.from('./assets/item/flower1.png'),
    'flower2': PIXI.Texture.from('./assets/item/flower2.png'),
    'flower3': PIXI.Texture.from('./assets/item/flower3.png'),
    'flower4': PIXI.Texture.from('./assets/item/flower4.png'),

    // Projectile
    'fireball1': PIXI.Texture.from('./assets/item/fireball1.png'),
    'fireball2': PIXI.Texture.from('./assets/item/fireball2.png'),
    'fireball3': PIXI.Texture.from('./assets/item/fireball3.png'),
    'fireball4': PIXI.Texture.from('./assets/item/fireball4.png'),

    // Particle
    'brick_break1': PIXI.Texture.from('./assets/particle/brick_break1.png'),
    'brick_break2': PIXI.Texture.from('./assets/particle/brick_break2.png'),
    'brick_break3': PIXI.Texture.from('./assets/particle/brick_break3.png'),
    'brick_break4': PIXI.Texture.from('./assets/particle/brick_break4.png'),

    'coin_collect1': PIXI.Texture.from('./assets/particle/coin1.png'),
    'coin_collect2': PIXI.Texture.from('./assets/particle/coin2.png'),
    'coin_collect3': PIXI.Texture.from('./assets/particle/coin3.png'),
    'coin_collect4': PIXI.Texture.from('./assets/particle/coin4.png'),
}
const anim = {
    // Small mario
    'mario_small_still': [textures.still],
    'mario_small_run': [textures.run1, textures.run2, textures.run3],
    'mario_small_jump': [textures.jump],
    'mario_small_turning': [textures.turn],
    'mario_small_crouch': [textures.crouch],
    'mario_small_fall': [textures.run1],
    'mario_dead': [textures.dead],

    // Small luigi
    'luigi_small_still': [textures["2_still"]],
    'luigi_small_run': [textures["2_run1"], textures["2_run2"], textures["2_run3"]],
    'luigi_small_jump': [textures["2_jump"]],
    'luigi_small_turning': [textures["2_turn"]],
    'luigi_small_crouch': [textures["2_crouch"]],
    'luigi_small_fall': [textures["2_run1"]],
    'luigi_dead': [textures["2_dead"]],

    // Luigi (Big)
    'luigi_big_still': [textures["luigi_big_still"]],
    'luigi_big_run': [textures["luigi_big_run1"], textures["luigi_big_run2"], textures["luigi_big_run3"]],
    'luigi_big_jump': [textures["luigi_big_jump"]],
    'luigi_big_turning': [textures["luigi_big_turn"]],
    'luigi_big_crouch': [textures["luigi_big_crouch"]],
    'luigi_big_fall': [textures["luigi_big_run1"]],

    // Luigi (Fire)
    'luigi_fire_still': [textures["luigi_fire_still"]],
    'luigi_fire_run': [textures["luigi_fire_run1"], textures["luigi_fire_run2"], textures["luigi_fire_run3"]],
    'luigi_fire_jump': [textures["luigi_fire_jump"]],
    'luigi_fire_turning': [textures["luigi_fire_turn"]],
    'luigi_fire_crouch': [textures["luigi_fire_crouch"]],
    'luigi_fire_fall': [textures["luigi_fire_run1"]],

    // Tiles
    none: [textures.none],
    ground: [textures.ground],
    hard: [textures.hard],
    brick: [textures.brick],
    question: [textures.question, textures.question2, textures.question3, textures.question2, textures.question],
    used: [textures.used],
    coin: [textures.coin1, textures.coin2, textures.coin3, textures.coin2, textures.coin1],
    spikes: [textures.spikes],

    // Structure components
    pipe_top_l: [textures.pipe_top_l],
    pipe_top_r: [textures.pipe_top_r],
    pipe_l: [textures.pipe_l],
    pipe_r: [textures.pipe_r],

    // Decoration
    bush: [textures.bush],
    bush_med: [textures.bush_med],
    bush_large: [textures.bush_large],
    cloud: [textures.cloud],
    cloud_med: [textures.cloud_med],
    cloud_large: [textures.cloud_large],
    hill: [textures.hill],
    hill_large: [textures.hill_large],

    // Enemies
    goomba: [textures.goomba1, textures.goomba2],
    goomba_flat: [textures.goomba_flat],
    koopa: [textures.koopa1, textures.koopa2],
    shell: [textures.shell],
    shell_escaping: [textures.shell_escaping],
    red_koopa: [textures.red_koopa1, textures.red_koopa2],
    red_shell: [textures.red_shell],
    red_shell_escaping: [textures.red_shell_escaping],
    
    // Items
    mushroom: [textures.mushroom],
    flower: [textures.flower1, textures.flower2, textures.flower3, textures.flower4],

    // Projectiles
    fireball: [textures.fireball1, textures.fireball2, textures.fireball3, textures.fireball4],
    
    // Particle
    brick_break1: [textures.brick_break1],
    brick_break2: [textures.brick_break2],
    brick_break3: [textures.brick_break3],
    brick_break4: [textures.brick_break4],
    coin_collect: [textures.coin_collect1, textures.coin_collect2, textures.coin_collect3, textures.coin_collect4],
}



// Animated Sprite
// const anim = new PIXI.AnimatedSprite(small_run);
// spriteFix(anim);
// anim.animationSpeed = 0.16; // set the animation speed 
// anim.play();
// app.stage.addChild(anim);

function clone(obj) {
    // return typeof obj === 'object' ? JSON.parse(JSON.stringify(obj)) : console.warn('Not an object');
    return JSON.parse(JSON.stringify(obj));
}
