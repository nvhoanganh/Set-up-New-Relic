/**
 * Feel free to explore, or check out the full documentation
 * https://docs.newrelic.com/docs/synthetics/new-relic-synthetics/scripting-monitors/writing-api-tests
 * for details.
 */

 var assert = require('assert');

 $http.get('http://newrelictest.australiaeast.cloudapp.azure.com:8080/api/products/?page=1',
   // Callback
   function (err, response, body) {
     assert.equal(response.statusCode, 200, 'Expected a 200 OK response');
     assert.equal(body.length > 1, true, 'Expected to have more than 1');
   }
 );