var Block = cc.Node.extend({
	typeId : null,
	sprite : null,

	isMatchable : false,

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

	onEnter : function() {
		this._super();
	},

	onTouch : function(touch, e) {
		// Override
	},

	// Nodes do not have bbox per-se, override needed
	getBoundingBox : function() {
		return this.sprite.getBoundingBox();
	},

	onExit : function() {
		this._super();
	}
});

// Factory functions

Block.createColorBlock = function() {

}

Block.createBombBlock = function() {
	
}

Block.createMaliciousBlock = function() {
	
}

Block.createRainbowBlock = function() {
	
}

Block.createHealBlock = function() {
	
}