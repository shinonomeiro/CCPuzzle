var GameUILayer = cc.Layer.extend({
	frame : null,

	comboCount : null,
	collectCount : null,
	comboListener : null,
	
	playerBlock : null,
	playerBlockListener : null,

	ctor : function() {
		this._super();

		this.init();
	},

	init : function() {
		var winSize = cc.director.getWinSize();

		this.frame = new cc.Sprite(res.frame);
		this.frame.setPosition(winSize.width / 2, winSize.height / 2);
		this.addChild(this.frame);

		this.comboCount = new cc.LabelTTF('Combo: 0', 'Arial', 30);
		this.comboCount.setPosition(winSize.width / 2, winSize.height - 50);
		this.addChild(this.comboCount, 1);

		this.collectCount = new cc.LabelTTF('Collected: 0', 'Arial', 30);
		this.collectCount.setPosition(winSize.width / 2, winSize.height - 100);
		this.addChild(this.collectCount, 1);

		this.playerBlock = new cc.Sprite('#block_0.png');
		this.playerBlock.setPosition(winSize.width / 2, winSize.height - 200)
		this.playerBlock.setScale(1.4, 1.4);
		this.addChild(this.playerBlock);

		cc.eventManager.addListener({
			event : cc.EventListener.CUSTOM,
			eventName : 'combo',
			callback : this.updateCombo.bind(this)
		}, this);

		cc.eventManager.addListener({
			event : cc.EventListener.CUSTOM,
			eventName : 'playerBlock',
			callback : this.setPlayerBlock.bind(this)
		}, this);
	},

	onEnter : function() {
		this._super();
	},

	updateCombo : function(e) {
		var data = e.getUserData();
		this.comboCount.string = 'Combo: ' + data.comboCount;
		this.collectCount.string = 'Collected: ' + data.collectCount;
	},

	setPlayerBlock : function(e) {
		var typeId = e.getUserData();
		var frame = cc.spriteFrameCache.getSpriteFrame('block_' + typeId + '.png');
		this.playerBlock.setSpriteFrame(frame);
	},

	onExit : function() {
		this._super();
	}
});