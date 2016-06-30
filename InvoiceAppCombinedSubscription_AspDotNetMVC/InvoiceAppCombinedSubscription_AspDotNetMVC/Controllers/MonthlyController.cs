using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace InvoiceAppCombinedSubscription_AspDotNetMVC.Controllers
{
    public class MonthlyController : Controller
    {
        // GET: Monthly
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
            Stripe.StripeCustomer customer = GetCustomers(id);
            return View(customer.StripeSubscriptionList.StripeSubscriptions);
        }

        private static Stripe.StripeCustomer GetCustomers(string id)
        {
            Stripe.StripeCustomerService customerService = new Stripe.StripeCustomerService();
            customerService.ApiKey = ConfigHelper.GetStripeApiKey();
            Stripe.StripeCustomer customer = customerService.Get(id);
            return customer;
        }
        public ActionResult CancelSubscription(string customerId, string subscriptionId)
        {
            SetCustomerId(customerId);
            Stripe.StripeSubscriptionService subscriptionService = new Stripe.StripeSubscriptionService();
            subscriptionService.ApiKey = ConfigHelper.GetStripeApiKey();

            subscriptionService.Cancel(customerId, subscriptionId);
            Response.Redirect(Url.RouteUrl(new { controller = "Monthly", action = "Customer", id = customerId }));
            return View();
        }

        public ActionResult CreateSubscription(string customerId, string subscriptionId)
        {
            SetCustomerId(customerId);
            Stripe.StripeSubscriptionService subscriptionService = new Stripe.StripeSubscriptionService();
            subscriptionService.ApiKey = ConfigHelper.GetStripeApiKey();

            subscriptionService.Create(customerId, "MonthlyPlan");

            Response.Redirect(Url.RouteUrl(new { controller = "Monthly", action = "Customer", id = customerId }));
            return View();
        }

        private void SetCustomerId(string id)
        {
            ViewBag.CustomerId = id;
        }

    }
}