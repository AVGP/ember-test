var App = Ember.Application.create();
   
App.accounts = [];

App.Account = Ember.Object.extend({
    name: "Account",
    transactions: [],
    balance: function() {
        var sum = 0;
        var transactions = this.get("transactions");
        for(var i=0,len=transactions.get("length"); i<len; i++)
            sum += transactions[i].get("amount");
    }.property("transactions.@each")
});

App.Transaction = Ember.Object.extend({
    subject: "Subject for Transaction",
    amount: 0.00
});

for(var a=0; a<3; a++) {
    var account = App.Account.create({
        name: "Account #" + a,
        transactions: []
    });
    App.accounts.push(account);
    for(var t=0; t<3; t++) {
        var transaction = App.Transaction.create({
           subject: "Transaction #" + t + " on account #" + a,
           amount: 100 * (t +1)
        });
        App.accounts[a].transactions.push(transaction);
    }
}


App.ApplicationController = Ember.Controller.extend();
App.ApplicationView = Ember.View.extend({ templateName: 'application' });

App.NavigationController = Ember.ArrayController.extend({content: [{action: "accounts", label: "Accounts"}, {action: "transactions", label: "Transactions"}]});
App.NavigationView = Ember.View.extend({ templateName: "navigation" });

App.AccountsController = Ember.ArrayController.extend({content: App.accounts});
App.AccountsView = Ember.View.extend({ templateName: "accounts" });

App.AccountsContentController = Ember.ArrayController.extend({content: App.accounts});
App.AccountsContentView = Ember.View.extend({ templateName: "accountsContent" });

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
      connectOutlets: function(router, context) {
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
    })    
  })
});

App.initialize();