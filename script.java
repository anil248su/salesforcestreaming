// Insert Account
Account newAccount = new Account();
newAccount.Name = 'NSApttusLI Test Account';
insert newAccount;

// Insert Opportunity
Opportunity newOpportunity = new Opportunity();
newOpportunity.Name = 'NSApttusLI Test Opp';
newOpportunity.AccountId = newAccount.Id;
newOpportunity.CloseDate = Date.today().addDays(10);
newOpportunity.StageName = '2- Pipeline';
insert newOpportunity;

// Insert Quote
Apttus_Proposal__Proposal__c newApttusQuote = new Apttus_Proposal__Proposal__c();
// newApttusQuote.Deployment_Population_Size__c = 
newApttusQuote.Apttus_Proposal__Opportunity__c = newOpportunity.Id;
newApttusQuote.Apttus_Proposal__Account__c = newAccount.Id;
insert newApttusQuote;

// Insert Product Configuration
Apttus_Config2__ProductConfiguration__c newProductConfig = new Apttus_Config2__ProductConfiguration__c();
// newProductConfig.Apttus_QPConfig__Proposald__c = 'a8U190000009xUVEAY'; //newApttusQuote
newProductConfig.Apttus_QPConfig__Proposald__c = newApttusQuote.Id;
insert newProductConfig;

//Apttus_Config2__OptionId__r.ProductCode

//Select Id From Apttus_Config2__PriceListItem__c Limit 1


// We need a pricelist, product, and pricelist line item
Apttus_Config2__PriceList__c pl = APTS_LiveTesting.createUSDPriceList('WD Price List');
insert pl;
Product2 pr2 = APTS_LiveTesting.createProduct('Product A', 'Product A');
insert pr2;
Apttus_Config2__PriceListItem__c pli = APTS_LiveTesting.createPriceListItem(pl.Id, pr2.Id);
insert pli;
Apttus_Config2__LineItem__c lineItem0 = APTS_LiveTesting.createLineItem(pl.id, newProductConfig.id, pr2.id, pli.id);
insert lineItem0;


//moving forward

Apttus_Config2__PriceList__c pl = [SELECT Id FROM Apttus_Config2__PriceList__c LIMIT 1][0];
Product2 pr2 = [SELECT Id FROM Product2 ORDER BY CreatedDate DESC LIMIT 1][0];
Apttus_Config2__PriceListItem__c pli = [SELECT Id FROM Apttus_Config2__PriceListItem__c ORDER BY CreatedDate DESC LIMIT 1][0];
Apttus_Config2__ProductConfiguration__c newProductConfig = [SELECT Id FROM Apttus_Config2__ProductConfiguration__c ORDER BY CreatedDate DESC LIMIT 1][0];
List<Apttus_Config2__LineItem__c> newLineItems = new List<Apttus_Config2__LineItem__c>();
for (Integer i = 2; i < 200; i++) {
	Apttus_Config2__LineItem__c newApttusLineItem = APTS_LiveTesting.createLineItem(pl.id, newProductConfig.id, pr2.id, pli.id);
	newLineItems.add(newApttusLineItem);
}
LineItemStream.generateRequestBodiesForLineItems(newLineItems, newProductConfig.Id);


insert newLineItems;





//disable APTPS_ProductConfigurationTriggerHandler line 464

// APTS_TestSetup.createLineItem(ID priceListId, ID cartId, ID product2Id, ID priceListItemId)

// Insert Line Item
Apttus_Config2__LineItem__c newApttusLineItem = new Apttus_Config2__LineItem__c();
newApttusLineItem.Apttus_Config2__ConfigurationId__c = newProductConfig.Id;
// newApttusLineItem.Apttus_Config2__ConfigurationId__c = 'aA11900000003L8CAI'; //newApttusLineItem
newApttusLineItem.Apttus_Config2__ItemSequence__c = 1;
newApttusLineItem.Apttus_Config2__LineNumber__c = 1;
newApttusLineItem.Apttus_Config2__PricingDate__c = Date.today().addDays(6);
newApttusLineItem.Apttus_Config2__LineType__c = 'Misc';
newApttusLineItem.Apttus_Config2__StartDate__c = Date.today();
newApttusLineItem.Apttus_Config2__EndDate__c = Date.today().addDays(365);

// newApttusLineItem. '01t1B00000704Jr'; // 

insert newApttusLineItem;






List<Apttus_Config2__LineItem__c> newLineItems = new List<Apttus_Config2__LineItem__c>();
for (Integer i = 2; i < 200; i++) {
	Apttus_Config2__LineItem__c newApttusLineItem = new Apttus_Config2__LineItem__c();
	newApttusLineItem.Apttus_Config2__ConfigurationId__c = 'aA11900000003L8CAI'; //newApttusLineItem
	newApttusLineItem.Apttus_Config2__ItemSequence__c = i;
	newApttusLineItem.Apttus_Config2__LineNumber__c = i;
	newApttusLineItem.Apttus_Config2__PricingDate__c = Date.today().addDays(6);
	newApttusLineItem.Apttus_Config2__LineType__c = 'Misc';
	newLineItems.add(newApttusLineItem);
}
insert newLineItems;







