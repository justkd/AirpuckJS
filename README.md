# AirpuckJS Readme
v 2.0  
Copyright 2019 justKD  
MIT License  

AirpuckJS is a vanilla JS helper for [Airtable](https://airtable.com/). Does not require NodeJS or AirtableJS.  
Version 2.0 is a complete re-write. Background processess have been improved and general use has been simplified.

## Install
AirpuckJS can be included via CDN. 
```
<script src="https://cdn.jsdelivr.net/gh/justKD/AirpuckJS@master/airpuck.min.js"></script>
```


## Try it out at:
https://codepen.io/justKD/pen/BaapgZJ


## Getting your API Key and Base ID
- Go to the Airtable API  - https://airtable.com/api
- Log in if prompted
- Select the base you want to work with
- Check the "Show API Key" box in the top right
- Check the authentication section, and see something like: 
`$ curl https://api.airtable.com/v0/appqAIFn2dZxGMIty/Table%201?api_key=keyRvIqOJ3I393sB3`
- In the example url above: 
    Base ID = appqAIFn2dZxGMIty
    Table Name = Table 1 (after removing the escaped space)
    Api Key = keyRvIqOJ3I393sB3


## Use
Create a `new Airpuck.Table()` and pass in the name, base ID, and API key in an options object. 
Wrapping calls in the optional callback function ensures the table is initialized before being acted on.
```
const table = new Airpuck.Table({
    name: "Table Name",
    baseID: "Your Base ID",
    apiKey: "Your API Key"
}, _ => {
    console.log(table.records())
})
```
 
### Add a record
A record must be formatted for Airtable. A new record is expected to have a `fields` property, which is an object containing `key:value` pairs where `keys` are the exact names of the fields in the table. AirpuckJS tables can create a new empty record with known fields using the `new table.record()` constructor.
- Create an empty record.
- Change the values for desired fields.
- Add the new record.
- Add a callback function on success.
```
const record = new table.record()
record.fields['Name'] = 'new test record'
table.add(record, _ => {
    console.log(table.records())
})
```

### Add a record with attachments
Airtable attachment fields require attachment objects be passed in an array. An attachment object must contain a URL and may optionally include a new file name. Multiple attachments can be passed in the array. Airtable will download the file at the given URL and keep its own copy. Use `table.attachment()` to create properly formatted attachment objects.
```    
const record = new table.record()
record.fields['A Text File'] = [table.attachment('//url/for/file.txt', 'optional new file name.jpg')]
table.add(record, _ => {
    console.log(table.records())
})
```

### Update a record
Requires an existing Airtable record object with a previously assigned `id` property (see `table.getRecordsByField()` or `table.getRecordByID()`).

- Retrieve an existing record.
- Alter desired fields.
- Update the record.
- Add a callback function on success.
```
const record = table.getRecordsByField("Name", "test record to update")[0]
record.fields['Notes'] = 'updated record 4'
table.update(record, _ => {
    console.log(table.records())
})
```

### Delete a record
Requires an existing Airtable record object with a previously assigned `id` property (see `table.getRecordsByField()` or `table.getRecordByID()`).

- Retrieve an existing record.
- Delete the record.
- Add a callback function on success.
```
const record = table.getRecordsByField("Name", "new test record")[0]
table.delete(record, _ => console.log(table.records()))
```
    
### Complete API
```
new Airpuck.Table()                 // An instanced object representing a specific table in an Airtable base. Requires the table name, base ID, and API key to be passed in an `AirpuckTableOptions` object.

new table.record()                  // An empty, formatted Airtable record containing known fields in an object assigned to the `fields` property.


.pull(_ => {})                      // Pulls the current data from Airtable and updates the local store found in `table.records()`. Optional callback function on success.

.add(record, _ => {})               // Add a new record to the table (must be a valid Airtable object). Also updates the local store on success. Optional callback function on success.

.update(record, _ => {})            // Update an existing record (must have a valid `id` property). Also updates the local store upon success. Optional callback function on success.

.delete(record, _ => {})            // Delete an existing record (must have a valid `id` property). Also updates the local store upon success. Optional callback function on success.


.ready(_ => {})                     // Loops until the table initialization sequence is complete or fails if `loop.max` is reached first. Optional callback function on success.

.attachment(url, filename)          // Format an attachment object that can be passed to attachment fields. Airtable attachment fields require an array of attachment objects. The `filename` parameter is optional.

.getRecordsByField(field, value)    // Returns an array of Airtable records that match the field:value pair.

.getRecordByID(id)                  // Returns an Airtable record whose `id` value matches the passed value.


.records()                          // Read-only. Returns an array of table records in the local store. Automatically updated when remote access functions are successful.

.fields()                           // Read-only. Returns an array of known table fields. Automatically populated on table initialization, but can only identify non-empty fields for the last record with the most non-empty fields. (As long as at least one record has a value for all fields, this will return all available fields. This is due to Airtable not reporting empty fields at all.)

.endpoint()                         // Read-only. Returns the Airtable REST endpoint generated on table initialization.

.options()                          // Read-only. Returns an object containing the options originally passed to the `new Airpuck.table()` constructor.
```