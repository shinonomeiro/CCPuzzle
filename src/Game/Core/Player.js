var Player = cc.Node.extend({
	HP : 100,
	fever : 0,
	blockColor : 2,

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

		this.blockHasChanged();
	},

	onEnter : function() {
		this._super();
	},

	handleSwap : function(e) {
		var swap = e.getUserData();
		this.blockColor = swap(this.blockColor);
		this.blockHasChanged();
	},

	blockHasChanged : function() {
		cc.eventManager.dispatchCustomEvent(
			'playerBlock',
			this.blockColor
		);
	},

	onExit : function() {
		this._super();
	}
});