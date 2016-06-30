 
 //This is the authorization token needed for consuming the stripe API.
 //So for all stripe request we have to inject this key
 var stripeKey = "sk_test_TMvswfMKVJpGk3K1WJ4jGyGL";//dave's stripe account 

//Below is the authorizaton token needed for consuming the Azure API Managment REST API
 //This token is needed for consuming AZURE API Management API methods
 var azureAuthorizationToken="SharedAccessSignature uid=552f43df219f3a030e030003&ex=2015-05-16T13:23:00.0000000Z&sn=s0lZQpaZp3AnRLxyhvPAUHmPw75wf2pc1LW8kVZQsSkh5p7u5lo3x2jtd+exElhGa2ycAC9SbIFqL2xz6FNhIw==";//Dave's	

//This is the azure root API url
var apiUrl = "https://campsite.management.azure-api.net/"; //API Management URL


//This is the customer details. This JSON has the link b/w Azure API and Stripe 
var customer = {
    azureUserId: "54a2fbadb252b510908cbbdc",	
    customerName: "Dave Nielsen",
    stripeCustomerId: "cus_66IXO1HLB4b073"
}

////This is the default route 
////This is an aliase for /invoiceApp
//exports.default = function (req, res) {
//    res.redirect('/invoiceApp');
//};

//This is the function which will render the customer details
 exports.customers = function (req, res) {
    
    //view model to be passed to html
    var customers = [];
    customers.push(customer);    

    //passing the json to the view engine    
    //The first parameter is the view name (file with the name 'customer' is there inside the /views folder)
    //second parameter is the data to be passed to the view
    res.render('metered/customers', 
        {
            app_title: "Metered Subscription", 
            page_title: "Customers",
            data: customers
    });
  
};


//This method will do 2 things
//1. This will retrieve the last month azure data usage by consuming the API
//2. List down all the previous customer invoices from stripe using stripe API
 exports.customerInvoices = function (req, res){
    
    //this customer id comes from the url
    //eg: url format is http://cf-node-api-mgmt-metered-subscription.cfapps.io/invoiceApp/customer/cus_66IXO1HLB4b073
    //The last parameter is the stripe customer id
    var stripeCustomerId=req.params.stripeCustomerId;
    
    //Using the current date we are finding the last month and year. These 2 data we need to pass to  downloadLastMonthAzureUsage
    //method to get the last month usage
    var todaysDate = new Date();
    var month = todaysDate.getMonth() + 1;
    var year = todaysDate.getFullYear();
    
    //This methods returns the last month API consumption for the given customer
    exports.downloadLastMonthAzureUsage(req, res, month, year, stripeCustomerId);
    
};

