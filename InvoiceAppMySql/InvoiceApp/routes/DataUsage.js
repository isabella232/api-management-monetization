
 /*
 * GET data usage .
 */
 
 var stripeKey="sk_test_TMvswfMKVJpGk3K1WJ4jGyGL";//dave's stripe account
 //var stripeKey="sk_test_LLEiqIrzwhZajOE165ZyIRM7";//kiran's stripe account
var azureAuthorizationToken = "SharedAccessSignature uid=552f43df219f3a030e030003&ex=2015-05-16T13:23:00.0000000Z&sn=s0lZQpaZp3AnRLxyhvPAUHmPw75wf2pc1LW8kVZQsSkh5p7u5lo3x2jtd+exElhGa2ycAC9SbIFqL2xz6FNhIw==";//Dave's	
 
 //var azureAuthorizationToken="SharedAccessSignature uid=552f43df219f3a030e030003&ex=2015-05-16T13:23:00.0000000Z&sn=s0lZQpaZp3AnRLxyhvPAUHmPw75wf2pc1LW8kVZQsSkh5p7u5lo3x2jtd+exElhGa2ycAC9SbIFqL2xz6FNhIw==";//kiran	
 var apiUrl="https://campsite.management.azure-api.net/";
 
 //var stripeCustomerId="cus_66IXO1HLB4b073";//dave


exports.default = function (req, res) {
    
    res.redirect('/invoiceApp/accounts');
  
};
 exports.customers = function(req, res){

		/* var stripe = require("stripe")(
		  stripeKey
		);

		stripe.customers.list({ limit: 10 }, function(err, customers) {
		 
		  res.render('customers',{page_title:"Stripe Customers",data:customers.data});
		});*/

		req.getConnection(function(err,connection){
       
        var query = connection.query('select * from customer',function(err,rows)
        {
            
            if(err)
                console.log("Error Selecting : %s ",err );
     
            res.render('customers',{page_title:"Customers",data:rows});
                
           
         });
         
         
    });
  
};
exports.customerInvoices = function(req, res){
var id = req.params.id;
var stripeCustomerId=req.params.stripeCustomerId;

var returnUrl= req.originalUrl;
  req.getConnection(function(err,connection){
       
        var query = connection.query('select i.*, c.customerName,c.id as customerId from invoice i inner join customer c on c.stripeCustomerId=i.stripeCustomerId where c.id='+ id+' order by i.billingPeriod desc',function(err,rows)
        {
            
            if(err)
                console.log("Error Selecting : %s ",err );
     
            res.render('list',{page_title:"Invoices",data:rows,customerId:id, url: returnUrl, stripeCustomerId: stripeCustomerId});
                
           
         });
         
         
    });
  
};

exports.invoiceDetails = function(req, res){
var id = req.params.id;
var customerId=req.params.customerId;
var monthName=req.params.month;
var year=req.params.year;
var returnUrl= req.originalUrl;


var month = [ "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december" ].indexOf(monthName.toLowerCase())+1;
	
	var startDateObject=new Date(year, month-1, 1);
	var endDateObject=new Date(year, month, 0);		
		
	var startDate= year+"-"+zeroPad((startDateObject.getMonth()+1))+"-"+zeroPad(startDateObject.getDate());
	var endDate= year+"-"+zeroPad((endDateObject.getMonth()+1))+"-"+zeroPad(endDateObject.getDate());	
		
		
  req.getConnection(function(err,connection){
       //CALL GetDailyUsage(2,'2014-12-14','2014-12-30')
        //var query = connection.query('select * from datausage',function(err,rows)
		
		var query = connection.query("CALL GetDailyUsage("+customerId+",'"+startDate+"','"+endDate+"')",function(err, results, fields)
        {
            
            if(err)
                console.log("Error Selecting : %s ",err );
    
            res.render('dailyUsage',{page_title:"Daily Usage Report",data:results[0], customerId:customerId, url: returnUrl});
                
           
         });
         
         
    });
  
};
 exports.createCustomer = function(req, res){

		var stripe = require("stripe")(
		  stripeKey
		);

		stripe.customers.create({
		  description: 'Customer for test@example.com',
		  card: "tok_15G1U7A0HJ8AMbxx8Roln4Zm" // obtained with Stripe.js
		}, function(err, customer) {
		  
		   res.redirect('/invoiceApp/stripe/customers');
		});

  
};


