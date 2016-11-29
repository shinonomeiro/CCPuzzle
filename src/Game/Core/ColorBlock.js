var ColorBlock = Block.extend({
	ctor : function(typeId) {
		this._super(typeId);

		this.setName('ColorBlock');
	},

	init : function() {
		this._super();
	},

	onEnter : function() {
		this._super();
	},

	onTouch : function(touch, e) {
		// TODO Play effect
		cc.eventManager.dispatchCustomEvent(
			'swap',
			this.swap.bind(this)
		);
	},

	swap : function(typeId) {
		var frame = cc.spriteFrameCache.getSpriteFrame('block_' + typeId + '.png');
		this.sprite.setSpriteFrame(frame);
		var oldTypeId = this.typeId;
		this.typeId = typeId;

		return oldTypeId;
	},

	onExit : function() {
		this._super();
	}
});

ColorBlock.prototype.isMatchable = true;