var Player = cc.Node.extend({
	playerBlockColor : 2,

	ctor : function() {
		this._super();

		this.init();
	},

	init : function() {
		cc.eventManager.addListener({
			event : cc.EventListener.CUSTOM,
			eventName : 'swap',
			callback : this.handleSwap.bind(this)
		}, this);

		this.playerBlockHasChanged();
	},

	onEnter : function() {
		this._super();
	},

	handleSwap : function(e) {
		var swap = e.getUserData();
		this.playerBlockColor = swap(this.playerBlockColor);
		this.playerBlockHasChanged();
	},

	playerBlockHasChanged : function() {
		cc.eventManager.dispatchCustomEvent(
			'playerBlock',
			this.playerBlockColor
		);
	},

	onExit : function() {
		this._super();
	}
});