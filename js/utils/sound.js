// Utility for generating synthesized game sounds using the Web Audio API

function makeDistortionCurve(amount) {
    const n_samples = 256;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
        let x = (i * 2) / n_samples - 1;
        curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
}

// --- Master AudioContext and Gain for volume normalization ---
window.masterAudioCtx = window.masterAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
window.masterGain = window.masterGain || window.masterAudioCtx.createGain();
window.masterGain.gain.value = 0.32; // Adjust as needed for overall loudness
if (!window.masterGainConnected) {
    window.masterGain.connect(window.masterAudioCtx.destination);
    window.masterGainConnected = true;
}

function playSynthSound({type = 'shoot', duration = 0.1, frequency = 440, volume = 0.2, curve = null}) {
    const ctx = window.masterAudioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Set oscillator type and frequency based on sound type
    switch (type) {
        case 'shoot':
            osc.type = 'square';
            osc.frequency.setValueAtTime(frequency, ctx.currentTime);
            break;
        case 'warp':
            osc.type = 'sine';
            osc.frequency.setValueAtTime(frequency, ctx.currentTime);
            break;
        case 'magwave':
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(frequency, ctx.currentTime);
            break;
        case 'stardust':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(frequency, ctx.currentTime);
            break;
        case 'enemy_shoot':
            osc.type = 'square';
            osc.frequency.setValueAtTime(frequency, ctx.currentTime);
            break;
        default:
            osc.type = 'sine';
            osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    }

    // Envelope for quick fade out
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(window.masterGain);
    osc.start();
    osc.stop(ctx.currentTime + duration);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
}

// Helper functions for each sound event
function playShootSound() {
    const ctx = window.masterAudioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const dist = ctx.createWaveShaper();
    dist.curve = makeDistortionCurve(120); // Even more distortion
    dist.oversample = '4x';
    osc.type = 'square';
    osc.frequency.setValueAtTime(80, ctx.currentTime); // Much lower pitch
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
    osc.connect(dist);
    dist.connect(gain);
    gain.connect(window.masterGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); dist.disconnect(); };
}

let warpRetriggerInterval = null;
let warpNoiseSource = null;
let warpNoiseGain = null;
let warpNoiseDist = null;

function playShortWarpSound() {
    const ctx = window.masterAudioCtx;
    const bufferSize = 0.14 * ctx.sampleRate; // ~140ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1; // White noise
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = ctx.createGain();
    const dist = ctx.createWaveShaper();
    dist.curve = makeDistortionCurve(180); // Very strong distortion for grit
    dist.oversample = '4x';
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.13);
    noise.connect(dist);
    dist.connect(gain);
    gain.connect(window.masterGain);
    noise.start();
    noise.stop(ctx.currentTime + 0.14);
    noise.onended = () => { noise.disconnect(); gain.disconnect(); dist.disconnect(); };
}

function startWarpSound() {
    if (warpRetriggerInterval) return;
    playShortWarpSound();
    warpRetriggerInterval = setInterval(playShortWarpSound, 120); // retrigger every 120ms
}

function stopWarpSound() {
    if (warpRetriggerInterval) {
        clearInterval(warpRetriggerInterval);
        warpRetriggerInterval = null;
    }
}

function playWarpSound() {
    const ctx = window.masterAudioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const dist = ctx.createWaveShaper();
    // Static-like: use white noise approximation with fast random frequency jumps
    osc.type = 'square';
    // Rapid frequency jumps for static effect
    let now = ctx.currentTime;
    for (let i = 0; i < 8; i++) {
        let freq = 200 + Math.random() * 800;
        osc.frequency.setValueAtTime(freq, now + i * 0.01);
    }
    // Distortion
    dist.curve = makeDistortionCurve(40);
    dist.oversample = '4x';
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.13);
    osc.connect(dist);
    dist.connect(gain);
    gain.connect(window.masterGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.14);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); dist.disconnect(); };
}

function playMagwaveSound() {
    playSynthSound({type: 'magwave', duration: 0.2, frequency: 330, volume: 0.16});
}

function playStardustSound() {
    const ctx = window.masterAudioCtx;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    // Mario coin: two quick notes, triangle and square, but much lower pitch
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(180, ctx.currentTime); // Lower pitch
    osc1.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.07); // Lower pitch sweep
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(260, ctx.currentTime); // Lower pitch
    osc2.frequency.linearRampToValueAtTime(330, ctx.currentTime + 0.07); // Lower pitch sweep
    gain.gain.setValueAtTime(0.0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.012, ctx.currentTime + 0.01); // Even lower volume
    gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.28); // Stretched decay
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(window.masterGain);
    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.28);
    osc2.stop(ctx.currentTime + 0.28);
    osc1.onended = () => { osc1.disconnect(); };
    osc2.onended = () => { osc2.disconnect(); gain.disconnect(); };
}

