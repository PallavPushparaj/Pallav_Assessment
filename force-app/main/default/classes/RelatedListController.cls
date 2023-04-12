public with sharing class RelatedListController {
    @AuraEnabled(cacheable=true)
    public static List<sObject> getRelatedListData(Id recordId, String objectApiName, String relatedListApiName) {
        String soqlQuery = 'SELECT ';
        Map<String, Schema.SObjectField> fieldMap = Schema.getGlobalDescribe().get(objectApiName).getDescribe().fields.getMap();
        Map<String, Schema.ChildRelationship> childRelationshipMap = Schema.getGlobalDescribe().get(objectApiName).getDescribe().getChildRelationshipsByName();
        List<String> selectedFields = new List<String>();
        List<String> childRelationshipNames = new List<String>();
        for (String fieldName : fieldMap.keySet()) {
            if (fieldMap.get(fieldName).getDescribe().isAccessible()) {
                selectedFields.add(fieldName);
            }
        }
        for (String childRelationshipName : childRelationshipMap.keySet()) {
            if (childRelationshipMap.get(childRelationshipName).getRelationshipName() == relatedListApiName) {
                childRelationshipNames.add(childRelationshipMap.get(childRelationshipName).getChildSObject().getDescribe().getName());
            }
        }
        soqlQuery += String.join(selectedFields, ',');
        if (childRelationshipNames.size() > 0) {
            for (String childRelationshipName : childRelationshipNames) {
                soqlQuery += ', (SELECT ' + String.join(selectedFields, ',') + ' FROM ' + childRelationshipName + ' WHERE ' + childRelationshipMap.get(childRelationshipName + '.' + relatedListApiName).getField() + ' = \'' + recordId + '\')';
            }
        }
        soqlQuery += ' FROM ' + objectApiName + ' WHERE Id = \'' + recordId + '\'';
        List<sObject> records = Database.query(soqlQuery);
        return records;
    }
}
