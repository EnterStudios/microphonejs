// this package should handle Microphone access to Users Mic.

Microphone = function(options) {

    this.processAudioData = options.processAudioData;

    this.noSourceEvent = flow.events.create("noSource");

    this.sourceNode;
    this.audioResource;
    this.webAudioNode;

    this.load(options);

};


// Control Interface
_.extend(Microphone.prototype, {
    load: function(options) {
        var self = this;
        var audioCtx = options.audioContext;
        var onSuccess = options.onSuccess;
        var onReject = options.onReject;

        /*
         * create webAudioNode which executes processAudioData
         */
        self.webAudioNode = audioCtx.createScriptProcessor(1024, 1, 1);
        self.webAudioNode.onaudioprocess = function(e) {

            var nodeInput = e.inputBuffer.getChannelData(0);
            var nodeOutput = e.outputBuffer.getChannelData(0);

            //execute processAudioData function (just for the first (left) channel right now)
            if (self.processAudioData){
                self.processAudioData(nodeInput);
            }
            
            //set node output
            nodeOutput.set(nodeInput);
        }

        /*
         * check for getUserMedia or flash
         */
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

        if (navigator.getUserMedia) {
            //create HTML5 getUserMedia Microphone Input
            this.audioResource = new HTML5Audio(onSuccess, onReject, audioCtx, self);

        } else {
            if (this.thisBrowserHasFlash()) {

                //create Flash Microphone Input
                this.audioResource = new FlashAudio(onSuccess, onReject, audioCtx, self);

            } else {
                // this.noSourceHandler();
                self.noSourceEvent.data = {
                    message: "no getUserMedia and no Flash installed"
                };
                flow.events.dispatchEvent(self.noSourceEvent);
            }
        }
    },

    thisBrowserHasFlash: function() {
        if ((typeof swfobject !== 'undefined') && (swfobject.hasFlashPlayerVersion('10.0.0'))) {
            // console.log("swfobject is available, your major version is " + swfobject.getFlashPlayerVersion().major);
            return true;
        } else {
            return false;
        }
    },

    status: function() {
        // wraps audioresource status
        // actual microphone status - should be reactive 
        // unloaded - loading - ready - error - noSound
        return this.audioResource.getStatus();

    },

    stop: function() {
        // stops microphone input entirely
        this.audioResource.disable();
    },

    pause: function() {
        // pauses microphone input for a moment
        // maybe not possible
    }
})