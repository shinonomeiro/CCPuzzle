var HealBlock = Block.extend({
	active : false,

	ctor : function() {
		this._super(Block.ITEM_RANGE + 2);

		this.commonAttributes = [ new Block.Attributes.LightUp(this, cc.color(0, 255, 0), 0.3, null) ];

		this.value = 100;
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
		this.commonAttributes[0].handle();
	},

	onScan : function() {
		if (!this.active) {
			return;
		}

		cc.eventManager.dispatchCustomEvent(
			'heal',
			this
		);
	},

	onExit : function() {
		this._super();
	}
});