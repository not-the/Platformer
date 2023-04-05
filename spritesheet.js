// PIXI.js Setup
let app = new PIXI.Application({ width: 720, height: 426, backgroundColor: 0x9290ff, });
PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;
document.body.appendChild(app.view);

/** Sets sprite anchor and scale */
function spriteFix(sprite) {
    sprite.anchor.x = 0.5;
    sprite.scale.x = 3;
    sprite.scale.y = 3;
}

const textures = {
    'still': PIXI.Texture.from('./assets/mario.png'),
    'run1':  PIXI.Texture.from('./assets/run1.png'),
    'run2':  PIXI.Texture.from('./assets/run2.png'),
    'run3':  PIXI.Texture.from('./assets/run3.png'),
    'jump':  PIXI.Texture.from('./assets/jump.png'),
    'turn':  PIXI.Texture.from('./assets/turn.png'),
    'crouch': PIXI.Texture.from('./assets/crouch.png'),

    'none': PIXI.Texture.from('./assets/tile/none.png'),
    'ground': PIXI.Texture.from('./assets/tile/ground.png'),

    'goomba1': PIXI.Texture.from('./assets/enemy/goomba.png'),
    'goomba2': PIXI.Texture.from('./assets/enemy/goomba2.png'),
}
const anim = {
    small_still: [textures.still],
    small_run: [textures.run1, textures.run2, textures.run3],
    small_jump: [textures.jump],
    turning: [textures.turn],
    crouch: [textures.crouch],

    none: [textures.none],
    ground: [textures.ground],

    goomba: [textures.goomba1, textures.goomba2],
}



// Animated Sprite
// const anim = new PIXI.AnimatedSprite(small_run);
// spriteFix(anim);
// anim.animationSpeed = 0.16; // set the animation speed 
// anim.play();
// app.stage.addChild(anim);