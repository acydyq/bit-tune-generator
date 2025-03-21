/*
  Copyright 2020 David Whiting
  This work is licensed under a Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
*/
import PatternDisplay from './display.js';
import { choose, rndInt, rnd, seedRNG } from './utils.js';
import Audio from "./audio.js";
import * as music from './theory.js';
import * as Generators from './generators.js';
const PatternSize = 64;
const progressions = [
    [1, 1, 1, 1, 6, 6, 6, 6, 4, 4, 4, 4, 3, 3, 5, 5],
    [1, 1, 1, 1, 6, 6, 6, 6, 1, 1, 1, 1, 6, 6, 6, 6],
    [4, 4, 4, 4, 5, 5, 5, 5, 1, 1, 1, 1, 1, 1, 3, 3],
    [1, 1, 6, 6, 4, 4, 5, 5, 1, 1, 6, 6, 3, 3, 5, 5],
    [5, 5, 4, 4, 1, 1, 1, 1, 5, 5, 6, 6, 1, 1, 1, 1],
    [6, 6, 6, 6, 5, 5, 5, 5, 4, 4, 4, 4, 5, 5, 5, 5],
    [1, 1, 1, 1, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5],
    [6, 6, 6, 6, 4, 4, 4, 4, 1, 1, 1, 1, 1, 1, 5, 5],
    [1, 1, 1, 1, 1, 1, 1, 1, 4, 4, 4, 4, 4, 4, 4, 4]
];
function hex(v) { return Math.floor(v).toString(16).toUpperCase().padStart(2, '0'); }
function unhex(v) {
    return parseInt(v, 16);
}
function save(state) {
    const nonRandomElements = [state.key, state.scale == music.scales.major ? 0 : 1, progressions.indexOf(state.progression), state.bpm, state.songIndex % 256];
    const saveCode = "0x" + nonRandomElements.map(hex).join("") + state.seedCode;
    return saveCode;
}
function restore(code) {
    const codeString = code.slice(2);
    const key = unhex(codeString.slice(0, 2));
    const scale = unhex(codeString.slice(2, 4)) === 0 ? music.scales.major : music.scales.minor;
    const progression = progressions[unhex(codeString.slice(4, 6))];
    const bpm = unhex(codeString.slice(6, 8));
    const songIndex = unhex(codeString.slice(8, 10));
    const seedCode = codeString.slice(10);
    return {
        bpm,
        key,
        progression,
        scale,
        seedCode,
        songIndex
    };
}
function bpmClock() {
    let intervalHandle = {
        bpmClock: 0
    };
    let fN = 0;
    function set(bpm, frameFunction) {
        window.clearInterval(intervalHandle.bpmClock);
        intervalHandle.bpmClock = window.setInterval(() => frameFunction(fN++), (60000 / bpm) / 4);
    }
    return {
        set
    };
}
function createInitialState(seedOrSave) {
    if (seedOrSave.startsWith("0x")) {
        return restore(seedOrSave);
    }
    else {
        seedRNG(seedOrSave && seedOrSave.length > 0 ? seedOrSave : "" + Math.random());
        return {
            key: rndInt(12),
            scale: music.scales.minor,
            progression: progressions[0],
            bpm: 112,
            seedCode: createSeedCode(),
            songIndex: 0
        };
    }
}
function createSeedCode() {
    return hex(rndInt(255)) + hex(rndInt(255)) + hex(rndInt(255)) + hex(rndInt(255));
}
function mutateState(state) {
    state.songIndex++;
    if (state.songIndex % 8 === 0) {
        state.bpm = Math.floor(rnd() * 80) + 100;
        //clock.set(state.bpm, frame);
    }
    if (state.songIndex % 4 === 0) {
        [state.key, state.scale] = music.modulate(state.key, state.scale);
    }
    if (state.songIndex % 2 === 0) {
        state.progression = choose(progressions);
    }
    state.seedCode = hex(rndInt(255)) + hex(rndInt(255)) + hex(rndInt(255)) + hex(rndInt(255));
    seedRNG(state.seedCode);
    //display.setPatterns(patterns, stateString);
}
function start() {
    const seedOrSave = document.getElementById("seed-text").value;
    const state = createInitialState(seedOrSave);
    let patterns = [[], [], [], [], []];
    const display = PatternDisplay(document.getElementById("display"));
    const clock = bpmClock();
    // @ts-ignore
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const au = Audio(ctx);
    const synths = [
        au.SquareSynth(),
        au.SquareSynth(-0.5),
        au.SquareSynth(),
        au.SquareSynth(0.5),
        au.DrumSynth()
    ];
    function newPatterns() {
        seedRNG(state.seedCode);
        patterns = [
            choose([Generators.bass, Generators.bass2, Generators.emptyNote])(state),
            rnd() < 0.7 ? Generators.arp(state) : Generators.emptyNote(),
            rnd() < 0.7 ? Generators.melody1(state) : Generators.emptyNote(),
            choose([Generators.emptyNote, Generators.arp, Generators.melody1])(state),
            rnd() < 0.8 ? Generators.drum() : Generators.emptyDrum(),
        ];
    }
    // create initial patterns
    newPatterns();
    display.setPatterns(patterns, save(state));
    function frame(f) {
        const positionInPattern = f % PatternSize;
        if (f % 128 === 0 && f !== 0) {
            mutateState(state);
            newPatterns();
            clock.set(state.bpm, frame);
            display.setPatterns(patterns, save(state));
        }
        display.highlightRow(positionInPattern);
        // Not a loop because these tuple parts have different types depending on melody vs drum
        synths[0].play(patterns[0][positionInPattern]);
        synths[1].play(patterns[1][positionInPattern]);
        synths[2].play(patterns[2][positionInPattern]);
        synths[3].play(patterns[3][positionInPattern]);
        synths[4].play(patterns[4][positionInPattern]);
    }
    clock.set(state.bpm, frame);
}
window.onload = function () {
    var _a, _b;
    if (window.location.search.startsWith("?")) {
        document.getElementById("seed-text").value = window.location.search.slice(1);
    }
    let started = false;
    (_a = document.getElementById("start")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", e => {
        if (!started) {
            start();
        }
        started = true;
    });
    (_b = document.getElementById("seed-entry")) === null || _b === void 0 ? void 0 : _b.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            if (!started) {
                start();
            }
            started = true;
        }
    });
};
//# sourceMappingURL=tracker.js.map