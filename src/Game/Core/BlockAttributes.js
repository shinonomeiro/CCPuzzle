Block.Attributes = {

	LightUp : cc.Node.extend({
		block : null,
		tint : null,
		time : 0.3,
		particles : null,

		ctor : function(block, tint, time, particles) {
			this._super();
			this.setName('LightUp');

			this.block = block;
			this.tint = tint;
			this.time = time;
			this.particles = particles;
		},

		handle : function() {
			var base = this.block.sprite.getColor();

			var act1 = cc.tintTo(this.time, this.tint.r, this.tint.g, this.tint.b);
			var act2 = cc.tintTo(this.time, base.r, base.g, base.b);

			this.block.sprite.runAction(cc.repeatForever(cc.sequence(act1, act2)));
		}
	})
}