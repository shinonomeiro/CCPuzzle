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

		this.score = new cc.LabelTTF('Score: 0', 'Arial', 30);
		this.score.setPosition(winSize.width / 2, winSize.height - 50);
		this.addChild(this.score, 1);

		this.comboCount = new cc.LabelTTF('Combo: 0', 'Arial', 30);
		this.comboCount.setPosition(winSize.width / 2, winSize.height - 100);
		this.addChild(this.comboCount, 1);

		this.collectCount = new cc.LabelTTF('Collected: 0', 'Arial', 30);
		this.collectCount.setPosition(winSize.width / 2, winSize.height - 150);
		this.addChild(this.collectCount, 1);

		this.playerBlock = new cc.Sprite('#block_0.png');
		this.playerBlock.setPosition(winSize.width / 2, winSize.height - 250)
		this.playerBlock.setScale(1.4, 1.4);
		this.addChild(this.playerBlock);

		// EVENT LISTENERS

		cc.eventManager.addListener({
			event : cc.EventListener.CUSTOM,
			eventName : 'score',
			callback : this.updateScore.bind(this)
		}, this);

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

	updateScore : function(e) {
		var score = e.getUserData();
		this.score.string = 'Score: ' + score;
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