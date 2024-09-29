(function(videojs) {
    // Configuration
    var prerollPool = [
        'https://www.dl.dropboxusercontent.com/scl/fi/igc5hox15osy9u3txo9jg/ads1.mp4?rlkey=tbk0m2toeb1gkptti51jz94if&raw=1',
        'https://www.dl.dropboxusercontent.com/scl/fi/bgzm8l8v0jl1fa19kopzt/ads2.mp4?rlkey=iy95wywcmojac8k8xowf3y5ln&raw=1',
        'https://www.dl.dropboxusercontent.com/scl/fi/k6zwiytq6nhc4v43wlk87/ads3.mp4?rlkey=tyds1mc9v06attkiwv2t5dapp&raw=1',
        'https://www.dl.dropboxusercontent.com/scl/fi/sfixiszh59j7hp7gw3sta/ads4.mp4?rlkey=g8xq168pa3pfpmxqlvmqo22tm&raw=1',
        'https://www.dl.dropboxusercontent.com/scl/fi/rne20mz9xpjnmd6a103zf/ads5.mp4?rlkey=l4lpjce6bpg7vtrnrc9qwn8fd&raw=1'
    ];

    var PrerollManager = function(player) {
        this.player = player;
        this.prerolls = [];
        this.currentPreroll = 0;
        this.prerollCounter = document.createElement('div');
        this.prerollCounter.className = 'preroll-counter';
        this.player.el().appendChild(this.prerollCounter);
        this.mainContentSrc = null;
        this.mainContentTextTracks = null;
        this.mainAudioElements = null;
        this.originalVolume = null;
    };

    PrerollManager.prototype.initPrerolls = function() {
        var numPrerolls = Math.floor(Math.random() * 3) + 1;
        this.prerolls = [];
        for (var i = 0; i < numPrerolls; i++) {
            var randomIndex = Math.floor(Math.random() * prerollPool.length);
            this.prerolls.push(prerollPool[randomIndex]);
        }
    };

    PrerollManager.prototype.formatTime = function(seconds) {
        var minutes = Math.floor(seconds / 60);
        var remainingSeconds = Math.floor(seconds % 60);
        return `-${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    PrerollManager.prototype.updatePrerollCounter = function() {
        var remainingTime = this.player.duration() - this.player.currentTime();
        this.prerollCounter.textContent = `Quảng cáo • ${this.currentPreroll + 1}/${this.prerolls.length} • ${this.formatTime(remainingTime)}`;
    };

    PrerollManager.prototype.disableMainContent = function() {
        // Store main content source and text tracks
        this.mainContentSrc = this.player.currentSrc();
        this.mainContentTextTracks = Array.from(this.player.textTracks());
        
        // Store and mute main audio elements
        this.mainAudioElements = Array.from(document.querySelectorAll('audio'));
        this.mainAudioElements.forEach(audio => {
            audio.muted = true;
        });
        
        // Store original volume and mute the player
        this.originalVolume = this.player.volume();
        this.player.muted(true);
        
        // Remove the source from the video element
        this.player.src('');
        
        // Disable all text tracks
        this.player.textTracks().tracks_.forEach(track => {
            track.mode = 'disabled';
        });
        
        // Add a class to the player for CSS targeting
        this.player.addClass('vjs-preroll');
        
        // Show the preroll counter
        this.prerollCounter.style.display = 'block';
    };

    PrerollManager.prototype.enableMainContent = function() {
        // Restore main content source
        this.player.src(this.mainContentSrc);
        
        // Restore text tracks
        this.mainContentTextTracks.forEach(track => {
            this.player.textTracks().addTrack(track);
        });
        
        // Remove the preroll class
        this.player.removeClass('vjs-preroll');
        
        // Hide the preroll counter
        this.prerollCounter.style.display = 'none';

        // Unmute main audio elements and restore original volume
        if (this.mainAudioElements) {
            this.mainAudioElements.forEach(audio => {
                audio.muted = false;
            });
        }
        this.player.muted(false);
        this.player.volume(this.originalVolume);
    };

    PrerollManager.prototype.playNextPreroll = function() {
        if (this.currentPreroll < this.prerolls.length) {
            this.player.src({ type: 'video/mp4', src: this.prerolls[this.currentPreroll] });
            this.player.one('loadedmetadata', () => {
                this.player.muted(false);  // Ensure preroll audio is not muted
                this.updatePrerollCounter();
                this.player.play();
            });
            this.player.one('ended', () => {
                this.currentPreroll++;
                this.playNextPreroll();
            });
        } else {
            this.enableMainContent();
            this.player.one('loadedmetadata', () => {
                this.player.play();
            });
        }
    };

    PrerollManager.prototype.start = function() {
        this.disableMainContent();
        this.initPrerolls();
        this.currentPreroll = 0;
        this.playNextPreroll();
    };

    // Register the plugin
    videojs.registerPlugin('prerollManager', function() {
        var prerollManager = new PrerollManager(this);
        
        this.one('loadedmetadata', function() {
            prerollManager.start();
        });

        this.on('timeupdate', function() {
            if (this.hasClass('vjs-preroll')) {
                prerollManager.updatePrerollCounter();
            }
        });
    });
})(window.videojs);
