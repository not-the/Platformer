// DOM
const drawSel = document.getElementById('drawtile');

// PIXI.js Setup
let app = new PIXI.Application({ width: 1200, height: 672, backgroundColor: 0x9290ff, });
PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;
document.getElementById('game').appendChild(app.view);

/** Sets sprite anchor and scale */
function spriteFix(sprite, big=false) {
    sprite.anchor.x = 0.5;
    if(big) sprite.anchor.y = 0.5;
    sprite.scale.x = 3;
    sprite.scale.y = 3;
}

function playPauseSprite(spr) {
    world.paused ? spr.stop() : spr.play()
}

const textures = {
    // Small mario
    'still': PIXI.Texture.from('./assets/mario.png'),
    'run1':  PIXI.Texture.from('./assets/run1.png'),
    'run2':  PIXI.Texture.from('./assets/run2.png'),
    'run3':  PIXI.Texture.from('./assets/run3.png'),
    'jump':  PIXI.Texture.from('./assets/jump.png'),
    'turn':  PIXI.Texture.from('./assets/turn.png'),
    'crouch': PIXI.Texture.from('./assets/crouch.png'),
    'dead': PIXI.Texture.from('./assets/dead.png'),

    // Tiles
    'none': PIXI.Texture.from('./assets/tile/none.png'),
    'ground': PIXI.Texture.from('./assets/tile/ground.png'),
    'hard': PIXI.Texture.from('./assets/tile/hard.png'),
    'brick': PIXI.Texture.from('./assets/tile/brick.png'),
    'question': PIXI.Texture.from('./assets/tile/question.png'),
    'question2': PIXI.Texture.from('./assets/tile/question2.png'),
    'question3': PIXI.Texture.from('./assets/tile/question3.png'),
    'used': PIXI.Texture.from('./assets/tile/used.png'),

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
    'hill': PIXI.Texture.from('./assets/decoration/hill.png'),
    'hill_large': PIXI.Texture.from('./assets/decoration/hill_large.png'),

    // Enemies
    'goomba1': PIXI.Texture.from('./assets/enemy/goomba.png'),
    'goomba2': PIXI.Texture.from('./assets/enemy/goomba2.png'),
    'goomba_flat': PIXI.Texture.from('./assets/enemy/goomba_flat.png'),
    'koopa1': PIXI.Texture.from('./assets/enemy/koopa1.png'),
    'koopa2': PIXI.Texture.from('./assets/enemy/koopa2.png'),
    'shell': PIXI.Texture.from('./assets/enemy/shell.png'),
    'red_koopa1': PIXI.Texture.from('./assets/enemy/red_koopa1.png'),
    'red_koopa2': PIXI.Texture.from('./assets/enemy/red_koopa2.png'),
    'red_shell': PIXI.Texture.from('./assets/enemy/red_shell.png'),
}
const anim = {
    // Small mario
    small_still: [textures.still],
    small_run: [textures.run1, textures.run2, textures.run3],
    small_jump: [textures.jump],
    turning: [textures.turn],
    crouch: [textures.crouch],
    fall: [textures.run1],
    dead: [textures.dead],

    // Tiles
    none: [textures.none],
    ground: [textures.ground],
    hard: [textures.hard],
    brick: [textures.brick],
    question: [textures.question, textures.question2, textures.question3, textures.question2, textures.question],
    used: [textures.used],

    // Part
    pipe_top_l: [textures.pipe_top_l],
    pipe_top_r: [textures.pipe_top_r],
    pipe_l: [textures.pipe_l],
    pipe_r: [textures.pipe_r],

    // Decoration
    bush: [textures.bush],
    bush_med: [textures.bush_med],
    bush_large: [textures.bush_large],
    cloud: [textures.cloud],
    hill: [textures.hill],
    hill_large: [textures.hill_large],

    // Enemies
    goomba: [textures.goomba1, textures.goomba2],
    goomba_flat: [textures.goomba_flat],
    koopa: [textures.koopa1, textures.koopa2],
    shell: [textures.shell],
    red_koopa: [textures.red_koopa1, textures.red_koopa2],
    red_shell: [textures.red_shell],
}



// Animated Sprite
// const anim = new PIXI.AnimatedSprite(small_run);
// spriteFix(anim);
// anim.animationSpeed = 0.16; // set the animation speed 
// anim.play();
// app.stage.addChild(anim);

function clone(obj) { return JSON.parse(JSON.stringify(obj)) }
