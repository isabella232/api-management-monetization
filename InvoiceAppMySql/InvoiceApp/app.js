
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var request = require('request');

//load route
var invoiceRoute = require('./routes/DataUsage'); 
var app = express();

var connection  = require('express-myconnection'); 
var mysql = require('mysql');

// all environments
app.set('port', process.env.PORT || 4100);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//app.use(express.favicon());
//app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
//app.use(express.methodOverride());

app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

/*------------------------------------------
    connection peer, register as middleware
    type koneksi : single,pool and request 
-------------------------------------------*/

/*app.use(
    
    connection(mysql,{
        
        host: 'localhost',
        user: 'root',
        password : 'rootpassword',
        port : 3306, //port mysql
        database:'db1cb3c708c4124b64a2aaa412011a8d43'

    },'pool') //or single

);*/

app.use(
    
    connection(mysql,{
        
        host: '1cb3c708-c412-4b64-a2aa-a412011a8d43.mysql.sequelizer.com',
        user: 'pmabpnnohecevvbc',
        password : 'VWqep2gn6wpPW3bosUvuph3kCzjbAtYEUzZCQ3HTxUgosYVxiYZeCRXM3fJWReUL',
        port : 3306, //port mysql
        database:'db1cb3c708c4124b64a2aaa412011a8d43'

    },'pool') //or single

);


//app.get('/', routes.index);
//app.get('/invoiceApp', invoiceRoute.list);
//app.get('/invoiceApp', invoiceRoute.list);

app.get('/', invoiceRoute.default);
app.get('/invoiceApp/accounts', invoiceRoute.customers);
app.get('/invoiceApp/customer/:id/:stripeCustomerId', invoiceRoute.customerInvoices);
app.get('/invoiceApp/customer/:customerId/invoice/:id/:month/:year', invoiceRoute.invoiceDetails);
app.post('/invoiceApp/downloadAzureDailyUsage', invoiceRoute.downloadAzureDailyUsage);
//app.post('/invoiceApp/generateInvoice', invoiceRoute.generateInvoice);
app.post('/invoiceApp/generateInvoice', invoiceRoute.downloadAzureUsage);

app.get('/invoiceApp/stripe/customers/:customerId/createInvoice/:id/:stripeCustomerId/:amount/:description', invoiceRoute.createInvoice);

app.get('/invoiceApp/stripe/customers/:customerId/verifyPayment/:id/:stripeCustomerId/:stripeInvoiceId', invoiceRoute.verifyPayment);

//app.get('/invoiceApp/stripe/invoices', invoiceRoute.stripeInvoices);
//app.get('/invoiceApp/stripe/customers', invoiceRoute.customers);
//app.get('/invoiceApp/stripe/customers/invoice/:id', invoiceRoute.stripeInvoice);

//app.post('/invoiceApp/downloadAzureUsage', invoiceRoute.downloadAzureUsage);
//app.get('/invoiceApp/delete/:id', invoiceRoute.delete_usage);


app.use(app.router);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
