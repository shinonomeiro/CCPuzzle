var Block = cc.Node.extend({
	typeId : null,
	sprite : null,

	touchComponent : null,
	touchListener : null,

	isMatchable : false,
	canExplode : false,
	commonAttributes : [],

	priority : 0,
	value : 0,

	ctor : function(typeId) {
		this._super();

		this.typeId = typeId;

		this.init();
	},

	init : function() {
		this._super();

		this.sprite = new cc.Sprite();
		this.addChild(this.sprite, 1);

		this.cascadeColor = true;
		this.cascadeOpacity = true;

		var self = this;

		this.touchListener = cc.EventListener.create({
			event: cc.EventListener.TOUCH_ONE_BY_ONE,
			swallowTouches: true,

			onTouchBegan: function(touch, e) {
				var p = self.convertTouchToNodeSpace(touch);
				var bbox = self.getBoundingBox();

				if (cc.rectContainsPoint(bbox, p)) {
					self.onTouch(touch, e);
		  
					// Swallow
					return true;
				};

				// Passthru
				return false;
			}
		});
	},

	// Nodes do not have bbox per-se, override needed
	getBoundingBox : function() {
		return this.sprite.getBoundingBox();
	},

	onEnter : function() {
		this._super();

		var frame = cc.spriteFrameCache.getSpriteFrame('block_' + this.typeId + '.png');
		this.sprite.setSpriteFrame(frame);

		// Needed for pooling because listener is
		// automatically removed from event manager upon onExit
		cc.eventManager.addListener(this.touchListener, this);
	},

	onTouch : function(touch, e) {
		// Override in subclass
	},

	onScan : function() {
		// Override in subclass
	},

	onMatch : function(effects) {
		effects.push(cc.scaleTo(0.3, 0.1, 0.1));

		return effects;
	},

	onExit : function() {
		this._super();

		// Reset state
		this.setRotation(0);
		this.setScale(1, 1);
		this.setColor(cc.color(255, 255, 255));
		this.setOpacity(255);
	}
});

// ID ranges

Block.COLOR_RANGE = 0;
Block.ITEM_RANGE = 10000;
Block.ENEMY_RANGE = 11000;

Block.isColor = function(value) {
	return value >= Block.COLOR_RANGE && value < Block.ITEM_RANGE;
}

Block.isItem = function(value) {
	return value >= Block.ITEM_RANGE && value < Block.ENEMY_RANGE;
}

Block.isEnemy = function(value) {
	return value >= Block.ENEMY_RANGE && value < 12000; // TEMP
}

// Pools

var colorBlockPool = new ColorBlockPool();

// Factory functions

Block.createColorBlock = function(typeId) {
	return colorBlockPool.getBlock(typeId);
}

Block.createBombBlock = function() {
	return new BombBlock();
}

Block.createRainbowBlock = function() {
	return new RainbowBlock();
}

Block.createHealBlock = function() {
	return new HealBlock();
}

Block.createEnemyBlock = function() {
	return new EnemyBlock();
}