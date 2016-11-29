var BombBlock = Block.extend({
	power : 1,

	ctor : function() {
		this._super(100);

		this.setName('BombBlock');
	},

	init : function() {
		this._super();
	},

	onEnter : function() {
		this._super();
	},

	onTouch : function(touch, e) {
		// TODO Light up + smoke
		var base = cc.tintTo(0.3, 255, 255, 255);
		var red = cc.tintTo(0.3, 255, 0, 0);

		this.sprite.runAction(cc.repeatForever(cc.sequence(red, base)));
	},

	onExit : function() {
		this._super();
	}
});

BombBlock.prototype.isMatchable = false;