var GameLayer = cc.Layer.extend({
	spritesheet : null,
	player : null,
	gridManager : null,

	comboCount : -1,
	collectCount : 0,
	score : 0,
	maxCombo : 0,

	isFeverMode : false,
	feverDuration : 10,
	feverTimer : 0,

	ctor : function(space) {
		this._super();

		this.init();
	},

	init : function() {
		this.gridManager = new GridManager();
		this.addChild(this.gridManager);

		this.player = new Player();
		this.addChild(this.player);

		this.feverTimer = this.feverDuration;

		this.scheduleUpdate();
	},

	addCombo : function(collected) {
		this.comboCount++;
		this.collectCount += collected.length;
		this.score += this.comboCount * 100;
		collected.forEach(block => this.score += block.value);

		if (this.comboCount > this.maxCombo) {
			this.maxCombo = this.comboCount;
		}

		cc.eventManager.dispatchCustomEvent(
			'score',
			{
				score : this.score,
				feverPoints : this.feverPoints
			}
		);

		if (this.comboCount > 0) {
			cc.eventManager.dispatchCustomEvent(
				'combo',
				{ 
					comboCount : this.comboCount,
					collectCount : this.collectCount,
				}
			);
		}

		if (!this.isFeverMode) {
			this.feverPoints += this.comboCount + collected.length;

			if (this.feverPoints >= 100) {
				this.isFeverMode = true;

				cc.eventManager.dispatchCustomEvent(
					'fever',
					{
						isOn : true,
						duration : this.feverDuration
					}
				);
			}
		}
	},

	resetCombo : function() {
		this.comboCount = -1;
		this.collectCount = 0;
	},

	onEnter : function() {
		this._super();
	},

	update : function(dt) {
		if (this.isFeverMode) {
			this.feverTimer -= dt;

			if (this.feverTimer < 0) {

				this.isFeverMode = false;
				this.feverPoints = 0;
				this.feverTimer = 10;

				cc.eventManager.dispatchCustomEvent(
					'fever',
					{
						isOn : false,
						duration : this.feverDuration
					}
				);
			}
		}
	},

	onExit : function() {
		this._super();
	}
});