exports.verifyPayment = function(req, res){
//:id/:custId/:amount/:description

			var id = req.params.id;
			var stripeCustomerId=req.params.stripeCustomerId;
			var customerId=req.params.customerId;
			var stripeInvoiceId=req.params.stripeInvoiceId;
			

			
			var stripe = require("stripe")(
			  stripeKey
			);

			stripe.invoices.retrieve(stripeInvoiceId, function(err, invoice) {
			console.log(invoice);
					if(invoice)
					{
					
					   req.getConnection(function(err,connection){
								var query = connection.query("update invoice set status='Paid' where id="+id ,function(err,rows)
								{
									if(err)
										console.log("Error Selecting : %s ",err );
							 
									res.redirect('/invoiceApp/Customer/'+customerId +"/"+stripeCustomerId);								
								   
								 });
								 
							});
					}
					else{
					 res.redirect('/invoiceApp/Customer/'+customerId +"/"+stripeCustomerId);			
					
					}
				});

			
  
};
 exports.createInvoice = function(req, res){
//:id/:custId/:amount/:description

			var id = req.params.id;
			var amount=req.params.amount*100;//this conversion is needed in stripe
			var description=req.params.description;
			var stripeCustomerId=req.params.stripeCustomerId;
			var customerId=req.params.customerId;
			
			console.log(" id " +id);
			console.log(" amount " +amount);
			console.log(" description " +description);

			
			var stripe = require("stripe")(
			  stripeKey
			);

			stripe.invoiceItems.create({
			  customer: stripeCustomerId,
			  amount: amount,
			  currency: "usd",
			  description: description
			}, function(err, invoiceItem) {

			console.log(invoiceItem);
			         //change the status in db as Processed
					  req.getConnection(function(err,connection){
							var query = connection.query("update invoice set status='Invoiced', stripeInvoiceId='"+invoiceItem.id+"' where id="+id ,function(err,rows)
							{
								if(err)
									console.log("Error Selecting : %s ",err );
						 
								 res.redirect('/invoiceApp/Customer/'+customerId+"/"+stripeCustomerId);								
							   
							 });
							 
						});
			});
  
};
exports.stripeInvoices = function(req, res){			

		var stripe = require("stripe")(
		  stripeKey
		);

		stripe.invoiceItems.list({ customer: stripeCustomerId },function(err, invoiceItems) {
		  
		  res.render('stripeInvoices',{page_title:"Stripe Invoices",data:invoiceItems.data});
		});

  
};

exports.stripeInvoice = function(req, res){			

		var id = req.params.id;
		var stripe = require("stripe")(
		  stripeKey
		);

		stripe.invoiceItems.list({ customer: id },function(err, invoiceItems) {
		  
		  res.render('stripeInvoices',{page_title:"Stripe Invoices",data:invoiceItems.data});
		});

  
};

exports.list = function(req, res){

var customerId=req.params.id;
var returnUrl= req.originalUrl;

  req.getConnection(function(err,connection){
       
        var query = connection.query('select i.*, c.customerName from invoice i inner join customer c on c.stripeCustomerId=i.stripeCustomerId order by i.billingPeriod desc',function(err,rows)
        {
            
            if(err)
                console.log("Error Selecting : %s ",err );
     
            res.render('list',{page_title:"Invoices",data:rows, customerId:customerId, url: returnUrl});
                
           
         });
         
         
    });
  
};




