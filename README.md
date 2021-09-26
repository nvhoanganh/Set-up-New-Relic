# Step 1: Setup environment
- create new linux VM on Azure 
- enable DNS: newrelictest.australiaeast.cloudapp.azure.com
- enable port 80 and port 8080
- connected via SSH `ssh USERNAME@newrelictest.australiaeast.cloudapp.azure.com` ✅

# Step 2: Create New Relic One Account
![](2021-09-24-22-55-48.png)

# Setup 3: stand-up a web application
- install nodejs, Postgres, Nginx, pm2
- deploy simle Ecommerce app (nodeJS + React): https://github.com/dhatGuy/PERN-Store
- start backend using `pm2` by running `pm2 start index.js` (inside the `server` folder)
![](2021-09-25-15-37-50.png)
- backend can be accessed via `http://newrelictest.australiaeast.cloudapp.azure.com:8080/api/products` ✅
- build frontend and copy to `/var/pernstore` folder 
- update `/etc/nginx/sites-enabled/default` file and set root to point to `/var/pernstore`
- ui can be accessed via `http://newrelictest.australiaeast.cloudapp.azure.com` ✅
![](2021-09-25-15-38-43.png)

# Setup 4: Install New Relic Agents

## Install APM NodeJs Language Agent
- APM language agent => hook directly to the runtime of the backend code (in our case, it is ExpressJS backend API) and enable end to end transaction tracing (ExpressJS REST api route => Repository => Postgres)
- install NodeJS APM Language Agent
![](2021-09-24-23-15-10.png)
![](2021-09-24-23-16-37.png)
- using provided instructions not working ❌
![](2021-09-24-23-47-54.png)
- manual installation worked ✅
![](2021-09-25-00-25-38.png)

## Install Postgres Infrastructure Agent
![](2021-09-25-10-08-58.png)
![](2021-09-25-15-41-20.png)
![](2021-09-25-15-43-18.png)

## Install NgInx Infrastructure Agent
- see data on connection and client requests
- not working ❌
![](2021-09-25-00-37-41.png)

## Install Browser Agent
![](2021-09-25-16-34-46.png)

### Question: What are the main differences between the various agents and integrations?
- APM language agent allows developers to drill down to the code level. 
![](2021-09-25-15-48-11.png)
![](2021-09-25-15-48-25.png)
- Depending on language type, you either have to add couple of line of codes (e.g. nodejs) or you don't have to (e.g. .NET)
- With New Relic Infrastructure Agent, we can collect stats from all external infrastructure services our app relies on, such as Database, Apache, Queue, External services (S3) and create a dashboard like this
![](2021-09-25-15-59-27.png)

###  Question: Is there any difference between the value provided by each agent? How would you quantify it? How would apply a value weight in % and how would you distribute it across the types of agents (% adding up to 100)? [Ex. 25% Application, 25% Infra, etc... = 100%]
- it depends on use cases, for a SaaS company which uses Cloud Native services (e.g. deploy using Azure App Service + Azure SQL or CosmosDB), they will want to spend more effort on Application and Browser Metrics. On the other side of the scale, if you maintain legacy applications that run on Virtual machines on your own data center, then the focus might be a lot more on the Infrastructure. 

###  Question: Most cloud providers give you access to cloud metrics already. Why would you bring the same data into New Relic?
- Unless your application is Greenfield and Cloud Native (using 100% all PaaS from Azure or AWS), without a single source of truth like NewRelic, it will be very hard to have a consistent interface where user can view/query all data related to your applicaiton

###  Question: For each of the above types of agents, list 3 of the top metrics that you think are the most valuable and to whom.
- Application: Apdex Score, Throughput, Error Rate
- Infrastructure: Memory Usage, CPU Utilization, GC
- Browser: first contentful paint, time to interactive, javascript errors

# Step 5: Apply Load to the Application
## add Simple Browser
- working ✅
![](2021-09-25-16-56-17.png)

## add Scripted API test
- working ✅
![](2021-09-25-16-53-38.png)
```javascript
 var assert = require('assert');
 $http.get('http://newrelictest.australiaeast.cloudapp.azure.com:8080/api/products/?page=1',
   // Callback
   function (err, response, body) {
     assert.equal(response.statusCode, 200, 'Expected a 200 OK response');
     assert.equal(body.length > 1, true, 'Expected to have more than 1');
   }
 );
```

