var BombBlock = Block.extend({
	power : 1,
	timer : 2,
	active : false,

	ctor : function(power, timer) {
		this._super(100);

		this.power = power;
		this.timer = timer;

		this.blockTouched = [
			new Block.Attributes.LightUp(this, cc.color(255, 0, 0), 0.3, null),
			new Block.Attributes.Explode(this, this.power, this.timer)
		];
	},

	onEnter : function() {
		this._super();
	},

	onTouch : function(touch, e) {
		if (this.active) {
			return;
		}

		this.active = true;

		var act1 = cc.callFunc(this.blockTouched[0].handle, this.blockTouched[0]);
		var act2 = cc.delayTime(this.timer);
		var act3 = cc.callFunc(this.blockTouched[1].handle, this.blockTouched[1]);
		
		this.runAction(cc.sequence(act1, act2, act3));
	},

	onScan : function() {
		
	},

	onMatch : function() {
		
	},

	onExit : function() {
		this._super();
	}
});