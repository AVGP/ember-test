var App = Ember.Application.create();
   
App.accounts = [];

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

//Generic + Navigation

App.ApplicationController = Ember.Controller.extend();
App.ApplicationView = Ember.View.extend({ templateName: 'application' });

App.NavigationController = Ember.ArrayController.extend({content: [{action: "accounts", label: "Accounts"}, {action: "transactions", label: "Transactions"}]});
App.NavigationView = Ember.View.extend({ templateName: "navigation" });

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
        console.log("Go for " + urlParams.id);
        for(var i=0, len = App.accounts.length; i<len; i++) {
            if(App.accounts[i].get("id") == urlParams.id) return App.accounts[i];
        }
        return null
      }
    })
  })
});

App.initialize();