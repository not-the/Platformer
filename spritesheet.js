// DOM
const body = document.querySelector('body');
const gamespace = document.getElementById('game');
const drawSel = document.getElementById('drawtile');
const importInput = document.getElementById("import_level");
const config_scroll_behavior = document.getElementById('config_scroll_behavior');
const config_bg_color = document.getElementById("config_bg_color");

// PIXI.js Setup
let app = new PIXI.Application({ width: 1200, height: 672 });
app.renderer.background.color = 0x9290ff;
PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;
app.stage.y += 48;
document.getElementById('game').appendChild(app.view);

/** Image filters */
const filters = {
    rainbow: new PIXI.filters.ColorMatrixFilter(),
    // flashing: new PIXI.filters.BevelFilter(),
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
function average(array) {
    let o;
    try {o = array.reduce((a, b) => a + b) / array.length; }
    catch (error) { /*console.warn('Can\'t average empty array');*/ }
    return o;
}
/** Adds or removes a class from an element */
function style(element, classname, state) { state ? element.classList.add(classname) : element.classList.remove(classname); }
/** Disable keyboard on SELECT element. Source: https://stackoverflow.com/a/1227324 */
function IgnoreAlpha(e) {
    if(!e) e = window.event;
    if (e.keyCode >= 65 && e.keyCode <= 90) [e.returnValue, e.cancel] = [false, true];
}

/** Sets sprite anchor and scale */
function spriteFix(sprite, anchors=true) {
    sprite.scale.x = 3;
    sprite.scale.y = 3;
    if(anchors) {
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 1;
    }
    // sprite.filters = [filters.rainbow];
}

function setAnimation(s, name, speed=true) {
    if(s.textures === anim[name]) return;
    if(anim[name] !== undefined) s.textures = anim[name];
    if(speed !== false) s.animationSpeed = 0.16;
    playPauseSprite(s);
}

/** Play/pause a sprite depending on if the game is running */
function playPauseSprite(spr) {
    world.paused ? spr.stop() : spr.play()
}

// Sprites
const textures = {}
const anim = {}

/** importTextures */
function importTextures() {
    const raw = get('./sheet.json', true);
    for(let [key, value] of Object.entries(raw.textures)) {
        if(value === 0) continue; // Skip comments
        let url = `./assets/${value}.png`;
        let exists = false;
        try { exists = imageExists(url); } catch (error) { }
        if(!exists) url = './assets/missing.png';

        textures[key] = PIXI.Texture.from(url);
        anim[key] = [textures[key]];
    }
    for(let [key, animation] of Object.entries(raw.animations)) {
        if(animation === 0) continue; // Skip comments
        let arr = [];
        for(let frame of animation) arr.push(textures[frame]);
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
        } catch (error) {/* console.warn(error); */}
        return (http.status != 404);
    }
}
importTextures();
