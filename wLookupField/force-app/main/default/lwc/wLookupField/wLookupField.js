import { LightningElement, api } from 'lwc';
import isAccessible from '@salesforce/apex/wLookupService.isAccessible';
import getSObjectInfo from '@salesforce/apex/wLookupService.getSObjectInfo';
import getSObjectFieldInfo from '@salesforce/apex/wLookupService.getSObjectFieldInfo';
import lookupSearch from '@salesforce/apex/wLookupService.lookupSearch';
import getExistingRecord from '@salesforce/apex/wLookupService.getExistingRecord';
import updateRecord from '@salesforce/apex/wLookupService.updateRecord';
import { NavigationMixin } from 'lightning/navigation';
import { encodeDefaultFieldValues } from 'lightning/pageReferenceUtils';


export default class WLookupField extends NavigationMixin(LightningElement) {
    @api recordId;
    @api propObjectApiName;
    @api propFieldApiName;
    @api propDefaultRecordId;
    
    dataReady = false;
    dataLoaded = false;
    canView;
    canCreate;
    canUpdate;
    selected;
    searching;
    selection;
    results;
    
    _fieldApiRelationship;
    _searchObject;
    _objectInfo;

    @api updateNewValue = () => {
      updateRecord({
        recordId: this.selection[0].Id,
        lookupObjectApiName: this.propObjectApiName,
        lookupFieldApiName: this.propFieldApiName,
        newId: this.selection.NewId
      })
      .then(result => {
        console.log('Updated:', result);
      }).catch(error => {
        console.log('view error:', error);
      });
    }
    @api value = () => {
        return this.selection;
    }
    
    constructor(){
        super();
    }
    connectedCallback() {
    /*  if(this.recordId === undefined) {
        return console.log('data not ready');
      } else { */
        isAccessible({sObjectType: this.propObjectApiName, fieldName: this.propFieldApiName}).then(
          access => {
            if(access != undefined) {
              this.canView = access;        
              this.selected = false;
              getSObjectInfo({lookupObjectApiName: this.propObjectApiName}).then(
                result => {
                    this._objectInfo = JSON.parse(result);
                    getSObjectFieldInfo({lookupObjectApiName: this.propObjectApiName}).then(
                        result => {
                            this._objectInfo[0].fields = JSON.parse(result);
                            const objFields = this._objectInfo[0].fields[this.propFieldApiName];
                            this.canUpdate = objFields.updateable;
                            this.dataLoaded = true;
                            this._fieldApiRelationship = objFields.relationshipName;
                            this._searchObject = objFields.referenceTo[0];
                            this.checkForSelected();
                            getSObjectInfo({lookupObjectApiName: this._searchObject}).then(
                              sResult => {
                                let parsed = JSON.parse(sResult);
                                console.log('parsed', parsed);
                                this.canCreate = parsed[0].createable;
                            });                        
                        }
                    ).catch(ferror => {
                        console.log('fields error:', ferror);
                    });
                }
              ).catch(oerror => {
                  console.log('object error:', oerror);
              });
            } else {
              this.canView = false;
            }
          }
        ).catch(error => {
          console.log('view error:', error);
        });
        //** check for permission to create new record
        
     //}
    }

    get fieldLabel() {
        const data = this._objectInfo
        if(this.dataLoaded === true) {
            const objFields = this._objectInfo[0].fields[this.propFieldApiName];
            return objFields.label;
        } else {
            return 'Label not defined';
        }
    }

    checkForSelected = (id) => {
      let existingOrDefaultRecord = this.recordId;
      let lookupObj = this.propObjectApiName;
      let checkDefault = false;
      if(this.propDefaultRecordId != undefined) {
       // true; build checkDefault. Maybe return value in apex? Need to pass the default id from prop instad of record id?
        
        existingOrDefaultRecord = this.propDefaultRecordId;
        lookupObj = this._searchObject;
        checkDefault = true;
      }
        getExistingRecord({
          recordId: existingOrDefaultRecord,
          lookupObjectApiName: lookupObj,
          lookupApiRel: this._fieldApiRelationship,
          defaultRecord: checkDefault
        })
        .then(result => {
          this.selection = JSON.parse(result);
          console.log('selection ', this.selection);
          if(this.selection.length > 0) {
            let objectType;
            if(this.propDefaultRecordId != undefined) {
              objectType = this.selection[0].attributes.type;
              this.selection.Name = this.selection[0].Name;
            } else {
              objectType = this.selection[0][this._fieldApiRelationship].attributes.type;
              this.selection.Name = this.selection[0][this._fieldApiRelationship].Name;
            }
            this.selection.Icon = this.getIcon(objectType);
            this.selected = true;
          }
        })
        .catch(error => {
            console.log('error:', error);
        });
    }

    handleFocus = () => {
      let delay = setTimeout(() => {
        this.searching = !this.searching;
      }, 200);
    }

    handleCreate = (event) => {
      const defaultValues = encodeDefaultFieldValues({
        WhatId: this.recordId
      });

      this[NavigationMixin.Navigate]({
        type: 'standard__objectPage',
        attributes: {
            objectApiName: this._searchObject,
            actionName: 'new'
        },
        state: {
            defaultFieldValues: defaultValues
        }
      });
    }
   
    handleRemove = (event) => {
      this.selected = false;
      this.searching = false;
      this.results = [];
      let delay = setTimeout(() => {
        let fieldFocus = this.template.querySelector('lightning-input[data-name="search"]').focus();
      }, 100);
    }

    handleSearch = (event) => {
        let value = event.target.value;
        if(value != '') {
            this.searching = true;
            lookupSearch({
                queryString: value,
                lookupObjectApiName: this._searchObject
            })
            .then(result => {
                this.results = JSON.parse(result);
                this.results.forEach(item => {
                    let objectType = item.attributes.type;
                    item.Icon = this.getIcon(objectType);
                });
                
            })
            .catch(error => {
                console.log('error:', error);
            })
        } else {
            this.searching = false;
        }
    }

    hangleSelected = (event) => {
      let evtId = event.currentTarget.dataset.id;
      console.log('evtId', evtId);
      let matchSelected = this.results.filter(item => item.Id === evtId);
      console.log('matchSelected', matchSelected);
      this.selection.Icon = matchSelected[0].Icon;
      this.selection.Name = matchSelected[0].Name;
      this.selection.NewId = matchSelected[0].Id;
      this.selected = true;
      this.searching = false;
      console.log('selection', this.selection);
    }

    handleDefault = () => {
      this.searching = true;
      lookupDefault({
        record: this.defaultRecordId,
        lookupObjectApiName: this._searchObject
    });

    }

    getIcon = (objApiName) => {
        switch(objApiName) {
            case 'Account':
              return 'standard:account';
            case 'Asset':
              return 'standard:asset_object';
            case 'Campaign':
              return 'standard:campaign';
            case 'Case':
              return 'standard:case';
            case 'Contact':
              return 'standard:contact';
            case 'Contract':
              return 'standard:contract';
            case 'Customer':
              return 'standard:customers';
            case 'EmailMessage':
              return 'standard:email';
            case 'Event':
              return 'standard:event';
            case 'Individual':
              return 'standard:individual';
            case 'Lead':
              return 'standard:lead';
            case 'Opportunity':
              return 'standard:opportunity';
            case 'Order':
              return 'standard:orders';
            case 'Pricebook2':
              return 'standard:pricebook';
            case 'Task':
              return 'standard:task';
              case 'User':
              return 'standard:user';
            default:
              return 'standard:custom';
        }
    }
    
    

}
