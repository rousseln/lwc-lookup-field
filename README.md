# lwc-lookup-field
Lightning web component that you can configure to replicate the Salesforce lookup field.

## Features
- Emulates the out-of-the-box Salesforce lookup field
- Individually customized fields
- Full object permissions support for view, create and edit

## Copy contents to your project
Grab the component in the wLookupField/force-app/main/default/lwc folder. You will also need the apex class in wLookupField/force-app/main/default/classes to execute the custom apex methods that make the lookup field work.

## Place the component in code
Add `<c-w-lookup-field></c-w-lookup-field>` in the code.

### Properties
| Property  | Value description |
| ------------- | ------------- |
| `record-id`  | Variable or sting of the record id the lookup field is attached to  |
| `prop-object-api-name` | String value of the object's api name where the lookup field is created |
| `prop-field-api-name` | String value of the lookup field's api name |

## Saving the fields value
1. Add a class to the field, example `<c-w-lookup-field class="my-lookup">`
2. From the parent call `this.template.querySelector('my-lookup').updateNewValue();`