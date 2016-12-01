var BombBlock = Block.extend({
	power : 1,
	timer : 2,

	active : false,

	ctor : function(power, timer) {
		this._super(100);

		this.power = power;
		this.timer = timer;
		this.blockTouched = [ new Block.Attributes.LightUp(this, cc.color(255, 0, 0), 0.3, null) ];
		this.blockScanned = [ new Block.Attributes.Explode(this, this.power) ];
	},

	onEnter : function() {
		this._super();
	},

	onTouch : function(touch, e) {
		if (this.active) {
			return;
		}

		this.active = true;
		this.priority = Date.now();
		this.blockTouched[0].handle();
	},

	onScan : function() {
		if (!this.active) {
			return;
		}
		
		this.blockScanned[0].handle();
	},

	onExit : function() {
		this._super();
	}
});