var ColorBlock = Block.extend({
	noSwap : false,

	ctor : function(typeId) {
		this._super(Block.COLOR_RANGE + typeId);

		this.isMatchable = true;

		this.value = 50;
	},

	onEnter : function() {
		this._super();
	},

	onTouch : function(touch, e) {
		if (this.noSwap) {
			return;
		}

		cc.eventManager.dispatchCustomEvent(
			'swap',
			this.swapHandler.bind(this)
		);
	},

	swapHandler : function(typeId) {
		var frame = cc.spriteFrameCache.getSpriteFrame('block_' + typeId + '.png');
		this.sprite.setSpriteFrame(frame);
		var oldTypeId = this.typeId;
		this.typeId = typeId;

		return oldTypeId;
	},

	onMatch : function(effects) {
		this.noSwap = true;

		this._super(effects);
	},

	onExit : function() {
		this._super();

		this.noSwap = false;
		colorBlockPool.returnBlock(this);
	}
});

var arrrrr = [];

// Pool

function ColorBlockPool() {
	this.pool = [];
}

ColorBlockPool.prototype.getBlock = function(typeId) {
	if (this.pool.length > 0) {
		var block = this.pool.shift();
		block.typeId = typeId;
		return block;

	} else {
		return new ColorBlock(typeId);
	}
}

ColorBlockPool.prototype.returnBlock = function(block) {
	this.pool.push(block);
}