//This methods returns the last month API consumption for the given customer
//A sample URL format for API call is given below
//https://campsite.management.azure-api.net/reports/byApi?$filter=timestamp ge datetime '2015-04-01T00:00:00' and timestamp le datetime '2015-04-30T23:59:59' &api-version=2014-02-14
 exports.downloadLastMonthAzureUsage = function (req, res, month, year, stripeCustomerId) {
    
    //Inorder to get the azure usage we have to pass a start date and an end date
    //Here in our example we need to calculate the monthly API usage statistics. For that we need to pass the start date and end date of the month
    //Form the given month and year we will calculate the starting and ending date of the month
    //So the below few line are for getting the start date and end date
    
    //Below is the format of the date we have to pass to Azure API
    //YYYY-MM-DD
    
    //Start Date End Date logic START
    var monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
   
    var monthName = monthNames[month - 1];
    var todaysDate = new Date();
    var invoiceDate = (zeroPad(todaysDate.getMonth() + 1)) + "-" + zeroPad(todaysDate.getDate()) + "-" + todaysDate.getFullYear();
    
    var invDesc = invoiceDate + ":" + todaysDate.getTime();
    
    //Crating a unique Description for the Invoice using current date and time   
    var invoiceDesc = 'Invoice ' + invDesc;
    
    var startDateObject = new Date(year, month - 1, 1);
    var endDateObject = new Date(year, month, 0);
    
    var billingPeriod = endDateObject.getFullYear().toString() + zeroPad((endDateObject.getMonth() + 1)).toString() + zeroPad((endDateObject.getDate())).toString();
    
    
    var startDate = year + "-" + zeroPad((startDateObject.getMonth() + 1)) + "-" + zeroPad(startDateObject.getDate());
    var endDate = year + "-" + zeroPad((endDateObject.getMonth() + 1)) + "-" + zeroPad(endDateObject.getDate());
    
    //Start Date End Date logic END

    //request is a node package which will make the REST API calls much easy
    var request = require('request');
    
    //This is the autorization token for azure API Management
    var authorizationToken = azureAuthorizationToken;
    
    //Here we are builing the dynamic url for getting the API consumption details
    //we are appending the root url and appending the start date and end dates in the required formats.
    var urlformat = apiUrl + "reports/byApi?$filter=timestamp ge datetime'" + startDate + "T00:00:00' and timestamp le datetime'" + endDate + "T23:59:59' &api-version=2014-02-14";
    
    console.log(" urlformat " + urlformat);
    
    //This is the JSON object passing to the request method
    //This containes the url, method type(GET, POST, DELETE, PUT etc)
    //The authorization header
    var options = {
        url: urlformat,
        method: 'GET',
        headers: {
            'Authorization': authorizationToken
        }
    };
    
    //This is the callback method which will get executes after the REST call from request object
    function callback(error, response, body) {
        
        //We rae making sure that the response is not having errors and the status code is 200(successful call)
        if (!error && response.statusCode == 200) {
            
            //we are parsing the response body to get the returned data
            var info = JSON.parse(body);
            
            //we are defining a JSON to store the incoming result data
            var azureData = {
                name    : '',
                apiId: '',
                callCountSuccess: 0,
                callCountBlocked: 0,
                callCountFailed: 0,
                callCountOther: 0,
                callCountTotal: 0,
                bandwidth: '',
                cacheHitCount: 0,
                cacheMissCount: 0,
                apiTimeAvg: '',
                apiTimeMin: '',
                apiTimeMax: '',
                serviceTimeAvg: '',
                serviceTimeMin: '',
                serviceTimeMax: ''
														   
            };
            
            //looping through the array for data we got from the AZURE API
            //If we have 2 different API then we will get an array of 2 objects. Each object will be having a consolidated report for each API
            //The important data from the object will be total calls, total successfull calls, total failed calls etc.
            //So here in the below loop we are summing up the total calls, total failed calls etc
            if (info.value.length > 0) {
                
                for (var i = 0; i < info.value.length ; i++) {

                    azureData.callCountSuccess  += info.value[i].callCountSuccess;
                    azureData.callCountBlocked  += info.value[i].callCountBlocked;
                    azureData.callCountFailed   += info.value[i].callCountFailed;
                    azureData.callCountOther    += info.value[i].callCountOther;
                    azureData.callCountTotal    += info.value[i].callCountTotal;
                    azureData.cacheHitCount     += info.value[i].cacheHitCount;
                    azureData.cacheHitCount     += info.value[i].cacheMissCount;
                }  
            }
            
            //creating the model to be passed to the view
            //assigning the calculated summed up value to the new model
            //This is the data we are displaying in the first grid in customer invoice page
            var azureUsageData = {
                stripeCustomerId: stripeCustomerId, 
                azureUserId: '', 
                totalApiCalls: azureData.callCountTotal, 
                month: monthName, 
                status: 'Not Invoiced', 							
                invoiceDate: invoiceDate,
                year: year,
                billingPeriod: billingPeriod,
                invoiceDescription: invoiceDesc,
                rate: '$5/Call', //this is the rate for each API call
                totalAmount: 5 * azureData.callCountTotal, //Here we are calculating the amount. The formula = rate per call * no of scuccessfull API calls
                customerName : customer.customerName
                //,customerId: customerId
            };
            
            
            //The below call to stripe is to get all the past invoice generated for the selected customer
            var stripe = require("stripe")(
                stripeKey
            );
            
            //To get the past invoices we have to call the invoiceItems.list method in stripe package
            //we need to pass the stripe CustomerId to the method
            stripe.invoiceItems.list({limit:1000, customer: stripeCustomerId }, function (err, invoiceItems) {
                
                //This is the callback anonymous method
                //Here we are passing the models we have created to a view called stripeInvoices.
                //The view file is located inside the views folder
                //We are passing 2 models to the view 
                //1. invoiceItems.data which has the invoice details
                //2. azureUsageData which has the azure API call statistics
                res.render('metered/stripeInvoices', 
                   {
                        app_title: "Metered Subscription",
                        page_title: "Invoices", 
                        data: invoiceItems.data, 
                        azureData: azureUsageData
                });
        
            });
				 
        }
    }
    
    request(options, callback);
};


//This the method used to place an invoice in stripe for the selected customer
exports.createInvoice = function (req, res) {
   
    
    //The below vaiables are read from the incoming url
    //A typical url look like below
    //stripeCustomerId/:amount/:description
    
    //amount : This is the invoice amount. 
    //For metered billing the invoice amount is calculated using below formula
    //amount= No of API calls * Rate for single call
    //The amount comes through the url is the result of above formula

    var amount = req.params.amount * 100;//this conversion is needed in stripe. Then only it converts to USD. Ie If we need to invoice for $5, we have to pass the value as 500
    
    //description: This is the description for the Invoice
    var description = req.params.description;
    
    //stripeCustomerId: This is the unique Id from stripe to identity the invoicing customer.
    var stripeCustomerId = req.params.stripeCustomerId;
    
    
    //For consuming stripe we are using a node package
    //You can find more information on this pakcage in below url
    //https://www.npmjs.com/package/stripe
    var stripe = require("stripe")(
        stripeKey
    );
    
    //Inoder to create a new invoce in stripe we have to call the invoiceItems.create method in the package
    //In this method we need to pass the customer ID, Invoice amount, Currency and a description. These are the minimum details needed to create an invoice
    //This has a callback. In this callback we are again redirecting to customer invoice screen
    
    stripe.invoiceItems.create({
        customer: stripeCustomerId,
        amount: amount,
        currency: "usd",
        description: description
    }, function (err, invoiceItem) {
        
        res.redirect('/invoiceApp/metered/Customer/'+ stripeCustomerId);
    });
  
};

//This is a utility function used to format a number with a zero on to the left if its a single digit number
function zeroPad(num) {

if(num>9)
{
	return num;
}
  var places=2;
  var zero = places - num.toString().length + 1;
  return Array(+(zero > 0 && zero)).join("0") + num;
}