function zeroPad(num) {

if(num>9)
{
	return num;
}
  var places=2;
  var zero = places - num.toString().length + 1;
  return Array(+(zero > 0 && zero)).join("0") + num;
}
exports.generateInvoice = function(req, res){
	
	var monthNames = [ "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December" ];

		var input = JSON.parse(JSON.stringify(req.body));

		var month=input.month;
		var year=input.year;
		
		var monthName=monthNames[month-1];
		var todaysDate=new Date();
		var invoiceDate=(zeroPad(todaysDate.getMonth()+1))+"-"+ zeroPad(todaysDate.getDate())+"-"+todaysDate.getFullYear();
		
		var invDesc=invoiceDate+":"+todaysDate.getTime();
		
		var invoiceDesc='Invoice '+invDesc;
		
		//var startDate="2014-12-01";
		//var endDate="2014-12-31";
		
		var startDateObject=new Date(year, month-1, 1);
		var endDateObject=new Date(year, month, 0);		
		
		//var billingPeriod=(endDateObject.getMonth()+1).toString()+ (endDateObject.getDate()).toString()+endDateObject.getFullYear().toString();
		var billingPeriod=endDateObject.getFullYear().toString()+zeroPad((endDateObject.getMonth()+1)).toString()+ zeroPad((endDateObject.getDate())).toString();
		
		
		var startDate= year+"-"+zeroPad((startDateObject.getMonth()+1))+"-"+zeroPad(startDateObject.getDate());
		var endDate= year+"-"+zeroPad((endDateObject.getMonth()+1))+"-"+zeroPad(endDateObject.getDate());
		
		
		var request = require('request');
		
		req.getConnection(function(err,connection){
		var query = connection.query("CALL TotalMonthlyUsage('"+startDate+"','"+endDate+"')",function(err, results, fields)
        {
            
            if(err)
                console.log("Error Selecting : %s ",err );
    
			if(results[0].length>0)
			{
				var index=0;
				for(var i=0;i< results[0].length;i++)
					{
						
						(function () {
									var invoiceData=results[0][i];
									var cusId=invoiceData.customerId;
									var totalCalls=invoiceData.callCountTotal;
									var stripeCusId=invoiceData.stripeCustomerId;
									var data={
											stripeCustomerId:stripeCusId, 
											azureUserId:'', 
											totalApiCalls:totalCalls, 
											month:monthName, 
											status:'Not Invoiced', 							
											invoiceDate:invoiceDate,
											year:year,
											billingPeriod:billingPeriod,
											invoiceDescription:invoiceDesc,
											rate:'$5/Call',
											totalAmount:5*totalCalls,
											customerId:cusId
										};	
						
						
									req.getConnection(function(err,connection){
							
									var query = connection.query("INSERT INTO invoice set ? ",data, function(err, rows)
									{
										  if (err)
										  {
											  console.log("Error inserting : %s ",err );
										  }
										  index++;
										 if(results[0].length==index)
										 {
											res.redirect("/invoiceApp/accounts");
										  }
										  
										});
									}); 
							
								}());
					}
			}
			else{
				res.redirect("/invoiceApp/accounts");
			}
            //res.render('dailyUsage',{page_title:"Daily Usage Report",data:results[0], customerId:customerId, url: returnUrl});
                
           
         });

		});
};

