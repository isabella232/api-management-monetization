
/**
 * Module dependencies.
 */

//defining the required node modules(pakages)
var express = require('express');
var http = require('http');
var path = require('path');
var request = require('request');

//load route
var invoiceRoute = require('./routes/DataUsage'); 
var app = express();


// all environments
app.set('port', process.env.PORT || 4100);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//Below sections are needed for making POST request to work

//app.use(express.logger('dev'));
//app.use(express.json());
//app.use(express.urlencoded());
//app.use(express.methodOverride());

app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//Below are the roues defined for the application
//From here the incoming request will be routed to appropriate methods in the controller(ie DataUsage.js)

app.get('/', invoiceRoute.default);
app.get('/invoiceApp', invoiceRoute.customers);
app.get('/invoiceApp/customer/:stripeCustomerId', invoiceRoute.customerInvoices);
app.get('/invoiceApp/stripe/createInvoice/:stripeCustomerId/:amount/:description', invoiceRoute.createInvoice);

//Registering the above defined routes to the application
app.use(app.router);


//creating the server for node application
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
