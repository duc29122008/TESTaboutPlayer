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
        this.mainAudio = document.getElementById('main-audio');
        this.isPreroll = false;
    };

    PrerollManager.prototype.initPrerolls = function() {
        var numPrerolls = Math.floor(Math.random() * 3) + 1; // Random number between 1 and 3
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

    PrerollManager.prototype.disableMainVideoFeatures = function() {
        this.player.textTrackDisplay.hide();
        this.mainAudio.pause();
        this.mainAudio.currentTime = 0;
        this.player.controlBar.progressControl.disable();
        this.player.controlBar.currentTimeDisplay.hide();
        this.player.controlBar.timeDivider.hide();
        this.player.controlBar.durationDisplay.hide();
        this.player.controlBar.remainingTimeDisplay.hide();
        this.player.controlBar.customControlSpacer.hide();
        this.player.controlBar.playToggle.show();
        this.player.controlBar.volumePanel.show();
    };

    PrerollManager.prototype.enableMainVideoFeatures = function() {
        this.player.textTrackDisplay.show();
        this.player.controlBar.progressControl.enable();
        this.player.controlBar.currentTimeDisplay.show();
        this.player.controlBar.timeDivider.show();
        this.player.controlBar.durationDisplay.show();
        this.player.controlBar.remainingTimeDisplay.show();
        this.player.controlBar.customControlSpacer.show();
    };

    PrerollManager.prototype.playNextPreroll = function() {
        if (this.currentPreroll < this.prerolls.length) {
            this.isPreroll = true;
            this.player.src({ type: 'video/mp4', src: this.prerolls[this.currentPreroll] });
            this.player.addClass('vjs-preroll');
            this.prerollCounter.style.display = 'block';
            this.disableMainVideoFeatures();
            this.player.one('loadedmetadata', () => {
                this.player.muted(false);
                this.updatePrerollCounter();
                this.player.play();
            });
            this.player.one('ended', () => {
                this.currentPreroll++;
                this.playNextPreroll();
            });
        } else {
            this.isPreroll = false;
            this.player.removeClass('vjs-preroll');
            this.prerollCounter.style.display = 'none';
            this.enableMainVideoFeatures();
            this.player.src(this.mainContentSrc);
            this.player.play();
        }
    };

    PrerollManager.prototype.start = function() {
        this.mainContentSrc = this.player.currentSrc();
        this.player.pause();
        this.initPrerolls();
        this.currentPreroll = 0;
        this.playNextPreroll();
    };

    // Register the plugin
    videojs.registerPlugin('prerollManager', function() {
        var player = this;
        var prerollManager = new PrerollManager(player);
        
        player.one('loadedmetadata', function() {
            prerollManager.start();
        });

        player.on('timeupdate', function() {
            if (prerollManager.isPreroll) {
                prerollManager.updatePrerollCounter();
            }
        });

        // Disable seeking during prerolls
        player.on('seeking', function() {
            if (prerollManager.isPreroll) {
                player.currentTime(player.currentTime() - 0.1);
            }
        });

        // Handle play/pause for both prerolls and main content
        player.on('play', function() {
            if (!prerollManager.isPreroll) {
                prerollManager.mainAudio.play();
            }
        });

        player.on('pause', function() {
            if (!prerollManager.isPreroll) {
                prerollManager.mainAudio.pause();
            }
        });

        // Handle volume changes for both prerolls and main content
        player.on('volumechange', function() {
            if (!prerollManager.isPreroll) {
                prerollManager.mainAudio.volume = player.volume();
                prerollManager.mainAudio.muted = player.muted();
            }
        });

        // Handle seeking for main content
        player.on('seeked', function() {
            if (!prerollManager.isPreroll) {
                prerollManager.mainAudio.currentTime = player.currentTime();
            }
        });

        // Override the player's volume methods to control audio directly
        var originalVolume = player.volume;
        var originalMuted = player.muted;

        player.volume = function(percentAsDecimal) {
            if (percentAsDecimal !== undefined) {
                if (!prerollManager.isPreroll) {
                    prerollManager.mainAudio.volume = percentAsDecimal;
                }
                return originalVolume.call(this, percentAsDecimal);
            }
            return prerollManager.isPreroll ? this.volume() : prerollManager.mainAudio.volume;
        };

        player.muted = function(muted) {
            if (muted !== undefined) {
                if (!prerollManager.isPreroll) {
                    prerollManager.mainAudio.muted = muted;
                }
                return originalMuted.call(this, muted);
            }
            return prerollManager.isPreroll ? this.muted() : prerollManager.mainAudio.muted;
        };
    });
})(window.videojs);
