// DOM
const drawSel = document.getElementById('drawtile');

// PIXI.js Setup
let app = new PIXI.Application({ width: 1200, height: 672 });
app.renderer.background.color = 0x9290ff;
PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;
app.stage.y += 48;
document.getElementById('game').appendChild(app.view);

// Layers
// var layer = new PIXI.display.Layer();

/** Image filters */
var filters = {
    rainbow: new PIXI.filters.ColorMatrixFilter(),
}

/* ------ Utility functions ------ */
/** Clone object instead of creating a reference to it */
function clone(obj) {
    // return typeof obj === 'object' ? JSON.parse(JSON.stringify(obj)) : console.warn('Not an object');
    return JSON.parse(JSON.stringify(obj));
}
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
/** Average out array */
const average = array => array.reduce((a, b) => a + b) / array.length;

/** Sets sprite anchor and scale */
function spriteFix(sprite, big=false) {
    sprite.anchor.x = 0.5;
    sprite.anchor.y = 1;
    sprite.scale.x = 3;
    sprite.scale.y = 3;
}

/** Play/pause a sprite depending on if the game is running */
function playPauseSprite(spr) {
    world.paused ? spr.stop() : spr.play()
}

// const textures = {
//     // Small mario
//     'still': PIXI.Texture.from('./assets/player1/player.png'),
//     'run1':  PIXI.Texture.from('./assets/player1/run1.png'),
//     'run2':  PIXI.Texture.from('./assets/player1/run2.png'),
//     'run3':  PIXI.Texture.from('./assets/player1/run3.png'),
//     'jump':  PIXI.Texture.from('./assets/player1/jump.png'),
//     'turn':  PIXI.Texture.from('./assets/player1/turn.png'),
//     'crouch': PIXI.Texture.from('./assets/player1/crouch.png'),
//     'dead': PIXI.Texture.from('./assets/player1/dead.png'),
//     'mario_medium': PIXI.Texture.from('./assets/player1/medium.png'),

//     // Big mario
//     'mario_big_still': PIXI.Texture.from('./assets/player1/big/still.png'),
//     'mario_big_run1':  PIXI.Texture.from('./assets/player1/big/run1.png'),
//     'mario_big_run2':  PIXI.Texture.from('./assets/player1/big/run2.png'),
//     'mario_big_run3':  PIXI.Texture.from('./assets/player1/big/run3.png'),
//     'mario_big_jump':  PIXI.Texture.from('./assets/player1/big/jump.png'),
//     'mario_big_turn':  PIXI.Texture.from('./assets/player1/big/turn.png'),
//     'mario_big_crouch': PIXI.Texture.from('./assets/player1/big/crouch.png'),

//     // Fire mario
//     'mario_fire_still': PIXI.Texture.from('./assets/player1/fire/still.png'),
//     'mario_fire_run1':  PIXI.Texture.from('./assets/player1/fire/run1.png'),
//     'mario_fire_run2':  PIXI.Texture.from('./assets/player1/fire/run2.png'),
//     'mario_fire_run3':  PIXI.Texture.from('./assets/player1/fire/run3.png'),
//     'mario_fire_jump':  PIXI.Texture.from('./assets/player1/fire/jump.png'),
//     'mario_fire_turn':  PIXI.Texture.from('./assets/player1/fire/turn.png'),
//     'mario_fire_crouch': PIXI.Texture.from('./assets/player1/fire/crouch.png'),
//     'mario_fire_throw': PIXI.Texture.from('./assets/player1/fire/throw.png'),

//     // Leaf mario
//     // 'mario_leaf_still': PIXI.Texture.from('./assets/player1/leaf/still.png'),
//     // 'mario_leaf_run1':  PIXI.Texture.from('./assets/player1/leaf/run1.png'),
//     // 'mario_leaf_run2':  PIXI.Texture.from('./assets/player1/leaf/run2.png'),
//     // 'mario_leaf_run3':  PIXI.Texture.from('./assets/player1/leaf/run3.png'),
//     // 'mario_leaf_jump':  PIXI.Texture.from('./assets/player1/leaf/jump.png'),
//     // 'mario_leaf_turn':  PIXI.Texture.from('./assets/player1/leaf/turn.png'),
//     // 'mario_leaf_crouch': PIXI.Texture.from('./assets/player1/leaf/crouch.png'),
//     // // 'mario_leaf_throw': PIXI.Texture.from('./assets/player1/leaf/throw.png'),
//     // 'mario_leaf_wall_slide': PIXI.Texture.from('./assets/player1/leaf/wall_slide.png'),
//     // 'mario_leaf_climb2': PIXI.Texture.from('./assets/player1/leaf/climb2.png'),

