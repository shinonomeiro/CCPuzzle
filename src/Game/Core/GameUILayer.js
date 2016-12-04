var GameUILayer = cc.Layer.extend({
	frame : null,

	comboCount : null,
	collectCount : null,
	fever : null,
	comboListener : null,

	healthBar : null,
	feverBar : null,
	
	playerBlock : null,
	playerBlockListener : null,

	isFeverMode : false,
	feverDuration : 0,

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
		this.score.setPosition(winSize.width / 2, winSize.height - 25);
		this.addChild(this.score, 1);

		this.comboCount = new cc.LabelTTF('Combo: 0', 'Arial', 30);
		this.comboCount.setPosition(winSize.width / 2, winSize.height - 55);
		this.addChild(this.comboCount, 1);

		this.collectCount = new cc.LabelTTF('Collected: 0', 'Arial', 30);
		this.collectCount.setPosition(winSize.width / 2, winSize.height - 85);
		this.addChild(this.collectCount, 1);

		this.healthBar = new ccui.LoadingBar(res.HP_bar_front);
		this.healthBar.setScale9Enabled(true);
		this.healthBar.setCapInsets(cc.rect(1, 1, 62, 5));
		this.healthBar.setContentSize(400, 30);
		this.healthBar.setPosition(winSize.width / 2, winSize.height - 125);
		this.addChild(this.healthBar, 1);

		this.feverBar = new ccui.LoadingBar(res.HP_bar_back);
		this.feverBar.setScale9Enabled(true);
		this.feverBar.setCapInsets(cc.rect(1, 1, 62, 5));
		this.feverBar.setContentSize(400, 30);
		this.feverBar.setPosition(winSize.width / 2, winSize.height - 165);
		this.addChild(this.feverBar, 1);

		this.fever = new cc.LabelTTF('FEVER!!', 'Arial', 100);
		this.fever.setPosition(winSize.width / 2, winSize.height - 165);
		this.fever.setColor(cc.color(255, 0, 0));
		this.addChild(this.fever, 1);

		this.playerBlock = new cc.Sprite('#block_0.png');
		this.playerBlock.setPosition(winSize.width / 2, winSize.height - 265)
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
			eventName : 'fever',
			callback : (e) => {
				var data = e.getUserData();
				this.onFeverMode(data.isOn, data.duration);
			}
		}, this);

		cc.eventManager.addListener({
			event : cc.EventListener.CUSTOM,
			eventName : 'playerBlock',
			callback : this.setPlayerBlock.bind(this)
		}, this);

		// TODO Swallow touches directed at the UI

		// var listener = cc.EventListener.create({
		// 	event: cc.EventListener.TOUCH_ONE_BY_ONE,
		// 	swallowTouches: true,

		// 	onTouchBegan: function(touch, e) {
		// 		return true;
		// 	},
		// 	onTouchMoved: function(touch, e) {
				
		// 	},
		// 	onTouchEnded: function(touch, e) {
				
		// 	}
		// });

		// cc.eventManager.addListener(listener, this);
	},

	onEnter : function() {
		this._super();

		this.feverBar.setPercent(0);
		this.fever.setVisible(false);

		this.scheduleUpdate();
	},

	updateScore : function(e) {
		var data = e.getUserData();
		this.score.string = 'Score: ' + data.score;

		if (!this.isFeverMode) {
			this.feverBar.setPercent(data.feverPoints);
		}
	},

	updateCombo : function(e) {
		var data = e.getUserData();
		this.comboCount.string = 'Combo: ' + data.comboCount;
		this.collectCount.string = 'Collected: ' + data.collectCount;
	},

	onFeverMode : function(isOn, duration) {
		this.isFeverMode = isOn;
		this.feverDuration = duration;

		this.fever.setVisible(isOn);
	},

	setPlayerBlock : function(e) {
		var typeId = e.getUserData();
		var frame = cc.spriteFrameCache.getSpriteFrame('block_' + typeId + '.png');
		this.playerBlock.setSpriteFrame(frame);
	},

	update : function(dt) {
		if (this.isFeverMode) {
			var current = this.feverBar.getPercent();
			current -= this.feverDuration * dt;
			this.feverBar.setPercent(current);
		}
	},

	onExit : function() {
		this._super();
	}
});