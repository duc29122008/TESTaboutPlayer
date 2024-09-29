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
        this.mainContentTracks = null;
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

    PrerollManager.prototype.setupForPreroll = function() {
        // Add a class to the player for CSS targeting
        this.player.addClass('vjs-preroll');
        
        // Show the preroll counter
        this.prerollCounter.style.display = 'block';

        // Ensure audio is enabled for prerolls
        this.player.muted(false);
    };

    PrerollManager.prototype.setupForMainContent = function() {
        // Remove the preroll class
        this.player.removeClass('vjs-preroll');
        
        // Hide the preroll counter
        this.prerollCounter.style.display = 'none';

        // Set the source to the main content
        this.player.src({ type: 'video/mp4', src: this.mainContentSrc });

        // Add text tracks
        if (this.mainContentTracks) {
            this.mainContentTracks.forEach(track => {
                this.player.textTracks().addTrack(track);
            });
        }
    };

    PrerollManager.prototype.playNextPreroll = function() {
        if (this.currentPreroll < this.prerolls.length) {
            this.player.src({ type: 'video/mp4', src: this.prerolls[this.currentPreroll] });
            this.player.one('loadedmetadata', () => {
                this.updatePrerollCounter();
                this.player.play();
            });
            this.player.one('ended', () => {
                this.currentPreroll++;
                this.playNextPreroll();
            });
        } else {
            this.setupForMainContent();
            this.player.one('loadedmetadata', () => {
                this.player.play();
            });
        }
    };

    PrerollManager.prototype.start = function(mainContentSrc, mainContentTracks) {
        this.mainContentSrc = mainContentSrc;
        this.mainContentTracks = mainContentTracks;
        this.initPrerolls();
        this.setupForPreroll();
        this.currentPreroll = 0;
        this.playNextPreroll();
    };

    // Register the plugin
    videojs.registerPlugin('prerollManager', function() {
        var player = this;
        var prerollManager = new PrerollManager(player);
        
        // Store the original source and tracks
        var mainContentSrc = player.currentSrc();
        var mainContentTracks = player.textTracks().tracks_.slice();

        // Remove the source and tracks from the player
        player.src('');
        player.textTracks().tracks_.forEach(track => {
            player.textTracks().removeTrack(track);
        });

        // Start preroll manager when player is ready
        player.ready(function() {
            prerollManager.start(mainContentSrc, mainContentTracks);
        });

        player.on('timeupdate', function() {
            if (player.hasClass('vjs-preroll')) {
                prerollManager.updatePrerollCounter();
            }
        });
    });
})(window.videojs);