function playEnemyShootSound() {
    const ctx = window.masterAudioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    // Add reverb
    const reverb = ctx.createConvolver();
    const reverbLen = 0.18 * ctx.sampleRate;
    const reverbBuf = ctx.createBuffer(1, reverbLen, ctx.sampleRate);
    const reverbData = reverbBuf.getChannelData(0);
    for (let i = 0; i < reverbLen; i++) {
        reverbData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLen, 2.5);
    }
    reverb.buffer = reverbBuf;
    // Laser pew: sharp high-to-low sweep, sawtooth wave
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(650, ctx.currentTime); // Higher pitch
    osc.frequency.linearRampToValueAtTime(320, ctx.currentTime + 0.13); // Higher end
    // Very fast attack and moderate volume
    gain.gain.setValueAtTime(0.0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.36, ctx.currentTime + 0.008); // Increase volume to 0.36, keep punchy attack
    gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.13);
    osc.connect(gain);
    gain.connect(reverb);
    reverb.connect(window.masterGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.14);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); reverb.disconnect(); };
}

// --- Magwave: use a new AudioContext for each activation (like warp) ---
let magwaveRetriggerInterval = null;

function playShortMagwaveSound() {
    const ctx = window.masterAudioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const lfo = ctx.createOscillator();
    const vibrato = ctx.createGain();
    const dist = ctx.createWaveShaper();
    // Main oscillator
    osc.type = 'triangle';
    // Reverse sweep: start low, ramp up
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(350, ctx.currentTime + 0.18);
    // Soften attack: fade in gain over 0.04s
    gain.gain.setValueAtTime(0.0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 0.04);
    gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    // Vibrato LFO
    vibrato.gain.value = 40;
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(18, ctx.currentTime);
    lfo.connect(vibrato);
    vibrato.connect(osc.frequency);
    lfo.start();
    // Distortion
    dist.curve = makeDistortionCurve(18);
    dist.oversample = '4x';
    osc.connect(dist);
    dist.connect(gain);
    gain.connect(window.masterGain);
    osc.start();
    // Envelope and stop
    osc.stop(ctx.currentTime + 0.2);
    lfo.stop(ctx.currentTime + 0.2);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); dist.disconnect(); lfo.disconnect(); vibrato.disconnect(); };
}

function startMagwaveSound() {
    if (magwaveRetriggerInterval) return;
    playShortMagwaveSound();
    magwaveRetriggerInterval = setInterval(playShortMagwaveSound, 160); // retrigger every 160ms
}

function stopMagwaveSound() {
    if (magwaveRetriggerInterval) {
        clearInterval(magwaveRetriggerInterval);
        magwaveRetriggerInterval = null;
    }
}

let engineSoundNodes = null;

function startContinuousWarpSound() {
    if (engineSoundNodes) return; // Already playing
    const ctx = window.masterAudioCtx;

    // --- Deep sub-bass rumble ---
    const bassOsc = ctx.createOscillator();
    bassOsc.type = 'triangle';
    bassOsc.frequency.setValueAtTime(32, ctx.currentTime); // Sub-bass
    const bassGain = ctx.createGain();
    bassGain.gain.setValueAtTime(0.22, ctx.currentTime);
    bassOsc.connect(bassGain);

    // --- Pink noise (filtered white noise, less deep than brown, more natural, now lower in pitch) ---
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
        let white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        let pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        pink *= 0.11;
        b6 = white * 0.115926;
        // Lower the pitch by strong lowpass: average with previous 7 samples
        if (i > 6) {
            pink = (pink + data[i-1] + data[i-2] + data[i-3] + data[i-4] + data[i-5] + data[i-6] + data[i-7]) / 8;
        }
        data[i] = pink;
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;
    // Bandpass filter for mid whoosh
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 420;
    bandpass.Q.value = 0.7;
    // Lowpass for overall smoothness
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 1800;
    // Noise gain
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(2.5, ctx.currentTime); // Further increase pink noise
    noiseSource.connect(bandpass);
    bandpass.connect(lowpass);
    lowpass.connect(noiseGain);

    // --- High whine (modulated oscillator) ---
    const whineOsc = ctx.createOscillator();
    whineOsc.type = 'sawtooth';
    whineOsc.frequency.setValueAtTime(1100, ctx.currentTime);
    // Vibrato for whine
    const whineLFO = ctx.createOscillator();
    whineLFO.type = 'sine';
    whineLFO.frequency.setValueAtTime(7, ctx.currentTime);
    const whineLFOGain = ctx.createGain();
    whineLFOGain.gain.setValueAtTime(40, ctx.currentTime);
    whineLFO.connect(whineLFOGain);
    whineLFOGain.connect(whineOsc.frequency);
    const whineGain = ctx.createGain();
    whineGain.gain.setValueAtTime(0.01, ctx.currentTime); // Further lower whine volume
    whineOsc.connect(whineGain);

    // Remove engine pulse (amplitude modulation)
    // --- Engine pulse (amplitude modulation) ---
    // const pulseLFO = ctx.createOscillator();
    // pulseLFO.type = 'sine';
    // pulseLFO.frequency.setValueAtTime(2.1, ctx.currentTime); // Engine pulse rate
    // const pulseGain = ctx.createGain();
    // pulseGain.gain.setValueAtTime(0.13, ctx.currentTime);
    // pulseLFO.connect(pulseGain.gain);
    // Mix all layers
    const mixGain = ctx.createGain();
    mixGain.gain.setValueAtTime(1.0, ctx.currentTime);
    bassGain.connect(mixGain);
    noiseGain.connect(mixGain);
    whineGain.connect(mixGain);
    // Remove amplitude modulation for engine pulse
    // mixGain.connect(pulseGain);
    // --- Reverb ---
    const reverb = ctx.createConvolver();
    const reverbLen = 0.7 * ctx.sampleRate; // More reverb: longer impulse
    const reverbBuf = ctx.createBuffer(1, reverbLen, ctx.sampleRate);
    const reverbData = reverbBuf.getChannelData(0);
    for (let i = 0; i < reverbLen; i++) {
        reverbData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLen, 2.5);
    }
    reverb.buffer = reverbBuf;
    mixGain.connect(reverb);
    reverb.connect(window.masterGain);

    // Start all sources
    bassOsc.start();
    noiseSource.start();
    whineOsc.start();
    whineLFO.start();
    // pulseLFO.start(); // Removed

    engineSoundNodes = {
        bassOsc, bassGain, noiseSource, bandpass, lowpass, noiseGain,
        whineOsc, whineLFO, whineLFOGain, whineGain, /*pulseLFO, pulseGain,*/ mixGain, reverb
    };
}