//     // Cloud mario
//     'mario_cloud_still': PIXI.Texture.from('./assets/player1/cloud/still.png'),
//     'mario_cloud_run1':  PIXI.Texture.from('./assets/player1/cloud/run1.png'),
//     'mario_cloud_run2':  PIXI.Texture.from('./assets/player1/cloud/run2.png'),
//     'mario_cloud_run3':  PIXI.Texture.from('./assets/player1/cloud/run3.png'),
//     'mario_cloud_jump':  PIXI.Texture.from('./assets/player1/cloud/jump.png'),
//     'mario_cloud_turn':  PIXI.Texture.from('./assets/player1/cloud/turn.png'),
//     'mario_cloud_crouch': PIXI.Texture.from('./assets/player1/cloud/crouch.png'),
//     // 'mario_cloud_throw': PIXI.Texture.from('./assets/player1/cloud/throw.png'),

//     // Modern mario
//     'mario_parkour_still': PIXI.Texture.from('./assets/player1/parkour/still.png'),
//     'mario_parkour_run1':  PIXI.Texture.from('./assets/player1/parkour/run1.png'),
//     'mario_parkour_run2':  PIXI.Texture.from('./assets/player1/parkour/run2.png'),
//     'mario_parkour_run3':  PIXI.Texture.from('./assets/player1/parkour/run3.png'),
//     'mario_parkour_jump':  PIXI.Texture.from('./assets/player1/parkour/jump.png'),
//     'mario_parkour_turn':  PIXI.Texture.from('./assets/player1/parkour/turn.png'),
//     'mario_parkour_crouch': PIXI.Texture.from('./assets/player1/parkour/crouch.png'),
//     // 'mario_parkour_throw': PIXI.Texture.from('./assets/player1/parkour/throw.png'),
//     'mario_parkour_wall_slide': PIXI.Texture.from('./assets/player1/parkour/wall_slide.png'),
//     'mario_parkour_climb2': PIXI.Texture.from('./assets/player1/parkour/climb2.png'),

//     // Small luigi
//     '2_still': PIXI.Texture.from('./assets/player2/player.png'),
//     '2_run1':  PIXI.Texture.from('./assets/player2/run1.png'),
//     '2_run2':  PIXI.Texture.from('./assets/player2/run2.png'),
//     '2_run3':  PIXI.Texture.from('./assets/player2/run3.png'),
//     '2_jump':  PIXI.Texture.from('./assets/player2/jump.png'),
//     '2_turn':  PIXI.Texture.from('./assets/player2/turn.png'),
//     '2_crouch': PIXI.Texture.from('./assets/player2/crouch.png'),
//     '2_dead': PIXI.Texture.from('./assets/player2/dead.png'),
//     'luigi_medium': PIXI.Texture.from('./assets/player2/medium.png'),

//     // Big luigi
//     'luigi_big_still': PIXI.Texture.from('./assets/player2/big/still.png'),
//     'luigi_big_run1':  PIXI.Texture.from('./assets/player2/big/run1.png'),
//     'luigi_big_run2':  PIXI.Texture.from('./assets/player2/big/run2.png'),
//     'luigi_big_run3':  PIXI.Texture.from('./assets/player2/big/run3.png'),
//     'luigi_big_jump':  PIXI.Texture.from('./assets/player2/big/jump.png'),
//     'luigi_big_turn':  PIXI.Texture.from('./assets/player2/big/turn.png'),
//     'luigi_big_crouch': PIXI.Texture.from('./assets/player2/big/crouch.png'),

