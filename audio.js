// 音频系统模块
class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.soundVolume = 0.5;
        this.musicVolume = 0.3;
        this.init();
    }
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createSounds();
            this.createBackgroundMusic();
        } catch (e) {
            console.warn('Audio not supported:', e);
            this.soundEnabled = false;
            this.musicEnabled = false;
        }
    }
    
    createSounds() {
        this.sounds = {
            shoot: () => this.createTone(800, 0.1, 'square'),
            hit: () => this.createTone(400, 0.15, 'sawtooth'),
            explosion: () => this.createNoise(0.3),
            build: () => this.createTone(600, 0.2, 'triangle'),
            upgrade: () => this.createChord([523, 659, 784], 0.3),
            waveStart: () => this.createChord([440, 554, 659], 0.5),
            gameOver: () => this.createDescendingTone(400, 200, 1.0),
            achievement: () => this.createChord([659, 831, 988], 0.4)
        };
    }
    
    createTone(frequency, duration, type = 'sine') {
        if (!this.audioContext || !this.soundEnabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(this.soundVolume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    createNoise(duration) {
        if (!this.audioContext || !this.soundEnabled) return;
        
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.3;
        }
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        gainNode.gain.setValueAtTime(this.soundVolume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        source.start(this.audioContext.currentTime);
    }
    
    createChord(frequencies, duration) {
        frequencies.forEach(freq => this.createTone(freq, duration, 'sine'));
    }
    
    createDescendingTone(startFreq, endFreq, duration) {
        if (!this.audioContext || !this.soundEnabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(endFreq, this.audioContext.currentTime + duration);
        oscillator.type = 'sawtooth';
        
        gainNode.gain.setValueAtTime(this.soundVolume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    createBackgroundMusic() {
        if (!this.audioContext || !this.musicEnabled) return;
        this.playBackgroundMusic();
    }
    
    playBackgroundMusic() {
        if (!this.audioContext || !this.musicEnabled) return;
        
        const notes = [440, 523, 659, 784, 659, 523];
        let noteIndex = 0;
        
        const playNote = () => {
            if (!this.musicEnabled) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(notes[noteIndex], this.audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(this.musicVolume * 0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.5);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 1.5);
            
            noteIndex = (noteIndex + 1) % notes.length;
            setTimeout(playNote, 2000);
        };
        
        playNote();
    }
    
    playSound(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }
    
    setVolume(soundVolume, musicVolume) {
        this.soundVolume = soundVolume;
        this.musicVolume = musicVolume;
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    }
    
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (this.musicEnabled) {
            this.createBackgroundMusic();
        }
        return this.musicEnabled;
    }
}