## add Scripted Browser
- working ✅
![](2021-09-25-17-12-37.png)
```javascript
 var assert = require('assert');

$browser
	.get('http://newrelictest.australiaeast.cloudapp.azure.com/')
	.then(function () {
		return $browser
			.findElement($driver.By.css('button'))
			.click()
			.then(function () {
				return $browser.getCurrentUrl().then(function (url) {
					assert.equal(
						'http://newrelictest.australiaeast.cloudapp.azure.com/login',
						url,
						'Page not redirected to login'
					);
				});
			});
	});
```

### Question: What is the difference between Real User Monitoring (e.g. New Relic’s Browser agent) and a Synthetic check?
- Real User Monitor is done by injecting a Javascript into application, this JS send real user stats (e.g. first contentful paint, javascript errors) back to New Relic via Ajax calls.
- Synthetic check is used to ensure application up time, this can be done by sending fake API calls (using Scripted API) or use browser automation to perform some important user interaction with the web application (using Scripted Browser for SPA apps for example)

### Question: What are the benefits of Real User Monitoring over Synthetics and vice versa?
- Real User Monitoring:
  - how responsive is the app (intial load time)
  - is there any unhandled Javascript errors 
  - which devices users accessing the web app from (chrome/mobile...)
- Synthetics:
  - alert when system goes down (e.g. after deploy)
  - measure SLA 
  - keep systems warn before real user login (e.g for serverless apps)

### Question: If we were to run the exact same test pattern as a Real User and then as a Synthetic Script, would there be any difference between the two executions as observed within the New Relic Platform?
- from the networking point of view, there should be no difference between real user and Synthetic script requests, however when New Relic send the request, it added `x-newrelic-synthetics` header which it is used to identify which requests are from real user and which are not.
![](2021-09-26-12-31-26.png)

# Telemetry Data Platform
### Question: What is the difference between a Metric and an Event?
- both metrics and events are time series data, metrics are sampled at regular intervals (e.g. Avg memory usage of a vm), events are irregular and unpredictable (e.g. backend exceptions, user visits)

# Step 6: Import Logs
- logs for pm2 are stored at `~/.pm2/logs`
- added logs for Pern store (both error and normal) ✅
![](2021-09-26-12-00-09.png)
![](2021-09-26-12-01-44.png)

### Question: What’s the value of bringing logs into the New Relic One platform?
- Most common usecase is troubleshooting some exceptions in prod. With logs available in the same interface, user can see exactly what went wrong (using Stacktrace)
![](2021-09-26-12-08-49.png)

### Question: What additional information could you obtain from Logs that you couldn’t obtain using the other sources of data?
- App logs are written by developers and contains valuable context information which cannot be captured by other automated ways. For example, if we get 403 Forbidden from the backend API, APM language agent will not be able to tell the reason why user get 403 Forbidden, but if developers log the reason why in the log file then we can see this in New Relic.
- Another example is the information captured by Infrastucture agents like URL parameters (products/id) or JWT token is not as useful compared to the real product name (backend query database) and user role (from JWT token) which can be logged and captured by New Relic

### Question: Do you see an opportunity to build applications without the need to use logs? How would you approach the problem without losing visibility?
- Do you see an opportunity to build applications without the need to use logs ⭐️
- If we don't have applications logs


# Step 7:Import Traces
- Distributed Trace enabled and working ✅
![](2021-09-26-12-38-06.png)

### Question: In your words, what is Distributed Tracing and what kinds of customers or users would find it useful?
- Distributed trace allows user to see what happens to each request, how much time it is spending in each component (e.g. API/Services, database, external Services)
- Distributed Trace is useful for all customers, even when they have 3 tiers architecture, they can see if they have issues with their database or API. However, DT is very useful when customers have complex architecture (e.g. microservices with lots of synchronous HTTP calls), with DT they can immediately pin point which service is having trouble keeping up.

### Question: What a span is and why it’s important to track them? 
- Span is time spent in each service or service function. For example from NodeJS API to Postgres is a cross-process span. Each NodeJs middleware function is a in-process span
- you can immediately tell which service is the bottleneck and then drill down to the function that took most of the time

