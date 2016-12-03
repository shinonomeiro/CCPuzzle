var EnemyBlock = Block.extend({
	counter : 20,
	effects : [],
	label : null,
	active : false,

	ctor : function() {
		this._super(Block.ENEMY_RANGE + 0);

		this.commonAttributes = [ new Block.Attributes.LightUp(this, cc.color(255, 0, 0), 0.3, null) ];

		this.value = 1000;
	},

	onEnter : function() {
		this._super();

		this.label = new cc.LabelTTF(this.counter, 'Arial', 25);
		this.label.setColor(255, 255, 255);
		this.addChild(this.label, 2);
	},

	onScan : function() {
		if (this.active) {
			return;
		}

		this.active = true;
		this.counter--;
		this.label.string = this.counter;

		if (this.counter > 0) {
			this.effects.length = 0;
			this.effects.push(cc.scaleTo(0.2, 1.2, 1.2).easing(cc.easeElasticOut()));
			this.effects.push(cc.scaleTo(0.2, 1, 1).easing(cc.easeElasticOut()));
			this.runAction(cc.sequence(this.effects));

			if (this.counter === 1) {
				this.commonAttributes[0].handle();
			}

		} else {
			this.priority = Date.now();
		}
	},

	onExit : function() {
		this._super();
	}
});