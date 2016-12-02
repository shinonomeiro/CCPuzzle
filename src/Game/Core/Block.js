var Block = cc.Node.extend({
	typeId : null,
	sprite : null,

	isMatchable : false,
	blockTouched : [],
	blockScanned : [],
	blockMatched : [],

	priority : 0,
	value : 0,

	ctor : function(typeId) {
		this._super();

		this.typeId = typeId;

		this.init();
	},

	init : function() {
		var frame = cc.spriteFrameCache.getSpriteFrame('block_' + this.typeId + '.png');
		this.sprite = new cc.Sprite(frame);
		this.addChild(this.sprite, 1);

		this.cascadeColor = true;
		this.cascadeOpacity = true;

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

	hasTouchComponent : function(name) {
		return this.blockTouched.find(c => c.getName() === name);
	},

	onTouch : function(touch, e) {
		// Override in subclass
	},

	hasScanComponent : function(name) {
		return this.blockScanned.find(c => c.getName() === name);
	},

	onScan : function() {
		// Override in subclass

		// /!\ MUST notify GridManager of completion by sending custom event, e.g.
		/*

		cc.eventManager.dispatchCustomEvent(
			'done',
			sourceBlock : this.block
		);

		*/
	},

	hasMatchComponent : function(name) {
		return this.blockMatched.find(c => c.getName() === name);
	},

	onMatch : function() {
		// Override in subclass
	},

	onExit : function() {
		this._super();
	}
});

// ID ranges

Block.COLOR_RANGE = 0;
Block.ITEM_RANGE = 1000;

// Factory functions

Block.createColorBlock = function(typeId) {
	return new ColorBlock(typeId);
}

Block.createBombBlock = function(power, timer) {
	return new BombBlock(power, timer);
}

Block.createMaliciousBlock = function() {
	
}

Block.createRainbowBlock = function() {
	return new RainbowBlock();
}

Block.createHealBlock = function() {
	
}