// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
  var manager = new GameManager(4, KeyboardInputManager, HTMLActuator);
  var minPixel = Math.min(window.innerHeight, window.innerWidth);
	var container = document.getElementById('2048container');
	container.style.width = minPixel + 'px';
	container.style.height = minPixel + 'px';
});