exports.downloadAzureUsage = function(req, res){
	console.log("started ");
	var monthNames = [ "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December" ];

		var input = JSON.parse(JSON.stringify(req.body));

		var month=input.month;
		var year=input.year;
		var customerId=input.customerId;
		var stripeCustomerId=input.stripeCustomerId;
		
		console.log("customerId : "+customerId);
		var monthName=monthNames[month-1];
		var todaysDate=new Date();
		var invoiceDate=(zeroPad(todaysDate.getMonth()+1))+"-"+ zeroPad(todaysDate.getDate())+"-"+todaysDate.getFullYear();
		
		var invDesc=invoiceDate+":"+todaysDate.getTime();
		
		var invoiceDesc='Invoice '+invDesc;
		
		//var startDate="2014-12-01";
		//var endDate="2014-12-31";
		
		var startDateObject=new Date(year, month-1, 1);
		var endDateObject=new Date(year, month, 0);		
		
		//var billingPeriod=(endDateObject.getMonth()+1).toString()+ (endDateObject.getDate()).toString()+endDateObject.getFullYear().toString();
		var billingPeriod=endDateObject.getFullYear().toString()+zeroPad((endDateObject.getMonth()+1)).toString()+ zeroPad((endDateObject.getDate())).toString();
		
		
		var startDate= year+"-"+zeroPad((startDateObject.getMonth()+1))+"-"+zeroPad(startDateObject.getDate());
		var endDate= year+"-"+zeroPad((endDateObject.getMonth()+1))+"-"+zeroPad(endDateObject.getDate());
		
		
		var request = require('request');
		
		var authorizationToken=azureAuthorizationToken;
		//var urlformat="https://apicamp.management.azure-api.net/reports/byApi?$filter=timestamp ge datetime'2014-10-07T00:00:00' and timestamp le datetime'2014-12-31T00:00:00' &api-version=2014-02-14";
		//var urlformat="https://userserviceapi.management.azure-api.net/reports/byApi?$filter=timestamp ge datetime'"+startDate+"T00:00:00' and timestamp le datetime'"+endDate+"T23:59:59' &api-version=2014-02-14";
		
		var urlformat= apiUrl+"reports/byApi?$filter=timestamp ge datetime'"+startDate+"T00:00:00' and timestamp le datetime'"+endDate+"T23:59:59' &api-version=2014-02-14";
		
		console.log(" urlformat " +urlformat);
		
		var options = {
			url: urlformat,
			method: 'GET',
			headers: {
				'Authorization': authorizationToken
			}
		};

		function callback(error, response, body) {
			console.log(error);
			//console.log(response);
			// if (!error && response.statusCode == 200) {
				// var info = JSON.parse(body);
				// console.log(info);
			// }
			if (!error && response.statusCode == 200) {
				var info = JSON.parse(body);
				var azureData = {
									name    : '',
								   apiId: '',
								   callCountSuccess: 0,
								   callCountBlocked: 0,
								   callCountFailed:0,
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
				if(info.value.length >0)
				{
				
					var i=0;
					azureData = {
									name    : info.value[i].name,
								   apiId: info.value[i].apiId,
								   callCountSuccess: info.value[i].callCountSuccess,
								   callCountBlocked: info.value[i].callCountBlocked,
								   callCountFailed: info.value[i].callCountFailed,
								   callCountOther: info.value[i].callCountOther,
								   callCountTotal: info.value[i].callCountTotal,
								   bandwidth: info.value[i].bandwidth,
								   cacheHitCount: info.value[i].cacheHitCount,
								   cacheMissCount: info.value[i].cacheMissCount,
								   apiTimeAvg: info.value[i].apiTimeAvg,
								   apiTimeMin: info.value[i].apiTimeMin,
								   apiTimeMax: info.value[i].apiTimeMax,
								   serviceTimeAvg: info.value[i].serviceTimeAvg,
								   serviceTimeMin: info.value[i].serviceTimeMin,
								   serviceTimeMax: info.value[i].serviceTimeMax
														   
                };

                for (var i = 0; i < info.value.length ; i++) {
                    
                    azureData.callCountSuccess += info.value[i].callCountSuccess;
                    azureData.callCountBlocked += info.value[i].callCountBlocked;
                    azureData.callCountFailed += info.value[i].callCountFailed;
                    azureData.callCountOther += info.value[i].callCountOther;
                    azureData.callCountTotal += info.value[i].callCountTotal;
                    azureData.cacheHitCount += info.value[i].cacheHitCount;
                    azureData.cacheHitCount += info.value[i].cacheMissCount;
                }
				}
							
						var data={
							stripeCustomerId:stripeCustomerId, 
							azureUserId:'', 
							totalApiCalls:azureData.callCountTotal, 
							month:monthName, 
							status:'Not Invoiced', 							
							invoiceDate:invoiceDate,
							year:year,
							billingPeriod:billingPeriod,
							invoiceDescription:invoiceDesc,
							rate:'$5/Call',
							totalAmount:5*azureData.callCountTotal,
							customerId: customerId
						};	
							
						 req.getConnection(function(err,connection){
							var query = connection.query("INSERT INTO invoice set ? ",data, function(err, rows)
							{
					  
							  if (err)
								  console.log("Error inserting : %s ",err );
							 
							   //res.redirect('/invoiceApp');
							   res.redirect("/invoiceApp/customer/" + customerId +"/" + stripeCustomerId);
							});
						});  
				console.log(info);
				 
			}
			//res.redirect("/invoiceApp/customer/" + customerId);
			//console.log(response.statusCode);
		}

		request(options, callback);
};

exports.download = function(req, res){
	res.render('downloadReport',{page_title:"Download Azure Report"});
};   
exports.downloadAzureDailyUsage = function(req, res){


		var input = JSON.parse(JSON.stringify(req.body));
		var date=input.date;
		var customerId=input.customerId;
		var returnUrl=input.returnUrl;
		console.log(date);
console.log(customerId);
console.log(returnUrl);
		var request = require('request');
		
		var authorizationToken=azureAuthorizationToken;
		
		//var urlformat="https://apicamp.management.azure-api.net/reports/byApi?$filter=timestamp ge datetime'2014-10-07T00:00:00' and timestamp le datetime'2014-12-31T00:00:00' &api-version=2014-02-14";
		//var urlformat="https://apicamp.management.azure-api.net/reports/byApi?$filter=timestamp ge datetime'"+date+"T00:00:00' and timestamp le datetime'"+date+"T23:59:59' &api-version=2014-02-14";
		var urlformat= apiUrl+"reports/byApi?$filter=timestamp ge datetime'"+date+"T00:00:00' and timestamp le datetime'"+date+"T23:59:59' &api-version=2014-02-14";
		
		
		var options = {
			url: urlformat,
			method: 'GET',
			headers: {
				'Authorization': authorizationToken
			}
		};

		function callback(error, response, body) {
			if (!error && response.statusCode == 200) {
				var info = JSON.parse(body);
				console.log(info);
				var index=0;
				if(info.value.length >0)
				{
					for(var i=0;i< info.value.length;i++)
					{
						
						var data = {
								name    : info.value[i].name,
							   apiId: info.value[i].apiId,
							   callCountSuccess: info.value[i].callCountSuccess,
							   callCountBlocked: info.value[i].callCountBlocked,
							   callCountFailed: info.value[i].callCountFailed,
							   callCountOther: info.value[i].callCountOther,
							   callCountTotal: info.value[i].callCountTotal,
							   bandwidth: info.value[i].bandwidth,
							   cacheHitCount: info.value[i].cacheHitCount,
							   cacheMissCount: info.value[i].cacheMissCount,
							   apiTimeAvg: info.value[i].apiTimeAvg,
							   apiTimeMin: info.value[i].apiTimeMin,
							   apiTimeMax: info.value[i].apiTimeMax,
							   serviceTimeAvg: info.value[i].serviceTimeAvg,
							   serviceTimeMin: info.value[i].serviceTimeMin,
							   serviceTimeMax: info.value[i].serviceTimeMax,
							   date:date,
							   usageDate:date,
							   customerId:customerId
							};
							
							(function () {
									var copy=data;
									
									req.getConnection(function(err,connection){
							
									var query = connection.query("INSERT INTO datausage set ? ",copy, function(err, rows)
									{
										  if (err)
										  {
											  console.log("Error inserting : %s ",err );
										  }
										  index++;
										 if(info.value.length==index)
										 {
											res.redirect(returnUrl);
										  }
										  
										});
									}); 
							
								}());
							
					}
				}
				//console.log(info);
				
			}
			
			console.log(response.statusCode);
		}
		
		req.getConnection(function(err,connection){

		var query = connection.query("delete from datausage where customerId="+customerId+" and usageDate='"+date+"'",function(err, rows)
			{
				  if (err)
				  {
					  console.log("Error : %s ",err );
				  }
				  
			});
		}); 
									
		//request(options, callback);							

		
};
  

exports.delete_usage = function(req,res){
          
     var id = req.params.id;
    
     req.getConnection(function (err, connection) {
        
        connection.query("DELETE FROM datausage  WHERE id = ? ",[id], function(err, rows)
        {
            
             if(err)
                 console.log("Error deleting : %s ",err );
            
             res.redirect('/reports');
             
        });
        
     });
};


