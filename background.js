chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('app.html', {
    'bounds': {
      'width': 1020,
      'height': 800
    }
  });
});