//     // Fire luigi
//     'luigi_fire_still': PIXI.Texture.from('./assets/player2/fire/still.png'),
//     'luigi_fire_run1':  PIXI.Texture.from('./assets/player2/fire/run1.png'),
//     'luigi_fire_run2':  PIXI.Texture.from('./assets/player2/fire/run2.png'),
//     'luigi_fire_run3':  PIXI.Texture.from('./assets/player2/fire/run3.png'),
//     'luigi_fire_jump':  PIXI.Texture.from('./assets/player2/fire/jump.png'),
//     'luigi_fire_turn':  PIXI.Texture.from('./assets/player2/fire/turn.png'),
//     'luigi_fire_crouch': PIXI.Texture.from('./assets/player2/fire/crouch.png'),
//     'luigi_fire_throw': PIXI.Texture.from('./assets/player2/fire/throw.png'),

//     // Tiles
//     'none': PIXI.Texture.from('./assets/tile/none.png'),
//     'ground': PIXI.Texture.from('./assets/tile/ground.png'),
//     'hard': PIXI.Texture.from('./assets/tile/hard.png'),
//     'brick': PIXI.Texture.from('./assets/tile/brick.png'),
//     'question': PIXI.Texture.from('./assets/tile/question.png'),
//     'question2': PIXI.Texture.from('./assets/tile/question2.png'),
//     'question3': PIXI.Texture.from('./assets/tile/question3.png'),
//     'invis': PIXI.Texture.from('./assets/ui/invis.png'),
//     'used': PIXI.Texture.from('./assets/tile/used.png'),
//     'coin1': PIXI.Texture.from('./assets/tile/coin1.png'),
//     'coin2': PIXI.Texture.from('./assets/tile/coin2.png'),
//     'coin3': PIXI.Texture.from('./assets/tile/coin3.png'),
//     'spikes': PIXI.Texture.from('./assets/tile/spikes.png'),

//     // Part
//     'pipe_top_l': PIXI.Texture.from('./assets/tile/pipe_top_l.png'),
//     'pipe_top_r': PIXI.Texture.from('./assets/tile/pipe_top_r.png'),
//     'pipe_l': PIXI.Texture.from('./assets/tile/pipe_l.png'),
//     'pipe_r': PIXI.Texture.from('./assets/tile/pipe_r.png'),

//     'black': PIXI.Texture.from('./assets/decoration/black.png'),
//     'bg_brick': PIXI.Texture.from('./assets/decoration/bg_brick.png'),
//     'bg_brick_door': PIXI.Texture.from('./assets/decoration/bg_brick_door.png'),
//     'bg_brick_mid': PIXI.Texture.from('./assets/decoration/bg_brick_mid.png'),
//     'bg_brick_top': PIXI.Texture.from('./assets/decoration/bg_brick_top.png'),
//     'brick_window_l': PIXI.Texture.from('./assets/decoration/brick_window_l.png'),
//     'brick_window_r': PIXI.Texture.from('./assets/decoration/brick_window_r.png'),

//     // Decoration
//     'bush': PIXI.Texture.from('./assets/decoration/bush.png'),
//     'bush_med': PIXI.Texture.from('./assets/decoration/bush_med.png'),
//     'bush_large': PIXI.Texture.from('./assets/decoration/bush_large.png'),
//     'cloud': PIXI.Texture.from('./assets/decoration/cloud.png'),
//     'cloud_med': PIXI.Texture.from('./assets/decoration/cloud_med.png'),
//     'cloud_large': PIXI.Texture.from('./assets/decoration/cloud_large.png'),
//     'hill': PIXI.Texture.from('./assets/decoration/hill.png'),
//     'hill_large': PIXI.Texture.from('./assets/decoration/hill_large.png'),

//     // Entities
//     'mount_still':  PIXI.Texture.from('./assets/entity/mount/still.png'),

