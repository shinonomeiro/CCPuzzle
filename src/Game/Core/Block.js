var Block = cc.Node.extend({
	typeId : null,
	sprite : null,

	isMatchable : false,
	blockTouched : [],
	blockScanned : [],
	blockMatched : [],

	ctor : function(typeId) {
		this._super();

		this.typeId = typeId;

		this.init();
	},

	init : function() {
		var frame = cc.spriteFrameCache.getSpriteFrame('block_' + this.typeId + '.png');
		this.sprite = new cc.Sprite(frame);
		this.addChild(this.sprite, 1);

		this.addComponent(new Touchable(
			this.onTouch.bind(this),
			null,
			null
		));
	},

	// Nodes do not have bbox per-se, override needed
	getBoundingBox : function() {
		return this.sprite.getBoundingBox();
	},

	onEnter : function() {
		this._super();
	},

	onTouch : function(touch, e) {
		// Override in subclass
	},

	onScan : function() {
		// Override in subclass
	},

	onMatch : function() {
		// Override in subclass
	},

	onExit : function() {
		this._super();
	}
});

// Factory functions

Block.createColorBlock = function(typeId) {
	return new ColorBlock(typeId);
}

Block.createBombBlock = function(power) {
	return new BombBlock(power);
}

Block.createMaliciousBlock = function() {
	
}

Block.createRainbowBlock = function() {
	
}

Block.createHealBlock = function() {
	
}