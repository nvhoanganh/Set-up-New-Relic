var assert = require('assert');

$browser
	.get('http://newrelictest.australiaeast.cloudapp.azure.com/')
	.then(function () {
		return $browser
			.findElement($driver.By.css('button'))
			.click()
			.then(function () {
				return $browser.getCurrentUrl().then(function (url) {
          console.log(`Current URL is ${url}`);
					assert.equal(
						'http://newrelictest.australiaeast.cloudapp.azure.com/login',
						url,
						'Page not redirected to login'
					);
				});
			});
	});
