public class LineItemStream {
	//number of push events per callout
	public static final Integer PUSH_EVENT_SLICE_SIZE = 250;
	//number of line items in each streaming notification
	public static final Integer LI_SLICE_SIZE = 15;


	//
	public static String generateRandomString(Integer len) {
	    Integer[] chars = new Integer[len];
	    for(Integer idx = 0; idx < len; idx++) chars[idx] = Math.mod(Math.abs(Crypto.getRandomInteger()),26)+97;
	    return String.fromCharArray(chars);
	}

	public static List<String> generateRequestBodiesForLineItems(List<Apttus_Config2__LineItem__c> newLineItems, Id configId) {
		
		String transactionId = generateRandomString(10);
		
		List<String> requestBodies = new List<String>();
		Integer numLineItems = newLineItems.size();
		for (Integer i = 0; i < getNumberOfSlices(numLineItems, PUSH_EVENT_SLICE_SIZE); i++) {
			List<Object> pushEvents = new List<Object>();
			Integer currentPosition = i * PUSH_EVENT_SLICE_SIZE;
			Integer endRequestPosition = (i + 1) * PUSH_EVENT_SLICE_SIZE;
			while (currentPosition < endRequestPosition && currentPosition < numLineItems) {
				List<Object> payloadsForRequest = new List<Object>();
				Integer sliceEnd = numLineItems < currentPosition + LI_SLICE_SIZE ? numLineItems : currentPosition + LI_SLICE_SIZE;
				// payloadsForRequest.add(formatLineItemPayload(newLineItems, currentPosition, sliceEnd, null, null));
				// Map<String,Object> newPushEvent = new Map<String,Object>{'payload' => JSON.serialize(payloadsForRequest), 'userIds' => new List<String>()};
				// pushEvents.add(new Map<String,Object>{'payload' => JSON.serialize(payloadsForRequest), 'userIds' => new List<String>()});
				pushEvents.add(new Map<String,Object>{'payload' => JSON.serialize(formatLineItemPayload(newLineItems, currentPosition, sliceEnd, transactionId, configId)), 'userIds' => new List<String>()});
				currentPosition += LI_SLICE_SIZE;
			}
			Map<String,Object> requestBody = new Map<String,Object>{'pushEvents' => pushEvents};
			requestBodies.add(JSON.serialize(requestBody));
		}
		return requestBodies;
	}



	public static Integer getNumberOfSlices(Integer arrayLength, Integer sliceSize) {
		Integer numSlices = arrayLength / sliceSize;
		return Math.mod(arrayLength, sliceSize) == 0 ? numSlices : numSlices + 1;
	}

	public static Map<String, Object> formatLineItemPayload(List<Apttus_Config2__LineItem__c> lineItems, Integer startIndex, Integer stopIndex, String transactionId, Id configId) {
		Map<String,Object> lineItemPayload = new Map<String,Object>();
		lineItemPayload.put('tId', transactionId);
		lineItemPayload.put('cId', configId);
		List<Object> lineItemArrays = new List<Object>();
		for (Integer i = startIndex; i < stopIndex; i++) {
			Apttus_Config2__LineItem__c lineItem = lineItems[i];
			lineItemArrays.add(formatLineItemArrayForPayload(lineItem));
		}
		lineItemPayload.put('lis', lineItemArrays);
		return lineItemPayload;
	}

	//Format For Line Item Array Must Be the Same:
	//[PRODUCT ID, START DATE, END DATE, Quantity]
	//Array structure is used rather than object to save JSON characters,
	//since streaming payload has character limitations
	//CONFIG Id is the same for all LI and therefore stored at payload level.
	public static List<Object> formatLineItemArrayForPayload(Apttus_Config2__LineItem__c singleLineItem) {
		List<Object> singleLineItemArray = new List<Object>();
		singleLineItemArray.add(singleLineItem.Apttus_Config2__ProductId__c);
		singleLineItemArray.add(singleLineItem.Apttus_Config2__StartDate__c);
		singleLineItemArray.add(singleLineItem.Apttus_Config2__EndDate__c);
		singleLineItemArray.add(singleLineItem.Apttus_Config2__Quantity__c);
		return singleLineItemArray;
	}


	public static void testConnectionWithRequest() {
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
	}

}