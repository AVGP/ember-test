var App = Ember.Application.create({lang: "de"});

///// This is the nasty shit. There is a open pull-request on Ember.js.    /////
///// Hopefully it's merged soon!                                          /////
////////////////////////////////////////////////////////////////////////////////

var inlineFormatter = function(fn) {
  return Ember.View.extend({
    tagName: 'span',

    template: Ember.Handlebars.compile('{{view.formattedContent}}'),

    languageBinding: "App.lang",

    formattedContent: (function() {
      if (this.get('content') != null && this.get('language') != null) {
        return fn(this.get('content'),this.get('language'));
      }
    }).property('language')
  });
};

App.registerBoundHelper = function(name, view) {
  Ember.Handlebars.registerHelper(name, function(property, options) {
    if(Ember.getPath(this, property))
        options.hash.contentBinding = property;
    else //this is a string identifier, no binding!
        options.hash.content = property;
    return Ember.Handlebars.helpers.view.call(this, view, options);
  });
};

// Alright, actual stuff starts:

App.accounts = [];

App.strings = {
    "en": {
        "_Account": "Account",
        "_Accounts": "Accounts",
        "_Transactions": "Transactions",
        "_Balance": "Balance"
    },
    "de": {
        "_Account": "Konto",
        "_Accounts": "Konten",
        "_Transactions": "Transaktionen",
        "_Balance": "Kontostand"
    }    
};
App.langs = ["de", "en"];


App.registerBoundHelper('loc', inlineFormatter(function(key, lang){
    Ember.STRINGS = App.strings[lang];
    var prop = Ember.getPath(this, key);
    if(prop) prop = prop.toString(); //Dynamic property from the controller/view
    else prop = key; //Just pass the string through
    return Ember.String.loc(prop);
}));

App.Account = Ember.Object.extend({
    balance: function() {
        var sum = 0;
        var transactions = this.get("transactions");
        for(var i=0,len=transactions.get("length"); i<len; i++)
            sum += transactions[i].get("amount");
        return sum;
    }.property("transactions.@each")
});

App.Transaction = Ember.Object.extend({
    subject: "Subject for Transaction",
    amount: 0.00
});

for(var a=0; a<3; a++) {
    var account = App.Account.create({
        id: a + 1,
        transactions: [],
        name: "Account #" + a
    });
    App.accounts.push(account);
    for(var t=0; t<3; t++) {
        var transaction = App.Transaction.create({
           subject: "Transaction #" + t + " on account #" + a,
           amount: 100 * (a + 1) * (t +1),
           id: a + t + 1
        });
        App.accounts[a].transactions.push(transaction);
    }
}

App.mainMenu = Ember.Object.create({
    items: Ember.A([
        Ember.Object.create({action: "accounts", label: "_Accounts"}), 
        Ember.Object.create({action: "transactions", label: "_Transactions"})
    ])
});

//Generic + Navigation

App.ApplicationController = Ember.Controller.extend({ lang: "de", langs: App.langs});
App.ApplicationView = Ember.View.extend({ 
    templateName: 'application', 
    setLang: function(event) { 
        App.set("lang",event.context); 
    }
});

App.NavigationController = Ember.ArrayController.extend({content: App.mainMenu.get("items")});
App.NavigationView = Ember.View.extend({ templateName: "navigation" });

//App.addObserver("lang", function() { Ember.STRINGS = App.strings[App.get("lang")]; console.log(Ember.STRINGS); App.ApplicationView.langChanged(); });

//Accounts

App.AccountsController = Ember.ArrayController.extend({content: App.accounts});
App.AccountsView = Ember.View.extend({ templateName: "accounts" });

App.AccountsContentController = Ember.ArrayController.extend({content: App.accounts});
App.AccountsContentView = Ember.View.extend({ templateName: "accountsContent" });

App.SingleAccountController = Ember.ObjectController.extend();
App.SingleAccountView = Ember.View.extend({ templateName: "singleAccount" });

//Transactions

App.TransactionsController = Ember.Controller.extend();
App.TransactionsView = Ember.View.extend({ templateName: "transactions" });

App.TransactionsContentController = Ember.Controller.extend();
App.TransactionsContentView = Ember.View.extend({ templateName: "transactionsContent" });

App.Router = Ember.Router.extend({
  enableLogging: true,
  root: Ember.Route.extend({
    index: Ember.Route.extend({
      route: '/',
      
      showNavItem: Ember.Route.transitionTo('subnav'),
      connectOutlets: function(router, context) {
          router.get("applicationController").connectOutlet("mainNav", "navigation");
      }
    }),
    subnav: Ember.Route.extend({
      route: '/:navItem',
      showNavItem: Ember.Route.transitionTo('subnav'),
      showAccount: Ember.Route.transitionTo("specificAccount"),
      connectOutlets: function(router, context) { //The following lines are me being stupid (in lack of a better way of doing it)
          router.get("applicationController").connectOutlet("mainNav", "navigation");
          router.get("applicationController").connectOutlet("subNav", context);
          router.get("applicationController").connectOutlet("content", context+"Content");
      },
      serialize: function(router, context) {
        return { navItem: context };
      },
      deserialize: function(router, urlParams){
        return urlParams.navItem;
      }
    }),
    specificAccount: Ember.Route.extend({
      route: '/accounts/:id',
      showNavItem: Ember.Route.transitionTo('subnav'),
      showAccount: Ember.Route.transitionTo("specificAccount"),
      connectOutlets: function(router, context) {
        router.get("applicationController").connectOutlet("mainNav", "navigation");
        router.get("applicationController").connectOutlet("subNav", "accounts");
        router.get("applicationController").connectOutlet("content", "singleAccount", context);
      },
      serialize: function(router, context) {
        return { id: context.id };
      },
      deserialize: function(router, urlParams){
        for(var i=0, len = App.accounts.length; i<len; i++) {
            if(App.accounts[i].get("id") == urlParams.id) return App.accounts[i];
        }
        return null
      }
    })
  })
});

App.initialize();