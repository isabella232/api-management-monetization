

//This is the default route and it will navigate to the home page of the invoicing application
//This is an aliase for /invoiceApp
exports.default = function (req, res) {
    //res.redirect('/invoiceApp');

    res.render('home/index', 
        {
        app_title: "Subscription Models",
        page_title: "",
        data: null
    });

};