//     // Enemies
//     'goomba1': PIXI.Texture.from('./assets/enemy/goomba.png'),
//     'goomba2': PIXI.Texture.from('./assets/enemy/goomba2.png'),
//     'goomba_flat': PIXI.Texture.from('./assets/enemy/goomba_flat.png'),
//     'koopa1': PIXI.Texture.from('./assets/enemy/koopa1.png'),
//     'koopa2': PIXI.Texture.from('./assets/enemy/koopa2.png'),
//     'shell': PIXI.Texture.from('./assets/enemy/shell.png'),
//     'shell_escaping': PIXI.Texture.from('./assets/enemy/shell_escaping.png'),
//     'red_koopa1': PIXI.Texture.from('./assets/enemy/red_koopa1.png'),
//     'red_koopa2': PIXI.Texture.from('./assets/enemy/red_koopa2.png'),
//     'red_shell': PIXI.Texture.from('./assets/enemy/red_shell.png'),
//     'red_shell_escaping': PIXI.Texture.from('./assets/enemy/red_shell_escaping.png'),
//     'bill': PIXI.Texture.from('./assets/enemy/bill.png'),

//     // Items
//     'mushroom': PIXI.Texture.from('./assets/item/mushroom.png'),
//     'life': PIXI.Texture.from('./assets/item/life.png'),
//     'flower1': PIXI.Texture.from('./assets/item/flower1.png'),
//     'flower2': PIXI.Texture.from('./assets/item/flower2.png'),
//     'flower3': PIXI.Texture.from('./assets/item/flower3.png'),
//     'flower4': PIXI.Texture.from('./assets/item/flower4.png'),
//     'star1': PIXI.Texture.from('./assets/item/star1.png'),
//     'star2': PIXI.Texture.from('./assets/item/star2.png'),
//     'star3': PIXI.Texture.from('./assets/item/star3.png'),
//     'star4': PIXI.Texture.from('./assets/item/star4.png'),
//     'parkour': PIXI.Texture.from('./assets/item/parkour.png'),

//     // Projectile
//     'fireball1': PIXI.Texture.from('./assets/item/fireball1.png'),
//     'fireball2': PIXI.Texture.from('./assets/item/fireball2.png'),
//     'fireball3': PIXI.Texture.from('./assets/item/fireball3.png'),
//     'fireball4': PIXI.Texture.from('./assets/item/fireball4.png'),

//     // Particle
//     'brick_break1': PIXI.Texture.from('./assets/particle/brick_break1.png'),
//     'brick_break2': PIXI.Texture.from('./assets/particle/brick_break2.png'),
//     'brick_break3': PIXI.Texture.from('./assets/particle/brick_break3.png'),
//     'brick_break4': PIXI.Texture.from('./assets/particle/brick_break4.png'),

//     'coin_collect1': PIXI.Texture.from('./assets/particle/coin1.png'),
//     'coin_collect2': PIXI.Texture.from('./assets/particle/coin2.png'),
//     'coin_collect3': PIXI.Texture.from('./assets/particle/coin3.png'),
//     'coin_collect4': PIXI.Texture.from('./assets/particle/coin4.png'),

//     'fire_poof1': PIXI.Texture.from('./assets/particle/fire_poof1.png'),
//     'fire_poof2': PIXI.Texture.from('./assets/particle/fire_poof2.png'),
//     'fire_poof3': PIXI.Texture.from('./assets/particle/fire_poof3.png'),
// }


// const anim = {
//     // Temporary
//     // 'powering_up': [textures.still, textures.mario_medium, textures.still, textures.mario_medium],

//     // Small mario
//     'mario_small_still': [textures.still],
//     'mario_small_run': [textures.run1, textures.run2, textures.run3],
//     'mario_small_jump': [textures.jump],
//     'mario_small_turning': [textures.turn],
//     'mario_small_crouch': [textures.crouch],
//     'mario_small_fall': [textures.run1],
//     'mario_dead': [textures.dead],

//     // Mario (Big)
//     'mario_big_still': [textures["mario_big_still"]],
//     'mario_big_run': [textures["mario_big_run1"], textures["mario_big_run2"], textures["mario_big_run3"]],
//     'mario_big_jump': [textures["mario_big_jump"]],
//     'mario_big_turning': [textures["mario_big_turn"]],
//     'mario_big_crouch': [textures["mario_big_crouch"]],
//     'mario_big_fall': [textures["mario_big_run1"]],

