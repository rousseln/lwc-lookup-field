public with sharing class wLookupService {
   
    @AuraEnabled
    public static Boolean isAccessible(String sObjectType, String fieldName) {
        try {
            SObjectType schemaType = Schema.getGlobalDescribe().get(sObjectType);
            Map<String, SObjectField> fields = schemaType.getDescribe().fields.getMap();
            DescribeFieldResult fieldDescribe = fields.get(fieldName).getDescribe();
            return fieldDescribe.isAccessible();
        } catch (Exception ex) {
            System.debug('An Exception: '+ex);
            return null;
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static String getSObjectInfo(String lookupObjectApiName){
        try {  
            Schema.DescribeSObjectResult[] describeResult = Schema.describeSObjects( new String[]{lookupObjectApiName});           
            System.debug(describeResult);
            return JSON.serialize(describeResult);
        } catch (Exception ex) {
            System.debug('An Exception: '+ex);
            return null;
        }
    }

    @AuraEnabled
    public static String getSObjectFieldInfo(String lookupObjectApiName){
        try {  
            Map<String, Schema.DescribeFieldResult> fieldsMap = new Map<String, Schema.DescribeFieldResult>();         
             Map<String,Schema.SObjectType> describeResult = Schema.getGlobalDescribe();           
             for(Schema.SObjectField fieldList : describeResult.get(lookupObjectApiName).getDescribe().fields.getMap().Values()) {
                 fieldsMap.put(fieldList.getDescribe().getName(), fieldList.getDescribe(FieldDescribeOptions.FULL_DESCRIBE)); 
             } 
             return JSON.serialize(fieldsMap);
         } catch (Exception ex) {
             System.debug('An Exception: '+ex);
             return null;
         }
    }

    @AuraEnabled
    public static String getExistingRecord(Id recordId, String lookupObjectApiName, String lookupApiRel, Boolean defaultRecord) {
        String query;
        if(defaultRecord == true) {
            query = 'SELECT Id,Name FROM ' + lookupObjectApiName + ' WHERE Id = :recordId';
        } else {
            query = 'SELECT Id, ' + lookupApiRel + '.Name FROM ' + lookupObjectApiName + ' WHERE Id = :recordId';
        }
        try {
            list<sobject> queriedRecord = database.query(query);
            return JSON.serialize(queriedRecord);
        } catch (Exception ex) {
            System.debug('An Exception: '+ex);
            return null;
        }
    }

    @AuraEnabled
    public static String lookupSearch(String queryString, String lookupObjectApiName) {
        string query = 'SELECT Id,Name FROM ' + lookupObjectApiName + ' WHERE Name LIKE ' + '\'%' + String.escapeSingleQuotes(queryString) + '%\'';
        try {
            list<sobject> queriedObj = database.query(query);
            return JSON.serialize(queriedObj);
        } catch (Exception ex) {
            System.debug('An Exception: '+ex);
            return null;
        }
    }

    @AuraEnabled
    public static void updateRecord(Id recordId, String lookupObjectApiName, String lookupFieldApiName, Id newId) {
        String query = 'SELECT Id, ' + lookupFieldApiName + ' FROM ' + lookupObjectApiName + ' WHERE Id = :recordId';
        try {
            SObject queriedObj = database.query(query);
            Object o = queriedObj.get(lookupFieldApiName);
            queriedObj.put(lookupFieldApiName, newId);
            update queriedObj;
        } catch (Exception ex) {
            System.debug('An Exception: '+ex.getMessage());
        }
    }
    
}

