/*
  Copyright 2020 David Whiting
  This work is licensed under a Creative Commons Attribution 4.0 International License
  https://creativecommons.org/licenses/by/4.0/
*/
import { fill, rnd } from './utils.js';
const A3Frequency = 440;
const A0Frequency = A3Frequency / 8;
function Audio(ctx) {
    function oscillatorNode(type, freq = 440) {
        const node = ctx.createOscillator();
        node.type = type;
        node.frequency.value = freq;
        return node;
    }
    function waveShaperNode(curve) {
        const node = ctx.createWaveShaper();
        node.curve = new Float32Array(curve);
        return node;
    }
    function gainNode(gainAmount = 0) {
        const node = ctx.createGain();
        node.gain.value = gainAmount;
        return node;
    }
    function stereoPannerNode(pan) {
        if (ctx.createStereoPanner) {
            const node = ctx.createStereoPanner();
            node.pan.value = pan;
            return node;
        }
        else {
            const node = ctx.createPanner();
            node.panningModel = "equalpower";
            node.setPosition(pan, 0, 0.5);
            // @ts-ignore
            node.pan = node.positionX;
            return node;
        }
    }
    function SquareSynth(pan = 0) {
        const set = (a, v) => { a.cancelScheduledValues(ctx.currentTime); a.setValueAtTime(v, ctx.currentTime); };
        const towards = (a, v, t) => { a.setTargetAtTime(t, ctx.currentTime, t); };
        const slide = (a, v, t) => { a.cancelScheduledValues(ctx.currentTime); a.setTargetAtTime(v, ctx.currentTime, t); };
        const wavetableTrigger = oscillatorNode("sawtooth"), pulseWavetable = waveShaperNode(new Float32Array(256).fill(-1, 0, 128).fill(1, 128, 256)), alwaysOneWavetable = waveShaperNode(new Float32Array(2).fill(1, 0, 2)), wavetableOffsetGain = gainNode(), pulseOutputGain = gainNode(), outputPanner = stereoPannerNode(pan);
        wavetableTrigger.start();
        wavetableTrigger.connect(pulseWavetable);
        wavetableTrigger.connect(alwaysOneWavetable);
        alwaysOneWavetable.connect(wavetableOffsetGain);
        wavetableOffsetGain.connect(pulseWavetable);
        pulseWavetable.connect(pulseOutputGain);
        pulseOutputGain.connect(outputPanner);
        outputPanner.connect(ctx.destination);
        const freq = wavetableTrigger.frequency, width = wavetableOffsetGain.gain, gain = pulseOutputGain.gain;
        const decay = 0.04, sustain = 0.7, release = 0.01, level = 0.1;
        function noteOn(note, glide = 0) {
            const glideTime = glide / 10;
            slide(freq, A0Frequency * Math.pow(2, (note / 12)), glideTime);
            set(gain, level);
            towards(gain, level * sustain, decay);
        }
        function noteOff() {
            slide(gain, 0, release);
        }
        function play(note) {
            var _a, _b, _c;
            if (note.note === "---") {
                noteOff();
            }
            else if (note.note === 'cont') {
                // do nothing
            }
            else {
                noteOn(note.note, (_a = note.fx) === null || _a === void 0 ? void 0 : _a.glide);
            }
            set(width, (_c = (_b = note.fx) === null || _b === void 0 ? void 0 : _b.pulseWidth) !== null && _c !== void 0 ? _c : 0.0);
        }
        return { play };
    }
    function DrumSynth() {
        const toneOscillator = oscillatorNode("square", 55), toneGain = gainNode(), noiseWavetableTrigger = oscillatorNode("sawtooth", 20), noiseWavetable = waveShaperNode(fill(1024, x => rnd() * 2 - 1)), noiseGain = gainNode(), noisePan = stereoPannerNode(0);
        toneOscillator.start();
        noiseWavetableTrigger.start();
        toneOscillator.connect(toneGain);
        toneGain.connect(ctx.destination);
        noiseWavetableTrigger.connect(noiseWavetable);
        noiseWavetable.connect(noiseGain);
        noiseGain.connect(noisePan);
        noisePan.connect(ctx.destination);
        function play(slot) {
            const vel = slot.vel ? slot.vel : 1;
            if (slot.drum === 'KCK') {
                toneOscillator.detune.cancelScheduledValues(ctx.currentTime);
                toneOscillator.detune.setValueAtTime(3000, ctx.currentTime);
                toneOscillator.detune.setTargetAtTime(0, ctx.currentTime, 0.07);
                toneGain.gain.cancelScheduledValues(ctx.currentTime);
                toneGain.gain.setValueAtTime(0.2 * vel, ctx.currentTime);
                toneGain.gain.setValueCurveAtTime(new Float32Array([0.2 * vel, 0.2 * vel, 0.13 * vel, 0.05 * vel, 0.0]), ctx.currentTime, 0.10);
            }
            else if (slot.drum === 'NSS') {
                noiseGain.gain.cancelScheduledValues(ctx.currentTime);
                noiseGain.gain.setValueAtTime(0.1 * vel, ctx.currentTime);
                noiseGain.gain.setValueCurveAtTime(new Float32Array([0.1 * vel, 0.04 * vel, 0.0]), ctx.currentTime, 0.08);
                // Ugly workaround for safari being a bitch
                if ("pan" in noisePan) {
                    noisePan.pan.cancelScheduledValues(ctx.currentTime);
                    noisePan.pan.setValueAtTime(rnd() * 0.4 - 0.2, ctx.currentTime);
                }
            }
            else if (slot.drum === 'SNR') {
                toneOscillator.detune.cancelScheduledValues(ctx.currentTime);
                toneOscillator.detune.setValueAtTime(2400, ctx.currentTime);
                toneOscillator.detune.setTargetAtTime(600, ctx.currentTime, 0.04);
                toneGain.gain.cancelScheduledValues(ctx.currentTime);
                toneGain.gain.setValueAtTime(0.15 * vel, ctx.currentTime);
                toneGain.gain.setValueCurveAtTime(new Float32Array([0.15 * vel, 0.05 * vel, 0.01 * vel, 0]), ctx.currentTime, 0.10);
                noiseGain.gain.cancelScheduledValues(ctx.currentTime);
                noiseGain.gain.setValueAtTime(0.2 * vel, ctx.currentTime);
                noiseGain.gain.setValueCurveAtTime(new Float32Array([0.2 * vel, 0.15 * vel, 0.0]), ctx.currentTime, 0.15);
            }
        }
        return {
            play,
        };
    }
    return {
        SquareSynth,
        DrumSynth
    };
}
export default Audio;
//# sourceMappingURL=audio.js.map