
/**
 * Module dependencies.
 */

//defining the required node modules(pakages)
var express = require('express');
var http = require('http');
var path = require('path');
var request = require('request');

//load routes
var homeRoute = require('./routes/homeRoute'); 
var meteredRoute = require('./routes/meteredSubscriptionRoute');
var monthlyRoute = require('./routes/monthlySubscriptionRoute');

var app = express();


// all environments
app.set('port', process.env.PORT || 4100);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//Below sections are needed for making POST request to work

app.use(express.json());
app.use(express.urlencoded());
//app.use(express.methodOverride());

app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//Below are the roues defined for the application
//From here the incoming request will be routed to appropriate methods in the controller

//Home page routing 
app.get('/', homeRoute.default);

//metered subscription routes mapping
app.get('/invoiceApp/metered', meteredRoute.customers);
app.get('/invoiceApp/metered/customer/:stripeCustomerId', meteredRoute.customerInvoices);
app.get('/invoiceApp/metered/stripe/createInvoice/:stripeCustomerId/:amount/:description', meteredRoute.createInvoice);


//monthly subscription routes mapping
app.get('/invoiceApp/monthly', monthlyRoute.customers);
app.get('/invoiceApp/monthly/customer/:stripeCustomerId', monthlyRoute.customerSubscription);
//app.post('/invoiceApp/stripe/createPlan', invoiceRoute.createPlan);
app.get('/invoiceApp/monthly/stripe/cancelSubscription/:stripeCustomerId/:subscriptionId', monthlyRoute.cancelSubscription);
app.get('/invoiceApp/monthly/stripe/createSubscription/:stripeCustomerId', monthlyRoute.createSubscription);


//Registering the above defined routes to the application
app.use(app.router);


//creating the server for node application
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
