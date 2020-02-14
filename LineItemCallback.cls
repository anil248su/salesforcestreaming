@RestResource(urlMapping='/LineItemCallback/*')
global with sharing class LineItemCallback {
    
	public static void deleteOldLineItems(List<Object> lineItemIds) {
		List<Apttus_Config2__LineItem__c> lineItemsToDelete = new List<Apttus_Config2__LineItem__c>();
		for (Object liid : lineItemIds) {
			lineItemsToDelete.add(new Apttus_Config2__LineItem__c(Id = (Id) liid));
		}
		delete lineItemsToDelete;
	}

	public static List<Apttus_Config2__LineItem__c> generateLineItems(List<Object> newLineItems) {
		List<Apttus_Config2__LineItem__c> lineItems = new List<Apttus_Config2__LineItem__c>();
		for (Object newLineItemParamsUncast : newLineItems) {
			Map<String,Object> newLineItemParams = (Map<String,Object>) newLineItemParamsUncast;
			Apttus_Config2__LineItem__c newLineItemRecord = new Apttus_Config2__LineItem__c();
			for (String field : newLineItemParams.keySet()) {
				newLineItemRecord.put(field, newLineItemParams.get(field));
			}
			lineItems.add(newLineItemRecord);
		}
		return lineItems;
	}

    @HttpPost
    global static String doPost() {
        
        RestRequest req = RestContext.request;
    	Map<String, Object> params = (Map<String, Object>)JSON.deserializeUntyped(req.requestbody.tostring());
    	APTS_RampUtils.InputPayload payload = new APTS_RampUtils.InputPayload();
    	payload.cartId = null;
    	APTS_FSERampController.updatePriceForCart(payload);
        Dev_Log__c newLog = new Dev_Log__c(Message__c = 'cpq method called');
        insert newLog;
        return 'Custom Endpoint';
    }
}