### Question: Which span events can you see?
![](2021-09-26-13-03-29.png)
- from the above, we can see 3 events: 
	- POST request sent to /api/cart/add (which has 19 in-process spans)
	- CREATE command sent to postgres
	- SELECT command sent to postgres

### Question: What about in-process spans?
- Expanding the first span, we can see all the middleware and functions that were executed in NodeJS
![](2021-09-26-13-05-15.png)

### Question: Do you see any Database calls inside a trace?
- Is the SQL in a raw format or obfuscated? Explain which state it is in and why this important? 
	- SQL is in obfuscated format
	- it looks like it is only showing the table name and operation name (e.g. insert/select)
- Can you change what SQL metrics we capture?
	- by configuring postgresql-config.yml file you can [here](https://docs.newrelic.com/docs/integrations/host-integrations/host-integrations-list/postgresql-monitoring-integration/#config)
- Try changing the configuration of the SQL we capture so we can get more meaningful metrics. Take a look here ⭐️

# Step 8: Query Everything
![](2021-09-26-22-53-47.png)
![](2021-09-26-22-54-19.png)

### Question: There is no limit to the number and type of data that can be imported into New Relic One Platform. Can you think of any non-technical metrics that we could bring into our platform? Who would benefit from having a dashboard with these metrics?
- add Devops metrics such as number of deployments done in the last 1 months, number of bugs fixed, number of commits. Have this information correlate with application performance and errors count etc. This dashboard can be useful for both developers and product manager to measure success/impact of each software releases
- add Google Analytics style metrics such as Avg session duration, avg pages per session, conversion rate. Create a dashboard showing improvements in application performance correlates to better customer engagement (stayed on the app longer, visit more pages, etc.)  

# Step 9: Tell us what you see

### Question: Summarise the value of the APM view. Who would be most interested in this view? 
- APM view provides high level overview of current Application health status. The team who are responsible for the application uptime (could be Support team, Devops or developer) are most interested in this view.
![](2021-09-26-23-17-35.png)

### Question: What are some common issues that New Relic can help identify within this view? 
- Slow requests 
- Application exceptions
- Host CPU and Memory utilization
- Memory leaks

### Question: Find the slowest transaction. Why is it slow?
- slowest transaction is /api/products because it returns the most data from Postgres DB (took 25% of the total time)
![](2021-09-26-23-22-59.png)
![](2021-09-26-23-24-48.png)
![](2021-09-26-23-25-53.png)

### Question: Are there any errors? What are they telling us?
- Yes, there are errors. However, these errors are "expected" errors (e.g. when JWT expired). if we have unexpected errors then we need to triage and fix them in the next release
![](2021-09-26-23-28-45.png)
![](2021-09-26-23-28-19.png)

# Step 10: Set up Applied Intelligence

### Assignment: Navigate to the New Relic One “Alerts & AI” Interface. Familiarize yourself with the various screens. Create an Alert Policy and an Alert Condition targeting your application.
![](2021-09-26-23-53-52.png)
![](2021-09-26-23-38-05.png)

### Question: Explain the Alert creation process and why you chose the one you did.
- To create an alert, you need to create an NRQL which returns some metrics, then you configure a threshold value which will trigger a critical or warning events. I created a simple alert which is based on Memory usage of the host machine, if it is > 10% then it is warning, if it is > 50% then it is critical


### Question: Now that you have created your Alert Condition, can you describe how Incident Intelligence can help?
- Incident Intelligence allows us to configure when/who/how (Destinations) to notify when an incident happens (Sources). For example, when Memory usage is high then email Sys Admin, when Service A is down, send sms to another user. Incident intelligence will also try to group similar incidents together and reduce noise

### Question: What is the difference between Incident Intelligence and Proactive Detection
- Incident Intelligence reports issues based on alerts previously created by users. Proactive Detection is turned on by default which uses machine learning and report anomalies from monitored applications.

### Question: Explain in your own words how it works
- Proactive Detection uses machine learning to automatically surface anomalies with monitored applications.

### Question: It seems like this makes the SRE role irrelevant, consider if you would agree or disagree
- I disagree, with this, it would make it easier for SRE not making it irrelevant. 