lineItem0.Apttus_Config2__StartDate__c = System.today().addDays(-15);
lineItem0.APTS_ProductRampStartDate__c = lineItem0.Apttus_Config2__StartDate__c;
lineItem0.Apttus_Config2__EndDate__c = System.today().addYears(3);
lineItem0.APTS_ProductRampEndDate__c = lineItem0.Apttus_Config2__EndDate__c;
lineItem0.APTS_ProductRampBy__c = 3;
lineItem0.APTS_ProductRampPeriod__c = 'Yearly';
lineItem0.APTS_PeriodNumber__c = 1;
lineItem0.Apttus_Config2__SellingFrequency__c = 'Yearly';
lineItem0.Apttus_Config2__IsPrimaryRampLine__c = true;
lineItem0.Apttus_Config2__AssetLineItemId__c = ali.Id;








StreamingChannel lineItemChannel = new StreamingChannel();
lineItemChannel.Name = '/u/LineItemBroadcast';
insert lineItemChannel;


String sfdcURL = URL.getSalesforceBaseUrl().toExternalForm();
String restAPIURL = sfdcURL + '/services/data/v38.0/sobjects/StreamingChannel/0M6190000008OPOCA2/push'; 
HttpRequest httpRequest = new HttpRequest(); 
httpRequest.setMethod('POST');  
httpRequest.setHeader('Authorization', 'OAuth ' + UserInfo.getSessionId());       
httpRequest.setHeader('Authorization', 'Bearer ' + UserInfo.getSessionID());
httpRequest.setEndpoint(restAPIURL); 
httpRequest.setHeader('Content-Type', 'application/json');
List<Map<String,Object>> pushEvents = new List<Map<String,Object>>();
for (Integer i = 0; i < 200; i++) {
	Map<String,Object> newPushEvent = new Map<String,Object>{'payload' => JSON.serialize(new Map<String,Object>{'testPayload' => new Map<String,Object>{'payload' => 'yay'}}), 'userIds' => new List<String>()};
	pushEvents.add(newPushEvent); 
}
Map<String,Object> requestBody = new Map<String,Object>{'pushEvents' => pushEvents};
System.debug(JSON.serialize(requestBody));
httpRequest.setBody(JSON.serialize(requestBody));
String response = '';
// try { 
Http http = new Http();  
HttpResponse httpResponse = http.send(httpRequest); 
if (httpResponse.getStatusCode() == 200 ) { 
     response = JSON.serializePretty( JSON.deserializeUntyped(httpResponse.getBody()) ); 
} else { 
     System.debug(' httpResponse ' + httpResponse.getBody() ); 
     throw new CalloutException( httpResponse.getBody() ); 
 }  
// } catch( System.Exception e) { 
//          System.debug('ERROR: '+ e); 
//          throw e; 
// } 
// System.debug(' ** response ** : ' + response ); 












Apttus_Config2__PriceList__c pl = [SELECT Id FROM Apttus_Config2__PriceList__c LIMIT 1][0];
Product2 pr2 = [SELECT Id FROM Product2 ORDER BY CreatedDate DESC LIMIT 1][0];
Apttus_Config2__PriceListItem__c pli = [SELECT Id FROM Apttus_Config2__PriceListItem__c ORDER BY CreatedDate DESC LIMIT 1][0];
Apttus_Config2__ProductConfiguration__c newProductConfig = [SELECT Id FROM Apttus_Config2__ProductConfiguration__c ORDER BY CreatedDate DESC LIMIT 1][0];
List<Apttus_Config2__LineItem__c> newLineItems = new List<Apttus_Config2__LineItem__c>();
for (Integer i = 0; i < 201; i++) {
	Apttus_Config2__LineItem__c newApttusLineItem = APTS_LiveTesting.createLineItem(pl.id, newProductConfig.id, pr2.id, pli.id);
	newLineItems.add(newApttusLineItem);
}
List<String> reqBodies = LineItemStream.generateRequestBodiesForLineItems(newLineItems, newProductConfig.Id);
// Dev_Log__c dLog = new Dev_Log__c(Message__c = reqBodies[0]);
// insert dLog;


String sfdcURL = URL.getSalesforceBaseUrl().toExternalForm();
String restAPIURL = sfdcURL + '/services/data/v38.0/sobjects/StreamingChannel/0M6190000008OPOCA2/push'; 

HttpRequest httpRequest = new HttpRequest(); 
httpRequest.setMethod('POST');  
httpRequest.setHeader('Authorization', 'OAuth ' + UserInfo.getSessionId());       
httpRequest.setHeader('Authorization', 'Bearer ' + UserInfo.getSessionID());
httpRequest.setEndpoint(restAPIURL); 
httpRequest.setHeader('Content-Type', 'application/json');

System.debug(reqBodies[0]);
httpRequest.setBody(reqBodies[0]);
String response = '';
// try { 
Http http = new Http();  
HttpResponse httpResponse = http.send(httpRequest); 
System.debug(' httpResponse ' + httpResponse.getBody() ); 
