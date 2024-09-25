// prerolls.js

(function(videojs) {
    // Configuration
    var prerollPool = [
        'https://example.com/preroll1.mp4',
        'https://example.com/preroll2.mp4',
        'https://example.com/preroll3.mp4',
        'https://example.com/preroll4.mp4',
        'https://example.com/preroll5.mp4'
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
        this.prerollCounter.textContent = `Preroll • ${this.currentPreroll + 1} of ${this.prerolls.length} • ${this.formatTime(totalDuration)}`;
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