//     // Mario (Fire)
//     'mario_fire_still': [textures["mario_fire_still"]],
//     'mario_fire_run': [textures["mario_fire_run1"], textures["mario_fire_run2"], textures["mario_fire_run3"]],
//     'mario_fire_jump': [textures["mario_fire_jump"]],
//     'mario_fire_turning': [textures["mario_fire_turn"]],
//     'mario_fire_crouch': [textures["mario_fire_crouch"]],
//     'mario_fire_fall': [textures["mario_fire_run1"]],
//     'mario_fire_throw': [textures["mario_fire_throw"]],

//     // Mario (Leaf)
//     // 'mario_leaf_still': [textures["mario_leaf_still"]],
//     // 'mario_leaf_run': [textures["mario_leaf_run1"], textures["mario_leaf_run2"], textures["mario_leaf_run3"]],
//     // 'mario_leaf_jump': [textures["mario_leaf_jump"]],
//     // 'mario_leaf_turning': [textures["mario_leaf_turn"]],
//     // 'mario_leaf_crouch': [textures["mario_leaf_crouch"]],
//     // 'mario_leaf_fall': [textures["mario_leaf_run1"]],
//     // 'mario_leaf_throw': [textures["mario_leaf_throw"]],
//     // 'mario_leaf_wall_slide': [textures["mario_leaf_wall_slide"]],
//     // 'mario_leaf_climb2': [textures["mario_leaf_climb2"]],

//     // Mario (cloud)
//     'mario_cloud_still': [textures["mario_cloud_still"]],
//     'mario_cloud_run': [textures["mario_cloud_run1"], textures["mario_cloud_run2"], textures["mario_cloud_run3"]],
//     'mario_cloud_jump': [textures["mario_cloud_jump"]],
//     'mario_cloud_turning': [textures["mario_cloud_turn"]],
//     'mario_cloud_crouch': [textures["mario_cloud_crouch"]],
//     'mario_cloud_fall': [textures["mario_cloud_run1"]],
//     'mario_cloud_throw': [textures["mario_cloud_throw"]],
//     'mario_cloud_wall_slide': [textures["mario_cloud_wall_slide"]],
//     'mario_cloud_climb2': [textures["mario_cloud_climb2"]],

//     // Mario (Modern)
//     'mario_parkour_still': [textures["mario_parkour_still"]],
//     'mario_parkour_run': [textures["mario_parkour_run1"], textures["mario_parkour_run2"], textures["mario_parkour_run3"]],
//     'mario_parkour_jump': [textures["mario_parkour_jump"]],
//     'mario_parkour_turning': [textures["mario_parkour_turn"]],
//     'mario_parkour_crouch': [textures["mario_parkour_crouch"]],
//     'mario_parkour_fall': [textures["mario_parkour_run1"]],
//     'mario_parkour_throw': [textures["mario_parkour_throw"]],
//     'mario_parkour_wall_slide': [textures["mario_parkour_wall_slide"]],
//     'mario_parkour_climb2': [textures["mario_parkour_climb2"]],

//     // Small luigi
//     'luigi_small_still': [textures["2_still"]],
//     'luigi_small_run': [textures["2_run1"], textures["2_run2"], textures["2_run3"]],
//     'luigi_small_jump': [textures["2_jump"]],
//     'luigi_small_turning': [textures["2_turn"]],
//     'luigi_small_crouch': [textures["2_crouch"]],
//     'luigi_small_fall': [textures["2_run1"]],
//     'luigi_dead': [textures["2_dead"]],

//     // Luigi (Big)
//     'luigi_big_still': [textures["luigi_big_still"]],
//     'luigi_big_run': [textures["luigi_big_run1"], textures["luigi_big_run2"], textures["luigi_big_run3"]],
//     'luigi_big_jump': [textures["luigi_big_jump"]],
//     'luigi_big_turning': [textures["luigi_big_turn"]],
//     'luigi_big_crouch': [textures["luigi_big_crouch"]],
//     'luigi_big_fall': [textures["luigi_big_run1"]],

//     // Luigi (Fire)
//     'luigi_fire_still': [textures["luigi_fire_still"]],
//     'luigi_fire_run': [textures["luigi_fire_run1"], textures["luigi_fire_run2"], textures["luigi_fire_run3"]],
//     'luigi_fire_jump': [textures["luigi_fire_jump"]],
//     'luigi_fire_turning': [textures["luigi_fire_turn"]],
//     'luigi_fire_crouch': [textures["luigi_fire_crouch"]],
//     'luigi_fire_fall': [textures["luigi_fire_run1"]],
//     'luigi_fire_throw': [textures["luigi_fire_throw"]],