function stopContinuousWarpSound() {
    if (engineSoundNodes) {
        const ctx = window.masterAudioCtx;
        // Fade out
        engineSoundNodes.mixGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
        setTimeout(() => {
            try {
                engineSoundNodes.bassOsc.stop();
                engineSoundNodes.noiseSource.stop();
                engineSoundNodes.whineOsc.stop();
                engineSoundNodes.whineLFO.stop();
                // engineSoundNodes.pulseLFO.stop(); // Removed
            } catch (e) {}
            // Disconnect all
            Object.values(engineSoundNodes).forEach(node => {
                if (node && node.disconnect) try { node.disconnect(); } catch (e) {}
            });
            engineSoundNodes = null;
        }, 200);
    }
}

let ambientRumbleNodes = null;

function startAmbientRumble() {
    if (ambientRumbleNodes) return; // Already playing
    const ctx = window.masterAudioCtx;
    // --- Deep sub-bass rumble ---
    const bassOsc = ctx.createOscillator();
    bassOsc.type = 'triangle';
    bassOsc.frequency.setValueAtTime(14, ctx.currentTime); // Lower pitch significantly
    const bassGain = ctx.createGain();
    bassGain.gain.setValueAtTime(0.22, ctx.currentTime); // Increase bass volume
    bassOsc.connect(bassGain);
    // --- Pink noise for texture ---
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
        let white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        let pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        pink *= 0.11;
        b6 = white * 0.115926;
        if (i > 6) pink = (pink + data[i-1] + data[i-2] + data[i-3] + data[i-4] + data[i-5] + data[i-6] + data[i-7]) / 8;
        data[i] = pink;
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.22, ctx.currentTime); // Increase pink noise volume
    noiseSource.connect(noiseGain);
    // --- Mix and reverb ---
    const mixGain = ctx.createGain();
    mixGain.gain.setValueAtTime(2.2, ctx.currentTime); // Increase overall rumble volume
    bassGain.connect(mixGain);
    noiseGain.connect(mixGain);
    // Add a lowpass filter to remove hiss
    const rumbleLowpass = ctx.createBiquadFilter();
    rumbleLowpass.type = 'lowpass';
    rumbleLowpass.frequency.value = 220; // Cutoff frequency for deep rumble
    mixGain.connect(rumbleLowpass);
    const reverb = ctx.createConvolver();
    const reverbLen = 0.5 * ctx.sampleRate;
    const reverbBuf = ctx.createBuffer(1, reverbLen, ctx.sampleRate);
    const reverbData = reverbBuf.getChannelData(0);
    for (let i = 0; i < reverbLen; i++) {
        reverbData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLen, 2.5);
    }
    reverb.buffer = reverbBuf;
    rumbleLowpass.connect(reverb);
    reverb.connect(window.masterGain);
    // Start
    bassOsc.start();
    noiseSource.start();
    ambientRumbleNodes = { bassOsc, bassGain, noiseSource, noiseGain, mixGain, reverb };
}

function stopAmbientRumble() {
    if (ambientRumbleNodes) {
        const ctx = window.masterAudioCtx;
        ambientRumbleNodes.mixGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
        setTimeout(() => {
            try {
                ambientRumbleNodes.bassOsc.stop();
                ambientRumbleNodes.noiseSource.stop();
            } catch (e) {}
            Object.values(ambientRumbleNodes).forEach(node => {
                if (node && node.disconnect) try { node.disconnect(); } catch (e) {}
            });
            ambientRumbleNodes = null;
        }, 200);
    }
}
window.startAmbientRumble = startAmbientRumble;
window.stopAmbientRumble = stopAmbientRumble;