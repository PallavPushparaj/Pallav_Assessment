import { LightningElement, api, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { getRecord } from 'lightning/uiRecordApi';
//import { showToast } from 'c/util';

 

import getRelatedListData from '@salesforce/apex/RelatedListController.getRelatedListData';

 

export default class RelatedList extends LightningElement {
    @api recordId;
    @api objectApiName;
    @api relatedListApiName;
    @api columnsConfig;
    @api relatedListTitle;
    @api keyField = 'Id';

 

    columns = [];
    data = [];
    sortedBy;
    sortedDirection;
    wiredRelatedList;

 

    @wire(getRecord, { recordId: '$recordId', fields: '$columnsConfig' })
    wiredRecord({ error, data }) {
        if (data) {
            const columns = [];
            JSON.parse(this.columnsConfig).forEach(field => {
                columns.push({
                    fieldName: field.fieldApiName,
                    label: field.label,
                    type: field.type,
                    sortable: true
                });
            });
            this.columns = columns;
        } else if (error) {
            showToast('Error', error.message, 'error');
        }
    }

 

    @wire(getRelatedListData, { recordId: '$recordId', objectApiName: '$objectApiName', relatedListApiName: '$relatedListApiName' })
    wiredRelatedListData(value) {
        this.wiredRelatedList = value;
        if (value.data) {
            this.data = value.data;
        } else if (value.error) {
            showToast('Error', value.error.message, 'error');
        }
    }

 

    handleSort(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        this.data = this.sortData(this.sortedBy, this.sortedDirection);
    }

 

    sortData(fieldname, direction) {
        let parseData = JSON.parse(JSON.stringify(this.data));
        let keyValue = (a) => {
            return a[fieldname];
        };
        let isReverse = direction === 'asc' ? 1: -1;
        parseData.sort((x,y) => {
            x = keyValue(x) ? keyValue(x) : ''; 
            y = keyValue(y) ? keyValue(y) : '';
            return isReverse * ((x > y) - (y > x));
        });
        return parseData;
    }

 

    handleRowAction(event) {
        const action = event.detail.action;
        const row = event.detail.row;

 

        switch (action.name) {
            case 'edit':
                this.dispatchEvent(new CustomEvent('edit', { detail: row }));
                break;
            case 'delete':
                this.handleDelete(row);
                break;
        }
    }

 

    handleDelete(row) {
        // perform delete operation using Apex
        // then refresh the related list
        refreshApex(this.wiredRelatedList)
            .then(() => {
                showToast('Success', 'Record deleted', 'success');
            })
            .catch(error => {
                showToast('Error', error.message, 'error');
            });
    }
}