public with sharing class PubsubController {
    public class PublishException extends Exception {}
    /*
     * Publish Platform Event from Dynamic Name and Fields    
     */
    @AuraEnabled
    public static List<Map<String,Object>> publishPlatformEvent(String objectApiName, List<RecordField> fields){
        List<Map<String,Object>> output = new List<Map<String,Object>>();
        List<sObject> newEvents = new List<sObject>();

        // sObject newRecord = Schema.getGlobalDescribe().get(objectApiName).newSObject();
        sObject newRecord = (sObject)Type.forName(objectApiName).newInstance();
        for(RecordField field:fields) {
            newRecord.put(field.key, field.value);
        }
        // Add Event 
        newEvents.add(newRecord);
        
        // Call method to publish events
        List<Database.SaveResult> results = EventBus.publish(newEvents);
        // Inspect publishing result for each event
        List<Database.Error> resultsErrors = new  List<Database.Error>();
        for (Database.SaveResult sr : results) {
            Map<String,Object> resultMap = new Map<String,Object>();
            if (sr.isSuccess()) {
                System.debug('DEBUG ' + sr.getId());
                resultMap.put('id',sr.getId());
            } else {
                resultsErrors.addAll(sr.getErrors());
            } 
            resultMap.put('success',sr.isSuccess());
            output.add(resultMap);      
        }
        if(resultsErrors.size()>0) {
            String[] messages = new List<String>();
            for(Database.Error err: resultsErrors) {
                messages.add(err.getMessage());
            }
            throw new PublishException(String.join(messages,','));
        }
        return output;
    }

    public class RecordField {
        @AuraEnabled
        public string key {get;set;}
        @AuraEnabled
        public string value {get;set;}
        public RecordField(){}
        public RecordField(string key, string value){
            this.key = key;
            this.value = value;
        }
    }
}
   
