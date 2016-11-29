var GameScene = cc.Scene.extend({
	onEnter : function() {
		this._super();

		cc.spriteFrameCache.addSpriteFrames(res.tiles_plist);
		this.spritesheet = new cc.SpriteBatchNode(res.tiles_sheet);
		this.addChild(this.spritesheet);

		// UI
		this.addChild(new GameBGLayer(), GameScene.LayerTags.GameBGLayer, GameScene.LayerTags.GameBGLayer);
		this.addChild(new GameUILayer(), GameScene.LayerTags.GameUILayer, GameScene.LayerTags.GameUILayer);

		// Core -- Load last because UI is dependent on GameLayer's events
		this.addChild(new GameLayer(), GameScene.LayerTags.GameLayer, GameScene.LayerTags.GameLayer);
	},

	onExit : function() {
		this._super();
	}
});

GameScene.LayerTags = {
	GameBGLayer : 1,
	GameLayer : 2,
	GameUILayer : 3
};