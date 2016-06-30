using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;

namespace InvoiceAppCombinedSubscription_AspDotNetMVC
{
    public class ConfigHelper
    {

        public static string GetStripeApiKey()
        {
            return ConfigurationManager.AppSettings["StripeApiKey"].ToString();
        }

        public static string GetApiManagementDomain()
        {
            return ConfigurationManager.AppSettings["ApiManagementDomain"].ToString();
        }
        public static string GetAzureApiManagementKey()
        {
            return ConfigurationManager.AppSettings["AzureApiManagementKey"].ToString();
        }
    }
}