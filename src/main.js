cc.game.onStart = function() {
	cc.view.setDesignResolutionSize(480, 854, cc.ResolutionPolicy.SHOW_ALL);
	cc.view.resizeWithBrowserSize(true);

	// Load resources
	cc.LoaderScene.preload(g_resources, function() {
		cc.director.runScene(new GameScene());
	}, this);
};