//     // Tiles
//     none: [textures.none],
//     ground: [textures.ground],
//     hard: [textures.hard],
//     brick: [textures.brick],
//     question: [textures.question, textures.question2, textures.question3, textures.question2, textures.question],
//     invis: [textures.invis],
//     used: [textures.used],
//     coin: [textures.coin1, textures.coin2, textures.coin3, textures.coin2, textures.coin1],
//     spikes: [textures.spikes],

//     // Structure components
//     pipe_top_l: [textures.pipe_top_l],
//     pipe_top_r: [textures.pipe_top_r],
//     pipe_l: [textures.pipe_l],
//     pipe_r: [textures.pipe_r],

//     black: [textures.black],
//     bg_brick: [textures.bg_brick],
//     bg_brick_door: [textures.bg_brick_door],
//     bg_brick_mid: [textures.bg_brick_mid],
//     bg_brick_top: [textures.bg_brick_top],
//     brick_window_l: [textures.brick_window_l],
//     brick_window_r: [textures.brick_window_r],

//     // Decoration
//     bush: [textures.bush],
//     bush_med: [textures.bush_med],
//     bush_large: [textures.bush_large],
//     cloud: [textures.cloud],
//     cloud_med: [textures.cloud_med],
//     cloud_large: [textures.cloud_large],
//     hill: [textures.hill],
//     hill_large: [textures.hill_large],

//     // Entity
//     mount: [textures.mount_still],

//     // Enemies
//     goomba: [textures.goomba1, textures.goomba2],
//     goomba_flat: [textures.goomba_flat],
//     koopa: [textures.koopa1, textures.koopa2],
//     shell: [textures.shell],
//     shell_escaping: [textures.shell_escaping],
//     red_koopa: [textures.red_koopa1, textures.red_koopa2],
//     red_shell: [textures.red_shell],
//     red_shell_escaping: [textures.red_shell_escaping],
//     bill: [textures.bill],
    
//     // Items
//     mushroom: [textures.mushroom],
//     life: [textures.life],
//     flower: [textures.flower1, textures.flower2, textures.flower3, textures.flower4],
//     star: [textures.star1, textures.star2, textures.star3, textures.star4],
//     parkour: [textures.parkour],

//     // Projectiles
//     fireball: [textures.fireball1, textures.fireball2, textures.fireball3, textures.fireball4],
    
//     // Particle
//     brick_break1: [textures.brick_break1],
//     brick_break2: [textures.brick_break2],
//     brick_break3: [textures.brick_break3],
//     brick_break4: [textures.brick_break4],
//     coin_collect: [textures.coin_collect1, textures.coin_collect2, textures.coin_collect3, textures.coin_collect4],
//     fire_poof: [textures.fire_poof1, textures.fire_poof2, textures.fire_poof3],
// }



const textures = {}
const anim = {}

function importTextures() {
    const raw = get('./sheet.json', true);
    for(let [key, value] of Object.entries(raw.textures)) {
        if(value === 0) continue; // Skip comments
        let url = `./assets/${value}.png`;
        let exists = false;

        try { exists = imageExists(url); }
        catch (error) { }

        if(!exists) url = './assets/small.png';
        textures[key] = PIXI.Texture.from(url);
        anim[key] = [textures[key]];
    }
    for(let [key, animation] of Object.entries(raw.animations)) {
        if(animation === 0) continue; // Skip comments
        let arr = [];
        for(let frame of animation) {
            arr.push(textures[frame]);
        }
        // console.log(arr);
        anim[key] = arr;
    }

    // On load
    const loader = document.getElementById('loader')
    loader.style.opacity = 0;
    setTimeout(() => { loader.remove(); }, 300);

    /** Test if image exists */
    function imageExists(image_url){
        var http = new XMLHttpRequest();
        try {
            http.open('HEAD', image_url, false);
            http.send();
        } catch (error) {
            // console.warn(error);
        }
        return (http.status != 404);
    }
}
importTextures();
