# README

## AirpuckJS
v 1.0
2-22-18
Copyright 2019 justKD
MIT License

AirpuckJS is a vanilla JS helper for [Airtable](https://airtable.com/).

### Add Airpuck to your project
Airpuck can be included via CDN.
https://cdn.notnatural.co/airpuck.min.js

`<script src="https://cdn.notnatural.co/airpuck.min.js"></script>`


### Try it out at:
https://codepen.io/justKD/pen/wmMKJX


### Getting your API Key and Base ID
- Go to the Airtable API  - https://airtable.com/api
- Log in if prompted
- Select the base you want to work with
- Check the "Show API Key" box in the top right
- Check the authentication section, and see something like: 
`$ curl https://api.airtable.com/v0/appqSRFn3dZxAXIty/Table%201?api_key=keyRvIqKN8I362sB3`
- In the example url above: 
    Base ID = appqSRFn3dZxAXIty
    Table Name = Table%201
    Api Key = keyRvIqKN8I362sB3

### Create an object for an Airtable base
`new Airpuck.Table(options, callback)`
*Airpuck requires you to provide a base ID, API key, and the table name.*

The table name is exactly as it appears in your base, with the exception that spaces need to be [escaped](https://www.w3schools.com/tags/ref_urlencode.asp) so it can be used in a URL.
```
var table = new Airpuck.Table({
    name: "Table%201", // Escaped name for a table named 'Table 1'
    baseID: “your base id“,
    apiKey: “your api key“
}, function () {
    /* This is the callback after successful initialization */
    console.log(table);
});
```
A callback function can also be provided.  It will only be called after a successful response from the server.

The callback function is a good place to run any code that actually uses the table... but there are other ways to initialize and use the table if your app doesn't need to wait for a response (examples found later in this document).

*AirpuckJS will work best if the first entry in your table has an entry for every field.*

*This is because the Airtable API returns lists of records,*
*not complete information about your table.*

*Otherwise you will need to know and set the exact names for your fields*
*accounting for capitalization and punctuation.*

*For example:*
```
table.fields = ["Name","Notes","Attachments"];
```
*If the earliest created entry has no empty fields, then initializing an Airpuck object will automatically identify the fields and assign the `fields` property.*

**Currently, you are responsible for knowing what kind of data is appropriate for each field.**

### Update All Records
`new Airtable.Table.read(callback)`
*Query the server and update the local records.*

When a new Airpuck object is initialized, it will automatically retrieve the records in your table, but when you need to update your local data, just use:
```
table.read(function () {
    console.log(table.records);
});
```

### Retrieve a Single Record Locally
`new Airtable.Table.getLocalRecordByIndex(index)`
`new Airtable.Table.getLocalRecordByField(fieldTitle, fieldContents)`
*Access your data by referencing the local database.*

You can access by index:
```
let localRecordByIndex = table.getLocalRecordByIndex(0);
console.log(localRecordByIndex);
```

Or by field:
```
let localRecordByField = table.getLocalRecordByField("Name", "example record");
console.log(localRecordByField);
```

### Retrieve a Single Record Remotely
`new Airtable.Table.getRemoteRecordByIndex(index, callback)`
`new Airtable.Table.getRemoteRecordByField(fieldTitle, fieldContents, callback)`
`new Airtable.Table.getRemoteRecordByRecord(record, callback)`
*Get the record from the Airtable servers.*

When a successful response is received, the record can be accessed via the `currentRecord` property.
```
let remoteRecordByIndex,
    remoteRecordByField;	

table.getRemoteRecordByIndex(0, function () {
    remoteRecordByIndex = table.currentRecord;
    console.log(remoteRecordByIndex);
});

table.getRemoteRecordByField("Name", "example record", function () {
    remoteRecordByField = table.currentRecord;
    console.log(remoteRecordByField);
});
```
You can also access a remote record by identifying a local record first.
```
let record = table.getLocalRecordByIndex(table.records.length - 1);

table.getRemoteRecordByRecord(record, function () {
    console.log(table.currentRecord);
});
```
These methods do not update the local record. You will need to call `updateLocalRecord()` when you're ready.
```
table.getRemoteRecordByIndex(0, function () {
    let record = table.currentRecord;
    table.updateLocalRecord(record, function () { 
        console.log(record); 
    });
});
```
### Sort the Records
`new Airtable.Table.sortedByDate()`
`new Airtable.Table.sortedByField(fieldTitle)`
*Return a sorted array of records.*

The local records at `table.records` will remain unchanged (unless you explicitly assign the sorted array to that property).
```
let sortByDate = table.sortedByDate();
let sortByField = table.sortedByField("Name");

console.log(sortByDate);
console.log(sortByField);
```
### Add a Record
`new Airtable.Table.add(record)`
*Create a record and add it to the remote and local tables.*

This will send the record information to the server, 
request a completed record with all of the server generated information,
and update the local array of records with the new record.

Create an empty record:
```
let record = table.makeRecord();
```
Set the properties for the relevant fields:
*Each field property matches the name exactly as it appears in your table, including capitalization.*
*Untested: fields named with punctuation, so maybe don't do that*
```
record.Name = "test name";
record.Notes = "test notes";
```
And add the record to the table:
```
table.add(record);
```
Remember that all this requires the Airpuck object already be initialized since an Airpuck object requests information from the Airtable servers.

A complete example might look something like:
```
var table = new Airpuck.Table({
        name: "Table%201",
        baseID: “your base id“,
        apiKey: “your api key“
    }, function () {
        let record = table.makeRecord();
        record.Name = "test name";
        record.Notes = "test notes";

		table.add(record);
	});
```
### Add a Record with Attachments
*Airtable requires an array of attachment objects for the attachment field.*

Airtable will download the attachment at the given URL, and keep it's own copy.
The attachment name is optional.
```
let url1 = "https://images.freeimages.com/images/large-previews/48d/marguerite-1372118.jpg";
let name1 = "example_attachment_upload_1.jpg";
let url2 = "https://images.freeimages.com/images/large-previews/901/butterfly-dress-1520606.jpg";
let name2 = "example_attachment_upload_2.jpg";

let record = table.makeRecord();
record.Name = "test";
record.Notes = "notes";
record.Attachments = [table.createAttachment(url1, name1),
                      table.createAttachment(url2, name2)];

table.add(record);
```
### Update a Record
`new Airtable.Table.update(record, data, callback)`
*Retrieve a record locally, and pass it to the update function along with the new data.*
*This will update a record on the server as well as in the local database.*

Create an object containing properly named fields and the corresponding data, and pass it to the function along with the record (retrieved locally).

Fields that are represented will be changed, fields that are missing will be ignored and the current data will remain unchanged.
```
let record = table.getLocalRecordByIndex(1);
let data = {
    Name: "new name"
};

table.update(record, data, function () {
    // callback after successful response from the server    
});
```
### Replace a Record
`new Airtable.Table.replace(record, data, callback)`
*Completely replace an existing record in the remote and local tables.*

If a field is missing, it will be replaced with an empty field.
```
let record = table.getLocalRecordByIndex(1);
let data = {
    Name: "replaced record"
};
table.replace(record, data, function () {
    // callback after successful response from the server      
});
```
### Delete a Record
`new Airtable.Table.remove(record, callback)`
*Delete a record from the remote and local tables.*

Identify a record locally and delete it.
```
let record = table.getLocalRecordByIndex(1);

table.remove(record, function () {
    // callback after successful response from the server      
});
```
### Other Initialization Scenarios
Declare the options and callback separate from initializing the Airpuck object.
```
let options = {
    name: "Table%201",
    baseID: “your base id“,
    apiKey: “your api key“
};
let then = function () {
    // callback after initialization complete
    console.log(table.fields);
    console.log(table.records);
};
var table = new Airpuck.Table(options, then());
```
Skip automatic initialization.
And initialize later.
```
let options = {
    name: "Table%201",
    baseID: “your base id“,
    apiKey: “your api key“,
    skipInit: true
};
var table = new Airpuck.Table(options);

table.init(function() {
    console.log(table.fields);
    console.log(table.records);
});
```
Create a table without options - just pass in the table name.
This automatically skips initialization, and lets you set properties individually before initializing.
```
var table = new Airpuck.Table("Table%201");
table.baseID = “your base id“;
table.apiKey = “your api key“;
table.init(function () {
    console.log(table);
});
```
    
    
    
    
    
    
    
    


