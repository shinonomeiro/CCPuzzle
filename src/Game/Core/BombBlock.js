var BombBlock = Block.extend({
	power : 1,

	ctor : function(power) {
		this._super(100);

		this.power = power;
		this.blockTouched = [ new Block.Attributes.LightUp(this, cc.color(255, 0, 0), 0.3, null) ];
	},

	onEnter : function() {
		this._super();
	},

	onTouch : function(touch, e) {
		this.blockTouched[0].handle();
	},

	onScan : function() {
		
	},

	onMatch : function() {
		
	},

	onExit : function() {
		this._super();
	}
});