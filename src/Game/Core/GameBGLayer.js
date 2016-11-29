var GameBGLayer = cc.Layer.extend({
	background : null,

	ctor : function() {
		this._super();

		this.init();
	},

	init : function() {

	},

	onEnter : function() {
		this._super();

		// TODO Set background
	},

	onExit : function() {
		this._super();
	}
});