
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

//This is the default route 
//This is an aliase for /invoiceApp
exports.default = function (req, res) {
    
    res.redirect('/invoiceApp');
  
};

//This is the function which will render the customer details
 exports.customers = function (req, res) {
    //view model to be passed to html
    var customers = [];
    customers.push(customer);
    
    //passing the json to the view engine    
    //The first parameter is the view name (file with the name 'customer' is there inside the /views folder)
    //second parameter is the data to be passed to the view
    res.render('customers', { page_title: "Customers", data: customers });
  
};

//This is the method for listing all the subscription for the selected customer
 exports.customerSubscription = function (req, res){
    
    //this customer id comes from the url
    //eg: url format is http://cf-node-api-mgmt-monthly-subscription.cfapps.io/invoiceApp/customer/cus_66IXO1HLB4b073
    //The last parameter is the stripe customer id

    var stripeCustomerId=req.params.stripeCustomerId;
    
    //For consuming stripe we are using a node package
    //You can find more information on this pakcage in below url
    //https://www.npmjs.com/package/stripe
    var stripe = require("stripe")(
        stripeKey
    );
    
    //Inoder to get all the active subscriptions of the user we have to call the method listSubscriptions
    //In this method we need to pass the customer ID
    //This has a callback. In this callback we are redirecting to customer subscription page    

    stripe.customers.listSubscriptions(stripeCustomerId, function (err, subscriptions) {
        
        //subscription is the view (the physical file is located inside views folder) 
        //model = subscriptions.data. This containes the subscription details
        res.render('subscription', { page_title: "Subscriptions", data: subscriptions.data });
    });

    
};


//This is the method for creating a new sunscription for the selected customer
exports.createSubscription = function (req, res) {
    
    //this customer id comes from the url
    var stripeCustomerId = customer.stripeCustomerId;
    
    //For consuming stripe we are using a node package
    //You can find more information on this pakcage in below url
    //https://www.npmjs.com/package/stripe
    var stripe = require("stripe")(
        stripeKey
    );

    
    //For creating a new subscription we have to call the stripe.customers.createSubscription method in stripe module
    //Here we need to pass a plan and the stripeCustomerId
    //Monthly plan will be having the billing amount, billing frequency etc.
    //For this sample a plan is alreday been created and the identifier for that plan is "MonthlyPlan"
    //So when we call the createSubscription the customer will be subscribed plan. Here in this case  "MonthlyPlan"
    stripe.customers.createSubscription(
        stripeCustomerId,
            { plan: "MonthlyPlan" },
  function (err, subscription) {
            res.redirect('/invoiceApp/Customer/' + stripeCustomerId);
        }
    );

    


};

//for cancelling a subscription
exports.cancelSubscription = function (req, res) {
    
    //the incoming url format will be /invoiceApp/stripe/cancelSubscription/:stripeCustomerId/:subscriptionId'
    //The above route is defined in app.js
    //this customer id comes from the url
    var stripeCustomerId = req.params.stripeCustomerId;
    
    //this subscriptionId comes from the url
    var subscriptionId = req.params.subscriptionId;
    
    //For consuming stripe we are using a node package
    //You can find more information on this pakcage in below url
    //https://www.npmjs.com/package/stripe
    var stripe = require("stripe")(
        stripeKey
    );
    
    //This method will cancel a subscription
    //We have to pass the stripeCustomerId and subscriptionId for cancellation
    stripe.customers.cancelSubscription(
        stripeCustomerId,
  subscriptionId,
  function (err, confirmation) {
            
        //Redirecting to customer subscription page after cancellation
            res.redirect('/invoiceApp/Customer/' + stripeCustomerId);

        }
    );

};


//This method is for creating a new plan. The plan can be monthy, twice in a week etc
//This method is not using anywhere in application. This is just for reference.
exports.createPlan = function (req, res) {
    
    //This method uses POST
    //For getting the passed in values, we have to parse the json
    var input = JSON.parse(JSON.stringify(req.body));
    
    //Plan Name
    var name = input.name;
    
    //Plan amount
    var amount = input.amount;
    
    //Customer Id
    var stripeCustomerId = req.params.stripeCustomerId;
    
    //creating an auto generated id for the plan
    var todaysDate = new Date();    
    var id= todaysDate.getTime();
    
    
    //For consuming stripe we are using a node package
    //You can find more information on this pakcage in below url
    //https://www.npmjs.com/package/stripe
    var stripe = require("stripe")(
        stripeKey
    );

    
    //For creating a new pln call the  stripe.plans.create method in stripe module
    //pass the amount, interval, name, currency and Id
    stripe.plans.create({
        amount: amount,
        interval: "month",
        name: name,
        currency: "usd",
        id: id
    }, function (err, plan) {

        // res.redirect('/invoiceApp/Customer/'+ stripeCustomerId);
 
    });


};


