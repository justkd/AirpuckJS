/*
 *  Version 1.0
 *  2-22-18
 *  Copyright 2018 notnatural, LLC.
 *  MIT License
 */


// go to airtable api  - https://airtable.com/api
// select the base you want to work with
// check show api key
// check the authentication section, and see something like:
//
// $ curl https://api.airtable.com/v0/appqSOBn5cZxEXIqj/Table%201?api_key=keyRvIqZM7P071sA4
// 
// in the example url above:
// Base ID = appqSOBn5cZxEXIqj
// Table Name = Table%201
// Api Key = keyRvIqZM7P071sA4

var Airpuck = {
    /* * * * * * * * * * * */
    Table: class Table {
        constructor(options, callback) {
            this.name = "";
            this.baseID = "";
            this.apiKey = "";

            this.fields = [];
            this.records = [];
            this.endpoint = "";
            this.currentRecord = "";

            if (options) {
                if (options.constructor === String) {
                    this.name = options;
                } else if (options.constructor === Object) {
                    if (options.name) {
                        this.name = options.name;
                    }
                    if (options.baseID) {
                        this.baseID = options.baseID;
                    }
                    if (options.apiKey) {
                        this.apiKey = options.apiKey;
                    }
                    if (!options.skipInit) {
                        //console.log("Loading new table...");
                        Airpuck.initTable(this, function () {
                            //console.log("New table initialized!");
                            Airpuck.then(callback);
                        });
                    } else {
                        //console.log("Auto table initialization skipped.");
                        if (callback) {
                            //console.log("Initialization callback ignored.");
                        }
                    }
                }
            }
        }
        init(callback) {
            Airpuck.initTable(this, function () {
                //console.log("New table initialized!");
                Airpuck.then(callback);
            });
        }
        makeRecord(callback) {
            let record = Airpuck.makeRecord(this);
            Airpuck.then(callback);
            return record;
        }
        read(callback) {
            Airpuck.read(this, callback);
        }
        add(record, callback) {
            Airpuck.add(this, record, callback);
        }
        update(record, data, callback) {
            Airpuck.update(this, record, data, callback);
        }
        replace(record, data, callback) {
            Airpuck.replace(this, record, data, callback);
        }
        remove(record, callback) {
            Airpuck.remove(this, record, callback);
        }
        updateLocalRecord(record, callback) {
            if (this.currentRecord) {
                this.currentRecord = "";
            }
            Airpuck.updateLocalRecord(this, record, callback);
        }
        getLocalRecordByIndex(index) {
            let record = Airpuck.getLocalRecord.byIndex(this, index);
            return record;
        }
        getLocalRecordByField(field, value) {
            let record = Airpuck.getLocalRecord.byField(this, field, value);
            return record;
        }
        getRemoteRecordByRecord(record, callback) {
            if (this.currentRecord) {
                this.currentRecord = "";
            }
            Airpuck.getRemoteRecord.byRecord(this, record, callback);
        }
        getRemoteRecordByIndex(index, callback) {
            if (this.currentRecord) {
                this.currentRecord = "";
            }
            Airpuck.getRemoteRecord.byIndex(this, index, callback);
        }
        getRemoteRecordByField(field, value, callback) {
            if (this.currentRecord) {
                this.currentRecord = "";
            }
            Airpuck.getRemoteRecord.byField(this, field, value, callback);
        }
        sortedByDate() {
            let sorted = [];
            this.records.forEach(function (record) {
                sorted.push(record);
            });
            sorted.sort(function (a, b) {
                return new Date(b.createdTime) - new Date(a.createdTime);
            });
            return sorted;
        }
        sortedByField(field) {
            let sorted = [];
            this.records.forEach(function (record) {
                sorted.push(record);
            });
            sorted.sort(function (a, b) {
                var first = a.fields[field];
                var second = b.fields[field];
                first = first.toString();
                first = first.toLowerCase();
                second = second.toString();
                second = second.toLowerCase();
                if (first < second) {
                    return -1;
                }
                if (first > second) {
                    return 1;
                }
                return 0;
            })
            return sorted;
        }
        createAttachment(url, filename) {
            let attachment = Airpuck.createAttachment(url, filename);
            return attachment;
        }
    },
    // end Table class def
    /* * * * * * * * * * * */
    then: function (callback) {
        if (callback) {
            callback();
        }
    },
    /* * * * * * * * * * * */
    initTable: function (table, callback) {
        table.endpoint = Airpuck.getEndpoint(table);
        Airpuck.read(table, function () {
            table.records = table.sortedByDate();
            Airpuck.getFields(table, function () {
                Airpuck.then(callback);
            });
        });
    },
    /* * * * * * * * * * * */
    getEndpoint: function (table) {
        let url = "https://api.airtable.com/v0/" + table.baseID + "/" + table.name; //"&sortField=_createdTime&sortDirection=asc";
        return url;
    },
    /* * * * * * * * * * * */
    getFields: function (table, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', table.endpoint + "?maxRecords=1");
        xhr.setRequestHeader("Authorization", "Bearer " + table.apiKey);
        xhr.onload = function () {
            if (xhr.status === 200) {
                let response = JSON.parse(xhr.response).records;
                if (response.length > 0) {
                    let fields = Object.keys(response[0].fields);
                    table.fields = fields;
                }
                Airpuck.then(callback);
            } else {
                console.log("Could not retrieve fields.");
                console.log(xhr.status);
            }
        };
        xhr.send();
        /* 
        * * * * * * * * * *
         Airpuck.getFields(table, callback)
         
            - will only work for non-empty fields for the earliest created record
            - empty fields will not be inlcuded
        * * * * * * * * * *
        */
    },
    /* * * * * * * * * * * */
    formatRecordForPost: function (record) {
        var newRecord = {
            fields: {}
        };
        var keys = Object.keys(record);
        for (var i in keys) {
            var thisKey = keys[i];
            newRecord.fields[thisKey] = record[thisKey];
        }
        return newRecord;
    },
    /* * * * * * * * * * * */
    makeRecord: function (table) {
        var record = {};
        var keys = table.fields;
        for (var i in keys) {
            var thisKey = keys[i];
            record[thisKey] = "";
        }
        return record;
        /* 
        * * * * * * * * * *
         Airpuck.makeRecord(table)
         
            table - new Airpuck.Table()
         
            - returns an object with keys for each field in table.fields
        * * * * * * * * * *
        */
    },
    /* * * * * * * * * * * */
    read: function (table, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', table.endpoint);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader("Authorization", "Bearer " + table.apiKey);
        xhr.onload = function () {
            if (xhr.status === 200) {
                table.records = JSON.parse(xhr.response).records;
                Airpuck.then(callback);
            } else {
                console.log("read() error.");
                console.log(xhr.status);
            }
        };
        xhr.send();
    },
    /* * * * * * * * * * * */
    add: function (table, record, callback) {
        var send = Airpuck.formatRecordForPost(record);
        var xhr = new XMLHttpRequest();
        xhr.open('POST', table.endpoint);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader("Authorization", "Bearer " + table.apiKey);
        xhr.onload = function () {
            if (xhr.status === 200) {
                Airpuck.getRemoteRecord.byRecord(table, JSON.parse(xhr.response), callback);
            } else if (xhr.status !== 200) {
                console.log("add() error.");
                console.log(xhr.status);
            }
        };
        xhr.send(JSON.stringify(send));
    },
    /* * * * * * * * * * * */
    update: function (table, record, data, callback) {
        var send = Airpuck.formatRecordForPost(data);
        var xhr = new XMLHttpRequest();
        xhr.open('PATCH', table.endpoint + "/" + record.id);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader("Authorization", "Bearer " + table.apiKey);
        xhr.onload = function () {
            if (xhr.status === 200) {
                Airpuck.updateLocalRecord(table, JSON.parse(xhr.response), callback);
            } else if (xhr.status !== 200) {
                console.log("update() error.");
                console.log(xhr.status);
            }
        };
        xhr.send(JSON.stringify(send));
    },
    updateLocalRecord: function (table, record, callback) {
        Airpuck.getRemoteRecord.byRecord(table, record, function () {
            table.records.forEach(function (record, index) {
                if (record.id == table.currentRecord.id) {
                    table.records[index] = table.currentRecord;
                }
            });
            Airpuck.then(callback);
        });
    },
    replace: function (table, record, data, callback) {
        var send = Airpuck.formatRecordForPost(data);
        var xhr = new XMLHttpRequest();
        xhr.open('PUT', table.endpoint + "/" + record.id);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader("Authorization", "Bearer " + table.apiKey);
        xhr.onload = function () {
            if (xhr.status === 200) {
                Airpuck.updateLocalRecord(table, record, callback);
            } else if (xhr.status !== 200) {
                console.log("replace() error.");
                console.log(xhr.status);
            }
        };
        xhr.send(JSON.stringify(send));
    },
    remove: function (table, record, callback) {
        var send = Airpuck.formatRecordForPost(record);
        var xhr = new XMLHttpRequest();
        xhr.open('DELETE', table.endpoint + "/" + record.id);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader("Authorization", "Bearer " + table.apiKey);
        xhr.onload = function () {
            if (xhr.status === 200) {
                table.records.forEach(function (record, index) {
                    if (record.id == table.currentRecord.id) {
                        table.records.splice(index, 1);
                    }
                });
                Airpuck.then(callback);
            } else if (xhr.status !== 200) {
                console.log("remove() error.");
                console.log(xhr.status);
            }
        };
        xhr.send(JSON.stringify(send));
    },
    /* * * * * * * * * * * */
    getLocalRecord: {
        byIndex: function (table, index) {
            let record = table.records[index];
            return record;
        },
        byField: function (table, field, value) {
            var records = table.records;
            var record;
            for (var i in records) {
                var temp = records[i];
                if (temp.fields[field] == value) {
                    record = temp;
                }
            }
            return record;
        }
        /* 
        * * * * * * * * * *
         Airpuck.getLocalRecord.byField(table, field, value);
         
            - checks a local array of records in table.records
            - only reliable if value for the field is unique,
              otherwise will return when first match is found
        * * * * * * * * * *
        */
    },
    /* * * * * * * * * * * */
    getRemoteRecord: {
        byRecord: function (table, record, callback) {
            var id = record.id;
            Airpuck.readRecordByID(table, id, callback);
        },
        byIndex: function (table, index, callback) {
            var record = Airpuck.getLocalRecord.byIndex(table, index);
            var id = record.id;
            Airpuck.readRecordByID(table, id, callback);
        },
        byField: function (table, field, value, callback) {
            var record = Airpuck.getLocalRecord.byField(table, field, value);
            var id = record.id;
            Airpuck.readRecordByID(table, id, callback);
        }
        /* 
            * * * * * * * * * *
             Airpuck.getRemoteRecord.byField(table, field, value);
             
                - checks the server for an individual record
                - only reliable if value for the field is unique,
                  otherwise will return when first match is found
            * * * * * * * * * *
        */
    },
    readRecordByID: function (table, id, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', table.endpoint + "/" + id);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader("Authorization", "Bearer " + table.apiKey);
        xhr.onload = function () {
            if (xhr.status === 200) {
                table.currentRecord = JSON.parse(xhr.response);
                Airpuck.then(callback);
            } else {
                console.log("getRemoteRecord error.");
                console.log(xhr.status);
            }
        };
        xhr.send();
    },
    /* * * * * * * * * * * */
    createAttachment: function (url, filename) {
        let record = {
            url: url,
            filename: filename
        }
        return record;
    }
}
