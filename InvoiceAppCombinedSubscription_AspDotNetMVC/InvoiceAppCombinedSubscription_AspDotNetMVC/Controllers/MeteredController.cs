using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web;
using System.Web.Mvc;

namespace InvoiceAppCombinedSubscription_AspDotNetMVC.Controllers
{
    public class MeteredController : Controller
    {
        // GET: Metered
        public ActionResult Index()
        {

            Stripe.StripeCustomerService customerService = new Stripe.StripeCustomerService();
            customerService.ApiKey = ConfigHelper.GetStripeApiKey();
            List<Stripe.StripeCustomer> customers = customerService.List().ToList();

            return View(customers);
        }

        public ActionResult Customer(string id)
        {
            SetCustomerId(id);

            Stripe.StripeCustomerService customerService = new Stripe.StripeCustomerService();
            customerService.ApiKey = ConfigHelper.GetStripeApiKey();
            Stripe.StripeCustomer customer = customerService.Get(id);


            //Stripe.StripeInvoiceService invoiceService=new Stripe.StripeInvoiceService();
            //invoiceService.ApiKey="sk_test_TMvswfMKVJpGk3K1WJ4jGyGL";
            //List<Stripe.StripeInvoice> stripeInvoices = invoiceService.List(new Stripe.StripeInvoiceListOptions { CustomerId = id }).ToList();
          
            Stripe.StripeInvoiceItemService invoiceItemService=new Stripe.StripeInvoiceItemService();
            invoiceItemService.ApiKey = ConfigHelper.GetStripeApiKey();
            List<Stripe.StripeInvoiceLineItem> invoices= invoiceItemService.List(new Stripe.StripeInvoiceItemListOptions{CustomerId=id}).ToList();

            MeteredInvoiceViewModel viewModel = new MeteredInvoiceViewModel();
            viewModel.Invoices = invoices;
            viewModel.AzureUsage = GetAzureDataUsage();
            viewModel.AzureUsage.StripeCustomerId = id;
            return View(viewModel);
        }

        public ActionResult CreateInvoice(string id)
        {
            AzureUsage usage = GetAzureDataUsage();
            usage.StripeCustomerId = id;

            Stripe.StripeInvoiceItemService invoiceItemService = new Stripe.StripeInvoiceItemService();
            invoiceItemService.ApiKey = ConfigHelper.GetStripeApiKey();
            invoiceItemService.Create(new Stripe.StripeInvoiceItemCreateOptions
            {
                Amount = usage.TotalAmount * 100,
                Currency = "usd",
                CustomerId = id,
                Description = usage.Description,

            });

            Response.Redirect(Url.RouteUrl(new { controller = "Metered", action = "Customer", id = id }));
            return View();
        }
        private void SetCustomerId(string id)
        {
            ViewBag.CustomerId = id;
        }

        private AzureUsage GetAzureDataUsage()
        {
            var azureAuthorizationToken = ConfigHelper.GetAzureApiManagementKey();

            var urlFormat = "https://{0}/reports/byUser?$filter=timestamp ge datetime'{1}T00:00:00' and timestamp le datetime'{2}T23:59:59' &api-version=2014-02-14";

            WebClient client = new WebClient();
            client.Headers["Authorization"] = azureAuthorizationToken;
           

            DateTime startDate = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1);
            DateTime endDate = startDate.AddMonths(1).AddDays(-1);

            string response = client.DownloadString(string.Format(urlFormat, ConfigHelper.GetApiManagementDomain(), startDate.ToString("yyyy-MM-dd"), endDate.ToString("yyyy-MM-dd")));


            RootObject json = Newtonsoft.Json.JsonConvert.DeserializeObject<RootObject>(response);

            AzureUsage usage = new AzureUsage();

            usage.CustomerName = "Dave Nielsen";
            usage.Description = "Invoice " + DateTime.Now.ToShortDateString() + " " + DateTime.Now.ToLongTimeString();
;
            usage.Month = DateTime.Now.Year + "-" + DateTime.Now.ToString("MMMM");
            usage.RatePerCall = 5;
            usage.TotalCalls = json.value.Sum(s => s.callCountSuccess);
            usage.TotalAmount = usage.RatePerCall * usage.TotalCalls;

            return usage;

        }

    }

    public class AzureUsage
    {
        public int TotalCalls { get; set; }
        public int RatePerCall { get; set; }

        public string CustomerName { get; set; }

        public int TotalAmount { get; set; }

        public string Month { get; set; }

        public string Description { get; set; }

        public string StripeCustomerId { get; set; }
    }
    public class MeteredInvoiceViewModel
    {
        public List<Stripe.StripeInvoiceLineItem> Invoices { get; set; }

        public AzureUsage AzureUsage { get; set; }
    }
    public class Value
    {
        public string name { get; set; }
        public string userId { get; set; }
        public int callCountSuccess { get; set; }
        public int callCountBlocked { get; set; }
        public int callCountFailed { get; set; }
        public int callCountOther { get; set; }
        public int callCountTotal { get; set; }
        public int bandwidth { get; set; }
        public int cacheHitCount { get; set; }
        public int cacheMissCount { get; set; }
        public double apiTimeAvg { get; set; }
        public double apiTimeMin { get; set; }
        public double apiTimeMax { get; set; }
        public double serviceTimeAvg { get; set; }
        public double serviceTimeMin { get; set; }
        public double serviceTimeMax { get; set; }
    }

    public class RootObject
    {
        public List<Value> value { get; set; }
        public int count { get; set; }
        public object nextLink { get; set; }
    }
}