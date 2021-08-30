@isTest
private class PubsubControllerTest {

     @isTest static void testSuccessPublishEvent() {

        Test.startTest();
        String objectApiName = 'PubSubMessage__e';
        List<PubsubController.RecordField> fields = new List<PubsubController.RecordField>{
            new PubsubController.RecordField('Source__c', 'SF'),
            new PubsubController.RecordField('Message__c', 'Hello'),
            new PubsubController.RecordField('UUID__c', '123')
        };
        List<Object> output = PubsubController.publishPlatformEvent(objectApiName, fields);
        // Deliver test events
        Test.getEventBus().deliver();
        // Verify Results
        System.assertEquals(1, output.size());

        Test.stopTest();

    }
     @isTest static void testErrorPublishEvent() {
        String objectApiName = 'PubSubMessage__e';
        Boolean failed = false;
        Test.startTest();
        try {
            // Empty fields no required fields fail
            List<PubsubController.RecordField> fields = new List<PubsubController.RecordField>{};
            PubsubController.RecordField field = new PubsubController.RecordField();
                field.key = 'Source__c';
                field.value = 'SF';
                
            List<Map<String,Object>> output = (List<Map<String,Object>>)PubsubController.publishPlatformEvent(objectApiName, fields);
            System.assertEquals(1, output.size());
            List<Database.Error> errors = (List<Database.Error>)output[0].get('errors');
            System.assertEquals(1, errors.size());
            System.assertEquals('You must enter a value: UUID__c', errors[0].getMessage());
        }
        catch(Exception ex){
            failed = true;
        }
       System.assertEquals(true, failed);

        Test.stopTest();

    }

/* https://developer.salesforce.com/docs/atlas.en-us.platform_events.meta/platform_events/platform_events_test_deliver.htm */

}
   
