// prerolls.js

(function(videojs) {
    // Configuration
    var prerollPool = [
        'https://www.dl.dropboxusercontent.com/scl/fi/igc5hox15osy9u3txo9jg/ads1.mp4?rlkey=tbk0m2toeb1gkptti51jz94if&raw=1',
        'https://www.dl.dropboxusercontent.com/scl/fi/bgzm8l8v0jl1fa19kopzt/ads2.mp4?rlkey=iy95wywcmojac8k8xowf3y5ln&raw=1',
        'https://www.dl.dropboxusercontent.com/scl/fi/k6zwiytq6nhc4v43wlk87/ads3.mp4?rlkey=tyds1mc9v06attkiwv2t5dapp&raw=1',
        'https://www.dl.dropboxusercontent.com/scl/fi/sfixiszh59j7hp7gw3sta/ads4.mp4?rlkey=g8xq168pa3pfpmxqlvmqo22tm&raw=1',
        'https://www.dl.dropboxusercontent.com/scl/fi/rne20mz9xpjnmd6a103zf/ads5.mp4?rlkey=l4lpjce6bpg7vtrnrc9qwn8fd&raw=1'
        // Add more preroll URLs as needed
    ];

    var PrerollManager = function(player) {
        this.player = player;
        this.prerolls = [];
        this.currentPreroll = 0;
        this.prerollCounter = document.createElement('div');
        this.prerollCounter.className = 'preroll-counter';
        this.player.el().appendChild(this.prerollCounter);
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
        var totalDuration = this.prerolls.slice(this.currentPreroll).reduce((acc, src) => acc + this.player.duration(), 0);
        this.prerollCounter.textContent = `Quảng cáo • ${this.currentPreroll + 1} of ${this.prerolls.length} • ${this.formatTime(totalDuration)}`;
    };

    PrerollManager.prototype.playNextPreroll = function() {
        if (this.currentPreroll < this.prerolls.length) {
            this.player.src(this.prerolls[this.currentPreroll]);
            this.player.addClass('vjs-preroll');
            this.prerollCounter.style.display = 'block';
            this.player.one('loadedmetadata', () => {
                this.updatePrerollCounter();
                this.player.play();
            });
            this.player.one('ended', () => this.playNextPreroll());
            this.currentPreroll++;
        } else {
            this.player.removeClass('vjs-preroll');
            this.prerollCounter.style.display = 'none';
            this.player.src(this.mainContentSrc);
            this.player.play();
        }
    };

    PrerollManager.prototype.start = function() {
        this.mainContentSrc = this.player.src();
        this.initPrerolls();
        this.playNextPreroll();
    };

    // Register the plugin
    videojs.registerPlugin('prerollManager', function() {
        var prerollManager = new PrerollManager(this);
        
        this.on('loadedmetadata', function() {
            if (prerollManager.currentPreroll === 0) {
                prerollManager.start();
            }
        });

        this.on('timeupdate', function() {
            if (this.hasClass('vjs-preroll')) {
                prerollManager.updatePrerollCounter();
            }
        });
    });
})(window.videojs);
