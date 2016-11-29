var GameLayer = cc.Layer.extend({
	spritesheet : null,
	player : null,
	gridManager : null,

	ctor : function(space) {
		this._super();

		this.init();
	},

	init : function() {
		this.gridManager = new GridManager();
		this.addChild(this.gridManager);

		this.player = new Player();
		this.addChild(this.player);
	},

	onEnter : function() {
		this._super();
	},

	onExit : function() {
		this._super();
	}
});