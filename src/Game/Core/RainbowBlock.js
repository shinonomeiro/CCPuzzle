var RainbowBlock = Block.extend({
	active : false,
	rainbow : null,
	colorId : 0,
	cycle : null,

	ctor : function() {
		this._super(Block.ITEM_RANGE + 1);

		this.commonAttributes = [ new Block.Attributes.LightUp(this, cc.color(153, 204, 255), 0.3, null) ];

		this.value = 100;
	},

	onEnter : function() {
		this._super();

		this.rainbow = new cc.Sprite('#block_0.png');
		this.addChild(this.rainbow, 0);

		var colors = [];
		var speed = Math.random() + 0.5;
		
		for (var i = 0; i < 5; i++) {
			colors.push(cc.callFunc(this.createCallFunc(i)));
			colors.push(cc.delayTime(speed));
		}

		this.cycle = cc.repeatForever(cc.sequence(colors));
		this.runAction(this.cycle);
	},

	createCallFunc : function(i) {
		return () => {
			var frame = cc.spriteFrameCache.getSpriteFrame('block_' + i + '.png')
			this.rainbow.setSpriteFrame(frame);
			this.colorId = i;
		}
	},

	onTouch : function(touch, e) {
		if (this.active) {
			return;
		}

		this.active = true;
		this.priority = Date.now();
		this.commonAttributes[0].handle();

		this.stopAction(this.cycle);
	},

	onScan : function() {
		if (!this.active) {
			return;
		}
		
		cc.eventManager.dispatchCustomEvent(
			'rainbow',
			{
				sourceBlock : this,
				colorId : this.colorId
			}
		);
	},

	onExit : function() {
		this._super();
	}
});